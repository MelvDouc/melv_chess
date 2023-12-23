import SquareIndex, { pointTable } from "$src/constants/SquareIndex.js";
import type Board from "$src/game/Board.js";
import type Position from "$src/game/Position.js";
import globalConfig from "$src/global-config.js";
import AbstractMove from "$src/moves/AbstractMove.js";
import type Piece from "$src/pieces/Piece.js";
import { Point } from "$src/typings/types.js";

export default abstract class RealMove extends AbstractMove {
  public abstract readonly srcPiece: Piece;

  public abstract get srcIndex(): SquareIndex;
  public abstract get destIndex(): SquareIndex;
  public abstract get destPiece(): Piece | null;

  public abstract undo(board: Board): void;

  public get srcPoint() {
    return pointTable[this.srcIndex];
  }

  public get destPoint() {
    return pointTable[this.destIndex];
  }

  public get srcNotation() {
    return SquareIndex[this.srcIndex];
  }

  public get destNotation() {
    return SquareIndex[this.destIndex];
  }

  public override equals(move: AbstractMove) {
    return move instanceof RealMove
      && this.srcPiece === move.srcPiece
      && this.srcIndex === move.srcIndex
      && this.destIndex === move.destIndex;
  }

  public getComputerNotation() {
    return this.srcNotation + this.destNotation;
  }

  public getCheckSign(nextPosition: Position) {
    if (nextPosition.isCheckmate())
      return globalConfig.useDoublePlusForCheckmate ? "++" : "#";
    if (nextPosition.isCheck())
      return "+";
    return "";
  }

  public override toJSON(): {
    srcIndex: number;
    destIndex: number;
  } {
    return {
      srcIndex: this.srcIndex,
      destIndex: this.destIndex
    };
  }
}