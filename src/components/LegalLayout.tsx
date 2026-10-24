import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-3">
    <h2 className="text-title-lg font-playfair text-on-surface">{title}</h2>
    <div className="space-y-3 text-body-md text-on-surface-variant leading-relaxed">{children}</div>
  </section>
);

/**
 * Layout das páginas públicas (Termos e Privacidade), seguindo o mesmo
 * padrão visual da tela de login (AuthPage).
 */
export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, updatedAt, children }) => (
  <div className="min-h-screen bg-gradient-to-br from-surface-container to-surface p-4 md:p-8">
    <div className="w-full max-w-3xl mx-auto bg-surface rounded-xl shadow-sm border border-outline-variant p-6 md:p-10 space-y-8">
      <header className="flex items-center gap-4">
        <Link to="/login" aria-label="Voltar ao Broto">
          <Logo className="w-14 h-14" />
        </Link>
        <div>
          <h1 className="text-headline-md font-playfair text-on-surface">{title}</h1>
          <p className="text-body-sm text-on-surface-variant font-dm-sans">
            Última atualização: {updatedAt}
          </p>
        </div>
      </header>

      {children}

      <footer className="pt-6 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3 font-dm-sans text-body-sm">
        <Link to="/login" className="text-primary font-medium hover:underline">
          Voltar ao Broto
        </Link>
        <div className="flex gap-4 text-on-surface-variant">
          <Link to="/privacidade" className="hover:underline">
            Política de Privacidade
          </Link>
          <Link to="/termos" className="hover:underline">
            Termos de Serviço
          </Link>
        </div>
      </footer>
    </div>
  </div>
);
