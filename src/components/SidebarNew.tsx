import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Layout,
  Calendar,
  Lightbulb,
  Inbox,
  Kanban,
  Settings,
  LogOut,
  ChevronRight,
  Home,
  User,
  HelpCircle,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "../contexts/LanguageContext";
import { usePerfil } from "../hooks/usePerfil";
import { HelpModal } from "./HelpModal";

interface NavItem {
  path: string;
  key: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", key: "sidebar.home", icon: <Home size={20} /> },
  { path: "/galeria", key: "sidebar.gallery", icon: <Layout size={20} /> },
  {
    path: "/calendario",
    key: "sidebar.calendar",
    icon: <Calendar size={20} />,
  },
  {
    path: "/ideias",
    key: "sidebar.ideas",
    icon: <Lightbulb size={20} />,
  },
  {
    path: "/desvios",
    key: "sidebar.deviations",
    icon: <Kanban size={20} />,
  },
  { path: "/triagem", key: "sidebar.inbox", icon: <Inbox size={20} /> },
  { path: "/perfil", key: "sidebar.profile", icon: <User size={20} /> },
  { path: "/configuracoes", key: "sidebar.settings", icon: <Settings size={20} /> },
];

export const SidebarNew: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { perfil, updatePerfil } = usePerfil();

  React.useEffect(() => {
    if (perfil && perfil.ajuda_visualizada === false) {
      setShowHelpTooltip(true);
    } else {
      setShowHelpTooltip(false);
    }
  }, [perfil]);

  const handleOpenHelp = async () => {
    setIsHelpModalOpen(true);
    if (perfil && perfil.ajuda_visualizada === false) {
      setShowHelpTooltip(false);
      try {
        await updatePerfil({ ajuda_visualizada: true });
      } catch (err) {
        console.error("Failed to update ajuda_visualizada", err);
      }
    }
  };

  const handleDismissTooltip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHelpTooltip(false);
    if (perfil && perfil.ajuda_visualizada === false) {
      try {
        await updatePerfil({ ajuda_visualizada: true });
      } catch (err) {
        console.error("Failed to update ajuda_visualizada", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  return (
    <div
      className={`bg-sidebar rounded-2xl shadow-lg flex flex-col gap-1.5 p-2.5 transition-all duration-300 flex-shrink-0 ${
        isExpanded ? "w-56" : "w-20"
      }`}
    >
      {/* Logo e nome do app */}
      <button
        onClick={() => navigate("/")}
        className={`group flex items-center hover:opacity-90 transition-opacity cursor-pointer ${
          isExpanded ? "gap-3 justify-start px-2 py-1" : "justify-center"
        }`}
        title={t("sidebar.backToDashboard")}
      >
        <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center overflow-hidden flex-shrink-0">
          <Logo className="w-10 h-10 scale-[1.35] transition-transform group-hover:scale-[1.45]" mono />
        </div>
        <span
          className={`text-headline-sm font-playfair text-on-sidebar transition-all duration-300 overflow-hidden ${
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 h-0"
          }`}
        >
          Broto
        </span>
      </button>

      {/* Toggle expandir */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-1.5 rounded-lg text-on-sidebar hover:bg-on-sidebar/10 transition-colors ${
          isExpanded ? "mr-auto ml-2" : "mx-auto"
        }`}
        title={isExpanded ? t("sidebar.collapse") : t("sidebar.expand")}
      >
        <ChevronRight
          size={20}
          className={`transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Separador */}
      <div className="w-full h-px bg-on-sidebar opacity-20" />

      {/* Ícones de navegação */}
      <nav className="flex-1 flex flex-col gap-1 items-center justify-start overflow-y-auto overflow-x-hidden w-full scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const translatedLabel = t(item.key);
          return (
            <a
              key={item.path}
              href={item.path}
              className={`w-full flex items-center ${isExpanded ? "justify-start px-3 gap-3" : "justify-center"} py-2 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-on-sidebar text-sidebar"
                  : "text-on-sidebar text-opacity-60 hover:text-opacity-100 hover:bg-on-sidebar/5"
              }`}
              title={translatedLabel}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span
                className={`text-body-sm font-medium transition-opacity duration-300 overflow-hidden ${
                  isExpanded ? "opacity-100" : "opacity-0 w-0 h-0"
                }`}
              >
                {translatedLabel}
              </span>
            </a>
          );
        })}
      </nav>

      {/* Separador inferior */}
      <div className="w-full h-px bg-on-sidebar opacity-20" />

      {/* Ajuda (Help) */}
      <div className="relative">
        {showHelpTooltip && (
          <div className={`absolute bottom-full mb-2 ${isExpanded ? "left-0" : "left-full ml-4"} bg-primary text-on-primary text-sm p-3 rounded-lg shadow-lg z-50 animate-in fade-in duration-300 w-48`}>
            <button 
              onClick={handleDismissTooltip}
              className="absolute top-1 right-1 text-on-primary/70 hover:text-on-primary"
            >
              <X size={14} />
            </button>
            <p className="pr-4 leading-tight">{t("help.tooltipMsg")}</p>
            {isExpanded ? (
              <div className="absolute -bottom-2 left-4 w-3 h-3 bg-primary transform rotate-45"></div>
            ) : (
              <div className="absolute top-4 -left-1.5 w-3 h-3 bg-primary transform rotate-45"></div>
            )}
          </div>
        )}
        
        {isExpanded ? (
          <button
            onClick={handleOpenHelp}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-sidebar text-opacity-60 hover:text-opacity-100 hover:bg-on-sidebar/10 transition-all"
            title={t("help.title")}
          >
            <HelpCircle size={18} className="flex-shrink-0" />
            <span className="text-body-sm font-medium">{t("help.title")}</span>
          </button>
        ) : (
          <button
            onClick={handleOpenHelp}
            className="w-full flex items-center justify-center p-2 rounded-lg text-on-sidebar text-opacity-60 hover:text-opacity-100 hover:bg-on-sidebar/10 transition-all"
            title={t("help.title")}
          >
            <HelpCircle size={18} />
          </button>
        )}
      </div>

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* User Profile / Logout no rodapé */}
      {isExpanded ? (
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-sidebar text-opacity-60 hover:text-opacity-100 hover:bg-on-sidebar/10 transition-all"
          title={t("sidebar.logout")}
        >
          {/* Avatar with initials */}
          <div className="w-8 h-8 rounded-md bg-on-sidebar bg-opacity-20 text-on-sidebar flex items-center justify-center font-medium text-label-xs flex-shrink-0 overflow-hidden">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.email?.[0]?.toUpperCase() || "A"
            )}
          </div>
          {/* User info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-label-sm font-medium text-on-sidebar truncate">
              {user?.email?.split("@")[0] || t("common.user")}
            </p>
            <p className="text-label-xs text-on-sidebar text-opacity-90 truncate font-bold">
              {t("sidebar.logout")}
            </p>
          </div>
        </button>
      ) : (
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center p-2 rounded-lg text-on-sidebar text-opacity-60 hover:text-opacity-100 hover:bg-on-sidebar/10 transition-all"
          title={t("sidebar.logout")}
        >
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
};
