import * as ast from "../src/ast-json";
import * as o from "../src/object";
import Lexer from "../src/lexer";
import Parser from "../src/parser";
import monkeyEval from "../src/evaluator";

describe("quote", () => {
  it.each([
    ["quote(5)", "5"],
    ["quote(foobar)", "foobar"],
    ["quote(foobar + barfoo)", "(foobar + barfoo)"],
  ])("should quote code correctly", (input, output) => {
    const evaluated = testEval(input);

    expect(evaluated).toHaveProperty("objectType", o.ObjectType.QUOTE);
    const quote = evaluated as o.Quote;

    expect(ast.repr(quote.node)).toBe(output);
  });

  it.each([
    ["quote(unquote(4))", "4"],
    ["quote(unquote(4 + 4))", "8"],
    ["quote(8 + unquote(4 + 4))", "(8 + 8)"],
    ["quote(unquote(4 + 4) + 8)", "(8 + 8)"],
    ["let foobar = 8; quote(foobar)", "foobar"],
    ["let foobar = 8; quote(unquote(foobar))", "8"],
    ["quote(unquote(true))", "true"],
    ["quote(unquote(true == false))", "false"],
    ["quote(unquote(quote(4 + 4)))", "(4 + 4)"],
    [
      `let quotedInfixExpression = quote(4 + 4);
quote(unquote(4 + 4) + unquote(quotedInfixExpression))`,
      "(8 + (4 + 4))",
    ],
  ])("should quote and unquote code correctly", (input, output) => {
    const evaluated = testEval(input);

    expect(evaluated).toHaveProperty("objectType", o.ObjectType.QUOTE);
    const quote = evaluated as o.Quote;

    expect(ast.repr(quote.node)).toBe(output);
  });
});

const testEval = (input: string): o.MonkeyObject => {
  const parser = new Parser(new Lexer(input));
  const program = parser.parseProgram();

  expect(parser.errors).toHaveLength(0);

  return monkeyEval(program, new o.Environment());
};
