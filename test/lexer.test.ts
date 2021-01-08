import { TokenType } from "../src/token";
import Lexer from "../src/lexer";

describe("Lexer", () => {
  describe("nextToken", () => {
    it("should parse all of the known token types", () => {
      const input = "=+(){},;";

      const lexer = new Lexer(input);

      [
        [TokenType.ASSIGN, "="],
        [TokenType.PLUS, "+"],
        [TokenType.LPAREN, "("],
        [TokenType.RPAREN, ")"],
        [TokenType.LBRACE, "{"],
        [TokenType.RBRACE, "}"],
        [TokenType.COMMA, ","],
        [TokenType.SEMICOLON, ";"],
        [TokenType.EOF, ""],
      ].forEach(([tokenType, literal]) => {
        expect(lexer.nextToken()).toEqual({ tokenType, literal });
      });
    });
  });
});
