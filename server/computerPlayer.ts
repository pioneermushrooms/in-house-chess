import { Chess } from "chess.js";

/**
 * Computer player AI with difficulty levels
 */

// Easy: Random legal move
function getEasyMove(chess: Chess): string {
  const moves = chess.moves();
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}

// Medium: Prefer captures and checks, otherwise random
function getMediumMove(chess: Chess): string {
  const moves = chess.moves({ verbose: true });
  
  // Prioritize captures
  const captures = moves.filter(m => m.captured);
  if (captures.length > 0) {
    const randomCapture = captures[Math.floor(Math.random() * captures.length)];
    return randomCapture.san;
  }
  
  // Check for checks
  const checks = moves.filter(m => {
    chess.move(m.san);
    const isCheck = chess.inCheck();
    chess.undo();
    return isCheck;
  });
  
  if (checks.length > 0 && Math.random() > 0.5) {
    const randomCheck = checks[Math.floor(Math.random() * checks.length)];
    return randomCheck.san;
  }
  
  // Random move
  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  return randomMove.san;
}

// Hard: Minimax with alpha-beta pruning (depth 4)
function getHardMove(chess: Chess): string {
  const depth = 4;
  let bestMove: string | null = null;
  let bestValue = -Infinity;
  const alpha = -Infinity;
  const beta = Infinity;
  
  const moves = chess.moves();
  
  for (const move of moves) {
    chess.move(move);
    const value = -minimax(chess, depth - 1, -beta, -alpha, false);
    chess.undo();
    
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  
  return bestMove || moves[0];
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }
  
  const moves = chess.moves();
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval_ = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval_ = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) {
        break;
      }
    }
    return minEval;
  }
}

// Piece-square tables for positional evaluation
const pawnTable = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const knightTable = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const bishopTable = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const rookTable = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const queenTable = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const kingMiddleGameTable = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

function getPieceSquareValue(piece: any, row: number, col: number): number {
  const index = piece.color === 'w' ? row * 8 + col : (7 - row) * 8 + col;
  
  switch (piece.type) {
    case 'p': return pawnTable[index] / 100;
    case 'n': return knightTable[index] / 100;
    case 'b': return bishopTable[index] / 100;
    case 'r': return rookTable[index] / 100;
    case 'q': return queenTable[index] / 100;
    case 'k': return kingMiddleGameTable[index] / 100;
    default: return 0;
  }
}

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -10000 : 10000;
  }
  
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }
  
  const pieceValues: { [key: string]: number } = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
  };
  
  let score = 0;
  const board = chess.board();
  
  // Material and positional evaluation
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const materialValue = pieceValues[piece.type] || 0;
        const positionalValue = getPieceSquareValue(piece, i, j);
        const totalValue = materialValue + positionalValue;
        score += piece.color === 'w' ? totalValue : -totalValue;
      }
    }
  }
  
  // Mobility bonus (number of legal moves)
  const mobilityWeight = 10;
  const currentTurn = chess.turn();
  const moves = chess.moves().length;
  score += currentTurn === 'w' ? moves * mobilityWeight : -moves * mobilityWeight;
  
  return score;
}

export function getComputerMove(fen: string, difficulty: 'easy' | 'medium' | 'hard'): string {
  const chess = new Chess(fen);
  
  switch (difficulty) {
    case 'easy':
      return getEasyMove(chess);
    case 'medium':
      return getMediumMove(chess);
    case 'hard':
      return getHardMove(chess);
    default:
      return getEasyMove(chess);
  }
}
