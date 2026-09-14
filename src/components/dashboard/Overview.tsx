import React, { useEffect, useState, useCallback } from 'react';
import { fetchAdminStats } from '../../api/adminApi';
import { ShoppingBag, Package, TrendingUp, AlertTriangle, Smartphone, Banknote, Ticket, Store, RefreshCw, CalendarDays, Clock3, History } from 'lucide-react';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchAdminStats();
      setStats(res);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Live figures could not be refreshed. Retry when the API is available.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Poll every 10 seconds so the owner sees live KPIs without manual refresh
  useEffect(() => {
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading Store KPI Analytics...
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Active Products',
      value: stats?.totalProducts ?? 0,
      icon: ShoppingBag,
      color: 'from-rose-600 to-pink-600',
      sub: 'Visible in Live Storefront',
    },
    {
      title: 'Total Online Orders',
      value: stats?.totalOrders ?? 0,
      icon: Package,
      color: 'from-amber-500 to-orange-600',
      sub: `${stats?.pendingOrders ?? 0} Pending Fulfilment`,
    },
    {
      title: 'Total Business Revenue',
      value: `KES ${Math.round(stats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      sub: `Online KES ${Math.round(stats?.ecomRevenue ?? 0).toLocaleString()} · POS KES ${Math.round(stats?.posRevenue ?? 0).toLocaleString()}`,
    },
    {
      title: 'Active Coupons',
      value: stats?.activeCoupons ?? 0,
      icon: Ticket,
      color: 'from-purple-600 to-indigo-600',
      sub: 'Active Promotional Codes',
    },
  ];

  const salesPeriods = stats?.salesPeriods?.periods ?? [];
  const formatKes = (amount: number) => `KES ${Math.round(amount).toLocaleString('en-KE')}`;
  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Store Analytics & Operational Overview</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live business metrics from the central database — ecommerce + in-store POS combined
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={load}
            className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            API Online
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 border border-rose-900/80 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
          <span>{error}</span>
          <button onClick={load} className="shrink-0 font-bold text-rose-100 underline underline-offset-4">Retry</button>
        </div>
      )}

      <section aria-labelledby="sales-periods-title" className="border border-zinc-800 bg-zinc-900/55 p-5 shadow-lg">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-rose-900/70 bg-rose-950/50 p-2 text-rose-300">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="sales-periods-title" className="text-base font-bold text-white">Sales periods</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Completed website and cashier-confirmed POS sales only.
              </p>
            </div>
          </div>
          <span className="w-fit border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Business time · {stats?.salesPeriods?.timeZone ?? 'Africa/Nairobi'}
          </span>
        </div>

        {salesPeriods.length === 0 ? (
          <div className="flex items-center gap-3 border border-dashed border-zinc-700 bg-zinc-950/40 p-5 text-xs text-zinc-400">
            <CalendarDays className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden="true" />
            <div>
              <p className="font-semibold text-zinc-200">Sales-period data is not available yet.</p>
              <p className="mt-1">Refresh after the API is available; an unavailable report is never shown as KES 0.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {salesPeriods.map((period: any) => {
              const Icon = period.key === 'today' ? Clock3 : period.key === 'yesterday' ? History : CalendarDays;
              const isToday = period.key === 'today';
              return (
                <article key={period.key} className={`border p-4 transition-colors ${isToday ? 'border-rose-800/80 bg-rose-950/20' : 'border-zinc-800 bg-zinc-950/35 hover:border-zinc-700'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">{period.label}</p>
                    <div className={`rounded-lg p-2 ${isToday ? 'bg-rose-900/50 text-rose-300' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-5 text-2xl font-black tabular-nums text-white">{formatKes(period.revenue)}</p>
                  <p className="mt-1 text-xs text-zinc-400">{period.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-800 pt-3 text-[11px] text-zinc-400">
                    <span>{period.transactions} completed {period.transactions === 1 ? 'transaction' : 'transactions'}</span>
                    {isToday && Number(period.revenue) === 0 && <span className="font-semibold text-zinc-300">New day reset</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{kpi.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${kpi.color} text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">{kpi.value}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Breakdown — full business picture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* M-PESA — combined */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              M-PESA Collections
            </h2>
            <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              All Channels
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            KES {Math.round(stats?.mpesaRevenue ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
            <div className="flex justify-between">
              <span>Online Till / M-PESA</span>
              <span className="text-zinc-300">KES {Math.round(stats?.ecomMpesaRevenue ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>POS M-PESA</span>
              <span className="text-zinc-300">KES {Math.round(stats?.posMpesaRevenue ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Cash — POS only */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              Cash Collections
            </h2>
            <span className="text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
              POS Only
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            KES {Math.round(stats?.cashRevenue ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">Physical cash drawer transactions at Roysambu hub.</p>
        </div>

        {/* Card — coming soon */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg opacity-60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-zinc-500" />
              Card Payments
            </h2>
            <span className="text-[10px] font-semibold bg-zinc-950 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="text-2xl font-black text-zinc-500">KES 0</div>
          <p className="text-[11px] text-zinc-600 mt-2">Card gateway not yet integrated. No card payments are currently accepted.</p>
        </div>
      </div>

      {/* Sales by Day — last 14 days */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white mb-4">Sales Revenue — Last 14 Days</h2>
        {!stats?.salesByDay?.length ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No sales data yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {stats.salesByDay.map((d: any) => {
              const maxRev = Math.max(...stats.salesByDay.map((x: any) => x.revenue), 1);
              const pct = Math.round((d.revenue / maxRev) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-rose-600/80 hover:bg-rose-500 rounded-t transition-all"
                      style={{ height: `${Math.max(pct, 2)}%`, minHeight: d.revenue > 0 ? '4px' : '2px' }}
                      title={`${d.date}: KES ${d.revenue.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-600 rotate-45 origin-left hidden sm:block">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top & Slow Moving Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3">🔥 Fast Moving (30 days)</h2>
          {!stats?.topProducts?.length ? (
            <p className="text-xs text-zinc-500">No sales data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 truncate max-w-[60%]">{p.title}</span>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <span>{p.units} units</span>
                    <span className="text-emerald-400 font-bold">KES {p.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3">🐢 Slow Moving (30 days)</h2>
          {!stats?.slowProducts?.length ? (
            <p className="text-xs text-zinc-500">No sales data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.slowProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 truncate max-w-[60%]">{p.title}</span>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <span>{p.units} units</span>
                    <span className="text-amber-400 font-bold">KES {p.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Low Stock Inventory Alerts (≤ 5 units)</h2>
          </div>
          <span className="text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-full">
            {stats?.lowStockVariants?.length ?? 0} Item Variants
          </span>
        </div>

        {!stats?.lowStockVariants || stats.lowStockVariants.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">All product variants have healthy stock levels.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Size / Color</th>
                  <th className="p-3 text-right">Qty Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {stats.lowStockVariants.map((item: any) => (
                  <tr key={item.variantId} className="hover:bg-zinc-800/40">
                    <td className="p-3 font-semibold text-zinc-200">{item.productTitle}</td>
                    <td className="p-3 text-zinc-400">{item.productCategory}</td>
                    <td className="p-3 font-mono text-zinc-400">{item.sku}</td>
                    <td className="p-3 text-zinc-300">{item.size} / {item.color}</td>
                    <td className="p-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                        item.stockQuantity === 0
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        {item.stockQuantity} units
                      </span>
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
