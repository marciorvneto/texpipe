/** Unicode mappings for LaTeX commands that render as a single glyph. */
export const LARGE_OPERATORS: Record<string, string> = {
  "\\sum": "∑",
  "\\int": "∫",
  "\\prod": "∏",
  "\\oint": "∮",
  "\\iint": "∬",
  "\\iiint": "∭",
  "\\bigcup": "⋃",
  "\\bigcap": "⋂",
  "\\bigvee": "⋁",
  "\\bigwedge": "⋀",
  "\\coprod": "∐",
};

export const SYMBOLS: Record<string, string> = {
  // --- Calculus / constants ---
  "\\partial": "∂",
  "\\nabla": "∇",
  "\\infty": "∞",
  "\\Delta": "Δ",
  "\\delta": "δ",
  "\\circ": "°",
  "\\degree": "°",
  "\\ell": "ℓ",
  "\\hbar": "ℏ",

  // --- Operators ---
  "\\cdot": "⋅",
  "\\times": "×",
  "\\div": "÷",
  "\\ast": "∗",
  "\\star": "⋆",
  "\\approx": "≈",
  "\\ne": "≠",
  "\\neq": "≠",
  "\\le": "≤",
  "\\ge": "≥",
  "\\leq": "≤",
  "\\geq": "≥",
  "\\pm": "±",
  "\\mp": "∓",
  "\\equiv": "≡",
  "\\sim": "∼",
  "\\propto": "∝",
  "\\subset": "⊂",
  "\\subseteq": "⊆",
  "\\supset": "⊃",
  "\\supseteq": "⊇",
  "\\in": "∈",
  "\\notin": "∉",
  "\\forall": "∀",
  "\\exists": "∃",
  "\\neg": "¬",
  "\\wedge": "∧",
  "\\vee": "∨",
  "\\cap": "∩",
  "\\cup": "∪",
  "\\oplus": "⊕",
  "\\otimes": "⊗",
  "\\perp": "⊥",
  "\\parallel": "∥",
  "\\angle": "∠",

  // --- Arrows ---
  "\\rightarrow": "→",
  "\\to": "→",
  "\\leftarrow": "←",
  "\\leftrightarrow": "↔",
  "\\Rightarrow": "⇒",
  "\\Leftarrow": "⇐",
  "\\Leftrightarrow": "⇔",
  "\\mapsto": "↦",
  "\\uparrow": "↑",
  "\\downarrow": "↓",

  // --- Dots ---
  "\\ldots": "…",
  "\\cdots": "⋯",
  "\\vdots": "⋮",
  "\\ddots": "⋱",

  // --- Delimiter glyphs (also used after \\left / \\right) ---
  "\\lceil": "⌈",
  "\\rceil": "⌉",
  "\\lfloor": "⌊",
  "\\rfloor": "⌋",
  "\\langle": "⟨",
  "\\rangle": "⟩",
  "\\vert": "|",
  "\\Vert": "‖",
  "\\lbrace": "{",
  "\\rbrace": "}",
  "\\backslash": "\\",

  // --- Greek lowercase ---
  "\\alpha": "α",
  "\\beta": "β",
  "\\gamma": "γ",
  "\\epsilon": "ϵ",
  "\\varepsilon": "ε",
  "\\zeta": "ζ",
  "\\eta": "η",
  "\\theta": "θ",
  "\\vartheta": "ϑ",
  "\\iota": "ι",
  "\\kappa": "κ",
  "\\lambda": "λ",
  "\\mu": "μ",
  "\\nu": "ν",
  "\\xi": "ξ",
  "\\pi": "π",
  "\\rho": "ρ",
  "\\varrho": "ϱ",
  "\\sigma": "σ",
  "\\varsigma": "ς",
  "\\tau": "τ",
  "\\upsilon": "υ",
  "\\phi": "ϕ",
  "\\varphi": "φ",
  "\\chi": "χ",
  "\\psi": "ψ",
  "\\omega": "ω",

  // --- Greek uppercase ---
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

export const SPACING: Record<string, string> = {
  "\\quad": "\u2003",
  "\\qquad": "\u2003\u2003",
  "\\,": "\u2009",
  "\\;": "\u2005",
  "\\:": "\u2004",
  "\\!": "\u200B",
  "\\ ": " ",
};

export const DELIMITERS: Record<string, string> = {
  "(": "(",
  ")": ")",
  "[": "[",
  "]": "]",
  "{": "{",
  "}": "}",
  "\\{": "{",
  "\\}": "}",
  "|": "|",
  "\\|": "‖",
  ".": "",
  "/": "/",
  "<": "⟨",
  ">": "⟩",
  "\\lceil": "⌈",
  "\\rceil": "⌉",
  "\\lfloor": "⌊",
  "\\rfloor": "⌋",
  "\\langle": "⟨",
  "\\rangle": "⟩",
  "\\vert": "|",
  "\\Vert": "‖",
  "\\lbrace": "{",
  "\\rbrace": "}",
  "\\uparrow": "↑",
  "\\downarrow": "↓",
};

export const FUNCTIONS: Record<string, string> = {
  "\\sin": "sin",
  "\\cos": "cos",
  "\\tan": "tan",
  "\\cot": "cot",
  "\\sec": "sec",
  "\\csc": "csc",
  "\\arcsin": "arcsin",
  "\\arccos": "arccos",
  "\\arctan": "arctan",
  "\\sinh": "sinh",
  "\\cosh": "cosh",
  "\\tanh": "tanh",
  "\\log": "log",
  "\\ln": "ln",
  "\\lg": "lg",
  "\\exp": "exp",
  "\\max": "max",
  "\\min": "min",
  "\\sup": "sup",
  "\\inf": "inf",
  "\\det": "det",
  "\\dim": "dim",
  "\\ker": "ker",
  "\\deg": "deg",
  "\\gcd": "gcd",
  "\\lim": "lim",
};

const TEXT_COMMANDS = new Set([
  "\\mathrm",
  "\\text",
  "\\textrm",
  "\\mathbf",
  "\\textbf",
  "\\operatorname",
  "\\mbox",
  "\\mathit",
]);

const FRAC_COMMANDS = new Set(["\\frac", "\\dfrac", "\\tfrac"]);

const RELATION_TOKENS = new Set([
  "=",
  "<",
  ">",
  "\\leq",
  "\\geq",
  "\\le",
  "\\ge",
  "\\neq",
  "\\ne",
  "\\approx",
  "\\equiv",
  "\\sim",
  "\\propto",
  "\\Rightarrow",
  "\\rightarrow",
  "\\to",
  "\\Leftarrow",
  "\\Leftrightarrow",
  "\\mapsto",
]);

export const isTextCommand = (token: string): boolean => TEXT_COMMANDS.has(token);
export const isFracCommand = (token: string): boolean => FRAC_COMMANDS.has(token);
export const isSpacingCommand = (token: string): boolean => token in SPACING;
export const isFunctionCommand = (token: string): boolean => token in FUNCTIONS;
export const isNaryCommand = (token: string): boolean => token in LARGE_OPERATORS;
export const isRelationToken = (token: string): boolean => RELATION_TOKENS.has(token);
export const isIntegralOp = (token: string): boolean =>
  token === "\\int" ||
  token === "\\oint" ||
  token === "\\iint" ||
  token === "\\iiint";

export const resolveSymbol = (cmd: string): string | undefined =>
  LARGE_OPERATORS[cmd] ?? SYMBOLS[cmd] ?? FUNCTIONS[cmd];
