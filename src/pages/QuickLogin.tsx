import React, { useState, useEffect } from "react";
import { Mail, Lock, Globe, MapPin, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function QuickLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding (mock - in production use real API)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setLocation({
              latitude,
              longitude,
              country: data.address?.country || "Unknown",
              city: data.address?.city || data.address?.town || "Unknown",
              countryCode: data.address?.country_code?.toUpperCase() || "XX",
            });
          } catch (err) {
            setLocation({
              latitude,
              longitude,
              country: "Unknown",
              city: "Unknown",
              countryCode: "XX",
            });
          }
        },
        (error) => {
          console.log("Geolocation error:", error);
          setLocation({
            country: "Não detectado",
            city: "Não detectado",
            countryCode: "XX",
          });
        }
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate login
    setTimeout(() => {
      if (email && password) {
        // In production, call actual API
        console.log("Login com:", { email, password, location });
        setLoading(false);
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError("Por favor, preencha todos os campos");
        setLoading(false);
      }
    }, 1000);
  };

  const getCountryFlag = (code: string) => {
    const codePoints = code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: BLISS_COLORS.gray[50] }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌿</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
            Planta & Raiz
          </h1>
          <p className="text-gray-600">Democratizando o acesso a medicamentos à base de cannabis</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg border p-8" style={{ borderColor: BLISS_COLORS.primary[200] }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: BLISS_COLORS.primary[700] }}>
            Entrar na Plataforma
          </h2>

          {/* Location Info */}
          {location && (
            <div
              className="p-4 rounded-lg mb-6 flex items-center gap-3"
              style={{ backgroundColor: BLISS_COLORS.primary[50] }}
            >
              <MapPin className="w-5 h-5" style={{ color: BLISS_COLORS.primary[500] }} />
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                  {getCountryFlag(location.countryCode)} {location.country}
                </p>
                <p className="text-xs text-gray-600">{location.city}</p>
              </div>
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg mb-4 bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: BLISS_COLORS.primary[200],
                    "--tw-ring-color": BLISS_COLORS.primary[500],
                  } as any}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: BLISS_COLORS.primary[200],
                    "--tw-ring-color": BLISS_COLORS.primary[500],
                  } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded"
                style={{ accentColor: BLISS_COLORS.primary[500] }}
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Lembrar-me neste dispositivo
              </label>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition"
              style={{
                backgroundColor: BLISS_COLORS.primary[500],
                opacity: loading ? 0.7 : 1,
              }}
            >
              <LogIn className="w-5 h-5" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm hover:underline"
                style={{ color: BLISS_COLORS.primary[600] }}
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: BLISS_COLORS.primary[200] }}></div>
            <span className="text-sm text-gray-600">ou</span>
            <div className="flex-1 h-px" style={{ backgroundColor: BLISS_COLORS.primary[200] }}></div>
          </div>

          {/* Social Login */}
          <div className="space-y-2">
            <button
              type="button"
              className="w-full py-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition hover:bg-gray-50"
              style={{ borderColor: BLISS_COLORS.primary[200] }}
            >
              🔵 Entrar com Google
            </button>
            <button
              type="button"
              className="w-full py-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition hover:bg-gray-50"
              style={{ borderColor: BLISS_COLORS.primary[200] }}
            >
              🔷 Entrar com Microsoft
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem conta?{" "}
              <button className="font-bold hover:underline" style={{ color: BLISS_COLORS.primary[600] }}>
                Cadastre-se agora
              </button>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>🔒 Seus dados estão protegidos com criptografia de ponta a ponta</p>
          <p className="mt-2">
            Ao entrar, você concorda com nossos{" "}
            <button className="hover:underline" style={{ color: BLISS_COLORS.primary[600] }}>
              Termos de Serviço
            </button>{" "}
            e{" "}
            <button className="hover:underline" style={{ color: BLISS_COLORS.primary[600] }}>
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
