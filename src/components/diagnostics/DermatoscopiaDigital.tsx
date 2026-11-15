import { ScanSearch } from 'lucide-react';
import { VisionExam } from './VisionExam';

/** Pele: a Brisa aplica a regra ABCDE na foto enviada. Nunca devolve resultado fixo. */
export function DermatoscopiaDigital({ onComplete }: { onComplete?: () => void }) {
  return (
    <VisionExam
      examType="dermatoscopy"
      title="Análise de Pinta ou Lesão de Pele"
      description="Fotografe a pinta ou a lesão de perto. A Enfª Brisa lê a imagem e avalia pela regra ABCDE: assimetria, bordas, cor, diâmetro e evolução."
      icon={ScanSearch}
      notes={[
        'A leitura é feita na sua foto. Coloque uma moeda ou régua ao lado da pinta para a Brisa conseguir estimar o tamanho.',
        'Uma foto só não mostra se a pinta mudou. Repita em 30 dias para comparar.',
        'Pinta que cresce, muda de cor, coça ou sangra precisa de dermatologista, seja qual for o resultado.',
      ]}
      manual={{
        title: 'Como Fotografar a Pinta',
        brisaMessage: 'Vou olhar essa pinta na sua foto e explicar cada ponto da regra ABCDE.',
        steps: [
          { title: 'Boa Luz', description: 'Fique em um ambiente claro. A luz natural do dia é a melhor.', icon: '☀️', colorClass: 'bg-yellow-50' },
          { title: 'Enquadre a Lesão', description: 'Coloque a pinta bem no centro da tela, de perto.', icon: '🔍', colorClass: 'bg-green-50' },
          { title: 'Referência de Tamanho', description: 'Ponha uma moeda ou régua ao lado da pinta.', icon: '🪙', colorClass: 'bg-blue-50' },
          { title: 'Fotografe', description: 'Segure firme e toque no botão da câmera.', icon: '📸', colorClass: 'bg-purple-50' },
        ],
      }}
      facingMode="environment"
      cameraHint="Pinta no centro, de perto, com boa luz e uma moeda ao lado"
      onComplete={onComplete}
    />
  );
}
