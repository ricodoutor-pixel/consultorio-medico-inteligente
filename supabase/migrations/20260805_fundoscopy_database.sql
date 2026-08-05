-- 1. Create table fundoscopy_pathologies
CREATE TABLE IF NOT EXISTS public.fundoscopy_pathologies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category text NOT NULL CHECK (category IN ('ocular', 'systemic', 'neurological', 'cardiovascular')),
    name_pt text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    fundoscopy_findings text NOT NULL,
    severity_levels jsonb NOT NULL,
    risk_factors text[] NOT NULL,
    cannabis_connection text,
    scientific_references text[],
    icd10_code text,
    prevalence text,
    icon text DEFAULT '👁️',
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_name_pt UNIQUE(name_pt)
);

-- 2. Create table fundoscopy_exams
CREATE TABLE IF NOT EXISTS public.fundoscopy_exams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    image_data text,
    ai_analysis jsonb,
    detected_pathologies uuid[],
    risk_level text DEFAULT 'baixo' CHECK (risk_level IN ('baixo','moderado','alto','critico')),
    cup_disc_ratio numeric,
    vascular_tortuosity text,
    macula_status text,
    optic_nerve_status text,
    recommendations text,
    cannabis_relevance text,
    created_at timestamptz DEFAULT now()
);

-- 3. Create table diagnostic_exams
CREATE TABLE IF NOT EXISTS public.diagnostic_exams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    exam_type text NOT NULL CHECK (exam_type IN ('fundoscopy','oximetry','dermatoscopy','mobility','cardiac')),
    results jsonb NOT NULL DEFAULT '{}'::jsonb,
    ai_diagnosis jsonb,
    risk_level text DEFAULT 'baixo',
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS and create policies
ALTER TABLE public.fundoscopy_pathologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundoscopy_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all pathologies" ON public.fundoscopy_pathologies
    FOR SELECT USING (true);

CREATE POLICY "Users can CRUD their own fundoscopy exams" ON public.fundoscopy_exams
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own diagnostic exams" ON public.diagnostic_exams
    FOR ALL USING (auth.uid() = user_id);

-- 5. Insert pathologies
INSERT INTO public.fundoscopy_pathologies (
    category, name_pt, name_en, description, fundoscopy_findings, severity_levels, risk_factors, cannabis_connection, icd10_code
) VALUES
-- OCULAR (11)
('ocular', 'Retinopatia Diabética', 'Diabetic Retinopathy', 'Complicação microvascular do diabetes na retina.', 'Microaneurismas, hemorragias puntiformes, exsudatos duros, manchas algodonosas, neovascularização.', '{"leve":"NPDR leve - poucos microaneurismas","moderada":"NPDR moderada - hemorragias e exsudatos","severa":"NPDR severa - hemorragias extensas","proliferativa":"PDR - neovascularização"}', ARRAY['diabetes mal controlado', 'hipertensão', 'hiperlipidemia'], 'CBD demonstrou propriedades antioxidantes e anti-inflamatórias que podem prevenir morte celular retiniana.', 'H36.0'),
('ocular', 'Glaucoma', 'Glaucoma', 'Neuropatia óptica progressiva.', 'Aumento da relação escavação/disco, afinamento da borda neurorretiniana, palidez do disco, hemorragias em Drance.', '{"inicial":"Perda de campo visual leve","moderado":"Perda moderada","avançado":"Perda extensa, escavação grande"}', ARRAY['pressão intraocular alta', 'idade', 'histórico familiar', 'miopia'], 'THC reduz pressão intraocular em 60-65% via receptores CB1 (efeito dura 3-4h).', 'H40'),
('ocular', 'DMRI', 'Age-Related Macular Degeneration (AMD)', 'Degeneração Macular Relacionada à Idade.', 'Drusen, hiper/hipopigmentação do EPR, hemorragia sub-retiniana.', '{"precoce":"Drusen pequenas","intermediária":"Drusen grandes","tardia":"Atrofia geográfica ou neovascular"}', ARRAY['envelhecimento', 'tabagismo', 'genética', 'exposição UV'], 'Potencial antioxidante e anti-VEGF dos canabinoides.', 'H35.3'),
('ocular', 'Descolamento de Retina', 'Retinal Detachment', 'Separação da retina neurossensorial do epitélio pigmentar.', 'Elevação da retina, pigmento no vítreo, defeito relativo pupilar aferente.', '{"parcial":"Descolamento localizado","total":"Descolamento extenso com risco de cegueira"}', ARRAY['miopia alta', 'trauma ocular', 'cirurgia prévia'], 'Sem evidência direta.', 'H33'),
('ocular', 'OVCR', 'CRVO', 'Oclusão da Veia Central da Retina.', 'Hemorragias retinianas difusas (sangue e trovão), edema de disco, dilatação venosa.', '{"não_isquêmica":"Prognóstico melhor","isquêmica":"Risco de neovascularização"}', ARRAY['hipertensão', 'diabetes', 'glaucoma', 'idade'], 'Anti-inflamatório pode ajudar.', 'H34.8'),
('ocular', 'OACR', 'CRAO', 'Oclusão da Artéria Central da Retina.', 'Retina pálida e edemaciada, mancha vermelho-cereja na mácula, arteríolas finas.', '{"aguda":"Emergência - perda súbita de visão"}', ARRAY['aterosclerose', 'fibrilação atrial', 'valvulopatias'], 'Sem evidência.', 'H34.1'),
('ocular', 'Uveíte Posterior', 'Posterior Uveitis', 'Inflamação da úvea no segmento posterior.', 'Células e debris no vítreo, infiltrados retinianos ou coroidais, vasculite.', '{"leve":"Poucos flocos vítreos","moderada":"Infiltrados visíveis","severa":"Vasculite extensa"}', ARRAY['doenças autoimunes', 'infecções'], 'CBD tem propriedades anti-inflamatórias.', 'H30.2'),
('ocular', 'Membrana Epirretiniana', 'Epiretinal Membrane', 'Proliferação fibrocelular na superfície interna da retina.', 'Membrana translúcida na superfície da retina, distorção macular, pregas retinianas.', '{"leve":"Assintomática","moderada":"Metamorfopsia","severa":"Distorção visual significativa"}', ARRAY['idade', 'inflamação ocular prévia'], 'Sem evidência direta.', 'H35.3'),
('ocular', 'Buraco Macular', 'Macular Hole', 'Defeito de espessura total na região foveal da mácula.', 'Defeito foveal bem definido, bordas elevadas, pseudopérculo.', '{"estágio_1":"Iminente","estágio_2":"Pequeno","estágio_3":"Grande","estágio_4":"Com descolamento vítreo"}', ARRAY['idade >60', 'miopia', 'trauma'], 'Sem evidência.', 'H35.3'),
('ocular', 'Edema Macular Cistóide', 'Cystoid Macular Edema', 'Acúmulo de fluido na região macular.', 'Espessamento macular, espaços cistóides na mácula, padrão petaloide em angiografia.', '{"leve":"Espessamento discreto","moderado":"Cistos visíveis","severo":"Edema extenso com perda visual"}', ARRAY['pós-operatório', 'diabetes', 'uveíte'], 'CBD anti-inflamatório pode ajudar.', 'H35.8'),
('ocular', 'Retinopatia da Prematuridade', 'Retinopathy of Prematurity', 'Desordem vascular da retina em bebês prematuros.', 'Vascularização retiniana incompleta, crista de demarcação, proliferação fibrovascular.', '{"estágio_1":"Linha de demarcação","estágio_2":"Crista","estágio_3":"Proliferação","estágio_4":"Descolamento parcial","estágio_5":"Descolamento total"}', ARRAY['prematuridade', 'baixo peso', 'oxigenoterapia'], 'Não indicado em neonatos.', 'H35.1'),

-- SYSTEMIC (11)
('systemic', 'Retinopatia Hipertensiva', 'Hypertensive Retinopathy', 'Alterações vasculares da retina por hipertensão.', 'Estreitamento arteriolar, cruzamento AV, fio de cobre/prata, hemorragias em chama, estrela macular.', '{"grau_I":"Estreitamento arteriolar leve","grau_II":"Cruzamentos AV","grau_III":"Hemorragias e exsudatos","grau_IV":"Papiledema (hipertensão maligna)"}', ARRAY['hipertensão crônica não controlada'], 'Uso crônico pode causar efeitos cardiovasculares variados.', 'H35.0'),
('systemic', 'Diabetes Mellitus (sinais retinianos)', 'Diabetes Mellitus', 'Sinais sistêmicos de diabetes observados na retina.', 'Mesmo achados da retinopatia diabética, porém como indicador diagnóstico da doença sistêmica.', '{}', ARRAY['obesidade', 'dieta', 'genética'], 'CBD pode proteger barreira hemato-retiniana.', 'E11'),
('systemic', 'Toxoplasmose Ocular', 'Ocular Toxoplasmosis', 'Infecção ocular pelo Toxoplasma gondii.', 'Retinocoroidite necrotizante focal (lesões brancas felpudas próximas a cicatrizes pigmentadas - faróis na neblina).', '{"ativa":"Lesão branca com vitreíte","cicatrizada":"Cicatriz pigmentada","recorrente":"Nova lesão adjacente a cicatriz"}', ARRAY['contato com gatos', 'carne mal cozida', 'imunossupressão'], 'Sem evidência antiparasitária.', 'B58.0'),
('systemic', 'Retinite por CMV (HIV/AIDS)', 'CMV Retinitis', 'Infecção por citomegalovírus em pacientes imunocomprometidos.', 'Retinopatia pizza pie - hemorragia com exsudatos branco-amarelados.', '{}', ARRAY['imunossupressão', 'HIV avançado'], 'Cannabis medicinal amplamente usada em HIV para síndrome consumptiva e neuropatia.', 'B25.8'),
('systemic', 'Sífilis Ocular', 'Ocular Syphilis', 'Manifestação ocular da sífilis.', 'Uveíte posterior, vasculite retiniana, neurorretinite, placóide macular.', '{}', ARRAY['doenças sexualmente transmissíveis'], 'Sem evidência antimicrobiana.', 'A52.7'),
('systemic', 'Lúpus (vasculite retiniana)', 'Lupus', 'Vasculite na retina secundária a Lúpus.', 'Manchas algodonosas, vasculite retiniana, hemorragias.', '{}', ARRAY['autoimunidade'], 'CBD para imunomodulação e alívio da dor.', 'M32'),
('systemic', 'Artrite Reumatóide', 'Rheumatoid Arthritis', 'Inflamações oftalmológicas devido a AR.', 'Esclerite, uveíte, vasculite retiniana.', '{}', ARRAY['autoimunidade'], 'CBD para dor e inflamação crônica.', 'M05'),
('systemic', 'Leucemia (manchas de Roth)', 'Leukemia', 'Manifestações retinianas da leucemia.', 'Hemorragias retinianas com centro branco (manchas de Roth), dilatação venosa.', '{}', ARRAY['fatores de risco oncológicos'], 'CBD como adjuvante para sintomas.', 'C95'),
('systemic', 'Linfoma Intraocular', 'Intraocular Lymphoma', 'Tumor maligno ocular.', 'Infiltrados sub-retinianos, células vítreas, mascarada como uveíte crônica.', '{}', ARRAY['imunossupressão', 'idade'], 'Pesquisa em andamento sobre canabinoides antitumorais.', 'C83'),
('systemic', 'Anemia Falciforme', 'Sickle Cell Anemia', 'Alterações microvasculares na doença falciforme.', 'Retinopatia proliferativa, sea fan neovascularization, hemorragias.', '{}', ARRAY['genética falciforme'], 'CBD para dor crônica da doença.', 'D57'),
('systemic', 'Endocardite Bacteriana', 'Bacterial Endocarditis', 'Infecção das válvulas cardíacas refletida nos olhos.', 'Êmbolos retinianos, manchas de Roth, oclusões vasculares.', '{}', ARRAY['infecção valvular', 'drogas IV'], 'Sem evidência antimicrobiana.', 'I33'),

-- NEUROLOGICAL (6)
('neurological', 'Papiledema', 'Papilledema', 'Inchaço do disco óptico devido a hipertensão intracraniana.', 'Discos ópticos edemaciados bilaterais, margens borradas, obliteração da escavação, disco hiperêmico, hemorragias peripapilares.', '{}', ARRAY['hipertensão intracraniana', 'tumores', 'medicamentos'], 'Canabinoides podem reduzir neuroinflamação.', 'H47.1'),
('neurological', 'Neurite Óptica', 'Optic Neuritis', 'Inflamação do nervo óptico.', 'Edema unilateral do disco, defeito pupilar aferente relativo, dor ao movimento ocular.', '{}', ARRAY['esclerose múltipla', 'infecções', 'autoimune'], 'CBD neuroprotetor.', 'H46'),
('neurological', 'Esclerose Múltipla', 'Multiple Sclerosis', 'Desmielinização do SNC.', 'Palidez temporal do disco óptico, neurite óptica recorrente.', '{}', ARRAY['genética', 'fator ambiental'], 'CBD/THC para espasticidade e dor neuropática (Sativex aprovado).', 'G35'),
('neurological', 'Tumores Cerebrais', 'Brain Tumors', 'Massa intracraniana.', 'Papiledema por compressão, atrofia óptica, paralisia de nervos cranianos.', '{}', ARRAY['genética', 'radiação'], 'Pesquisa sobre canabinoides antitumorais.', 'C71'),
('neurological', 'NOIA', 'NAION', 'Neuropatia Óptica Isquêmica Anterior.', 'Edema setorial do disco, hemorragias, defeito altitudinal de campo visual.', '{}', ARRAY['idade', 'diabetes', 'hipertensão', 'apneia do sono'], 'Sem evidência direta.', 'H47.0'),
('neurological', 'Atrofia Óptica', 'Optic Atrophy', 'Dano final ao nervo óptico.', 'Disco óptico pálido, perda da camada de fibras nervosas, vasos afinados.', '{}', ARRAY['glaucoma avançado', 'neurite prévia', 'trauma'], 'CBD neuroprotetor em pesquisa.', 'H47.2'),

-- CARDIOVASCULAR (3)
('cardiovascular', 'Aterosclerose', 'Atherosclerosis', 'Espessamento das paredes arteriais.', 'Artérias com reflexo de fio de cobre ou prata, estreitamento focal, placas de Hollenhorst.', '{}', ARRAY['dislipidemia', 'hipertensão', 'idade'], 'Pesquisa sobre efeitos cardiovasculares dos canabinoides.', 'I70'),
('cardiovascular', 'Embolia Retiniana', 'Retinal Embolism', 'Oclusão por êmbolos.', 'Placas de Hollenhorst (êmbolos de colesterol) nas bifurcações arteriolares.', '{}', ARRAY['aterosclerose carotídea', 'doença cardíaca'], 'Sem evidência.', 'H34.2'),
('cardiovascular', 'Vasculite Retiniana', 'Retinal Vasculitis', 'Inflamação dos vasos retinianos.', 'Embainhamento perivascular, hemorragias, oclusões.', '{}', ARRAY['doenças autoimunes', 'infecções'], 'CBD anti-inflamatório.', 'H35.0')
ON CONFLICT (name_pt) DO NOTHING;
