import { TokenType, Token, makeToken } from "./token";

const input_token = (tokenType: TokenType) => (
  literal: string,
  _: Lexer
): Token => makeToken(tokenType, literal);

const read_equals = (literal: string, lexer: Lexer): Token => {
  if (lexer.ch == "=") {
    lexer.readChar();
    return makeToken(TokenType.EQ, "==");
  }
  return makeToken(TokenType.ASSIGN, literal);
};

const read_bang = (literal: string, lexer: Lexer): Token => {
  if (lexer.ch == "=") {
    lexer.readChar();
    return makeToken(TokenType.NOT_EQ, "!=");
  }
  return makeToken(TokenType.BANG, literal);
};

const read_string = (_: string, lexer: Lexer): Token => {
  const position = lexer.position;
  lexer.advanceWhileTrue((c) => c !== '"' && c !== "\0");
  lexer.readChar();
  return makeToken(
    TokenType.STRING,
    lexer.input.substring(position, lexer.position - 1)
  );
};

interface TokenReader {
  (literal: string, lexer: Lexer): Token;
}

interface TokenReaderMap {
  [ch: string]: TokenReader;
}

const TOKEN_READERS: TokenReaderMap = {
  "=": read_equals,
  "+": input_token(TokenType.PLUS),
  "-": input_token(TokenType.MINUS),
  "!": read_bang,
  "*": input_token(TokenType.ASTERISK),
  "/": input_token(TokenType.SLASH),
  "<": input_token(TokenType.LT),
  ">": input_token(TokenType.GT),
  "(": input_token(TokenType.LPAREN),
  ")": input_token(TokenType.RPAREN),
  "{": input_token(TokenType.LBRACE),
  "}": input_token(TokenType.RBRACE),
  "[": input_token(TokenType.LBRACKET),
  "]": input_token(TokenType.RBRACKET),
  ",": input_token(TokenType.COMMA),
  ";": input_token(TokenType.SEMICOLON),
  ":": input_token(TokenType.COLON),
  let: input_token(TokenType.LET),
  fn: input_token(TokenType.FUNCTION),
  true: input_token(TokenType.TRUE),
  false: input_token(TokenType.FALSE),
  if: input_token(TokenType.IF),
  else: input_token(TokenType.ELSE),
  return: input_token(TokenType.RETURN),
  '"': read_string,
  "\0": (_: string): Token => makeToken(TokenType.EOF, ""),
};

const LETTERS_REGEXP = /^[a-zA-Z_]/;
const WHITESPACE_REGEXP = /^[ \t\n\r]/;
const DIGITS_REGEXP = /^[0-9]/;

const isLetter = (ch: string): boolean => LETTERS_REGEXP.test(ch);
const isWhitespace = (ch: string): boolean => WHITESPACE_REGEXP.test(ch);
const isDigit = (ch: string): boolean => DIGITS_REGEXP.test(ch);

export default class Lexer {
  input: string;
  // Where we're looking
  position: number = 0;
  // Where we're looking next
  readPosition: number = 0;
  ch: string = "";

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = "\0";
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition++;
  }

  advanceWhileTrue(predicate: (ch: string) => boolean) {
    while (predicate(this.ch)) {
      this.readChar();
    }
  }

  readIdentifier(): string {
    const position = this.position;
    this.advanceWhileTrue(isLetter);
    return this.input.substring(position, this.position);
  }

  readNumber(): string {
    const position = this.position;
    this.advanceWhileTrue(isDigit);
    return this.input.substring(position, this.position);
  }

  skipWhitespace() {
    this.advanceWhileTrue(isWhitespace);
  }

  nextToken(): Token {
    this.skipWhitespace();

    let literal = this.ch;
    let tokenType = TokenType.ILLEGAL;

    if (isLetter(this.ch)) {
      literal = this.readIdentifier();
      tokenType = TokenType.IDENT;
    } else if (isDigit(this.ch)) {
      literal = this.readNumber();
      tokenType = TokenType.INT;
    } else {
      this.readChar();
    }

    const tokenReader = TOKEN_READERS[literal];
    if (tokenReader) {
      return tokenReader(literal, this);
    }
    return makeToken(tokenType, literal);
  }
}
