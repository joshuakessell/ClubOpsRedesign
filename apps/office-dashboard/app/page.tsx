'use client';

import { useCallback, useState } from 'react';
import { AuthPanel, type AuthState } from './components/auth-panel';
import { Nav } from './components/nav';

export default function HomePage() {
  const [auth, setAuth] = useState<AuthState>({ device: null, staffToken: null });

  const handleAuthChange = useCallback((next: AuthState) => {
    setAuth(next);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="mx-auto max-w-4xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Office Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Minimal admin screens to exercise inventory, waitlist, and device endpoints.
        </p>
        <div className="mt-4">
          <Nav />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="grid gap-6">
          <AuthPanel onChange={handleAuthChange} />

          <section className="rounded-xl border bg-card/80 p-4 text-sm text-muted-foreground">
            <p>
              Auth ready: <strong>{auth.device && auth.staffToken ? 'Yes' : 'No'}</strong>
            </p>
            <p>Use the navigation above to open admin workflows.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
