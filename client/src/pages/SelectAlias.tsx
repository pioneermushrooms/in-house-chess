import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SelectAlias() {
  const [alias, setAlias] = useState("");
  const [, setLocation] = useLocation();
  const createPlayer = trpc.player.create.useMutation({
    onSuccess: () => {
      toast.success("Player profile created!");
      setLocation("/lobby");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alias.length < 3) {
      toast.error("Alias must be at least 3 characters");
      return;
    }
    createPlayer.mutate({ alias });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Choose Your Alias</CardTitle>
          <CardDescription>
            Pick a unique username for the chess club. This will be visible to other players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                type="text"
                placeholder="Enter your alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                minLength={3}
                maxLength={64}
                required
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                3-64 characters, must be unique
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createPlayer.isPending}
            >
              {createPlayer.isPending ? "Creating..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
