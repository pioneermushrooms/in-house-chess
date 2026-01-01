import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Clock, Users } from "lucide-react";

export function ActiveGames() {
  const [, setLocation] = useLocation();
  const { data: activeGames, isLoading } = trpc.game.getActive.useQuery();

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!activeGames || activeGames.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">No active games</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Games ({activeGames.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeGames.map((game: any) => {
          const moveCount = game.moveList ? JSON.parse(game.moveList).length : 0;
          const isWaiting = !game.blackPlayerId;
          
          return (
            <div
              key={game.id}
              className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              onClick={() => setLocation(`/game/${game.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {game.whitePlayer ? (
                    <span
                      className="text-white font-medium text-sm hover:text-blue-400 cursor-pointer underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/profile/${game.whitePlayer.id}`);
                      }}
                    >
                      {game.whitePlayer.alias}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">Waiting...</span>
                  )}
                  <span className="text-slate-400">vs</span>
                  {game.blackPlayer ? (
                    <span
                      className="text-white font-medium text-sm hover:text-blue-400 cursor-pointer underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/profile/${game.blackPlayer.id}`);
                      }}
                    >
                      {game.blackPlayer.alias}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">Waiting...</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {game.stakeAmount > 0 && (
                    <Badge className="text-xs bg-yellow-600 hover:bg-yellow-700 border-yellow-500">
                      💰 {game.stakeAmount}
                    </Badge>
                  )}
                  {isWaiting && (
                    <Badge variant="outline" className="text-xs">
                      Waiting
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {game.timeControl}
                </div>
                <div>{moveCount} moves</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
