import * as ast from "./ast-json";
import * as o from "./object";
import modify from "./modify-ast";
import monkeyEval from "./evaluator";

export function quote(node: ast.Node, env: o.Environment): o.MonkeyObject {
  node = evalUnquoteCalls(node, env);
  return {
    objectType: o.ObjectType.QUOTE,
    node,
  };
}

const evalUnquoteCalls = (node: ast.Node, env: o.Environment): ast.Node =>
  modify(
    node,
    (node: ast.Node): ast.Node => {
      if (!isUnquoteCall(node)) {
        return node;
      }

      if (node.args.length !== 1) {
        return node;
      }

      const unquoted = monkeyEval(node.args[0], env);
      return objectToAst(unquoted);
    }
  );

const isUnquoteCall = (node: ast.Node): node is ast.CallExpression =>
  node.nodeType == ast.NodeType.CALL && ast.repr(node.fn) === "unquote";

const objectToAst = (obj: o.MonkeyObject): ast.Node => {
  switch (obj.objectType) {
    case o.ObjectType.INTEGER:
      return {
        nodeType: ast.NodeType.INT,
        value: obj.value,
      };
    default:
      throw "Unimplemented!";
  }
};
