import SquareIndex, { indexTable, pointTable } from "$src/constants/SquareIndex";
import { BOARD_WIDTH } from "$src/constants/dimensions";
import Piece from "$src/pieces/Piece";
import { Board } from "$src/typings/types";

export default abstract class LongRangePiece extends Piece {
  override getAttacks(srcIndex: SquareIndex, board: Board) {
    const srcPoint = pointTable[srcIndex];
    return this._offsets.x.reduce((acc, xOffset, i) => {
      let destX = srcPoint.x + xOffset;
      let destY = srcPoint.y + this._offsets.y[i];

      while (destX >= 0 && destX < BOARD_WIDTH && destY >= 0 && destY < BOARD_WIDTH) {
        const destIndex = indexTable[destY][destX];
        acc.push(destIndex);
        if (board.has(destIndex)) break;
        destX += xOffset;
        destY += this._offsets.y[i];
      }

      return acc;
    }, [] as SquareIndex[]);
  }
}