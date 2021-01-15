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
    return `${this.expression ? this.expression.repr() : ""}`;
  }
}

export class BlockStatement extends Statement {
  token: Token;
  statements: Statement[] = [];

  constructor(token: Token) {
    super();
    this.token = token;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return this.statements.map((statement) => statement.repr()).join("");
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

export class IntegerLiteral extends Expression {
  token: Token;
  value: number;

  constructor(token: Token, value: number) {
    super();
    this.token = token;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return this.token.literal;
  }
}

export class BooleanLiteral extends Expression {
  token: Token;
  value: boolean;

  constructor(token: Token, value: boolean) {
    super();
    this.token = token;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return this.token.literal;
  }
}

export class PrefixExpression extends Expression {
  token: Token;
  operator: string;
  right: Expression;

  constructor(token: Token, operator: string, right: Expression) {
    super();
    this.token = token;
    this.operator = operator;
    this.right = right;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `(${this.operator}${this.right.repr()})`;
  }
}

export class InfixExpression extends Expression {
  token: Token;
  left: Expression;
  operator: string;
  right: Expression;

  constructor(
    token: Token,
    left: Expression,
    operator: string,
    right: Expression
  ) {
    super();
    this.token = token;
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `(${this.left.repr()} ${this.operator} ${this.right.repr()})`;
  }
}

export class IfExpression extends Expression {
  token: Token;
  condition: Expression;
  consequence: BlockStatement;
  alternative?: BlockStatement;

  constructor(
    token: Token,
    condition: Expression,
    consequence: BlockStatement,
    alternative?: BlockStatement
  ) {
    super();
    this.token = token;
    this.condition = condition;
    this.consequence = consequence;
    this.alternative = alternative;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `if${this.condition.repr()} ${this.consequence.repr()}${
      this.alternative ? `else ${this.alternative.repr}` : ""
    }`;
  }
}

export class FunctionLiteral extends Expression {
  token: Token;
  parameters: Identifier[];
  body: BlockStatement;

  constructor(token: Token, parameters: Identifier[], body: BlockStatement) {
    super();
    this.token = token;
    this.parameters = parameters;
    this.body = body;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  repr(): string {
    return `fn(${this.parameters
      .map((ident) => ident.repr())
      .join(", ")}) ${this.body.repr()}`;
  }
}
