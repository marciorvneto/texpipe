import {
  Math,
  MathFraction,
  MathRun,
  MathSubScript,
  MathSuperScript,
  Paragraph,
  MathSum,
  MathIntegral,
} from "docx";
import { MathNode } from "../core/ast";
import { LatexParser } from "../core/tokenizer";

export class DocxAdapter {
  // Main entry point
  public toParagraph(latex: string): Paragraph {
    const parser = new LatexParser(latex);
    const ast = parser.parse();
    const children = this.visit(ast);

    // If children is an array, we wrap it. Math() expects children list.
    const mathChildren = Array.isArray(children) ? children : [children];

    return new Paragraph({
      children: [
        new Math({
          children: mathChildren,
        }),
      ],
    });
  }

  // Recursive visitor
  private visit(node: MathNode): any {
    switch (node.type) {
      case "root":
      case "group":
        return (node.children || []).map((child) => this.visit(child)).flat();

      case "text":
        return new MathRun(node.value || "");

      case "symbol":
      case "operator":
        return this.mapSymbol(node.value || "");

      case "fraction":
        return new MathFraction({
          numerator: [this.visit(node.numerator!)].flat(),
          denominator: [this.visit(node.denominator!)].flat(),
        });

      case "subscript":
        return new MathSubScript({
          children: [this.visit(node.base!)].flat(),
          subScript: [this.visit(node.sub!)].flat(),
        });

      case "superscript":
        return new MathSuperScript({
          children: [this.visit(node.base!)].flat(),
          superScript: [this.visit(node.sup!)].flat(),
        });

      default:
        return new MathRun("");
    }
  }

  // Basic Symbol Mapping
  private mapSymbol(latexCmd: string): any {
    const map: Record<string, string> = {
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\theta": "θ",
      "\\pi": "π",
      "\\cdot": "⋅",
      "\\times": "×",
      "\\approx": "≈",
      "\\le": "≤",
      "\\ge": "≥",
      "\\int": "∫",
      "\\sum": "∑",
      "\\partial": "∂",
      "\\nabla": "∇",
      "\\infty": "∞",
    };

    // Strip backslash to check map
    if (map[latexCmd]) {
      // Special handling for operators if needed, or just return run
      if (latexCmd === "\\sum")
        return new MathSum({ children: [new MathRun("∑")] });
      if (latexCmd === "\\int")
        return new MathIntegral({ children: [new MathRun("∫")] });
      return new MathRun(map[latexCmd]);
    }

    // Return text without backslash if not found, or keep it if it's just a char
    return new MathRun(latexCmd.replace("\\", ""));
  }
}
