-- Fix pg_net OOM: limpar response queue acumulada e reiniciar worker
DELETE FROM net._http_response WHERE created < now() - interval '1 day';
SELECT net.worker_restart();