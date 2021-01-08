import * as ast from "../src/ast";
import { makeToken, TokenType } from "../src/token";

describe("repr method", () => {
  it("should return the string representation of the AST", () => {
    const program = new ast.Program();
    program.statements = [
      new ast.LetStatement(
        makeToken(TokenType.LET, "let"),
        new ast.Identifier(makeToken(TokenType.IDENT, "myVar"), "myVar"),
        new ast.Identifier(
          makeToken(TokenType.IDENT, "anotherVar"),
          "anotherVar"
        )
      ),
    ];

    expect(program.repr()).toBe("let myVar = anotherVar;");
  });
});
