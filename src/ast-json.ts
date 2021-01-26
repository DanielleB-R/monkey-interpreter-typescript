import { Token } from "./token";

export enum NodeType {
  PROGRAM = "program",
  LET = "let",
  RETURN = "return",
  EXPR_STMT = "expression-statement",
  BLOCK = "block",
  IDENTIFIER = "identifier",
  INT = "integer",
  BOOL = "boolean",
  PREFIX = "prefix-expression",
  INFIX = "infix-expression",
  IF = "if",
  FN = "function",
  CALL = "call",
  STR = "string",
  ARRAY = "array",
  INDEX = "index",
  HASH = "hash",
}

export interface NodeBase {
  nodeType: NodeType;
}

export interface Program extends NodeBase {
  nodeType: NodeType.PROGRAM;
  statements: Statement[];
}

export interface LetStatement extends NodeBase {
  nodeType: NodeType.LET;
  name: Identifier;
  value: Expression;
}

export interface ReturnStatement extends NodeBase {
  nodeType: NodeType.RETURN;
  returnValue: Expression;
}

export interface ExpressionStatement extends NodeBase {
  nodeType: NodeType.EXPR_STMT;
  expression: Expression;
}

export interface BlockStatement extends NodeBase {
  nodeType: NodeType.BLOCK;
  statements: Statement[];
}

export type Statement =
  | LetStatement
  | ReturnStatement
  | ExpressionStatement
  | BlockStatement;

export function isStatement(node: Node): node is Statement {
  switch (node.nodeType) {
    case NodeType.LET:
    case NodeType.RETURN:
    case NodeType.EXPR_STMT:
    case NodeType.BLOCK:
      return true;
    default:
      return false;
  }
}

export interface Identifier extends NodeBase {
  nodeType: NodeType.IDENTIFIER;
  value: string;
}

export function buildIdentifier(token: Token): Identifier {
  return {
    nodeType: NodeType.IDENTIFIER,
    value: token.literal,
  };
}

export interface IntegerLiteral extends NodeBase {
  nodeType: NodeType.INT;
  value: number;
}

export function buildInteger(token: Token): IntegerLiteral {
  return {
    nodeType: NodeType.INT,
    value: parseInt(token.literal, 10),
  };
}

export interface BooleanLiteral extends NodeBase {
  nodeType: NodeType.BOOL;
  value: boolean;
}

export interface PrefixExpression extends NodeBase {
  nodeType: NodeType.PREFIX;
  operator: string;
  right: Expression;
}

export interface InfixExpression extends NodeBase {
  nodeType: NodeType.INFIX;
  left: Expression;
  operator: string;
  right: Expression;
}

export interface IfExpression extends NodeBase {
  nodeType: NodeType.IF;
  condition: Expression;
  consequence: BlockStatement;
  alternative?: BlockStatement;
}

export interface FunctionLiteral extends NodeBase {
  nodeType: NodeType.FN;
  parameters: Identifier[];
  body: BlockStatement;
}

export interface CallExpression extends NodeBase {
  nodeType: NodeType.CALL;
  fn: Expression;
  args: Expression[];
}

export interface StringLiteral extends NodeBase {
  nodeType: NodeType.STR;
  value: string;
}

export interface ArrayLiteral extends NodeBase {
  nodeType: NodeType.ARRAY;
  elements: Expression[];
}

export interface HashLiteral extends NodeBase {
  nodeType: NodeType.HASH;
  pairs: [Expression, Expression][];
}

export interface IndexExpression extends NodeBase {
  nodeType: NodeType.INDEX;
  left: Expression;
  index: Expression;
}

export type Expression =
  | Identifier
  | IntegerLiteral
  | BooleanLiteral
  | PrefixExpression
  | InfixExpression
  | IfExpression
  | FunctionLiteral
  | CallExpression
  | StringLiteral
  | ArrayLiteral
  | HashLiteral
  | IndexExpression;

export function isExpression(node: Node): node is Expression {
  switch (node.nodeType) {
    case NodeType.IDENTIFIER:
    case NodeType.INT:
    case NodeType.BOOL:
    case NodeType.PREFIX:
    case NodeType.INFIX:
    case NodeType.IF:
    case NodeType.FN:
    case NodeType.CALL:
    case NodeType.STR:
    case NodeType.ARRAY:
    case NodeType.HASH:
    case NodeType.INDEX:
      return true;
    default:
      return false;
  }
}

export type Node = Program | Statement | Expression;

export function repr(node: Node): string {
  switch (node.nodeType) {
    case NodeType.PROGRAM:
      return node.statements.map(repr).join("");
    case NodeType.LET:
      return `let ${repr(node.name)} = ${repr(node.value)}`;
    case NodeType.RETURN:
      return `return ${repr(node.returnValue)}`;
    case NodeType.EXPR_STMT:
      return repr(node.expression);
    case NodeType.BLOCK:
      return node.statements.map(repr).join("");
    case NodeType.IDENTIFIER:
      return node.value;
    case NodeType.INT:
    case NodeType.BOOL:
      return `${node.value}`;
    case NodeType.PREFIX:
      return `(${node.operator}${repr(node.right)})`;
    case NodeType.INFIX:
      return `(${repr(node.left)} ${node.operator} ${repr(node.right)})`;
    case NodeType.IF:
      return `if${repr(node.condition)} ${repr(node.consequence)}${
        node.alternative ? `else ${repr(node.alternative)}` : ""
      }`;
    case NodeType.FN:
      return `fn(${node.parameters.map(repr).join(", ")}) ${repr(node.body)}`;
    case NodeType.CALL:
      return `${repr(node.fn)}(${node.args.map(repr).join(", ")})`;
    case NodeType.STR:
      return node.value;
    case NodeType.ARRAY:
      return `[${node.elements.map(repr).join(", ")}]`;
    case NodeType.INDEX:
      return `(${repr(node.left)}[${repr(node.index)}])`;
    case NodeType.HASH:
      return `{${node.pairs
        .map(([key, value]) => `${repr(key)}:${repr(value)}`)
        .join(", ")}}`;
  }
}
