import * as ast from "./ast";
import * as o from "./object";

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

  return new o.MonkeyNull();
};

const evalStatements = (statements: ast.Statement[]): o.MonkeyObject => {
  return statements.reduce((_, stmt) => monkeyEval(stmt), new o.MonkeyNull());
};

export default monkeyEval;
