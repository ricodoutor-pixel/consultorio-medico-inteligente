module.exports = {
  apps: [
    {
      name: 'planta-y-raiz-backend',
      script: './server/index.ts',
      interpreter: 'ts-node',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true
    }
  ]
};
