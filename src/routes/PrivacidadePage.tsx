import React from "react";
import { Link } from "react-router-dom";

export const PrivacidadePage: React.FC = () => (
  <div className="min-h-screen bg-surface text-on-surface">
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <header className="space-y-2">
        <h1 className="text-headline-lg font-playfair">Política de Privacidade — Broto</h1>
        <p className="text-body-sm text-on-surface-variant">
          Última atualização: 24 de outubro de 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">1. Sobre o Broto</h2>
        <p className="text-body-md">
          O Broto é um aplicativo de organização pessoal (blocos, tarefas, calendário e quadro de
          rotina semanal). Esta política explica quais dados coletamos, como os usamos e quais são
          os seus direitos, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº
          13.709/2018).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">2. Dados que coletamos</h2>
        <ul className="list-disc pl-6 space-y-1 text-body-md">
          <li>
            <strong>Dados de conta:</strong> e-mail, nome e foto de perfil informados no cadastro.
          </li>
          <li>
            <strong>Conteúdo criado por você:</strong> blocos, tarefas, ideias, eventos, atividades
            do quadro de rotina e preferências de configuração.
          </li>
          <li>
            <strong>Dados do Google Agenda (opcional):</strong> se você optar por conectar sua conta
            Google, acessamos o seu endereço de e-mail e os eventos do seu calendário principal
            (título, data e horário).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">3. Como usamos os dados do Google</h2>
        <p className="text-body-md">
          O acesso ao Google Agenda é usado <strong>exclusivamente</strong> para:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-body-md">
          <li>Exibir seus compromissos do Google Agenda no calendário e no quadro de rotina do Broto;</li>
          <li>Criar, atualizar e remover no Google Agenda os eventos que você criar no Broto.</li>
        </ul>
        <p className="text-body-md">
          O uso e a transferência das informações recebidas das APIs do Google pelo Broto seguem a{" "}
          <a
            className="underline text-primary"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de Uso Limitado. Não vendemos, não compartilhamos com terceiros
          e não usamos seus dados do Google para publicidade ou treinamento de modelos de IA.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">4. Armazenamento e segurança</h2>
        <p className="text-body-md">
          Os dados são armazenados na plataforma Supabase, com controle de acesso por usuário (Row
          Level Security). Os tokens de acesso ao Google ficam guardados apenas no servidor e nunca
          são expostos ao aplicativo no seu dispositivo. A comunicação ocorre via HTTPS.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">5. Compartilhamento</h2>
        <p className="text-body-md">
          Não compartilhamos seus dados pessoais com terceiros, exceto com os provedores de
          infraestrutura necessários ao funcionamento do serviço (Supabase e Vercel), que atuam
          como operadores de dados.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">6. Seus direitos</h2>
        <p className="text-body-md">Você pode, a qualquer momento:</p>
        <ul className="list-disc pl-6 space-y-1 text-body-md">
          <li>
            <strong>Desconectar o Google Agenda</strong> em Configurações → Integração com Google
            Agenda, o que remove os tokens armazenados;
          </li>
          <li>
            Revogar o acesso em{" "}
            <a
              className="underline text-primary"
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
            >
              myaccount.google.com/permissions
            </a>
            ;
          </li>
          <li>Solicitar acesso, correção ou exclusão dos seus dados e da sua conta.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">7. Contato</h2>
        <p className="text-body-md">
          Para dúvidas ou solicitações sobre privacidade, entre em contato:{" "}
          <a className="underline text-primary" href="mailto:alanedantass@gmail.com">
            alanedantass@gmail.com
          </a>
          .
        </p>
      </section>

      <footer className="pt-4">
        <Link to="/" className="underline text-primary text-body-md">
          Voltar ao Broto
        </Link>
      </footer>
    </div>
  </div>
);
