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

export default function Lobby() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");

  const { data: player, isLoading: playerLoading } = trpc.player.getOrCreate.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: leaderboard } = trpc.leaderboard.getTop.useQuery({ limit: 10 });

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

  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Game created! Invite code: ${data.inviteCode}`);
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

  const handleQuickPlay = () => {
    toast.info("Matchmaking feature coming soon");
  };

  const handleCreateGame = () => {
    // Create a 10+0 game (10 minutes, no increment)
    createGame.mutate({
      timeControl: "10+0",
      initialTime: 600,
      increment: 0,
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
                  <CardContent>
                    <Button
                      onClick={handleQuickPlay}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Find Match
                    </Button>
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
                  <CardContent>
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
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Recent Games
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-center py-8">
                      No games played yet. Start your first match!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Leaderboard */}
          <div>
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
