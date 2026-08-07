import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Brain, FileText, Activity, Clock, ShieldCheck, Download, Wind, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Exam {
  id: string;
  exam_type: string;
  ai_diagnosis: any;
  risk_level: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const ProntuarioInteligente = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data as any);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExamIcon = (type: string) => {
    switch (type) {
      case 'cardiac': return <Activity className="w-6 h-6 text-emerald-500" />;
      case 'pulmonary': return <Wind className="w-6 h-6 text-cyan-500" />;
      case 'fundoscopy': return <Eye className="w-6 h-6 text-blue-500" />;
      default: return <Brain className="w-6 h-6 text-purple-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'alto' || risk === 'critico') return <Badge variant="destructive" className="uppercase font-black animate-pulse">Risco Alto</Badge>;
    if (risk === 'moderado') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 uppercase font-black">Moderado</Badge>;
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 uppercase font-black">Risco Baixo</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Navbar />
      <div className="container max-w-6xl mx-auto pt-24 px-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Prontuário Médico Inteligente
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Visão consolidada da triagem avançada por IA</p>
          </div>
          <Button variant="outline" className="border-2 border-primary/50 text-primary font-bold shadow-sm" onClick={fetchExams}>
            <Clock className="w-4 h-4 mr-2" /> Atualizar Timeline
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : exams.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-500">Nenhum exame de IA registrado ainda.</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="border-2 hover:border-primary/50 transition-colors shadow-sm overflow-hidden">
                <div className={`h-2 w-full ${exam.risk_level === 'alto' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                        {getExamIcon(exam.exam_type)}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          {exam.exam_type.toUpperCase()}
                          {getRiskBadge(exam.risk_level)}
                        </CardTitle>
                        <p className="text-sm font-semibold text-muted-foreground">
                          Paciente: {exam.users?.first_name} {exam.users?.last_name} ({exam.users?.email})
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                      {format(new Date(exam.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* Coluna 1: Diagnóstico da IA */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm uppercase font-black text-gray-500 mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-500" /> Resumo Clínico (Gemini IA)
                        </h4>
                        <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                          <p className="text-gray-800 font-medium leading-relaxed">
                            {exam.ai_diagnosis?.diagnosis || exam.ai_diagnosis?.description || "Análise indisponível."}
                          </p>
                        </div>
                      </div>

                      {exam.ai_diagnosis?.findings && exam.ai_diagnosis.findings.length > 0 && (
                        <div>
                          <h4 className="text-sm uppercase font-black text-gray-500 mb-2">Achados Técnicos</h4>
                          <ul className="space-y-2">
                            {exam.ai_diagnosis.findings.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="text-primary mt-0.5">•</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Coluna 2: Fala da Brisa & Ações */}
                    <div className="flex flex-col justify-between space-y-4">
                      {exam.ai_diagnosis?.brisaSpeech && (
                        <div className="border-2 border-black rounded-xl bg-[#ffde59] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative">
                          <div className="absolute -top-3 -right-2 bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-md rotate-[5deg]">
                            Fala da Brisa
                          </div>
                          <p className="font-bold text-sm text-black italic">"{exam.ai_diagnosis.brisaSpeech}"</p>
                        </div>
                      )}

                      {exam.risk_level === 'alto' && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                          <p className="text-sm font-bold text-red-700">
                            Atenção: A IA detectou achados críticos que exigem avaliação médica prioritária durante a consulta.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 mt-auto pt-4">
                        <Button variant="outline" className="font-bold border-2" onClick={() => window.print()}>
                          <Download className="w-4 h-4 mr-2" /> PDF
                        </Button>
                        <Button className="font-black bg-black text-white hover:bg-gray-800">
                          Iniciar Consulta Virtual
                        </Button>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ProntuarioInteligente;
