import { TokenType, Token, makeToken } from "./token";

const input_token = (tokenType: TokenType) => (literal: string): Token =>
  makeToken(tokenType, literal);

interface TokenReader {
  (literal: string): Token;
}

interface TokenReaderMap {
  [ch: string]: TokenReader;
}

const TOKEN_READERS: TokenReaderMap = {
  "=": input_token(TokenType.ASSIGN),
  "+": input_token(TokenType.PLUS),
  "(": input_token(TokenType.LPAREN),
  ")": input_token(TokenType.RPAREN),
  "{": input_token(TokenType.LBRACE),
  "}": input_token(TokenType.RBRACE),
  ",": input_token(TokenType.COMMA),
  ";": input_token(TokenType.SEMICOLON),
  let: input_token(TokenType.LET),
  fn: input_token(TokenType.FUNCTION),
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
      return tokenReader(literal);
    }
    return makeToken(tokenType, literal);
  }
}
