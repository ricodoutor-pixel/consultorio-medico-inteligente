import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Brain, Eye, Wind, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RelatorioPaciente = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const userId = session.session.user.id;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      setPatientInfo(profileData);

      const { data, error } = await supabase
        .from('diagnostic_exams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExams(data as any);
      
      // Auto-trigger print dialog slightly after load
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (err) {
      console.error('Error fetching exams for report:', err);
    }
  };

  const getExamIcon = (type: string) => {
    switch (type) {
      case 'cardiac': return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'pulmonary': return <Wind className="w-5 h-5 text-cyan-500" />;
      case 'fundoscopy': return <Eye className="w-5 h-5 text-blue-500" />;
      default: return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="min-h-dvh bg-white p-8 max-w-4xl mx-auto font-sans print:p-0 print:m-0">
      <div className="print:hidden mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Visualização de Impressão</h1>
        <Button onClick={() => window.print()} className="bg-primary">Imprimir / Salvar PDF</Button>
      </div>

      <div className="border-2 border-primary/20 rounded-2xl p-8 print:border-none print:p-0">
        
        {/* Header Timbrado */}
        <div className="border-b-4 border-primary pb-6 mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-black text-primary uppercase">Planta y Raiz</h2>
            </div>
            <p className="text-gray-500 font-bold">Medicina Integrativa & Inteligência Artificial</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-400">Data de Emissão</p>
            <p className="font-bold text-gray-800">{format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-4 uppercase">Dados do Paciente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Nome Completo</p>
              <p className="font-bold">{patientInfo?.first_name} {patientInfo?.last_name || 'Paciente'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">Email</p>
              <p className="font-bold">{patientInfo?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Histórico Clínico */}
        <h3 className="text-xl font-black text-gray-800 mb-6 uppercase border-l-4 border-primary pl-3">
          Histórico de Triagem por IA
        </h3>

        {exams.length === 0 ? (
          <p className="text-gray-500 font-medium italic">Nenhum exame registrado neste histórico.</p>
        ) : (
          <div className="space-y-6">
            {exams.map((exam) => (
              <div key={exam.id} className="border border-gray-200 rounded-xl p-5 break-inside-avoid shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    {getExamIcon(exam.exam_type)}
                    <h4 className="font-bold text-lg text-gray-800 uppercase">{exam.exam_type}</h4>
                  </div>
                  <span className="text-sm font-bold text-gray-500">
                    {format(new Date(exam.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Laudo da IA</span>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      {exam.ai_diagnosis?.diagnosis || exam.ai_diagnosis?.description || "Análise indisponível."}
                    </p>
                  </div>
                  
                  {exam.ai_diagnosis?.findings && exam.ai_diagnosis.findings.length > 0 && (
                    <div>
                      <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Achados</span>
                      <ul className="mt-1 space-y-1">
                        {exam.ai_diagnosis.findings.map((f: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-600 flex items-start gap-1">
                            <span className="text-primary">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Nível de Risco</span>
                    <p className={`text-sm font-black uppercase mt-1 ${exam.risk_level === 'alto' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {exam.risk_level}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-100 text-center text-sm font-semibold text-gray-400">
          <p>Este é um documento de triagem gerado por Inteligência Artificial.</p>
          <p>Não substitui a avaliação presencial ou teleconsulta com um médico especialista.</p>
          <p className="mt-2 text-primary font-bold">Planta y Raiz - Acolhendo com Tecnologia e Natureza</p>
        </div>
      </div>
    </div>
  );
};
export default RelatorioPaciente;
