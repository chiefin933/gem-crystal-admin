import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs } from '../../api/adminApi';
import { ShieldCheck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = ['ALL', 'LOGIN', 'POS', 'SALES', 'PAYMENTS', 'INVENTORY', 'ORDERS', 'SECURITY'];

const ACTION_COLOR: Record<string, string> = {
  PAYMENT_CONFIRMED:        'bg-emerald-950 text-emerald-300 border-emerald-800/60',
  PAYMENT_FAILED:           'bg-rose-950 text-rose-300 border-rose-800/60',
  PAYMENT_STATUS_OVERRIDDEN:'bg-orange-950 text-orange-300 border-orange-800/60',
  PAYMENT_PENDING:          'bg-amber-950 text-amber-300 border-amber-800/60',
  PAYMENT_REQUIRES_REVIEW:  'bg-yellow-950 text-yellow-300 border-yellow-800/60',
  POS_LOGIN_APPROVED:       'bg-emerald-950 text-emerald-300 border-emerald-800/60',
  POS_LOGIN_DENIED:         'bg-rose-950 text-rose-300 border-rose-800/60',
  POS_LOGIN_REQUESTED:      'bg-blue-950 text-blue-300 border-blue-800/60',
  POS_LOGOUT:               'bg-zinc-800 text-zinc-300 border-zinc-700',
  SALE_CREATED:             'bg-teal-950 text-teal-300 border-teal-800/60',
  INVENTORY_ADJUSTED:       'bg-purple-950 text-purple-300 border-purple-800/60',
  ORDER_STATUS_UPDATED:     'bg-sky-950 text-sky-300 border-sky-800/60',
};

function actionBadge(action: string) {
  const cls = ACTION_COLOR[action] ?? 'bg-zinc-900 text-zinc-400 border-zinc-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${cls}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

function tryParseDetails(raw: string) {
  try {
    const obj = JSON.parse(raw);
    return JSON.stringify(obj, null, 2);
  } catch {
    return raw;
  }
}

export const AuditLogManager: React.FC = () => {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs(page, LIMIT, category);
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when category changes
  const handleCategory = (c: string) => { setCategory(c); setPage(1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
            Owner Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete record of every sensitive operation across the system — {pagination.total.toLocaleString()} entries
          </p>
        </div>
        <button
          onClick={load}
          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => handleCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              category === c
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">No audit records found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3 whitespace-nowrap">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="hover:bg-zinc-800/40 transition cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="p-3 font-mono text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="p-3">{actionBadge(log.action)}</td>
                      <td className="p-3 text-zinc-200 font-medium max-w-[140px] truncate">{log.actor}</td>
                      <td className="p-3 font-mono text-zinc-500">{log.ipAddress ?? '—'}</td>
                      <td className="p-3 text-zinc-400 max-w-xs truncate">{log.details}</td>
                    </tr>
                    {expanded === log.id && (
                      <tr className="bg-zinc-950">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-[10px] text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                            {tryParseDetails(log.details)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            Page {page} of {pagination.totalPages} — {pagination.total.toLocaleString()} total records
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:bg-zinc-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-30 hover:bg-zinc-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
