export type MathNodeType =
  | "root"
  | "text"
  | "fraction"
  | "subscript"
  | "superscript"
  | "symbol"
  | "operator"
  | "group"
  | "function";

export interface MathNode {
  type: MathNodeType;
  value?: string;
  children?: MathNode[];

  // Specific properties for structural nodes
  // TODO: add more later
  numerator?: MathNode;
  denominator?: MathNode;
  base?: MathNode;
  sub?: MathNode;
  sup?: MathNode;
}
