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
      return o.wrapReturn(returnValue);
    case ast.NodeType.LET:
      const value = monkeyEval(node.value, env);
      return env.setValue(node.name.value, value);
    case ast.NodeType.INT:
      return o.wrapInteger(node.value);
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
      return {
        objectType: o.ObjectType.FUNCTION,
        parameters: node.parameters,
        body: node.body,
        env,
      };
    case ast.NodeType.CALL:
      return evalCallExpression(node, env);
    case ast.NodeType.STR:
      return { objectType: o.ObjectType.STRING, value: node.value };
    case ast.NodeType.ARRAY:
      return o.wrapArray(node.elements.map((expr) => monkeyEval(expr, env)));
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

    if (result.objectType === o.ObjectType.RETURN) {
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

    if (result.objectType === o.ObjectType.RETURN) {
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
      if (!o.isInteger(operand)) {
        throw new o.EvalError(`unknown operator: -${operand.objectType}`);
      }
      return o.wrapInteger(-operand.value);
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
  if (!(o.isInteger(left) && o.isInteger(right))) {
    throw new o.EvalError(
      `invalid operation: ${left.objectType} ${operator} ${right.objectType}`
    );
  }
  return o.wrapInteger(f(left.value, right.value));
};

interface BinaryNumericComparator {
  (left: number, right: number): boolean;
}

const integerCompareOperation = (f: BinaryNumericComparator) => (
  left: o.MonkeyObject,
  right: o.MonkeyObject
): o.MonkeyObject => {
  if (!(o.isInteger(left) && o.isInteger(right))) {
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
      if (o.isString(left) && o.isString(right)) {
        return {
          objectType: o.ObjectType.STRING,
          value: left.value + right.value,
        };
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
    // TODO: we don't have string comparison or array comparison
    "==",
    (left: o.MonkeyObject, right: o.MonkeyObject): o.MonkeyObject => {
      if (o.isInteger(left) && o.isInteger(right)) {
        return objectifyBoolean(left.value === right.value);
      }
      return objectifyBoolean(left === right);
    },
  ],
  [
    "!=",
    (left: o.MonkeyObject, right: o.MonkeyObject): o.MonkeyObject => {
      if (o.isInteger(left) && o.isInteger(right)) {
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
  switch (fn.objectType) {
    case o.ObjectType.FUNCTION:
      return evalMonkeyCall(call, fn, env);
    case o.ObjectType.BUILTIN:
      return evalBuiltinCall(call, fn, env);
    default:
      throw new o.EvalError(
        `calling non-callable value: type ${fn.objectType}`
      );
  }
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

  return o.unwrapReturn(result);
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
  if (!o.isArray(arr)) {
    throw new o.EvalError("indexed non-indexable type ${arr.objectType}");
  }
  const index = monkeyEval(expr.index, env);
  if (!o.isInteger(index)) {
    throw new o.EvalError(
      "indexing array with non-integer type ${index.objectType}"
    );
  }

  return arr.elements[index.value] ?? NULL;
};

const isTruthy = (obj: o.MonkeyObject): boolean =>
  obj !== FALSE && obj !== NULL;

export default monkeyEval;
