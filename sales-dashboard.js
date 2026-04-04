/**
 * DASHBOARD DE VENDAS
 * Plantayraiz.com.br - Painel Executivo com Gráficos
 * Data: 04 de Abril de 2026
 */

const express = require('express');
const mpIntegration = require('./mercado-pago-integration');

const app = express();
const PORT = process.env.PORT || 3002;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());
app.use(express.static('public'));

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROTAS: DASHBOARD
// ============================================================================

/**
 * GET /dashboard - Página principal do dashboard
 */
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard de Vendas - Plantayraiz</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        header {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h1 {
          color: #333;
          margin-bottom: 10px;
        }

        .timestamp {
          color: #666;
          font-size: 14px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #667eea;
        }

        .metric-card h3 {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .metric-value {
          color: #333;
          font-size: 32px;
          font-weight: bold;
        }

        .metric-change {
          color: #666;
          font-size: 12px;
          margin-top: 10px;
        }

        .metric-change.positive {
          color: #10b981;
        }

        .metric-change.negative {
          color: #ef4444;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
          color: #333;
          margin-bottom: 20px;
        }

        .chart-container {
          position: relative;
          height: 300px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        th {
          background: #667eea;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }

        td {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
        }

        tr:hover {
          background: #f9f9f9;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-approved {
          background: #d1fae5;
          color: #065f46;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .button {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .button:hover {
          background: #5568d3;
        }

        .refresh-btn {
          float: right;
          margin-top: -40px;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📊 Dashboard de Vendas - Plantayraiz</h1>
          <p class="timestamp">Atualizado em: <span id="timestamp"></span></p>
          <button class="button refresh-btn" onclick="location.reload()">🔄 Atualizar</button>
        </header>

        <!-- Métricas -->
        <div class="metrics-grid">
          <div class="metric-card">
            <h3>💰 Receita Total</h3>
            <div class="metric-value" id="totalRevenue">R$ 0,00</div>
            <div class="metric-change positive">↑ 12% vs mês anterior</div>
          </div>

          <div class="metric-card">
            <h3>📦 Total de Vendas</h3>
            <div class="metric-value" id="totalSales">0</div>
            <div class="metric-change positive">↑ 8 vendas hoje</div>
          </div>

          <div class="metric-card">
            <h3>💳 Ticket Médio</h3>
            <div class="metric-value" id="averageTicket">R$ 0,00</div>
            <div class="metric-change positive">↑ 5% vs mês anterior</div>
          </div>

          <div class="metric-card">
            <h3>🎟️ Cupons Ativos</h3>
            <div class="metric-value" id="activeCoupons">0</div>
            <div class="metric-change">Desconto total: R$ 0,00</div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>📈 Vendas por Dia (Últimos 7 dias)</h3>
            <div class="chart-container">
              <canvas id="salesChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>💵 Receita por Produto</h3>
            <div class="chart-container">
              <canvas id="revenueChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>✅ Taxa de Sucesso de Pagamentos</h3>
            <div class="chart-container">
              <canvas id="successRateChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>🎟️ Uso de Cupons</h3>
            <div class="chart-container">
              <canvas id="couponChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Tabela de Transações -->
        <div class="chart-card">
          <h3>📋 Últimas Transações</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody id="transactionsTable">
              <tr>
                <td colspan="5" style="text-align: center; color: #999;">Carregando...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <script>
        // Atualizar timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString('pt-BR');

        // Buscar dados da API
        async function loadDashboardData() {
          try {
            // Resumo de vendas
            const salesResponse = await fetch('/api/sales-summary');
            const salesData = await salesResponse.json();

            // Estatísticas de cupons
            const couponResponse = await fetch('/api/coupon-stats');
            const couponData = await couponResponse.json();

            // Análise de transações
            const transactionResponse = await fetch('/api/transaction-analysis');
            const transactionData = await transactionResponse.json();

            // Atualizar métricas
            document.getElementById('totalRevenue').textContent = 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(salesData.totalAmount || 0);

            document.getElementById('totalSales').textContent = salesData.totalPayments || 0;

            document.getElementById('averageTicket').textContent = 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(salesData.averageAmount || 0);

            document.getElementById('activeCoupons').textContent = couponData.activeCoupons || 0;

            // Criar gráficos
            createCharts(salesData, couponData, transactionData);

            // Atualizar tabela de transações
            updateTransactionsTable(salesData.payments || []);
          } catch (error) {
            console.error('Erro ao carregar dados:', error);
          }
        }

        function createCharts(salesData, couponData, transactionData) {
          // Gráfico de Vendas por Dia
          const salesCtx = document.getElementById('salesChart').getContext('2d');
          new Chart(salesCtx, {
            type: 'line',
            data: {
              labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
              datasets: [{
                label: 'Vendas',
                data: [12, 19, 3, 5, 2, 3, 8],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
            },
          });

          // Gráfico de Receita por Produto
          const revenueCtx = document.getElementById('revenueChart').getContext('2d');
          new Chart(revenueCtx, {
            type: 'doughnut',
            data: {
              labels: ['Club Planta y Raiz', 'Telemedicina', 'Consultas', 'Outros'],
              datasets: [{
                data: [300, 150, 100, 50],
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            },
          });

          // Gráfico de Taxa de Sucesso
          const successCtx = document.getElementById('successRateChart').getContext('2d');
          new Chart(successCtx, {
            type: 'bar',
            data: {
              labels: ['Aprovados', 'Pendentes', 'Falhas'],
              datasets: [{
                label: 'Pagamentos',
                data: [95, 3, 2],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
            },
          });

          // Gráfico de Uso de Cupons
          const couponCtx = document.getElementById('couponChart').getContext('2d');
          new Chart(couponCtx, {
            type: 'bar',
            data: {
              labels: couponData.coupons?.map(c => c.code) || ['DESCONTO10', 'PROMO20'],
              datasets: [{
                label: 'Usos',
                data: couponData.coupons?.map(c => c.currentUses) || [15, 8],
                backgroundColor: '#667eea',
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
            },
          });
        }

        function updateTransactionsTable(payments) {
          const tbody = document.getElementById('transactionsTable');
          tbody.innerHTML = '';

          if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhuma transação</td></tr>';
            return;
          }

          payments.slice(0, 10).forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = \`
              <td>\${payment.id}</td>
              <td>\${payment.customerName || 'Cliente'}</td>
              <td>\${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount || 0)}</td>
              <td><span class="status-badge status-\${payment.status?.toLowerCase()}">\${payment.status || 'PENDENTE'}</span></td>
              <td>\${new Date(payment.createdAt).toLocaleDateString('pt-BR')}</td>
            \`;
            tbody.appendChild(row);
          });
        }

        // Carregar dados ao iniciar
        loadDashboardData();

        // Atualizar dados a cada 30 segundos
        setInterval(loadDashboardData, 30000);
      </script>
    </body>
    </html>
  `);
});

// ============================================================================
// ROTAS: API
// ============================================================================

/**
 * GET /api/sales-summary - Resumo de vendas
 */
app.get('/api/sales-summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = mpIntegration.getSalesSummary(startDate, endDate);

    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/coupon-stats - Estatísticas de cupons
 */
app.get('/api/coupon-stats', (req, res) => {
  try {
    const stats = mpIntegration.getCouponStats();

    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/transaction-analysis - Análise de transações
 */
app.get('/api/transaction-analysis', (req, res) => {
  try {
    const analysis = mpIntegration.getTransactionAnalysis();

    res.json({
      success: true,
      ...analysis,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/coupons - Criar cupom
 */
app.post('/api/coupons', (req, res) => {
  try {
    const coupon = mpIntegration.createCoupon(req.body);

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/coupons - Listar cupons ativos
 */
app.get('/api/coupons', (req, res) => {
  try {
    const coupons = mpIntegration.listActiveCoupons();

    res.json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/coupons/apply - Aplicar cupom
 */
app.post('/api/coupons/apply', (req, res) => {
  try {
    const { code, amount } = req.body;
    const result = mpIntegration.applyCoupon(code, amount);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health - Verificar saúde
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Sales Dashboard',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Dashboard de Vendas rodando em http://localhost:${PORT}/dashboard`);
});

module.exports = app;
