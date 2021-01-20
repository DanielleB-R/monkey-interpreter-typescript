import * as ast from "./ast";
import * as o from "./object";

const NULL = new o.MonkeyNull();
const TRUE = new o.MonkeyBoolean(true);
const FALSE = new o.MonkeyBoolean(false);

const objectifyBoolean = (b: boolean): o.MonkeyBoolean => (b ? TRUE : FALSE);

const monkeyEval = (node: ast.Node, env: o.Environment): o.MonkeyObject => {
  if (node instanceof ast.Program) {
    return evalProgram(node, env);
  }
  if (node instanceof ast.ExpressionStatement) {
    return monkeyEval(node.expression, env);
  }
  if (node instanceof ast.BlockStatement) {
    return evalBlock(node, env);
  }
  if (node instanceof ast.ReturnStatement) {
    const returnValue = monkeyEval(node.returnValue, env);
    return new o.ReturnValue(returnValue);
  }
  if (node instanceof ast.LetStatement) {
    const value = monkeyEval(node.value, env);
    return env.setValue(node.name.value, value);
  }
  if (node instanceof ast.IntegerLiteral) {
    return new o.MonkeyInteger(node.value);
  }
  if (node instanceof ast.BooleanLiteral) {
    return objectifyBoolean(node.value);
  }
  if (node instanceof ast.PrefixExpression) {
    const right = monkeyEval(node.right, env);
    return evalPrefixExpression(node.operator, right);
  }
  if (node instanceof ast.InfixExpression) {
    const left = monkeyEval(node.left, env);
    const right = monkeyEval(node.right, env);
    return evalInfixExpression(left, node.operator, right);
  }
  if (node instanceof ast.IfExpression) {
    return evalConditionalExpression(node, env);
  }
  if (node instanceof ast.Identifier) {
    return evalIdentifier(node, env);
  }
  if (node instanceof ast.FunctionLiteral) {
    return new o.MonkeyFunction(node.parameters, node.body, env);
  }

  throw new o.EvalError("Unimplemented!");
};

const evalProgram = (
  program: ast.Program,
  env: o.Environment
): o.MonkeyObject => {
  let result: o.MonkeyObject = NULL;
  for (const stmt of program.statements) {
    result = monkeyEval(stmt, env);

    if (result instanceof o.ReturnValue) {
      return result.value;
    }
  }
  return result;
};

const evalBlock = (
  block: ast.BlockStatement,
  env: o.Environment
): o.MonkeyObject => {
  let result: o.MonkeyObject = NULL;
  for (const stmt of block.statements) {
    result = monkeyEval(stmt, env);

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
        throw new o.EvalError(`unknown operator: -${operand.objectType}`);
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
    throw new o.EvalError(`unknown operator: ${operator}${right.objectType}`);
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
    throw new o.EvalError(
      `invalid operation: ${left.objectType} + ${right.objectType}`
    );
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
    throw new o.EvalError(
      `invalid operation: ${left.objectType} + ${right.objectType}`
    );
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
      return objectifyBoolean(left === right);
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

const evalConditionalExpression = (
  expr: ast.IfExpression,
  env: o.Environment
): o.MonkeyObject => {
  const condition = monkeyEval(expr.condition, env);

  if (isTruthy(condition)) {
    return monkeyEval(expr.consequence, env);
  } else {
    if (expr.alternative) {
      return monkeyEval(expr.alternative, env);
    } else {
      return NULL;
    }
  }
};

const evalIdentifier = (
  ident: ast.Identifier,
  env: o.Environment
): o.MonkeyObject => {
  const value = env.getValue(ident.value);
  if (!value) {
    throw new o.EvalError(`undefined name ${ident.value}`);
  }
  return value;
};

const isTruthy = (obj: o.MonkeyObject): boolean =>
  obj !== FALSE && obj !== NULL;

export default monkeyEval;
