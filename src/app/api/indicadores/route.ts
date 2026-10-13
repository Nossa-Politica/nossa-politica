import { montarIndicadores } from "@/lib/indicadores";

// Gerado no build como arquivo estático
export const dynamic = "force-static";

export function GET() {
  return Response.json(montarIndicadores());
}
