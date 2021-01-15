import Parser from "../src/parser";
import Lexer from "../src/lexer";
import * as ast from "../src/ast";

describe("Parser", () => {
  it("should parse let statements correctly", () => {
    const input = `let x = 5;
let y = 10;
let foobar = 838383;`;
    const program = parseInput(input);

    expect(program.statements).toHaveLength(3);

    const expectedIdentifiers = ["x", "y", "foobar"];
    program.statements.forEach((statement, i) =>
      checkLetStatement(statement, expectedIdentifiers[i])
    );
  });

  it("should parse return statements correctly", () => {
    const input = `return 5;
return 10;
return 993322;`;
    const program = parseInput(input);

    expect(program.statements).toHaveLength(3);

    program.statements.forEach((statement) => {
      expect(statement.tokenLiteral()).toBe("return");
      expect(statement).toBeInstanceOf(ast.ReturnStatement);
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
      expect(expr).toBeInstanceOf(ast.BooleanLiteral);
      const literal = expr as ast.BooleanLiteral;

      expect(literal.value).toBe(expectedValues[i]);
    });
  });

  it("should parse prefix expressions correctly", () => {
    const cases: [string, string, number][] = [
      ["!5;", "!", 5],
      ["-15;", "-", 15],
    ];

    cases.forEach(([input, operator, integerValue]) => {
      const expr = extractExpression(parseSingleStatement(input));

      expect(expr).toBeInstanceOf(ast.PrefixExpression);
      const prefix = expr as ast.PrefixExpression;

      expect(prefix.operator).toBe(operator);
      checkIntegerLiteral(prefix.right, integerValue);
    });
  });

  it("should parse infix expressions correctly", () => {
    let cases: [string, number, string, number][] = [
      ["5 + 5;", 5, "+", 5],
      ["5 - 5;", 5, "-", 5],
      ["5 * 5;", 5, "*", 5],
      ["5 / 5;", 5, "/", 5],
      ["5 > 5;", 5, ">", 5],
      ["5 < 5;", 5, "<", 5],
      ["5 == 5;", 5, "==", 5],
      ["5 != 5;", 5, "!=", 5],
    ];

    cases.forEach(([input, leftValue, operator, rightValue]) => {
      checkInfixExpression(
        extractExpression(parseSingleStatement(input)),
        leftValue,
        operator,
        rightValue
      );
    });
  });

  it("should parse if expressions correctly", () => {
    const input = "if (x < y) { x }";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toBeInstanceOf(ast.IfExpression);
    const ifExpr = expr as ast.IfExpression;

    checkInfixExpression(ifExpr.condition, "x", "<", "y");

    expect(ifExpr.consequence.statements).toHaveLength(1);
    checkIdentifier(extractExpression(ifExpr.consequence.statements[0]), "x");

    expect(ifExpr.alternative).toBeFalsy();
  });

  it("should parse if/else expressions correctly", () => {
    const input = "if (x < y) { x } else { y }";
    const expr = extractExpression(parseSingleStatement(input));

    expect(expr).toBeInstanceOf(ast.IfExpression);
    const ifExpr = expr as ast.IfExpression;

    checkInfixExpression(ifExpr.condition, "x", "<", "y");

    expect(ifExpr.consequence.statements).toHaveLength(1);
    checkIdentifier(extractExpression(ifExpr.consequence.statements[0]), "x");

    expect(ifExpr.alternative).toBeTruthy();
    const alternative = ifExpr.alternative as ast.BlockStatement;

    expect(alternative.statements).toHaveLength(1);
    checkIdentifier(extractExpression(alternative.statements[0]), "y");
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
    ].forEach(([input, result]) => {
      expect(parseInput(input).repr()).toBe(result);
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

const checkLetStatement = (statement: ast.Statement, identifier: string) => {
  expect(statement.tokenLiteral()).toBe("let");
  expect(statement).toBeInstanceOf(ast.LetStatement);
  const letStatement = statement as ast.LetStatement;

  expect(letStatement.name.value).toBe(identifier);
  expect(letStatement.name.tokenLiteral()).toBe(identifier);
};

const checkIntegerLiteral = (
  expr: ast.Expression | undefined,
  integerValue: number
) => {
  expect(expr).toBeInstanceOf(ast.IntegerLiteral);
  const literal = expr as ast.IntegerLiteral;

  expect(literal.value).toBe(integerValue);
  expect(literal.tokenLiteral()).toBe(`${integerValue}`);
};

const checkIdentifier = (expr: ast.Expression | undefined, name: string) => {
  expect(expr).toBeInstanceOf(ast.Identifier);
  let ident = expr as ast.Identifier;

  expect(ident.value).toBe(name);
  expect(ident.tokenLiteral()).toBe(name);
};

const checkItem = (expr: ast.Expression, value: string | number) => {
  if (typeof value === "string") {
    checkIdentifier(expr, value);
  } else if (typeof value === "number") {
    checkIntegerLiteral(expr, value);
  }
};

const checkInfixExpression = (
  expr: ast.Expression | undefined,
  left: string | number,
  operator: string,
  right: string | number
) => {
  expect(expr).toBeInstanceOf(ast.InfixExpression);
  const infix = expr as ast.InfixExpression;

  checkItem(infix.left, left);
  expect(infix.operator).toBe(operator);
  checkItem(infix.right, right);
};

// Type coercion stuff
const extractExpression = (stmt: ast.Statement): ast.Expression => {
  expect(stmt).toBeInstanceOf(ast.ExpressionStatement);
  const expr = (stmt as ast.ExpressionStatement).expression;

  expect(expr).toBeInstanceOf(ast.Expression);
  return expr as ast.Expression;
};
