import { TokenType, Token, makeToken } from "./token";

const single_char_token = (tokenType: TokenType) => (lexer: Lexer): Token =>
  makeToken(tokenType, lexer.ch);

interface TokenReader {
  (lexer: Lexer): Token;
}

interface TokenReaderMap {
  [ch: string]: TokenReader;
}

const TOKEN_READERS: TokenReaderMap = {
  "=": single_char_token(TokenType.ASSIGN),
  "+": single_char_token(TokenType.PLUS),
  "(": single_char_token(TokenType.LPAREN),
  ")": single_char_token(TokenType.RPAREN),
  "{": single_char_token(TokenType.LBRACE),
  "}": single_char_token(TokenType.RBRACE),
  ",": single_char_token(TokenType.COMMA),
  ";": single_char_token(TokenType.SEMICOLON),
  "\0": (_: Lexer): Token => makeToken(TokenType.EOF, ""),
};

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

  nextToken(): Token {
    const tokenReader = TOKEN_READERS[this.ch];
    if (!tokenReader) {
      return makeToken(TokenType.ILLEGAL, this.ch);
    }

    const token = tokenReader(this);
    this.readChar();
    return token;
  }
}
