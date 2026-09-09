"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy, ArrowRightLeft, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

function fmt(n) {
  if (n == null) return "₦0.00";
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

export default function ReferralsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [stats, setStats] = useState(null);
  const [transferAmount, setTransferAmount] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/user/referral");
      setStats(res.data.data?.referral || null);
    } catch {
      toast.error("Failed to load referral stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const copyCode = () => {
    if (!stats?.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode).then(() => {
      toast.success("Referral code copied!");
    });
  };

  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (stats && amt > stats.refWallet) return toast.error("Insufficient referral balance");

    setTransferring(true);
    try {
      await api.post("/user/referral/transfer", { amount: amt });
      toast.success("Transfer successful!");
      setTransferAmount("");
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Users className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats?.referralCount || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Referrals</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{fmt(stats?.totalEarned || 0)}</div>
            <div className="text-sm text-gray-500 mt-1">Total Earned</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{fmt(stats?.refWallet || 0)}</div>
            <div className="text-sm text-gray-500 mt-1">Balance</div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Your Referral Code</h2>
          <p className="text-sm text-gray-500 mb-4">
            Share your phone number with friends. When they register and fund their wallet, you earn {stats?.bonusPercent || 0}% of their first deposit.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
              <span className="text-xl font-bold text-indigo-600 tracking-wider">{stats?.referralCode || "N/A"}</span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>

        {/* Transfer to Main Balance */}
        {stats?.refWallet > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Transfer to Main Balance</h2>
            <p className="text-sm text-gray-500 mb-4">Move your referral earnings to your main wallet.</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                onClick={handleTransfer}
                disabled={!transferAmount || transferring}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4" />
                {transferring ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </div>
        )}

        {/* Recent Referrals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Referrals</h2>
          {stats?.recentReferrals?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recentReferrals.map((ref, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-600">
                      {(ref.firstname || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{ref.firstname} {ref.lastname}</div>
                    <div className="text-xs text-gray-500">{new Date(ref.regDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{fmt(ref.wallet || 0)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No referrals yet. Share your code!</p>
          )}
        </div>
      </div>
    </div>
  );
}
