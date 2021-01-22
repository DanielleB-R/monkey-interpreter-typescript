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
    {
      objectType: o.ObjectType.BUILTIN,
      fn: unary(
        "len",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          switch (arg.objectType) {
            case o.ObjectType.STRING:
              return o.wrapInteger(arg.value.length);
            case o.ObjectType.ARRAY:
              return o.wrapInteger(arg.elements.length);
            default:
              throw new o.EvalError(
                `argument to len() not supported, got ${arg.objectType}`
              );
          }
        }
      ),
    },
  ],
  [
    "first",
    {
      objectType: o.ObjectType.BUILTIN,
      fn: unary(
        "first",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (!o.isArray(arg)) {
            throw new o.EvalError(
              `argument to first() not supported, got ${arg.objectType}`
            );
          }
          return arg.elements[0] ?? o.NULL;
        }
      ),
    },
  ],
  [
    "last",
    {
      objectType: o.ObjectType.BUILTIN,
      fn: unary(
        "last",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (!o.isArray(arg)) {
            throw new o.EvalError(
              `argument to last() not supported, got ${arg.objectType}`
            );
          }
          return arg.elements[arg.elements.length - 1] ?? o.NULL;
        }
      ),
    },
  ],
  [
    "rest",
    {
      objectType: o.ObjectType.BUILTIN,
      fn: unary(
        "last",
        (arg: o.MonkeyObject): o.MonkeyObject => {
          if (!o.isArray(arg)) {
            throw new o.EvalError(
              `argument to rest() not supported, got ${arg.objectType}`
            );
          }
          if (arg.elements.length === 0) {
            return o.NULL;
          }
          return o.wrapArray(arg.elements.slice(1));
        }
      ),
    },
  ],
  [
    "push",
    {
      objectType: o.ObjectType.BUILTIN,
      fn: (...args: o.MonkeyObject[]): o.MonkeyObject => {
        if (args.length !== 2) {
          throw new o.EvalError(`push() takes two args, got ${args.length}`);
        }
        const [arr, elem] = args;
        if (!o.isArray(arr)) {
          throw new o.EvalError(
            `first argument to push() not supported, got ${arr.objectType}`
          );
        }
        return o.wrapArray([...arr.elements, elem]);
      },
    },
  ],
]);

export default BUILTINS;
