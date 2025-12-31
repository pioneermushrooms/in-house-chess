import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Pencil, Eraser, Trash2 } from "lucide-react";

export default function Profile() {
  const { playerId } = useParams<{ playerId: string }>();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);

  const { data: player, isLoading } = trpc.player.getById.useQuery(
    { playerId: parseInt(playerId || "0") },
    { enabled: !!playerId }
  );

  const { data: canvasData } = trpc.player.getCanvasData.useQuery(
    { playerId: parseInt(playerId || "0") },
    { enabled: !!playerId }
  );

  const saveCanvas = trpc.player.saveCanvasData.useMutation();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load saved canvas data
    if (canvasData?.data) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasData.data;
    }
  }, [canvasData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      // Save canvas data
      const dataUrl = canvas.toDataURL();
      saveCanvas.mutate({
        playerId: parseInt(playerId || "0"),
        data: dataUrl,
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    }

    if (e.type === "mousedown") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save cleared canvas
    const dataUrl = canvas.toDataURL();
    saveCanvas.mutate({
      playerId: parseInt(playerId || "0"),
      data: dataUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">Player not found</div>
      </div>
    );
  }

  const winRate = player.gamesPlayed > 0 
    ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/lobby")}
            className="text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">{player.alias}'s Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Column */}
          <div className="space-y-6">
            {/* Rating Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-blue-400">{player.rating}</div>
              </CardContent>
            </Card>

            {/* Record Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Wins</span>
                  <span className="text-2xl font-bold text-green-400">{player.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Losses</span>
                  <span className="text-2xl font-bold text-red-400">{player.losses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Draws</span>
                  <span className="text-2xl font-bold text-yellow-400">{player.draws}</span>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Games</span>
                    <span className="text-xl font-bold text-white">{player.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-400">Win Rate</span>
                    <span className="text-xl font-bold text-white">{winRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas Column */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Wall</span>
                  <div className="flex gap-2">
                    <Button
                      variant={tool === "pen" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTool("pen")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={tool === "eraser" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTool("eraser")}
                    >
                      <Eraser className="h-4 w-4" />
                    </Button>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded border-2 border-slate-600 cursor-pointer"
                      disabled={tool === "eraser"}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearCanvas}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full border-2 border-slate-600 rounded cursor-crosshair bg-white"
                  style={{ touchAction: "none" }}
                />
                <p className="text-slate-400 text-sm mt-2">
                  Draw or leave a note on {player.alias}'s wall!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
