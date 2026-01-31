'use client';

import { useCallback, useState } from 'react';
import { Button } from '@clubops/ui';
import { AuthPanel, type AuthState } from '../components/auth-panel';
import { Nav } from '../components/nav';
import { fetchWaitlist, type WaitlistStatus } from '../../lib/api';

const STATUSES: Array<WaitlistStatus | 'all'> = ['all', 'OPEN', 'CANCELLED', 'FULFILLED'];

export default function WaitlistPage() {
  const [auth, setAuth] = useState<AuthState>({ device: null, staffToken: null });
  const [status, setStatus] = useState<WaitlistStatus | 'all'>('all');
  const [items, setItems] = useState<
    Array<{ id: string; customerId: string; requestedType: string; status: string }> | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthChange = useCallback((next: AuthState) => {
    setAuth(next);
  }, []);

  const handleLoad = async () => {
    if (!auth.device || !auth.staffToken) {
      setError('Missing device or staff token.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWaitlist(
        auth.device,
        auth.staffToken,
        status === 'all' ? undefined : status
      );
      setItems(response.items);
    } catch (err) {
      setItems(null);
      setError(err instanceof Error ? err.message : 'Failed to load waitlist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="mx-auto max-w-4xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Waitlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">View waitlist entries by status.</p>
        <div className="mt-4">
          <Nav />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="grid gap-6">
          <AuthPanel onChange={handleAuthChange} />

          <section className="rounded-xl border bg-card/90 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Status</span>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as WaitlistStatus | 'all')}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={handleLoad} disabled={loading}>
                {loading ? 'Loading…' : 'Load'}
              </Button>
            </div>

            <div className="mt-4 text-sm">
              {error && <p className="text-destructive">{error}</p>}
              {!error && items && items.length === 0 && (
                <p className="text-muted-foreground">No waitlist entries found.</p>
              )}
              {items && items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="py-2 pr-4 text-foreground">{item.customerId}</td>
                          <td className="py-2 pr-4">{item.requestedType}</td>
                          <td className="py-2 pr-4">{item.status}</td>
                          <td className="py-2 text-muted-foreground">{item.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
