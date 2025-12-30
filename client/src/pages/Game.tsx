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
    socket.emit("join_game", { gameId });

    // Listen for game state
    socket.on("game_state", (data: any) => {
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
      chess.load(data.fen);
      setFen(data.fen);
      setMoveList((prev) => [...prev, data.move]);
      setWhiteTime(data.whiteTimeRemaining);
      setBlackTime(data.blackTimeRemaining);
      setGameStatus(data.status);
      setGameResult(data.result);
      setEndReason(data.endReason);
      setDrawOffered(false);
    });

    // Listen for clock updates
    socket.on("clock_update", (data: any) => {
      setWhiteTime(data.whiteTimeRemaining);
      setBlackTime(data.blackTimeRemaining);
    });

    // Listen for game end
    socket.on("game_ended", (data: any) => {
      setGameStatus("completed");
      setGameResult(data.result);
      setEndReason(data.endReason);
      toast.success(`Game over: ${data.endReason}`);
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

    // Listen for player join events
    socket.on("player_joined", (data: { playerCount: number; bothPlayersPresent: boolean }) => {
      console.log("Player joined:", data);
      if (data.bothPlayersPresent) {
        toast.success("Both players are now in the game!");
      }
    });

    return () => {
      socket.off("game_state");
      socket.off("move_made");
      socket.off("clock_update");
      socket.off("player_joined");
      socket.off("game_ended");
      socket.off("draw_offered");
      socket.off("error");
    };
  }, [socket, connected, gameId, chess, setLocation]);

  const onDrop = ({ piece, sourceSquare, targetSquare }: any) => {
    if (!socket || gameStatus !== "active" || !targetSquare) return false;

    // Check if it's a pawn promotion
    const pieceType = piece.pieceType;
    const isPromotion =
      (pieceType === "wP" && targetSquare[1] === "8") ||
      (pieceType === "bP" && targetSquare[1] === "1");

    socket.emit("make_move", {
      gameId,
      from: sourceSquare,
      to: targetSquare,
      promotion: isPromotion ? "q" : undefined,
    });

    return true;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2 space-y-4">
            {/* Opponent Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                    {isWhite ? "B" : "W"}
                  </div>
                  <div>
                    {isWhite ? (
                      game.blackPlayer ? (
                        <>
                          <div className="text-white font-medium">{game.blackPlayer.alias}</div>
                          <div className="text-sm text-slate-400">Rating: {game.blackPlayer.rating}</div>
                        </>
                      ) : (
                        <div className="text-slate-400 font-medium">Waiting for opponent...</div>
                      )
                    ) : (
                      game.whitePlayer ? (
                        <>
                          <div className="text-white font-medium">{game.whitePlayer.alias}</div>
                          <div className="text-sm text-slate-400">Rating: {game.whitePlayer.rating}</div>
                        </>
                      ) : (
                        <div className="text-slate-400 font-medium">Waiting for opponent...</div>
                      )
                    )}
                  </div>
                </div>
                <div className="text-2xl font-mono text-white">
                  {formatTime(isWhite ? blackTime : whiteTime)}
                </div>
              </CardContent>
            </Card>

            {/* Chess Board */}
            <div className="rounded-lg overflow-hidden shadow-2xl">
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

            {/* Player Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {isWhite ? "W" : "B"}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.alias} (You)</div>
                    <div className="text-sm text-slate-400">Rating: {player.rating}</div>
                  </div>
                </div>
                <div className="text-2xl font-mono text-white">
                  {formatTime(isWhite ? whiteTime : blackTime)}
                </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
