import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE, getAuthHeader } from '../../api/adminApi';
import {
  Tablet,
  CheckCircle2,
  Clock,
  UserCheck,
  CreditCard,
  Smartphone,
  Banknote,
  RefreshCw,
  Receipt,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

const POS_URL = import.meta.env.VITE_POS_URL ?? 'http://localhost:5175';

interface PosSaleRecord {
  id: string;
  receiptNumber: string;
  cashierName: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'MPESA' | 'CARD';
  createdAt: string;
  items: any[];
}

interface PendingAuthRequest {
  id: string;
  cashierName: string;
  deviceId: string;
  location: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const PosMonitoring: React.FC = () => {
  const [sales, setSales] = useState<PosSaleRecord[]>([]);
  const [hardware, setHardware] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingAuthRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, hwRes, pendingRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE}/pos/sales`, { headers: getAuthHeader() }).then((r) => r.json()).then(d => d.data ?? d),
        fetch(`${API_BASE}/pos/hardware`, { headers: getAuthHeader() }).then((r) => r.json()),
        fetch(`${API_BASE}/pos/pending-approvals`, { headers: getAuthHeader() }).then((r) => r.json()),
        fetch(`${API_BASE}/pos/sessions`, { headers: getAuthHeader() }).then((r) => r.json()).then(d => d.sessions ?? []).catch(() => []),
      ]);
      setSales(Array.isArray(salesRes) ? salesRes : []);
      setHardware(hwRes);
      setPendingRequests(Array.isArray(pendingRes) ? pendingRes.filter((r: any) => r.status === 'PENDING') : []);
      setActiveSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
    } catch (err) {
      console.error('Failed to fetch POS monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll every 3 seconds — pending approvals, active sessions, and new sales
    // all update automatically so the owner never has to manually refresh
    const interval = setInterval(loadData, 3_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleApproveAction = async (requestId: string, action: 'APPROVE' | 'REJECT', cashierName: string) => {
    try {
      const res = await fetch(`${API_BASE}/pos/approve-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ requestId, action }),
      });

      if (!res.ok) throw new Error('Failed to process action');

      if (action === 'APPROVE') {
        setActionMessage(`✅ POS Login Approved for ${cashierName}! Terminal on port 5175 has been unlocked.`);
      } else {
        setActionMessage(`❌ POS Login Denied for ${cashierName}. Terminal remains locked.`);
      }

      setTimeout(() => setActionMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Compute POS statistics
  const totalPosRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const mpesaRevenue = sales
    .filter((s) => s.paymentMethod === 'MPESA')
    .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const cashRevenue = sales
    .filter((s) => s.paymentMethod === 'CASH')
    .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const cardRevenue = sales
    .filter((s) => s.paymentMethod === 'CARD')
    .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">POS Terminal Monitoring & Remote Authorization</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Remote cashier login authorization, live boutique sales, and hardware diagnostic oversight (Roysambu Hub)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={POS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-rose-400 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <Tablet className="w-4 h-4" />
            <span>Open POS Terminal</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={loadData}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Sales</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-zinc-900 border border-rose-500/50 text-rose-300 rounded-2xl text-xs font-bold shadow-lg flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* PROMINENT LIVE OWNER REMOTE AUTHORIZATION BANNER */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-gradient-to-r from-rose-950/90 via-zinc-900 to-rose-950/90 border-2 border-rose-600 rounded-3xl p-6 shadow-2xl animate-pulse-subtle flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-lg shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider animate-pulse">
                      ● LIVE LOGIN REQUEST
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-1">
                    Cashier POS Access Authorization Request
                  </h2>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    <strong className="text-white font-bold">{req.cashierName}</strong> is requesting to unlock the POS tablet terminal.
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mt-2">
                    <span className="bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-mono">
                      Device: {req.deviceId}
                    </span>
                    <span className="bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                      Location: {req.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner Action Buttons */}
              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={() => handleApproveAction(req.id, 'REJECT', req.cashierName)}
                  className="px-5 py-3 bg-zinc-950 hover:bg-rose-950 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center space-x-2"
                >
                  <X className="w-4 h-4 text-rose-500" />
                  <span>DENY LOGIN</span>
                </button>

                <button
                  onClick={() => handleApproveAction(req.id, 'APPROVE', req.cashierName)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>ACCEPT LOGIN & UNLOCK POS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POS Session Status — driven by real active sessions from the backend */}
      {activeSessions.length > 0 ? activeSessions.map((session: any) => (
        <div key={session.id} className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-950/80 border border-emerald-800/60 rounded-2xl text-emerald-400 shrink-0">
                <Tablet className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SESSION ACTIVE</span>
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">{session.cashierName}</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Approved by</span>
                <span className="text-white font-bold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{session.approvedBy}</span>
                </span>
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Session started</span>
                <span className="text-zinc-300 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{new Date(session.startTime).toLocaleString()}</span>
                </span>
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3.5 py-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Expires</span>
                <span className="text-zinc-300 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{new Date(session.expiresAt).toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )) : (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 text-center text-xs text-zinc-500">
          No active POS sessions. Terminal is locked.
        </div>
      )}

      {/* POS Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total POS Revenue</span>
            <div className="p-2 bg-rose-950/50 text-rose-400 rounded-xl border border-rose-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">KES {totalPosRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-1">{sales.length} transactions completed</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">M-PESA In-Store</span>
            <div className="p-2 bg-emerald-950/50 text-emerald-400 rounded-xl border border-emerald-800/40">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">KES {mpesaRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Till payment confirmations</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cash Register</span>
            <div className="p-2 bg-amber-950/50 text-amber-400 rounded-xl border border-amber-800/40">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400">KES {cashRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Physical drawer transactions</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Card Terminal</span>
            <div className="p-2 bg-blue-950/50 text-blue-400 rounded-xl border border-blue-800/40">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-400">KES {cardRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-1">PDQ swipe / tap sales</p>
        </div>
      </div>

      {/* POS Transactions Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg space-y-3">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">In-Store Boutique Transaction Log</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{sales.length} receipts recorded</span>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No POS sales recorded yet. In-store cashier transactions from port 5175 will log here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-4">Receipt #</th>
                  <th className="p-4">Cashier</th>
                  <th className="p-4">Items Sold</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-800/40 transition">
                    <td className="p-4 font-mono font-bold text-rose-400">{sale.receiptNumber}</td>
                    <td className="p-4 font-medium text-zinc-200">{sale.cashierName}</td>
                    <td className="p-4 text-zinc-300">
                      <div className="space-y-0.5">
                        {sale.items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-zinc-300">
                            {item.title || 'Product'} ({item.size} / {item.color}) × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        sale.paymentMethod === 'MPESA'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : sale.paymentMethod === 'CASH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">KES {(Number(sale.total) || 0).toLocaleString('en-KE')}</td>
                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
