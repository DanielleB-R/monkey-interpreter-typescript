export enum ObjectType {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  NULL = "NULL",
  RETURN = "RETURN",
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
