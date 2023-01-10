import Color from "../constants/Color.js";
import { coordsToNotation, notationToCoords } from "../constants/coords.js";
import GameStatus from "../constants/GameStatus.js";
import Wing from "../constants/Wing.js";
import Piece from "../pieces/Piece.js";
import type {
  AlgebraicSquareNotation,
  Coords,
  FenString,
  Move,
  PositionInfo,
  Promotable,
} from "../types.js";
import Board from "./Board.js";
import CastlingRights from "./CastlingRights.js";

/**
 * @classdesc An instance of this class is an immutable description of a position in a game. Its status cannot be altered.
 */
export default class Position implements PositionInfo {
  public static readonly startFenString: FenString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  /**
   * Create a new position using only an FEN string.
   */
  public static fromFenString(fenString: FenString): Position {
    const [
      pieceString,
      color,
      castlingString,
      enPassant,
      halfMoveClock,
      fullMoveNumber,
    ] = fenString.split(" ");
    return new Position({
      board: Board.fromPieceString(pieceString),
      castlingRights: CastlingRights.fromString(castlingString),
      colorToMove: (color === "w") ? Color.WHITE : Color.BLACK,
      enPassantFile: (enPassant === "-")
        ? -1
        : notationToCoords(enPassant as AlgebraicSquareNotation)!.y,
      halfMoveClock: +halfMoveClock,
      fullMoveNumber: +fullMoveNumber,
    });
  }

  private static getWing(file: number): Wing {
    return (file < 4) ? Wing.QUEEN_SIDE : Wing.KING_SIDE;
  }

  public readonly board!: Board;
  public readonly castlingRights!: CastlingRights;
  public readonly colorToMove!: Color;
  /**
   * The empty square index where an en passant capture can be played.
   */
  public readonly enPassantFile!: number;
  public readonly halfMoveClock!: number;
  public readonly fullMoveNumber!: number;
  private _legalMoves!: Move[];
  public prev: Position | null = null;
  public next: Position[] = [];

  constructor(positionInfo: PositionInfo) {
    Object.assign(this, positionInfo);
  }

  public get legalMoves(): Move[] {
    if (this._legalMoves)
      return this._legalMoves;

    this._legalMoves = [];

    for (const move of this.pseudoLegalMoves())
      if (!this.getPositionFromMove(move[0], move[1]).isCheck())
        this._legalMoves.push(move);

    if (!this.isCheck()) {
      const kingCoords = this.board.kingCoords[this.colorToMove];
      for (const destCoords of Piece.castlingCoords(kingCoords, this))
        this._legalMoves.push([kingCoords, destCoords]);
    }

    return this._legalMoves;
  }

  /**
   * @returns A human-readable array of moves as strings following the pattern `e2-e4`.
   */
  public get legalMovesAsNotation(): string[] {
    return this.legalMoves.map(([srcCoords, destCoords]) =>
      `${coordsToNotation(srcCoords)}-${coordsToNotation(destCoords)}`
    );
  }

  /**
   * Determine whether the position is active, checkmate or a draw and what kind of draw.
   */
  public get status(): GameStatus {
    if (this.board.pieceCount < 3)
      return GameStatus.INSUFFICIENT_MATERIAL;
    if (this.halfMoveClock > 50)
      return GameStatus.FIFTY_MOVE_DRAW;
    if (!this.legalMoves.length)
      return (this.isCheck()) ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
    return GameStatus.ACTIVE;
  }

  public isCheck(): boolean {
    const { x, y } = this.board.kingCoords[this.colorToMove];
    const attackedCoords = this.board.getCoordsAttackedByColor(-this.colorToMove as Color);
    return x in attackedCoords && attackedCoords[x][y] === true;
  }

  /**
   * Generates the moves that could be played without regard for whether it puts the current player in check.
   */
  private *pseudoLegalMoves(): Generator<Move, void, unknown> {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const srcCoords = { x, y };
        if (this.board.get(srcCoords)?.color !== this.colorToMove)
          continue;
        for (const destCoords of this.board.get(srcCoords)!.pseudoLegalMoves(srcCoords, this))
          yield [srcCoords, destCoords] as Move;
      }
    }
  }

  private handlePawnMove(srcCoords: Coords, destCoords: Coords, board: Board, promotionType: Promotable = "Q"): void {
    if (destCoords.y === this.enPassantFile)
      return board.unset({ x: srcCoords.x, y: destCoords.y });

    if (destCoords.y === Piece.INITIAL_PIECE_RANKS[-this.colorToMove as Color])
      Piece.promote(board.get(srcCoords)!, promotionType);
  }

  private handleKingMove(srcCoords: Coords, destCoords: Coords, board: Board, castlingRights: CastlingRights, srcColor: Color): void {
    castlingRights[srcColor][Wing.QUEEN_SIDE] = false;
    castlingRights[srcColor][Wing.KING_SIDE] = false;
    board.kingCoords[srcColor] = destCoords;

    if (Math.abs(destCoords.y - srcCoords.y) > 1) {
      const wing = Position.getWing(destCoords.y);
      const rookCoords = { x: srcCoords.x, y: wing };
      board
        .set({ x: srcCoords.x, y: Piece.CASTLED_ROOK_FILES[wing] }, board.get(rookCoords)!)
        .unset(rookCoords);
    }
  }

  private isInitialRookSquare(coords: Coords, color: Color): boolean {
    return coords.x === Piece.INITIAL_PIECE_RANKS[color]
      && (coords.y === Wing.QUEEN_SIDE || coords.y === Wing.KING_SIDE);
  }

  /**
   * The color to move isn't updated just yet as this position will be used to verify if a move has put the currently active color in check.
   */
  public getPositionFromMove(
    srcCoords: Coords,
    destCoords: Coords,
    promotionType: Promotable = "Q",
    updateColorAndMoveNumber = false,
  ): Position {
    const { board, castlingRights } = this.clone();

    const srcPiece = board.get(srcCoords) as Piece,
      destPiece = board.get(destCoords);

    const isSrcPiecePawn = srcPiece.type === Piece.Types.PAWN;
    const isCaptureOrPawnMove = !!destPiece || isSrcPiecePawn;

    switch (srcPiece.type) {
      case Piece.Types.PAWN:
        this.handlePawnMove(srcCoords, destCoords, board, promotionType);
        break;
      case Piece.Types.KING:
        this.handleKingMove(srcCoords, destCoords, board, castlingRights, srcPiece.color);
        break;
      case Piece.Types.ROOK:
        if (this.isInitialRookSquare(srcCoords, srcPiece.color))
          castlingRights[srcPiece.color][srcCoords.y as Wing] = false;
    }

    if (destPiece?.type === Piece.Types.ROOK && this.isInitialRookSquare(destCoords, destPiece!.color))
      castlingRights[destPiece.color][destCoords.y as Wing] = false;

    board.set(destCoords, srcPiece).unset(srcCoords);

    return new Position({
      board,
      castlingRights,
      enPassantFile: (isSrcPiecePawn && Math.abs(destCoords.x - srcCoords.x) > 1)
        ? srcCoords.y
        : -1,
      colorToMove: (updateColorAndMoveNumber)
        ? -this.colorToMove as Color
        : this.colorToMove,
      halfMoveClock: (isCaptureOrPawnMove) ? 0 : this.halfMoveClock + 1,
      fullMoveNumber: (updateColorAndMoveNumber && this.colorToMove === Color.BLACK)
        ? this.fullMoveNumber + 1
        : this.fullMoveNumber,
    });
  }

  /**
   * @returns A deep clone of this position.
   */
  public clone(): Position {
    return new Position({
      board: this.board.clone(),
      castlingRights: this.castlingRights.clone(),
      colorToMove: this.colorToMove,
      enPassantFile: this.enPassantFile,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
    });
  }

  public toString(): FenString {
    return [
      this.board.toString(),
      (this.colorToMove === Color.WHITE) ? "w" : "b",
      this.castlingRights.toString(),
      (this.enPassantFile === -1) ? "-" : coordsToNotation({
        y: this.enPassantFile,
        x: Piece.MIDDLE_RANKS[this.colorToMove] + this.colorToMove,
      }),
      String(this.halfMoveClock),
      String(this.fullMoveNumber)
    ].join(" ");
  }
}
