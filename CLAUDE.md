# Nossa Política

Site de transparência política: qualquer pessoa encontra um deputado ou senador e entende em 30 segundos o que ele fez (gastos, projetos, votos, presença). O plano completo, com as fases, está em [`docs/PLANO.md`](docs/PLANO.md).

@AGENTS.md

## Regras

- **Nunca faça push na `main`.** Toda mudança vai em uma branch nova e entra por pull request (`gh pr create`). O merge na `main` publica em produção.
- Antes de fazer push, rode `pnpm lint && pnpm typecheck && pnpm test`.
- Nunca rode `pnpm deploy` à mão: o deploy de produção é feito pelo GitHub Actions no merge.
- Segredos (tokens, chaves de API) ficam só em GitHub Secrets e nos secrets do Worker, nunca no repositório nem em `wrangler.jsonc`.
- Textos da interface em português simples, sem jargão; termo técnico vai no glossário (`src/lib/glossario.ts`, aberto ao tocar).
- Gráficos: um azul para os dados e cinzas para contexto (tokens `--serie`, `--contexto` e `--sequencial-*` em `globals.css`), nunca cores de partido nem vermelho/verde para "bom/ruim". Todo gráfico tem tabela alternativa. Veja os princípios em `docs/PLANO.md` (neutralidade, fonte sempre visível, comparação com a mediana).
- `src/components/ui/` é gerado pelo shadcn (`pnpm dlx shadcn@latest add <componente>`). Evite editar à mão; o Biome ignora essa pasta.
- O `next` está fixado em `16.3.8` porque o `@opennextjs/cloudflare` ainda quebra com o Next 16.4 ([issue #1355](https://github.com/opennextjs/opennextjs-cloudflare/issues/1355)). Só atualize depois que a correção sair e o `pnpm preview` funcionar.
- Depois de mudar `wrangler.jsonc`, rode `pnpm cf-typegen` e faça commit do `cloudflare-env.d.ts`.
- Toda mudança no cálculo de um indicador do ETL atualiza `docs/METODOLOGIA.md` no mesmo PR. Esse arquivo é publicado no site como `/metodologia` (via Velite): escreva para o público e evite caminhos de código.
- O repositório é público, na organização [`Nossa-Politica`](https://github.com/Nossa-Politica/nossa-politica). O site não leva nomes pessoais (posts sem autor, metadados sem nome) nem links para o GitHub.
- Segurança: o secret scanning com push protection está ligado (um push com chave é recusado) e o Dependabot abre PRs de correção de vulnerabilidades. Ações de terceiros nos workflows ficam fixadas pelo commit. Os cabeçalhos de segurança do site (CSP, HSTS…) ficam em `next.config.ts` e `public/_headers`: script, analytics ou anúncio de outro domínio precisa ser liberado na CSP.
- A pasta `dados/` é gerada pelo ETL e publicada na branch `dados`; nunca faça commit dela na `main`.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS v4 e shadcn/ui, com pnpm.
- Domínio: `nossapolitica.com.br` (Custom Domain do Worker em `wrangler.jsonc`, DNS na Cloudflare). `www` e o endereço antigo `*.workers.dev` redirecionam para ele (`next.config.ts`); o `workers.dev` continua ligado porque os previews dos PRs dependem dele.
- Cloudflare Workers via `@opennextjs/cloudflare`. As páginas são geradas no build (uma por político) e o cache de páginas fica nos arquivos estáticos do deploy (`static-assets` em `open-next.config.ts`): não há regeneração entre deploys. O bucket R2 `nossa-politica-cache` existe na conta, mas não está em uso.
- Páginas: `/` (busca), `/politicos/[slug]`, `/explorar` e `/comparar` (no navegador, a partir de `/api/indicadores`), `/votacoes` e `/votacoes/[casa]/[id]`, `/estados` e `/estados/[uf]`, `/metodologia` (gerada de `docs/METODOLOGIA.md`). Tudo gerado no build (~5.400 páginas).
- O site lê `dados/` só no build (`src/lib/dados.ts`, com os esquemas de `etl/`, importados por `@etl/*`). Para rodar com dados localmente: `pnpm dados:baixar`.
- Biome (lint e formatação), Vitest (unitários) e Playwright (E2E).
- GitHub Actions para CI, preview, deploy e ETL.
- Zod para validar dados de fontes externas e os arquivos publicados.

## Dados (ETL)

- Uma pasta por fonte em `etl/`: `camara/`, `senado/`, `emendas/` (Portal da Transparência) e `tse/`. Cada uma grava JSON na sua subpasta de `dados/`. As regras de cada indicador estão em `docs/METODOLOGIA.md`.
- `etl/comum/` tem o que é compartilhado: formatos de saída de Câmara e Senado (`saida.ts`), alinhamento, medianas, `fontes.json` e o cadastro de parlamentares usado para cruzar fontes que só trazem o nome (`parlamentares.ts`).
- O workflow `ETL` roda todo dia, na ordem Câmara → Senado → emendas → TSE. Emendas e TSE dependem dos parlamentares já gravados. Uma fonte que falha fica com os dados da carga anterior e o job termina com erro. Depois publica `dados/` na branch `dados` (um commit único, sobrescrito) e dispara o deploy.
- Resultados intermediários que não precisam ser refeitos todo dia ficam em `_parciais/`: anos da Câmara (só o atual e o anterior são reprocessados) e eleições do TSE. Aos domingos, a Câmara reprocessa todos os anos e o TSE refaz a eleição mais recente.
- **Compatibilidade:** o deploy valida os dados já publicados antes da próxima carga rodar. Campo novo num formato de saída entra como opcional, e uma fonte nova só é exigida pelo `etl:validar` depois de aparecer em `fontes.json`.
- Os testes usam respostas gravadas das APIs e amostras reais dos arquivos (pastas `__fixtures__/`), com CPFs e nomes de pessoas físicas trocados por valores fictícios.
- **Nunca** coloque CPF ou nome de pessoa física real (fornecedor, doador, passageiro) em fixtures: o repositório é público.

## Acessibilidade

- `e2e/acessibilidade.spec.ts` audita as principais páginas com o axe (WCAG 2.1 A e AA, mais as boas práticas), nos temas claro e escuro, no computador e no celular. Também testa o teclado: o atalho "Pular para o conteúdo", o glossário (Enter abre, Esc fecha) e o contorno de foco. Página nova entra na lista `PAGINAS` do teste.
- Títulos em ordem (`h1` → `h2` → `h3`, sem pular nível), botões com nome que diga o que fazem (`aria-label` quando o texto visível é genérico, como "Remover"), e nada de `aside` dentro do conteúdo (é uma região da página).
- Textos sobre os gráficos (eixos) ficam fora da conta automática do axe: use `muted-foreground` ou mais escuro, que passa de 4,5:1 nos dois temas.

## Desempenho e analytics

- O Lighthouse roda no preview de todo PR (`lighthouserc.json`) em 5 páginas. Acessibilidade, boas práticas e SEO abaixo de 90 (95 na acessibilidade) e CLS acima de 0,1 reprovam o PR. O desempenho só avisa, porque varia entre execuções. O relatório completo fica num link público no log do job.
- Páginas já geradas saem do cache sem carregar o servidor do Next.js (`enableCacheInterception` em `open-next.config.ts`).
- Conteúdo que carrega no navegador (Explorar, Comparar) reserva o espaço enquanto carrega, para o rodapé não pular.
- Analytics: Cloudflare Web Analytics, injetado pela Cloudflare, sem cookies e sem dado pessoal. Por isso não precisa de consentimento. A CSP libera `static.cloudflareinsights.com` e `cloudflareinsights.com`.

## SEO

- `sitemap.xml` (`src/app/sitemap.ts`) lista todas as páginas geradas: páginas fixas, políticos, estados, votações e posts. `robots.txt` (`src/app/robots.ts`) libera tudo menos `/api/`.
- Toda página tem endereço canônico (`alternates.canonical` nos metadados). Página nova também precisa ter, e entrar no sitemap se for indexável.
- Dados estruturados (schema.org, componente `DadosEstruturados`): `WebSite` e `Organization` na home, `Person` nos perfis (sem números, só identificação) e `BlogPosting` nos posts, com a organização como autora.
- Cada político tem imagem de compartilhamento própria (`public/og/politicos/<slug>.png`), gerada no build por `scripts/og/gerar.tsx`.
- Fora de `nossapolitica.com.br` (previews dos PRs, `workers.dev`), as páginas saem com `X-Robots-Tag: noindex`.

## Blog

- Os posts não têm autor: o projeto é anônimo, e nenhum nome pessoal entra no site, nos metadados ou no RSS.
- Um post é um arquivo `content/blog/<slug>.mdx`. O Velite valida e compila (`velite.config.ts`) antes do build; o build falha se o frontmatter estiver errado.
- Frontmatter: `titulo` (até 120 caracteres), `slug`, `data` (AAAA-MM-DD), `resumo` (até 280), `tags`, `rascunho` (true esconde o post) e `social` (texto de cada rede: `bluesky` até 300 caracteres, `threads` até 500, `facebook`, `instagram` até 2.200), usado na publicação automática.
- Componentes disponíveis no MDX (`src/components/blog/componentes-mdx.tsx`):
  - `<Mediana casa="camara" indicador="presenca" />`: mediana da legislatura atual, lida dos dados no build. Indicadores: `presenca`, `primeiroAutor`, `viraramNorma`, `gastoMensal`.
  - `<Numero slug="nome-do-politico" indicador="gastoMensal" />`: valor de um parlamentar (os mesmos indicadores do Explorar).
  - `<Politico slug="nome-do-politico" />`: cartão com foto, números e link para o perfil.
  - `<MedianasPorUf casa="camara" indicador="gastoMensal" titulo="..." />`: barras com a mediana de cada estado.
  - `<Barras titulo="..." dados={[{ rotulo, valor }]} formato="moeda" />` e `<Colunas titulo="..." dados={[{ ano, valor }]} />`: gráficos com dados do próprio post.
  - `<Destaque>`, `<Fonte nome="..." url="..." />` e `<TermoGlossario chave="cota">`.
- **Prefira os componentes que leem dados a números digitados**: o post se atualiza sozinho e não fica com número errado. Todo número digitado precisa de `<Fonte>`.
- Os mesmos princípios do site valem para os posts: neutralidade, sem adjetivos sobre parlamentares, o mesmo critério para todos, linguagem simples.
- A imagem de compartilhamento (`public/og/blog/<slug>.png`) e a vertical do Instagram (`public/og/instagram/<slug>.jpg`) são geradas no build por `scripts/og/gerar.tsx`.

## Redes sociais

- Depois de cada deploy de produção, o workflow `Redes sociais` roda `scripts/social/publish.ts`: publica os posts novos que têm texto em `social.<rede>`, com o cartão do link (título, resumo e a mesma imagem do site). Só entram posts dos últimos 14 dias, para que uma rede nova não receba o blog inteiro.
- Redes ligadas (`scripts/social/redes.ts`), sempre pelas APIs oficiais, nunca por automação de navegador:
  - **Bluesky:** `BLUESKY_HANDLE` em variáveis do repositório e `BLUESKY_APP_PASSWORD` em secrets. O post leva o cartão do link com a imagem enviada pelo script.
  - **Threads:** `THREADS_ACCESS_TOKEN` em secrets (token de 60 dias de um app da Meta em modo de desenvolvimento, com o perfil como testador). O post é um texto com o link anexado, e o Threads monta o cartão pelas metatags da página. O workflow `Tokens das redes` renova o token toda segunda (`scripts/social/renovar.ts`) e grava o novo com o secret `TOKEN_SECRETS` (token pessoal do GitHub com permissão só de escrever secrets deste repositório).
  - **Facebook:** `META_PAGE_TOKEN` em secrets, um token da Página gerado a partir de um token de usuário de longa duração (não vence). O post é texto com o link, e o Facebook monta o cartão. O workflow `Tokens das redes` confere o token toda segunda.
  - **Instagram:** `INSTAGRAM_ACCESS_TOKEN` em secrets, da API do Instagram com login do Instagram (conta profissional, sem depender da Página do Facebook). Vale 60 dias e é renovado toda segunda, como o do Threads. O post é a imagem vertical `public/og/instagram/<slug>.jpg` (1080×1350, JPEG, gerada no build) com a legenda, que não tem link clicável ("Link na bio"). A API não apaga posts: no "refazer", apague o post à mão no app antes.
- Uma rede sem credenciais é pulada com um aviso. Depois de configurar as credenciais, os posts dos últimos 14 dias saem no próximo merge ou ao disparar o workflow à mão (o deploy diário do ETL não dispara a publicação).
- O que já saiu fica no registro `social-log.json`, na branch `social` (a `main` é protegida e o workflow não grava nela). Antes de publicar, o script também procura na conta um post com o mesmo link, para nunca repetir.
- Para corrigir um post já publicado (as redes não permitem editar pela API), dispare o workflow à mão com o slug em "refazer": o post antigo é apagado e publicado de novo em cada rede onde saiu.
- O CI roda `pnpm social:publicar --dry-run` em todo PR: confere texto, limites e imagem sem publicar. Para simular com o registro real, dispare o workflow à mão (a opção "Só simular" já vem marcada).

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `pnpm lint` | Biome: lint, formatação e ordem dos imports |
| `pnpm format` | Biome: corrige o que der automaticamente |
| `pnpm typecheck` | Gera os tipos das rotas e roda `tsc --noEmit` |
| `pnpm test` | Testes unitários (Vitest, arquivos `src/**/*.test.ts(x)` e `etl/**/*.test.ts`) |
| `pnpm test:e2e` | Testes E2E (Playwright, pasta `e2e/`). Sobe o `pnpm dev` sozinho; com `PLAYWRIGHT_BASE_URL` testa uma URL publicada |
| `pnpm build:worker` | Build do Next.js adaptado para Workers (gera `.open-next/`) |
| `pnpm preview` | Build e execução local no runtime da Cloudflare (workerd) em http://localhost:8787 |
| `pnpm cf-typegen` | Regenera `cloudflare-env.d.ts` a partir de `wrangler.jsonc` |
| `pnpm etl:camara` | Carga da Câmara em `./dados` (anos recentes e os que faltam). `--completo` reprocessa tudo (~3 min, ~3,5 GB de downloads); `--anos ""` só reconsolida |
| `pnpm etl:senado` | Carga do Senado (~1 min) |
| `pnpm etl:pessoas` | Lista de pessoas (`dados/pessoas.json`): junta Câmara e Senado da mesma pessoa e define os endereços `/politicos/[slug]` |
| `pnpm conteudo` | Velite em modo observação: recompila os posts enquanto você edita (use junto com `pnpm dev`) |
| `pnpm social:publicar --dry-run` | Mostra o que sairia nas redes (precisa de `pnpm exec velite build` antes). Sem `--dry-run`, publica de verdade: só o workflow faz isso |
| `pnpm dados:baixar` | Baixa a branch `dados` para `./dados`, para rodar o site com dados localmente |
| `pnpm etl:emendas` | Emendas do Portal da Transparência (~10 s; precisa de Câmara e Senado em `./dados`) |
| `pnpm etl:tse` | Eleições do TSE: só as que faltam. `--recente` refaz a mais recente; `--completo`, todas (~5 min, ~2 GB de downloads) |
| `pnpm etl:validar [pasta]` | Valida os arquivos de dados (formato e limites de bom senso) |

## Fluxo de uma mudança

1. `git checkout -b <tipo>/<descricao>` a partir da `main` atualizada.
2. Escreva o código e os testes, e rode lint, typecheck e testes.
3. Faça push da branch e abra o PR com `gh pr create`.
4. O workflow `CI` roda os checks e envia uma versão de preview para a Cloudflare, comentando a URL no PR. Depois roda o Playwright contra essa URL.
5. O merge na `main` dispara o workflow `Deploy`, que publica em produção.

A `main` é protegida: o merge exige PR com os checks `checks` e `preview` verdes.
