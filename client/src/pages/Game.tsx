import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js";
import { useSocket } from "@/hooks/useSocket";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Flag, HandshakeIcon, RotateCcw } from "lucide-react";
import { chessSounds } from "@/lib/sounds";
import { CapturedPieces } from "@/components/CapturedPieces";

export default function Game() {
  const [, params] = useRoute("/game/:gameId");
  const gameId = params?.gameId ? parseInt(params.gameId) : null;
  const [, setLocation] = useLocation();

  const { socket, connected } = useSocket();
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moveList, setMoveList] = useState<string[]>([]);
  const [whiteTime, setWhiteTime] = useState(600000); // 10 minutes in ms
  const [blackTime, setBlackTime] = useState(600000);
  const [gameStatus, setGameStatus] = useState<string>("active");
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    playerId: number;
    playerAlias: string;
    message: string;
    timestamp: string;
  }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null); // null = live position
  const [reviewChess] = useState(new Chess()); // Separate chess instance for review
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  const { data: game, isLoading } = trpc.game.getById.useQuery(
    { gameId: gameId! },
    { enabled: !!gameId }
  );

  const { data: player } = trpc.player.getOrCreate.useQuery();

  useEffect(() => {
    if (!gameId) {
      setLocation("/lobby");
      return;
    }

    if (!socket || !connected) return;

    // Join the game room
    console.log(`[Client] Joining game ${gameId}`);
    socket.emit("join_game", { gameId });

    // Listen for game state
    socket.on("game_state", (data: any) => {
      console.log("[Client] Received game_state:", data);
      chess.load(data.fen);
      setFen(data.fen);
      setMoveList(data.moveList || []);
      setWhiteTime(data.whiteTimeRemaining || 600000);
      setBlackTime(data.blackTimeRemaining || 600000);
      setGameStatus(data.status);
      setGameResult(data.result);
      setEndReason(data.endReason);
    });

    // Listen for moves
    socket.on("move_made", (data: any) => {
      console.log("[Client] Received move_made:", data);
      chess.load(data.fen);
      setFen(data.fen);
      setMoveList((prev) => [...prev, data.move]);
      setWhiteTime(data.whiteTimeRemaining);
      setBlackTime(data.blackTimeRemaining);
      setGameStatus(data.status);
      setGameResult(data.result);
      setEndReason(data.endReason);
      setDrawOffered(false);
      setViewingMoveIndex(null); // Return to live position when new move is made
      
      // Play sound effects
      if (data.move.includes("x")) {
        chessSounds.capture();
      } else {
        chessSounds.move();
      }
      
      if (chess.isCheck()) {
        chessSounds.check();
      }
    });

    // Listen for clock updates
    socket.on("clock_update", (data: any) => {
      // Only update clocks if we're viewing the live position
      if (viewingMoveIndex === null) {
        setWhiteTime(data.whiteTimeRemaining);
        setBlackTime(data.blackTimeRemaining);
      }
    });

    // Listen for game end
    socket.on("game_ended", (data: any) => {
      setGameStatus("completed");
      setGameResult(data.result);
      setEndReason(data.endReason);
      toast.success(`Game over: ${data.endReason}`);
      chessSounds.gameEnd();
    });

    // Listen for draw offers
    socket.on("draw_offered", () => {
      setDrawOffered(true);
      toast.info("Your opponent offered a draw");
    });

    // Listen for errors
    socket.on("error", (data: any) => {
      const errorMessage = typeof data === 'string' ? data : (data?.message || JSON.stringify(data));
      console.error("Socket error:", data);
      toast.error(`Error: ${errorMessage}`);
    });
    
    // Listen for player joined
    socket.on("player_joined", (data: any) => {
      console.log("[Client] Received player_joined:", data);
      if (data.bothPlayersPresent) {
        toast.success("Both players are now in the game!");
      }
    });

    // Listen for chat messages
    socket.on("chat_message", (data: any) => {
      setChatMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("game_state");
      socket.off("move_made");
      socket.off("clock_update");
      socket.off("player_joined");
      socket.off("game_ended");
      socket.off("draw_offered");
      socket.off("chat_message");
      socket.off("error");
    };
  }, [socket, connected, gameId, setLocation]); // chess is intentionally excluded - it's a stable ref

  // Keyboard shortcuts for move navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (moveList.length === 0) return;
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPreviousMove();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNextMove();
          break;
        case "Home":
          e.preventDefault();
          goToFirstMove();
          break;
        case "End":
          e.preventDefault();
          goToLatestMove();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveList, viewingMoveIndex]);

  const onDrop = ({ sourceSquare, targetSquare, piece }: any) => {
    console.log(`[Client] onDrop called: ${sourceSquare} -> ${targetSquare}, piece:`, piece);
    console.log(`[Client] Socket connected: ${!!socket}, Game status: ${gameStatus}`);
    
    // Allow moves if socket is connected, game is not completed, and not in review mode
    const canMove = socket && gameStatus !== "completed" && gameStatus !== "abandoned" && targetSquare && viewingMoveIndex === null;
    
    if (!canMove) {
      console.log(`[Client] Move rejected - socket: ${!!socket}, status: ${gameStatus}, target: ${targetSquare}`);
      return false;
    }
    // Check if it's a pawn promotion
    const pieceType = piece;
    const isPromotion =
      (pieceType === "wP" && targetSquare[1] === "8") ||
      (pieceType === "bP" && targetSquare[1] === "1");

    if (isPromotion) {
      // Show promotion dialog
      setPromotionMove({ from: sourceSquare, to: targetSquare });
      return true;
    }

    console.log(`[Client] Emitting make_move:`, {
      gameId,
      from: sourceSquare,
      to: targetSquare,
    });
    
    socket.emit("make_move", {
      gameId,
      from: sourceSquare,
      to: targetSquare,
    });

    return true;
  };

  const handlePromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!socket || !promotionMove) return;
    
    console.log(`[Client] Emitting make_move with promotion:`, {
      gameId,
      from: promotionMove.from,
      to: promotionMove.to,
      promotion: piece,
    });
    
    socket.emit("make_move", {
      gameId,
      from: promotionMove.from,
      to: promotionMove.to,
      promotion: piece,
    });
    
    setPromotionMove(null);
  };

  const handleResign = () => {
    if (!socket) return;
    socket.emit("resign", { gameId });
  };

  const handleOfferDraw = () => {
    if (!socket) return;
    socket.emit("offer_draw", { gameId });
    toast.success("Draw offer sent");
  };

  const handleAcceptDraw = () => {
    if (!socket) return;
    socket.emit("accept_draw", { gameId });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !chatInput.trim()) return;
    socket.emit("chat_message", { gameId, message: chatInput });
    setChatInput("");
  };

  // Move navigation functions
  const goToMove = (moveIndex: number | null) => {
    if (moveIndex === null) {
      // Return to live position
      setFen(chess.fen());
      setViewingMoveIndex(null);
    } else {
      // Navigate to specific move
      reviewChess.reset();
      for (let i = 0; i <= moveIndex; i++) {
        // Reconstruct position from move list
        const moveNotation = moveList[i];
        try {
          reviewChess.move(moveNotation);
        } catch (e) {
          console.error("Error replaying move:", moveNotation, e);
        }
      }
      setFen(reviewChess.fen());
      setViewingMoveIndex(moveIndex);
    }
  };

  const goToFirstMove = () => goToMove(-1); // Show starting position
  const goToPreviousMove = () => {
    if (viewingMoveIndex === null) {
      goToMove(moveList.length - 1);
    } else if (viewingMoveIndex >= 0) {
      goToMove(viewingMoveIndex - 1);
    }
  };
  const goToNextMove = () => {
    if (viewingMoveIndex === null) return;
    if (viewingMoveIndex < moveList.length - 1) {
      goToMove(viewingMoveIndex + 1);
    } else {
      goToMove(null); // Return to live
    }
  };
  const goToLatestMove = () => goToMove(null);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading || !game || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  const isWhite = game.whitePlayerId === player.id;
  const isBlack = game.blackPlayerId === player.id;
  const boardOrientation = isWhite ? "white" : "black";
  
  console.log(`[Client] Player assignment - Player ID: ${player.id}, White ID: ${game.whitePlayerId}, Black ID: ${game.blackPlayerId}`);
  console.log(`[Client] You are playing as: ${isWhite ? 'WHITE' : isBlack ? 'BLACK' : 'SPECTATOR'}`);
  console.log(`[Client] Board orientation: ${boardOrientation}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board and Timers */}
          <div className="lg:col-span-2">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Chess Board */}
              <div className="flex-1">
                <div className="rounded-lg overflow-hidden shadow-2xl" style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
                  <Chessboard
                    options={{
                      id: "game-board",
                      position: fen,
                      onPieceDrop: onDrop,
                      boardOrientation: boardOrientation as "white" | "black",
                      boardStyle: {
                        borderRadius: "0.5rem",
                      },
                      darkSquareStyle: { backgroundColor: "#779952" },
                      lightSquareStyle: { backgroundColor: "#edeed1" },
                    }}
                  />
                </div>
              </div>

              {/* Timers Sidebar */}
              <div className="flex flex-row lg:flex-col gap-4 lg:w-48">
                {/* Opponent Timer */}
                <Card className="flex-1 bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                        {isWhite ? "B" : "W"}
                      </div>
                      <div className="flex-1">
                        {isWhite ? (
                          game.blackPlayer ? (
                            <>
                              <div
                                className="text-white font-medium text-sm hover:text-blue-400 cursor-pointer underline"
                                onClick={() => setLocation(`/profile/${game.blackPlayer?.id}`)}
                              >
                                {game.blackPlayer.alias}
                              </div>
                              <div className="text-xs text-slate-400">Rating: {game.blackPlayer.rating}</div>
                            </>
                          ) : (
                            <div className="text-slate-400 font-medium text-sm">Waiting...</div>
                          )
                        ) : (
                          game.whitePlayer ? (
                            <>
                              <div
                                className="text-white font-medium text-sm hover:text-blue-400 cursor-pointer underline"
                                onClick={() => setLocation(`/profile/${game.whitePlayer?.id}`)}
                              >
                                {game.whitePlayer.alias}
                              </div>
                              <div className="text-xs text-slate-400">Rating: {game.whitePlayer.rating}</div>
                            </>
                          ) : (
                            <div className="text-slate-400 font-medium text-sm">Waiting...</div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-mono text-white text-center">
                      {formatTime(isWhite ? blackTime : whiteTime)}
                    </div>
                  </CardContent>
                </Card>

                {/* Player Timer */}
                <Card className="flex-1 bg-slate-800/50 border-slate-700 ring-2 ring-blue-500/50">
                  <CardContent className="p-4 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isWhite ? 'bg-white text-black' : 'bg-black'}`}>
                        {isWhite ? "♔" : "♚"}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{player.alias}</div>
                        <div className="text-xs text-slate-400">
                          {isWhite ? 'White' : 'Black'} • {player.rating}
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-mono text-white text-center">
                      {formatTime(isWhite ? whiteTime : blackTime)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Captured Pieces */}
            <Card className="bg-slate-800/50 border-slate-700 mt-4">
              <CardContent className="p-4">
                <CapturedPieces fen={fen} />
              </CardContent>
            </Card>

            {/* Game Controls */}
            {gameStatus === "active" && (
              <div className="flex gap-3">
                <Button
                  onClick={handleResign}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Resign
                </Button>
                {drawOffered ? (
                  <Button
                    onClick={handleAcceptDraw}
                    variant="default"
                    className="flex-1 gap-2"
                  >
                    <HandshakeIcon className="h-4 w-4" />
                    Accept Draw
                  </Button>
                ) : (
                  <Button
                    onClick={handleOfferDraw}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <HandshakeIcon className="h-4 w-4" />
                    Offer Draw
                  </Button>
                )}
              </div>
            )}

            {/* Game Result */}
            {gameStatus === "completed" && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Game Over</h3>
                  <p className="text-slate-300 mb-4">
                    Result: {gameResult?.replace("_", " ")} - {endReason}
                  </p>
                  <Button onClick={() => setLocation("/lobby")}>
                    Return to Lobby
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Move List & Info */}
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Game Info</h3>
                  <Badge variant="outline">{game.timeControl}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-white capitalize">{gameStatus}</span>
                  </div>
                  {game.inviteCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invite Code:</span>
                      <span className="text-white font-mono">{game.inviteCode}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-4">Move History</h3>
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {moveList.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">
                      No moves yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {moveList.map((move, index) => (
                        <div
                          key={index}
                          className="text-sm text-white bg-slate-900/50 p-2 rounded"
                        >
                          {Math.floor(index / 2) + 1}.{index % 2 === 0 ? "" : ".."} {move}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Move Navigation Controls */}
                {moveList.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {viewingMoveIndex === null
                          ? `Live (Move ${moveList.length})`
                          : viewingMoveIndex === -1
                          ? "Start Position"
                          : `Move ${viewingMoveIndex + 1} of ${moveList.length}`}
                      </span>
                      {viewingMoveIndex !== null && (
                        <span className="text-yellow-400">Review Mode</span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={goToFirstMove}
                        disabled={viewingMoveIndex === -1}
                        className="text-xs"
                      >
                        ⏮
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={goToPreviousMove}
                        disabled={viewingMoveIndex === -1}
                        className="text-xs"
                      >
                        ◀
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={goToNextMove}
                        disabled={viewingMoveIndex === null}
                        className="text-xs"
                      >
                        ▶
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={goToLatestMove}
                        disabled={viewingMoveIndex === null}
                        className="text-xs"
                      >
                        ⏭
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-4">Chat</h3>
                <div className="flex flex-col h-80">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {chatMessages.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">
                        No messages yet
                      </p>
                    ) : (
                      chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-sm ${
                            msg.playerId === player?.id
                              ? "bg-blue-900/30 ml-8"
                              : "bg-slate-900/50 mr-8"
                          }`}
                        >
                          <div className="font-semibold text-blue-400 text-xs mb-1">
                            {msg.playerAlias}
                          </div>
                          <div className="text-white">{msg.message}</div>
                          <div className="text-slate-500 text-xs mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      maxLength={500}
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <Button type="submit" size="sm" disabled={!chatInput.trim()}>
                      Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Promotion Dialog */}
      {promotionMove && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <CardContent>
              <h3 className="text-white text-xl font-bold mb-4 text-center">Choose Promotion</h3>
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => handlePromotion('q')}
                  className="w-20 h-20 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-4xl transition-colors"
                >
                  ♕
                </button>
                <button
                  onClick={() => handlePromotion('r')}
                  className="w-20 h-20 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-4xl transition-colors"
                >
                  ♖
                </button>
                <button
                  onClick={() => handlePromotion('b')}
                  className="w-20 h-20 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-4xl transition-colors"
                >
                  ♗
                </button>
                <button
                  onClick={() => handlePromotion('n')}
                  className="w-20 h-20 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-4xl transition-colors"
                >
                  ♘
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
