import Lexer from "../src/lexer";
import Parser from "../src/parser";
import monkeyEval from "../src/evaluator";
import * as o from "../src/object";
import * as ast from "../src/ast-json";

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
    [`"Hello" - "World"`, "invalid operation: STRING - STRING"],
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

  it("should evaluate function literals correctly", () => {
    const input = "fn(x) { x + 2; };";

    const result = testEval(input);

    expect(result).toBeInstanceOf(o.MonkeyFunction);
    const fn = result as o.MonkeyFunction;

    expect(fn.parameters).toHaveLength(1);
    expect(fn.parameters[0]).toHaveProperty("value", "x");

    expect(ast.repr(fn.body)).toBe("(x + 2)");
  });

  it.each([
    ["let identity = fn(x) { x; }; identity(5);", 5],
    ["let identity = fn(x) { return x; }; identity(5);", 5],
    ["let double = fn(x) { x * 2; }; double(5);", 10],
    ["let add = fn(x, y) { x + y; }; add(5, 5);", 10],
    ["let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));", 20],
    ["fn(x) { x; }(5)", 5],
  ])("should evaluate function calls correctly in (%s)", integerTest);

  it.each([
    [
      `let newAdder = fn(x) {
     fn(y) { x + y };
};
let addTwo = newAdder(2); addTwo(2);`,
      4,
    ],
  ])("should evaluate closures correctly (%s)", integerTest);

  it("should evaluate string literals correctly", () => {
    const input = `"Hello World!"`;

    const result = testEval(input);
    expect(result).toBeInstanceOf(o.MonkeyString);
    const str = result as o.MonkeyString;

    expect(str.value).toBe("Hello World!");
  });

  it("should evaluate string concatenation correctly", () => {
    const input = `"Hello" + " " + "World!"`;

    const result = testEval(input);
    expect(result).toBeInstanceOf(o.MonkeyString);
    const str = result as o.MonkeyString;

    expect(str.value).toBe("Hello World!");
  });

  it("should evaluate array literals correctly", () => {
    const input = "[1, 2*2, 3+3]";
    const result = testEval(input);

    expect(result).toBeInstanceOf(o.MonkeyArray);
    const arr = result as o.MonkeyArray;

    expect(arr.elements).toHaveLength(3);

    checkIntegerObject(arr.elements[0], 1);
    checkIntegerObject(arr.elements[1], 4);
    checkIntegerObject(arr.elements[2], 6);
  });

  it.each([
    ["[1, 2, 3][0]", 1],
    ["[1, 2, 3][1]", 2],
    ["[1, 2, 3][2]", 3],
    ["let i = 0; [1][i];", 1],
    ["[1, 2, 3][1 + 1];", 3],
    ["let myArray = [1, 2, 3]; myArray[2];", 3],
    ["let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];", 6],
    ["let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i] ", 2],
    ["[1, 2, 3][3]", null],
    ["[1, 2, 3][-1]", null],
  ])(
    "should correctly evaluate (%s) as an index expression",
    (input, output) => {
      if (output !== null) {
        integerTest(input, output);
        return;
      }
      const result = testEval(input);
      expect(result).toBeInstanceOf(o.MonkeyNull);
    }
  );

  it.each([
    [`len("")`, 0],
    [`len("four")`, 4],
    [`len("hello world")`, 11],
    [`len([1, 2, 3])`, 3],
    [`len(1)`, "argument to len() not supported, got INTEGER"],
    [`len("one", "two")`, "len() takes one arg, got 2"],
    [`first([2, 3])`, 2],
    [`first([])`, null],
    [`last([2, 3])`, 3],
    [`last([])`, null],
    [`rest([1, 2, 3])`, [2, 3]],
    [`rest([2, 3])`, [3]],
    [`rest([3])`, []],
    [`rest([])`, null],
    [`push([], 8)`, [8]],
    [`push([8], 9)`, [8, 9]],
    [`push([8, 9], 10)`, [8, 9, 10]],
  ])("should evaluate builtin expressions correctly (%s)", (input, output) => {
    if (typeof output === "number") {
      integerTest(input, output);
      return;
    }
    if (output === null) {
      const result = testEval(input);
      expect(result).toBeInstanceOf(o.MonkeyNull);
      return;
    }
    if (Array.isArray(output)) {
      const result = testEval(input);
      expect(result).toBeInstanceOf(o.MonkeyArray);
      const arr = result as o.MonkeyArray;

      arr.elements.forEach((actual, i) =>
        checkIntegerObject(actual, output[i])
      );
      return;
    }
    let err;
    try {
      testEval(input);
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(o.EvalError);
    const evalErr = err as o.EvalError;
    expect(evalErr.message).toBe(output);
  });

  it("should evaluate higher-order array functions correctly (map)", () => {
    const input = `let map = fn(arr, f) {
let iter = fn(arr, accumulated) {
if (len(arr) == 0) { accumulated
} else {
iter(rest(arr), push(accumulated, f(first(arr))));
} };
     iter(arr, []);
   };
let a = [1, 2, 3, 4];
let double = fn(x) { x * 2 };
map(a, double);`;

    const output = [2, 4, 6, 8];
    const result = testEval(input);
    expect(result).toBeInstanceOf(o.MonkeyArray);
    const arr = result as o.MonkeyArray;

    arr.elements.forEach((actual, i) => checkIntegerObject(actual, output[i]));
  });

  it("should evaluate higher-order array functions correctly (reduce)", () => {
    const input = `let reduce = fn(arr, initial, f) { let iter = fn(arr, result) {
if (len(arr) == 0) { result
} else {
iter(rest(arr), f(result, first(arr)));
}
};
     iter(arr, initial);
};
let sum = fn(arr) {
reduce(arr, 0, fn(initial, el) { initial + el });
};
sum([1, 2, 3, 4, 5]);`;

    integerTest(input, 15);
  });
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
