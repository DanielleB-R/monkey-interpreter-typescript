import * as ast from "./ast";
import Lexer from "./lexer";
import { Token, TokenType } from "./token";

export default class Parser {
  l: Lexer;
  curToken: Token;
  peekToken: Token;

  constructor(lexer: Lexer) {
    this.l = lexer;

    // prime the two token fields in the parser
    this.curToken = this.l.nextToken();
    this.peekToken = this.l.nextToken();
  }

  private nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.l.nextToken();
  }

  private currentIs(tokenType: TokenType): boolean {
    return this.curToken.tokenType == tokenType;
  }

  private peekIs(tokenType: TokenType): boolean {
    return this.peekToken.tokenType == tokenType;
  }

  private expectPeek(tokenType: TokenType): boolean {
    if (this.peekIs(tokenType)) {
      this.nextToken();
      return true;
    }
    return false;
  }

  parseProgram(): ast.Program | null {
    const program = new ast.Program();

    while (!this.currentIs(TokenType.EOF)) {
      const statement = this.parseStatement();
      if (statement != null) {
        program.statements.push(statement);
      }
      this.nextToken();
    }
    return program;
  }

  parseStatement(): ast.Statement | null {
    if (this.currentIs(TokenType.LET)) {
      return this.parseLetStatement();
    }
    return null;
  }

  parseLetStatement(): ast.LetStatement | null {
    const token = this.curToken;

    if (!this.expectPeek(TokenType.IDENT)) {
      return null;
    }

    const name = new ast.Identifier(this.curToken, this.curToken.literal);

    if (!this.expectPeek(TokenType.ASSIGN)) {
      return null;
    }

    // TODO: Just go to the end of the statement for now
    while (!this.currentIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.LetStatement(token, name);
  }
}
