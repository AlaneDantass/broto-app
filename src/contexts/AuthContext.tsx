import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { TERMS_VERSION } from "../components/LegalContent";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "github" | "google") => Promise<void>;
  signOut: () => Promise<void>;
  /** Registra o aceite da Política de Privacidade e dos Termos no perfil do usuário. */
  acceptTerms: () => Promise<void>;
  /** Indica se o usuário já aceitou a versão atual dos termos. */
  termsAccepted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Mantém a mesma referência de `user` quando o id não muda (ex: refresh
        // automático de token ao voltar para a aba). Isso evita que os hooks de
        // dados, que dependem de `user` no array de dependências, refaçam o
        // fetch e derrubem modais abertos com dados ainda não salvos.
        setUser((prevUser) => {
          const nextUser = session?.user || null;
          if (prevUser?.id === nextUser?.id) return prevUser;
          return nextUser;
        });
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithOAuth = async (provider: "github" | "google") => {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    const redirectTo = isTauri ? "broto://auth-callback" : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const acceptTerms = async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        termos_versao: TERMS_VERSION,
        termos_aceitos_em: new Date().toISOString(),
      },
    });
    if (error) throw error;
    if (data.user) setUser(data.user);
  };

  const termsAccepted = user?.user_metadata?.termos_versao === TERMS_VERSION;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        acceptTerms,
        termsAccepted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
