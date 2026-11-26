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
      name: 'instagram-direct-inviter',
      node_args: '--dns-result-order=ipv4first',
      script: 'scripts/agent_instagram_direct_inviter.mjs',
      args: '--daemon',
      cwd: '/opt/plantayraiz',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '900M',
      restart_delay: 30000,
      kill_timeout: 15000,
      env: {
        NODE_ENV: 'production',
        IG_HEADLESS: 'true',
        IG_DAEMON: 'true'
        // Modo daemon inicia em dry-run por segurança até definir IG_DRY_RUN=false no /opt/plantayraiz/.env
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
// Desligados em 2026-11-25 por decisão do Dr. Edilson: convite frio a médicos, captação de leads
// e robôs quebrados (arquivo inexistente ou bloqueio). Não voltam com `pm2 start ecosystem.config.cjs`
// nem pelo sysadmin-watchdog. Para religar algum, é preciso decisão explícita do dono.
const DESLIGADOS = [
  'patient-traffic-booster',      // arquivo não existe
  'growth-engine',                // motor de captação até 500 médicos (convite frio)
  'lead-harvesters-master',       // arquivo não existe (captação de leads)
  'instagram-direct-inviter',     // convite frio por Direct do Instagram
  'apify-lead-sync',              // captação de leads (chave Apify vencida)
  'anvisa-rdc660-rpa',            // arquivo não existe
  'brevo-multi-pipeline',         // Brevo bloqueado (554)
  'hostinger-email-dispatcher',   // e-mail frio a médicos
  'cannabis-young-doctors-hunter', // e-mail frio a médicos
  'cadence-10min-inviter',        // WhatsApp frio em loop de 10 min (nunca religar)
  'brevo-whatsapp-inviter',       // WhatsApp frio via Brevo (nunca religar)
  'whatsapp-bot',                 // WhatsApp frio em loop de 10 min legado (nunca religar)
  'wpp-crm',                      // CRM WhatsApp frio legado (nunca religar)
  'priority-15min-inviter',       // WhatsApp frio "Parabéns, Dr(a)" a cada 15 min (parado na VPS em 26/11; nunca religar)
  'meta-social-engine',           // desligado a pedido do dono em 26/11 (o webhook oficial é a função meta-social-webhook)
];
module.exports.apps = module.exports.apps.filter((app) => !DESLIGADOS.includes(app.name));
module.exports.DESLIGADOS = DESLIGADOS;
