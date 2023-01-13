import ChessGame from "./ChessGame.js";

describe("Fool's Mate", () => {
  const game = new ChessGame();
  game
    .moveWithNotations("f2", "f3")
    .moveWithNotations("e7", "e6")
    .moveWithNotations("g2", "g4")
    .moveWithNotations("d8", "h4");
  it("should be check", () => {
    expect(game.currentPosition.isCheck()).toBe(true);
  });
  it("should be checkmate", () => {
    expect(game.currentPosition.status).toBe(ChessGame.Statuses.CHECKMATE);
  });
});

describe("en passant", () => {
  const game1 = new ChessGame();
  game1
    .moveWithNotations("e2", "e4")
    .moveWithNotations("d7", "d5")
    .moveWithNotations("e4", "d5")
    .moveWithNotations("e7", "e5");
  it("#1", () => {
    expect(game1.currentPosition.enPassantFile).toBe(game1.currentPosition.board.Coords.fromNotation("e6")!.y);
  });

  it("#2", () => {
    expect(game1.currentPosition.legalMovesAsNotation.includes(`d5-e6`)).toBe(true);
  });
});

describe("Stalemate", () => {
  it("should occur in this position", () => {
    const game = new ChessGame({
      fenString: "5bnr/4p1pq/4Qpkr/7p/7P/4P3/PPPP1PP1/RNB1KBNR b KQ - 2 10"
    });
    expect(game.status).toBe(ChessGame.Statuses.STALEMATE);
  });
});

describe("full games", () => {
  it("The Opera game", () => {
    const game = new ChessGame();

    game
      .moveWithNotations("e2", "e4")
      .moveWithNotations("e7", "e5")
      .moveWithNotations("g1", "f3")
      .moveWithNotations("d7", "d6")
      .moveWithNotations("d2", "d4")
      .moveWithNotations("c8", "g4")
      .moveWithNotations("d4", "e5")
      .moveWithNotations("g4", "f3")
      .moveWithNotations("d1", "f3")
      .moveWithNotations("d6", "e5")
      .moveWithNotations("f1", "c4")
      .moveWithNotations("g8", "f6")
      .moveWithNotations("f3", "b3")
      .moveWithNotations("d8", "e7")
      .moveWithNotations("b1", "c3")
      .moveWithNotations("c7", "c6")
      .moveWithNotations("c1", "g5")
      .moveWithNotations("b7", "b5")
      .moveWithNotations("c3", "b5")
      .moveWithNotations("c6", "b5")
      .moveWithNotations("c4", "b5")
      .moveWithNotations("b8", "d7")
      .moveWithNotations("e1", "c1")
      .moveWithNotations("a8", "d8")
      .moveWithNotations("d1", "d7")
      .moveWithNotations("d8", "d7")
      .moveWithNotations("h1", "d1")
      .moveWithNotations("e7", "e6")
      .moveWithNotations("b5", "d7")
      .moveWithNotations("f6", "d7")
      .moveWithNotations("b3", "b8")
      .moveWithNotations("d7", "b8")
      .moveWithNotations("d1", "d8");

    expect(game.currentPosition.status).toBe(ChessGame.Statuses.CHECKMATE);
  });
});

describe("chess960", () => {
  it("#1", () => {
    const game = ChessGame.getChess960Game();
    game.viewBoard();
    expect(game.currentPosition.board.toString().split("/")[0]).toMatch(/^[pnbrqk]{8}$/);
  });
});