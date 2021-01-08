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
    const program = output as ast.Program;

    expect(program.statements).toHaveLength(3);

    const expectedIdentifiers = ["x", "y", "foobar"];
    program.statements.forEach((statement, i) =>
      checkLetStatement(statement, expectedIdentifiers[i])
    );
  });
});

const checkLetStatement = (statement: ast.Statement, identifier: string) => {
  expect(statement.tokenLiteral()).toBe("let");
  expect(statement).toBeInstanceOf(ast.LetStatement);
  const letStatement = statement as ast.LetStatement;

  expect(letStatement.name.value).toBe(identifier);
  expect(letStatement.name.tokenLiteral()).toBe(identifier);
};
