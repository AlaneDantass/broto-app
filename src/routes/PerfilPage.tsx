import React, { useState, useEffect, useRef } from "react";
import { usePerfil } from "../hooks/usePerfil";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Card, SkeletonLoader } from "../components";
import { Upload, X, CheckCircle2, User as UserIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
const NEURODIVERGENCIAS_PADRAO = [
  "TDAH",
  "TEA/Autismo",
  "Dislexia",
  "Discalculia",
  "Dispraxia"
];

export const PerfilPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };
  const { perfil, loading, updatePerfil, updateAvatar } = usePerfil();
  const { t } = useLanguage();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNeurodivergent, setIsNeurodivergent] = useState(false);
  const [selectedNeuro, setSelectedNeuro] = useState<string[]>([]);
  const [otherNeuro, setOtherNeuro] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (perfil) {
      setFirstName(perfil.primeiro_nome || "");
      setLastName(perfil.sobrenome || "");
      setIsNeurodivergent(perfil.neurodivergente || false);
      setSelectedNeuro(perfil.neurodivergencias || []);
      
      // Encontrar "outros" itens que não estão na lista padrão
      const outras = (perfil.neurodivergencias || []).filter(
        n => !NEURODIVERGENCIAS_PADRAO.includes(n)
      );
      if (outras.length > 0) {
        setOtherNeuro(outras.join(", "));
      }
    }
  }, [perfil]);

  const handleNeuroToggle = (neuro: string) => {
    setSelectedNeuro(prev => 
      prev.includes(neuro) 
        ? prev.filter(n => n !== neuro)
        : [...prev, neuro]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tamanho (limite de 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t("profile.errorAvatarSize"));
      return;
    }

    try {
      setErrorMessage("");
      await updateAvatar(file);
      setSuccessMessage(t("profile.successAvatar"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(t("profile.errorAvatarUpload") + (err.message || ""));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      // 1. Atualizar Perfil
      let neuroToSave = [...selectedNeuro];
      
      // Processar campo "outro"
      if (isNeurodivergent && otherNeuro.trim()) {
        const outrosArray = otherNeuro.split(',').map(s => s.trim()).filter(Boolean);
        // Adicionar apenas os que já não estão na lista
        outrosArray.forEach(o => {
          if (!neuroToSave.includes(o)) {
            neuroToSave.push(o);
          }
        });
      }

      await updatePerfil({
        primeiro_nome: firstName,
        sobrenome: lastName,
        neurodivergente: isNeurodivergent,
        neurodivergencias: isNeurodivergent ? neuroToSave : [],
      });

      // 2. Atualizar Auth (Email e Senha se foram alterados)
      if (email !== user?.email || password) {
        const updates: any = {};
        if (email !== user?.email) updates.email = email;
        if (password) updates.password = password;

        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) throw authError;
      }

      setSuccessMessage(t("profile.successSave"));
      setPassword(""); // Limpar campo de senha após salvar
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(t("profile.errorSave") + (err.message || "Erro desconhecido"));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-headline-lg font-playfair mb-6">{t("profile.title")}</h1>
        <SkeletonLoader variant="card" lines={8} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h1 className="text-headline-lg text-on-surface font-playfair border-b border-outline-variant pb-4">
        {t("profile.title")}
      </h1>

      {successMessage && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg flex items-center gap-2">
          <X size={20} />
          {errorMessage}
        </div>
      )}

      <Card className="space-y-8">
        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-surface-variant overflow-hidden border-2 border-outline-variant flex items-center justify-center shrink-0">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={40} className="text-on-surface-variant" />
            )}
          </div>
          <div>
            <h3 className="text-title-md font-medium text-on-surface mb-2">{t("profile.picture")}</h3>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary flex items-center gap-2 py-2 px-4"
              >
                <Upload size={18} />
                {t("profile.uploadImage")}
              </button>
              {perfil?.avatar_url && (
                <button 
                  onClick={async () => {
                    await updatePerfil({ avatar_url: null });
                  }}
                  className="btn-outline py-2 px-4 text-error border-error/50 hover:bg-error/10"
                >
                  {t("profile.removeImage")}
                </button>
              )}
            </div>
            <p className="text-body-sm text-on-surface-variant mt-2">
              {t("profile.imageSupportInfo")}
            </p>
          </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-label-md text-on-surface font-medium mb-2">{t("profile.firstName")}</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Dianne"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-label-md text-on-surface font-medium mb-2">{t("profile.lastName")}</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Russell"
              className="input w-full"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-label-md text-on-surface font-medium mb-2">{t("profile.email")}</label>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full md:w-2/3"
            />
            <button className="btn-outline shrink-0">{t("profile.editEmail")}</button>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-2">
            {t("profile.emailInfo")}
          </p>
        </div>

        <hr className="border-outline-variant my-8" />

        {/* Password */}
        <div>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h3 className="text-title-md font-medium text-on-surface mb-1">{t("profile.password")}</h3>
              <p className="text-body-sm text-on-surface-variant">
                {t("profile.passwordInfo")}
              </p>
            </div>
            <div className="w-full sm:w-72 flex flex-col gap-2 shrink-0">
              <input 
                type="password"
                placeholder={t("profile.newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <hr className="border-outline-variant my-8" />

        {/* Neurodivergence */}
        <div>
          <h3 className="text-title-md font-medium text-on-surface mb-4">{t("profile.neuroTitle")}</h3>
          
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input 
              type="checkbox"
              checked={isNeurodivergent}
              onChange={(e) => setIsNeurodivergent(e.target.checked)}
              className="w-5 h-5 rounded border-outline focus:ring-primary text-primary"
            />
            <span className="text-body-md text-on-surface">{t("profile.isNeuro")}</span>
          </label>

          {isNeurodivergent && (
            <div className="bg-surface-variant/30 p-4 rounded-xl space-y-4 border border-outline-variant ml-8">
              <p className="text-body-sm text-on-surface-variant">
                {t("profile.neuroSelectAll")}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {NEURODIVERGENCIAS_PADRAO.map(neuro => (
                  <label key={neuro} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedNeuro.includes(neuro)}
                      onChange={() => handleNeuroToggle(neuro)}
                      className="w-4 h-4 rounded border-outline focus:ring-primary text-primary"
                    />
                    <span className="text-body-sm text-on-surface">{neuro}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant">
                <label className="block text-label-sm text-on-surface mb-2">{t("profile.otherNeuro")}</label>
                <input 
                  type="text" 
                  value={otherNeuro}
                  onChange={(e) => setOtherNeuro(e.target.value)}
                  placeholder="Ex: TCI, Disgrafia"
                  className="input w-full text-sm py-2"
                />
              </div>
            </div>
          )}
        </div>

      </Card>
      
      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 py-4 border-t border-outline-variant/40 mt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-error hover:bg-error/10 border border-error/30 rounded-lg transition-colors font-bold text-label-md cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        <div className="flex justify-end items-center gap-3">
        <button 
          onClick={() => {
            // Reset to last saved state
            if (perfil) {
              setFirstName(perfil.primeiro_nome || "");
              setLastName(perfil.sobrenome || "");
              setIsNeurodivergent(perfil.neurodivergente || false);
              setSelectedNeuro(perfil.neurodivergencias || []);
            }
            if (user) setEmail(user.email || "");
            setPassword("");
          }}
          className="btn-outline px-6"
          disabled={isSaving}
        >
          {t("profile.cancel")}
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary px-8 min-w-[120px]"
        >
          {isSaving ? t("profile.saving") : t("profile.save")}
        </button>
        </div>
      </div>
    </div>
  );
};
