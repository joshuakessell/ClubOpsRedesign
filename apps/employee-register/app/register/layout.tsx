'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  cn,
} from '@clubops/ui';
import { loadDeviceAuth, loadStaffToken, type DeviceAuth } from '@clubops/shared';
import {
  closeRegisterSession,
  getActiveRegisterSession,
  getRegisterAvailability,
  heartbeatRegisterSession,
  openRegisterSession,
  type RegisterAvailabilityItem,
  type RegisterNumber,
  type RegisterSessionDto,
} from '../../lib/api';
import { RegisterProvider, useRegisterContext } from './register-context';

const navItems = [
  { href: '/register/scan', label: 'Scan' },
  { href: '/register/account', label: 'Account' },
  { href: '/register/search', label: 'Search' },
  { href: '/register/inventory', label: 'Inventory' },
  { href: '/register/upgrades', label: 'Upgrades' },
  { href: '/register/checkout', label: 'Checkout' },
  { href: '/register/retail', label: 'Retail' },
  { href: '/register/first-time', label: 'First-time' },
  { href: '/register/room-cleaning', label: 'Room cleaning' },
];

type Status = 'idle' | 'loading' | 'error';

type RegisterGateState = {
  availability: RegisterAvailabilityItem[];
  activeSession: RegisterSessionDto | null;
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RegisterProvider>
      <RegisterShell>{children}</RegisterShell>
    </RegisterProvider>
  );
}

function RegisterShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setSelectedCustomer, setActiveVisit } = useRegisterContext();
  const [device, setDevice] = useState<DeviceAuth | null>(null);
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [heartbeatWarning, setHeartbeatWarning] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [gateState, setGateState] = useState<RegisterGateState>({
    availability: [],
    activeSession: null,
  });
  const [registerNumber, setRegisterNumber] = useState<RegisterNumber | ''>('');
  const [openStatus, setOpenStatus] = useState<Status>('idle');

  useEffect(() => {
    setDevice(loadDeviceAuth());
    setStaffToken(loadStaffToken());
  }, []);

  const refreshGate = useCallback(async () => {
    if (!device || !staffToken) return;
    setStatus('loading');
    setError(null);
    try {
      const availabilityResponse = await getRegisterAvailability(device, staffToken);
      const availability = availabilityResponse.registers;

      const sessions = await Promise.all(
        availability.map(async (register) =>
          getActiveRegisterSession(device, staffToken, register.registerNumber)
        )
      );
      const activeSession =
        sessions.find((session) => session && session.deviceId === device.deviceId) ?? null;

      setGateState({ availability, activeSession });
      setRegisterNumber((current) => {
        if (current) return current;
        return availability[0]?.registerNumber ?? '';
      });
      setStatus('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load register state.';
      setError(message);
      setStatus('error');
    }
  }, [device, staffToken]);

  useEffect(() => {
    if (!device || !staffToken) return;
    void refreshGate();
  }, [device, staffToken, refreshGate]);

  useEffect(() => {
    if (!device || !staffToken || !gateState.activeSession) return;
    let cancelled = false;

    const runHeartbeat = async () => {
      try {
        await heartbeatRegisterSession(device, staffToken, gateState.activeSession!.id);
        if (!cancelled) {
          setHeartbeatWarning(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Heartbeat failed.';
          setHeartbeatWarning(message);
        }
      }
    };

    void runHeartbeat();
    const interval = window.setInterval(() => {
      void runHeartbeat();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [device, staffToken, gateState.activeSession]);

  const handleOpenSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!device || !staffToken || !registerNumber) return;
    setOpenStatus('loading');
    setError(null);
    try {
      const session = await openRegisterSession(device, staffToken, registerNumber);
      setGateState((prev) => ({ ...prev, activeSession: session }));
      setOpenStatus('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open register session.';
      setError(message);
      setOpenStatus('error');
    }
  };

  const handleCloseSession = async () => {
    if (!device || !staffToken || !gateState.activeSession) return;
    setClosing(true);
    setCloseError(null);
    try {
      await closeRegisterSession(device, staffToken, gateState.activeSession.id);
      setSelectedCustomer(null);
      setActiveVisit(null);
      await refreshGate();
      router.replace('/register/scan');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to close session.';
      setCloseError(message);
    } finally {
      setClosing(false);
    }
  };

  const hasAuth = Boolean(device && staffToken);
  const sessionMeta = useMemo(() => {
    if (!gateState.activeSession) return null;
    return {
      registerNumber: gateState.activeSession.registerNumber,
      staffId: gateState.activeSession.staffId,
      deviceId: gateState.activeSession.deviceId,
    };
  }, [gateState.activeSession]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="w-64 shrink-0 border-r bg-card/80 px-4 py-6">
          <div className="px-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Register</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Workspace</h2>
          </div>
          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex flex-col gap-3 border-b bg-card/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Register Workspace</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {sessionMeta ? (
                  <>
                    <Badge variant="secondary">Active</Badge>
                    <span>Register {sessionMeta.registerNumber}</span>
                    <span>Staff {sessionMeta.staffId}</span>
                    <span>Device {sessionMeta.deviceId}</span>
                  </>
                ) : (
                  <Badge variant="outline">No active session</Badge>
                )}
                {heartbeatWarning && (
                  <span className="text-xs text-destructive">Heartbeat issue</span>
                )}
              </div>
              {closeError && (
                <p className="mt-1 text-xs text-destructive">{closeError}</p>
              )}
            </div>
            <Button
              variant="outline"
              disabled={!gateState.activeSession || closing}
              onClick={() => void handleCloseSession()}
            >
              {closing ? 'Closing…' : 'Close session'}
            </Button>
          </header>

          <main className="flex-1 p-6">
            {!hasAuth && (
              <Card>
                <CardHeader>
                  <CardTitle>Authentication required</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Head back to the device setup and staff login screen to continue.
                </CardContent>
              </Card>
            )}

            {hasAuth && status === 'loading' && (
              <Card>
                <CardHeader>
                  <CardTitle>Loading register session…</CardTitle>
                </CardHeader>
              </Card>
            )}

            {hasAuth && status === 'error' && (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to load session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{error}</p>
                  <Button variant="outline" onClick={() => void refreshGate()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasAuth && status === 'idle' && !gateState.activeSession && (
              <Card>
                <CardHeader>
                  <CardTitle>Open register session</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Pick a register number to begin a staff session.
                  </p>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4" onSubmit={handleOpenSession}>
                    <div className="grid gap-2">
                      <Label htmlFor="register-number">Register number</Label>
                      <select
                        id="register-number"
                        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={registerNumber}
                        onChange={(event) => {
                          const value = event.target.value;
                          setRegisterNumber(value ? (Number(value) as RegisterNumber) : '');
                        }}
                      >
                        <option value="">Select a register</option>
                        {gateState.availability.map((register) => (
                          <option
                            key={register.registerNumber}
                            value={register.registerNumber}
                            disabled={!register.available}
                          >
                            Register {register.registerNumber}
                            {!register.available ? ' (In use)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Registers 1–3 are supported in Phase 1.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" disabled={!registerNumber || openStatus === 'loading'}>
                        {openStatus === 'loading' ? 'Opening…' : 'Open session'}
                      </Button>
                      {openStatus === 'error' && error && (
                        <span className="text-sm text-destructive">{error}</span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {hasAuth && status === 'idle' && gateState.activeSession && children}
          </main>
        </div>
      </div>
    </div>
  );
}
