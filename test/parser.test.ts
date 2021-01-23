import Parser from "../src/parser";
import Lexer from "../src/lexer";
import * as ast from "../src/ast-json";

type Item = string | number | boolean;

describe("Parser", () => {
  it.each([
    ["let x = 5;", "x", 5],
    ["let y = true", "y", true],
    ["let foobar = y;", "foobar", "y"],
  ])(
    "should parse (%s) as a let statement",
    (input: string, ident: string, value: Item) => {
      const stmt = parseSingleStatement(input);

      checkLetStatement(stmt, ident, value);
    }
  );

  it("should parse return statements correctly", () => {
    const input = `return 5;
return true;
return x;`;
    const program = parseInput(input);

    expect(program.statements).toHaveLength(3);

    const returnValues: Item[] = [5, true, "x"];
    program.statements.forEach((statement, i) => {
      expect(statement).toHaveProperty("nodeType", ast.NodeType.RETURN);
      const ret = statement as ast.ReturnStatement;

      expect(ret.returnValue).toBeDefined();
      if (ret.returnValue) checkItem(ret.returnValue, returnValues[i]);
    });
  });

  it("should parse identifier expressions correctly", () => {
    const input = "foobar;";
    const stmt = parseSingleStatement(input);

    checkIdentifier(extractExpression(stmt), "foobar");
  });

  it("should parse integer literals", () => {
    const input = "5;";

    const stmt = parseSingleStatement(input);

    checkIntegerLiteral(extractExpression(stmt), 5);
  });

  it("should parse boolean literals", () => {
    const input = "true;false;";
    const program = parseInput(input);

    expect(program.statements).toHaveLength(2);

    const expectedValues = [true, false];

    program.statements.forEach((statement, i) => {
      const expr = extractExpression(statement);
      checkBooleanLiteral(expr, expectedValues[i]);
    });
  });

  it.each([
    ["!5;", "!", 5],
    ["-15;", "-", 15],
  ])(
    "should parse (%s) as a prefix expression",
    (input: string, operator: string, integerValue: number) => {
      const expr = extractExpression(parseSingleStatement(input));

      expect(expr).toHaveProperty("nodeType", ast.NodeType.PREFIX);
      expect(expr).toHaveProperty("operator", operator);

      const prefix = expr as ast.PrefixExpression;
      checkIntegerLiteral(prefix.right, integerValue);
    }
  );

  it.each([
    ["5 + 5;", 5, "+", 5],
    ["5 - 5;", 5, "-", 5],
    ["5 * 5;", 5, "*", 5],
    ["5 / 5;", 5, "/", 5],
    ["5 > 5;", 5, ">", 5],
    ["5 < 5;", 5, "<", 5],
    ["5 == 5;", 5, "==", 5],
    ["5 != 5;", 5, "!=", 5],
  ])(
    "should parse (%s) as an infix expression",
    (
      input: string,
      leftValue: number,
      operator: string,
      rightValue: number
    ) => {
      checkInfixExpression(
        extractExpression(parseSingleStatement(input)),
        leftValue,
        operator,
        rightValue
      );
    }
  );

  it("should parse if expressions correctly", () => {
    const input = "if (x < y) { x }";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.IF);
    const ifExpr = expr as ast.IfExpression;

    checkInfixExpression(ifExpr.condition, "x", "<", "y");

    expect(ifExpr.consequence.statements).toHaveLength(1);
    checkIdentifier(extractExpression(ifExpr.consequence.statements[0]), "x");

    expect(ifExpr.alternative).toBeFalsy();
  });

  it("should parse if/else expressions correctly", () => {
    const input = "if (x < y) { x } else { y }";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.IF);
    const ifExpr = expr as ast.IfExpression;

    checkInfixExpression(ifExpr.condition, "x", "<", "y");

    expect(ifExpr.consequence.statements).toHaveLength(1);
    checkIdentifier(extractExpression(ifExpr.consequence.statements[0]), "x");

    expect(ifExpr.alternative).toBeTruthy();
    const alternative = ifExpr.alternative as ast.BlockStatement;

    expect(alternative.statements).toHaveLength(1);
    checkIdentifier(extractExpression(alternative.statements[0]), "y");
  });

  it("should parse function expressions correctly", () => {
    const input = "fn(x, y) { x + y; }";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.FN);
    const fnExpr = expr as ast.FunctionLiteral;

    const expectedIdents = ["x", "y"];
    fnExpr.parameters.forEach((param, i) =>
      checkIdentifier(param, expectedIdents[i])
    );

    expect(fnExpr.body.statements).toHaveLength(1);
    checkInfixExpression(
      extractExpression(fnExpr.body.statements[0]),
      "x",
      "+",
      "y"
    );
  });

  it("should parse function parameters correctly", () => {
    const cases: [string, string[]][] = [
      ["fn() {}", []],
      ["fn(x) {}", ["x"]],
      ["fn(x, y, z) {}", ["x", "y", "z"]],
    ];

    cases.forEach(([input, names]) => {
      const expr = extractExpression(parseSingleStatement(input));

      expect(expr).toHaveProperty("nodeType", ast.NodeType.FN);
      const fn = expr as ast.FunctionLiteral;

      expect(fn.parameters.map(ast.repr)).toEqual(names);
    });
  });

  it("should parse function calls correctly", () => {
    const input = "add(1, 2 * 3, 4 + 5)";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.CALL);
    const call = expr as ast.CallExpression;

    checkIdentifier(call.fn, "add");

    expect(call.args).toHaveLength(3);
    checkIntegerLiteral(call.args[0], 1);
    checkInfixExpression(call.args[1], 2, "*", 3);
    checkInfixExpression(call.args[2], 4, "+", 5);
  });

  it("should parse string literals correctly", () => {
    const input = `"hello world";`;
    const expr = extractExpression(parseSingleStatement(input));
    checkStringLiteral(expr, "hello world");
  });

  it("should parse array literals correctly", () => {
    const input = "[1, 2 * 2, 3 + 3]";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.ARRAY);
    const arr = expr as ast.ArrayLiteral;

    expect(arr.elements).toHaveLength(3);

    checkIntegerLiteral(arr.elements[0], 1);
    checkInfixExpression(arr.elements[1], 2, "*", 2);
    checkInfixExpression(arr.elements[2], 3, "+", 3);
  });

  it("should parse index expressions correctly", () => {
    const input = "myArray[1 + 1]";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.INDEX);
    const index = expr as ast.IndexExpression;

    checkIdentifier(index.left, "myArray");
    checkInfixExpression(index.index, 1, "+", 1);
  });

  it("should parse hash literals with string keys correctly", () => {
    const input = `{"one": 1, "two": 2, "three": 3}`;
    const outputPairs: [string, number][] = [
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ];

    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.HASH);
    const hash = expr as ast.HashLiteral;

    hash.pairs.forEach(([key, value], i) => {
      const [outputKey, outputValue] = outputPairs[i];
      checkStringLiteral(key, outputKey);
      checkIntegerLiteral(value, outputValue);
    });
  });

  it("should parse hash literals with integer keys correctly", () => {
    const input = `{1: "one", 2: "two", 3: "three"}`;
    const outputPairs: [number, string][] = [
      [1, "one"],
      [2, "two"],
      [3, "three"],
    ];

    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.HASH);
    const hash = expr as ast.HashLiteral;

    hash.pairs.forEach(([key, value], i) => {
      const [outputKey, outputValue] = outputPairs[i];
      checkIntegerLiteral(key, outputKey);
      checkStringLiteral(value, outputValue);
    });
  });

  it("should parse empty hash literals correctly", () => {
    const input = `{}`;

    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toHaveProperty("nodeType", ast.NodeType.HASH);
    const hash = expr as ast.HashLiteral;
    expect(hash.pairs).toHaveLength(0);
  });

  it("should resolve precedence correctly", () => {
    [
      ["-a * b", "((-a) * b)"],
      ["!-a", "(!(-a))"],
      ["a + b + c", "((a + b) + c)"],
      ["a + b - c", "((a + b) - c)"],
      ["a * b * c", "((a * b) * c)"],
      ["a * b / c", "((a * b) / c)"],
      ["a + b / c", "(a + (b / c))"],
      ["a + b * c + d / e - f", "(((a + (b * c)) + (d / e)) - f)"],
      ["3 + 4; -5 * 5", "(3 + 4)((-5) * 5)"],
      ["5 > 4 == 3 < 4", "((5 > 4) == (3 < 4))"],
      ["5 < 4 != 3 > 4", "((5 < 4) != (3 > 4))"],
      ["3 + 4 * 5 == 3 * 1 + 4 * 5", "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))"],
      ["true", "true"],
      ["false", "false"],
      ["3 > 5 == false", "((3 > 5) == false)"],
      ["3 < 5 == true", "((3 < 5) == true)"],
      ["1 + (2 + 3) + 4", "((1 + (2 + 3)) + 4)"],
      ["(5 + 5) * 2", "((5 + 5) * 2)"],
      ["2 / (5 + 5)", "(2 / (5 + 5))"],
      ["(5 + 5) * 2 * (5 + 5)", "(((5 + 5) * 2) * (5 + 5))"],
      ["-(5 + 5)", "(-(5 + 5))"],
      ["!(true == true)", "(!(true == true))"],
      ["a + add(b * c) + d", "((a + add((b * c))) + d)"],
      [
        "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
        "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
      ],
      ["add(a + b + c * d / f + g)", "add((((a + b) + ((c * d) / f)) + g))"],
      ["a * [1, 2, 3, 4][b * c] * d", "((a * ([1, 2, 3, 4][(b * c)])) * d)"],
      [
        "add(a * b[2], b[1], 2 * [1, 2][1])",
        "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))",
      ],
    ].forEach(([input, result]) => {
      expect(ast.repr(parseInput(input))).toBe(result);
    });
  });
});

const parseInput = (input: string): ast.Program => {
  const parser = new Parser(new Lexer(input));

  const output = parser.parseProgram();

  expect(output).not.toBeNull();
  expect(parser.errors).toHaveLength(0);
  return output as ast.Program;
};

const parseSingleStatement = (input: string): ast.Statement => {
  const program = parseInput(input);
  expect(program.statements).toHaveLength(1);

  return program.statements[0] as ast.Statement;
};

const checkLetStatement = (
  statement: ast.Statement,
  identifier: string,
  value: Item
) => {
  expect(statement).toHaveProperty("nodeType", ast.NodeType.LET);
  const letStatement = statement as ast.LetStatement;

  expect(letStatement.name.value).toBe(identifier);

  checkItem(letStatement.value, value);
};

const checkIntegerLiteral = (
  expr: ast.Expression | undefined,
  integerValue: number
) => {
  expect(expr).toHaveProperty("nodeType", ast.NodeType.INT);
  const literal = expr as ast.IntegerLiteral;

  expect(literal.value).toBe(integerValue);
};

const checkIdentifier = (expr: ast.Expression | undefined, name: string) => {
  expect(expr).toHaveProperty("nodeType", ast.NodeType.IDENTIFIER);
  let ident = expr as ast.Identifier;

  expect(ident.value).toBe(name);
};

const checkBooleanLiteral = (
  expr: ast.Expression | undefined,
  boolValue: boolean
) => {
  expect(expr).toHaveProperty("nodeType", ast.NodeType.BOOL);
  const literal = expr as ast.BooleanLiteral;

  expect(literal.value).toBe(boolValue);
};

const checkItem = (expr: ast.Expression, value: Item) => {
  if (typeof value === "string") {
    checkIdentifier(expr, value);
  } else if (typeof value === "number") {
    checkIntegerLiteral(expr, value);
  } else if (typeof value === "boolean") {
    checkBooleanLiteral(expr, value);
  }
};

const checkInfixExpression = (
  expr: ast.Expression | undefined,
  left: string | number,
  operator: string,
  right: string | number
) => {
  expect(expr).toHaveProperty("nodeType", ast.NodeType.INFIX);
  const infix = expr as ast.InfixExpression;

  checkItem(infix.left, left);
  expect(infix.operator).toBe(operator);
  checkItem(infix.right, right);
};

const checkStringLiteral = (
  expr: ast.Expression | undefined,
  value: string
) => {
  expect(expr).toHaveProperty("nodeType", ast.NodeType.STR);
  const str = expr as ast.StringLiteral;

  expect(str.value).toBe(value);
};

// Type coercion stuff
const extractExpression = (stmt: ast.Statement): ast.Expression => {
  expect(stmt).toHaveProperty("nodeType", ast.NodeType.EXPR_STMT);
  return (stmt as ast.ExpressionStatement).expression;
};
