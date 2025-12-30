import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);

  const guestLogin = trpc.auth.guestLogin.useMutation({
    onSuccess: () => {
      toast.success("Logged in successfully!");
      // Reload to refresh auth state
      window.location.href = "/select-alias";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Redirect to lobby if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/lobby");
    }
  }, [loading, isAuthenticated, setLocation]);

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    guestLogin.mutate({ username });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white mb-4">
              In-House Chess Club
            </h1>
            <p className="text-xl text-slate-300">
              A private chess club for you and your friends. Play real-time games, track your rating, and compete on the leaderboard.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <Button disabled className="px-8 py-6 text-lg" size="lg">
                <Loader2 className="animate-spin mr-2" />
                Loading...
              </Button>
            ) : !showLoginForm ? (
              <Button
                onClick={() => setShowLoginForm(true)}
                className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                size="lg">
                Get Started
              </Button>
            ) : (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Enter Your Username</CardTitle>
                  <CardDescription>
                    Choose a username to start playing chess
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGuestLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        minLength={3}
                        maxLength={50}
                        required
                        autoFocus
                      />
                      <p className="text-sm text-muted-foreground">
                        3-50 characters
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLoginForm(false)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={guestLogin.isPending}
                      >
                        {guestLogin.isPending ? "Logging in..." : "Continue"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-3xl">♟️</div>
              <div className="text-white font-semibold">Real-Time Games</div>
              <div className="text-sm text-slate-400">
                Play live chess with friends using WebSocket technology
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">📊</div>
              <div className="text-white font-semibold">Elo Ratings</div>
              <div className="text-sm text-slate-400">
                Track your skill with an accurate rating system
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🏆</div>
              <div className="text-white font-semibold">Leaderboard</div>
              <div className="text-sm text-slate-400">
                Compete with your club members for the top spot
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
