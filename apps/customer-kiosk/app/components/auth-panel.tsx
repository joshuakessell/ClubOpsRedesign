'use client';

import { useEffect, useState } from 'react';
import { Button } from '@clubops/ui';
import {
  clearDeviceAuth,
  clearStaffToken,
  loadDeviceAuth,
  loadStaffToken,
  saveDeviceAuth,
  saveStaffToken,
  type DeviceAuth,
} from '@clubops/shared';

export type AuthState = {
  device: DeviceAuth | null;
  staffToken: string | null;
};

export function AuthPanel({ onChange }: { onChange: (state: AuthState) => void }) {
  const [deviceId, setDeviceId] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [staffToken, setStaffToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    const device = loadDeviceAuth();
    const storedToken = loadStaffToken();
    if (device) {
      setDeviceId(device.deviceId);
      setDeviceToken(device.deviceToken);
    }
    if (storedToken) {
      setStaffToken(storedToken);
    }
    onChange({ device, staffToken: storedToken });
  }, [onChange]);

  const handleSave = () => {
    if (deviceId && deviceToken) {
      saveDeviceAuth({ deviceId, deviceToken });
    }
    if (staffToken) {
      saveStaffToken(staffToken);
    }
    setStatus('saved');
    onChange({
      device: deviceId && deviceToken ? { deviceId, deviceToken } : null,
      staffToken: staffToken || null,
    });
  };

  const handleClear = () => {
    clearDeviceAuth();
    clearStaffToken();
    setDeviceId('');
    setDeviceToken('');
    setStaffToken('');
    setStatus('idle');
    onChange({ device: null, staffToken: null });
  };

  return (
    <section className="rounded-xl border bg-card/90 p-4 text-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Auth Context</h2>
          <p className="text-xs text-muted-foreground">
            Device headers and staff token are required for most Phase 1–4 endpoints.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-xs">
            <span className="text-muted-foreground">Device ID</span>
            <input
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              placeholder="UUID"
            />
          </label>
          <label className="grid gap-2 text-xs">
            <span className="text-muted-foreground">Device Token</span>
            <input
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={deviceToken}
              onChange={(event) => setDeviceToken(event.target.value)}
              placeholder="Token"
              type="password"
            />
          </label>
          <label className="grid gap-2 text-xs">
            <span className="text-muted-foreground">Staff Token</span>
            <input
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={staffToken}
              onChange={(event) => setStaffToken(event.target.value)}
              placeholder="Session token"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSave} disabled={!deviceId || !deviceToken}>
            Save auth
          </Button>
          <button
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            onClick={handleClear}
          >
            Clear
          </button>
          {status === 'saved' && <span className="text-xs text-emerald-600">Saved.</span>}
        </div>
      </div>
    </section>
  );
}
