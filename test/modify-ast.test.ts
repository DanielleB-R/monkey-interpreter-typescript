import * as token from "../src/token";
import * as ast from "../src/ast-json";
import modify from "../src/modify-ast";

describe("modify", () => {
  it("should modify the ASST appropriately", () => {
    const one = (): ast.Expression =>
      ast.buildInteger(token.makeToken(token.TokenType.INT, "1"));
    const two = (): ast.Expression =>
      ast.buildInteger(token.makeToken(token.TokenType.INT, "2"));

    const oneIntoTwo = (node: ast.Node): ast.Node => {
      if (node.nodeType !== ast.NodeType.INT) {
        return node;
      }
      if (node.value === 1) {
        node.value = 2;
      }

      return node;
    };

    const cases: [ast.Node, ast.Node][] = [
      [one(), two()],
      [
        {
          nodeType: ast.NodeType.PROGRAM,
          statements: [
            {
              nodeType: ast.NodeType.EXPR_STMT,
              expression: one(),
            },
          ],
        },
        {
          nodeType: ast.NodeType.PROGRAM,
          statements: [
            {
              nodeType: ast.NodeType.EXPR_STMT,
              expression: two(),
            },
          ],
        },
      ],
    ];

    cases.forEach(([input, output]) => {
      const modified = modify(input, oneIntoTwo);

      expect(modified).toEqual(output);
    });
  });
});
