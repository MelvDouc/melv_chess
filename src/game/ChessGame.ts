import Colors from "@src/constants/Colors.js";
import { Coords } from "@src/constants/Coords.js";
import GameStatus, { GameResults } from "@src/constants/GameStatus.js";
import Position from "@src/game/Position.js";
import playMove from "@src/moves/play-move.js";
import { enterPgn, stringifyMetaInfo, stringifyMoves } from "@src/pgn-fen/pgn.js";
import {
  AlgebraicNotation,
  Color,
  Coordinates,
  GameMetaInfo,
  GameResult,
  PromotedPiece
} from "@src/types.js";
import { Observable } from "melv_observable";


export default class ChessGame {
  private readonly currentPositionObs = new Observable<Position>();
  private readonly resultObs = new Observable<GameResult>();
  public readonly metaInfo: Partial<GameMetaInfo> = {};

  constructor({ pgn, fen }: {
    pgn?: string;
    fen?: string;
  } = { fen: Position.startFen }) {
    if (pgn) {
      const { gameMetaInfo, enterMoves } = enterPgn(pgn);
      this.metaInfo = gameMetaInfo;
      this.currentPositionObs.value = Position.fromFen(this.metaInfo.FEN ?? fen ?? Position.startFen);
      this.resultObs.value = this.metaInfo.Result ?? GameResults.ONGOING;
      enterMoves(this);
    } else {
      this.currentPositionObs.value = Position.fromFen(fen as string);
      this.metaInfo.FEN = fen;
      this.resultObs.value = GameResults.ONGOING;
    }
  }

  public get currentPosition(): Position {
    return this.currentPositionObs.value;
  }

  public get result(): GameResult {
    return this.resultObs.value;
  }

  public onPositionChange(subscription: (position: Position) => void): void {
    this.currentPositionObs.subscribe(subscription);
  }

  public onResultChange(subscription: (result: GameResult) => void): void {
    this.resultObs.subscribe(subscription);
  }

  public playMove(srcCoords: Coordinates, destCoords: Coordinates, promotedPiece?: PromotedPiece): this {
    const nextPosition = playMove(this.currentPosition, srcCoords, destCoords, promotedPiece);

    this.checkStatus(nextPosition.getStatus(), this.currentPosition.activeColor);
    nextPosition.srcMove = [srcCoords, destCoords, promotedPiece];
    nextPosition.prev = this.currentPosition;
    this.currentPosition.next = nextPosition;
    this.currentPositionObs.value = nextPosition;
    return this;
  }

  public playMoveWithNotations(srcNotation: AlgebraicNotation, destNotation: AlgebraicNotation, promotedPiece?: PromotedPiece): this {
    return this.playMove(Coords[srcNotation], Coords[destNotation], promotedPiece);
  }

  private checkStatus(status: GameStatus, activeColor: Color): void {
    switch (status) {
      case GameStatus.CHECKMATE:
        this.resultObs.value = (activeColor === Colors.WHITE) ? GameResults.WHITE_WIN : GameResults.BLACK_WIN;
        break;
      case GameStatus.STALEMATE:
      case GameStatus.TRIPLE_REPETITION:
      case GameStatus.DRAW_BY_FIFTY_MOVE_RULE:
        this.resultObs.value = GameResults.DRAW;
        break;
    }
  }

  /**
   * End the game by resignation.
   * @param color The camp that resigns.
   */
  public resign(color: Color): void {
    this.resultObs.value = (color === Colors.WHITE) ? GameResults.WHITE_WIN : GameResults.BLACK_WIN;
    this.metaInfo.Termination = "resignation";
  }

  public getFirstPosition(): Position {
    let pos: Position | null | undefined = this.currentPosition;

    while (pos.prev)
      pos = pos.prev;

    return pos;
  }

  public goToMove(moveNumber: number, color: Color): void {
    let pos: Position | null | undefined = this.currentPosition;

    while (pos && pos.fullMoveNumber !== moveNumber) {
      pos = (pos.fullMoveNumber < moveNumber)
        ? pos.next
        : pos.prev;
    }

    if (!pos)
      throw new Error(`No position was found at move number ${moveNumber}.`);

    if (pos.activeColor === color) {
      this.currentPositionObs.value = pos;
      return;
    }

    const otherPos = (color === Colors.WHITE) ? pos.next : pos.prev;

    if (!otherPos)
      throw new Error(`No position was found at move number ${moveNumber} for color ${color}.`);

    this.currentPositionObs.value = otherPos;
  }

  public toString(): string {
    return `${stringifyMetaInfo(this.metaInfo)}\n${stringifyMoves(this)} ${this.result}`;
  }
}