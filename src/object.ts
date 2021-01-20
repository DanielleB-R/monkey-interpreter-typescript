import * as ast from "./ast";

export enum ObjectType {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL",
  RETURN = "RETURN",
  FUNCTION = "FUNCTION",
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
      .join(", ")}) {\n${this.body.repr()}\n}`;
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
