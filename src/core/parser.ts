import { MathNode } from "./ast";
import {
  DELIMITERS,
  isFracCommand,
  isFunctionCommand,
  isNaryCommand,
  isRelationToken,
  isSpacingCommand,
  isTextCommand,
} from "./symbols";
import { tokenize } from "./tokenizer";

export { tokenize } from "./tokenizer";

export class LatexParser {
  private tokens: string[];
  private cursor: number = 0;

  constructor(latex: string) {
    this.tokens = tokenize(latex);
  }

  private peek(): string | null {
    return this.tokens[this.cursor] || null;
  }

  private consume(): string | null {
    return this.tokens[this.cursor++] || null;
  }

  private expect(char: string) {
    if (this.peek() === char) {
      this.consume();
      return true;
    }
    return false;
  }

  private skipSpaces() {
    while (this.peek() === " ") {
      this.consume();
    }
  }

  // For \frac and other commands: Greedily consumes the atom AND its postfixes
  // Example: \frac a^2 b -> Numerator is a^2
  private parseGreedyArg(): MathNode {
    this.skipSpaces();
    if (this.peek() === "{") {
      return this.parseGroup();
    }
    return this.parseNext();
  }

  // For _ and ^: Only consumes the atom, stops before the next postfix
  // Example: x_i^2 -> Subscript is 'i', Superscript is '2' (attached to x)
  private parseNonGreedyArg(): MathNode {
    this.skipSpaces();
    if (this.peek() === "{") {
      return this.parseGroup();
    }
    return this.parseAtom();
  }

  private parseGroup(): MathNode {
    this.consume(); // eat {
    const group: MathNode = { type: "group", children: [] };
    while (this.peek() !== "}" && this.peek() !== null) {
      if (this.peek() === " ") {
        this.consume();
        continue;
      }
      group.children?.push(this.parseNext());
    }
    this.expect("}");
    return group;
  }

  private parseDelimiterGlyph(): string {
    this.skipSpaces();
    const token = this.peek();
    if (token === null) return "";
    this.consume();
    if (token in DELIMITERS) return DELIMITERS[token];
    if (token.startsWith("\\")) return DELIMITERS[token] ?? token.slice(1);
    return token;
  }

  private parseLeftRight(): MathNode {
    const left = this.parseDelimiterGlyph();
    const children: MathNode[] = [];
    while (this.peek() !== null && this.peek() !== "\\right") {
      if (this.peek() === " ") {
        this.consume();
        continue;
      }
      children.push(this.parseNext());
    }
    if (this.peek() === "\\right") {
      this.consume();
    }
    const right = this.peek() !== null ? this.parseDelimiterGlyph() : "";
    return { type: "delimited", left, right, children };
  }

  private parseSqrt(): MathNode {
    this.skipSpaces();
    let index: MathNode | undefined;
    if (this.peek() === "[") {
      this.consume();
      const degreeKids: MathNode[] = [];
      while (this.peek() !== "]" && this.peek() !== null) {
        if (this.peek() === " ") {
          this.consume();
          continue;
        }
        degreeKids.push(this.parseNext());
      }
      this.expect("]");
      index =
        degreeKids.length === 1
          ? degreeKids[0]
          : { type: "group", children: degreeKids };
    }
    const radicand = this.parseGreedyArg();
    return { type: "radical", radicand, index };
  }

  private parseTextCommand(style: "normal" | "bold" | "italic"): MathNode {
    this.skipSpaces();
    if (this.peek() !== "{") {
      return { type: "textmode", style, children: [this.parseAtom()] };
    }
    this.consume();
    const children: MathNode[] = [];
    while (this.peek() !== "}" && this.peek() !== null) {
      if (this.peek() === " ") {
        children.push({ type: "space", value: "\\ " });
        this.consume();
        continue;
      }
      children.push(this.parseNext());
    }
    this.expect("}");
    return { type: "textmode", style, children };
  }

  private parseAtom(): MathNode {
    this.skipSpaces();
    const token = this.consume();
    if (!token) return { type: "text", value: "" };

    if (token.startsWith("\\")) {
      if (isFracCommand(token)) {
        return {
          type: "fraction",
          numerator: this.parseGreedyArg(),
          denominator: this.parseGreedyArg(),
        };
      }
      if (token === "\\sqrt") {
        return this.parseSqrt();
      }
      if (token === "\\left") {
        return this.parseLeftRight();
      }
      if (isTextCommand(token)) {
        const style = token === "\\mathbf" || token === "\\textbf" ? "bold" : "normal";
        return this.parseTextCommand(style);
      }
      if (isSpacingCommand(token)) {
        return { type: "space", value: token };
      }
      if (isNaryCommand(token)) {
        return { type: "nary", value: token };
      }
      if (isFunctionCommand(token)) {
        return { type: "function", value: token };
      }
      if (token === "\\%" || token === "\\#") {
        return { type: "operator", value: token.slice(1) };
      }
      return { type: "symbol", value: token };
    }

    if (token.match(/^[a-zA-Z0-9]/) || token.match(/^[0-9][.,][0-9]/)) {
      return { type: "text", value: token };
    }

    return { type: "operator", value: token };
  }

  private attachScripts(node: MathNode): MathNode {
    let sub: MathNode | undefined;
    let sup: MathNode | undefined;

    while (true) {
      this.skipSpaces();
      const next = this.peek();
      if (next === "_") {
        this.consume();
        sub = this.parseNonGreedyArg();
      } else if (next === "^") {
        this.consume();
        sup = this.parseNonGreedyArg();
      } else if (next === "'") {
        this.consume();
        let primes = "′";
        while (this.peek() === "'") {
          this.consume();
          primes += "′";
        }
        const primeNode: MathNode = { type: "text", value: primes };
        sup = sup
          ? { type: "group", children: [sup, primeNode] }
          : primeNode;
      } else {
        break;
      }
    }

    if (node.type === "nary" || node.type === "function") {
      if (sub) node.sub = sub;
      if (sup) node.sup = sup;
      return node;
    }

    if (sub && sup) {
      return { type: "scripts", base: node, sub, sup };
    }
    if (sub) {
      return { type: "subscript", base: node, sub };
    }
    if (sup) {
      return { type: "superscript", base: node, sup };
    }
    return node;
  }

  private canStartFunctionArg(token: string | null): boolean {
    if (!token) return false;
    if (token === "{" || token === "(" || token === "[") return true;
    if (token === "\\left") return true;
    if (isFracCommand(token) || token === "\\sqrt") return true;
    if (isRelationToken(token) || isNaryCommand(token) || isFunctionCommand(token)) {
      return false;
    }
    if (isSpacingCommand(token) || token === "\\right") return false;
    if (token === "}" || token === ")" || token === "]" || token === ",") return false;
    if (token === "+" || token === "-" || token === "=" || token === "&") return false;
    if (token.startsWith("\\")) return true;
    if (/^[a-zA-Z0-9]/.test(token)) return true;
    return false;
  }

  private parseParenGroup(): MathNode {
    this.consume();
    const children: MathNode[] = [];
    while (this.peek() !== ")" && this.peek() !== null) {
      if (this.peek() === " ") {
        this.consume();
        continue;
      }
      children.push(this.parseNext());
    }
    this.expect(")");
    return { type: "delimited", left: "(", right: ")", children };
  }

  private parseFunctionArg(): MathNode {
    this.skipSpaces();
    if (this.peek() === "{") return this.parseGroup();
    if (this.peek() === "(") return this.parseParenGroup();
    return this.parseGreedyArg();
  }

  private parseNaryBody(): MathNode | undefined {
    this.skipSpaces();
    const children: MathNode[] = [];
    while (this.peek() !== null) {
      this.skipSpaces();
      const next = this.peek();
      if (next === null || next === "}" || next === "\\right") break;
      if (isRelationToken(next) || isNaryCommand(next)) break;
      children.push(this.parseNext());
    }
    if (children.length === 0) return undefined;
    return { type: "group", children };
  }

  public parseNext(): MathNode {
    this.skipSpaces();
    if (this.peek() === null) return { type: "text", value: "" };

    let node = this.peek() === "{" ? this.parseGroup() : this.parseAtom();
    node = this.attachScripts(node);

    if (node.type === "nary") {
      const body = this.parseNaryBody();
      if (body) node.body = body;
    } else if (node.type === "function") {
      this.skipSpaces();
      if (this.canStartFunctionArg(this.peek())) {
        node.children = [this.parseFunctionArg()];
      }
    }

    return node;
  }

  public parse(): MathNode {
    const root: MathNode = { type: "root", children: [] };
    while (true) {
      this.skipSpaces();
      if (this.peek() === null) break;
      root.children?.push(this.parseNext());
    }
    return root;
  }
}
