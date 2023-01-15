import Chess960Game from "@chacomat/chess960/Chess960Game.js";

describe("A Chess960 game", () => {
  it("should detect check", () => {
    const game = new Chess960Game({
      fenString: "bbrnknrq/pppppppp/8/8/8/8/PPPPPPPP/BBRNKNRQ w CFcf - 0 1"
    });

    game
      .moveWithNotations("g2", "g4")
      .moveWithNotations("d8", "c6")
      .moveWithNotations("h1", "e4")
      .moveWithNotations("f8", "g6")
      .moveWithNotations("e4", "e7");

    expect(game.currentPosition.isCheck()).toBe(true);
  });

  it("should have correct castling rights", () => {
    const game = Chess960Game.getRandomGame();
    const { castlingRights } = game.currentPosition;

    console.log(game.currentPosition.toString());

    expect(new Set(castlingRights[Chess960Game.Colors.WHITE]).size).toBe(2);
    expect(new Set(castlingRights[Chess960Game.Colors.BLACK]).size).toBe(2);
  });

  // [ ]: fix this
  it("should allow castling", () => {
    const game = new Chess960Game({
      fenString: "k7/8/8/8/8/8/8/2R3KR b CH - 0 1"
    }).moveWithNotations("a8", "b8");
    const legalMoves = game.currentPosition.legalMovesAsNotation;
    console.log(game.currentPosition.board.kings[Chess960Game.Colors.WHITE]);

    expect(legalMoves).toContain("g1-b1");
    expect(legalMoves).toContain("g1-h1");
  });
});