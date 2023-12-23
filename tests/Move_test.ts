import CastlingMove from "$src/moves/CastlingMove.js";
import PawnMove from "$src/moves/PawnMove.js";
import { Color, SquareIndex, Board, ChessGame, Position, Pieces } from "$src/index.js";
import { expect } from "expect";
import { test } from "node:test";

function cMove(arg: ConstructorParameters<typeof CastlingMove>[0]) {
  return new CastlingMove(arg);
}

test("castling notation", () => {
  expect(cMove({ color: Color.White, wing: "queenSide" }).getAlgebraicNotation()).toContain("0-0-0");
  expect(cMove({ color: Color.Black, wing: "kingSide" }).getAlgebraicNotation()).toContain("0-0");
});

test("castling legality", () => {
  const board = Board.fromString("rn2k2r/8/8/8/8/8/7p/R3K2R");
  const whiteAttacks = board.getColorAttacks(Color.White);
  const blackAttacks = board.getColorAttacks(Color.Black);
  expect(cMove({ color: Color.White, wing: "queenSide" }).isLegal(board, blackAttacks)).toBe(true);
  expect(cMove({ color: Color.White, wing: "kingSide" }).isLegal(board, blackAttacks)).toBe(false);
  expect(cMove({ color: Color.Black, wing: "queenSide" }).isLegal(board, whiteAttacks)).toBe(false);
  expect(cMove({ color: Color.Black, wing: "kingSide" }).isLegal(board, whiteAttacks)).toBe(true);
});

test("ambiguous notation", () => {
  const pos = Position.fromFEN("8/8/2QQ4/8/3Q4/5K2/8/7k w - - 0 1");
  const { legalMovesAsAlgebraicNotation } = pos;
  expect(legalMovesAsAlgebraicNotation).toContain("Qcd5");
  expect(legalMovesAsAlgebraicNotation).toContain("Q4d5");
  expect(legalMovesAsAlgebraicNotation).toContain("Qd6d5");
});

test("promotion", () => {
  const move = new PawnMove({
    srcIndex: SquareIndex.a7,
    destIndex: SquareIndex.a8,
    srcPiece: Pieces.WHITE_PAWN,
    destPiece: null,
    isEnPassant: false
  });
  expect(move.isPromotion()).toBe(true);
  move.setPromotedPiece(Pieces.WHITE_QUEEN);
  expect(move.getAlgebraicNotation()).toEqual("a8=Q");
  move.setPromotedPiece(Pieces.WHITE_KNIGHT);
  expect(move.getAlgebraicNotation()).toEqual("a8=N");
});

test("underpromotion and capture", () => {
  const pgn = `
    [FEN "8/5pkp/b5p1/p7/P4P2/8/1pp2NPP/R6K b - - 1 32"]
    [Result "*"] *
  `;
  const game = ChessGame.fromPGN(pgn);
  expect(game.currentPosition.legalMovesAsAlgebraicNotation).toContain("bxa1=R");
});

test("en passant", () => {
  const { legalMoves, board } = Position.fromFEN("8/8/8/2pP4/8/8/8/k1K5 w - c6 0 1");
  const move = legalMoves.find(({ destNotation }) => destNotation === "c6");

  expect(move).toBeInstanceOf(PawnMove);
  expect((move as PawnMove).isEnPassant()).toBe(true);

  move!.play(board);

  expect(board.get(SquareIndex.c6)).toEqual(move!.srcPiece);
  expect(board.has(SquareIndex.d5)).toBe(false);
  expect(board.has(SquareIndex.c5)).toBe(false);
});