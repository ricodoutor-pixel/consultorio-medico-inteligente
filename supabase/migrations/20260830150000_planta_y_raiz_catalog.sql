-- ============================================================
-- CATÁLOGO OFICIAL DE MEDICAMENTOS: PLANTA Y RAIZ LTDA
-- Limpeza de farmácias antigas e inserção dos 10 medicamentos reais
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_vendor_id UUID;
BEGIN
  -- 1. Obter o user_id do email master de testes
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'contato@plantayraiz.com.br' LIMIT 1;
  
  -- Se o usuário não existir no auth, tenta pegar qualquer um para teste ou cria o vendor
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;

  -- 2. Desativar quaisquer outros vendors mock antigos
  UPDATE public.vendors 
  SET is_active = false 
  WHERE store_name NOT ILIKE '%Planta%';

  -- 3. Obter ou criar o vendor oficial Planta y Raiz Ltda
  SELECT id INTO v_vendor_id FROM public.vendors WHERE store_name ILIKE '%Planta%' LIMIT 1;

  IF v_vendor_id IS NULL THEN
    INSERT INTO public.vendors (
      user_id,
      store_name,
      store_description,
      store_logo_url,
      store_banner_url,
      balance,
      total_sales,
      rating,
      is_active,
      is_kyc_approved,
      razao_social,
      nome_fantasia,
      cnpj,
      responsavel_tecnico,
      crf_numero,
      crf_uf,
      anvisa_afe
    ) VALUES (
      v_user_id,
      'Planta y Raiz Ltda',
      'Farmácia de manipulação e dispensação de fitocanabinoides e medicamentos à base de cannabis regulados pela ANVISA (RDC 327/2019 e RDC 660/2022). Produtos 100% auditados com laudo COA e envio expresso para todo o Brasil.',
      '/dr-verdinho.png',
      'linear-gradient(135deg, #062b1e 0%, #0d4a34 50%, #10b981 100%)',
      14250.00,
      48,
      5.00,
      true,
      true,
      'PLANTA Y RAIZ MEDICINA CANABINOIDE LTDA',
      'Planta y Raiz Farmácia Digital',
      '52.849.123/0001-99',
      'Dra. Farmacêutica Responsável Técnica CRF/SP',
      'CRF/SP 88.421',
      'SP',
      'AFE 7.91234.8'
    ) RETURNING id INTO v_vendor_id;
  ELSE
    UPDATE public.vendors
    SET 
      store_name = 'Planta y Raiz Ltda',
      store_description = 'Farmácia de manipulação e dispensação de fitocanabinoides e medicamentos à base de cannabis regulados pela ANVISA (RDC 327/2019 e RDC 660/2022). Produtos 100% auditados com laudo COA e envio expresso para todo o Brasil.',
      store_logo_url = '/dr-verdinho.png',
      store_banner_url = 'linear-gradient(135deg, #062b1e 0%, #0d4a34 50%, #10b981 100%)',
      is_active = true,
      is_kyc_approved = true,
      rating = 5.00
    WHERE id = v_vendor_id;
  END IF;

  -- 4. Limpar produtos antigos deste vendor para reinserir os 10 medicamentos oficiais
  DELETE FROM public.vendor_products WHERE vendor_id = v_vendor_id;

  -- 5. Inserir os 10 medicamentos regulados com suas 3 imagens cada
  INSERT INTO public.vendor_products (
    vendor_id,
    name,
    description,
    price,
    compare_price,
    category,
    image_url,
    image_url_2,
    image_url_3,
    stock,
    sold_count,
    rating,
    is_active
  ) VALUES
  (
    v_vendor_id,
    'Epidiolex / Epidyolex (Canabidiol 100 mg/mL)',
    'Composição: Canabidiol (CBD) purificado de origem botânica (>98%), sem THC.
Indicações: Síndrome de Lennox-Gastaut, Síndrome de Dravet, Complexo de Esclerose Tuberosa e epilepsias refratárias de difícil controle.
Descrição: Primeiro medicamento fitoderivado de cannabis aprovado pelo FDA e pela EMA, com ampla validação em ensaios clínicos duplo-cegos.
Posologia Resumida: Dose inicial de 5 mg/kg/dia dividida em 2 tomadas orais. Pode ser titulada semanalmente até a dose de manutenção de 10 mg a 20 mg/kg/dia, com monitoramento periódico de enzimas hepáticas (ALT/AST).',
    2450.00,
    2890.00,
    'oleo',
    '/src/assets/products/oleo-cbd-1.jpg',
    '/src/assets/products/oleo-cbd-2.jpg',
    '/src/assets/products/oleo-cbd-3.jpg',
    45,
    89,
    5.00,
    true
  ),
  (
    v_vendor_id,
    'Sativex / Mevatyl (Nabiximols - Spray Oromucosal 1:1)',
    'Composição: Extrato botânico padronizado contendo 2,7 mg de THC + 2,5 mg de CBD por borrifada.
Indicações: Espasticidade moderada a grave decorrente de Esclerose Múltipla (não responsiva a outros tratamentos) e dor neuropática oncológica.
Descrição: Solução oromucosal que permite absorção direta pela mucosa oral, evitando o metabolismo de primeira passagem hepática.
Posologia Resumida: Inicia-se com 1 borrifada ao dia à noite, aumentando gradualmente 1 borrifada por dia até o alívio dos sintomas. A dose média de manutenção fica entre 4 e 8 borrifadas/dia (máximo de 12 borrifadas/dia).',
    2890.00,
    3250.00,
    'spray',
    '/src/assets/products/spray-1.jpg',
    '/src/assets/products/spray-2.jpg',
    '/src/assets/products/spray-3.jpg',
    30,
    64,
    4.90,
    true
  ),
  (
    v_vendor_id,
    'Marinol (Dronabinol em Cápsulas - 10 mg)',
    'Composição: Delta-9-Tetrahidrocanabinol (Δ9-THC) sintético formulado em óleo de gergelim.
Indicações: Anorexia associada à perda de peso em pacientes com HIV/AIDS e náuseas/vômitos induzidos por quimioterapia refratários a antieméticos clássicos.
Descrição: Agonista direto dos receptores CB1 e CB2 do sistema endocanabinoide, com potente ação orexígena (estímulo de apetite) e antiemética.
Posologia Resumida: Para apetite: 2,5 mg a 5 mg antes do almoço e do jantar. Para náuseas pós-quimio: 5 mg/m² administrados 1 a 3 horas antes da sessão de quimioterapia.',
    1850.00,
    2100.00,
    'capsula',
    '/src/assets/products/capsulas-1.jpg',
    '/src/assets/products/capsulas-2.jpg',
    '/src/assets/products/capsulas-3.jpg',
    25,
    42,
    4.80,
    true
  ),
  (
    v_vendor_id,
    'Cesamet (Nabilona - Cápsulas 1 mg)',
    'Composição: Análogo sintético do THC com potência farmacológica superior.
Indicações: Náuseas e vômitos quimioterápicos resistentes e manejo coadjuvante de dor crônica neuropática grave.
Descrição: Composto sintético com alta biodisponibilidade oral, utilizado em protocolos hospitalares e oncológicos internacionais.
Posologia Resumida: 1 mg a 2 mg via oral, 2 vezes ao dia. A dose inicial costuma ser administrada na noite anterior ao início da quimioterapia (dose máxima: 6 mg/dia).',
    1620.00,
    1950.00,
    'capsula',
    '/src/assets/products/capsulas-2.jpg',
    '/src/assets/products/capsulas-3.jpg',
    '/src/assets/products/capsulas-1.jpg',
    20,
    31,
    4.80,
    true
  ),
  (
    v_vendor_id,
    'Canabidiol Farmacêutico Isolado (Solução Oral 200 mg/mL)',
    'Composição: CBD purificado dissolvido em TCM (triglicerídeos de cadeia média), com teor de THC <0,2%.
Indicações: Epilepsia refratária, Transtorno do Espectro Autista (TEA), Transtorno de Ansiedade Generalizada (TAG) e distúrbios do sono.
Descrição: Categoria de produto amplamente dispensada em farmácias comerciais sob resoluções sanitárias como a RDC 327/2019 da ANVISA no Brasil.
Posologia Resumida: Início com doses baixas (0,5 a 1 mg/kg/dia ou 25 a 50 mg/dia divididos em 2 tomadas), com titulação gradual a cada 3 a 7 dias até o controle dos sintomas.',
    680.00,
    790.00,
    'oleo',
    '/src/assets/products/oleo-cbd-2.jpg',
    '/src/assets/products/oleo-cbd-3.jpg',
    '/src/assets/products/oleo-cbd-1.jpg',
    60,
    142,
    5.00,
    true
  ),
  (
    v_vendor_id,
    'Óleo CBD Full Spectrum 3000mg (Concentração ~100 mg/mL)',
    'Composição: Extrato integral da planta com CBD dominante acompanhado de canabinoides menores (CBG, CBN, CBC), terpenos, flavonoides e traços de THC (<0,3%).
Indicações: Dor crônica inflamatória (fibromialgia, artrite, osteoartrose), ansiedade, insônia e estresse pós-traumático (TEPT).
Descrição: Um dos produtos mais prescritos globalmente por explorar o efeito entourage (sinergia terapêutica entre todos os fitocompostos).
Posologia Resumida: 5 a 10 mg sublingual (2 a 4 gotas) 2 vezes ao dia. Titula-se adicionando gotas a cada 4 ou 5 dias até a dose terapêutica média (30 a 100 mg/dia).',
    540.00,
    620.00,
    'oleo',
    '/src/assets/products/oleo-cbd-3.jpg',
    '/src/assets/products/oleo-cbd-1.jpg',
    '/src/assets/products/oleo-cbd-2.jpg',
    75,
    215,
    4.90,
    true
  ),
  (
    v_vendor_id,
    'Óleo Balanceado 1:1 THC:CBD Full Spectrum (10 mg/mL THC : 10 mg/mL CBD)',
    'Composição: Proporção equilibrada entre THC e CBD em extrato completo.
Indicações: Dor oncológica, dor neuropática periférica, cuidados paliativos, espasmos musculares severos e insônia com componente doloroso.
Descrição: O CBD modula os efeitos psicoativos indesejados do THC (como taquicardia e ansiedade), potencializando o efeito analgésico e relaxante muscular.
Posologia Resumida: 2,5 mg de cada componente (0,25 mL ou 5 gotas) via sublingual à noite. Ajustes graduais a cada 3 dias conforme tolerabilidade, buscando a menor dose eficaz.',
    480.00,
    560.00,
    'tintura',
    '/src/assets/products/tintura-1.jpg',
    '/src/assets/products/tintura-2.jpg',
    '/src/assets/products/tintura-3.jpg',
    40,
    77,
    4.90,
    true
  ),
  (
    v_vendor_id,
    'Óleo THC Dominante / High THC (Concentração 25 mg/mL)',
    'Composição: Extrato com alta concentração de THC e baixos teores de CBD (<1 mg/mL).
Indicações: Dores intratáveis, rigidez e espasmos da Doença de Parkinson, caquexia severa e insônia resistente.
Descrição: Formulação direcionada a pacientes com tolerância prévia ou condições clínicas em que a estimulação direta dos receptores CB1 é necessária.
Posologia Resumida: Protocolo restrito (Start low, go slow): início com 1,25 mg a 2,5 mg de THC à noite (1 a 2 gotas), aumentando 1 gota a cada 5 a 7 dias, evitando horários de atividade motora ou condução de veículos.',
    520.00,
    599.00,
    'tintura',
    '/src/assets/products/tintura-2.jpg',
    '/src/assets/products/tintura-3.jpg',
    '/src/assets/products/tintura-1.jpg',
    35,
    53,
    4.80,
    true
  ),
  (
    v_vendor_id,
    'Óleo CBD Broad Spectrum / Amplo Espectro (Zero THC - 3000mg)',
    'Composição: Múltiplos canabinoides (CBD, CBG, CBN) e terpenos com remoção completa do THC (0,0%).
Indicações: Ansiedade, estresse crônico, foco e dores leves em pacientes com contraindicação ao THC (histórico de psicose, arritmias, crianças, idosos ou atletas sujeitos a controle antidoping).
Descrição: Entrega os benefícios do efeito comitiva dos terpenos e canabinoides menores sem qualquer risco de psicoatividade ou detecção em testes toxicológicos.
Posologia Resumida: 10 a 20 mg sublingual 2 vezes ao dia (manhã e tarde), titulando a cada 4 dias até a faixa de 40 a 120 mg/dia.',
    460.00,
    530.00,
    'oleo',
    '/src/assets/products/oleo-cbd-1.jpg',
    '/src/assets/products/oleo-cbd-3.jpg',
    '/src/assets/products/oleo-cbd-2.jpg',
    55,
    110,
    5.00,
    true
  ),
  (
    v_vendor_id,
    'Syndros (Dronabinol Solução Oral 5 mg/mL)',
    'Composição: Solução líquida oral de Delta-9-THC sintético.
Indicações: Perda de peso profunda em pacientes com AIDS e náuseas pós-quimioterapia refratárias em pacientes com dificuldade para deglutir cápsulas sólidas.
Descrição: Apresentação líquida de absorção mais rápida e titulação de dose mais precisa em relação às cápsulas tradicionais de dronabinol.
Posologia Resumida: 2,1 mg (0,42 mL) por via oral administrados 2 vezes ao dia, 1 hora antes do almoço e do jantar. Pode ser ajustada até 8,4 mg/dia conforme resposta clínica.',
    1980.00,
    2250.00,
    'spray',
    '/src/assets/products/spray-2.jpg',
    '/src/assets/products/spray-3.jpg',
    '/src/assets/products/spray-1.jpg',
    20,
    29,
    4.90,
    true
  );
END $$;
