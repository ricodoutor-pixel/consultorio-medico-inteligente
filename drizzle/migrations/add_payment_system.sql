-- ============================================================================
-- MIGRATION: Add Dynamic Payment System Tables
-- Planta & Raiz 3.0 — Sistema de Pagamentos Dinâmico
-- ============================================================================

-- Tabela de preços de consultas por médico
CREATE TABLE IF NOT EXISTS doctor_pricing (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  doctor_id VARCHAR(36) NOT NULL,
  min_price DECIMAL(10, 2) DEFAULT 49.00,
  max_price DECIMAL(10, 2) DEFAULT 130.00,
  base_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_doctor_pricing (doctor_id),
  KEY idx_doctor_id (doctor_id),
  KEY idx_active (active),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  consultation_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  patient_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  doctor_earnings DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  mercado_pago_id VARCHAR(255),
  mercado_pago_status VARCHAR(50),
  authentication_token VARCHAR(255),
  authentication_verified BOOLEAN DEFAULT false,
  authentication_timestamp TIMESTAMP NULL,
  authentication_hash VARCHAR(255),
  payment_method VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_doctor_id (doctor_id),
  KEY idx_patient_id (patient_id),
  KEY idx_consultation_id (consultation_id),
  KEY idx_status (status),
  KEY idx_mercado_pago_id (mercado_pago_id),
  KEY idx_created_at (created_at),
  KEY idx_authentication_verified (authentication_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de audit log para pagamentos
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  old_value JSON,
  new_value JSON,
  user_id VARCHAR(36),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_payment_id (payment_id),
  KEY idx_action (action),
  KEY idx_created_at (created_at),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de comissões (para relatórios)
CREATE TABLE IF NOT EXISTS payment_commissions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  consultation_id VARCHAR(36) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  doctor_earnings DECIMAL(10, 2) NOT NULL,
  platform_percentage DECIMAL(5, 2) DEFAULT 7.00,
  doctor_percentage DECIMAL(5, 2) DEFAULT 93.00,
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_doctor_id (doctor_id),
  KEY idx_payment_id (payment_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de transferências (rastreamento de pagamentos para médicos)
CREATE TABLE IF NOT EXISTS payment_transfers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  doctor_id VARCHAR(36) NOT NULL,
  commission_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transfer_method VARCHAR(50),
  mercado_pago_transfer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_doctor_id (doctor_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  FOREIGN KEY (commission_id) REFERENCES payment_commissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de fraude (detecção automática)
CREATE TABLE IF NOT EXISTS payment_fraud_detection (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id VARCHAR(36),
  fraud_type VARCHAR(100),
  fraud_score DECIMAL(5, 2),
  details JSON,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by VARCHAR(36),
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_payment_id (payment_id),
  KEY idx_fraud_type (fraud_type),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices adicionais para performance
CREATE INDEX idx_payments_doctor_consultation ON payments(doctor_id, consultation_id);
CREATE INDEX idx_payments_status_created ON payments(status, created_at);
CREATE INDEX idx_doctor_pricing_active_created ON doctor_pricing(active, created_at);

-- ============================================================================
-- VIEWS PARA RELATÓRIOS
-- ============================================================================

-- View: Resumo de Pagamentos por Médico
CREATE OR REPLACE VIEW payment_summary_by_doctor AS
SELECT 
  d.id as doctor_id,
  d.name as doctor_name,
  COUNT(p.id) as total_consultations,
  SUM(p.amount) as total_revenue,
  SUM(p.platform_fee) as platform_fees,
  SUM(p.doctor_earnings) as doctor_earnings,
  AVG(p.amount) as average_consultation_price,
  COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_payments,
  COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
  DATE(MAX(p.created_at)) as last_payment_date
FROM users d
LEFT JOIN payments p ON d.id = p.doctor_id
WHERE d.role = 'doctor'
GROUP BY d.id, d.name;

-- View: Resumo de Comissões por Período
CREATE OR REPLACE VIEW commission_summary_by_period AS
SELECT 
  DATE_FORMAT(pc.created_at, '%Y-%m') as period,
  COUNT(pc.id) as total_transactions,
  SUM(pc.total_amount) as total_revenue,
  SUM(pc.platform_fee) as platform_fees,
  SUM(pc.doctor_earnings) as doctor_earnings,
  AVG(pc.total_amount) as average_transaction,
  COUNT(CASE WHEN pc.status = 'paid' THEN 1 END) as paid_commissions
FROM payment_commissions pc
GROUP BY DATE_FORMAT(pc.created_at, '%Y-%m')
ORDER BY period DESC;

-- View: Detecção de Fraude
CREATE OR REPLACE VIEW fraud_detection_summary AS
SELECT 
  pfd.fraud_type,
  COUNT(pfd.id) as total_detections,
  AVG(pfd.fraud_score) as average_score,
  COUNT(CASE WHEN pfd.status = 'pending' THEN 1 END) as pending_review,
  COUNT(CASE WHEN pfd.status = 'confirmed' THEN 1 END) as confirmed_fraud
FROM payment_fraud_detection pfd
GROUP BY pfd.fraud_type;

-- ============================================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================================================

-- Trigger: Log de mudanças em pagamentos
DELIMITER //
CREATE TRIGGER payment_audit_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  INSERT INTO payment_audit_log (payment_id, action, new_value)
  VALUES (NEW.id, 'INSERT', JSON_OBJECT(
    'consultation_id', NEW.consultation_id,
    'doctor_id', NEW.doctor_id,
    'patient_id', NEW.patient_id,
    'amount', NEW.amount,
    'status', NEW.status
  ));
END//

CREATE TRIGGER payment_audit_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO payment_audit_log (payment_id, action, old_value, new_value)
    VALUES (NEW.id, 'UPDATE_STATUS', JSON_OBJECT('status', OLD.status), JSON_OBJECT('status', NEW.status));
  END IF;
END//

DELIMITER ;

-- ============================================================================
-- PERMISSÕES E SEGURANÇA
-- ============================================================================

-- Criar usuário para aplicação (se não existir)
-- GRANT SELECT, INSERT, UPDATE ON planta_raiz.doctor_pricing TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON planta_raiz.payments TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT ON planta_raiz.payment_audit_log TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON planta_raiz.payment_commissions TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON planta_raiz.payment_transfers TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT ON planta_raiz.payment_fraud_detection TO 'app_user'@'localhost';

-- ============================================================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================================================

-- Inserir preços padrão para médicos existentes (exemplo)
-- INSERT INTO doctor_pricing (doctor_id, base_price, min_price, max_price, active)
-- SELECT id, 89.00, 49.00, 130.00, true
-- FROM users
-- WHERE role = 'doctor' AND id NOT IN (SELECT doctor_id FROM doctor_pricing);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
