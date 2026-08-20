/**
 * Tokenize a LaTeX math string.
 *
 * Unlike the original character-class regex, this keeps punctuation that
 * engineering formulas actually use: decimals, commas, slashes, primes,
 * absolute-value bars, and single-character commands such as `\,` and `\%`.
 */
export const tokenize = (latex: string): string[] => {
  const tokens: string[] = [];
  let i = 0;
  const n = latex.length;

  while (i < n) {
    const c = latex[i];

    if (/\s/.test(c)) {
      tokens.push(" ");
      i++;
      while (i < n && /\s/.test(latex[i])) i++;
      continue;
    }

    if (c === "\\") {
      i++;
      if (i >= n) {
        tokens.push("\\");
        break;
      }
      if (/[a-zA-Z]/.test(latex[i])) {
        let cmd = "\\";
        while (i < n && /[a-zA-Z]/.test(latex[i])) {
          cmd += latex[i++];
        }
        tokens.push(cmd);
      } else {
        // \, \; \% \{ \lceil is letter-based; this branch is \, \; \! \{ \} \\ \%
        tokens.push("\\" + latex[i]);
        i++;
      }
      continue;
    }

    if (/[0-9]/.test(c)) {
      let num = "";
      while (i < n && /[0-9]/.test(latex[i])) {
        num += latex[i++];
      }
      // Keep 1.42 and Brazilian 1,42 as a single run so Word does not drop the separator.
      if (
        i < n &&
        (latex[i] === "." || latex[i] === ",") &&
        i + 1 < n &&
        /[0-9]/.test(latex[i + 1])
      ) {
        num += latex[i++];
        while (i < n && /[0-9]/.test(latex[i])) {
          num += latex[i++];
        }
      }
      tokens.push(num);
      continue;
    }

    if (/[a-zA-Z]/.test(c)) {
      tokens.push(c);
      i++;
      continue;
    }

    tokens.push(c);
    i++;
  }

  return tokens;
};
