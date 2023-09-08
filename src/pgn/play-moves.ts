import Color from "@/impl/Color.ts";
import Piece from "@/impl/Piece.ts";
import CastlingMove from "@/impl/moves/CastlingMove.ts";
import PawnMove from "@/impl/moves/PawnMove.ts";
import { PgnVariations, parseVariations } from "@/pgn/utils.ts";
import { ChessGame, Move, Position } from "@/types/types.ts";

const pieceMoveR = /[NBRQK][a-h]?[1-8]?x?[a-h][1-8]/.source;
const pawnMoveR = /[a-h](x[a-h])?[1-8](=[QRBN])?/.source;
const castlingR = /(?<o>O|0)-\k<o>(-\k<o>)?/.source;
const halfMoveRegex = RegExp(`(?<halfMove>${pieceMoveR}|${pawnMoveR}|${castlingR})`, "g");

const MOVE_FINDERS: Readonly<MoveFinder[]> = [
  {
    regex: /^(?<file>[a-h])(?<rank>[1-8])/,
    find: ({ file, rank }, { legalMoves, board: { Coords } }) => {
      const destCoords = Coords.fromNotation(file + rank)!;
      return legalMoves.find((move) => {
        return move instanceof PawnMove && destCoords === move.destCoords;
      });
    }
  },
  {
    regex: /^(?<srcFile>[a-h])x(?<destFile>[a-h])(?<destRank>[1-8])/,
    find: ({ srcFile, destFile, destRank }, { legalMoves, board: { Coords } }) => {
      const srcY = Coords.fileNameToY(srcFile);
      const destCoords = Coords.fromNotation(destFile + destRank)!;
      return legalMoves.find((move) => {
        return move instanceof PawnMove
          && move.srcCoords.y === srcY
          && move.destCoords === destCoords;
      });
    }
  },
  {
    regex: /^(?<initial>[NBRQK])(?<srcFile>[a-h])?(?<srcRank>[1-8])?x?(?<destFile>[a-h])(?<destRank>[1-8])/,
    find: ({ initial, srcFile, srcRank, destFile, destRank }, { legalMoves, board, activeColor }) => {
      const srcX = srcRank ? board.Coords.rankNameToX(srcRank) : null;
      const srcY = srcFile ? board.Coords.fileNameToY(srcFile) : null;
      const destCoords = board.Coords.fromNotation(destFile + destRank)!;
      const piece = Piece.fromInitial(activeColor === Color.WHITE ? initial : initial.toLowerCase());

      return legalMoves.find((move) => {
        return move.destCoords === destCoords
          && board.getByCoords(move.srcCoords) === piece
          && (srcX === null || move.srcCoords.x === srcX)
          && (srcY === null || move.srcCoords.y === srcY);
      });
    }
  },
  {
    regex: /^(?<o>O|0)-\k<o>(?<o2>-\k<o>)?/,
    find: ({ o2 }, { legalMoves }) => {
      return legalMoves.find((move) => {
        return move instanceof CastlingMove && move.isQueenSide() === !!o2;
      });
    }
  }
];

function findHalfMove(halfMoveStr: string, position: Position) {
  for (const { regex, find } of MOVE_FINDERS) {
    const matches = halfMoveStr.match(regex);
    if (matches?.groups)
      return find(matches.groups, position);
  }

  return null;
}

function playLine(line: string, game: ChessGame) {
  for (const { groups } of line.matchAll(halfMoveRegex)) {
    if (!groups) break;

    const halfMove = findHalfMove(groups["halfMove"], game.currentPosition);

    if (!halfMove)
      throw new Error(`Illegal move "${groups["halfMove"]}" in "${line}".`);

    game.playMove(halfMove);
  }
}

function playLineAndVars(game: ChessGame, { line, variations }: PgnVariations) {
  playLine(line, game);
  const current = game.currentPosition;
  variations.forEach((element) => {
    game.currentPosition = current.prev!;
    playLineAndVars(game, element);
  });
  game.currentPosition = current;
}

export default function playMoves(movesStr: string, game: ChessGame) {
  parseVariations(movesStr).forEach((element) => playLineAndVars(game, element));
}

interface MoveFinder {
  regex: RegExp;
  find: (groups: Record<string, string>, position: Position) => Move | undefined;
};