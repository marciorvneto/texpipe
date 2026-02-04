import { MathNode } from "./ast";

// =================================
//
//   Tokenization
//
// =================================

const tokenize = (latex: string): string[] => {
  const tokens: string[] = [];
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

  // =================================
  //
  //   Parsing
  //
  // =================================

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

  // =================================
  //
  //   Helpers for argument parsing
  //
  // =================================

  // For \frac and other commands: Greedily consumes the atom AND its postfixes
  // Example: \frac a^2 b -> Numerator is a^2
  private parseGreedyArg(): MathNode {
    if (this.peek() === "{") {
      return this.parseGroup();
    }
    return this.parseNext();
  }

  // For _ and ^: Only consumes the atom, stops before the next postfix
  // Example: x_i^2 -> Subscript is 'i', Superscript is '2' (attached to x)
  private parseNonGreedyArg(): MathNode {
    if (this.peek() === "{") {
      return this.parseGroup();
    }
    return this.parseAtom();
  }

  private parseGroup(): MathNode {
    this.consume(); // eat {
    const group: MathNode = { type: "group", children: [] };
    while (this.peek() !== "}" && this.peek() !== null) {
      group.children?.push(this.parseNext());
    }
    this.expect("}");
    return group;
  }

  // Parses a single unit (Literal, Command, or Operator) without checking for postfixes
  private parseAtom(): MathNode {
    const token = this.consume();
    if (!token) return { type: "text", value: "" };

    // 1. Commands
    if (token.startsWith("\\")) {
      if (token === "\\frac") {
        return {
          type: "fraction",
          numerator: this.parseGreedyArg(),
          denominator: this.parseGreedyArg(),
        };
      }
      return { type: "symbol", value: token };
    }

    // 2. Literals
    if (token.match(/[a-zA-Z0-9]/)) {
      return { type: "text", value: token };
    }

    // 3. Misc
    return { type: "operator", value: token };
  }

  public parseNext(): MathNode {
    // Handle atoms and groups
    let node = this.peek() === "{" ? this.parseGroup() : this.parseAtom();

    // Subscripts/Superscripts
    while (true) {
      const next = this.peek();
      if (next === "_") {
        this.consume();
        const sub = this.parseNonGreedyArg();
        node = { type: "subscript", base: node, sub };
      } else if (next === "^") {
        this.consume();
        const sup = this.parseNonGreedyArg();
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
