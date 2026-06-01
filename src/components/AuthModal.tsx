import React, { useState } from "react";
import { useStore } from "../store";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, X } from "lucide-react";

interface AuthModalProps {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  onClose: () => void;
}

export function AuthModal({ mode, setMode, onClose }: AuthModalProps) {
  const { login, register, authError, clearError } = useStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    let success = false;
    if (mode === "login") {
      success = await login({ login: email || username, password });
    } else {
      success = await register({ 
        email, 
        username, 
        displayName, 
        password 
      });
    }

    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-graphite border border-graphite-light rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden my-auto">
        {/* Aesthetic design top garnish */}
        <div className="h-1 bg-gradient-to-r from-garnet to-garnet-light w-full" />
        
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200 cursor-pointer z-10"
          title="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-garnet/10 flex items-center justify-center mx-auto mb-2.5">
              <Sparkles className="w-6 h-6 text-garnet" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {mode === "login" ? "Вход на платформу" : "Создать аккаунт"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {mode === "login" ? "Рады видеть вас снова на 25-м Кадре" : "Присоединяйтесь к сообществу рецензентов"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Имя в профиле (Отображаемое)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Александр Киноман"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-graphite-dark border border-graphite-light rounded-lg py-2.5 pl-9 pr-4 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-garnet transition"
                    />
                    <User className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Никнейм (Уникальный, латиницей)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="kinoman_25"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-graphite-dark border border-graphite-light rounded-lg py-2.5 pl-9 pr-4 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-garnet transition"
                    />
                    <User className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-600" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {mode === "login" ? "Никнейм или Электронная почта" : "Электронная почта"}
              </label>
              <div className="relative">
                <input
                  type={mode === "login" ? "text" : "email"}
                  required
                  placeholder={mode === "login" ? "critic_99 или critic@example.com" : "your@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-graphite-dark border border-graphite-light rounded-lg py-2.5 pl-9 pr-4 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-garnet transition"
                />
                <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-graphite-dark border border-graphite-light rounded-lg py-2.5 pl-9 pr-10 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-garnet transition"
                />
                <Lock className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-600" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="bg-garnet/20 border border-garnet/40 p-2.5 rounded-lg flex items-start gap-2 text-xs text-gray-200">
                <AlertCircle className="w-4 h-4 text-garnet shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-garnet hover:bg-garnet-light disabled:bg-graphite-light text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Проверка данных...</span>
                </>
              ) : (
                <span>{mode === "login" ? "Войти в систему" : "Зарегистрироваться"}</span>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-5 pt-4 border-t border-graphite-light text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                clearError();
              }}
              className="text-xs text-gray-400 hover:text-garnet font-medium transition cursor-pointer"
            >
              {mode === "login" 
                ? "Впервые здесь? Зарегистрируйтесь сейчас" 
                : "Уже есть аккаунт? Войдите"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
