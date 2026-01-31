'use client';

import { useCallback, useState } from 'react';
import { AuthPanel, type AuthState } from '../components/auth-panel';
import { Nav } from '../components/nav';
import { Button } from '@clubops/ui';
import { fetchActiveVisit, type VisitNullableResponse } from '../../lib/api';

export default function VisitStatusPage() {
  const [auth, setAuth] = useState<AuthState>({ device: null, staffToken: null });
  const [customerId, setCustomerId] = useState('');
  const [result, setResult] = useState<VisitNullableResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  const handleAuthChange = useCallback((next: AuthState) => {
    setAuth(next);
  }, []);

  const handleSubmit = async () => {
    if (!auth.device || !auth.staffToken) {
      setError('Missing device or staff token.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const response = await fetchActiveVisit(auth.device, auth.staffToken, customerId);
      setResult(response);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Visit lookup failed.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-cyan-50">
      <header className="mx-auto max-w-3xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Visit Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Look up the active visit for a customer.
        </p>
        <div className="mt-4">
          <Nav />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-10">
        <div className="grid gap-6">
          <AuthPanel onChange={handleAuthChange} />

          <section className="rounded-xl border bg-card/90 p-4">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Customer ID</span>
                <input
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="UUID"
                />
              </label>
              <Button onClick={handleSubmit} disabled={!customerId || status === 'loading'}>
                {status === 'loading' ? 'Checking…' : 'Check Visit'}
              </Button>
            </div>

            <div className="mt-4 text-sm">
              {error && <p className="text-destructive">{error}</p>}
              {!error && result && result.visit === null && (
                <p className="text-muted-foreground">No active visit for this customer.</p>
              )}
              {result && result.visit && (
                <pre className="rounded-md bg-muted/60 p-3 text-xs">
                  {JSON.stringify(result.visit, null, 2)}
                </pre>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
