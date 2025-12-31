import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trophy, Clock, Calendar } from "lucide-react";

export default function History() {
  const [limit, setLimit] = useState(10);
  
  const { data: games, isLoading } = trpc.player.getGames.useQuery({ limit });
  const { data: player } = trpc.player.getProfile.useQuery();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: Date | null, end: Date | null) => {
    if (!start || !end) return "N/A";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getGameResult = (game: any) => {
    if (!player) return null;
    
    const isWhite = game.whitePlayerId === player.id;
    const isBlack = game.blackPlayerId === player.id;
    
    if (game.status !== "completed") {
      return { text: "In Progress", color: "text-blue-400" };
    }
    
    if (game.result === "draw") {
      return { text: "Draw", color: "text-yellow-400" };
    }
    
    const won = (game.result === "white_wins" && isWhite) || (game.result === "black_wins" && isBlack);
    
    return {
      text: won ? "Won" : "Lost",
      color: won ? "text-green-400" : "text-red-400",
    };
  };

  const getOpponentInfo = (game: any) => {
    if (!player) return { name: "Unknown", color: "white" };
    
    const isWhite = game.whitePlayerId === player.id;
    return {
      color: isWhite ? "black" : "white",
      playerId: isWhite ? game.blackPlayerId : game.whitePlayerId,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/lobby">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Game History</h1>
              <p className="text-slate-400 mt-1">
                Your recent chess matches
              </p>
            </div>
          </div>
          
          <Select
            value={limit.toString()}
            onValueChange={(value) => setLimit(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Last 10 games</SelectItem>
              <SelectItem value="25">Last 25 games</SelectItem>
              <SelectItem value="50">Last 50 games</SelectItem>
              <SelectItem value="100">Last 100 games</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading game history...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!games || games.length === 0) && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Games Yet</h3>
              <p className="text-slate-400 mb-6">
                Start playing to see your game history here!
              </p>
              <Link href="/lobby">
                <Button>Go to Lobby</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Games List */}
        {!isLoading && games && games.length > 0 && (
          <div className="space-y-4">
            {games.map((game: any) => {
              const result = getGameResult(game);
              const opponent = getOpponentInfo(game);
              
              return (
                <Link key={game.id} href={`/game/${game.id}`}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Game Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                game.whitePlayerId === player?.id ? "bg-white" : "bg-slate-900"
                              } border-2 border-slate-600`}></div>
                              {game.whitePlayerId === player?.id ? (
                                <span className="font-medium">You</span>
                              ) : game.whitePlayer ? (
                                <span
                                  className="font-medium hover:text-blue-400 cursor-pointer underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/profile/${game.whitePlayer.id}`;
                                  }}
                                >
                                  {game.whitePlayer.alias}
                                </span>
                              ) : (
                                <span className="font-medium">Opponent</span>
                              )}
                            </div>
                            <span className="text-slate-500">vs</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                game.blackPlayerId === player?.id ? "bg-white" : "bg-slate-900"
                              } border-2 border-slate-600`}></div>
                              {game.blackPlayerId === player?.id ? (
                                <span className="font-medium">You</span>
                              ) : game.blackPlayer ? (
                                <span
                                  className="font-medium hover:text-blue-400 cursor-pointer underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/profile/${game.blackPlayer.id}`;
                                  }}
                                >
                                  {game.blackPlayer.alias}
                                </span>
                              ) : (
                                <span className="font-medium">Opponent</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(game.createdAt)}
                            </div>
                            {game.startedAt && game.completedAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDuration(game.startedAt, game.completedAt)}
                              </div>
                            )}
                            <div className="text-slate-500">
                              {game.moveList ? JSON.parse(game.moveList).length : 0} moves
                            </div>
                          </div>
                        </div>

                        {/* Result */}
                        {result && (
                          <div className="text-right">
                            <div className={`text-xl font-bold ${result.color}`}>
                              {result.text}
                            </div>
                            {game.endReason && (
                              <div className="text-sm text-slate-500 capitalize">
                                {game.endReason.replace(/_/g, " ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Show More Info */}
        {!isLoading && games && games.length > 0 && games.length === limit && (
          <div className="text-center mt-6 text-slate-400">
            <p>Showing {games.length} games. Use the dropdown above to load more.</p>
          </div>
        )}
      </div>
    </div>
  );
}
