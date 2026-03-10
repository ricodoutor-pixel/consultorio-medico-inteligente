import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Stethoscope, ShoppingCart } from 'lucide-react';

/**
 * PÁGINA DE LOGIN/TESTE
 * ✅ Testar como PACIENTE
 * ✅ Testar como MÉDICO
 * ✅ Testar como LOJA
 */

export function TestLogin() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'paciente' | 'medico' | 'loja' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simular login
    const userData = {
      id: Math.random().toString(36).substring(7),
      email,
      userType,
      name: userType === 'paciente' ? 'João Silva' : userType === 'medico' ? 'Dr. Maria Santos' : 'Loja Cannabis',
      role: userType
    };

    // Salvar em localStorage
    localStorage.setItem('user', JSON.stringify(userData));

    // Redirecionar baseado no tipo
    if (userType === 'paciente') {
      navigate('/telemedicina');
    } else if (userType === 'medico') {
      navigate('/adm/consultas');
    } else if (userType === 'loja') {
      navigate('/shopping');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Planta & Raiz</h1>
          <p className="text-slate-400 text-sm md:text-base">Telemedicina Cannabis Medicinal</p>
        </div>

        {/* Seleção de tipo de usuário */}
        {!userType ? (
          <div className="space-y-4">
            <p className="text-white text-center font-semibold mb-6 text-sm md:text-base">
              Escolha seu tipo de acesso:
            </p>

            {/* Paciente */}
            <button
              onClick={() => setUserType('paciente')}
              className="w-full p-4 md:p-6 bg-slate-800 hover:bg-slate-700 border-2 border-green-500/50 hover:border-green-500 rounded-lg transition-all group"
            >
              <User size={32} className="text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-base md:text-lg mb-1">Paciente</h3>
              <p className="text-slate-400 text-xs md:text-sm">Agendar consulta, receber prescrição</p>
            </button>

            {/* Médico */}
            <button
              onClick={() => setUserType('medico')}
              className="w-full p-4 md:p-6 bg-slate-800 hover:bg-slate-700 border-2 border-blue-500/50 hover:border-blue-500 rounded-lg transition-all group"
            >
              <Stethoscope size={32} className="text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-base md:text-lg mb-1">Médico</h3>
              <p className="text-slate-400 text-xs md:text-sm">Gerenciar consultas, prescrever</p>
            </button>

            {/* Loja */}
            <button
              onClick={() => setUserType('loja')}
              className="w-full p-4 md:p-6 bg-slate-800 hover:bg-slate-700 border-2 border-purple-500/50 hover:border-purple-500 rounded-lg transition-all group"
            >
              <ShoppingCart size={32} className="text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-base md:text-lg mb-1">Loja</h3>
              <p className="text-slate-400 text-xs md:text-sm">Vender produtos cannabis</p>
            </button>
          </div>
        ) : (
          /* Formulário de login */
          <form onSubmit={handleLogin} className="bg-slate-800 rounded-lg p-6 md:p-8 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setUserType(null);
                setEmail('');
                setPassword('');
              }}
              className="text-slate-400 hover:text-white text-sm mb-4 transition-colors"
            >
              ← Voltar
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              Login {userType === 'paciente' ? 'Paciente' : userType === 'medico' ? 'Médico' : 'Loja'}
            </h2>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-white text-sm md:text-base font-semibold mb-2">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    userType === 'paciente'
                      ? 'joao@example.com'
                      : userType === 'medico'
                      ? 'dra.maria@example.com'
                      : 'loja@example.com'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none text-sm md:text-base"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="mb-6">
              <label className="block text-white text-sm md:text-base font-semibold mb-2">Senha</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none text-sm md:text-base"
                  required
                />
              </div>
            </div>

            {/* Botão de login */}
            <button
              type="submit"
              className="w-full py-3 md:py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors text-base md:text-lg"
            >
              Entrar
            </button>

            {/* Info de teste */}
            <div className="mt-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
              <p className="text-slate-300 text-xs md:text-sm">
                <strong>Teste:</strong> Use qualquer email e senha para testar
              </p>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-xs md:text-sm">
          <p>🔒 Dados de teste - Não use informações reais</p>
        </div>
      </div>
    </div>
  );
}
