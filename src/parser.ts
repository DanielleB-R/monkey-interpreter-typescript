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

const PRECEDENCE_LEVELS: Map<TokenType, Precedence> = new Map([
  [TokenType.EQ, Precedence.EQUALS],
  [TokenType.NOT_EQ, Precedence.EQUALS],
  [TokenType.LT, Precedence.LESSGREATER],
  [TokenType.GT, Precedence.LESSGREATER],
  [TokenType.PLUS, Precedence.SUM],
  [TokenType.MINUS, Precedence.SUM],
  [TokenType.ASTERISK, Precedence.PRODUCT],
  [TokenType.SLASH, Precedence.PRODUCT],
  [TokenType.LPAREN, Precedence.CALL],
]);

interface PrefixParseFn {
  (): ast.Expression | null;
}

interface InfixParseFn {
  (lhs: ast.Expression): ast.Expression | null;
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
    this.prefixParseFns.set(TokenType.INT, this.parseIntegerLiteral);
    this.prefixParseFns.set(TokenType.BANG, this.parsePrefixExpression);
    this.prefixParseFns.set(TokenType.MINUS, this.parsePrefixExpression);
    this.prefixParseFns.set(TokenType.TRUE, this.parseBoolean);
    this.prefixParseFns.set(TokenType.FALSE, this.parseBoolean);
    this.prefixParseFns.set(TokenType.LPAREN, this.parseGroupedExpression);
    this.prefixParseFns.set(TokenType.IF, this.parseIfExpression);
    this.prefixParseFns.set(TokenType.FUNCTION, this.parseFunctionLiteral);

    this.infixParseFns.set(TokenType.PLUS, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.MINUS, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.ASTERISK, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.SLASH, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.LT, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.GT, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.EQ, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.NOT_EQ, this.parseInfixExpression);
    this.infixParseFns.set(TokenType.LPAREN, this.parseCallExpression);
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

  private peekPrecedence(): Precedence {
    return PRECEDENCE_LEVELS.get(this.peekToken.tokenType) || Precedence.LOWEST;
  }

  private curPrecedence(): Precedence {
    return PRECEDENCE_LEVELS.get(this.curToken.tokenType) || Precedence.LOWEST;
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

  private missingPrefixError(tokenType: TokenType) {
    this.errors.push(`no prefix parse function for ${tokenType} found`);
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

    this.nextToken();

    const expr = this.parseExpression(Precedence.LOWEST);
    if (!expr) {
      return null;
    }

    if (this.peekIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.LetStatement(token, name, expr);
  }

  parseReturnStatement(): ast.ReturnStatement | null {
    const token = this.curToken;
    this.nextToken();

    const expr = this.parseExpression(Precedence.LOWEST);
    if (!expr) {
      return null;
    }

    if (this.peekIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.ReturnStatement(token, expr);
  }

  parseExpressionStatement(): ast.ExpressionStatement | null {
    const token = this.curToken;

    const expression = this.parseExpression(Precedence.LOWEST);
    if (!expression) {
      return null;
    }

    if (this.peekIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ast.ExpressionStatement(token, expression);
  }

  parseExpression(precedence: Precedence): ast.Expression | null {
    const prefix = this.prefixParseFns.get(this.curToken.tokenType);
    if (!prefix) {
      this.missingPrefixError(this.curToken.tokenType);
      return null;
    }
    let leftExp = prefix();

    while (
      !this.peekIs(TokenType.SEMICOLON) &&
      precedence < this.peekPrecedence() &&
      leftExp
    ) {
      const infix = this.infixParseFns.get(this.peekToken.tokenType);
      if (!infix) {
        return leftExp;
      }
      this.nextToken();
      leftExp = infix(leftExp);
    }

    return leftExp;
  }

  parseIdentifier = (): ast.Identifier => {
    return new ast.Identifier(this.curToken, this.curToken.literal);
  };

  parseIntegerLiteral = (): ast.IntegerLiteral => {
    return new ast.IntegerLiteral(
      this.curToken,
      parseInt(this.curToken.literal, 10)
    );
  };

  parseBoolean = (): ast.BooleanLiteral => {
    return new ast.BooleanLiteral(
      this.curToken,
      this.currentIs(TokenType.TRUE)
    );
  };

  parsePrefixExpression = (): ast.PrefixExpression | null => {
    const token = this.curToken;
    const operator = this.curToken.literal;

    this.nextToken();
    const right = this.parseExpression(Precedence.PREFIX);
    if (!right) {
      return null;
    }
    return new ast.PrefixExpression(token, operator, right);
  };

  parseGroupedExpression = (): ast.Expression | null => {
    this.nextToken();
    const expr = this.parseExpression(Precedence.LOWEST);

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }
    return expr;
  };

  parseInfixExpression = (left: ast.Expression): ast.InfixExpression | null => {
    const token = this.curToken;
    const operator = this.curToken.literal;

    const precedence = this.curPrecedence();
    this.nextToken();
    const right = this.parseExpression(precedence);
    if (!right) {
      return null;
    }
    return new ast.InfixExpression(token, left, operator, right);
  };

  parseIfExpression = (): ast.IfExpression | null => {
    const token = this.curToken;

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    this.nextToken();
    const condition = this.parseExpression(Precedence.LOWEST);
    if (!condition) {
      return null;
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const consequence = this.parseBlockStatement();
    if (!consequence) {
      return null;
    }

    if (!this.peekIs(TokenType.ELSE)) {
      return new ast.IfExpression(token, condition, consequence);
    }

    this.nextToken();
    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const alternative = this.parseBlockStatement();
    return new ast.IfExpression(token, condition, consequence, alternative);
  };

  parseBlockStatement = (): ast.BlockStatement => {
    const block = new ast.BlockStatement(this.curToken);

    this.nextToken();

    while (
      !(this.currentIs(TokenType.RBRACE) || this.currentIs(TokenType.EOF))
    ) {
      const statement = this.parseStatement();
      if (statement) {
        block.statements.push(statement);
      }
      this.nextToken();
    }

    return block;
  };

  parseFunctionLiteral = (): ast.FunctionLiteral | null => {
    const token = this.curToken;

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    const parameters = this.parseFunctionParameters();
    if (!parameters) {
      return null;
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const body = this.parseBlockStatement();

    return new ast.FunctionLiteral(token, parameters, body);
  };

  parseFunctionParameters = (): ast.Identifier[] | null => {
    const identifiers: ast.Identifier[] = [];
    this.nextToken();

    if (this.currentIs(TokenType.RPAREN)) {
      return identifiers;
    }

    identifiers.push(this.parseIdentifier());

    while (this.peekIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      identifiers.push(this.parseIdentifier());
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return identifiers;
  };

  parseCallExpression = (left: ast.Expression): ast.CallExpression | null => {
    const token = this.curToken;
    const args = this.parseCallArguments();
    if (!args) {
      return null;
    }
    return new ast.CallExpression(token, left, args);
  };

  parseCallArguments = (): ast.Expression[] | null => {
    const args: ast.Expression[] = [];
    this.nextToken();

    if (this.currentIs(TokenType.RPAREN)) {
      return args;
    }

    const expr = this.parseExpression(Precedence.LOWEST);
    if (!expr) {
      return expr;
    }
    args.push(expr);

    while (this.peekIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      const expr = this.parseExpression(Precedence.LOWEST);
      if (!expr) {
        return null;
      }
      args.push(expr);
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return args;
  };
}
