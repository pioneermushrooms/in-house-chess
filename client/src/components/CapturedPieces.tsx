import { Chess } from "chess.js";

interface CapturedPiecesProps {
  fen: string;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_SYMBOLS: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

export function CapturedPieces({ fen }: CapturedPiecesProps) {
  const chess = new Chess(fen);
  
  // Calculate captured pieces
  const allPieces = {
    white: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    black: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  };

  const board = chess.board();
  board.forEach((row) => {
    row.forEach((square) => {
      if (square) {
        const color = square.color === "w" ? "white" : "black";
        const type = square.type;
        if (allPieces[color][type] !== undefined) {
          allPieces[color][type]--;
        }
      }
    });
  });

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];

  // White captured black pieces
  Object.entries(allPieces.black).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      if (type !== "k") capturedByWhite.push(type);
    }
  });

  // Black captured white pieces
  Object.entries(allPieces.white).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      if (type !== "k") capturedByBlack.push(type);
    }
  });

  // Calculate material advantage
  const whiteMaterial = capturedByWhite.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);
  const blackMaterial = capturedByBlack.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);
  const advantage = whiteMaterial - blackMaterial;

  return (
    <div className="space-y-4">
      {/* Captured by White (Black's pieces) */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-slate-400 w-20">White:</div>
        <div className="flex flex-wrap gap-1">
          {capturedByWhite.length > 0 ? (
            capturedByWhite.map((piece, index) => (
              <span key={index} className="text-2xl text-slate-700">
                {PIECE_SYMBOLS[piece]}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-600">-</span>
          )}
        </div>
        {advantage > 0 && (
          <span className="text-sm text-green-400 ml-2">+{advantage}</span>
        )}
      </div>

      {/* Captured by Black (White's pieces) */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-slate-400 w-20">Black:</div>
        <div className="flex flex-wrap gap-1">
          {capturedByBlack.length > 0 ? (
            capturedByBlack.map((piece, index) => (
              <span key={index} className="text-2xl text-slate-200">
                {PIECE_SYMBOLS[piece]}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-600">-</span>
          )}
        </div>
        {advantage < 0 && (
          <span className="text-sm text-green-400 ml-2">+{Math.abs(advantage)}</span>
        )}
      </div>
    </div>
  );
}
