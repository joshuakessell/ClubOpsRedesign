'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@clubops/ui';
import { loadDeviceAuth, loadStaffToken, type DeviceAuth } from '@clubops/shared';
import { searchCustomers, type CustomerDto } from '../../../lib/api';
import { useRegisterContext } from '../register-context';

export default function ScanPage() {
  const [device, setDevice] = useState<DeviceAuth | null>(null);
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CustomerDto[]>([]);
  const { selectedCustomer, setSelectedCustomer } = useRegisterContext();

  useEffect(() => {
    setDevice(loadDeviceAuth());
    setStaffToken(loadStaffToken());
  }, []);

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

  const selectedDetails = useMemo(() => {
    if (!selectedCustomer) return null;
    return {
      name:
        selectedCustomer.displayName ||
        `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      contact: [selectedCustomer.email, selectedCustomer.phone].filter(Boolean).join(' · '),
    };
  }, [selectedCustomer]);

  return (
    <div className="grid gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Selected customer</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomer && (
              <p className="text-sm text-muted-foreground">Select a customer to see details.</p>
            )}
            {selectedCustomer && selectedDetails && (
              <div className="grid gap-2 text-sm">
                <p className="font-semibold text-foreground">{selectedDetails.name}</p>
                {selectedDetails.contact && (
                  <p className="text-muted-foreground">{selectedDetails.contact}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Customer ID: {selectedCustomer.id}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Clear selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
