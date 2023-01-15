import Piece from "@pieces/Piece.js";
import type {
  Bishop,
  CoordsGenerator,
  Knight,
  PieceInfo,
  PromotedPieceInitial,
  Queen,
  Rook
} from "../types.js";

export default class Pawn extends Piece {
  public static override readonly WHITE_INITIAL = Piece.WHITE_PIECE_INITIALS.PAWN;

  private static pawnXOffsets = {
    WHITE: [-1, -1],
    BLACK: [1, 1]
  };

  private static pawnYOffsets = [-1, 1];

  private *forwardMoves(): CoordsGenerator {
    const coords1 = this.coords.getPeer(Pawn.DIRECTIONS[this.color], 0)!;

    if (!this.board.get(coords1)) {
      yield coords1;

      if (this.coords.x === Piece.START_PAWN_RANKS[this.color]) {
        const coords2 = coords1.getPeer(Pawn.DIRECTIONS[this.color], 0)!;

        if (!this.board.get(coords2))
          yield coords2;
      }
    }
  }

  private *captures(): CoordsGenerator {
    for (const destCoords of this.attackedCoords())
      if (
        this.board.get(destCoords)?.color === this.oppositeColor
        || destCoords.y === this.board.position.enPassantFile
        && this.coords.x === Piece.MIDDLE_RANKS[this.oppositeColor]
      )
        yield destCoords;
  }

  public override *attackedCoords(): CoordsGenerator {
    for (const xOffset of Pawn.pawnXOffsets[this.color]) {
      for (const yOffset of Pawn.pawnYOffsets) {
        const coords = this.coords.getPeer(xOffset, yOffset);
        if (coords)
          yield coords;
      }
    }
  }

  public override *pseudoLegalMoves(): CoordsGenerator {
    yield* this.forwardMoves();
    yield* this.captures();
  }

  public promote(type: PromotedPieceInitial): Queen | Rook | Bishop | Knight {
    return Reflect.construct(Piece.constructors.get(type)!, [{
      color: this.color,
      board: this.board
    } as PieceInfo]);
  }
}