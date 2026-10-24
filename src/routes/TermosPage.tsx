import React from "react";
import { Link } from "react-router-dom";

export const TermosPage: React.FC = () => (
  <div className="min-h-screen bg-surface text-on-surface">
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <header className="space-y-2">
        <h1 className="text-headline-lg font-playfair">Termos de Serviço — Broto</h1>
        <p className="text-body-sm text-on-surface-variant">
          Última atualização: 24 de outubro de 2026
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">1. Aceitação</h2>
        <p className="text-body-md">
          Ao criar uma conta e usar o Broto, você concorda com estes Termos de Serviço e com a{" "}
          <Link to="/privacidade" className="underline text-primary">
            Política de Privacidade
          </Link>
          . Se não concordar, não utilize o aplicativo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">2. O serviço</h2>
        <p className="text-body-md">
          O Broto é um aplicativo de organização pessoal que oferece blocos, tarefas, calendário,
          quadro de rotina semanal e integração opcional com o Google Agenda. O serviço é
          oferecido no estado em que se encontra e pode ser alterado ou descontinuado a qualquer
          momento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">3. Sua conta</h2>
        <ul className="list-disc pl-6 space-y-1 text-body-md">
          <li>Você é responsável por manter a segurança do seu acesso.</li>
          <li>As informações fornecidas no cadastro devem ser verdadeiras.</li>
          <li>Você pode excluir sua conta a qualquer momento solicitando pelo e-mail de contato.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">4. Uso aceitável</h2>
        <p className="text-body-md">Ao usar o Broto, você se compromete a não:</p>
        <ul className="list-disc pl-6 space-y-1 text-body-md">
          <li>Usar o serviço para fins ilegais ou que violem direitos de terceiros;</li>
          <li>Tentar acessar dados de outros usuários ou comprometer a segurança do sistema;</li>
          <li>Sobrecarregar a infraestrutura com uso automatizado abusivo.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">5. Integração com o Google Agenda</h2>
        <p className="text-body-md">
          A integração é opcional e depende da sua autorização. Você pode desconectá-la a qualquer
          momento em Configurações ou revogar o acesso na sua conta Google. O Broto não se
          responsabiliza por eventos alterados ou removidos por você diretamente no Google Agenda.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">6. Seu conteúdo</h2>
        <p className="text-body-md">
          Os dados que você cria no Broto (tarefas, blocos, eventos etc.) pertencem a você. Usamos
          esse conteúdo apenas para prestar o serviço, conforme a Política de Privacidade.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">7. Limitação de responsabilidade</h2>
        <p className="text-body-md">
          Embora nos esforcemos para manter o serviço estável e seguro, o Broto é fornecido sem
          garantias de disponibilidade contínua. Recomendamos não depender exclusivamente do app
          para compromissos críticos. Não nos responsabilizamos por perdas decorrentes de falhas,
          indisponibilidade ou perda de dados, na extensão permitida pela lei.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">8. Alterações nos termos</h2>
        <p className="text-body-md">
          Estes termos podem ser atualizados. A data da última atualização estará sempre indicada
          no topo desta página. O uso continuado do app após mudanças significa que você concorda
          com a nova versão.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-title-lg font-semibold">9. Contato</h2>
        <p className="text-body-md">
          Dúvidas sobre estes termos:{" "}
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
