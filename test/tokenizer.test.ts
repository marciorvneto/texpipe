import { LatexParser } from "../src/core/tokenizer";
import { DocxAdapter } from "../src/adapters/docx";

describe("TexPipe Core", () => {
  it("parses a simple fraction", () => {
    const latex = "\\frac{a}{b}";
    const parser = new LatexParser(latex);
    const ast = parser.parse();

    expect(ast.children?.[0].type).toBe("fraction");
    // @ts-ignore
    expect(ast.children[0].numerator.children[0].value).toBe("a");
  });

  it("handles nested subscripts and superscripts", () => {
    const latex = "x_i^2";
    const parser = new LatexParser(latex);
    const ast = parser.parse();
    // Should be a superscript node wrapping a subscript node wrapping 'x'
    expect(ast.children?.[0].type).toBe("superscript");
  });
});

describe("TexPipe Docx Adapter", () => {
  it("does not crash on export", () => {
    const adapter = new DocxAdapter();
    const paragraph = adapter.toParagraph("A = \\frac{\\pi r^2}{2}");
    expect(paragraph).toBeDefined();
    // You can inspect the JSON structure of 'paragraph' here to verify structure
  });
});
