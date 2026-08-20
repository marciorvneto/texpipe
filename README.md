# texpipe

LaTeX math → AST → native Word equations.

KaTeX and MathJax render to HTML. This parses LaTeX into an AST and turns it into [Office Math](https://devblogs.microsoft.com/math-in-office/officemath/) objects for [`docx`](https://docx.js.org), so the equations stay editable. Built for [Voima](https://voimatoolbox.com/en-beta) reports.

![Version](https://img.shields.io/npm/v/@marciorvneto/texpipe)
![License](https://img.shields.io/npm/l/@marciorvneto/texpipe)

## Install

```bash
npm install @marciorvneto/texpipe
```

`docx` is a peer dependency. Pass your own instance into the adapter so you don't end up with two copies of the library in one document.

```typescript
import * as docx from "docx";
import { DocxAdapter } from "@marciorvneto/texpipe";
import { Packer } from "docx";
import * as fs from "fs";

const adapter = new DocxAdapter(docx);

const doc = new docx.Document({
  sections: [
    {
      children: [
        new docx.Paragraph("Here is the result:"),
        adapter.toParagraph("A_3 = \\int_a^b e^{2x} dx"),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("report.docx", buffer);
});
```

`toMath` if you want the equation without wrapping it in a paragraph.

## AST

```typescript
import { LatexParser } from "@marciorvneto/texpipe";

const ast = new LatexParser("x^2 + y^2 = r^2").parse();
```

Use that if you want a different backend (SVG, canvas, whatever).

## What works

Fractions, sub/superscripts (`x_i^2`), radicals, `\left...\right`, `\mathrm` / `\text` (upright), `\sin` `\cos` `\log` and friends, `\int` / `\sum` with limits, Greek, arrows, decimals (`1.42` and `1,42`), units like `\mathrm{kg/m^3}`.

Still missing: matrices, accents (`\dot`, `\bar`, `\vec`), `\newcommand`.

PRs welcome.

## License

MIT © [Marcio R. V. Neto](https://github.com/marciorvneto)
