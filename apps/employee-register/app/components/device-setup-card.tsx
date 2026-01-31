'use client';

import { useState } from 'react';
import { Button } from '@clubops/ui';
import type { DeviceDto } from '../../lib/api';
import { fetchDeviceMe } from '../../lib/api';
import type { DeviceAuth } from '@clubops/shared';

export function DeviceSetupCard({
  onSuccess,
}: {
  onSuccess: (auth: DeviceAuth, device: DeviceDto) => void;
}) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus('loading');
    setError(null);
    try {
      const device = await fetchDeviceMe({ deviceId, deviceToken });
      setStatus('success');
      onSuccess({ deviceId, deviceToken }, device);
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Unable to validate device.';
      setError(message);
    }
  };

  return (
    <section className="rounded-2xl border bg-card/90 p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 1</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">Device Setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the provisioned device credentials to validate this register.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Device ID</span>
          <input
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="UUID"
            value={deviceId}
            onChange={(event) => setDeviceId(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Device Token</span>
          <input
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Token"
            value={deviceToken}
            onChange={(event) => setDeviceToken(event.target.value)}
            type="password"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={handleSubmit} disabled={!deviceId || !deviceToken || status === 'loading'}>
          {status === 'loading' ? 'Validating…' : 'Save & Test'}
        </Button>
        {status === 'success' && (
          <span className="text-sm text-emerald-600">Device validated.</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </section>
  );
}
