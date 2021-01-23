import * as readline from "readline";
import Lexer from "./lexer";
import Parser from "./parser";
import monkeyEval from "./evaluator";
import { Environment, inspect } from "./object";

const PROMPT = ">> ";

const ask = (rl: readline.Interface, prompt: string): Promise<string> => {
  return new Promise((resolve) => rl.question(prompt, resolve));
};

const startRepl = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const env = new Environment();

  while (true) {
    const input = await ask(rl, PROMPT);

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    if (parser.errors.length > 0 || !program) {
      console.log(parser.errors.join("\n\t"));
      continue;
    }

    console.log(inspect(monkeyEval(program, env)));
  }
};

export default startRepl;
