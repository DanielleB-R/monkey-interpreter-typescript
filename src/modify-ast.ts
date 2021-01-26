import * as ast from "./ast-json";

export interface ModifierFunc {
  (node: ast.Node): ast.Node;
}

const modify = (node: ast.Node, modifier: ModifierFunc): ast.Node => {
  switch (node.nodeType) {
    case ast.NodeType.PROGRAM:
      node.statements = node.statements.map((stmt) => {
        const newStatement = modify(stmt, modifier);
        if (!ast.isStatement(newStatement)) {
          throw "modifier made statement into non-statement";
        }
        return newStatement;
      });
      break;
    case ast.NodeType.EXPR_STMT:
      const newExpression = modify(node.expression, modifier);
      if (!ast.isExpression(newExpression)) {
        throw "modifier made expression into non-expression";
      }
      node.expression = newExpression;
      break;
  }
  return modifier(node);
};

export default modify;
