import { MathNode } from "../core/ast";
import { LatexParser } from "../core/parser";
import type * as DocxLib from "docx";

export class DocxAdapter {
  private docx: typeof DocxLib;

  constructor(docxLibrary: typeof DocxLib) {
    this.docx = docxLibrary;
  }

  // Main entry point
  public toParagraph(latex: string) {
    return new this.docx.Paragraph({
      children: [this.toMath(latex)],
    });
  }

  public toMath(latex: string) {
    const parser = new LatexParser(latex);
    const ast = parser.parse();
    const children = this.visit(ast);
    const mathChildren = Array.isArray(children) ? children : [children];
    return new this.docx.Math({
      children: mathChildren,
    });
  }

  // Recursive visitor
  private visit(node: MathNode): any {
    switch (node.type) {
      case "root":
      case "group":
        return (node.children || []).map((child) => this.visit(child)).flat();
      case "text":
        return new this.docx.MathRun(node.value || "");
      case "symbol":
      case "operator":
        return this.mapSymbol(node.value || "");
      case "fraction":
        return new this.docx.MathFraction({
          numerator: [this.visit(node.numerator!)].flat(),
          denominator: [this.visit(node.denominator!)].flat(),
        });
      case "subscript":
        return new this.docx.MathSubScript({
          children: [this.visit(node.base!)].flat(),
          subScript: [this.visit(node.sub!)].flat(),
        });
      case "superscript":
        return new this.docx.MathSuperScript({
          children: [this.visit(node.base!)].flat(),
          superScript: [this.visit(node.sup!)].flat(),
        });
      default:
        return new this.docx.MathRun("");
    }
  }

  private mapSymbol(latexCmd: string): any {
    // Basic stripping of backslash if it's just a char like "x"
    if (!latexCmd.startsWith("\\")) {
      return new this.docx.MathRun(latexCmd);
    }

    // Special Large Operators: Use Unicode for compatibility with limits (sub/sup).
    // These are extensible—contributors can add more (e.g., via PR) for common ops.
    // Word handles vertical stretching and limit positioning automatically in math mode.
    const largeOperatorsMap: Record<string, string> = {
      "\\sum": "∑",
      "\\int": "∫",
      "\\prod": "∏",
      "\\oint": "∮", // Contour integral (new)
      "\\iint": "∬", // Double integral (new)
      "\\iiint": "∭", // Triple integral (new)
      "\\bigcup": "⋃", // Big union (new)
      "\\bigcap": "⋂", // Big intersection (new)
      "\\bigvee": "⋁", // Big logical or (new)
      "\\bigwedge": "⋀", // Big logical and (new)
      "\\coprod": "∐", // Coproduct (new)
    };
    if (largeOperatorsMap[latexCmd]) {
      return new this.docx.MathRun(largeOperatorsMap[latexCmd]);
    }

    // Common Symbols Map: Organized by category for easier contributions.
    // Add new entries here for Unicode mappings. If a symbol has variants (e.g., \varepsilon vs \epsilon),
    // prioritize the most common. For contributions: Test rendering in Word to ensure proper display.
    const symbolsMap: Record<string, string> = {
      // --- Calculus ---
      "\\partial": "∂",
      "\\nabla": "∇",
      "\\infty": "∞",
      "\\Delta": "Δ",
      "\\delta": "δ",
      "\\lim": "lim",

      // --- Operators ---
      "\\cdot": "⋅",
      "\\times": "×",
      "\\approx": "≈",
      "\\ne": "≠",
      "\\le": "≤",
      "\\ge": "≥",
      "\\pm": "±",
      "\\rightarrow": "→",
      "\\leftrightarrow": "↔",
      "\\equiv": "≡",
      "\\sim": "∼",
      "\\propto": "∝",
      "\\subset": "⊂",
      "\\subseteq": "⊆",
      "\\in": "∈",
      "\\forall": "∀",
      "\\exists": "∃",

      // --- Greek Lowercase ---
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\epsilon": "ϵ",
      "\\zeta": "ζ",
      "\\eta": "η",
      "\\theta": "θ",
      "\\lambda": "λ",
      "\\mu": "μ",
      "\\nu": "ν",
      "\\xi": "ξ",
      "\\pi": "π",
      "\\rho": "ρ",
      "\\sigma": "σ",
      "\\tau": "τ",
      "\\phi": "ϕ",
      "\\chi": "χ",
      "\\psi": "ψ",
      "\\omega": "ω",

      // --- Greek Uppercase ---
      "\\Gamma": "Γ",
      "\\Theta": "Θ",
      "\\Lambda": "Λ",
      "\\Xi": "Ξ",
      "\\Pi": "Π",
      "\\Sigma": "Σ",
      "\\Phi": "Φ",
      "\\Psi": "Ψ",
      "\\Omega": "Ω",
    };
    if (symbolsMap[latexCmd]) {
      return new this.docx.MathRun(symbolsMap[latexCmd]);
    }

    // TODO: Expand maps above to reduce fallbacks. In dev, could console.warn(`Unmapped LaTeX: ${latexCmd}`);
    // Fallback: For unmapped commands, render as text without backslash.
    return new this.docx.MathRun(latexCmd.replace("\\", ""));
  }
}
