import * as ast from "./ast";
import * as o from "./object";

const NULL = new o.MonkeyNull();
const TRUE = new o.MonkeyBoolean(true);
const FALSE = new o.MonkeyBoolean(false);

const objectifyBoolean = (b: boolean): o.MonkeyBoolean => (b ? TRUE : FALSE);

const monkeyEval = (node: ast.Node): o.MonkeyObject => {
  if (node instanceof ast.Program) {
    return evalStatements(node.statements);
  }
  if (node instanceof ast.ExpressionStatement) {
    return monkeyEval(node.expression);
  }
  if (node instanceof ast.IntegerLiteral) {
    return new o.MonkeyInteger(node.value);
  }
  if (node instanceof ast.BooleanLiteral) {
    return objectifyBoolean(node.value);
  }
  if (node instanceof ast.PrefixExpression) {
    const right = monkeyEval(node.right);
    return evalPrefixExpression(node.operator, right);
  }
  if (node instanceof ast.InfixExpression) {
    const left = monkeyEval(node.left);
    const right = monkeyEval(node.right);
    return evalInfixExpression(left, node.operator, right);
  }

  return NULL;
};

const evalStatements = (statements: ast.Statement[]): o.MonkeyObject => {
  return statements.reduce((_, stmt) => monkeyEval(stmt), NULL);
};

interface UnaryEvaluator {
  (operand: o.MonkeyObject): o.MonkeyObject;
}

const UNARY_OPERATORS: Map<string, UnaryEvaluator> = new Map([
  [
    "!",
    (operand: o.MonkeyObject): o.MonkeyObject => {
      if (operand === FALSE || operand === NULL) {
        return TRUE;
      }
      return FALSE;
    },
  ],
  [
    "-",
    (operand: o.MonkeyObject): o.MonkeyObject => {
      if (!(operand instanceof o.MonkeyInteger)) {
        return NULL;
      }
      return new o.MonkeyInteger(-operand.value);
    },
  ],
]);

const evalPrefixExpression = (
  operator: string,
  right: o.MonkeyObject
): o.MonkeyObject => {
  const evaluator = UNARY_OPERATORS.get(operator);
  if (!evaluator) {
    return NULL;
  }
  return evaluator(right);
};

interface BinaryEvaluator {
  (left: o.MonkeyObject, right: o.MonkeyObject): o.MonkeyObject;
}

interface BinaryNumericEvaluator {
  (left: number, right: number): number;
}

const integerOperation = (f: BinaryNumericEvaluator) => (
  left: o.MonkeyObject,
  right: o.MonkeyObject
): o.MonkeyObject => {
  if (!(left instanceof o.MonkeyInteger && right instanceof o.MonkeyInteger)) {
    return NULL;
  }
  return new o.MonkeyInteger(f(left.value, right.value));
};

interface BinaryNumericComparator {
  (left: number, right: number): boolean;
}

const integerCompareOperation = (f: BinaryNumericComparator) => (
  left: o.MonkeyObject,
  right: o.MonkeyObject
): o.MonkeyObject => {
  if (!(left instanceof o.MonkeyInteger && right instanceof o.MonkeyInteger)) {
    return NULL;
  }
  return objectifyBoolean(f(left.value, right.value));
};

const BINARY_OPERATORS: Map<string, BinaryEvaluator> = new Map([
  [
    "+",
    integerOperation((left: number, right: number): number => left + right),
  ],
  [
    "-",
    integerOperation((left: number, right: number): number => left - right),
  ],
  [
    "*",
    integerOperation((left: number, right: number): number => left * right),
  ],
  [
    "/",
    integerOperation((left: number, right: number): number => left / right),
  ],
  [
    "<",
    integerCompareOperation(
      (left: number, right: number): boolean => left < right
    ),
  ],
  [
    ">",
    integerCompareOperation(
      (left: number, right: number): boolean => left > right
    ),
  ],
  [
    "==",
    (left: o.MonkeyObject, right: o.MonkeyObject): o.MonkeyObject => {
      if (left instanceof o.MonkeyInteger && right instanceof o.MonkeyInteger) {
        return objectifyBoolean(left.value === right.value);
      }
      if (left instanceof o.MonkeyBoolean && right instanceof o.MonkeyBoolean) {
        return objectifyBoolean(left === right);
      }
      return NULL;
    },
  ],
  [
    "!=",
    (left: o.MonkeyObject, right: o.MonkeyObject): o.MonkeyObject => {
      if (left instanceof o.MonkeyInteger && right instanceof o.MonkeyInteger) {
        return objectifyBoolean(left.value !== right.value);
      }
      return objectifyBoolean(left !== right);
    },
  ],
]);

const evalInfixExpression = (
  left: o.MonkeyObject,
  operator: string,
  right: o.MonkeyObject
): o.MonkeyObject => {
  const evaluator = BINARY_OPERATORS.get(operator);
  if (!evaluator) {
    return NULL;
  }
  return evaluator(left, right);
};

export default monkeyEval;
