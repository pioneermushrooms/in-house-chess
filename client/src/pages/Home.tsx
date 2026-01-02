import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to lobby if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/lobby");
    }
  }, [loading, isAuthenticated, setLocation]);

  const handleLogin = () => {
    // Use Google OAuth for Railway, Manus OAuth for Manus preview
    const isManusPreview = window.location.hostname.includes('manus.computer');
    if (isManusPreview) {
      window.location.href = getLoginUrl();
    } else {
      // Use legacy Google OAuth
      window.location.href = '/api/oauth/google/login';
    }
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
              A private chess club for you and your friends. Play real-time games, track your rating, wager credits, and compete on the leaderboard.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <Button disabled className="px-8 py-6 text-lg" size="lg">
                <Loader2 className="animate-spin mr-2" />
                Loading...
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                size="lg">
                Join the Club
              </Button>
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
              <div className="text-3xl">💰</div>
              <div className="text-white font-semibold">Credit Wagering</div>
              <div className="text-sm text-slate-400">
                Purchase credits and wager them on games for real stakes
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🏆</div>
              <div className="text-white font-semibold">Elo Ratings</div>
              <div className="text-sm text-slate-400">
                Track your skill with an accurate rating system
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
