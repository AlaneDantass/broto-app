import React from "react";
import { LegalLayout, LegalSection } from "../components/LegalLayout";

const linkClass = "text-primary underline hover:opacity-80";

export const PrivacidadePage: React.FC = () => (
  <LegalLayout title="Política de Privacidade" updatedAt="24 de outubro de 2026">
    <LegalSection title="1. Sobre o Broto">
      <p>
        O Broto é um aplicativo de organização pessoal (blocos, tarefas, calendário e quadro de
        rotina semanal). Esta política explica quais dados coletamos, como os usamos e quais são
        os seus direitos, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº
        13.709/2018).
      </p>
    </LegalSection>

    <LegalSection title="2. Dados que coletamos">
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong className="text-on-surface">Dados de conta:</strong> e-mail, nome e foto de perfil
          informados no cadastro.
        </li>
        <li>
          <strong className="text-on-surface">Conteúdo criado por você:</strong> blocos, tarefas,
          ideias, eventos, atividades do quadro de rotina e preferências de configuração.
        </li>
        <li>
          <strong className="text-on-surface">Dados do Google Agenda (opcional):</strong> se você
          optar por conectar sua conta Google, acessamos o seu endereço de e-mail e os eventos do
          seu calendário principal (título, data e horário).
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="3. Como usamos os dados do Google">
      <p>
        O acesso ao Google Agenda é usado <strong className="text-on-surface">exclusivamente</strong>{" "}
        para:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Exibir seus compromissos do Google Agenda no calendário e no quadro de rotina do Broto;</li>
        <li>Criar, atualizar e remover no Google Agenda os eventos que você criar no Broto.</li>
      </ul>
      <p>
        O uso e a transferência das informações recebidas das APIs do Google pelo Broto seguem a{" "}
        <a
          className={linkClass}
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Política de Dados do Usuário dos Serviços de API do Google
        </a>
        , incluindo os requisitos de Uso Limitado. Não vendemos, não compartilhamos com terceiros e
        não usamos seus dados do Google para publicidade ou treinamento de modelos de IA.
      </p>
    </LegalSection>

    <LegalSection title="4. Armazenamento e segurança">
      <p>
        Os dados são armazenados na plataforma Supabase, com controle de acesso por usuário (Row
        Level Security). Os tokens de acesso ao Google ficam guardados apenas no servidor e nunca
        são expostos ao aplicativo no seu dispositivo. A comunicação ocorre via HTTPS.
      </p>
    </LegalSection>

    <LegalSection title="5. Compartilhamento">
      <p>
        Não compartilhamos seus dados pessoais com terceiros, exceto com os provedores de
        infraestrutura necessários ao funcionamento do serviço (Supabase e Vercel), que atuam como
        operadores de dados.
      </p>
    </LegalSection>

    <LegalSection title="6. Seus direitos">
      <p>Você pode, a qualquer momento:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong className="text-on-surface">Desconectar o Google Agenda</strong> em Configurações →
          Integração com Google Agenda, o que remove os tokens armazenados;
        </li>
        <li>
          Revogar o acesso em{" "}
          <a
            className={linkClass}
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
    </LegalSection>

    <LegalSection title="7. Contato">
      <p>
        Para dúvidas ou solicitações sobre privacidade, entre em contato:{" "}
        <a className={linkClass} href="mailto:alanedantass@gmail.com">
          alanedantass@gmail.com
        </a>
        .
      </p>
    </LegalSection>
  </LegalLayout>
);
