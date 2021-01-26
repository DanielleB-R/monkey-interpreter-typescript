import * as ast from "./ast-json";

export interface ModifierFunc {
  (node: ast.Node): ast.Node;
}

const assertStatement = (node: ast.Node): ast.Statement => {
  if (!ast.isStatement(node)) {
    throw "modifier made statement into non-statement";
  }
  return node;
};

const assertExpression = (node: ast.Node): ast.Expression => {
  if (!ast.isExpression(node)) {
    throw "modifier made expression into non-expression";
  }
  return node;
};

const assertBlockStatement = (node: ast.Node): ast.BlockStatement => {
  if (node.nodeType !== ast.NodeType.BLOCK) {
    throw "modifier made block statement into non-block";
  }
  return node;
};

const assertIdentifier = (node: ast.Node): ast.Identifier => {
  if (node.nodeType !== ast.NodeType.IDENTIFIER) {
    throw "modifier made identifier into non-identifier";
  }
  return node;
};

const modify = (node: ast.Node, modifier: ModifierFunc): ast.Node => {
  switch (node.nodeType) {
    case ast.NodeType.PROGRAM:
    case ast.NodeType.BLOCK:
      node.statements = node.statements.map((stmt) =>
        assertStatement(modify(stmt, modifier))
      );
      break;
    case ast.NodeType.LET:
      node.value = assertExpression(modify(node.value, modifier));
      break;
    case ast.NodeType.RETURN:
      node.returnValue = assertExpression(modify(node.returnValue, modifier));
      break;
    case ast.NodeType.EXPR_STMT:
      node.expression = assertExpression(modify(node.expression, modifier));
      break;
    case ast.NodeType.INFIX:
      node.left = assertExpression(modify(node.left, modifier));
      node.right = assertExpression(modify(node.right, modifier));
      break;
    case ast.NodeType.PREFIX:
      node.right = assertExpression(modify(node.right, modifier));
      break;
    case ast.NodeType.INDEX:
      node.left = assertExpression(modify(node.left, modifier));
      node.index = assertExpression(modify(node.index, modifier));
      break;
    case ast.NodeType.IF:
      node.condition = assertExpression(modify(node.condition, modifier));
      node.consequence = assertBlockStatement(
        modify(node.consequence, modifier)
      );
      if (node.alternative) {
        node.alternative = assertBlockStatement(
          modify(node.alternative, modifier)
        );
      }
      break;
    case ast.NodeType.FN:
      node.parameters = node.parameters.map((param) =>
        assertIdentifier(modify(param, modifier))
      );
      node.body = assertBlockStatement(modify(node.body, modifier));
      break;
    case ast.NodeType.ARRAY:
      node.elements = node.elements.map((elem) =>
        assertExpression(modify(elem, modifier))
      );
      break;
    case ast.NodeType.HASH:
      node.pairs = node.pairs.map(([key, val]) => [
        assertExpression(modify(key, modifier)),
        assertExpression(modify(val, modifier)),
      ]);
  }
  return modifier(node);
};

export default modify;
