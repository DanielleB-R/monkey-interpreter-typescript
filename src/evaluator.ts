import * as ast from "./ast-json";
import * as o from "./object";
import { NULL, TRUE, FALSE } from "./object";
import BUILTINS from "./builtins";

const objectifyBoolean = (b: boolean): o.MonkeyBoolean => (b ? TRUE : FALSE);

const monkeyEval = (node: ast.Node, env: o.Environment): o.MonkeyObject => {
  switch (node.nodeType) {
    case ast.NodeType.PROGRAM:
      return evalProgram(node, env);
    case ast.NodeType.EXPR_STMT:
      return monkeyEval(node.expression, env);
    case ast.NodeType.BLOCK:
      return evalBlock(node, env);
    case ast.NodeType.RETURN:
      const returnValue = monkeyEval(node.returnValue, env);
      return new o.ReturnValue(returnValue);
    case ast.NodeType.LET:
      const value = monkeyEval(node.value, env);
      return env.setValue(node.name.value, value);
    case ast.NodeType.INT:
      return new o.MonkeyInteger(node.value);
    case ast.NodeType.BOOL:
      return objectifyBoolean(node.value);
    case ast.NodeType.PREFIX:
      const right = monkeyEval(node.right, env);
      return evalPrefixExpression(node.operator, right);
    case ast.NodeType.INFIX:
      const left = monkeyEval(node.left, env);
      const rightValue = monkeyEval(node.right, env);
      return evalInfixExpression(left, node.operator, rightValue);
    case ast.NodeType.IF:
      return evalConditionalExpression(node, env);
    case ast.NodeType.IDENTIFIER:
      return evalIdentifier(node, env);
    case ast.NodeType.FN:
      return new o.MonkeyFunction(node.parameters, node.body, env);
    case ast.NodeType.CALL:
      return evalCallExpression(node, env);
    case ast.NodeType.STR:
      return new o.MonkeyString(node.value);
    case ast.NodeType.ARRAY:
      return new o.MonkeyArray(
        node.elements.map((expr) => monkeyEval(expr, env))
      );
    case ast.NodeType.INDEX:
      return evalIndexExpression(node, env);
  }
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

const integerOperation = (operator: string, f: BinaryNumericEvaluator) => (
  left: o.MonkeyObject,
  right: o.MonkeyObject
): o.MonkeyObject => {
  if (!(left instanceof o.MonkeyInteger && right instanceof o.MonkeyInteger)) {
    throw new o.EvalError(
      `invalid operation: ${left.objectType} ${operator} ${right.objectType}`
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

const add_numbers = integerOperation(
  "+",
  (left: number, right: number): number => left + right
);

const BINARY_OPERATORS: Map<string, BinaryEvaluator> = new Map([
  [
    "+",
    (left: o.MonkeyObject, right: o.MonkeyObject): o.MonkeyObject => {
      if (left instanceof o.MonkeyString && right instanceof o.MonkeyString) {
        return new o.MonkeyString(left.value + right.value);
      }
      return add_numbers(left, right);
    },
  ],
  [
    "-",
    integerOperation(
      "-",
      (left: number, right: number): number => left - right
    ),
  ],
  [
    "*",
    integerOperation(
      "*",
      (left: number, right: number): number => left * right
    ),
  ],
  [
    "/",
    integerOperation(
      "/",
      (left: number, right: number): number => left / right
    ),
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
  let value = env.getValue(ident.value);

  if (!value) {
    value = BUILTINS.get(ident.value);
  }

  if (!value) {
    throw new o.EvalError(`undefined name ${ident.value}`);
  }
  return value;
};

const evalCallExpression = (
  call: ast.CallExpression,
  env: o.Environment
): o.MonkeyObject => {
  const fn = monkeyEval(call.fn, env);
  if (fn instanceof o.MonkeyFunction) {
    return evalMonkeyCall(call, fn, env);
  }
  if (fn instanceof o.Builtin) {
    return evalBuiltinCall(call, fn, env);
  }
  throw new o.EvalError(`calling non-callable value: type ${fn.objectType}`);
};

const evalMonkeyCall = (
  call: ast.CallExpression,
  fn: o.MonkeyFunction,
  env: o.Environment
): o.MonkeyObject => {
  const args = call.args.map((arg) => monkeyEval(arg, env));

  const innerEnv = o.Environment.enclosing(fn.env);
  args.forEach((arg, i) => innerEnv.setValue(fn.parameters[i].value, arg));

  const result = monkeyEval(fn.body, innerEnv);

  return result instanceof o.ReturnValue ? result.value : result;
};

const evalBuiltinCall = (
  call: ast.CallExpression,
  fn: o.Builtin,
  env: o.Environment
): o.MonkeyObject => {
  const args = call.args.map((arg) => monkeyEval(arg, env));

  return fn.fn(...args);
};

const evalIndexExpression = (
  expr: ast.IndexExpression,
  env: o.Environment
): o.MonkeyObject => {
  const arr = monkeyEval(expr.left, env);
  if (!(arr instanceof o.MonkeyArray)) {
    throw new o.EvalError("indexed non-indexable type ${arr.objectType}");
  }
  const index = monkeyEval(expr.index, env);
  if (!(index instanceof o.MonkeyInteger)) {
    throw new o.EvalError(
      "indexing array with non-integer type ${index.objectType}"
    );
  }

  return arr.elements[index.value] ?? NULL;
};

const isTruthy = (obj: o.MonkeyObject): boolean =>
  obj !== FALSE && obj !== NULL;

export default monkeyEval;
