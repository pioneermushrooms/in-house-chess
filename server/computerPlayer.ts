import { Chess } from "chess.js";

/**
 * Computer player AI with difficulty levels
 * Significantly improved with deeper search, move ordering, and better evaluation
 */

// Easy: Random legal move
function getEasyMove(chess: Chess): string {
  const moves = chess.moves();
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}

// Medium: Minimax depth 3 with basic evaluation
function getMediumMove(chess: Chess): string {
  const depth = 3;
  let bestMove: string | null = null;
  let bestValue = -Infinity;
  
  const moves = orderMoves(chess);
  
  for (const move of moves) {
    chess.move(move);
    const value = -minimax(chess, depth - 1, -Infinity, Infinity, false);
    chess.undo();
    
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  
  return bestMove || moves[0];
}

// Hard: Minimax depth 5 with alpha-beta pruning, move ordering, and quiescence search
function getHardMove(chess: Chess): string {
  const depth = 5;
  let bestMove: string | null = null;
  let bestValue = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;
  
  const moves = orderMoves(chess);
  
  for (const move of moves) {
    chess.move(move);
    const value = -alphaBeta(chess, depth - 1, -beta, -alpha, false);
    chess.undo();
    
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
    alpha = Math.max(alpha, value);
  }
  
  return bestMove || moves[0];
}

// Order moves to search most promising first (better alpha-beta pruning)
function orderMoves(chess: Chess): string[] {
  const moves = chess.moves({ verbose: true });
  
  // Score each move
  const scoredMoves = moves.map(move => {
    let score = 0;
    
    // Prioritize captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
    if (move.captured) {
      const victimValue = getPieceValue(move.captured);
      const attackerValue = getPieceValue(move.piece);
      score += 10 * victimValue - attackerValue;
    }
    
    // Prioritize checks
    chess.move(move.san);
    if (chess.inCheck()) {
      score += 50;
    }
    chess.undo();
    
    // Prioritize promotions
    if (move.promotion) {
      score += 900;
    }
    
    // Prioritize center control
    const to = move.to;
    if (['d4', 'd5', 'e4', 'e5'].includes(to)) {
      score += 20;
    } else if (['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'].includes(to)) {
      score += 10;
    }
    
    return { move: move.san, score };
  });
  
  // Sort by score descending
  scoredMoves.sort((a, b) => b.score - a.score);
  
  return scoredMoves.map(m => m.move);
}

function getPieceValue(piece: string): number {
  const values: { [key: string]: number } = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
  };
  return values[piece] || 0;
}

// Basic minimax for medium difficulty
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

// Advanced alpha-beta with quiescence search for hard difficulty
function alphaBeta(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  if (depth === 0) {
    return quiescence(chess, alpha, beta, isMaximizing);
  }
  
  if (chess.isGameOver()) {
    return evaluatePosition(chess);
  }
  
  const moves = orderMoves(chess);
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval_ = alphaBeta(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const eval_ = alphaBeta(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }
    return minEval;
  }
}

// Quiescence search: extend search for tactical sequences (captures, checks)
function quiescence(chess: Chess, alpha: number, beta: number, isMaximizing: boolean): number {
  const standPat = evaluatePosition(chess);
  
  if (isMaximizing) {
    if (standPat >= beta) {
      return beta;
    }
    if (alpha < standPat) {
      alpha = standPat;
    }
  } else {
    if (standPat <= alpha) {
      return alpha;
    }
    if (beta > standPat) {
      beta = standPat;
    }
  }
  
  // Only search captures and checks
  const moves = chess.moves({ verbose: true }).filter(m => m.captured || isCheck(chess, m.san));
  
  if (moves.length === 0) {
    return standPat;
  }
  
  for (const move of moves) {
    chess.move(move.san);
    const score = quiescence(chess, alpha, beta, !isMaximizing);
    chess.undo();
    
    if (isMaximizing) {
      if (score >= beta) {
        return beta;
      }
      if (score > alpha) {
        alpha = score;
      }
    } else {
      if (score <= alpha) {
        return alpha;
      }
      if (score < beta) {
        beta = score;
      }
    }
  }
  
  return isMaximizing ? alpha : beta;
}

function isCheck(chess: Chess, move: string): boolean {
  chess.move(move);
  const check = chess.inCheck();
  chess.undo();
  return check;
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
    case 'p': return pawnTable[index];
    case 'n': return knightTable[index];
    case 'b': return bishopTable[index];
    case 'r': return rookTable[index];
    case 'q': return queenTable[index];
    case 'k': return kingMiddleGameTable[index];
    default: return 0;
  }
}

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -20000 : 20000;
  }
  
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
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
  
  // Bishop pair bonus
  const whiteBishops = countPieces(board, 'b', 'w');
  const blackBishops = countPieces(board, 'b', 'b');
  if (whiteBishops >= 2) score += 50;
  if (blackBishops >= 2) score -= 50;
  
  // Doubled pawns penalty
  score -= countDoubledPawns(board, 'w') * 10;
  score += countDoubledPawns(board, 'b') * 10;
  
  // Isolated pawns penalty
  score -= countIsolatedPawns(board, 'w') * 15;
  score += countIsolatedPawns(board, 'b') * 15;
  
  return score;
}

function countPieces(board: any[][], type: string, color: string): number {
  let count = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type === type && piece.color === color) {
        count++;
      }
    }
  }
  return count;
}

function countDoubledPawns(board: any[][], color: string): number {
  let doubled = 0;
  for (let col = 0; col < 8; col++) {
    let pawnsInCol = 0;
    for (let row = 0; row < 8; row++) {
      const piece = board[row][col];
      if (piece && piece.type === 'p' && piece.color === color) {
        pawnsInCol++;
      }
    }
    if (pawnsInCol > 1) {
      doubled += pawnsInCol - 1;
    }
  }
  return doubled;
}

function countIsolatedPawns(board: any[][], color: string): number {
  let isolated = 0;
  for (let col = 0; col < 8; col++) {
    let hasPawn = false;
    for (let row = 0; row < 8; row++) {
      const piece = board[row][col];
      if (piece && piece.type === 'p' && piece.color === color) {
        hasPawn = true;
        break;
      }
    }
    
    if (hasPawn) {
      // Check adjacent columns
      let hasNeighbor = false;
      for (const adjCol of [col - 1, col + 1]) {
        if (adjCol >= 0 && adjCol < 8) {
          for (let row = 0; row < 8; row++) {
            const piece = board[row][adjCol];
            if (piece && piece.type === 'p' && piece.color === color) {
              hasNeighbor = true;
              break;
            }
          }
        }
        if (hasNeighbor) break;
      }
      
      if (!hasNeighbor) {
        isolated++;
      }
    }
  }
  return isolated;
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
