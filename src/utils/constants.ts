export enum Color {
  WHITE = "WHITE",
  BLACK = "BLACK"
}

/**
 * These coincide with the rooks' initial files in a normal game.
 */
export enum Wing {
  QUEEN_SIDE = 0,
  KING_SIDE = 7
}

export enum GameStatus {
  ACTIVE = "active",
  CHECKMATE = "checkmate",
  STALEMATE = "stalemate",
  TRIPLE_REPETITION = "triple repetition",
  FIFTY_MOVE_DRAW = "draw by fifty-move rule",
  INSUFFICIENT_MATERIAL = "insufficient material"
}

export enum PieceType {
  PAWN = "P",
  KNIGHT = "N",
  BISHOP = "B",
  ROOK = "R",
  QUEEN = "Q",
  KING = "K"
}

export const ConsoleColors = {
  Reset: "\x1b[0m",
  FgBlack: "\x1b[30m",
  BgWhite: "\x1b[47m",
  BgGreen: "\x1b[42m"
} as const;