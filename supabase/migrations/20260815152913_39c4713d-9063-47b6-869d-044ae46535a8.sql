UPDATE public.profiles
SET full_name = 'Dra. Ana Paula Ferreira Lima'
WHERE id = 'df8484a2-1579-404f-8eae-614ddeddd487';

UPDATE public.doctors
SET specialty = 'Clínica Geral — Prescritora de Cannabis Medicinal e Modulação do Sistema Endocanabinoide',
    bio = 'Dra. Ana Paula Ferreira Lima — CRM 36942/PR (situação regular, inscrição em 29/11/2016). Graduada em Medicina pela Universidade do Oeste Paulista — Campus Presidente Prudente (2016). Médica Clínica Geral, prescritora de cannabis medicinal e especialista em modulação do sistema endocanabinoide humano. Pós-graduada em Medicina Canabinoide (Unileya) e Cannabis Sativa (UNIFESP). Neurodivergente (TEA, TDAH, AH/SD) e fundadora da Acolhe Ela, clínica virtual dedicada a mulheres neurodivergentes com diagnóstico tardio. Prescrição baseada em evidências, com foco em produtos full spectrum, titulação gradual e acompanhamento contínuo. Atendimento 100% online.',
    is_online = false,
    is_available = false,
    is_verified = false,
    approval_status = 'pending'
WHERE id = 'dc7ed2d5-5cc3-4051-800f-cfeaa2bed28e';