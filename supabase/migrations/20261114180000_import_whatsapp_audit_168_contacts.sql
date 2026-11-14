-- ============================================================================
-- Migração: Importação e Classificação dos 168 Contatos da Auditoria WhatsApp
-- Data: 14/11/2026 · Planta y Raiz (Lovable Cloud Oficial: shmbwdjuddvquszwkvuq)
-- ============================================================================
-- 1. Bloqueia permanentemente os 5 números em laço de robô (Seção 4.3 da Auditoria)
-- 2. Importa os 168 contatos com telefone real em public.whatsapp_contacts,
--    separando médicos, consultórios/secretárias eletrônicas e pacientes reais
-- 3. Vincula o telefone em public.profiles para médicos já cadastrados na vitrine
--    que ainda estavam com profiles.phone vazio
-- ============================================================================

-- 1. Bloqueio permanente dos 5 números em laço (Vital Apex, 53206709227635, Consultório Dr Victor, Dr Darwin, 185405248905250)
INSERT INTO public.whatsapp_optouts (jid_normalizado, motivo, texto_solicitacao)
VALUES
  ('5511979977802@s.whatsapp.net', 'bloqueio_laco_robo_auditoria', 'Vital Apex Health Center - secretária eletrônica em laço (243 msgs)'),
  ('53206709227635@lid',           'bloqueio_laco_robo_auditoria', 'Robô em laço identificado na auditoria (509 msgs)'),
  ('551153045378@s.whatsapp.net',  'bloqueio_laco_robo_auditoria', 'Consultório Dr Victor Fonseca - resposta automática (95 msgs)'),
  ('558381838356@s.whatsapp.net',  'bloqueio_laco_robo_auditoria', 'Dr Darwin Ribeiro Agendamento - resposta automática (94 msgs)'),
  ('185405248905250@lid',          'bloqueio_laco_robo_auditoria', 'Robô em laço identificado na auditoria (210 msgs)')
ON CONFLICT (jid_normalizado) DO NOTHING;

-- 2. Importação estruturada dos 168 contatos da auditoria em public.whatsapp_contacts
WITH raw_audit(categoria, telefone, nome_whatsapp) AS (
  VALUES
    ('1-medico', '551153045378', 'Consultorio Dr Victor'),
    ('1-medico', '5511932340835', 'Cas'),
    ('1-medico', '5511979608870', 'Medicina Endocana'),
    ('1-medico', '5511986400570', 'Danilo Vecchi'),
    ('1-medico', '5511987883562', 'Dra Andressa Band'),
    ('1-medico', '5511999903567', 'Dra Grace Lopes'),
    ('1-medico', '5514996038329', 'Cilmara Ferrazoli'),
    ('1-medico', '5517997626703', 'Dra Roseli'),
    ('1-medico', '5518997871995', 'Victor Fonseca'),
    ('1-medico', '5519994081593', 'Dr Joaquim'),
    ('1-medico', '5519999059665', 'Dr Dimas Urban'),
    ('1-medico', '5521981644041', 'Ana Paula Octavia'),
    ('1-medico', '5521993691808', 'Katia Rejane'),
    ('1-medico', '5524999190605', 'Ana'),
    ('1-medico', '553187841384', 'Carolina Leonel'),
    ('1-medico', '553284599585', 'Geovana'),
    ('1-medico', '553285128313', 'Ana Gabriella'),
    ('1-medico', '553288840700', 'Adriana Bisaggio'),
    ('1-medico', '554199361130', 'Alanna Ajzental'),
    ('1-medico', '554396123456', 'Gabriel Kuhnlein'),
    ('1-medico', '555192488106', 'Franceane Castanh'),
    ('1-medico', '557381559366', 'Joelma'),
    ('1-medico', '558399139191', 'Dr Alexandre Ribeiro'),
    ('1-medico', '558494183793', 'Edna Marlisia Bez'),
    ('2-orientacao', '5511979977802', 'Vital Apex Health'),
    ('2-orientacao', '5512997561982', 'LSR Neuropsicologia'),
    ('2-orientacao', '5521998460548', 'Fiable'),
    ('2-orientacao', '552231999594', 'Instituto Nave Me'),
    ('2-orientacao', '553197471271', 'Patricia Ayer'),
    ('2-orientacao', '553491987389', 'Dr Gustavo Freitas'),
    ('2-orientacao', '554184825352', 'Petterson Vieira'),
    ('2-orientacao', '554192620769', 'Enzo Raldi'),
    ('2-orientacao', '556798530135', 'Luana Domingos'),
    ('2-orientacao', '556799548255', 'Marianna Coimbra'),
    ('3-consulta', '551125941590', 'Consultorio'),
    ('3-consulta', '5511915191458', ''),
    ('3-consulta', '5511941132562', 'Dra Andrezza Garf'),
    ('3-consulta', '5511948700008', 'Equipe Dr Gabriel'),
    ('3-consulta', '5511963044847', 'Dra Lais L Kahtal'),
    ('3-consulta', '5511972308525', 'JR Pereiras consu'),
    ('3-consulta', '5511972390040', 'Dr Gabriel Yuji'),
    ('3-consulta', '5511974502709', 'Renato Lima'),
    ('3-consulta', '5511974890519', 'Consult Odontologia'),
    ('3-consulta', '5511985088900', 'Consultorio Mila S'),
    ('3-consulta', '5511991091015', 'Dra Tatiane Vacar'),
    ('3-consulta', '5511994725269', 'Clinica Dra Katia'),
    ('3-consulta', '5511994773472', 'Dr Geilson Santa'),
    ('3-consulta', '5512997004050', 'Dra Bruna Stolf'),
    ('3-consulta', '5513996680420', 'Dra Cruzado'),
    ('3-consulta', '5515981133333', 'Instituto Sintrop'),
    ('3-consulta', '5515991748092', ''),
    ('3-consulta', '5518981291116', 'Ana Paula Alias'),
    ('3-consulta', '5519981955352', 'Dra Ana Lucia Kana'),
    ('3-consulta', '5519983458397', 'clinica'),
    ('3-consulta', '5519999880390', 'Frederico Medeiros'),
    ('3-consulta', '5521920188701', 'Consultorio Sao Miguel'),
    ('3-consulta', '5521967204490', 'Dra Erica Cruzeiro'),
    ('3-consulta', '5521970866055', 'Gustavo Treistman'),
    ('3-consulta', '5521971106072', 'Consultorio Dra G'),
    ('3-consulta', '5521978848121', 'Priscila Faro Nat'),
    ('3-consulta', '5521980402582', 'Caio Lannes'),
    ('3-consulta', '5521980672098', 'C Paiva'),
    ('3-consulta', '5521981623315', 'Dr Chrismael Ramos'),
    ('3-consulta', '5521982125591', 'Dra Anna Strunck'),
    ('3-consulta', '5521983151176', 'Consultorio Dentario'),
    ('3-consulta', '5521988168684', 'Janaina Polo'),
    ('3-consulta', '5521988184289', 'Psicologa Vania Santos'),
    ('3-consulta', '5521989882359', 'Oralface Agendamento'),
    ('3-consulta', '5521997715771', 'Germano Dutra'),
    ('3-consulta', '5521997755046', 'Dr Sergio Furrer'),
    ('3-consulta', '5521999194873', 'Espaco Rio Saude'),
    ('3-consulta', '5521999403733', 'Mariana Campos'),
    ('3-consulta', '5521999687980', 'Ino Viana'),
    ('3-consulta', '5521999856618', 'Consultorio Medico'),
    ('3-consulta', '5521999946993', 'Flavio Rozenbaum'),
    ('3-consulta', '5522981156992', 'Dra Fernanda Tardelli'),
    ('3-consulta', '5524981008772', 'B&K Odontologia'),
    ('3-consulta', '5524981248979', 'Dra Gisele Castor'),
    ('3-consulta', '5524999996407', 'Central de Vacinas'),
    ('3-consulta', '553171070719', 'Consultorio Camila'),
    ('3-consulta', '553199179951', 'Adriana Ramos Peixoto'),
    ('3-consulta', '553199717798', 'Claudio Cesar Dilascio'),
    ('3-consulta', '553484230802', 'Dra Leuma Leao'),
    ('3-consulta', '553599458888', 'iMedicos'),
    ('3-consulta', '554140420610', 'Global'),
    ('3-consulta', '554188645869', 'Consult Dra Gu Grodzki'),
    ('3-consulta', '554188942707', 'Recepcao Clinica Paciornik'),
    ('3-consulta', '554191004844', 'Mente & Corpo Integrativa'),
    ('3-consulta', '554195955737', 'Wanderley Francisco'),
    ('3-consulta', '554299339401', 'Projeto Apascentar'),
    ('3-consulta', '554333292002', 'Urologia Londrina'),
    ('3-consulta', '554388672888', 'Dra Alice Ruhoff'),
    ('3-consulta', '554399529043', 'Dra Carolina Petrus'),
    ('3-consulta', '554491528441', 'Dra Suelen Rodrigues'),
    ('3-consulta', '554788583209', 'Dra Barbara'),
    ('3-consulta', '554792726842', 'Dr Lucas Azambuja'),
    ('3-consulta', '554797002302', 'Dra Veronica Paiva'),
    ('3-consulta', '554891446434', 'Consultorio Dra Luciana'),
    ('3-consulta', '554999910251', 'Rafaella'),
    ('3-consulta', '555584436490', 'Consultorio Dr Guilherme'),
    ('3-consulta', '556194123018', 'Iani Else'),
    ('3-consulta', '556196997799', 'Consulmed'),
    ('3-consulta', '556284565594', 'Dra Darianne Cane'),
    ('3-consulta', '556285120141', 'OncoVie Vet'),
    ('3-consulta', '556296110288', 'Louise Lobo'),
    ('3-consulta', '556299912640', 'Dra Ariane Cavalc'),
    ('3-consulta', '556484095280', 'Consultorio dra Al'),
    ('3-consulta', '556496549339', 'Dra Luzia Ozorio'),
    ('3-consulta', '556692098664', 'Leidiane'),
    ('3-consulta', '557381227739', 'Am Obolari Medica'),
    ('3-consulta', '557599773674', ''),
    ('3-consulta', '557799676111', 'Dr Anderson'),
    ('3-consulta', '557981159696', 'Dra Catharina Gar'),
    ('3-consulta', '557999969888', 'Dr Diego Abuawad'),
    ('3-consulta', '558191988606', 'Dr Bruno Luz Caxi'),
    ('3-consulta', '558198960653', 'Pedro Mello'),
    ('3-consulta', '558199139837', 'Alana Rebeca'),
    ('3-consulta', '558291727273', 'Berkmis Viana'),
    ('3-consulta', '558381838356', 'Dr Darwin Ribeiro'),
    ('3-consulta', '558387557463', 'Meu Cao Raiz MV'),
    ('3-consulta', '558387607000', 'Consultorio Dr Eri'),
    ('3-consulta', '558486229921', 'Consultorio Medico'),
    ('3-consulta', '558491271897', 'Ana'),
    ('3-consulta', '558494794429', 'Consultorio Dra D'),
    ('3-consulta', '558499727982', 'Medicina em Flor'),
    ('3-consulta', '558588083445', 'Psiquiatra Doutor'),
    ('3-consulta', '558597509090', 'Livia Campelo Gue'),
    ('3-consulta', '558781244848', 'Clinica Veterinaria'),
    ('3-consulta', '558881293911', 'Dr Caio Matias'),
    ('3-consulta', '558881437000', 'Dr Idelfonso Mast'),
    ('3-consulta', '558888074789', 'Dr Jefferson Barr'),
    ('3-consulta', '559888083447', 'Clinica Dr Andre L'),
    ('4-cadastro', '5511986063317', 'Terracannabis Med'),
    ('4-cadastro', '5511986318000', 'Renoveja'),
    ('4-cadastro', '5511987002800', 'Arnaldo Borowik'),
    ('4-cadastro', '5511989207123', 'Caio Bonf'),
    ('4-cadastro', '5521991787930', 'Stella'),
    ('4-cadastro', '554188766159', 'D Dama'),
    ('4-cadastro', '555591569089', 'Deborah Savian'),
    ('4-cadastro', '556293110996', 'Frederico Menezes'),
    ('4-cadastro', '557388035440', 'Jose'),
    ('4-cadastro', '557591462018', 'Dra G'),
    ('4-cadastro', '558588882222', 'Facial Prime'),
    ('5-interesse', '5511941001993', 'Dra Ana Julia'),
    ('5-interesse', '5511941451251', 'Agnor'),
    ('5-interesse', '5511942632107', 'Cards'),
    ('5-interesse', '5511950464135', 'Dra Carolina Rest'),
    ('5-interesse', '5511977887618', 'Sonia Regina'),
    ('5-interesse', '5511982529868', 'Espaco Terapeutico'),
    ('5-interesse', '5512991493539', 'Gabriela'),
    ('5-interesse', '5517997553117', 'Clinica Specialit'),
    ('5-interesse', '5519953210222', 'Beatriz'),
    ('5-interesse', '5521966990701', 'Dr Carlos Alberto'),
    ('5-interesse', '5521995067663', 'Claudia'),
    ('5-interesse', '5521996847864', 'Bruna Vargas'),
    ('5-interesse', '5522997303834', 'Joao'),
    ('5-interesse', '5527995322070', 'Dr Andre Teixeira'),
    ('5-interesse', '554591589813', 'Psi Eber Hypolit'),
    ('5-interesse', '554699816259', 'backupvacjup'),
    ('5-interesse', '554888283588', 'Duda'),
    ('5-interesse', '554888707557', 'Amir Ali'),
    ('5-interesse', '554899359375', 'Dr Nani Oliveira'),
    ('5-interesse', '555491395381', 'Julio Cesar Sacomori'),
    ('5-interesse', '556181279289', 'Dr Edson De Figu'),
    ('5-interesse', '556181635831', 'Giselle Vilas Boas'),
    ('5-interesse', '556283144212', ''),
    ('5-interesse', '556392376723', 'Gabriel'),
    ('5-interesse', '558881451546', 'Clinica Vaccimax')
),
classified AS (
  SELECT
    telefone || '@s.whatsapp.net' AS jid_normalizado,
    jsonb_build_array(telefone, telefone || '@s.whatsapp.net', telefone || '@c.us') AS jids_alternativos,
    NULLIF(TRIM(nome_whatsapp), '') AS nome_limpo,
    CASE
      WHEN nome_whatsapp ~* '\m(consultorio|consult|clinica|recepcao|agendamento|equipe|instituto|espaco|central|odontologia|dentario|vacinas|urologia|veterinaria|vital apex|global|cards|backupvacjup|consulmed|imedicos|renoveja|terracannabis|facial prime|oncovie|neuropsicologia|fiable|mente & corpo|projeto apascentar)\M'
        THEN 'empresa'
      WHEN categoria = '1-medico'
        OR nome_whatsapp ~* '\m(dr|dra|doutor|doutora|medica|medico|psiquiatra|psi|mv)\M'
        OR telefone IN ('5519999880390', '558499727982', '5521991787930', '554888707557', '555491395381')
        THEN 'medico'
      ELSE 'paciente'
    END AS tipo,
    categoria,
    telefone,
    nome_whatsapp
  FROM raw_audit
)
INSERT INTO public.whatsapp_contacts (
  jid_normalizado,
  jids_alternativos,
  nome_limpo,
  tipo,
  origem_do_contato,
  metadata,
  atualizado_em
)
SELECT
  jid_normalizado,
  jids_alternativos,
  nome_limpo,
  tipo,
  'auditoria_whatsapp_2026_11_14',
  jsonb_build_object(
    'phone', telefone,
    'categoria_auditoria', categoria,
    'nome_no_whatsapp', nome_whatsapp,
    'importado_em', now()
  ),
  now()
FROM classified
ON CONFLICT (jid_normalizado) DO UPDATE
SET
  nome_limpo = COALESCE(public.whatsapp_contacts.nome_limpo, EXCLUDED.nome_limpo),
  tipo = CASE
    WHEN public.whatsapp_contacts.tipo = 'desconhecido' THEN EXCLUDED.tipo
    ELSE public.whatsapp_contacts.tipo
  END,
  metadata = public.whatsapp_contacts.metadata || EXCLUDED.metadata,
  atualizado_em = now();

-- 3. Silencia preventivamente em whatsapp_conversation_state os números classificados como 'empresa' (secretárias/consultórios)
INSERT INTO public.whatsapp_conversation_state (
  jid_normalizado,
  ai_paused,
  motivo,
  pausado_em,
  pausado_por,
  atualizado_em
)
SELECT
  jid_normalizado,
  true,
  'secretaria_eletronica_ou_clinica_auditoria',
  now(),
  'auditoria_2026_11_14',
  now()
FROM public.whatsapp_contacts
WHERE tipo = 'empresa'
  AND origem_do_contato = 'auditoria_whatsapp_2026_11_14'
ON CONFLICT (jid_normalizado) DO NOTHING;

-- 4. Vincula whatsapp_contacts.doctor_user_id para médicos que já possuem telefone ou nome correspondente em public.profiles
UPDATE public.whatsapp_contacts wc
SET doctor_user_id = p.id
FROM public.profiles p
JOIN public.doctors d ON d.user_id = p.id
WHERE wc.doctor_user_id IS NULL
  AND p.phone IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(p.phone, '\D', '', 'g')) >= 8
  AND RIGHT(REGEXP_REPLACE(wc.jid_normalizado, '\D', '', 'g'), 8) = RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 8);
