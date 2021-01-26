import * as token from "../src/token";
import * as ast from "../src/ast-json";
import modify from "../src/modify-ast";

describe("modify", () => {
  it("should modify the AST appropriately", () => {
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
      [
        {
          nodeType: ast.NodeType.INFIX,
          left: one(),
          operator: "+",
          right: two(),
        },
        {
          nodeType: ast.NodeType.INFIX,
          left: two(),
          operator: "+",
          right: two(),
        },
      ],
      [
        {
          nodeType: ast.NodeType.INFIX,
          left: two(),
          operator: "+",
          right: one(),
        },
        {
          nodeType: ast.NodeType.INFIX,
          left: two(),
          operator: "+",
          right: two(),
        },
      ],
      [
        {
          nodeType: ast.NodeType.PREFIX,
          operator: "-",
          right: one(),
        },
        {
          nodeType: ast.NodeType.PREFIX,
          operator: "-",
          right: two(),
        },
      ],
      [
        {
          nodeType: ast.NodeType.INDEX,
          left: one(),
          index: one(),
        },
        {
          nodeType: ast.NodeType.INDEX,
          left: two(),
          index: two(),
        },
      ],
      [
        {
          nodeType: ast.NodeType.IF,
          condition: one(),
          consequence: {
            nodeType: ast.NodeType.BLOCK,
            statements: [
              {
                nodeType: ast.NodeType.EXPR_STMT,
                expression: one(),
              },
            ],
          },
          alternative: {
            nodeType: ast.NodeType.BLOCK,
            statements: [
              {
                nodeType: ast.NodeType.EXPR_STMT,
                expression: one(),
              },
            ],
          },
        },
        {
          nodeType: ast.NodeType.IF,
          condition: two(),
          consequence: {
            nodeType: ast.NodeType.BLOCK,
            statements: [
              {
                nodeType: ast.NodeType.EXPR_STMT,
                expression: two(),
              },
            ],
          },
          alternative: {
            nodeType: ast.NodeType.BLOCK,
            statements: [
              {
                nodeType: ast.NodeType.EXPR_STMT,
                expression: two(),
              },
            ],
          },
        },
      ],
      [
        {
          nodeType: ast.NodeType.RETURN,
          returnValue: one(),
        },
        {
          nodeType: ast.NodeType.RETURN,
          returnValue: two(),
        },
      ],
      [
        {
          nodeType: ast.NodeType.LET,
          name: ast.buildIdentifier(
            token.makeToken(token.TokenType.IDENT, "test")
          ),
          value: one(),
        },
        {
          nodeType: ast.NodeType.LET,
          name: ast.buildIdentifier(
            token.makeToken(token.TokenType.IDENT, "test")
          ),
          value: two(),
        },
      ],
      [
        {
          nodeType: ast.NodeType.FN,
          parameters: [],
          body: {
            nodeType: ast.NodeType.BLOCK,
            statements: [
              {
                nodeType: ast.NodeType.EXPR_STMT,
                expression: one(),
              },
            ],
          },
        },
        {
          nodeType: ast.NodeType.FN,
          parameters: [],
          body: {
            nodeType: ast.NodeType.BLOCK,
            statements: [
              {
                nodeType: ast.NodeType.EXPR_STMT,
                expression: two(),
              },
            ],
          },
        },
      ],
      [
        {
          nodeType: ast.NodeType.ARRAY,
          elements: [one(), one()],
        },
        {
          nodeType: ast.NodeType.ARRAY,
          elements: [two(), two()],
        },
      ],
      [
        {
          nodeType: ast.NodeType.HASH,
          pairs: [
            [one(), one()],
            [one(), one()],
          ],
        },
        {
          nodeType: ast.NodeType.HASH,
          pairs: [
            [two(), two()],
            [two(), two()],
          ],
        },
      ],
    ];

    cases.forEach(([input, output]) => {
      expect(modify(input, oneIntoTwo)).toEqual(output);
    });
  });
});
