'use client';

import { useEffect, useState } from 'react';
import { Button } from '@clubops/ui';
import type { StaffSessionDto } from '../../lib/api';
import { fetchMe } from '../../lib/api';
import type { DeviceAuth } from '@clubops/shared';

export function MeCard({
  device,
  staffToken,
  session,
  onRefresh,
  onSignOut,
}: {
  device: DeviceAuth;
  staffToken: string;
  session: StaffSessionDto | null;
  onRefresh: (session: StaffSessionDto) => void;
  onSignOut: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setStatus('loading');
      setError(null);
      try {
        const data = await fetchMe(device, staffToken);
        if (!mounted) return;
        onRefresh(data);
        setStatus('idle');
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Unable to load session.';
        setError(message);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [device, staffToken, onRefresh]);

  const handleRefresh = async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchMe(device, staffToken);
      onRefresh(data);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Unable to load session.';
      setError(message);
    }
  };

  return (
    <section className="rounded-2xl border bg-card/90 p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 3</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Validate the current staff session and refresh it on demand.
        </p>
      </div>

      <div className="mt-6 rounded-xl border bg-background p-4 text-sm">
        {session ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Staff ID</dt>
              <dd className="mt-1 font-medium text-foreground">{session.staffId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Role</dt>
              <dd className="mt-1 font-medium text-foreground">{session.role}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Device</dt>
              <dd className="mt-1 font-medium text-foreground">{session.deviceId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Expires</dt>
              <dd className="mt-1 font-medium text-foreground">{session.expiresAt}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">No session loaded yet.</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={handleRefresh} disabled={status === 'loading'}>
          {status === 'loading' ? 'Refreshing…' : 'Refresh Session'}
        </Button>
        <Button variant="secondary" onClick={onSignOut}>
          Clear Session
        </Button>
        {status === 'error' && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </section>
  );
}
