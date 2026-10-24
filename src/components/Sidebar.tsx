import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Logo";
import { Home, LogOut } from "lucide-react";

// Import custom hand-drawn botanical icons
import galleryIcon from "../assets/icons/gallery.png";
import calendarIcon from "../assets/icons/calendar.png";
import ideasIcon from "../assets/icons/ideas.png";
import deviationsIcon from "../assets/icons/deviations.png";
import inboxIcon from "../assets/icons/inbox.png";
import settingsIcon from "../assets/icons/settings.png";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/galeria", label: "Block Gallery", icon: galleryIcon },
  { path: "/calendario", label: "General Calendar", icon: calendarIcon },
  { path: "/ideias", label: "Future Ideas", icon: ideasIcon },
  { path: "/desvios", label: "Deviation Board", icon: deviationsIcon },
  { path: "/triagem", label: "Inbox", icon: inboxIcon },
  { path: "/configuracoes", label: "Settings", icon: settingsIcon },
];

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  return (
    <aside className="w-[280px] bg-sidebar border-r border-outline-variant flex flex-col relative z-50">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant">
        <div className="flex items-center gap-3 mb-2">
          <Logo className="w-8 h-8 text-primary" />
          <h1 className="text-headline-sm font-playfair font-normal text-on-surface">
            Broto
          </h1>
        </div>
        <p className="text-label-sm text-on-surface-variant">
          Sanctuary for your mind
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6">
        {/* MEU DIA section */}
        <div className="space-y-2">
          <p className="text-label-sm text-on-surface-variant font-medium px-4 uppercase tracking-wide">
            Meu Dia
          </p>
          <a
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === "/" || pathname === "/dashboard"
                ? "bg-primary-container text-on-primary-container font-medium"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <Home size={20} />
            <span className="text-body-md">Home</span>
          </a>
        </div>

        {/* ORGANIZAR section */}
        <div className="space-y-2">
          <p className="text-label-sm text-on-surface-variant font-medium px-4 uppercase tracking-wide">
            Organizar
          </p>
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-container text-on-primary-container font-medium"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <img src={item.icon} alt="" className="w-6 h-6 object-contain" />
                  <span className="text-body-md">{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer - User Profile */}
      <div className="p-4 border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
        >
          {/* Avatar with initials */}
          <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-medium text-label-md flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          {/* User info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-body-sm font-medium text-on-surface truncate">
              {user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-label-xs text-error truncate font-bold">
              Sair
            </p>
          </div>
          {/* Logout icon */}
          <LogOut size={18} className="flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
};
