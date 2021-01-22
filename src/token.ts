export enum TokenType {
  ILLEGAL = "ILLEGAL",
  EOF = "EOF",

  IDENT = "IDENT",
  INT = "INT",
  STRING = "STRING",

  // Operators
  ASSIGN = "=",
  PLUS = "+",
  MINUS = "-",
  BANG = "!",
  ASTERISK = "*",
  SLASH = "/",
  LT = "<",
  GT = ">",
  EQ = "==",
  NOT_EQ = "!=",

  // Delimiters
  COMMA = ",",
  SEMICOLON = ";",

  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",
  LBRACKET = "[",
  RBRACKET = "]",

  // Keywords
  FUNCTION = "FUNCTION",
  LET = "LET",
  TRUE = "TRUE",
  FALSE = "FALSE",
  IF = "IF",
  ELSE = "ELSE",
  RETURN = "RETURN",
}

export interface Token {
  tokenType: TokenType;
  literal: string;
}

export const makeToken = (tokenType: TokenType, literal: string): Token => ({
  tokenType,
  literal,
});
