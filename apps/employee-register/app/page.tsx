'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceSetupCard } from './components/device-setup-card';
import { StaffLoginCard } from './components/staff-login-card';
import { MeCard } from './components/me-card';
import type { DeviceDto, StaffSessionDto } from '../lib/api';
import {
  clearDeviceAuth,
  clearStaffToken,
  loadDeviceAuth,
  loadStaffToken,
  saveDeviceAuth,
  saveStaffToken,
  type DeviceAuth,
} from '@clubops/shared';

export default function HomePage() {
  const [device, setDevice] = useState<DeviceAuth | null>(null);
  const [deviceDetails, setDeviceDetails] = useState<DeviceDto | null>(null);
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [session, setSession] = useState<StaffSessionDto | null>(null);

  useEffect(() => {
    const storedDevice = loadDeviceAuth();
    const storedToken = loadStaffToken();
    setDevice(storedDevice);
    setStaffToken(storedToken);
  }, []);

  const handleSessionRefresh = useCallback((next: StaffSessionDto) => {
    setSession(next);
  }, []);

  const handleSignOut = useCallback(() => {
    clearStaffToken();
    setStaffToken(null);
    setSession(null);
  }, []);

  const hasDevice = Boolean(device);
  const hasSession = Boolean(device && staffToken);

  const deviceMeta = useMemo(() => {
    if (!deviceDetails) return null;
    return `${deviceDetails.name} · ${deviceDetails.kind}`;
  }, [deviceDetails]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-violet-50">
      <header className="mx-auto max-w-4xl px-6 pt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Employee Register
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Device bootstrap and staff authentication flow.
        </p>
        {deviceMeta && (
          <p className="mt-3 text-xs text-muted-foreground">Device: {deviceMeta}</p>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="grid gap-6">
          {!hasDevice && (
            <DeviceSetupCard
              onSuccess={(auth, deviceInfo) => {
                saveDeviceAuth(auth);
                setDevice(auth);
                setDeviceDetails(deviceInfo);
              }}
            />
          )}

          {hasDevice && !hasSession && device && (
            <StaffLoginCard
              device={device}
              onAuthenticated={(response) => {
                saveStaffToken(response.sessionToken);
                setStaffToken(response.sessionToken);
                setSession(response.session);
              }}
            />
          )}

          {hasDevice && hasSession && device && staffToken && (
            <MeCard
              device={device}
              staffToken={staffToken}
              session={session}
              onRefresh={handleSessionRefresh}
              onSignOut={handleSignOut}
            />
          )}

          {hasDevice && (
            <section className="rounded-2xl border bg-card/70 p-4 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>Need to re-provision this device?</span>
                <button
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    clearDeviceAuth();
                    clearStaffToken();
                    setDevice(null);
                    setStaffToken(null);
                    setSession(null);
                    setDeviceDetails(null);
                  }}
                >
                  Clear stored device
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
