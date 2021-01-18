import * as ast from "./ast";
import * as o from "./object";

const NULL = new o.MonkeyNull();
const TRUE = new o.MonkeyBoolean(true);
const FALSE = new o.MonkeyBoolean(false);

const objectifyBoolean = (b: boolean): o.MonkeyBoolean => (b ? TRUE : FALSE);

const monkeyEval = (node: ast.Node): o.MonkeyObject => {
  if (node instanceof ast.Program) {
    return evalProgram(node);
  }
  if (node instanceof ast.ExpressionStatement) {
    return monkeyEval(node.expression);
  }
  if (node instanceof ast.BlockStatement) {
    return evalBlock(node);
  }
  if (node instanceof ast.ReturnStatement) {
    const returnValue = monkeyEval(node.returnValue);
    return new o.ReturnValue(returnValue);
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
  if (node instanceof ast.IfExpression) {
    return evalConditionalExpression(node);
  }

  throw "Unimplemented!";
};

const evalProgram = (program: ast.Program): o.MonkeyObject => {
  let result: o.MonkeyObject = NULL;
  for (const stmt of program.statements) {
    result = monkeyEval(stmt);

    if (result instanceof o.ReturnValue) {
      return result.value;
    }
  }
  return result;
};

const evalBlock = (block: ast.BlockStatement): o.MonkeyObject => {
  let result: o.MonkeyObject = NULL;
  for (const stmt of block.statements) {
    result = monkeyEval(stmt);

    if (result instanceof o.ReturnValue) {
      return result;
    }
  }
  return result;
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

const evalConditionalExpression = (expr: ast.IfExpression): o.MonkeyObject => {
  const condition = monkeyEval(expr.condition);

  if (isTruthy(condition)) {
    return monkeyEval(expr.consequence);
  } else {
    if (expr.alternative) {
      return monkeyEval(expr.alternative);
    } else {
      return NULL;
    }
  }
};

const isTruthy = (obj: o.MonkeyObject): boolean =>
  obj !== FALSE && obj !== NULL;

export default monkeyEval;
