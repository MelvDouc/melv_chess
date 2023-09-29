import CapablancaBoard from "@/variants/capablanca-chess/CapablancaBoard.ts";
import CapablancaPiece from "@/variants/capablanca-chess/CapablancaPiece.ts";
import Chess960Position from "@/variants/chess960/Chess960Position.ts";
import ShatranjBoard from "@/variants/shatranj/ShatranjBoard.ts";
import ShatranjPiece from "@/variants/shatranj/ShatranjPiece.ts";
import { assert, assertEquals, assertLess } from "@dev_deps";

Deno.test("string to board", () => {
  const board = new ShatranjBoard().addPiecesFromString("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  const blackPieceRank = Array.from({ length: 8 }, (_, y) => board.get(board.coords(0, y)));
  const whitePieceRank = Array.from({ length: 8 }, (_, y) => board.get(board.coords(7, y)));
  assert(whitePieceRank.every((piece, i) => blackPieceRank[i] === piece?.opposite));
});

Deno.test("board to string", () => {
  const board = new ShatranjBoard();

  for (let y = 0; y < 8; y++) {
    board.set(board.coords(1, y), ShatranjPiece.Pieces.BLACK_PAWN);
    board.set(board.coords(6, y), ShatranjPiece.Pieces.WHITE_PAWN);
  }

  assertEquals(board.toString(), "8/pppppppp/8/8/8/8/PPPPPPPP/8");
});

Deno.test("board validity - chess960", () => {
  const pos = Chess960Position.new();
  const boardStr = pos.board.toString();
  const kIndex = boardStr.indexOf("k");
  assertLess(boardStr.indexOf("r"), kIndex);
  assertLess(kIndex, boardStr.lastIndexOf("r"));
  assert(boardStr.indexOf("b") % 2 !== boardStr.lastIndexOf("b") % 2, boardStr);
});

Deno.test("board validity - Capablanca Chess #1", () => {
  const boardStr = "rnabqkbcnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNABQKBCNR";
  const board = new CapablancaBoard().addPiecesFromString(boardStr);
  assertEquals(boardStr, board.toString());
});

Deno.test("board validity - Capablanca Chess #2", () => {
  const boardStr = "rnabqkbcnr/pppppppppp/10/10/10/10/PPPPPPPPPP/RNABQKBCNR";
  const board = new CapablancaBoard().addPiecesFromString(boardStr);
  const a1 = board.at(7, 0);
  const b1 = board.at(7, 1);
  const c1 = board.at(7, 2);
  const h1 = board.at(7, 7);
  const i1 = board.at(7, 8);
  const j1 = board.at(7, 9);
  assertEquals(a1, j1);
  assertEquals(b1, i1);
  assertEquals(c1, CapablancaPiece.Pieces.WHITE_ARCHBISHOP);
  assertEquals(h1, CapablancaPiece.Pieces.WHITE_CHANCELLOR);
});