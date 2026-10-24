import React from "react";
import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "../components/LegalLayout";

const linkClass = "text-primary underline hover:opacity-80";

export const TermosPage: React.FC = () => (
  <LegalLayout title="Termos de Serviço" updatedAt="24 de outubro de 2026">
    <LegalSection title="1. Aceitação">
      <p>
        Ao criar uma conta e usar o Broto, você concorda com estes Termos de Serviço e com a{" "}
        <Link to="/privacidade" className={linkClass}>
          Política de Privacidade
        </Link>
        . Se não concordar, não utilize o aplicativo.
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
      <ul className="list-disc pl-6 space-y-1">
        <li>Você é responsável por manter a segurança do seu acesso.</li>
        <li>As informações fornecidas no cadastro devem ser verdadeiras.</li>
        <li>Você pode excluir sua conta a qualquer momento solicitando pelo e-mail de contato.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Uso aceitável">
      <p>Ao usar o Broto, você se compromete a não:</p>
      <ul className="list-disc pl-6 space-y-1">
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
  </LegalLayout>
);
