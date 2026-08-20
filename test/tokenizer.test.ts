import { LatexParser } from "../src/core/parser";
import { DocxAdapter } from "../src/adapters/docx";
import * as docx from "docx";

describe("TexPipe Core", () => {
  // --- Tokenization / basic parsing ---
  it("ignores whitespace", () => {
    const ast1 = new LatexParser("y=2x").parse();
    const ast2 = new LatexParser(" y =  2 x ").parse();
    expect(ast2.children).toEqual(ast1.children);
  });

  it("parses simple variables and numbers (y = 2x)", () => {
    const ast = new LatexParser("y = 2x").parse();

    expect(ast.children).toHaveLength(4); // y, =, 2, x
    expect(ast.children?.[0]).toMatchObject({ type: "text", value: "y" });
    expect(ast.children?.[1]).toMatchObject({ type: "operator", value: "=" });
    expect(ast.children?.[2]).toMatchObject({ type: "text", value: "2" });
    expect(ast.children?.[3]).toMatchObject({ type: "text", value: "x" });
  });

  it("parses Greek letters and generic commands as symbols", () => {
    const ast = new LatexParser("\\alpha + \\beta").parse();

    expect(ast.children?.[0]).toMatchObject({
      type: "symbol",
      value: "\\alpha",
    });
    expect(ast.children?.[1]).toMatchObject({ type: "operator", value: "+" });
    expect(ast.children?.[2]).toMatchObject({
      type: "symbol",
      value: "\\beta",
    });
  });

  it("treats unknown commands as symbols", () => {
    const ast = new LatexParser("\\doesnotexist").parse();
    expect(ast.children?.[0]).toMatchObject({
      type: "symbol",
      value: "\\doesnotexist",
    });
  });

  // --- Grouping ---
  it("handles explicit grouping with braces", () => {
    const ast = new LatexParser("{ab}").parse();

    const group = ast.children?.[0];
    expect(group?.type).toBe("group");
    expect(group?.children).toHaveLength(2);
    expect(group?.children?.[0]).toMatchObject({ type: "text", value: "a" });
    expect(group?.children?.[1]).toMatchObject({ type: "text", value: "b" });
  });

  it("does not infinite-loop on missing closing brace", () => {
    const ast = new LatexParser("{ab").parse();
    const group = ast.children?.[0];
    expect(group?.type).toBe("group");
    expect(group?.children).toHaveLength(2);
  });

  // --- Fractions ---
  it("parses a simple fraction", () => {
    const ast = new LatexParser("\\frac{a}{b}").parse();

    const frac = ast.children?.[0];
    expect(frac?.type).toBe("fraction");
    expect(frac?.numerator?.type).toBe("group");
    expect(frac?.denominator?.type).toBe("group");
    expect(frac?.numerator?.children?.[0]).toMatchObject({
      type: "text",
      value: "a",
    });
    expect(frac?.denominator?.children?.[0]).toMatchObject({
      type: "text",
      value: "b",
    });
  });

  it("parses nested fractions", () => {
    const ast = new LatexParser("\\frac{1}{\\frac{a}{b}}").parse();

    const rootFrac = ast.children?.[0];
    expect(rootFrac?.type).toBe("fraction");

    const denom = rootFrac?.denominator;
    expect(denom?.type).toBe("group");
    expect(denom?.children?.[0]?.type).toBe("fraction");

    const inner = denom?.children?.[0];
    expect(inner?.numerator?.children?.[0]).toMatchObject({
      type: "text",
      value: "a",
    });
    expect(inner?.denominator?.children?.[0]).toMatchObject({
      type: "text",
      value: "b",
    });
  });

  // --- Subscripts / Superscripts ---
  it("handles simple subscript (x_i)", () => {
    const ast = new LatexParser("x_i").parse();

    const node = ast.children?.[0];
    expect(node?.type).toBe("subscript");
    expect(node?.base).toMatchObject({ type: "text", value: "x" });
    expect(node?.sub).toMatchObject({ type: "text", value: "i" });
  });

  it("handles simple superscript (x^2)", () => {
    const ast = new LatexParser("x^2").parse();

    const node = ast.children?.[0];
    expect(node?.type).toBe("superscript");
    expect(node?.base).toMatchObject({ type: "text", value: "x" });
    expect(node?.sup).toMatchObject({ type: "text", value: "2" });
  });

  it("attaches both sub and sup to the base with correct greediness (x_i^2)", () => {
    const ast = new LatexParser("x_i^2").parse();

    const node = ast.children?.[0];
    expect(node?.type).toBe("scripts");
    expect(node?.base).toMatchObject({ type: "text", value: "x" });
    expect(node?.sub).toMatchObject({ type: "text", value: "i" });
    expect(node?.sup).toMatchObject({ type: "text", value: "2" });
  });

  it("does NOT let script arguments eat subsequent scripts (regression)", () => {
    // x_i^2 must NOT become subscript(x, superscript(i,2))
    const ast = new LatexParser("x_i^2").parse();
    const top = ast.children?.[0];
    expect(top?.type).toBe("scripts");
    expect(top?.sub?.type).toBe("text");
    expect(top?.sub).toMatchObject({ type: "text", value: "i" });
    expect(top?.sup).toMatchObject({ type: "text", value: "2" });
  });

  it("handles grouped subscripts (x_{i+1})", () => {
    const ast = new LatexParser("x_{i+1}").parse();

    const node = ast.children?.[0];
    expect(node?.type).toBe("subscript");

    const sub = node?.sub;
    expect(sub?.type).toBe("group");
    expect(sub?.children).toHaveLength(3);
    expect(sub?.children?.[0]).toMatchObject({ type: "text", value: "i" });
    expect(sub?.children?.[1]).toMatchObject({ type: "operator", value: "+" });
    expect(sub?.children?.[2]).toMatchObject({ type: "text", value: "1" });
  });

  // --- Calculus-ish operators with limits ---
  it("parses definite integrals (\\int_a^b)", () => {
    const ast = new LatexParser("\\int_a^b").parse();

    const node = ast.children?.[0];
    expect(node?.type).toBe("nary");
    expect(node?.value).toBe("\\int");
    expect(node?.sub).toMatchObject({ type: "text", value: "a" });
    expect(node?.sup).toMatchObject({ type: "text", value: "b" });
  });

  it("parses summation with limits (\\sum_{n=0}^{\\infty})", () => {
    const ast = new LatexParser("\\sum_{n=0}^{\\infty}").parse();

    const node = ast.children?.[0];
    expect(node?.type).toBe("nary");
    expect(node?.value).toBe("\\sum");

    expect(node?.sub?.type).toBe("group");
    expect(node?.sub?.children?.[0]).toMatchObject({ type: "text", value: "n" });
    expect(node?.sub?.children?.[1]).toMatchObject({
      type: "operator",
      value: "=",
    });
    expect(node?.sub?.children?.[2]).toMatchObject({ type: "text", value: "0" });

    expect(node?.sup?.type).toBe("group");
    expect(node?.sup?.children?.[0]).toMatchObject({
      type: "symbol",
      value: "\\infty",
    });
  });

  // --- Complex expressions ---
  it("parses a full equation (A = \\pi r^2)", () => {
    const ast = new LatexParser("A = \\pi r^2").parse();

    expect(ast.children).toHaveLength(4);
    expect(ast.children?.[0]).toMatchObject({ type: "text", value: "A" });
    expect(ast.children?.[1]).toMatchObject({ type: "operator", value: "=" });
    expect(ast.children?.[2]).toMatchObject({ type: "symbol", value: "\\pi" });

    const r2 = ast.children?.[3];
    expect(r2?.type).toBe("superscript");
    expect(r2?.base).toMatchObject({ type: "text", value: "r" });
    expect(r2?.sup).toMatchObject({ type: "text", value: "2" });
  });
});

describe("TexPipe Docx Adapter", () => {
  it("does not crash on export", () => {
    const adapter = new DocxAdapter(docx);
    const paragraph = adapter.toParagraph("A = \\frac{\\pi r^2}{2}");
    expect(paragraph).toBeDefined();
  });

  it("exports something non-empty for a simple formula", () => {
    const adapter = new DocxAdapter(docx);
    const paragraph = adapter.toParagraph("\\alpha+\\beta");
    expect(JSON.stringify(paragraph)).toContain("α");
    expect(JSON.stringify(paragraph)).toContain("β");
  });

  it("emits a radical for \\sqrt", () => {
    const adapter = new DocxAdapter(docx);
    const math = adapter.toMath("\\sqrt{x}");
    expect(JSON.stringify(math)).toContain("m:rad");
  });

  it("emits stretchy parens for \\left(...\\right)", () => {
    const adapter = new DocxAdapter(docx);
    const math = adapter.toMath("\\left(\\frac{a}{b}\\right)");
    expect(JSON.stringify(math)).toContain("m:d");
    expect(JSON.stringify(math)).not.toContain("left");
    expect(JSON.stringify(math)).not.toContain("right");
  });
});
