export type MathNodeType =
  | "root"
  | "text"
  | "fraction"
  | "subscript"
  | "superscript"
  | "scripts"
  | "symbol"
  | "operator"
  | "group"
  | "function"
  | "radical"
  | "delimited"
  | "textmode"
  | "space"
  | "nary";

export interface MathNode {
  type: MathNodeType;
  value?: string;
  children?: MathNode[];

  numerator?: MathNode;
  denominator?: MathNode;
  base?: MathNode;
  sub?: MathNode;
  sup?: MathNode;

  /** Content under a radical. */
  radicand?: MathNode;
  /** Optional nth-root degree (`\sqrt[n]{x}`). */
  index?: MathNode;

  /** Stretchy delimiters from `\left` / `\right`. */
  left?: string;
  right?: string;

  /** `\mathrm` / `\text` / `\mathbf`. */
  style?: "normal" | "bold" | "italic";

  /** Integrand / summand of an n-ary operator. */
  body?: MathNode;
}
