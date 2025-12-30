import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { chessSounds } from "@/lib/sounds";

export default function Practice() {
  const [, setLocation] = useLocation();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moveList, setMoveList] = useState<string[]>([]);

  const onDrop = ({ sourceSquare, targetSquare }: any) => {
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to queen for simplicity
      });

      if (move) {
        setFen(chess.fen());
        setMoveList((prev) => [...prev, move.san]);

        // Play sound
        if (move.captured) {
          chessSounds.capture();
        } else {
          chessSounds.move();
        }

        if (chess.isCheck()) {
          chessSounds.check();
        }

        if (chess.isGameOver()) {
          chessSounds.gameEnd();
        }

        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  };

  const resetBoard = () => {
    chess.reset();
    setFen(chess.fen());
    setMoveList([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/lobby")}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Practice Mode</h1>
              <p className="text-slate-400">Play both sides to test moves</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={resetBoard}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Board
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="max-w-2xl mx-auto">
                <Chessboard
                  options={{
                    id: "practice-board",
                    position: fen,
                    onPieceDrop: onDrop,
                    boardOrientation: "white",
                    boardStyle: {
                      borderRadius: "0.5rem",
                    },
                    darkSquareStyle: { backgroundColor: "#779952" },
                    lightSquareStyle: { backgroundColor: "#edeed1" },
                  }}
                />
              </div>

              {/* Game Status */}
              <div className="mt-6 text-center">
                {chess.isCheckmate() && (
                  <div className="text-2xl font-bold text-red-400">
                    Checkmate! {chess.turn() === "w" ? "Black" : "White"} wins
                  </div>
                )}
                {chess.isStalemate() && (
                  <div className="text-2xl font-bold text-yellow-400">Stalemate - Draw</div>
                )}
                {chess.isDraw() && !chess.isStalemate() && (
                  <div className="text-2xl font-bold text-yellow-400">Draw</div>
                )}
                {!chess.isGameOver() && (
                  <div className="text-xl text-slate-300">
                    {chess.turn() === "w" ? "White" : "Black"} to move
                    {chess.isCheck() && <span className="text-red-400 ml-2">(Check!)</span>}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Move List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 p-6 h-full">
              <h2 className="text-xl font-bold text-white mb-4">Move History</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {moveList.length === 0 ? (
                  <p className="text-slate-400 text-sm">No moves yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {moveList.map((move, index) => (
                      <div
                        key={index}
                        className={`text-sm px-3 py-2 rounded ${
                          index % 2 === 0
                            ? "bg-slate-700 text-white"
                            : "bg-slate-600 text-white"
                        }`}
                      >
                        <span className="font-mono">
                          {Math.floor(index / 2) + 1}
                          {index % 2 === 0 ? "." : "..."} {move}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Board Info */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="text-sm text-slate-400 space-y-2">
                  <div>Total moves: {moveList.length}</div>
                  <div>Current FEN:</div>
                  <div className="font-mono text-xs break-all text-slate-500">{fen}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
