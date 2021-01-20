import Lexer from "../src/lexer";
import Parser from "../src/parser";
import monkeyEval from "../src/evaluator";
import * as o from "../src/object";

const integerTest = (input: string, output: number) => {
  const result = testEval(input);

  checkIntegerObject(result, output);
};

describe("monkeyEval", () => {
  it.each([
    ["5", 5],
    ["10", 10],
  ])("should evaluate integer literal (%s) as itself", integerTest);

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
  ])("should evaluate arithmetic in (%s) correctly", integerTest);

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

  it.each([
    ["if (true) { 10 }", 10],
    ["if (false) { 10 }", null],
    ["if (1) { 10 }", 10],
    ["if (1 < 2) { 10 }", 10],
    ["if (1 > 2) { 10 }", null],
    ["if (1 > 2) { 10 } else { 20 }", 20],
    ["if (1 < 2) { 10 } else { 20 }", 10],
  ])("should evaluate (%s) as a conditional", (input, output) => {
    const result = testEval(input);

    if (output === null) {
      checkNullObject(result);
    } else {
      checkIntegerObject(result, output);
    }
  });

  it.each([
    ["return 10;", 10],
    ["return 10; 9;", 10],
    ["return 2 * 5; 9;", 10],
    ["9; return 2 * 5; 9;", 10],
    [
      `if (10 > 1) { if (10 > 1) {
return 10; }
return 1; }`,
      10,
    ],
  ])("should evaluate return statements correctly in (%s)", integerTest);

  it.each([
    ["5 + true;", "invalid operation: INTEGER + BOOLEAN"],
    ["5 + true; 5;", "invalid operation: INTEGER + BOOLEAN"],
    ["-true", "unknown operator: -BOOLEAN"],
    ["true + false;", "invalid operation: BOOLEAN + BOOLEAN"],
    ["5; true + false; 5", "invalid operation: BOOLEAN + BOOLEAN"],
    ["if (10 > 1) { true + false; }", "invalid operation: BOOLEAN + BOOLEAN"],
  ])("should get the correct error from (%s)", (input, message) => {
    let err: any;
    try {
      testEval(input);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeInstanceOf(o.EvalError);
    const evalError = err as o.EvalError;
    expect(evalError).toHaveProperty("message", message);
  });

  it.each([
    ["let a = 5; a;", 5],
    ["let a = 5 * 5; a;", 25],
    ["let a = 5; let b = a; b;", 5],
    ["let a = 5; let b = a; let c = a + b + 5; c;", 15],
  ])("should evaluate let statements correctly (%s)", integerTest);
});

const testEval = (input: string): o.MonkeyObject => {
  const parser = new Parser(new Lexer(input));
  const program = parser.parseProgram();

  expect(parser.errors).toHaveLength(0);

  return monkeyEval(program, new o.Environment());
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

const checkNullObject = (result: o.MonkeyObject) => {
  expect(result).toBeInstanceOf(o.MonkeyNull);
};
