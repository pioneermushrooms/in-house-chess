import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, TrendingUp, TrendingDown } from "lucide-react";

export default function Transactions() {
  const { data: transactions, isLoading } = trpc.player.getTransactions.useQuery({ limit: 50 });
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

  const getTransactionDetails = (transaction: any) => {
    const isPositive = transaction.amount > 0;
    
    const typeLabels: Record<string, string> = {
      purchase: "Credit Purchase",
      admin_add: "Admin Credit Add",
      admin_remove: "Admin Credit Removal",
      game_win: "Game Win",
      game_loss: "Game Loss",
      game_refund: "Game Refund",
      wager_locked: "Wager Locked",
      wager_returned: "Wager Returned",
    };

    const typeColors: Record<string, string> = {
      purchase: "bg-blue-600",
      admin_add: "bg-purple-600",
      admin_remove: "bg-red-600",
      game_win: "bg-green-600",
      game_loss: "bg-red-600",
      game_refund: "bg-yellow-600",
      wager_locked: "bg-orange-600",
      wager_returned: "bg-yellow-600",
    };

    return {
      label: typeLabels[transaction.type] || transaction.type,
      color: typeColors[transaction.type] || "bg-slate-600",
      isPositive,
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
              <h1 className="text-3xl font-bold">Transaction History</h1>
              <p className="text-slate-400 mt-1">
                All credit movements and transactions
              </p>
            </div>
          </div>
          
          {player && (
            <div className="text-right">
              <div className="text-sm text-slate-400">Current Balance</div>
              <div className="text-2xl font-bold text-green-400">
                {player.accountBalance} credits
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">Loading transactions...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!transactions || transactions.length === 0) && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Receipt className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-slate-400 mb-6">
                Purchase credits or play games to see your transaction history!
              </p>
              <Link href="/lobby">
                <Button>Go to Lobby</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        {!isLoading && transactions && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((transaction: any) => {
              const details = getTransactionDetails(transaction);
              
              return (
                <Card
                  key={transaction.id}
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Transaction Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-full ${details.color} flex items-center justify-center`}>
                          {details.isPositive ? (
                            <TrendingUp className="h-5 w-5 text-white" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{details.label}</span>
                            {transaction.gameId && (
                              <Link href={`/game/${transaction.gameId}`}>
                                <Badge variant="outline" className="text-xs hover:bg-slate-700 cursor-pointer">
                                  Game #{transaction.gameId}
                                </Badge>
                              </Link>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{formatDate(transaction.createdAt)}</span>
                            {transaction.description && (
                              <span className="text-slate-500">• {transaction.description}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount and Balance */}
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          details.isPositive ? "text-green-400" : "text-red-400"
                        }`}>
                          {details.isPositive ? "+" : ""}{transaction.amount}
                        </div>
                        <div className="text-xs text-slate-500">
                          Balance: {transaction.balanceAfter}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        {!isLoading && transactions && transactions.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing {transactions.length} most recent transactions
          </div>
        )}
      </div>
    </div>
  );
}
