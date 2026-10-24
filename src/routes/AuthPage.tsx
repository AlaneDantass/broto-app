import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/Logo";
import { useLanguage } from "../contexts/LanguageContext";

type AuthMode = "login" | "signup";

export const AuthPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    setLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Erro ao entrar com o ${provider}. Tente novamente.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate("/");
      } else {
        if (password !== confirmPassword) {
          setError("As senhas não conferem");
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setIsEmailSent(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao autenticar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center bg-surface-container rounded-xl p-8 shadow-sm border border-outline-variant">
          <Logo className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-headline-md font-playfair text-on-surface mb-4">
            {t("auth.confirmEmailTitle")}
          </h2>
          <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
            {language === "en" ? (
              <>
                We sent an activation link to <strong className="text-on-surface">{email}</strong>. 
                Please check your inbox (and spam folder) to activate your account.
              </>
            ) : (
              <>
                Enviamos um link de ativação para <strong className="text-on-surface">{email}</strong>. 
                Por favor, verifique sua caixa de entrada (e a pasta de spam) para ativar sua conta.
              </>
            )}
          </p>
          <button
            onClick={() => {
              setMode("login");
              setIsEmailSent(false);
              setEmail("");
              setPassword("");
              setConfirmPassword("");
            }}
            className="px-6 py-3 bg-primary text-on-primary rounded-full hover:bg-primary-container font-dm-sans font-medium transition-colors"
          >
            {t("auth.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left: Illustration in organic blob */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-surface-container to-surface">
        <div className="relative w-80 h-96 rounded-full bg-surface-container-high shadow-lg flex items-center justify-center overflow-hidden">
          {/* Placeholder for botanical illustration */}
          <div className="text-center">
            <Logo className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-headline-md font-playfair text-on-surface mb-2">
              {t("auth.title")}
            </h1>

          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-headline-md font-playfair text-on-surface mb-2">
            {mode === "login" ? t("auth.login") : t("auth.signup")}
          </h2>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant transition-colors"
                placeholder={language === "en" ? "you@example.com" : "voce@exemplo.com"}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">
                {t("auth.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">
                  {t("task.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-container-low border-b border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-error-container border border-error rounded-lg">
                <p className="text-body-sm text-on-error-container">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-full font-dm-sans font-medium text-body-md hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? t("auth.login")
                  : t("auth.signup")}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="mx-4 text-label-sm text-on-surface-variant font-dm-sans uppercase">{t("auth.or")}</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 bg-surface-container border border-outline hover:bg-surface-container-high rounded-full font-dm-sans font-medium text-body-sm text-on-surface transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 bg-surface-container border border-outline hover:bg-surface-container-high rounded-full font-dm-sans font-medium text-body-sm text-on-surface transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </button>
            </div>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="text-primary font-medium text-body-sm hover:underline"
            >
              {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
            </button>
          </div>

          {/* Links legais */}
          <div className="mt-6 flex items-center justify-center gap-4 text-label-sm text-on-surface-variant font-dm-sans">
            <Link to="/privacidade" className="hover:underline">
              Política de Privacidade
            </Link>
            <span aria-hidden="true">•</span>
            <Link to="/termos" className="hover:underline">
              Termos de Serviço
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
