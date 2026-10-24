import React from "react";
import { LegalSection } from "./LegalLayout";

export const LEGAL_UPDATED_AT = "24 de outubro de 2026";
/** Versão dos termos aceitos. Altere ao mudar os textos para pedir novo aceite. */
export const TERMS_VERSION = "2026-10-24";

const linkClass = "text-primary underline hover:opacity-80";

export const PrivacyContent: React.FC = () => (
  <>
    <LegalSection title="1. Sobre o Broto">
      <p>
        O Broto é um aplicativo de organização pessoal (blocos, tarefas, calendário e quadro de
        rotina semanal). Esta política explica quais dados coletamos, como os usamos e quais são
        os seus direitos, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº
        13.709/2018).
      </p>
    </LegalSection>

    <LegalSection title="2. Dados que coletamos">
      <ul className="list-disc pl-5 space-y-1">
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
      <ul className="list-disc pl-5 space-y-1">
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

    <LegalSection title="6. Seus direitos (Art. 18 da LGPD)">
      <p>Você pode, a qualquer momento:</p>
      <ul className="list-disc pl-5 space-y-1">
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
        <li>Solicitar acesso, correção, anonimização ou exclusão dos seus dados e da sua conta.</li>
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
  </>
);

export const TermsContent: React.FC = () => (
  <>
    <LegalSection title="1. Aceitação">
      <p>
        Ao criar uma conta e usar o Broto, você concorda com estes Termos de Serviço e com a
        Política de Privacidade. Se não concordar, não utilize o aplicativo.
      </p>
    </LegalSection>

    <LegalSection title="2. O serviço">
      <p>
        O Broto é um aplicativo de organização pessoal que oferece blocos, tarefas, calendário,
        quadro de rotina semanal e integração opcional com o Google Agenda. O serviço é oferecido
        no estado em que se encontra e pode ser alterado ou descontinuado a qualquer momento.
      </p>
    </LegalSection>

    <LegalSection title="3. Sua conta">
      <ul className="list-disc pl-5 space-y-1">
        <li>Você é responsável por manter a segurança do seu acesso.</li>
        <li>As informações fornecidas no cadastro devem ser verdadeiras.</li>
        <li>Você pode excluir sua conta a qualquer momento solicitando pelo e-mail de contato.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Uso aceitável">
      <p>Ao usar o Broto, você se compromete a não:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Usar o serviço para fins ilegais ou que violem direitos de terceiros;</li>
        <li>Tentar acessar dados de outros usuários ou comprometer a segurança do sistema;</li>
        <li>Sobrecarregar a infraestrutura com uso automatizado abusivo.</li>
      </ul>
    </LegalSection>

    <LegalSection title="5. Integração com o Google Agenda">
      <p>
        A integração é opcional e depende da sua autorização. Você pode desconectá-la a qualquer
        momento em Configurações ou revogar o acesso na sua conta Google. O Broto não se
        responsabiliza por eventos alterados ou removidos por você diretamente no Google Agenda.
      </p>
    </LegalSection>

    <LegalSection title="6. Seu conteúdo">
      <p>
        Os dados que você cria no Broto (tarefas, blocos, eventos etc.) pertencem a você. Usamos
        esse conteúdo apenas para prestar o serviço, conforme a Política de Privacidade.
      </p>
    </LegalSection>

    <LegalSection title="7. Limitação de responsabilidade">
      <p>
        Embora nos esforcemos para manter o serviço estável e seguro, o Broto é fornecido sem
        garantias de disponibilidade contínua. Recomendamos não depender exclusivamente do app
        para compromissos críticos. Não nos responsabilizamos por perdas decorrentes de falhas,
        indisponibilidade ou perda de dados, na extensão permitida pela lei.
      </p>
    </LegalSection>

    <LegalSection title="8. Alterações nos termos">
      <p>
        Estes termos podem ser atualizados. A data da última atualização estará sempre indicada no
        topo desta página. O uso continuado do app após mudanças significa que você concorda com a
        nova versão.
      </p>
    </LegalSection>

    <LegalSection title="9. Contato">
      <p>
        Dúvidas sobre estes termos:{" "}
        <a className={linkClass} href="mailto:alanedantass@gmail.com">
          alanedantass@gmail.com
        </a>
        .
      </p>
    </LegalSection>
  </>
);
