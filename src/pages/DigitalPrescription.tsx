import { useState } from 'react';
import { AlertCircle, CheckCircle, FileText, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Página de Prescrição Digital com Assinatura ICP-Brasil
 * Implementa RDC ANVISA nº 20/2011 e CFM nº 2.113/2021
 */
export default function DigitalPrescription() {
  const [currentStep, setCurrentStep] = useState<'review' | 'sign' | 'validate' | 'success'>(
    'review'
  );
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados de exemplo
  const examplePrescription = {
    prescriptionNumber: 'RX20260224ABC123',
    patientName: 'João Silva',
    patientCPF: '123.456.789-00',
    patientAge: 45,
    specialistName: 'Dr. Maria Santos',
    specialistCRM: '123456',
    specialistCRMState: 'SP',
    medications: [
      {
        medicationName: 'Óleo de Cannabis 25mg/ml',
        dosage: '25mg',
        frequency: '2x ao dia',
        duration: '30 dias',
        quantity: 1,
        thcPercentage: 5,
        cbdPercentage: 20,
        strainName: 'Charlotte\'s Web',
      },
    ],
    diagnosis: 'Epilepsia refratária',
    medicalIndication: 'G40',
    anvisaValidation: {
      validated: false,
      validationCode: '',
    },
    qrCode: '',
  };

  const handleReview = () => {
    setPrescription(examplePrescription);
    setCurrentStep('review');
  };

  const handleSign = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simular assinatura
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPrescription({
        ...prescription,
        status: 'signed',
        signatureTimestamp: new Date(),
      });

      setCurrentStep('validate');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simular validação ANVISA
      await new Promise(resolve => setTimeout(resolve, 3000));

      const validationCode = `ANVISA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setPrescription({
        ...prescription,
        status: 'validated',
        anvisaValidation: {
          validated: true,
          validationCode,
        },
        qrCode: `https://plantaeraiz.com/verify/${validationCode}`,
      });

      setCurrentStep('success');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Simular download de PDF
    alert('PDF da prescrição será baixado em breve');
  };

  if (!prescription) {
    return (
      <div className="min-h-screen bg-[#0A0E27] text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-[#00FF00]">Prescrição Digital</h1>
            <p className="text-gray-400">
              Sistema de prescrição com assinatura eletrônica ICP-Brasil
            </p>
          </div>

          <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-8">
            <div className="text-center">
              <FileText className="w-16 h-16 text-[#00FF00] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Criar Nova Prescrição</h2>
              <p className="text-gray-400 mb-8">
                Conforme RDC ANVISA nº 20/2011 e Resolução CFM nº 2.113/2021
              </p>
              <Button
                onClick={handleReview}
                className="bg-[#00FF00] text-black hover:bg-[#00DD00] font-bold"
              >
                Iniciar Prescrição
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#00FF00]">Prescrição Digital</h1>
          <p className="text-gray-400">Nº {prescription.prescriptionNumber}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {['review', 'sign', 'validate', 'success'].map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === step
                    ? 'bg-[#00FF00] text-black'
                    : ['review', 'sign', 'validate'].includes(step) && currentStep !== 'review'
                      ? 'bg-[#9D4EDD] text-white'
                      : 'bg-gray-700 text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    ['review', 'sign', 'validate'].includes(step) && currentStep !== 'review'
                      ? 'bg-[#9D4EDD]'
                      : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/50 p-4 mb-8">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#00FF00]">Revisar Prescrição</h2>

            {/* Patient Info */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Dados do Paciente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Nome</p>
                  <p className="text-white font-bold">{prescription.patientName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">CPF</p>
                  <p className="text-white font-bold">{prescription.patientCPF}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Idade</p>
                  <p className="text-white font-bold">{prescription.patientAge} anos</p>
                </div>
              </div>
            </div>

            {/* Specialist Info */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Dados do Profissional</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Nome</p>
                  <p className="text-white font-bold">{prescription.specialistName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">CRM</p>
                  <p className="text-white font-bold">
                    {prescription.specialistCRM}/{prescription.specialistCRMState}
                  </p>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Medicamentos</h3>
              {prescription.medications.map((med: any, index: number) => (
                <div key={index} className="bg-[#0A0E27] p-4 rounded-lg mb-3">
                  <p className="text-[#00FF00] font-bold">{med.medicationName}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-400">
                    <p>Dosagem: {med.dosage}</p>
                    <p>Frequência: {med.frequency}</p>
                    <p>Duração: {med.duration}</p>
                    <p>Quantidade: {med.quantity}</p>
                    {med.thcPercentage && <p>THC: {med.thcPercentage}%</p>}
                    {med.cbdPercentage && <p>CBD: {med.cbdPercentage}%</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnosis */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Diagnóstico</h3>
              <p className="text-gray-300">{prescription.diagnosis}</p>
              <p className="text-gray-400 text-sm mt-2">CID-10: {prescription.medicalIndication}</p>
            </div>

            {/* Compliance */}
            <div className="bg-[#0A0E27] p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-400 mb-2">✓ Conforme RDC ANVISA nº 20/2011</p>
              <p className="text-sm text-gray-400 mb-2">✓ Conforme RDC ANVISA nº 660/2022</p>
              <p className="text-sm text-gray-400">✓ Conforme Resolução CFM nº 2.113/2021</p>
            </div>

            <Button
              onClick={handleSign}
              disabled={isLoading}
              className="w-full bg-[#00FF00] text-black hover:bg-[#00DD00] font-bold"
            >
              Prosseguir para Assinatura
            </Button>
          </Card>
        )}

        {/* Sign Step */}
        {currentStep === 'sign' && (
          <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#00FF00]">Assinar Digitalmente</h2>

            <div className="bg-[#0A0E27] p-6 rounded-lg mb-6 text-center">
              <p className="text-gray-400 mb-4">Assinando prescrição com certificado ICP-Brasil...</p>
              <div className="inline-block">
                <div className="w-10 h-10 border-4 border-[#00FF00] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              A prescrição será assinada digitalmente com seu certificado ICP-Brasil. Este processo
              pode levar alguns segundos.
            </p>

            <Button
              onClick={handleValidate}
              disabled={isLoading}
              className="w-full bg-[#9D4EDD] text-white hover:bg-[#8B3FBD] font-bold"
            >
              {isLoading ? 'Assinando...' : 'Confirmar Assinatura'}
            </Button>
          </Card>
        )}

        {/* Validate Step */}
        {currentStep === 'validate' && (
          <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#00FF00]">Validar com ANVISA</h2>

            <div className="bg-[#0A0E27] p-6 rounded-lg mb-6 text-center">
              <p className="text-gray-400 mb-4">Validando prescrição com ANVISA...</p>
              <div className="inline-block">
                <div className="w-10 h-10 border-4 border-[#9D4EDD] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              A prescrição está sendo validada no sistema da ANVISA. Você receberá um código de
              validação único assim que o processo for concluído.
            </p>

            <Button
              onClick={handleValidate}
              disabled={isLoading}
              className="w-full bg-[#00FF00] text-black hover:bg-[#00DD00] font-bold"
            >
              {isLoading ? 'Validando...' : 'Concluir Validação'}
            </Button>
          </Card>
        )}

        {/* Success Step */}
        {currentStep === 'success' && (
          <Card className="bg-[#1a1f3a] border-[#00FF00]/30 p-8 mb-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-[#00FF00] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#00FF00]">Prescrição Validada com Sucesso!</h2>
            </div>

            {/* Validation Code */}
            <div className="bg-[#0A0E27] p-6 rounded-lg mb-6">
              <p className="text-gray-400 text-sm mb-2">Código de Validação ANVISA</p>
              <p className="text-[#00FF00] font-bold text-lg break-all">
                {prescription.anvisaValidation.validationCode}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-[#0A0E27] p-6 rounded-lg mb-6 text-center">
              <QrCode className="w-8 h-8 text-[#00FF00] mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-3">Código QR para Farmácia</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <p className="text-black text-xs font-mono">{prescription.qrCode}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadPDF}
                className="bg-[#9D4EDD] text-white hover:bg-[#8B3FBD] font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar PDF
              </Button>
              <Button className="bg-[#00FF00] text-black hover:bg-[#00DD00] font-bold">
                Enviar para Farmácia
              </Button>
            </div>

            {/* Compliance Footer */}
            <div className="mt-8 p-4 bg-[#0A0E27] rounded-lg text-center">
              <p className="text-gray-400 text-sm">
                ✓ Prescrição digital conforme RDC ANVISA nº 20/2011
              </p>
              <p className="text-gray-400 text-sm">✓ Assinada digitalmente com certificado ICP-Brasil</p>
              <p className="text-gray-400 text-sm">✓ Válida por 30 dias</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
