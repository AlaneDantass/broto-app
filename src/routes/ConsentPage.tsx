import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/Logo";
import { PrivacyContent, TermsContent } from "../components/LegalContent";

type Step = "privacidade" | "termos";

const STEPS: Record<
  Step,
  { title: string; intro: string; checkbox: string; action: string }
> = {
  privacidade: {
    title: "POLÍTICA DE PRIVACIDADE",
    intro:
      "Bem-vindo(a) ao Broto. Sua privacidade é importante para nós. Leia atentamente como tratamos seus dados conforme a LGPD (Lei nº 13.709/2018).",
    checkbox: "Li e concordo com a Política de Privacidade.",
    action: "Continuar",
  },
  termos: {
    title: "TERMOS DE SERVIÇO",
    intro:
      "Para usar o Broto, leia e aceite os Termos de Serviço abaixo. Eles definem as regras de uso do aplicativo.",
    checkbox: "Li e concordo com os Termos de Serviço e com a Política de Privacidade.",
    action: "Aceitar e entrar",
  },
};

/**
 * Tela exibida após o primeiro login/cadastro (e quando os termos mudam).
 * O usuário precisa aceitar a Política de Privacidade e os Termos para acessar o app.
 */
export const ConsentPage: React.FC = () => {
  const { acceptTerms, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("privacidade");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = STEPS[step];

  const handleCancel = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login");
    }
  };

  const handleContinue = async () => {
    if (!agreed) return;
    if (step === "privacidade") {
      setStep("termos");
      setAgreed(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await acceptTerms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível registrar o aceite. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface rounded-xl shadow-sm border border-outline-variant p-6 md:p-8 space-y-5">
        <div className="text-center space-y-2">
          <Logo className="w-12 h-12 mx-auto" />
          <h1 className="text-[20px] leading-tight font-playfair text-on-surface tracking-wide">
            {current.title}
          </h1>
          <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-lg mx-auto">
            {current.intro}
          </p>
          <p className="text-[10px] text-on-surface-variant font-dm-sans">
            Etapa {step === "privacidade" ? 1 : 2} de 2
          </p>
        </div>

        <div
          key={step}
          className="h-72 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-4"
        >
          {step === "privacidade" ? <PrivacyContent /> : <TermsContent />}
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4"
          />
          <span className="text-[11px] text-on-surface font-dm-sans">{current.checkbox}</span>
        </label>

        {error && (
          <div className="p-3 bg-error-container border border-error rounded-lg">
            <p className="text-[11px] text-on-error-container">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 font-dm-sans">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-5 py-2 text-[12px] border border-outline rounded-full text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!agreed || saving}
            className="px-5 py-2 text-[12px] font-medium bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : current.action}
          </button>
        </div>
      </div>
    </div>
  );
};
