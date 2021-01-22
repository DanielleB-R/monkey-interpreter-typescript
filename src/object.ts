import * as ast from "./ast-json";

export interface BuiltinFunction {
  (...args: MonkeyObject[]): MonkeyObject;
}

export enum ObjectType {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL",
  RETURN = "RETURN",
  FUNCTION = "FUNCTION",
  STRING = "STRING",
  BUILTIN = "BUILTIN",
  ARRAY = "ARRAY",
}

export interface ObjectBase {
  objectType: ObjectType;
}

export interface MonkeyInteger extends ObjectBase {
  objectType: ObjectType.INTEGER;
  value: number;
}

export function wrapInteger(value: number): MonkeyInteger {
  return {
    objectType: ObjectType.INTEGER,
    value,
  };
}

export function isInteger(value: MonkeyObject): value is MonkeyInteger {
  return value.objectType === ObjectType.INTEGER;
}

export interface MonkeyBoolean extends ObjectBase {
  objectType: ObjectType.BOOLEAN;
  value: boolean;
}

export interface MonkeyString extends ObjectBase {
  objectType: ObjectType.STRING;
  value: string;
}

export function isString(value: MonkeyObject): value is MonkeyString {
  return value.objectType === ObjectType.STRING;
}

export interface MonkeyArray extends ObjectBase {
  objectType: ObjectType.ARRAY;
  elements: MonkeyObject[];
}

export function wrapArray(elements: MonkeyObject[]): MonkeyArray {
  return {
    objectType: ObjectType.ARRAY,
    elements,
  };
}

export function isArray(value: MonkeyObject): value is MonkeyArray {
  return value.objectType === ObjectType.ARRAY;
}

export interface MonkeyNull extends ObjectBase {
  objectType: ObjectType.NULL;
}

export interface ReturnValue extends ObjectBase {
  objectType: ObjectType.RETURN;
  value: MonkeyObject;
}

export function wrapReturn(value: MonkeyObject): ReturnValue {
  return {
    objectType: ObjectType.RETURN,
    value,
  };
}

export function unwrapReturn(value: MonkeyObject): MonkeyObject {
  return value.objectType === ObjectType.RETURN ? value.value : value;
}

export interface MonkeyFunction extends ObjectBase {
  objectType: ObjectType.FUNCTION;
  parameters: ast.Identifier[];
  body: ast.BlockStatement;
  env: Environment;
}

export interface Builtin extends ObjectBase {
  objectType: ObjectType.BUILTIN;
  fn: BuiltinFunction;
}

export type MonkeyObject =
  | MonkeyInteger
  | MonkeyBoolean
  | MonkeyString
  | MonkeyArray
  | MonkeyNull
  | ReturnValue
  | MonkeyFunction
  | Builtin;

export class EvalError {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class Environment {
  store: Map<string, MonkeyObject> = new Map();
  outer?: Environment;

  static enclosing(outer: Environment): Environment {
    const env = new Environment();
    env.outer = outer;
    return env;
  }

  getValue(name: string): MonkeyObject | undefined {
    return this.store.get(name) ?? this.outer?.getValue(name);
  }

  setValue(name: string, value: MonkeyObject): MonkeyObject {
    this.store.set(name, value);
    return value;
  }
}

export const NULL: MonkeyNull = { objectType: ObjectType.NULL };
export const TRUE: MonkeyBoolean = {
  objectType: ObjectType.BOOLEAN,
  value: true,
};
export const FALSE: MonkeyBoolean = {
  objectType: ObjectType.BOOLEAN,
  value: false,
};

export function inspect(obj: MonkeyObject): string {
  switch (obj.objectType) {
    case ObjectType.INTEGER:
    case ObjectType.BOOLEAN:
      return `${obj.value}`;
    case ObjectType.STRING:
      return obj.value;
    case ObjectType.ARRAY:
      return `[${obj.elements.map(inspect).join(", ")}]`;
    case ObjectType.NULL:
      return "null";
    case ObjectType.RETURN:
      return inspect(obj.value);
    case ObjectType.FUNCTION:
      return `fn(${obj.parameters
        .map((param) => param.value)
        .join(", ")}) {\n${ast.repr(obj.body)}\n}`;
    case ObjectType.BUILTIN:
      return "builtin function";
  }
}
