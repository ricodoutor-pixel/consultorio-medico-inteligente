module.exports = {
  apps: [
    {
      name: 'brisa-live-responder',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_evolution_brisa_live_responder.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'doctor-kyc-listener',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_doctor_kyc_listener_daemon.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'patient-traffic-booster',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_patient_traffic_booster.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'growth-engine',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/crm/04_autonomous-growth-engine.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'lead-harvesters-master',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/start_all_lead_harvesters.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 15000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'meta-social-engine',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_meta_organic_growth.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3030
      }
    },
    {
      name: 'apify-lead-sync',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/apify_lead_harvester.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: false, // PAUSADO: Aguardando renovação da chave Apify API (evita loop de erros)
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 30000,
      node_args: '--dns-result-order=ipv4first',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'anvisa-rdc660-rpa',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/worker_anvisa_rdc660_rpa.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 15000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'sysadmin-watchdog',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/sysadmin_watchdog_supervisor.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }    },
    {
      name: 'meta-organic-growth',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_meta_organic_growth.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3030
      }
    },
    {
      name: 'brevo-multi-pipeline',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_brevo_multi_pipeline.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: false, // PAUSADO: Brevo responde 554 Outbound sending disabled (desligado para proteger reputação)
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 10000,
      node_args: '--dns-result-order=ipv4first',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'hostinger-email-dispatcher',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_hostinger_email_dispatcher.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 15000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'partner-meeting-scheduler',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_partner_meeting_scheduler.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'organic-analytics-reporter',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_organic_analytics_reporter.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }    },
    {
      name: 'cannabis-young-doctors-hunter',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_cannabis_and_young_doctors_hunter.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }
    },

    {
      name: 'email-bounce-guardian',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_email_bounce_and_reply_guardian.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 10000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};