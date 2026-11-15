import { describe, expect, it } from "vitest";
import { brisaLinksFor } from "./brisa-links";

const paths = (q: string) => brisaLinksFor(q).map((l) => l.to);

describe("brisaLinksFor", () => {
  it("oferece os três cadastros quando o perfil não foi dito", () => {
    expect(paths("Quero me cadastrar")).toEqual(["/cadastro", "/cadastro-profissional", "/cadastro-farmacia"]);
  });

  it("leva o médico direto ao cadastro profissional", () => {
    expect(paths("sou médico e quero me cadastrar")).toEqual(["/cadastro-profissional"]);
  });

  it("leva farmácia e parceiro ao cadastro de parceiro", () => {
    expect(paths("tenho uma farmácia, como faço o cadastro?")).toEqual(["/cadastro-farmacia"]);
    expect(paths("quero ser parceiro")).toEqual(["/cadastro-farmacia"]);
  });

  it("reconhece consulta, orientação e aplicativo", () => {
    expect(paths("como marco uma consulta?")).toContain("/profissionais");
    expect(paths("quanto custa a orientação técnica")).toContain("/orientacao-tecnica");
    expect(paths("tem aplicativo?")).toContain("/download");
  });

  it("não inventa link para pergunta sem pedido de página", () => {
    expect(paths("como funciona o exame de fundo de olho?")).toEqual([]);
  });
});
