import Color from "@chacomat/utils/Color.js";
import { PieceType } from "@chacomat/utils/constants.js";

export const pawnOffsets = {
  x: {
    [Color.WHITE]: [-1, -1],
    [Color.BLACK]: [1, 1]
  },
  y: [-1, 1]
} as const;

const knightOffsets = {
  x: [-2, -2, -1, -1, 1, 1, 2, 2],
  y: [-1, 1, -2, 2, -2, 2, -1, 1]
} as const;

const rookOffsets = {
  x: [0, -1, 0, 1],
  y: [-1, 0, 1, 0]
} as const;

const bishopOffsets = {
  x: [-1, -1, 1, 1],
  y: [-1, 1, -1, 1]
} as const;

const adjacentOffsets = {
  x: rookOffsets.x.concat(bishopOffsets.x),
  y: rookOffsets.y.concat(bishopOffsets.y)
} as const;

export const pieceOffsets = {
  [PieceType.KNIGHT]: knightOffsets,
  [PieceType.BISHOP]: bishopOffsets,
  [PieceType.ROOK]: rookOffsets,
  [PieceType.QUEEN]: adjacentOffsets,
  [PieceType.KING]: adjacentOffsets
} as const;