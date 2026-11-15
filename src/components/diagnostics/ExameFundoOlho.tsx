import { Eye } from 'lucide-react';
import { SaMDBiofeedbackDisclaimer } from '@/components/compliance/SaMDBiofeedbackDisclaimer';
import { VisionExam } from './VisionExam';

/** Fundo de olho: a Brisa lê a foto enviada. Sem imagem da retina, ela diz isso e não gera achado. */
export function ExameFundoOlho({ onComplete }: { onComplete?: () => void }) {
  return (
    <VisionExam
      examType="fundoscopy"
      title="Fundo de Olho com IA"
      description="Fotografe o olho com a câmera de trás do celular. A Enfª Brisa lê a imagem de verdade e explica o que aparece nela."
      icon={Eye}
      notes={[
        'A retina só aparece com lente ou adaptador de fundoscopia no celular. Sem ele, a Brisa avalia a parte externa do olho e avisa que o fundo não pôde ser visto.',
        'A leitura é feita na sua foto. Se a imagem estiver escura ou tremida, a Brisa pede para repetir em vez de dar um resultado.',
        'Qualquer sinal de alerta precisa de consulta com oftalmologista.',
      ]}
      manual={{
        title: 'Como Fazer o Exame de Fundo de Olho',
        brisaMessage: 'Vou olhar a sua foto com cuidado e dizer o que consigo ver. Capriche na luz e no foco!',
        steps: [
          { title: 'Iluminação', description: 'Vá para um local bem iluminado ou ligue a lanterna do celular.', icon: '💡', colorClass: 'bg-yellow-50' },
          { title: 'Aproxime', description: 'Use a câmera de trás, bem perto do olho, com a pupila no centro da tela.', icon: '📱', colorClass: 'bg-blue-50' },
          { title: 'Olhe fixo', description: 'Olhe para a lente sem piscar e segure o celular firme.', icon: '👁️', colorClass: 'bg-green-50' },
          { title: 'Fotografe', description: 'Toque no botão da câmera. Se preferir, envie uma foto da galeria.', icon: '📸', colorClass: 'bg-purple-50' },
        ],
      }}
      facingMode="environment"
      cameraHint="Aproxime a câmera do olho, com a pupila no centro e boa luz"
      header={<SaMDBiofeedbackDisclaimer toolName="O exame de triagem de fundo de olho por inteligência artificial" />}
      onComplete={onComplete}
    />
  );
}
