# texpipe

**A modular, lightweight LaTeX-to-AST parser with adapters for native document generation.**

![Version](https://img.shields.io/npm/v/@marciorvneto/texpipe)
![License](https://img.shields.io/npm/l/@marciorvneto/texpipe)

## 🏗 What is this?

`texpipe` is a library designed to bridge the gap between LaTeX strings and non-web formats.

Most LaTeX libraries (like KaTeX or MathJax) focus on rendering to HTML/CSS. `texpipe` focuses on parsing LaTeX into a semantic **Abstract Syntax Tree (AST)** that can be consumed by different "Adapters" to generate native objects for other environments—starting with **Microsoft Word (DOCX)**.

It was built to solve a specific problem at [Voima](https://voimatoolbox.com/en-beta): **Generating native, editable math equations in Word reports without using images.**

## 🚀 Installation

```bash
npm install @marciorvneto/texpipe
```

## 🛠 Usage

### 1. The DOCX Adapter (Native Word Equations)

This adapter generates native [`Office Math`](https://devblogs.microsoft.com/math-in-office/officemath/) objects compatible with the [`docx`](https://docx.js.org) library.

**Note:** To prevent version conflicts and file corruption, `texpipe` uses **Dependency Injection**. You must pass your own instance of the `docx` library to the adapter.

```typescript
import * as docx from "docx"; // Your application's installed version
import { DocxAdapter } from "@marciorvneto/texpipe";
import { Packer } from "docx";

// 1. Initialize the adapter with your library instance
const adapter = new DocxAdapter(docx);

// 2. Convert LaTeX directly to a Paragraph or Math object
const equationParagraph = adapter.toParagraph("A_3 = \\int_a^b e^{2x} dx");

// 3. Use it in your document
const doc = new docx.Document({
  sections: [
    {
      children: [new docx.Paragraph("Here is the result:"), equationParagraph],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("report.docx", buffer);
});
```

### 2. Using the AST Directly

If you want to build your own adapter (e.g., for SVG, HTML Canvas, or React Native), you can access the core parser.

```typescript
import { LatexParser } from "@marciorvneto/texpipe";

const latex = "x^2 + y^2 = r^2";
const parser = new LatexParser(latex);
const ast = parser.parse();

console.log(JSON.stringify(ast, null, 2));
/* Output:
{
  "type": "root",
  "children": [
    { "type": "text", "value": "x" },
    { "type": "superscript", "base": ..., "sup": ... },
    ...
  ]
}
*/
```

## ⚠️ Current Status

**This project is in early Alpha.**

It currently supports:

- ✅ Basic Tokenization (Commands, Groups `{...}`, Symbols)
- ✅ Operator Precedence (Correctly handles `x_i^2`)
- ✅ **DOCX Adapter** (Supports Fractions, Integrals, Sums, Greek letters, and standard operators)

It **does not yet** support:

- ❌ Complex Matrices (`\begin{matrix}`)
- ❌ Text formatting inside math (`\text{...}`)
- ❌ Complex nesting of large operators
- ❌ Custom macros (`\newcommand`)

## 🤝 Contributing

We are actively looking for contributors! This library is very recent and there is a long way to go.

We are specifically looking for:

1. **New Adapters:** `ReactAdapter` (render directly to React nodes without KaTeX), `SvgAdapter`, etc.
2. **Parser Improvements:** Better handling of environments like `\begin{case}`.
3. **Bug Fixes:** Edge cases in the tokenizer.

If you are interested, please fork the repository and submit a PR!

## 📄 License

MIT © [Marcio R. V. Neto](https://github.com/marciorvneto)
