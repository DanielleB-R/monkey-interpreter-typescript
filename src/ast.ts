import { Token } from "./token";

export abstract class Node {
  abstract tokenLiteral(): string;
  abstract repr(): string;
}

// These intermediate classes are essentially markers, since the AST
// generally has strict ideas to what can be an expression and what
// can be a statement
export abstract class Expression extends Node {}
export abstract class Statement extends Node {}

export class Program extends Node {
  statements: Statement[] = [];

  tokenLiteral(): string {
    return this.statements.length > 0 ? this.statements[0].tokenLiteral() : "";
  }

  repr(): string {
    return this.statements.map((statement) => statement.repr()).join("");
  }
}

export class LetStatement extends Statement {
  token: Token;
  name: Identifier;
  value?: Expression;

  constructor(token: Token, name: Identifier, value?: Expression) {
    super();
    this.token = token;
    this.name = name;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `${this.tokenLiteral()} ${this.name.repr()} = ${
      this.value ? this.value.repr() : ""
    };`;
  }
}

export class ReturnStatement extends Statement {
  token: Token;
  returnValue?: Expression;

  constructor(token: Token, returnValue?: Expression) {
    super();
    this.token = token;
    this.returnValue = returnValue;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `${this.tokenLiteral} ${
      this.returnValue ? this.returnValue.repr() : ""
    };`;
  }
}

export class ExpressionStatement extends Statement {
  token: Token;
  expression?: Expression;

  constructor(token: Token, expression?: Expression) {
    super();
    this.token = token;
    this.expression = expression;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `${this.expression ? this.expression.repr() : ""};`;
  }
}

export class Identifier extends Expression {
  token: Token;
  value: string;

  constructor(token: Token, value: string) {
    super();
    this.token = token;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return this.value;
  }
}
