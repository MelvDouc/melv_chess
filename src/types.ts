import { Color } from "@src/constants/Colors.js";
import { GameResult } from "@src/constants/GameStatus.js";
import Piece, { PromotedPiece } from "@src/constants/Piece.js";
import { Coordinates, Coords } from "@src/constants/Coords.js";

export type PieceMap = Map<Coordinates, Piece>;
export type CastlingRights = Record<Color, Set<number>>;
export type Wing = -1 | 1;
export type HalfMove = [Coordinates, Coordinates];
export type HalfMoveWithPromotion = [...HalfMove, PromotedPiece?];
export type AlgebraicNotation = keyof typeof Coords;

export interface PositionInfo {
  pieces: Record<Color, PieceMap>;
  kingCoords: Record<Color, Coordinates>;
  activeColor: Color;
  /**
   * Contains initial rook files.
   */
  castlingRights: CastlingRights;
  enPassantCoords: Coordinates | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export interface GameMetaInfo {
  White: string;
  Black: string;
  Result: GameResult;
  FEN: string;
  WhiteElo: number;
  BlackElo: number;
  WhiteTeam: string;
  BlackTeam: string;
  Event: string;
  Site: string;
  Round: number;
  /**
   * Should be in the format `YYYY.MM.DD`.
   */
  Date: string;
  TimeControl: string;
  ECO: string;
  Opening: string;
  Variation: string;
  Termination: string;
  PlyCount: number;
  Annotator: string;
  [x: string]: unknown;
}