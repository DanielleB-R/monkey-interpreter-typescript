import * as readline from "readline";
import Lexer from "./lexer";
import { TokenType } from "./token";

const PROMPT = ">> ";

const ask = (rl: readline.Interface, prompt: string): Promise<string> => {
  return new Promise((resolve) => rl.question(prompt, resolve));
};

const startRepl = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const input = await ask(rl, PROMPT);

    const lexer = new Lexer(input);
    while (true) {
      const token = lexer.nextToken();
      if (token.tokenType == TokenType.EOF) {
        break;
      }
      console.log(token);
    }
  }
};

export default startRepl;
