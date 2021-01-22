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

export abstract class MonkeyObject {
  objectType: ObjectType;

  constructor(objectType: ObjectType) {
    this.objectType = objectType;
  }

  abstract inspect(): string;
}

export class MonkeyInteger extends MonkeyObject {
  value: number;

  constructor(value: number = 0) {
    super(ObjectType.INTEGER);
    this.value = value;
  }

  inspect(): string {
    return `${this.value}`;
  }
}

export class MonkeyBoolean extends MonkeyObject {
  value: boolean;

  constructor(value: boolean = false) {
    super(ObjectType.BOOLEAN);
    this.value = value;
  }

  inspect(): string {
    return `${this.value}`;
  }
}

export class MonkeyString extends MonkeyObject {
  value: string;

  constructor(value: string) {
    super(ObjectType.STRING);
    this.value = value;
  }

  inspect(): string {
    return this.value;
  }
}

export class MonkeyArray extends MonkeyObject {
  elements: MonkeyObject[];

  constructor(elements: MonkeyObject[]) {
    super(ObjectType.ARRAY);
    this.elements = elements;
  }

  inspect(): string {
    return `[${this.elements.map((obj) => obj.inspect()).join(", ")}]`;
  }
}

export class MonkeyNull extends MonkeyObject {
  constructor() {
    super(ObjectType.NULL);
  }

  inspect(): string {
    return "null";
  }
}

export class ReturnValue extends MonkeyObject {
  value: MonkeyObject;

  constructor(value: MonkeyObject) {
    super(ObjectType.RETURN);
    this.value = value;
  }

  inspect(): string {
    return this.value.inspect();
  }
}

export class MonkeyFunction extends MonkeyObject {
  parameters: ast.Identifier[];
  body: ast.BlockStatement;
  env: Environment;

  constructor(
    parameters: ast.Identifier[],
    body: ast.BlockStatement,
    env: Environment
  ) {
    super(ObjectType.FUNCTION);
    this.parameters = parameters;
    this.body = body;
    this.env = env;
  }

  inspect(): string {
    return `fn(${this.parameters
      .map((param) => param.value)
      .join(", ")}) {\n${ast.repr(this.body)}\n}`;
  }
}

export class Builtin extends MonkeyObject {
  fn: BuiltinFunction;

  constructor(fn: BuiltinFunction) {
    super(ObjectType.BUILTIN);
    this.fn = fn;
  }

  inspect(): string {
    return "builtin function";
  }
}

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

export const NULL = new MonkeyNull();
export const TRUE = new MonkeyBoolean(true);
export const FALSE = new MonkeyBoolean(false);
