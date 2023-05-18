import Colors, { ReversedColors } from "@src/constants/Colors.js";
import {
  Coords,
  coordsToNotation,
  getCoords
} from "@src/constants/Coords.js";
import GameStatus from "@src/constants/GameStatus.js";
import Piece from "@src/constants/Piece.js";
import { CastledKingFiles, CastlingFilesByColorAndWing } from "@src/constants/placement.js";
import PieceMap from "@src/game/PieceMap.js";
import { attackedCoords, canCastleTo, pseudoLegalMoves } from "@src/moves/legal-moves.js";
import { isValidFen } from "@src/pgn-fen/fen.js";
import { halfMoveToNotation } from "@src/pgn-fen/half-move.js";
import {
  AlgebraicNotation,
  CastlingRights,
  Color,
  Coordinates,
  HalfMove,
  PositionInfo,
  Wing
} from "@src/types.js";


export default class Position implements PositionInfo {
  public static readonly startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  public static fromFen(fen: string): Position {
    if (!isValidFen(fen))
      throw new Error(`Invalid FEN string: "${fen}"`);

    const [boardStr, color, castlingStr, enPassant, halfMoveClock, fullMoveNumber] = fen.split(" ");

    return new this({
      pieces: PieceMap.parseBoard(boardStr),
      activeColor: (color === "w") ? Colors.WHITE : Colors.BLACK,
      castlingRights: this.parseCastlingRights(castlingStr),
      enPassantCoords: Coords[enPassant as AlgebraicNotation] ?? null,
      halfMoveClock: +halfMoveClock,
      fullMoveNumber: +fullMoveNumber,
      boardStr
    });
  }

  protected static parseCastlingRights(castlingStr: string): CastlingRights {
    return [...CastlingFilesByColorAndWing].reduce((acc, [color, filesByWing]) => {
      for (const key in filesByWing)
        if (castlingStr.includes(key))
          acc[color].add(filesByWing[key]);
      return acc;
    }, {
      [Colors.WHITE]: new Set<number>(),
      [Colors.BLACK]: new Set<number>()
    });
  }

  protected static stringifyCastlingRights(castlingRights: CastlingRights): string {
    return [...CastlingFilesByColorAndWing].reduce((acc, [color, filesByWing]) => {
      for (const key in filesByWing)
        if (castlingRights[color].has(filesByWing[key]))
          acc += key;
      return acc;
    }, "") || "-";
  }

  public readonly pieces: Record<Color, PieceMap>;
  public readonly activeColor: Color;
  public readonly castlingRights: CastlingRights;
  public readonly enPassantCoords: Coordinates | null;
  public readonly halfMoveClock: number;
  public readonly fullMoveNumber: number;
  public readonly legalMoves: HalfMove[];
  public readonly boardStr: string;
  public prev?: Position;
  public next: {
    notation: string;
    position: Position;
  }[] = [];

  constructor({ pieces, activeColor, castlingRights, enPassantCoords, halfMoveClock, fullMoveNumber, boardStr }: PositionInfo) {
    this.pieces = pieces;
    this.activeColor = activeColor;
    this.castlingRights = castlingRights;
    this.enPassantCoords = enPassantCoords;
    this.halfMoveClock = halfMoveClock;
    this.fullMoveNumber = fullMoveNumber;
    this.legalMoves = this.computeLegalMoves();
    this.boardStr = boardStr ?? PieceMap.stringifyBoard(pieces);
  }

  public get inactiveColor(): Color {
    return ReversedColors[this.activeColor];
  }

  public get legalMovesAsNotations(): string[] {
    return this.legalMoves.map((move) => halfMoveToNotation(this, move));
  }

  protected computeLegalMoves(): HalfMove[] {
    const moves = [...this.pieces[this.activeColor].keys()].reduce((acc, srcCoords) => {
      for (const destCoords of pseudoLegalMoves(srcCoords, this.activeColor, this.pieces, this.enPassantCoords))
        if (!this.doesMoveCauseCheck(srcCoords, destCoords))
          acc.push([srcCoords, destCoords]);
      return acc;
    }, [] as HalfMove[]);

    const coordsAttackedByInactiveColor = this.getCoordsAttackedByColor(this.inactiveColor);
    const { kingCoords } = this.pieces[this.activeColor];

    if (!coordsAttackedByInactiveColor.has(kingCoords)) {
      for (const rookY of this.castlingRights[this.activeColor]) {
        if (canCastleTo(rookY, this.activeColor, this.pieces, coordsAttackedByInactiveColor))
          moves.push(this.getCastlingMove(kingCoords, rookY));
      }
    }

    return moves;
  }

  protected getCastlingMove(kingCoords: Coordinates, rookY: number): HalfMove {
    return [
      kingCoords,
      getCoords(kingCoords.x, CastledKingFiles[Math.sign(rookY - kingCoords.y) as Wing])
    ];
  }

  protected getCoordsAttackedByColor(color: Color): Set<Coordinates> {
    const set = new Set<Coordinates>();

    for (const srcCoords of this.pieces[color].keys())
      for (const destCoords of attackedCoords(srcCoords, color, this.pieces))
        set.add(destCoords);

    return set;
  }

  public isCheck(): boolean {
    for (const srcCoords of this.pieces[this.inactiveColor].keys())
      for (const destCoords of attackedCoords(srcCoords, this.inactiveColor, this.pieces))
        if (destCoords === this.pieces[this.activeColor].kingCoords)
          return true;

    return false;
  }

  public getStatus(): GameStatus {
    if (!this.legalMoves.length)
      return (this.isCheck()) ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
    if (this.halfMoveClock >= 50)
      return GameStatus.DRAW_BY_FIFTY_MOVE_RULE;
    if (this.isInsufficientMaterial())
      return GameStatus.INSUFFICIENT_MATERIAL;
    if (this.isTripleRepetition())
      return GameStatus.TRIPLE_REPETITION;
    return GameStatus.ONGOING;
  }

  public isTripleRepetition(): boolean {
    let count = 0;

    for (
      let pos: Position | undefined = this.prev?.prev;
      pos && count < 3;
      pos = pos.prev?.prev
    ) {
      if (pos.boardStr === this.boardStr)
        count++;
    }

    return count === 3;
  }

  /**
   * Minimum material to mate (irrespective of opponent material):
   * - a pawn
   * - a rook
   * - a queen
   * - two or more knights
   * - at least one bishop of each color
   */
  public isInsufficientMaterial() {
    const [minPieces, maxPieces] = [
      this.pieces[Colors.WHITE].getNonKingPieces(),
      this.pieces[Colors.BLACK].getNonKingPieces(),
    ].sort((a, b) => a.length - b.length);

    if (minPieces.length === 0) {
      let parity: boolean | null = null;
      return maxPieces.length === 1 && maxPieces[0][1] === Piece.KNIGHT
        // 0 or more same-colored bishops
        || maxPieces.every(([{ x, y }, piece]) => {
          if (piece !== Piece.BISHOP)
            return false;
          if (parity === null)
            return (parity = (x % 2 === y % 2)), true;
          return (x % 2 === y % 2) === parity;
        });
    }

    if (minPieces.length === 1 && maxPieces.length === 1) {
      const [[coords, piece]] = minPieces;
      const [[oppCoords, oppPiece]] = maxPieces;
      return (piece === Piece.KNIGHT && oppPiece === Piece.KNIGHT)
        || (
          piece === Piece.BISHOP
          && oppPiece === Piece.BISHOP
          && (coords.x % 2 === coords.y % 2) === (oppCoords.x % 2 === oppCoords.y % 2)
        );
    }

    return false;
  }

  protected tryMove(srcCoords: Coordinates, destCoords: Coordinates): () => void {
    const srcPiece = this.pieces[this.activeColor].get(srcCoords) as Piece;
    const captureCoords = (srcPiece >= Piece.KNIGHT || destCoords !== this.enPassantCoords)
      ? destCoords
      : getCoords(srcCoords.x, destCoords.y);
    const capturedPiece = this.pieces[this.inactiveColor].get(captureCoords);

    this.pieces[this.activeColor].set(destCoords, srcPiece).delete(srcCoords);
    capturedPiece && this.pieces[this.inactiveColor].delete(captureCoords);

    return () => {
      this.pieces[this.activeColor].set(srcCoords, srcPiece).delete(destCoords);
      capturedPiece && this.pieces[this.inactiveColor].set(captureCoords, capturedPiece);
    };
  }

  protected doesMoveCauseCheck(srcCoords: Coordinates, destCoords: Coordinates): boolean {
    const undo = this.tryMove(srcCoords, destCoords);
    const isCheck = this.isCheck();
    undo();
    return isCheck;
  }

  public cloneInfo() {
    return {
      pieces: {
        [Colors.WHITE]: this.pieces[Colors.WHITE].clone(),
        [Colors.BLACK]: this.pieces[Colors.BLACK].clone()
      },
      activeColor: this.activeColor,
      inactiveColor: this.inactiveColor,
      castlingRights: structuredClone(this.castlingRights),
      enPassantCoords: this.enPassantCoords,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      legalMoves: this.legalMoves
    };
  }

  public toString(): string {
    return [
      this.boardStr,
      (this.activeColor === Colors.WHITE) ? "w" : "b",
      (this.constructor as typeof Position).stringifyCastlingRights(this.castlingRights),
      (this.enPassantCoords) ? coordsToNotation(this.enPassantCoords) : "-",
      String(this.halfMoveClock),
      String(this.fullMoveNumber)
    ].join(" ");
  }
}