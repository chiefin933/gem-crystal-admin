import React, { useState, useEffect, useCallback } from 'react';
import { fetchUnmatchedPayments, resolveUnmatchedPayment } from '../../api/adminApi';
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const UnmatchedPaymentsManager: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUnmatchedPayments();
      setPayments(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleIgnore = async (id: string) => {
    const note = window.prompt('Reason for ignoring this payment:');
    if (!note) return;
    setResolving(id);
    try {
      await resolveUnmatchedPayment(id, 'IGNORED', note);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve');
    } finally {
      setResolving(null);
    }
  };

  const handleAssign = async (id: string, receipt: string, amount: number) => {
    const targetType = window.prompt('Assign to ORDER, POS_SALE or CHECKOUT_SESSION?')?.toUpperCase() as 'ORDER' | 'POS_SALE' | 'CHECKOUT_SESSION' | null;
    if (!targetType || !['ORDER', 'POS_SALE', 'CHECKOUT_SESSION'].includes(targetType)) return;
    const targetRef = window.prompt(`Enter the ${targetType === 'CHECKOUT_SESSION' ? 'checkout reference (GC-PAY-...)' : targetType === 'ORDER' ? 'order number' : 'receipt number'}:`);
    if (!targetRef) return;
    const note = window.prompt(`Note: assigning M-PESA ${receipt} (KES ${amount}) to ${targetType} ${targetRef}:`, 'Manual assignment by owner');
    if (!note) return;
    setResolving(id);
    try {
      await resolveUnmatchedPayment(id, 'ASSIGNED', note, targetType, targetRef);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to assign');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Unmatched Till Payments
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            C2B Till payments that could not be automatically matched to an order or POS sale.
            Review each one and assign or ignore. — {pagination.total} pending
          </p>
        </div>
        <button onClick={load}
          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">Loading unmatched payments...</div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-emerald-300">All payments matched</p>
          <p className="text-xs text-zinc-500 mt-1">No unmatched Till payments require review.</p>
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-4">Received</th>
                  <th className="p-4">M-PESA Receipt</th>
                  <th className="p-4">Payer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(p.receivedAt).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-300">{p.mpesaReceipt}</td>
                    <td className="p-4 text-zinc-200">{p.payerName ?? '—'}</td>
                    <td className="p-4 font-mono text-zinc-400">{p.phone}</td>
                    <td className="p-4 text-right font-bold text-white">
                      KES {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={resolving === p.id}
                          onClick={() => handleAssign(p.id, p.mpesaReceipt, p.amount)}
                          className="flex items-center gap-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 font-semibold px-2.5 py-1 rounded text-[11px] transition disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Assign
                        </button>
                        <button
                          disabled={resolving === p.id}
                          onClick={() => handleIgnore(p.id)}
                          className="flex items-center gap-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 font-semibold px-2.5 py-1 rounded text-[11px] transition disabled:opacity-40"
                        >
                          <XCircle className="w-3 h-3" />
                          Ignore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Page {page} of {pagination.totalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:bg-zinc-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:bg-zinc-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
