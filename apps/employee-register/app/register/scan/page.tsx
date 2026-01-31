'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  toast,
} from '@clubops/ui';
import { loadDeviceAuth, loadStaffToken, type DeviceAuth } from '@clubops/shared';
import {
  getActiveVisit,
  openVisit,
  searchCustomers,
  type CustomerDto,
} from '../../../lib/api';
import { useRegisterContext } from '../register-context';
import { useRegisterStore } from '../register-store';

const kioskBase = process.env.NEXT_PUBLIC_KIOSK_BASE_URL ?? 'http://localhost:3000';

type Status = 'idle' | 'loading' | 'error';

type VisitState = {
  status: Status;
  error: string | null;
};

export default function ScanPage() {
  const [device, setDevice] = useState<DeviceAuth | null>(null);
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CustomerDto[]>([]);
  const [visitState, setVisitState] = useState<VisitState>({ status: 'idle', error: null });
  const { selectedCustomer, setSelectedCustomer, activeVisit, setActiveVisit } =
    useRegisterContext();
  const { createOrLoadCart, addLineItem } = useRegisterStore();

  useEffect(() => {
    setDevice(loadDeviceAuth());
    setStaffToken(loadStaffToken());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVisit = async () => {
      if (!device || !staffToken || !selectedCustomer) {
        setActiveVisit(null);
        setVisitState({ status: 'idle', error: null });
        return;
      }
      setVisitState({ status: 'loading', error: null });
      try {
        const visit = await getActiveVisit(device, staffToken, selectedCustomer.id);
        if (cancelled) return;
        setActiveVisit(visit);
        setVisitState({ status: 'idle', error: null });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unable to load visit.';
        setVisitState({ status: 'error', error: message });
      }
    };

    void loadVisit();
    return () => {
      cancelled = true;
    };
  }, [device, staffToken, selectedCustomer, setActiveVisit]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!device || !staffToken) {
      setError('Missing device or staff authentication.');
      return;
    }
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const response = await searchCustomers(device, staffToken, query.trim());
      setResults(response.items);
      setStatus('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to search customers.';
      setStatus('error');
      setError(message);
    }
  };

  const handleAddDropIn = async () => {
    try {
      await createOrLoadCart();
      await addLineItem({
        sku: 'DROPIN',
        name: 'Drop-In',
        qty: 1,
        unitPrice: 0,
      });
      toast.success('Added Drop-In to cart.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add item.';
      toast.error(message);
    }
  };

  const handleOpenVisit = async () => {
    if (!device || !staffToken || !selectedCustomer) return;
    setVisitState({ status: 'loading', error: null });
    try {
      const visit = await openVisit(device, staffToken, selectedCustomer.id);
      setActiveVisit(visit);
      setVisitState({ status: 'idle', error: null });
      toast.success('Visit opened.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open visit.';
      setVisitState({ status: 'error', error: message });
    }
  };

  const selectedDetails = useMemo(() => {
    if (!selectedCustomer) return null;
    return {
      name:
        selectedCustomer.displayName ||
        `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      contact: [selectedCustomer.email, selectedCustomer.phone].filter(Boolean).join(' · '),
    };
  }, [selectedCustomer]);

  const kioskUrl = selectedCustomer
    ? `${kioskBase}/check-in?customerId=${encodeURIComponent(selectedCustomer.id)}`
    : '';

  const hasAuth = Boolean(device && staffToken);

  return (
    <div className="grid gap-6">
      {!hasAuth && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication required</CardTitle>
            <p className="text-sm text-muted-foreground">
              Device and staff auth are required to load customers.
            </p>
          </CardHeader>
        </Card>
      )}

      {hasAuth && (
        <Card>
          <CardHeader>
            <CardTitle>Scan</CardTitle>
            <p className="text-sm text-muted-foreground">
              Look up a customer by name, email, or phone to start a visit.
            </p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSearch}>
              <div className="grid gap-2">
                <Label htmlFor="customer-query">Customer search</Label>
                <Input
                  id="customer-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search customers..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Searching…' : 'Search'}
                </Button>
                {status === 'error' && error && (
                  <span className="text-sm text-destructive">{error}</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select a customer to continue registration.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {results.length === 0 && (
                <p className="text-sm text-muted-foreground">No customers yet.</p>
              )}
              {results.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const name = customer.displayName || `${customer.firstName} ${customer.lastName}`;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedCustomer(customer)}
                    className={
                      isSelected
                        ? 'rounded-lg border border-primary bg-primary/5 p-3 text-left'
                        : 'rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40'
                    }
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[customer.email, customer.phone].filter(Boolean).join(' · ') ||
                            'No contact details'}
                        </p>
                      </div>
                      {isSelected && <Badge variant="secondary">Selected</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected customer</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCustomer && (
                <p className="text-sm text-muted-foreground">
                  Select a customer to see details.
                </p>
              )}
              {selectedCustomer && selectedDetails && (
                <div className="grid gap-3 text-sm">
                  <p className="font-semibold text-foreground">{selectedDetails.name}</p>
                  {selectedDetails.contact && (
                    <p className="text-muted-foreground">{selectedDetails.contact}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Customer ID: {selectedCustomer.id}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={handleAddDropIn}>
                      Add Drop-In
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                      Clear selection
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/register/checkout">Go to checkout</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!selectedCustomer && (
                <p className="text-muted-foreground">
                  Select a customer to open or load their visit.
                </p>
              )}
              {selectedCustomer && visitState.status === 'loading' && (
                <p className="text-muted-foreground">Loading visit…</p>
              )}
              {selectedCustomer && visitState.status === 'error' && visitState.error && (
                <p className="text-destructive">{visitState.error}</p>
              )}
              {selectedCustomer && visitState.status !== 'loading' && !activeVisit && (
                <div className="grid gap-2">
                  <p className="text-muted-foreground">No active visit found.</p>
                  <Button size="sm" onClick={handleOpenVisit} disabled={!hasAuth}>
                    Open visit
                  </Button>
                </div>
              )}
              {activeVisit && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Visit ID</p>
                      <p className="text-sm font-medium text-foreground">{activeVisit.id}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer kiosk</CardTitle>
              <p className="text-sm text-muted-foreground">
                Send the customer to the kiosk for agreement capture.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCustomer && (
                <p className="text-sm text-muted-foreground">
                  Select a customer to generate a kiosk link.
                </p>
              )}
              {selectedCustomer && !activeVisit && (
                <p className="text-sm text-muted-foreground">
                  Open a visit first to continue on the kiosk.
                </p>
              )}
              {selectedCustomer && activeVisit && (
                <div className="grid gap-3">
                  <Label htmlFor="kiosk-link">Kiosk link</Label>
                  <Input id="kiosk-link" value={kioskUrl} readOnly />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(kioskUrl)
                          .then(() => toast.success('Link copied.'))
                          .catch(() => toast.error('Unable to copy link.'))
                      }
                    >
                      Copy link
                    </Button>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Customer kiosk uses the customerId and loads the active visit automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
