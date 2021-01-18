import Lexer from "../src/lexer";
import Parser from "../src/parser";
import monkeyEval from "../src/evaluator";
import * as o from "../src/object";

describe("monkeyEval", () => {
  it.each([
    ["5", 5],
    ["10", 10],
  ])("should evaluate integer literal (%s) as itself", (input, output) => {
    const result = testEval(input);

    checkIntegerObject(result, output);
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("should evaluate boolean literal (%s) as itself", (input, output) => {
    const result = testEval(input);

    checkBooleanObject(result, output);
  });

  it.each([
    ["!true", false],
    ["!false", true],
    ["!5", false],
    ["!!true", true],
    ["!!false", false],
    ["!!5", true],
  ])(
    "should evaluate the prefix bang operator in (%s) as logical NOT",
    (input, output) => {
      const result = testEval(input);

      checkBooleanObject(result, output);
    }
  );

  it.each([
    ["-5", -5],
    ["-10", -10],
    ["5 + 5 + 5 + 5 - 10", 10],
    ["2 * 2 * 2 * 2 * 2", 32],
    ["-50 + 100 + -50", 0],
    ["5 * 2 + 10", 20],
    ["5 + 2 * 10", 25],
    ["20 + 2 * -10", 0],
    ["50 / 2 * 2 + 10", 60],
    ["2 * (5 + 10)", 30],
    ["3 * 3 * 3 + 10", 37],
    ["3 * (3 * 3) + 10", 37],
    ["(5 + 10 * 2 + 15 / 3) * 2 + -10", 50],
  ])("should evaluate arithmetic in (%s) correctly", (input, output) => {
    const result = testEval(input);

    checkIntegerObject(result, output);
  });

  it.each([
    ["1 < 2", true],
    ["1 > 2", false],
    ["1 < 1", false],
    ["1 > 1", false],
    ["1 == 1", true],
    ["1 != 1", false],
    ["1 == 2", false],
    ["1 != 2", true],
    ["true == true", true],
    ["false == false", true],
    ["true == false", false],
    ["true != false", true],
    ["false != true", true],
    ["(1 < 2) == true", true],
    ["(1 < 2) == false", false],
    ["(1 > 2) == true", false],
    ["(1 > 2) == false", true],
  ])("should evaluate logic in (%s) correctly", (input, output) => {
    const result = testEval(input);

    checkBooleanObject(result, output);
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

const checkBooleanObject = (result: o.MonkeyObject, b: boolean) => {
  expect(result).toBeInstanceOf(o.MonkeyBoolean);
  const boolObj = result as o.MonkeyBoolean;

  expect(boolObj.value).toBe(b);
};
