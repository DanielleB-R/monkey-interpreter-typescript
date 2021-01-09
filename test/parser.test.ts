import Parser from "../src/parser";
import Lexer from "../src/lexer";
import * as ast from "../src/ast";

describe("Parser", () => {
  it("should parse let statements correctly", () => {
    const input = `let x = 5;
let y = 10;
let foobar = 838383;`;

    const parser = new Parser(new Lexer(input));

    const output = parser.parseProgram();

    expect(output).not.toBeNull();
    expect(parser.errors).toHaveLength(0);

    const program = output as ast.Program;

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

    const parser = new Parser(new Lexer(input));

    const output = parser.parseProgram();

    expect(output).not.toBeNull();
    expect(parser.errors).toHaveLength(0);
    const program = output as ast.Program;

    expect(program.statements).toHaveLength(3);

    program.statements.forEach((statement) => {
      expect(statement.tokenLiteral()).toBe("return");
      expect(statement).toBeInstanceOf(ast.ReturnStatement);
    });
  });

  it("should parse identifier expressions correctly", () => {
    const input = "foobar;";

    const parser = new Parser(new Lexer(input));

    const output = parser.parseProgram();

    expect(output).not.toBeNull();
    expect(parser.errors).toHaveLength(0);
    const program = output as ast.Program;

    expect(program.statements).toHaveLength(1);

    const statement = program.statements[0];
    expect(statement).toBeInstanceOf(ast.ExpressionStatement);
    const exprStatement = statement as ast.ExpressionStatement;

    expect(exprStatement.expression).toBeInstanceOf(ast.Identifier);
    const ident = exprStatement.expression as ast.Identifier;

    expect(ident.value).toBe("foobar");
    expect(ident.tokenLiteral()).toBe("foobar");
  });

  it("should parse integer literals", () => {
    const input = "5;";

    const parser = new Parser(new Lexer(input));

    const output = parser.parseProgram();

    expect(output).not.toBeNull();
    expect(parser.errors).toHaveLength(0);
    const program = output as ast.Program;

    expect(program.statements).toHaveLength(1);

    const statement = program.statements[0];
    expect(statement).toBeInstanceOf(ast.ExpressionStatement);
    const exprStatement = statement as ast.ExpressionStatement;

    expect(exprStatement.expression).toBeInstanceOf(ast.IntegerLiteral);
    const literal = exprStatement.expression as ast.IntegerLiteral;

    expect(literal.value).toBe(5);
    expect(literal.tokenLiteral()).toBe("5");
  });

  it("should parse prefix expressions correctly", () => {
    const cases: [string, string, number][] = [
      ["!5;", "!", 5],
      ["-15;", "-", 15],
    ];

    cases.forEach(([input, operator, integerValue]) => {
      const parser = new Parser(new Lexer(input));

      const output = parser.parseProgram();

      expect(output).not.toBeNull();
      expect(parser.errors).toHaveLength(0);
      const program = output as ast.Program;

      expect(program.statements).toHaveLength(1);

      const statement = program.statements[0];
      expect(statement).toBeInstanceOf(ast.ExpressionStatement);
      const exprStatement = statement as ast.ExpressionStatement;

      expect(exprStatement.expression).toBeInstanceOf(ast.PrefixExpression);
      const prefix = exprStatement.expression as ast.PrefixExpression;

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
      const parser = new Parser(new Lexer(input));

      const output = parser.parseProgram();

      expect(output).not.toBeNull();
      expect(parser.errors).toHaveLength(0);
      const program = output as ast.Program;

      expect(program.statements).toHaveLength(1);

      const statement = program.statements[0];
      expect(statement).toBeInstanceOf(ast.ExpressionStatement);
      const exprStatement = statement as ast.ExpressionStatement;

      expect(exprStatement.expression).toBeInstanceOf(ast.InfixExpression);
      const infix = exprStatement.expression as ast.InfixExpression;

      checkIntegerLiteral(infix.left, leftValue);
      expect(infix.operator).toBe(operator);
      checkIntegerLiteral(infix.right, rightValue);
    });
  });
});

const checkLetStatement = (statement: ast.Statement, identifier: string) => {
  expect(statement.tokenLiteral()).toBe("let");
  expect(statement).toBeInstanceOf(ast.LetStatement);
  const letStatement = statement as ast.LetStatement;

  expect(letStatement.name.value).toBe(identifier);
  expect(letStatement.name.tokenLiteral()).toBe(identifier);
};

const checkIntegerLiteral = (expr: ast.Expression, integerValue: number) => {
  expect(expr).toBeInstanceOf(ast.IntegerLiteral);
  const literal = expr as ast.IntegerLiteral;

  expect(literal.value).toBe(integerValue);
  expect(literal.tokenLiteral()).toBe(`${integerValue}`);
};
