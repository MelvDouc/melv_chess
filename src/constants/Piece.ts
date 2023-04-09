enum Piece {
  WHITE_PAWN,
  BLACK_PAWN,
  KNIGHT,
  KING,
  BISHOP,
  ROOK,
  QUEEN
}

export const PiecesByName = {
  P: Piece.WHITE_PAWN,
  p: Piece.BLACK_PAWN,
  b: Piece.BISHOP,
  B: Piece.BISHOP,
  n: Piece.KNIGHT,
  N: Piece.KNIGHT,
  k: Piece.KING,
  K: Piece.KING,
  q: Piece.QUEEN,
  Q: Piece.QUEEN,
  r: Piece.ROOK,
  R: Piece.ROOK
} as const;

export const PieceAbbreviations = {
  [Piece.WHITE_PAWN]: "P",
  [Piece.BLACK_PAWN]: "p",
  [Piece.KNIGHT]: "N",
  [Piece.BISHOP]: "B",
  [Piece.ROOK]: "R",
  [Piece.QUEEN]: "Q",
  [Piece.KING]: "K"
} as const;

export type PromotedPiece = Piece.KNIGHT | Piece.BISHOP | Piece.ROOK | Piece.QUEEN;
export default Piece;