import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CREDIT_PACKAGES, formatPrice, getTotalCredits } from "@shared/creditPackages";
import { CreditCard, ArrowLeft, Sparkles } from "lucide-react";

export default function BuyCredits() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);

  const createCheckout = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to secure checkout...");
        window.open(data.url, '_blank');
      }
      setLoading(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setLoading(null);
    },
  });

  const handlePurchase = (packageId: string) => {
    setLoading(packageId);
    createCheckout.mutate({ packageId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/lobby")}
            className="mb-4 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lobby
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Buy Credits</h1>
          <p className="text-slate-400">
            Purchase credits to wager on chess games with your friends
          </p>
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKAGES.map((pkg) => {
            const totalCredits = getTotalCredits(pkg);
            const isLoading = loading === pkg.id;

            return (
              <Card
                key={pkg.id}
                className={`relative bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-all ${
                  pkg.popular ? "ring-2 ring-blue-500 scale-105" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {pkg.name}
                    </h3>
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {formatPrice(pkg.priceUsd)}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {pkg.credits} credits
                      {pkg.bonus > 0 && (
                        <span className="text-green-400 font-semibold">
                          {" "}+ {pkg.bonus} bonus
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total Credits:</span>
                      <span className="text-white font-semibold">
                        {totalCredits}
                      </span>
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Bonus:</span>
                        <span className="text-green-400 font-semibold">
                          +{Math.round((pkg.bonus / pkg.credits) * 100)}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Per Credit:</span>
                      <span className="text-white">
                        {formatPrice(Math.round(pkg.priceUsd / totalCredits))}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isLoading}
                    className={`w-full ${
                      pkg.popular
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              How Credits Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-blue-400 font-semibold mb-2">
                  💰 Purchase Credits
                </div>
                <p className="text-slate-400">
                  Buy credits securely with your credit card through Stripe
                </p>
              </div>
              <div>
                <div className="text-blue-400 font-semibold mb-2">
                  ♟️ Wager on Games
                </div>
                <p className="text-slate-400">
                  Set stakes when creating games to compete for credits
                </p>
              </div>
              <div>
                <div className="text-blue-400 font-semibold mb-2">
                  🏆 Win & Earn
                </div>
                <p className="text-slate-400">
                  Winner takes the pot! Draws return stakes to both players
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>
            Secure payments powered by{" "}
            <span className="text-blue-400 font-semibold">Stripe</span>
          </p>
          <p className="mt-2">
            All transactions are encrypted and secure. We never store your card
            details.
          </p>
        </div>
      </div>
    </div>
  );
}
