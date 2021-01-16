import Lexer from "../src/lexer";
import Parser from "../src/parser";
import monkeyEval from "../src/evaluator";
import * as o from "../src/object";

describe("monkeyEval", () => {
  it("should evaluate plain integer literals", () => {
    const cases: [string, number][] = [
      ["5", 5],
      ["10", 10],
    ];

    cases.forEach(([input, output]) => {
      const result = testEval(input);

      checkIntegerObject(result, output);
    });
  });
});

const testEval = (input: string): o.MonkeyObject => {
  const parser = new Parser(new Lexer(input));
  const program = parser.parseProgram();

  expect(parser.errors).toHaveLength(0);

  return monkeyEval(program);
};

const checkIntegerObject = (result: o.MonkeyObject, n: number) => {
  expect(result).toBeInstanceOf(o.MonkeyInteger);
  const integer = result as o.MonkeyInteger;

  expect(integer.value).toBe(n);
};
