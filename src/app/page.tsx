import { CampoBusca } from "@/components/busca/campo-busca";
import { QuemMeRepresenta } from "@/components/busca/quem-me-representa";
import { existemDados, lerFontes } from "@/lib/dados";
import { formatarData } from "@/lib/formatar";

export default function Home() {
  const atualizadoEm = lerFontes()?.camara?.atualizadoEm;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-10">
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          O que o seu político fez?
        </h1>
        <p className="text-lg text-muted-foreground">
          Gastos, projetos, votações, presença e emendas de deputados federais e
          senadores, com dados oficiais e comparados com os colegas.
        </p>
        {existemDados() ? (
          <CampoBusca />
        ) : (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            Os dados ainda não foram carregados nesta versão do site.
          </p>
        )}
      </section>

      {existemDados() && <QuemMeRepresenta />}

      <section className="flex flex-col gap-2 text-sm text-muted-foreground">
        <h2 className="font-heading text-base font-semibold text-foreground">
          De onde vêm os dados
        </h2>
        <p>
          Câmara dos Deputados, Senado Federal, Portal da Transparência e
          Tribunal Superior Eleitoral. Todos os números têm link para a fonte, e
          as mesmas regras valem para todos.
          {atualizadoEm && (
            <> Última atualização: {formatarData(atualizadoEm)}.</>
          )}
        </p>
      </section>
    </main>
  );
}
