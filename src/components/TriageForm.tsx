import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { performAITriage } from '@/lib/aiTriageService';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface TriageFormProps {
  onComplete?: (result: any) => void;
}

export function TriageForm({ onComplete }: TriageFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Queixa Principal
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Step 2: Sintomas
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');

  // Step 3: Histórico
  const [medicalHistory, setMedicalHistory] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [currentMedication, setCurrentMedication] = useState('');

  // Step 4: Resultado
  const [triageResult, setTriageResult] = useState<any>(null);

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom]);
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (currentMedication.trim()) {
      setMedications([...medications, currentMedication]);
      setCurrentMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1 && !chiefComplaint.trim()) {
      setError('Por favor, descreva sua queixa principal');
      return;
    }
    if (step === 2 && symptoms.length === 0) {
      setError('Por favor, adicione pelo menos um sintoma');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await performAITriage({
        chiefComplaint,
        symptoms,
        medicalHistory,
        currentMedications: medications,
      });

      setTriageResult(result);
      setStep(4);
      onComplete?.(result);
    } catch (err) {
      setError('Erro ao processar triagem. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#00FF00]' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-400 text-center">Passo {step} de 4</p>
      </div>

      {/* Step 1: Queixa Principal */}
      {step === 1 && (
        <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-6">
          <h2 className="text-2xl font-bold text-[#00FF00] mb-4">Qual é sua queixa principal?</h2>
          <p className="text-gray-300 mb-4">
            Descreva o principal motivo pelo qual você está procurando atendimento médico.
          </p>
          <Textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Ex: Tenho sofrido com dores crônicas nas costas há 2 anos..."
            className="bg-[#0A0E27] border-[#00FF00]/30 text-white mb-4 min-h-32"
          />
          {error && (
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <Button
            onClick={handleNext}
            className="w-full bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold"
          >
            Próximo
          </Button>
        </Card>
      )}

      {/* Step 2: Sintomas */}
      {step === 2 && (
        <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-6">
          <h2 className="text-2xl font-bold text-[#00FF00] mb-4">Quais são seus sintomas?</h2>
          <p className="text-gray-300 mb-4">
            Adicione os sintomas que você está experimentando.
          </p>

          <div className="flex gap-2 mb-4">
            <Input
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              placeholder="Ex: Dor nas costas, insônia..."
              className="bg-[#0A0E27] border-[#00FF00]/30 text-white"
            />
            <Button
              onClick={addSymptom}
              className="bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold"
            >
              Adicionar
            </Button>
          </div>

          {symptoms.length > 0 && (
            <div className="mb-4 space-y-2">
              {symptoms.map((symptom, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#0A0E27] p-3 rounded border border-[#00FF00]/20"
                >
                  <span className="text-white">{symptom}</span>
                  <button
                    onClick={() => removeSymptom(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="flex-1 border-[#00FF00]/30 text-[#00FF00]"
            >
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold"
            >
              Próximo
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Histórico Médico */}
      {step === 3 && (
        <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-6">
          <h2 className="text-2xl font-bold text-[#00FF00] mb-4">Histórico Médico</h2>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Histórico Médico (opcional)</label>
            <Textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Ex: Hipertensão, diabetes..."
              className="bg-[#0A0E27] border-[#00FF00]/30 text-white min-h-24"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Medicamentos Atuais (opcional)</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentMedication}
                onChange={(e) => setCurrentMedication(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                placeholder="Ex: Dipirona, Omeprazol..."
                className="bg-[#0A0E27] border-[#00FF00]/30 text-white"
              />
              <Button
                onClick={addMedication}
                className="bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold"
              >
                Adicionar
              </Button>
            </div>

            {medications.length > 0 && (
              <div className="space-y-2">
                {medications.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#0A0E27] p-3 rounded border border-[#00FF00]/20"
                  >
                    <span className="text-white">{med}</span>
                    <button
                      onClick={() => removeMedication(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="flex-1 border-[#00FF00]/30 text-[#00FF00]"
            >
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Processando...
                </>
              ) : (
                'Analisar'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Resultado */}
      {step === 4 && triageResult && (
        <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-[#00FF00]" size={24} />
            <h2 className="text-2xl font-bold text-[#00FF00]">Triagem Completa</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0A0E27] p-4 rounded border border-[#00FF00]/20">
              <p className="text-gray-400 text-sm mb-1">Condições Identificadas</p>
              <div className="flex flex-wrap gap-2">
                {triageResult.suggestedConditions.map((condition: string, i: number) => (
                  <span
                    key={i}
                    className="bg-[#00FF00]/20 text-[#00FF00] px-3 py-1 rounded text-sm"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#0A0E27] p-4 rounded border border-[#00FF00]/20">
              <p className="text-gray-400 text-sm mb-1">Especialidade Recomendada</p>
              <p className="text-[#00FF00] font-bold text-lg capitalize">
                {triageResult.suggestedSpecialty}
              </p>
            </div>

            <div className="bg-[#0A0E27] p-4 rounded border border-[#00FF00]/20">
              <p className="text-gray-400 text-sm mb-1">Confiança da Análise</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#00FF00] h-2 rounded-full transition-all"
                    style={{ width: `${triageResult.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[#00FF00] font-bold">
                  {Math.round(triageResult.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-[#0A0E27] p-4 rounded border border-[#00FF00]/20">
              <p className="text-gray-400 text-sm mb-1">Análise</p>
              <p className="text-white">{triageResult.reasoning}</p>
            </div>
          </div>

          <Button
            onClick={() => {
              setStep(1);
              setChiefComplaint('');
              setSymptoms([]);
              setMedicalHistory('');
              setMedications([]);
              setTriageResult(null);
            }}
            className="w-full mt-6 bg-[#00FF00] text-black hover:bg-[#00dd00] font-bold"
          >
            Fazer Nova Triagem
          </Button>
        </Card>
      )}
    </div>
  );
}
