import { ReversedColor } from "@chacomat/constants/Color.js";
import type {
  BlackPieceInitial,
  Board,
  Color,
  Coords,
  IndexGenerator,
  PieceInitial,
  PieceName,
  PieceOffsets,
  WhitePieceInitial,
  Wings
} from "@chacomat/types.local.js";
import {
  coordsToIndex,
  indexToCoords,
  isSafe
} from "@chacomat/utils/Index.js";

export default abstract class Piece {
  static readonly offsets: PieceOffsets;
  static readonly START_RANKS = {
    WHITE: 7,
    BLACK: 0
  };
  static readonly CASTLED_KING_FILES: Wings<number> = {
    0: 2,
    7: 6
  };
  static readonly CASTLED_ROOK_FILES: Wings<number> = {
    0: 3,
    7: 5
  };
  static readonly DIRECTIONS = {
    WHITE: -1,
    BLACK: 1
  };
  static readonly pieceClassesByInitial = new Map<WhitePieceInitial, typeof Piece>();
  static readonly pieceInitialsByClass = new Map<typeof Piece, WhitePieceInitial>();


  static get whiteInitial(): WhitePieceInitial {
    return this.pieceInitialsByClass.get(this);
  }

  static fromInitial(initial: PieceInitial) {
    const whiteInitial = initial.toUpperCase() as WhitePieceInitial;
    return Reflect.construct(this.pieceClassesByInitial.get(whiteInitial), [
      (initial === whiteInitial) ? "WHITE" : "BLACK"
    ]);
  }

  readonly color: Color;
  #index: number;
  #board: Board;

  constructor(color: Color) {
    this.color = color;
  }

  get pieceClass(): typeof Piece {
    return this.constructor as typeof Piece;
  }

  get pieceName(): PieceName {
    return this.pieceClass.name as PieceName;
  }

  get initial(): PieceInitial {
    if (this.color === "WHITE")
      return this.pieceClass.whiteInitial;
    return this.pieceClass.whiteInitial.toLowerCase() as BlackPieceInitial;
  }

  get direction(): number {
    return this.pieceClass.DIRECTIONS[this.color];
  }

  get offsets() {
    return this.pieceClass.offsets;
  }

  get startRank(): number {
    return this.pieceClass.START_RANKS[this.color];
  }

  get oppositeColor(): Color {
    return ReversedColor[this.color];
  }

  getIndex(): number {
    return this.#index;
  }

  setIndex(index: number): this {
    this.#index = index;
    return this;
  }

  getCoords(): Coords {
    return indexToCoords(this.#index);
  }

  setCoords(coords: Coords): this {
    this.#index = coordsToIndex(coords.x, coords.y);
    return this;
  }

  getBoard(): Board {
    return this.#board;
  }

  setBoard(board: Board): this {
    this.#board = board;
    return this;
  }

  *attackedIndices(): IndexGenerator {
    const { x, y } = this.getCoords();

    for (let i = 0; i < this.offsets.x.length; i++) {
      const x2 = x + this.offsets.x[i],
        y2 = y + this.offsets.y[i];
      if (isSafe(x2) && isSafe(y2))
        yield coordsToIndex(x2, y2);
    }
  }

  *pseudoLegalMoves(): IndexGenerator {
    for (const targetIndex of this.attackedIndices())
      if (this.#board.get(targetIndex)?.color !== this.color)
        yield targetIndex;
  }

  clone(): Piece {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new (this.pieceClass)(this.color);
  }
}