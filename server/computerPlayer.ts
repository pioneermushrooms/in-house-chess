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

// Hard: Minimax with alpha-beta pruning (depth 3)
function getHardMove(chess: Chess): string {
  const depth = 3;
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

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -10000 : 10000;
  }
  
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }
  
  const pieceValues: { [key: string]: number } = {
    'p': 1,
    'n': 3,
    'b': 3,
    'r': 5,
    'q': 9,
    'k': 0
  };
  
  let score = 0;
  const board = chess.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = pieceValues[piece.type] || 0;
        score += piece.color === 'w' ? value : -value;
      }
    }
  }
  
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
