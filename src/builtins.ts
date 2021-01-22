import * as o from "./object";

interface UnaryBuiltin {
  (arg: o.MonkeyObject): o.MonkeyObject;
}

const unary = (name: string, fn: UnaryBuiltin) => (
  ...args: o.MonkeyObject[]
): o.MonkeyObject => {
  if (args.length !== 1) {
    throw new o.EvalError(`${name}() takes one arg, got ${args.length}`);
  }
  const [arg] = args;
  return fn(arg);
};

const BUILTINS: Map<string, o.Builtin> = new Map([
  [
    "len",
    new o.Builtin(
      unary(
        "len",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (arg instanceof o.MonkeyString) {
            return new o.MonkeyInteger(arg.value.length);
          }
          if (arg instanceof o.MonkeyArray) {
            return new o.MonkeyInteger(arg.elements.length);
          }
          throw new o.EvalError(
            `argument to len() not supported, got ${arg.objectType}`
          );
        }
      )
    ),
  ],
  [
    "first",
    new o.Builtin(
      unary(
        "first",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (!(arg instanceof o.MonkeyArray)) {
            throw new o.EvalError(
              `argument to first() not supported, got ${arg.objectType}`
            );
          }
          return arg.elements[0] ?? o.NULL;
        }
      )
    ),
  ],
  [
    "last",
    new o.Builtin(
      unary(
        "last",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (!(arg instanceof o.MonkeyArray)) {
            throw new o.EvalError(
              `argument to last() not supported, got ${arg.objectType}`
            );
          }
          return arg.elements[arg.elements.length - 1] ?? o.NULL;
        }
      )
    ),
  ],
  [
    "rest",
    new o.Builtin(
      unary(
        "last",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (!(arg instanceof o.MonkeyArray)) {
            throw new o.EvalError(
              `argument to rest() not supported, got ${arg.objectType}`
            );
          }
          if (arg.elements.length === 0) {
            return o.NULL;
          }
          return new o.MonkeyArray(arg.elements.slice(1));
        }
      )
    ),
  ],
  [
    "push",
    new o.Builtin(
      (...args: o.MonkeyObject[]): o.MonkeyObject => {
        if (args.length !== 2) {
          throw new o.EvalError(`push() takes two args, got ${args.length}`);
        }
        const [arr, elem] = args;
        if (!(arr instanceof o.MonkeyArray)) {
          throw new o.EvalError(
            `first argument to push() not supported, got ${arr.objectType}`
          );
        }
        return new o.MonkeyArray([...arr.elements, elem]);
      }
    ),
  ],
]);

export default BUILTINS;
