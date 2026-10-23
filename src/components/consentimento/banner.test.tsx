import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  abrirPreferencias,
  lerConsentimento,
  salvarConsentimento,
} from "@/lib/consentimento";
import { BannerConsentimento, useConsentimento } from "./banner";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("BannerConsentimento", () => {
  it("fica escondido enquanto o site não tem cookies opcionais", () => {
    render(<BannerConsentimento />);
    expect(screen.queryByRole("region", { name: "Cookies" })).toBeNull();
  });

  it("aparece até a pessoa decidir e guarda a escolha", () => {
    const { unmount } = render(<BannerConsentimento ativo />);
    expect(screen.getByRole("region", { name: "Cookies" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
    expect(screen.queryByRole("region", { name: "Cookies" })).toBeNull();
    expect(lerConsentimento()?.publicidade).toBe(false);

    // Numa próxima visita, não pergunta de novo
    unmount();
    render(<BannerConsentimento ativo />);
    expect(screen.queryByRole("region", { name: "Cookies" })).toBeNull();
  });

  it("reabre pelo link de preferências", () => {
    salvarConsentimento(true);
    render(<BannerConsentimento ativo />);
    expect(screen.queryByRole("region", { name: "Cookies" })).toBeNull();
    act(() => abrirPreferencias());
    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
    expect(lerConsentimento()?.publicidade).toBe(false);
  });
});

function Mostrar() {
  const consentimento = useConsentimento();
  return <p>{consentimento ? String(consentimento.publicidade) : "nenhum"}</p>;
}

it("useConsentimento acompanha a escolha", () => {
  render(<Mostrar />);
  expect(screen.getByText("nenhum")).toBeInTheDocument();
  act(() => {
    salvarConsentimento(true);
  });
  expect(screen.getByText("true")).toBeInTheDocument();
});

it("ignora um valor salvo inválido", () => {
  localStorage.setItem("nossa-politica:consentimento:v1", "{quebrado");
  expect(lerConsentimento()).toBeNull();
});
