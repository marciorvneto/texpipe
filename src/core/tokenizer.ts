import { MathNode } from "./ast";

const tokenize = (latex: string): string[] => {
  const tokens: string[] = [];
  // Regex captures: commands (\cmd), single chars (a, 1), operators (+, =), braces ({, })
  const regex = /(\\[a-zA-Z]+)|([a-zA-Z0-9])|([\^_=+\-\(\)])|(\{)|(\})/g;
  let match;
  while ((match = regex.exec(latex)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
};

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

  // Parse { ... } groups or single tokens
  private parseGroupOrToken(): MathNode {
    if (this.peek() === "{") {
      this.consume(); // eat {
      const group: MathNode = { type: "group", children: [] };
      while (this.peek() !== "}" && this.peek() !== null) {
        group.children?.push(this.parseNext());
      }
      this.expect("}"); // eat }
      return group;
    }
    return this.parseNext();
  }

  public parseNext(): MathNode {
    const token = this.consume();
    if (!token) return { type: "text", value: "" };

    let node: MathNode;

    // 1. Commands
    if (token.startsWith("\\")) {
      if (token === "\\frac") {
        node = {
          type: "fraction",
          numerator: this.parseGroupOrToken(),
          denominator: this.parseGroupOrToken(),
        };
      } else if (["\\int", "\\sum", "\\prod"].includes(token)) {
        node = { type: "operator", value: token };
      } else {
        // Generic symbol (e.g., \alpha, \cdot)
        node = { type: "symbol", value: token };
      }
    }
    // 2. Literals (Numbers/Letters)
    else if (token.match(/[a-zA-Z0-9]/)) {
      node = { type: "text", value: token };
    }
    // 3. Misc Operators (e.g. +, =)
    else {
      node = { type: "operator", value: token };
    }

    // 4. Handle Postfix (Subscripts/Superscripts)
    while (true) {
      const next = this.peek();
      if (next === "_") {
        this.consume();
        const sub = this.parseGroupOrToken();
        node = { type: "subscript", base: node, sub };
      } else if (next === "^") {
        this.consume();
        const sup = this.parseGroupOrToken();
        node = { type: "superscript", base: node, sup };
      } else {
        break;
      }
    }

    return node;
  }

  public parse(): MathNode {
    const root: MathNode = { type: "root", children: [] };
    while (this.peek() !== null) {
      root.children?.push(this.parseNext());
    }
    return root;
  }
}
