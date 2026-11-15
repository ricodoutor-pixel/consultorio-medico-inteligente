import { useRef, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { VisionExam } from './VisionExam';

const JOINTS = ['Ombro', 'Cotovelo', 'Punho', 'Quadril', 'Joelho', 'Tornozelo'];

/** Mobilidade: a Brisa estima o ângulo na foto do ponto máximo do movimento. Sem ângulo sorteado. */
export function AvaliacaoMobilidade({ onComplete }: { onComplete?: () => void }) {
  const [joint, setJoint] = useState(JOINTS[0]);
  const [pain, setPain] = useState(0);
  const contextRef = useRef({ joint, pain_level: pain });
  contextRef.current = { joint, pain_level: pain };

  return (
    <VisionExam
      examType="mobility"
      title="Avaliação de Mobilidade"
      description="Escolha a articulação, faça o movimento até onde conseguir e fique parado. A foto é tirada sozinha e a Enfª Brisa estima a amplitude do movimento."
      icon={Accessibility}
      notes={[
        'O ângulo é uma estimativa visual feita na sua foto, com margem de erro de cerca de 15 graus.',
        'Apoie o celular e fique de lado para a câmera, com o corpo inteiro aparecendo.',
        'Não force além da dor. Limitação ou dor forte precisam de avaliação com médico ou fisioterapeuta.',
      ]}
      introExtra={
        <div className="w-full max-w-sm space-y-3 text-left">
          <div>
            <p className="text-xs font-bold text-slate-700 mb-1.5">Qual articulação?</p>
            <div className="grid grid-cols-3 gap-2">
              {JOINTS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setJoint(j)}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${joint === j ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-slate-700 border-slate-200'}`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="mobility-pain" className="text-xs font-bold text-slate-700">
              Dor ao fazer o movimento: {pain} de 10
            </label>
            <input
              id="mobility-pain"
              type="range"
              min={0}
              max={10}
              value={pain}
              onChange={(e) => setPain(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      }
      getContext={() => contextRef.current}
      manual={{
        title: 'Como Fazer a Avaliação de Mobilidade',
        brisaMessage: 'Vou olhar a sua foto no ponto máximo do movimento e estimar a amplitude da articulação.',
        steps: [
          { title: 'Apoie o Celular', description: 'Deixe o celular em uma mesa ou estante onde ele possa te ver inteiro.', icon: '📱', colorClass: 'bg-blue-50' },
          { title: 'Fique de Lado', description: 'Afaste-se uns 2 metros e fique de lado para a câmera.', icon: '🧍', colorClass: 'bg-green-50' },
          { title: 'Boa Luz', description: 'Evite ficar contra a janela, acenda as luzes do ambiente.', icon: '💡', colorClass: 'bg-yellow-50' },
          { title: 'Segure a Posição', description: 'Toque no botão, faça o movimento até o seu limite e fique parado até a contagem acabar.', icon: '🦾', colorClass: 'bg-purple-50' },
        ],
      }}
      facingMode="user"
      cameraHint="Toque no botão, vá até o limite do movimento e fique parado até a contagem acabar"
      countdownSeconds={8}
      onComplete={onComplete}
    />
  );
}
