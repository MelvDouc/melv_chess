import Coords from "@chacomat/game/Coords.js";
import Position from "@chacomat/game/Position.js";
import { Color, GameStatus, Wing } from "@chacomat/utils/constants.js";
import {
  IllegalMoveError,
  InactiveGameError,
  InvalidFenError
} from "@chacomat/utils/errors.js";
import type {
  AlgebraicSquareNotation,
  ChessGameMetaInfo,
  ChessGameParameters,
  PromotedPieceInitial,
} from "@chacomat/types.js";

/**
 * @classdesc Represents a sequence of positions and variations in a chess game. New positions are created by playing moves.
 */
export default class ChessGame {
  public static readonly Colors = Color;
  public static readonly Wings = Wing;
  public static readonly Statuses = GameStatus;
  protected static readonly Position = Position;
  public static readonly errors = {
    IllegalMoveError: IllegalMoveError,
    InactiveGameError: InactiveGameError,
    InvalidFenError: InvalidFenError
  };

  public currentPosition: InstanceType<typeof ChessGame.Position>;
  public readonly metaInfo: Partial<ChessGameMetaInfo>;

  constructor({ fenString, positionInfo, metaInfo }: ChessGameParameters = {}) {
    const PositionConstructor = (this.constructor as typeof ChessGame).Position;
    this.currentPosition = (positionInfo)
      ? new PositionConstructor(positionInfo)
      : PositionConstructor.fromFenString(fenString ?? Position.startFenString);
    this.currentPosition.game = this;
    this.metaInfo = metaInfo ?? {};
  }

  public get status(): GameStatus {
    return this.currentPosition.status;
  }

  /**
   * Play a move using coordinates such that a8 is {x: 0, y: 0} and h1 is {x: 7, y: 7}.
   * @param srcCoords The coords of the source square. Must contain a piece which can legally move in the current position.
   * @param destCoords The coords of the square the source piece will move to.
   * @param promotionType Optional. Will default to 'Q' if no argument was passed during a promotion.
   * @returns The current instance of a game containing the position after the move.
   */
  public move(
    srcCoords: { x: number; y: number; },
    destCoords: { x: number; y: number; },
    promotionType?: PromotedPieceInitial
  ): this {
    if (this.currentPosition.status !== GameStatus.ACTIVE)
      throw new ChessGame.errors.InactiveGameError(this.currentPosition.status);

    if (!this.currentPosition.legalMoves.some(([src, dest]) =>
      src.x === srcCoords.x
      && src.y === srcCoords.y
      && dest.x === destCoords.x
      && dest.y === destCoords.y
    ))
      throw new ChessGame.errors.IllegalMoveError(srcCoords, destCoords);

    const nextPosition = this.currentPosition.createPositionFromMove(
      Coords.get(srcCoords.x, srcCoords.y),
      Coords.get(destCoords.x, destCoords.y),
      promotionType,
      true
    );
    nextPosition.game = this;
    nextPosition.prev = this.currentPosition;
    this.currentPosition.next.push(nextPosition);
    this.currentPosition = nextPosition;

    return this;
  }

  /**
   * Play a move using algebraic square notations.
   * @param srcNotation The notation of the source square. Must contain a piece which can legally move in the current position.
   * @param destNotation The notation of the square the source piece will move to.
   * @param promotionType Optional. Will default to 'Q' if no argument was passed during a promotion.
   * @returns The current instance of a game containing the position after the move.
   */
  public moveWithNotations(
    srcNotation: AlgebraicSquareNotation,
    destNotation: AlgebraicSquareNotation,
    promotionType?: PromotedPieceInitial
  ): this {
    return this.move(
      Coords.fromNotation(srcNotation)!,
      Coords.fromNotation(destNotation)!,
      promotionType
    );
  }

  /**
   * Pretty print this game's current board to the console.
   */
  public logBoard(): void {
    this.currentPosition.board.log();
  }
}
