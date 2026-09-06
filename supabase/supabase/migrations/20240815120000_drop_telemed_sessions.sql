-- Drop da tabela obsoleta telemed_sessions
-- Esta tabela foi descontinuada na auditoria técnica. Toda a infraestrutura de vídeo
-- foi unificada para a tabela "video_rooms".

DROP TABLE IF EXISTS public.telemed_sessions;
