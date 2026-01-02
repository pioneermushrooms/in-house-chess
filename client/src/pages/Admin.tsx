import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Shield, Users, DollarSign, Activity, Filter } from "lucide-react";

function CashoutManagement() {
  const utils = trpc.useUtils();
  const { data: pendingCashouts, isLoading: loadingPending } = trpc.admin.getPendingCashouts.useQuery();
  const { data: allCashouts, isLoading: loadingAll } = trpc.admin.getAllCashouts.useQuery({ limit: 50 });
  const [selectedCashout, setSelectedCashout] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [showAll, setShowAll] = useState(false);

  const completeCashout = trpc.admin.completeCashout.useMutation({
    onSuccess: () => {
      toast.success('Cashout marked as completed!');
      setSelectedCashout(null);
      setNotes("");
      utils.admin.getPendingCashouts.invalidate();
      utils.admin.getAllCashouts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const failCashout = trpc.admin.failCashout.useMutation({
    onSuccess: () => {
      toast.success('Cashout failed and credits refunded!');
      setSelectedCashout(null);
      setNotes("");
      utils.admin.getPendingCashouts.invalidate();
      utils.admin.getAllCashouts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cashouts = showAll ? allCashouts : pendingCashouts;
  const isLoading = showAll ? loadingAll : loadingPending;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cashout Requests</CardTitle>
            <CardDescription>
              {showAll ? 'All cashout requests' : 'Pending cashout requests requiring processing'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Pending Only' : 'Show All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-400 text-sm">Loading cashouts...</p>
        ) : cashouts && cashouts.length > 0 ? (
          <div className="space-y-3 max-h-[700px] overflow-y-auto">
            {cashouts.map((cashout: any) => (
              <div
                key={cashout.id}
                className={`p-4 rounded-lg border ${
                  cashout.status === 'pending'
                    ? 'bg-yellow-900/20 border-yellow-700/50'
                    : cashout.status === 'completed'
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white text-lg">
                        {cashout.player?.alias || `Player #${cashout.playerId}`}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        cashout.status === 'pending'
                          ? 'bg-yellow-600 text-yellow-100'
                          : cashout.status === 'completed'
                          ? 'bg-green-600 text-green-100'
                          : 'bg-red-600 text-red-100'
                      }`}>
                        {cashout.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-400 text-xl">
                          ${cashout.usdAmount} USD
                        </span>
                        <span className="text-slate-400">({cashout.amount} credits)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Payout:</span>
                        <span className="font-medium">
                          {cashout.payoutMethodType.charAt(0).toUpperCase() + cashout.payoutMethodType.slice(1)}
                        </span>
                        <span className="text-blue-400">{cashout.payoutMethod}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Requested: {new Date(cashout.createdAt).toLocaleString()}
                      </div>
                      {cashout.completedAt && (
                        <div className="text-xs text-slate-500">
                          Processed: {new Date(cashout.completedAt).toLocaleString()} by {cashout.completedBy}
                        </div>
                      )}
                      {cashout.notes && (
                        <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-700/50 rounded">
                          <span className="font-medium">Notes:</span> {cashout.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  {cashout.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedCashout(cashout)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Process
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">
            {showAll ? 'No cashout requests yet' : 'No pending cashout requests'}
          </p>
        )}
      </CardContent>

      {/* Process Cashout Dialog */}
      <Dialog open={!!selectedCashout} onOpenChange={(open) => !open && setSelectedCashout(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Process Cashout Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send ${selectedCashout?.usdAmount} to {selectedCashout?.player?.alias} via {selectedCashout?.payoutMethodType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
              <p className="text-blue-400 text-sm font-medium mb-2">Payment Details</p>
              <div className="text-sm text-slate-300 space-y-1">
                <div><span className="text-slate-400">Method:</span> {selectedCashout?.payoutMethodType}</div>
                <div><span className="text-slate-400">Account:</span> {selectedCashout?.payoutMethod}</div>
                <div><span className="text-slate-400">Amount:</span> ${selectedCashout?.usdAmount} USD</div>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Transaction ID, confirmation details, etc."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  completeCashout.mutate({
                    cashoutId: selectedCashout.id,
                    notes: notes || undefined,
                  });
                }}
                disabled={completeCashout.isPending || failCashout.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {completeCashout.isPending ? 'Processing...' : 'Mark as Completed'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!notes || notes.length < 5) {
                    toast.error('Please provide a reason for failure (minimum 5 characters)');
                    return;
                  }
                  failCashout.mutate({
                    cashoutId: selectedCashout.id,
                    notes,
                  });
                }}
                disabled={completeCashout.isPending || failCashout.isPending}
              >
                {failCashout.isPending ? 'Processing...' : 'Fail & Refund'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TransactionHistory() {
  const [filterType, setFilterType] = useState<string>('');
  const { data: transactions, isLoading } = trpc.admin.getAllTransactions.useQuery({
    limit: 200,
    type: filterType || undefined,
  });
  const { data: players } = trpc.admin.getAllPlayers.useQuery();

  const getPlayerAlias = (playerId: number) => {
    return players?.find(p => p.id === playerId)?.alias || `Player #${playerId}`;
  };

  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'admin_adjustment', label: 'Admin Adjustment' },
    { value: 'wager_locked', label: 'Wager Locked' },
    { value: 'game_win', label: 'Game Win' },
    { value: 'game_loss', label: 'Game Loss' },
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All credit transactions across the system</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white rounded px-3 py-1.5 text-sm"
            >
              {transactionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-400 text-sm">Loading transactions...</p>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-2 max-h-[700px] overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-slate-700/50 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">
                      {getPlayerAlias(tx.playerId)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-600 rounded">
                      {tx.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`font-bold text-lg ${
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
                {tx.description && (
                  <p className="text-xs text-slate-400 mb-1">{tx.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                  <span>Balance after: {tx.balanceAfter}</span>
                </div>
                {tx.gameId && (
                  <span className="text-xs text-blue-400">Game #{tx.gameId}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No transactions found</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'transactions' | 'cashouts'>('players');

  const { data: isAdmin, isLoading: checkingAdmin } = trpc.admin.isAdmin.useQuery();
  const { data: players, isLoading: loadingPlayers } = trpc.admin.getAllPlayers.useQuery(
    undefined,
    { enabled: isAdmin === true }
  );
  const { data: adminActions } = trpc.admin.getAdminActions.useQuery(
    { limit: 20 },
    { enabled: isAdmin === true }
  );

  const adjustCredits = trpc.admin.adjustCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`Credits adjusted successfully. ${data.remainingToday} admin actions remaining today.`);
      setIsAdjustModalOpen(false);
      setSelectedPlayer(null);
      setAdjustAmount("");
      setAdjustReason("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
        <p className="text-slate-400">Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p className="text-slate-400 mb-6">
              You do not have permission to access the admin panel.
            </p>
            <Button onClick={() => setLocation("/lobby")}>
              Return to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCredits = players?.reduce((sum, p) => sum + p.accountBalance, 0) || 0;
  const totalGames = players?.reduce((sum, p) => sum + p.gamesPlayed, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/lobby">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-red-500" />
                Admin Panel
              </h1>
              <p className="text-slate-400 mt-1">
                Manage players and system settings
              </p>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Total Players</p>
                  <p className="text-2xl font-bold">{players?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm text-slate-400">Total Credits</p>
                  <p className="text-2xl font-bold">{totalCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-400">Total Games</p>
                  <p className="text-2xl font-bold">{totalGames}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'players' ? 'default' : 'outline'}
            onClick={() => setActiveTab('players')}
          >
            Players & Actions
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transactions')}
          >
            Transaction History
          </Button>
          <Button
            variant={activeTab === 'cashouts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cashouts')}
          >
            Cashout Requests
          </Button>
        </div>

        {activeTab === 'players' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>All Players</CardTitle>
              <CardDescription>Manage player credits and view stats</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlayers ? (
                <p className="text-slate-400 text-sm">Loading players...</p>
              ) : players && players.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{player.alias}</div>
                          <div className="text-xs text-slate-400 space-x-3">
                            <span>Rating: {player.rating}</span>
                            <span>Games: {player.gamesPlayed}</span>
                            <span className="text-green-400">Balance: {player.accountBalance}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPlayer(player);
                            setIsAdjustModalOpen(true);
                          }}
                          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          Adjust Credits
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No players found</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Action Log */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Recent Admin Actions</CardTitle>
              <CardDescription>Audit log of all admin operations</CardDescription>
            </CardHeader>
            <CardContent>
              {adminActions && adminActions.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {adminActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-3 bg-slate-700/50 rounded-lg text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white capitalize">
                          {action.actionType.replace('_', ' ')}
                        </span>
                        {action.amount && (
                          <span className={`font-bold ${action.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {action.amount > 0 ? '+' : ''}{action.amount}
                          </span>
                        )}
                      </div>
                      {action.reason && (
                        <p className="text-xs text-slate-400 mb-1">{action.reason}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        {new Date(action.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No admin actions yet</p>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {activeTab === 'transactions' && (
          <TransactionHistory />
        )}

        {activeTab === 'cashouts' && (
          <CashoutManagement />
        )}
      </div>

      {/* Adjust Credits Modal */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Adjust Credits for {selectedPlayer?.alias}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add or remove credits. Maximum ±$5 (±500 credits) per transaction. 10 transactions per day limit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="adjust-amount">Amount (credits)</Label>
              <Input
                id="adjust-amount"
                type="number"
                min="-500"
                max="500"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter amount (-500 to +500)"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Current balance: {selectedPlayer?.accountBalance} credits
              </p>
            </div>
            <div>
              <Label htmlFor="adjust-reason">Reason (required)</Label>
              <Input
                id="adjust-reason"
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Enter reason for adjustment"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
              <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ Security Limits</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Maximum ±$5.00 (±500 credits) per transaction</li>
                <li>• Maximum 10 admin transactions per day</li>
                <li>• All actions are logged for audit</li>
                <li>• Cannot adjust your own balance</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const amount = parseInt(adjustAmount);
                  if (isNaN(amount) || amount < -500 || amount > 500 || amount === 0) {
                    toast.error('Please enter a valid amount between -500 and +500 (not zero)');
                    return;
                  }
                  if (!adjustReason || adjustReason.length < 5) {
                    toast.error('Please provide a reason (minimum 5 characters)');
                    return;
                  }
                  adjustCredits.mutate({
                    playerId: selectedPlayer.id,
                    amount,
                    reason: adjustReason,
                  });
                }}
                disabled={adjustCredits.isPending}
                className="flex-1"
              >
                {adjustCredits.isPending ? 'Processing...' : 'Confirm Adjustment'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  setSelectedPlayer(null);
                  setAdjustAmount("");
                  setAdjustReason("");
                }}
                disabled={adjustCredits.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
