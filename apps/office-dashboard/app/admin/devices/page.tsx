'use client';

import { useCallback, useState } from 'react';
import { Button } from '@clubops/ui';
import { AuthPanel, type AuthState } from '../../components/auth-panel';
import { Nav } from '../../components/nav';
import { fetchAdminDevices } from '../../../lib/api';

export default function AdminDevicesPage() {
  const [auth, setAuth] = useState<AuthState>({ device: null, staffToken: null });
  const [devices, setDevices] = useState<
    Array<{ id: string; name: string; kind: string; enabled: boolean }> | null
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
      const response = await fetchAdminDevices(auth.device, auth.staffToken);
      setDevices(response.devices);
    } catch (err) {
      setDevices(null);
      setError(err instanceof Error ? err.message : 'Failed to load devices.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="mx-auto max-w-4xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Admin Devices</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Requires an admin staff session token.
        </p>
        <div className="mt-4">
          <Nav />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="grid gap-6">
          <AuthPanel onChange={handleAuthChange} />

          <section className="rounded-xl border bg-card/90 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleLoad} disabled={loading}>
                {loading ? 'Loading…' : 'Load devices'}
              </Button>
              <span className="text-xs text-muted-foreground">GET /v1/admin/devices</span>
            </div>

            <div className="mt-4 text-sm">
              {error && <p className="text-destructive">{error}</p>}
              {!error && devices && devices.length === 0 && (
                <p className="text-muted-foreground">No devices found.</p>
              )}
              {devices && devices.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Kind</th>
                        <th className="pb-2">Enabled</th>
                        <th className="pb-2">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => (
                        <tr key={device.id} className="border-t">
                          <td className="py-2 pr-4 font-medium text-foreground">{device.name}</td>
                          <td className="py-2 pr-4">{device.kind}</td>
                          <td className="py-2 pr-4">
                            {device.enabled ? 'Yes' : 'No'}
                          </td>
                          <td className="py-2 text-muted-foreground">{device.id}</td>
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
