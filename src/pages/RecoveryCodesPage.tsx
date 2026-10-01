import React, { useState } from 'react';
import { Check, Copy, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RecoveryCodesPage: React.FC = () => {
  const { recoveryCodes, acknowledgeRecoveryCodes } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold">MFA is now enabled</h1>
            <p className="text-sm text-zinc-400">Save these one-time recovery codes before opening the dashboard.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100 flex gap-3">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          <p>Store the codes in your password manager or another private offline location. Each code works once. They will not be shown again.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {recoveryCodes.map(code => (
            <code key={code} className="rounded-lg bg-zinc-950 px-3 py-2 text-center font-mono tracking-wider text-zinc-200">
              {code}
            </code>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => void copyCodes()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold hover:border-zinc-500">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy recovery codes'}
          </button>
          <button type="button" onClick={acknowledgeRecoveryCodes} className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500">
            I saved them securely
          </button>
        </div>
      </section>
    </main>
  );
};
