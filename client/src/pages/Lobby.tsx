import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trophy, Swords, Link as LinkIcon, History, User } from "lucide-react";
import { ActiveGames } from "@/components/ActiveGames";

function RecentGamesPreview() {
  const { data: games, isLoading } = trpc.player.getGames.useQuery({ limit: 5 });
  const { data: player } = trpc.player.getProfile.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="text-slate-400 text-center py-4">Loading...</div>;
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        No games played yet. Start your first match!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {games.map((game: any) => {
        const isWhite = game.whitePlayerId === player?.id;
        const result = game.status === "completed" 
          ? (game.result === "draw" 
              ? "Draw" 
              : (game.result === "white_wins" && isWhite) || (game.result === "black_wins" && !isWhite)
                ? "Won"
                : "Lost")
          : "In Progress";
        const resultColor = result === "Won" ? "text-green-400" : result === "Lost" ? "text-red-400" : result === "Draw" ? "text-yellow-400" : "text-blue-400";

        return (
          <div
            key={game.id}
            onClick={() => setLocation(`/game/${game.id}`)}
            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isWhite ? "bg-white" : "bg-slate-900 border border-slate-600"
                }`}></div>
                <span className="text-sm text-slate-300">
                  {isWhite ? "White" : "Black"}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(game.createdAt).toLocaleDateString()}
              </span>
            </div>
            <span className={`text-sm font-medium ${resultColor}`}>
              {result}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Lobby() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [timeControl, setTimeControl] = useState("10+0");
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);

  const { data: player, isLoading: playerLoading, refetch: refetchPlayer } = trpc.player.getOrCreate.useQuery(
    undefined,
    { 
      enabled: !!user,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );

  // Refetch player stats when returning to lobby
  useEffect(() => {
    if (user) {
      refetchPlayer();
    }
  }, [user, refetchPlayer]);

  // Cleanup: leave queue when navigating away or unmounting
  useEffect(() => {
    return () => {
      if (searching) {
        leaveQueue.mutate();
      }
    };
  }, [searching]);

  const { data: leaderboard } = trpc.leaderboard.getTop.useQuery({ limit: 10 });

  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      const inviteLink = `${window.location.origin}/game/${data.gameId}`;
      
      // Copy invite link to clipboard
      navigator.clipboard.writeText(inviteLink).then(() => {
        toast.success(`Game created! Invite link copied to clipboard`);
      }).catch(() => {
        toast.success(`Game created! Share this link: ${inviteLink}`);
      });
      
      setLocation(`/game/${data.gameId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const joinGame = trpc.game.join.useMutation({
    onSuccess: (data) => {
      toast.success("Joined game!");
      setLocation(`/game/${data.gameId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const joinQueue = trpc.matchmaking.join.useMutation({
    onSuccess: (data) => {
      if (data.matched) {
        toast.success("Match found!");
        setSearching(false);
        setLocation(`/game/${data.gameId}`);
      } else {
        // Still searching
        const elapsed = searchStartTime ? Date.now() - searchStartTime : 0;
        
        // Timeout after 30 seconds
        if (elapsed > 30000) {
          setSearching(false);
          setSearchStartTime(null);
          leaveQueue.mutate();
          toast.error("No opponents found. Please try again later.");
          return;
        }
        
        toast.info("Searching for opponent...");
        // Poll for matches every 2 seconds
        setTimeout(() => {
          if (searching) {
            joinQueue.mutate({ timeControl });
          }
        }, 2000);
      }
    },
    onError: (error) => {
      toast.error(error.message);
      setSearching(false);
    },
  });

  const leaveQueue = trpc.matchmaking.leave.useMutation({
    onSuccess: () => {
      toast.info("Cancelled matchmaking");
      setSearching(false);
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!playerLoading && player === null) {
      setLocation("/select-alias");
    }
  }, [player, playerLoading, setLocation]);

  if (loading || playerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const handleQuickPlay = () => {
    setSearching(true);
    setSearchStartTime(Date.now());
    joinQueue.mutate({ timeControl });
  };

  const handleCancelSearch = () => {
    setSearching(false);
    setSearchStartTime(null);
    leaveQueue.mutate();
  };

  const handleCreateGame = () => {
    // Parse time control (format: "10+0" = 10 minutes + 0 increment)
    const [minutes, increment] = timeControl.split("+").map(Number);
    const initialTime = minutes * 60; // Convert to seconds
    
    createGame.mutate({
      timeControl,
      initialTime,
      increment,
    });
  };

  const handleJoinGame = () => {
    if (!inviteCode) {
      toast.error("Please enter an invite code");
      return;
    }
    joinGame.mutate({ inviteCode: inviteCode.toUpperCase() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">In-House Chess Club</h1>
            <p className="text-slate-400">Welcome back, {player.alias}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/profile")}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Stats Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white">{player.rating}</div>
                    <div className="text-sm text-slate-400">Rating</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400">{player.wins}</div>
                    <div className="text-sm text-slate-400">Wins</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-400">{player.losses}</div>
                    <div className="text-sm text-slate-400">Losses</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">{player.draws}</div>
                    <div className="text-sm text-slate-400">Draws</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Play Options */}
            <Tabs defaultValue="play" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                <TabsTrigger value="play">Play</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="play" className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Swords className="h-5 w-5" />
                      Quick Play
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Find an opponent with similar rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Time Control</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "1+0", label: "1 min" },
                          { value: "3+0", label: "3 min" },
                          { value: "5+0", label: "5 min" },
                          { value: "10+0", label: "10 min" },
                          { value: "15+0", label: "15 min" },
                          { value: "30+0", label: "30 min" },
                        ].map((tc) => (
                          <Button
                            key={tc.value}
                            onClick={() => setTimeControl(tc.value)}
                            variant={timeControl === tc.value ? "default" : "outline"}
                            className={timeControl === tc.value ? "bg-blue-600 hover:bg-blue-700" : ""}
                            size="sm"
                          >
                            {tc.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {searching ? (
                      <Button
                        onClick={handleCancelSearch}
                        className="w-full bg-red-600 hover:bg-red-700"
                        size="lg"
                      >
                        Cancel Search
                      </Button>
                    ) : (
                      <Button
                        onClick={handleQuickPlay}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Find Match
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Create Game
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Generate an invite link to share with a friend
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Time Control</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "1+0", label: "1 min" },
                          { value: "3+0", label: "3 min" },
                          { value: "5+0", label: "5 min" },
                          { value: "10+0", label: "10 min" },
                          { value: "15+0", label: "15 min" },
                          { value: "30+0", label: "30 min" },
                        ].map((tc) => (
                          <Button
                            key={tc.value}
                            onClick={() => setTimeControl(tc.value)}
                            variant={timeControl === tc.value ? "default" : "outline"}
                            className={timeControl === tc.value ? "bg-blue-600 hover:bg-blue-700" : ""}
                            size="sm"
                          >
                            {tc.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateGame}
                      className="w-full"
                      variant="outline"
                    >
                      Create Invite Link
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Join Game</CardTitle>
                    <CardDescription className="text-slate-400">
                      Enter an invite code to join a friend's game
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode" className="text-white">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        type="text"
                        placeholder="Enter code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleJoinGame}
                      className="w-full"
                      variant="outline"
                    >
                      Join Game
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Practice Mode</CardTitle>
                    <CardDescription className="text-slate-400">
                      Play both sides to practice moves
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setLocation("/practice")}
                      className="w-full"
                      variant="outline"
                    >
                      Start Practice
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Games
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation("/history")}
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RecentGamesPreview />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Active Games */}
          <div className="space-y-6">
            <ActiveGames />
            
            {/* Leaderboard */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Leaderboard
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Top players by rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((p, index) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold text-slate-400 w-6">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium">{p.alias}</div>
                            <div className="text-sm text-slate-400">
                              {p.wins}W-{p.losses}L-{p.draws}D
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-white">{p.rating}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">
                    No players yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
