-- Criar tabela diretoria_ia_relatorios
CREATE TABLE IF NOT EXISTS diretoria_ia_relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo_json JSONB NOT NULL,
  status TEXT DEFAULT 'concluido',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_diretoria_departamento ON diretoria_ia_relatorios(departamento);
CREATE INDEX IF NOT EXISTS idx_diretoria_created_at ON diretoria_ia_relatorios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diretoria_status ON diretoria_ia_relatorios(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE diretoria_ia_relatorios ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir leitura para todos (público)
CREATE POLICY "Permitir leitura para todos" ON diretoria_ia_relatorios
  FOR SELECT
  USING (true);

-- Política 2: Permitir inserção para o serviço n8n e admin
CREATE POLICY "Permitir inserção para n8n e admin" ON diretoria_ia_relatorios
  FOR INSERT
  WITH CHECK (true);

-- Política 3: Permitir atualização apenas para admin
CREATE POLICY "Permitir atualização para admin" ON diretoria_ia_relatorios
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política 4: Permitir exclusão apenas para admin
CREATE POLICY "Permitir exclusão para admin" ON diretoria_ia_relatorios
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_diretoria_ia_relatorios_updated_at
BEFORE UPDATE ON diretoria_ia_relatorios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE diretoria_ia_relatorios IS 'Tabela para armazenar relatórios gerados pelos agentes IA departamentais (CFO, R&D, CS)';
COMMENT ON COLUMN diretoria_ia_relatorios.departamento IS 'Departamento responsável pelo relatório (CFO, R&D, CS)';
COMMENT ON COLUMN diretoria_ia_relatorios.titulo IS 'Título do relatório';
COMMENT ON COLUMN diretoria_ia_relatorios.conteudo_json IS 'Conteúdo do relatório em formato JSON';
COMMENT ON COLUMN diretoria_ia_relatorios.status IS 'Status do relatório (concluido, pendente, erro)';
