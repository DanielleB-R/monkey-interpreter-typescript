import { TokenType } from "../src/token";
import Lexer from "../src/lexer";

describe("Lexer", () => {
  describe("nextToken", () => {
    it("should parse all of the single char token types", () => {
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

    it("should parse some realistic-looking code", () => {
      const input = `let five = 5;
let ten = 10;
   let add = fn(x, y) {
     x + y;
};
let result = add(five, ten);`;

      const lexer = new Lexer(input);

      [
        [TokenType.LET, "let"],
        [TokenType.IDENT, "five"],
        [TokenType.ASSIGN, "="],
        [TokenType.INT, "5"],
        [TokenType.SEMICOLON, ";"],
        [TokenType.LET, "let"],
        [TokenType.IDENT, "ten"],
        [TokenType.ASSIGN, "="],
        [TokenType.INT, "10"],
        [TokenType.SEMICOLON, ";"],
        [TokenType.LET, "let"],
        [TokenType.IDENT, "add"],
        [TokenType.ASSIGN, "="],
        [TokenType.FUNCTION, "fn"],
        [TokenType.LPAREN, "("],
        [TokenType.IDENT, "x"],
        [TokenType.COMMA, ","],
        [TokenType.IDENT, "y"],
        [TokenType.RPAREN, ")"],
        [TokenType.LBRACE, "{"],
        [TokenType.IDENT, "x"],
        [TokenType.PLUS, "+"],
        [TokenType.IDENT, "y"],
        [TokenType.SEMICOLON, ";"],
        [TokenType.RBRACE, "}"],
        [TokenType.SEMICOLON, ";"],
        [TokenType.LET, "let"],
        [TokenType.IDENT, "result"],
        [TokenType.ASSIGN, "="],
        [TokenType.IDENT, "add"],
        [TokenType.LPAREN, "("],
        [TokenType.IDENT, "five"],
        [TokenType.COMMA, ","],
        [TokenType.IDENT, "ten"],
        [TokenType.RPAREN, ")"],
        [TokenType.SEMICOLON, ";"],
        [TokenType.EOF, ""],
      ].forEach(([tokenType, literal]) => {
        expect(lexer.nextToken()).toEqual({ tokenType, literal });
      });
    });
  });
});
