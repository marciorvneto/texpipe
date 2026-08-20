import { MathNode } from "../core/ast";
import { LatexParser } from "../core/parser";
import {
  FUNCTIONS,
  LARGE_OPERATORS,
  resolveSymbol,
  SPACING,
} from "../core/symbols";
import type * as DocxLib from "docx";

export class DocxAdapter {
  private docx: typeof DocxLib;

  constructor(docxLibrary: typeof DocxLib) {
    this.docx = docxLibrary;
  }

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

  private asArray(node: unknown): any[] {
    if (node == null) return [];
    return (Array.isArray(node) ? node : [node]).flat();
  }

  /** Upright math run (`m:nor`) so units and function names are not italic. */
  private romanRun(text: string): any {
    const Xml = (this.docx as any).XmlComponent;
    const Empty = (this.docx as any).EmptyElement;
    if (!Xml || !Empty) {
      return new this.docx.MathRun(text);
    }
    const rPr = new Xml("m:rPr");
    rPr.addChildElement(new Empty("m:nor"));
    const t = new Xml("m:t");
    t.addChildElement(text);
    const r = new Xml("m:r");
    r.addChildElement(rPr);
    r.addChildElement(t);
    return r;
  }

  private run(text: string, roman: boolean): any {
    return roman ? this.romanRun(text) : new this.docx.MathRun(text);
  }

  private visit(node: MathNode, roman = false): any {
    switch (node.type) {
      case "root":
      case "group":
        return (node.children || []).map((child) => this.visit(child, roman)).flat();

      case "text":
        return this.run(node.value || "", roman);

      case "symbol":
      case "operator":
        return this.mapSymbol(node.value || "", roman);

      case "space":
        return this.run(SPACING[node.value || ""] ?? " ", roman);

      case "textmode":
        return (node.children || [])
          .map((child) => this.visit(child, node.style !== "italic"))
          .flat();

      case "fraction":
        return new this.docx.MathFraction({
          numerator: this.asArray(this.visit(node.numerator!, roman)),
          denominator: this.asArray(this.visit(node.denominator!, roman)),
        });

      case "scripts":
        return new this.docx.MathSubSuperScript({
          children: this.asArray(this.visit(node.base!, roman)),
          subScript: this.asArray(this.visit(node.sub!, roman)),
          superScript: this.asArray(this.visit(node.sup!, roman)),
        });

      case "subscript":
        if (node.base?.type === "superscript") {
          return new this.docx.MathSubSuperScript({
            children: this.asArray(this.visit(node.base.base!, roman)),
            subScript: this.asArray(this.visit(node.sub!, roman)),
            superScript: this.asArray(this.visit(node.base.sup!, roman)),
          });
        }
        return new this.docx.MathSubScript({
          children: this.asArray(this.visit(node.base!, roman)),
          subScript: this.asArray(this.visit(node.sub!, roman)),
        });

      case "superscript":
        if (node.base?.type === "subscript") {
          return new this.docx.MathSubSuperScript({
            children: this.asArray(this.visit(node.base.base!, roman)),
            subScript: this.asArray(this.visit(node.base.sub!, roman)),
            superScript: this.asArray(this.visit(node.sup!, roman)),
          });
        }
        return new this.docx.MathSuperScript({
          children: this.asArray(this.visit(node.base!, roman)),
          superScript: this.asArray(this.visit(node.sup!, roman)),
        });

      case "radical":
        return new this.docx.MathRadical({
          children: this.asArray(this.visit(node.radicand!, roman)),
          degree: node.index
            ? this.asArray(this.visit(node.index, roman))
            : undefined,
        });

      case "delimited":
        return this.visitDelimited(node, roman);

      case "function":
        return this.visitFunction(node);

      case "nary":
        return this.visitNary(node, roman);

      default:
        return new this.docx.MathRun("");
    }
  }

  private scriptedName(nameRuns: any[], node: MathNode): any[] {
    if (node.sub && node.sup) {
      return [
        new this.docx.MathSubSuperScript({
          children: nameRuns,
          subScript: this.asArray(this.visit(node.sub)),
          superScript: this.asArray(this.visit(node.sup)),
        }),
      ];
    }
    if (node.sub) {
      return [
        new this.docx.MathSubScript({
          children: nameRuns,
          subScript: this.asArray(this.visit(node.sub)),
        }),
      ];
    }
    if (node.sup) {
      return [
        new this.docx.MathSuperScript({
          children: nameRuns,
          superScript: this.asArray(this.visit(node.sup)),
        }),
      ];
    }
    return nameRuns;
  }

  private visitFunction(node: MathNode): any {
    const label = FUNCTIONS[node.value || ""] ?? (node.value || "").replace("\\", "");
    const nameRuns = this.scriptedName([this.romanRun(label)], node);
    const arg = node.children?.[0];
    if (!arg || !(this.docx as any).MathFunction) {
      const out = [...nameRuns];
      if (arg) out.push(...this.asArray(this.visit(arg)));
      return out.length === 1 ? out[0] : out;
    }
    return new this.docx.MathFunction({
      name: nameRuns,
      children: this.asArray(this.visit(arg)),
    });
  }

  private visitNary(node: MathNode, roman: boolean): any {
    const op = node.value || "";
    const body = node.body
      ? this.asArray(this.visit(node.body, roman))
      : [new this.docx.MathRun("")];
    const sub = node.sub ? this.asArray(this.visit(node.sub, roman)) : undefined;
    const sup = node.sup ? this.asArray(this.visit(node.sup, roman)) : undefined;

    if (op === "\\int" && (this.docx as any).MathIntegral) {
      return new this.docx.MathIntegral({
        children: body,
        subScript: sub,
        superScript: sup,
      });
    }
    if (op === "\\sum" && (this.docx as any).MathSum) {
      return new this.docx.MathSum({
        children: body,
        subScript: sub,
        superScript: sup,
      });
    }

    let glyph: any = this.run(LARGE_OPERATORS[op] ?? op.replace("\\", ""), roman);
    if (sub && sup) {
      glyph = new this.docx.MathSubSuperScript({
        children: this.asArray(glyph),
        subScript: sub,
        superScript: sup,
      });
    } else if (sub) {
      glyph = new this.docx.MathSubScript({
        children: this.asArray(glyph),
        subScript: sub,
      });
    } else if (sup) {
      glyph = new this.docx.MathSuperScript({
        children: this.asArray(glyph),
        superScript: sup,
      });
    }
    return node.body ? [glyph, ...body] : glyph;
  }

  private visitDelimited(node: MathNode, roman: boolean): any {
    const children = (node.children || [])
      .map((child) => this.visit(child, roman))
      .flat();
    const left = node.left || "";
    const right = node.right || "";

    if (left === "(" && right === ")") {
      return new this.docx.MathRoundBrackets({ children });
    }
    if (left === "[" && right === "]") {
      return new this.docx.MathSquareBrackets({ children });
    }
    if (left === "{" && right === "}") {
      return new this.docx.MathCurlyBrackets({ children });
    }
    if (left === "⟨" && right === "⟩") {
      return new this.docx.MathAngledBrackets({ children });
    }

    const out: any[] = [];
    if (left) out.push(this.run(left, roman));
    out.push(...children);
    if (right) out.push(this.run(right, roman));
    return out;
  }

  private mapSymbol(latexCmd: string, roman: boolean): any {
    if (!latexCmd.startsWith("\\")) {
      return this.run(latexCmd, roman);
    }

    const mapped = resolveSymbol(latexCmd);
    if (mapped !== undefined) {
      return this.run(mapped, roman);
    }

    return this.run(latexCmd.replace("\\", ""), roman);
  }
}
