import * as ast from "./ast";
import Lexer from "./lexer";
import { Token, TokenType } from "./token";

enum Precedence {
  LOWEST,
  EQUALS,
  LESSGREATER,
  SUM,
  PRODUCT,
  PREFIX,
  CALL,
}

interface PrefixParseFn {
  (): ast.Expression;
}

interface InfixParseFn {
  (lhs: ast.Expression): ast.Expression;
}

export default class Parser {
  l: Lexer;
  curToken: Token;
  peekToken: Token;
  errors: string[] = [];
  prefixParseFns: Map<TokenType, PrefixParseFn> = new Map();
  infixParseFns: Map<TokenType, InfixParseFn> = new Map();

  constructor(lexer: Lexer) {
    this.l = lexer;

    // prime the two token fields in the parser
    this.curToken = this.l.nextToken();
    this.peekToken = this.l.nextToken();

    this.prefixParseFns.set(TokenType.IDENT, this.parseIdentifier);
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
    this.nextTokenError(tokenType);
    return false;
  }

  private nextTokenError(tokenType: TokenType) {
    this.errors.push(
      `expected next token to be ${tokenType}, got ${this.peekToken.tokenType} instead`
    );
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
    if (this.currentIs(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }
    return this.parseExpressionStatement();
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

  parseReturnStatement(): ast.ReturnStatement | null {
    const token = this.curToken;

    // TODO: Just go to the end of the statement for now
    while (!this.currentIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.ReturnStatement(token);
  }

  parseExpressionStatement(): ast.ExpressionStatement | null {
    const token = this.curToken;

    const expression = this.parseExpression(Precedence.LOWEST);

    if (this.peekIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.ExpressionStatement(token, expression || undefined);
  }

  parseExpression(_precedence: Precedence): ast.Expression | null {
    const prefix = this.prefixParseFns.get(this.curToken.tokenType);
    if (!prefix) {
      return null;
    }
    const leftExp = prefix();
    return leftExp;
  }

  parseIdentifier = (): ast.Identifier => {
    return new ast.Identifier(this.curToken, this.curToken.literal);
  };
}
