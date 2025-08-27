import {
  digits,
  upperCaseLetters,
  lowerCaseLetters,
  otherChars,
} from "./constants";

class Grep {
  private inputLine: string;
  private pattern: string;

  constructor(inputLine: string, pattern: string) {
    this.inputLine = inputLine;
    this.pattern = pattern;
  }

  private matchHelper(input: string, pattern: string): boolean {
    if (pattern === "\\d") {
      return digits.includes(input);
    }
    if (pattern === "\\w") {
      return (
        upperCaseLetters.includes(input) ||
        lowerCaseLetters.includes(input) ||
        otherChars.includes(input)
      );
    }
    return pattern === input;
  }

  public matchPattern(): boolean {
    const { inputLine, pattern } = this;

    if (pattern.length === 1) {
      return inputLine.includes(pattern);
    }

    // \d handler
    if (pattern.startsWith("\\d")) {
      let si_input = 0;
      let start_matching = false;

      for (si_input; si_input <= inputLine.length - 1; si_input++) {
        if (
          this.matchHelper(
            inputLine.substring(si_input, si_input + 1),
            pattern.substring(0, 2)
          )
        ) {
          start_matching = true;
        } else {
          continue;
        }

        try {
          if (start_matching) {
            let p_si = 0;
            let p_ei = 2;
            let incrementor = 2;
            let end = false;

            do {
              let subStr = pattern.substring(p_si, p_ei);
              if (!subStr.startsWith("\\")) {
                subStr = subStr.slice(0, 1);
                incrementor = 1;
              }
              if (subStr === "") {
                end = true;
                continue;
              }
              if (
                this.matchHelper(
                  inputLine.substring(si_input, si_input + 1),
                  subStr
                )
              ) {
                p_si += incrementor;
                p_ei += incrementor;
                si_input += 1;
                incrementor = 2;
              } else {
                throw Error("Unmatched expression");
              }
            } while (!end);
            return true;
          }
        } catch {}
      }
      return false;
    }

    // ^123 -> "123..."
    if (pattern.startsWith("^") && !pattern.endsWith("$")) {
      const exactMatch = pattern.substring(1);
      return inputLine.startsWith(exactMatch);
    }

    if (pattern.endsWith("$") && !pattern.startsWith("^")) {
      const exactMatch = pattern.substring(0, pattern.length - 1);
      return inputLine.endsWith(exactMatch);
    }

    if (pattern.startsWith("^") && pattern.endsWith("$")) {
      const exactMatch = pattern.substring(1, pattern.length - 1);
      return inputLine.startsWith(exactMatch) && inputLine.endsWith(exactMatch);
    }

    // ca+ts
    if (pattern.includes("+") && !pattern.includes(".")) {
      const [before, after] = pattern.split("+");
      for (let i = 0; i <= inputLine.length - 1; i++) {
        if (inputLine.substring(i, i + before.length) === before) {
          let endCheckStartingIndex = i + before.length;
          for (let j = endCheckStartingIndex; j <= inputLine.length - 1; j++) {
            if (inputLine.substring(j, j + after.length) === after) {
              return true;
            }
          }
        }
      }
      return false;
    }

    // optional quantifier ?
    if (pattern.includes("?")) {
      const [before, after] = pattern.split("?");
      for (let i = 0; i < inputLine.length; i++) {
        if (
          inputLine.substring(i, i + before.length + after.length) ===
          before + after
        ) {
          return true;
        }
        if (
          inputLine.substring(i, i + before.length - 1) ===
            before.substring(0, before.length - 1) &&
          inputLine.substring(
            i + before.length - 1,
            i + before.length - 1 + i + after.length
          ) === after
        ) {
          return true;
        }
      }
      return false;
    }

    // .
    if (pattern.includes(".")) {
      const [before, after] = pattern.split(".");
      if (before + after === inputLine) return true;

      for (let i = 0; i <= before.length - 1; i++) {
        if (inputLine[i] != before[i]) return false;
      }

      const rest_part = inputLine.substring(before.length);

      // check suffix using rest_part
      for (let j = 0; j < after.length; j++) {
        if (after[j] === "+" || after[j] === "*" || after[j] === "^") {
          continue;
        }
        if (rest_part[rest_part.length - after.length + j] !== after[j]) {
          return false;
        }
      }
      return true;
    }

    if (pattern.includes("|")) {
      const [before, after] = pattern.split("|");
      console.log(before, " ", after);
      if (inputLine.includes(before) || inputLine.includes(after)) {
        console.log(before, " ", after);
        console.log(inputLine.includes(before));
        console.log(inputLine.includes(after));
      }
      return false;
    }

    // \w
    if (pattern == "\\w") {
      return (
        digits.some((d) => inputLine.includes(d)) ||
        upperCaseLetters.some((u) => inputLine.includes(u)) ||
        lowerCaseLetters.some((l) => inputLine.includes(l)) ||
        otherChars.some((c) => inputLine.includes(c))
      );
    }

    // positive char groups
    if (
      pattern.startsWith("[") &&
      !pattern.startsWith("[^") &&
      pattern.endsWith("]")
    ) {
      const chars = pattern.slice(1, -1).split("");
      return chars.some((ch) => inputLine.includes(ch));
    }

    // negative char groups
    if (pattern.startsWith("[^") && pattern.endsWith("]")) {
      const inputArr = inputLine.split("");
      return inputArr.some((ch) => !pattern.includes(ch));
    }

    throw new Error(`Unhandled pattern: ${pattern}`);
  }
}

const args = process.argv;
if (args[2] !== "-E") {
  console.log("Expected first argument to be '-E'");
  process.exit(1);
}

const pattern = args[3];
const inputLine: string = await Bun.stdin.text();

const grep = new Grep(inputLine, pattern);

if (grep.matchPattern()) {
  process.exit(0);
} else {
  process.exit(1);
}
