module.exports = {
  apps: [
    {
      name: 'brevo-whatsapp-inviter',
      script: 'scripts/agent_brevo_doctor_whatsapp_inviter.mjs',
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
      name: 'brisa-live-responder',
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
      script: 'scripts/agent_meta_social_engine.mjs',
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
      script: 'scripts/apify_lead_harvester.mjs',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 30000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'anvisa-rdc660-rpa',
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
      }
    }
  ]
};
