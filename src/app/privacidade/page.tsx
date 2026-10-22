import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacidade · Nossa Política",
  description:
    "Quais dados o Nossa Política trata, de visitantes e de parlamentares, e como pedir informações ou correções.",
  alternates: { canonical: "/privacidade" },
};

/** Data da última mudança no texto: atualize junto com qualquer alteração. */
const ATUALIZADA_EM = "22 de outubro de 2026";
const CONTATO = "contato@nossapolitica.com.br";

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="mt-6 font-heading text-xl font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Lista({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-6">{children}</ul>;
}

export default function PaginaPrivacidade() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-8 leading-relaxed">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Privacidade
      </h1>
      <p className="text-sm text-muted-foreground">
        Atualizada em {ATUALIZADA_EM}
      </p>
      <p>
        O Nossa Política é um site independente que reúne dados públicos sobre
        deputados federais e senadores. Esta página explica, em linguagem
        simples, quais dados tratamos e por quê, seguindo a Lei Geral de
        Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <Secao titulo="Resumo">
        <Lista>
          <li>Você não precisa de cadastro nem de login para usar o site.</li>
          <li>
            Não usamos cookies próprios nem guardamos nada no seu navegador.
          </li>
          <li>
            Medimos visitas de forma agregada, sem cookies e sem identificar
            ninguém.
          </li>
          <li>
            Os dados de parlamentares vêm de fontes oficiais e públicas, sempre
            com o link para a origem.
          </li>
        </Lista>
      </Secao>

      <Secao titulo="Dados de quem visita o site">
        <p>
          O site é hospedado na Cloudflare. Para entregar as páginas e proteger
          o site contra ataques, a Cloudflare processa dados técnicos de cada
          acesso, como o endereço IP, o navegador e a página pedida. Esses
          registros ficam com a Cloudflare por poucos dias e não são usados por
          nós para identificar ninguém.
        </p>
        <p>
          Para saber quais páginas são mais visitadas, usamos o Cloudflare Web
          Analytics, que conta visitas de forma agregada,{" "}
          <strong>sem cookies</strong> e sem rastrear a pessoa entre sites.
        </p>
        <p>
          A busca, o &quot;Quem me representa&quot;, o Explorar e o Comparar
          funcionam no seu próprio navegador: o que você digita ou escolhe não é
          enviado para nós.
        </p>
      </Secao>

      <Secao titulo="Cookies">
        <p>
          Hoje o Nossa Política não grava cookies. As fotos dos parlamentares
          são carregadas dos sites oficiais da Câmara dos Deputados e do Senado
          Federal, que podem gravar cookies próprios, de acordo com as políticas
          desses órgãos.
        </p>
        <p>
          Se um dia o site exibir anúncios para se manter, os cookies de
          publicidade só serão usados depois que você aceitar, e você poderá
          mudar de ideia a qualquer momento. Esta página será atualizada antes
          disso.
        </p>
      </Secao>

      <Secao titulo="Dados dos parlamentares">
        <p>
          Gastos, projetos, votações, presença, emendas e resultados de eleições
          de deputados e senadores são dados públicos, divulgados pela Câmara,
          pelo Senado, pelo Portal da Transparência e pelo Tribunal Superior
          Eleitoral. Nós os reunimos e comparamos, com o mesmo critério para
          todos, porque são atos de agentes públicos e de interesse de toda a
          sociedade (LGPD, artigo 7º, §§ 3º e 4º). Como cada número é calculado
          está na{" "}
          <Link href="/metodologia" className="underline underline-offset-2">
            metodologia
          </Link>
          .
        </p>
        <p>
          Quando os dados oficiais trazem pessoas que não são agentes públicos,
          como fornecedores pessoa física pagos com a cota parlamentar,
          mostramos o nome como publicado pelo órgão e escondemos parte do CPF.
        </p>
      </Secao>

      <Secao titulo="Redes sociais">
        <p>
          Publicamos os textos do blog no Bluesky, no Threads e no Instagram. Ao
          interagir com esses perfis, valem as políticas de privacidade de cada
          rede. O botão &quot;Compartilhar&quot; usa o recurso do seu aparelho e
          não envia nada para nós.
        </p>
      </Secao>

      <Secao titulo="Seus direitos e contato">
        <p>
          Pela LGPD, você pode pedir informações sobre dados que tratamos sobre
          você, a correção de um dado errado ou a exclusão do que não tiver
          motivo para ser mantido. Se você é parlamentar ou aparece nos dados e
          encontrou um erro, escreva para nós: conferimos com a fonte oficial e
          corrigimos.
        </p>
        <p>
          Contato:{" "}
          <a
            href={`mailto:${CONTATO}`}
            className="underline underline-offset-2"
          >
            {CONTATO}
          </a>
        </p>
      </Secao>

      <Secao titulo="Mudanças nesta política">
        <p>
          Quando algo mudar, por exemplo a entrada de anúncios, atualizamos esta
          página e a data no topo.
        </p>
      </Secao>
    </main>
  );
}
