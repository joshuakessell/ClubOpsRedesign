'use client';

import { useCallback, useState } from 'react';
import { AuthPanel, type AuthState } from '../components/auth-panel';
import { Nav } from '../components/nav';
import { Button } from '@clubops/ui';
import { captureAgreementBypass, type AgreementDto } from '../../lib/api';

export default function AgreementBypassPage() {
  const [auth, setAuth] = useState<AuthState>({ device: null, staffToken: null });
  const [visitId, setVisitId] = useState('');
  const [result, setResult] = useState<AgreementDto | null>(null);
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
      const response = await captureAgreementBypass(auth.device, auth.staffToken, visitId);
      setResult(response);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Agreement capture failed.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-cyan-50">
      <header className="mx-auto max-w-3xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Agreement Bypass</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Capture a BYPASSED agreement for a visit.
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
                <span className="text-muted-foreground">Visit ID</span>
                <input
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={visitId}
                  onChange={(event) => setVisitId(event.target.value)}
                  placeholder="UUID"
                />
              </label>
              <Button onClick={handleSubmit} disabled={!visitId || status === 'loading'}>
                {status === 'loading' ? 'Submitting…' : 'Capture Bypass'}
              </Button>
            </div>

            <div className="mt-4 text-sm">
              {error && <p className="text-destructive">{error}</p>}
              {result && (
                <pre className="rounded-md bg-muted/60 p-3 text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
