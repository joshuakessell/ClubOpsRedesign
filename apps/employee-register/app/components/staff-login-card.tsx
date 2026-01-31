'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@clubops/ui';
import type { StaffListResponse, StaffLoginResponse } from '../../lib/api';
import { fetchStaffList, loginWithPin } from '../../lib/api';
import type { DeviceAuth } from '@clubops/shared';

export function StaffLoginCard({
  device,
  onAuthenticated,
}: {
  device: DeviceAuth;
  onAuthenticated: (response: StaffLoginResponse) => void;
}) {
  const [staffList, setStaffList] = useState<StaffListResponse['staff']>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setStatus('loading');
      setError(null);
      try {
        const result = await fetchStaffList(device);
        if (!mounted) return;
        setStaffList(result.staff);
        if (result.staff.length > 0) {
          setSelectedIdentifier((current) => current || result.staff[0].identifier);
        }
        setStatus('idle');
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Unable to load staff list.';
        setError(message);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [device]);

  const selectedStaff = useMemo(
    () => staffList.find((staff) => staff.identifier === selectedIdentifier),
    [staffList, selectedIdentifier]
  );

  const handleLogin = async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await loginWithPin(device, selectedIdentifier, pin);
      onAuthenticated(response);
      setStatus('idle');
      setPin('');
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
    }
  };

  return (
    <section className="rounded-2xl border bg-card/90 p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">Staff Login</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a staff member and enter their PIN to start a session.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Staff</span>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedIdentifier}
            onChange={(event) => setSelectedIdentifier(event.target.value)}
            disabled={status === 'loading' || staffList.length === 0}
          >
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.identifier}>
                {staff.name} ({staff.role})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">PIN</span>
          <input
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            type="password"
            placeholder="••••"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={handleLogin} disabled={!selectedIdentifier || !pin || status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Sign In'}
        </Button>
        {selectedStaff && (
          <span className="text-sm text-muted-foreground">
            Signing in as <span className="font-medium text-foreground">{selectedStaff.name}</span>
          </span>
        )}
        {status === 'error' && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </section>
  );
}
