import { LatexParser, tokenize } from "../src/core/parser";
import { DocxAdapter } from "../src/adapters/docx";
import * as docx from "docx";

const dump = (latex: string) => JSON.stringify(new DocxAdapter(docx).toMath(latex));

describe("Tokenizer keeps math punctuation", () => {
  it("keeps decimal points", () => {
    expect(tokenize("1.42")).toEqual(["1.42"]);
  });

  it("keeps comma decimals as a single number", () => {
    expect(tokenize("1,25")).toEqual(["1,25"]);
  });

  it("keeps slashes used in units", () => {
    expect(tokenize("kg/m^3")).toEqual(["k", "g", "/", "m", "^", "3"]);
  });

  it("tokenizes thin/thick spaces and percent", () => {
    expect(tokenize(String.raw`a\,b\;c\%`)).toEqual([
      "a",
      "\\,",
      "b",
      "\\;",
      "c",
      "\\%",
    ]);
  });

  it("does not drop commas inside subscripts", () => {
    expect(tokenize("x_{i,j}")).toContain(",");
  });
});

describe("Parser covers previously skipped commands", () => {
  it("parses decimals as a single text node", () => {
    const ast = new LatexParser("1.42").parse();
    expect(ast.children?.[0]).toMatchObject({ type: "text", value: "1.42" });
  });

  it("parses \\sqrt as a radical", () => {
    const ast = new LatexParser(String.raw`\sqrt{\frac{a}{b}}`).parse();
    expect(ast.children?.[0]?.type).toBe("radical");
    expect(ast.children?.[0]?.radicand?.type).toBe("group");
  });

  it("parses nth roots", () => {
    const ast = new LatexParser(String.raw`\sqrt[3]{x}`).parse();
    const rad = ast.children?.[0];
    expect(rad?.type).toBe("radical");
    expect(rad?.index).toMatchObject({ type: "text", value: "3" });
  });

  it("parses \\mathrm without leaving a 'mathrm' symbol", () => {
    const ast = new LatexParser(String.raw`\mathrm{kg/m^3}`).parse();
    const node = ast.children?.[0];
    expect(node?.type).toBe("textmode");
    expect(JSON.stringify(node)).not.toContain("mathrm");
    expect(node?.children?.some((c) => c.value === "/")).toBe(true);
  });

  it("parses \\left...\\right as a delimited node", () => {
    const ast = new LatexParser(
      String.raw`\left(\frac{2}{k+1}\right)^{\frac{k}{k-1}}`,
    ).parse();
    const node = ast.children?.[0];
    expect(node?.type).toBe("superscript");
    expect(node?.base?.type).toBe("delimited");
    expect(node?.base?.left).toBe("(");
    expect(node?.base?.right).toBe(")");
  });

  it("parses ceiling delimiters", () => {
    const ast = new LatexParser(String.raw`\left\lceil \frac{x}{t} \right\rceil`).parse();
    const node = ast.children?.[0];
    expect(node?.type).toBe("delimited");
    expect(node?.left).toBe("⌈");
    expect(node?.right).toBe("⌉");
  });

  it("parses \\circ as a symbol (degrees)", () => {
    const ast = new LatexParser(String.raw`60^\circ C`).parse();
    const sup = ast.children?.[0];
    expect(sup?.type).toBe("superscript");
    expect(sup?.sup).toMatchObject({ type: "symbol", value: "\\circ" });
  });

  it("keeps commas in multi-letter subscripts", () => {
    const ast = new LatexParser("x_{i,j}").parse();
    const sub = ast.children?.[0]?.sub;
    expect(sub?.children?.map((c) => c.value)).toEqual(["i", ",", "j"]);
  });
});

describe("Docx adapter emits the glyphs those commands map to", () => {
  it("preserves decimals instead of concatenating digits", () => {
    const json = dump(String.raw`a = 1.42 \qquad b = 0.87`);
    expect(json).toContain("1.42");
    expect(json).toContain("0.87");
    expect(json).not.toContain("142");
  });

  it("maps \\qquad to space and \\Rightarrow to an arrow, not command names", () => {
    const json = dump(String.raw`a \qquad b \Rightarrow c`);
    expect(json).not.toContain("qquad");
    expect(json).not.toContain("Rightarrow");
    expect(json).toContain("⇒");
  });

  it("emits a radical and unit slashes", () => {
    const json = dump(String.raw`c = \sqrt{\frac{a}{b}} = 3.76\;\mathrm{m/s}`);
    expect(json).toContain("m:rad");
    expect(json).toContain("3.76");
    expect(json).toContain("/");
    expect(json).not.toContain("sqrt");
    expect(json).not.toContain("mathrm");
  });

  it("keeps degree, comma-in-subscript, and decimal literals", () => {
    const json = dump(String.raw`\theta_{i,j} = 60^\circ \qquad x = 12.5`);
    expect(json).toContain("12.5");
    expect(json).toContain("°");
    expect(json).toContain(",");
    expect(json).not.toContain("circ");
  });

  it("places sqrt in a fraction denominator", () => {
    const json = dump(String.raw`v = \frac{C}{\sqrt{\rho}} = 1.5`);
    expect(json).toContain("m:rad");
    expect(json).toContain("1.5");
    expect(json).not.toContain("sqrt");
  });

  it("builds stretchy parens around a grouped fraction", () => {
    const json = dump(
      String.raw`\left(\frac{2}{k+1}\right)^{\frac{k}{k-1}} = 0.55`,
    );
    expect(json).toContain("m:d");
    expect(json).not.toContain("left");
    expect(json).toContain("0.55");
  });

  it("renders ceiling brackets instead of the words lceil/rceil", () => {
    const json = dump(String.raw`n = \left\lceil \frac{x}{t} \right\rceil = 3`);
    expect(json).toContain("⌈");
    expect(json).toContain("⌉");
    expect(json).not.toContain("lceil");
    expect(json).not.toContain("rceil");
  });

  it("keeps the percent sign", () => {
    const json = dump(String.raw`\eta = 0.19\%`);
    expect(json).toContain("%");
    expect(json).toContain("0.19");
  });

  it("marks \\mathrm units as upright math text", () => {
    const json = dump(String.raw`c = 3.76\;\mathrm{m/s}`);
    expect(json).toContain("m:nor");
    expect(json).not.toContain("mathrm");
  });

  it("emits a math function for \\sin x", () => {
    const json = dump(String.raw`\sin x`);
    expect(json).toContain("m:func");
    expect(json).toContain("sin");
  });

  it("keeps the exponent on the function name for \\sin^2 x", () => {
    const ast = new LatexParser(String.raw`\sin^2 x`).parse();
    const fn = ast.children?.[0];
    expect(fn?.type).toBe("function");
    expect(fn?.sup).toMatchObject({ type: "text", value: "2" });
    expect(fn?.children?.[0]).toMatchObject({ type: "text", value: "x" });
  });

  it("binds \\log_{10} to its argument", () => {
    const ast = new LatexParser(String.raw`\log_{10}(x)`).parse();
    const fn = ast.children?.[0];
    expect(fn?.type).toBe("function");
    expect(fn?.sub?.type).toBe("group");
    expect(fn?.sub?.children?.[0]).toMatchObject({ type: "text", value: "10" });
    expect(fn?.children?.[0]?.type).toBe("delimited");
  });

  it("emits an n-ary integral with the integrand as its body", () => {
    const ast = new LatexParser(String.raw`\int_a^b x\,dx = 1`).parse();
    const nary = ast.children?.[0];
    expect(nary?.type).toBe("nary");
    expect(nary?.body?.type).toBe("group");
    expect(ast.children?.[1]).toMatchObject({ type: "operator", value: "=" });

    const json = dump(String.raw`\int_a^b x\,dx`);
    expect(json).toContain("m:nary");
  });

  it("emits an n-ary sum", () => {
    const json = dump(String.raw`\sum_{n=0}^{N} n`);
    expect(json).toContain("m:nary");
  });
});
