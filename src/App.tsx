import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SensorialProvider } from "./contexts/SensorialContext";
import { AuthPage } from "./routes/AuthPage";
import { DashboardPage } from "./routes/DashboardPage";
import { HojePage } from "./routes/HojePage";
import { GaleriaPage } from "./routes/GaleriaPage";
import { ArquivosBlocoPage } from "./routes/ArquivosBlocoPage";
import { BlocoDetailPage } from "./routes/BlocoDetailPage";
import { DesviosPage } from "./routes/DesviosPage";
import { CalendarioPage } from "./routes/CalendarioPage";
import { IdeiasPage } from "./routes/IdeiasPage";
import { TriagemPage } from "./routes/TriagemPage";
import { ConfiguracoesPage } from "./routes/ConfiguracoesPage";
import { PerfilPage } from "./routes/PerfilPage";
import { PrivacidadePage } from "./routes/PrivacidadePage";
import { TermosPage } from "./routes/TermosPage";
import { ConsentPage } from "./routes/ConsentPage";
import { SidebarNew, FloatingCaptureButton, NotificationBell } from "./components";
import { TransitionToast } from "./components/TransitionToast";
import { supabase } from "./lib/supabase";
import "./index.css";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-surface gap-4 p-4">
    <SidebarNew />
    <main className="flex-1 overflow-auto rounded-2xl bg-surface">
      <div className="p-8 w-full h-full">{children}</div>
    </main>
    <FloatingCaptureButton />
    <NotificationBell />
  </div>
);


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, termsAccepted } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!termsAccepted) {
    return <ConsentPage />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Inicializando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/privacidade" element={<PrivacidadePage />} />
      <Route path="/termos" element={<TermosPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/hoje"
                element={
                  <DashboardLayout>
                    <HojePage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/galeria"
                element={
                  <DashboardLayout>
                    <GaleriaPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/arquivo-blocos"
                element={
                  <DashboardLayout>
                    <ArquivosBlocoPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/bloco/:blocoId"
                element={
                  <DashboardLayout>
                    <BlocoDetailPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/desvios"
                element={
                  <DashboardLayout>
                    <DesviosPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/calendario"
                element={
                  <DashboardLayout>
                    <CalendarioPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/ideias"
                element={
                  <DashboardLayout>
                    <IdeiasPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/triagem"
                element={
                  <DashboardLayout>
                    <TriagemPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <DashboardLayout>
                    <ConfiguracoesPage />
                  </DashboardLayout>
                }
              />
              <Route
                path="/perfil"
                element={
                  <DashboardLayout>
                    <PerfilPage />
                  </DashboardLayout>
                }
              />
            </Routes>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function App() {
  useEffect(() => {
    if (!isTauri) return;

    const handleUrl = async (url: string) => {
      // A URL conterá os tokens em formato hash: broto://auth-callback#access_token=...
      if (url.includes("access_token")) {
        try {
          const parsedUrl = new URL(url.replace("broto://", "http://localhost/"));
          const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        } catch (err) {
          console.error("Erro ao processar URL de autenticação:", err);
        }
      }
    };

    let unsubscribeFn: (() => void) | undefined;

    const initDeepLink = async () => {
      try {
        const urls = await getCurrent();
        if (urls && urls.length > 0) {
          await handleUrl(urls[0]);
        }

        unsubscribeFn = await onOpenUrl((urls) => {
          if (urls && urls.length > 0) {
            handleUrl(urls[0]);
          }
        });
      } catch (err) {
        console.error("Falha ao inicializar o plugin de Deep Link:", err);
      }
    };

    initDeepLink();

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <SensorialProvider>
            <AppRoutes />
            <TransitionToast />
          </SensorialProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
