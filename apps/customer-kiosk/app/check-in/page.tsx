'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@clubops/ui';
import {
  loadDeviceAuth,
  loadStaffToken,
  type DeviceAuth,
} from '@clubops/shared';
import { AuthPanel, type AuthState } from '../components/auth-panel';
import { captureAgreementSigned, fetchActiveVisit } from '../../lib/api';
import type { AgreementDto, VisitNullableResponse } from '../../lib/api';

export default function CheckInPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') ?? '';
  const [authState, setAuthState] = useState<AuthState>({ device: null, staffToken: null });
  const [visitState, setVisitState] = useState<{
    status: 'idle' | 'loading' | 'error';
    visit: VisitNullableResponse['visit'] | null;
    error: string | null;
  }>({ status: 'idle', visit: null, error: null });
  const [agreement, setAgreement] = useState<AgreementDto | null>(null);
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const device = loadDeviceAuth();
    const staffToken = loadStaffToken();
    setAuthState({ device, staffToken });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVisit = async (device: DeviceAuth, staffToken: string) => {
      if (!customerId) return;
      setVisitState({ status: 'loading', visit: null, error: null });
      try {
        const response = await fetchActiveVisit(device, staffToken, customerId);
        if (cancelled) return;
        setVisitState({ status: 'idle', visit: response.visit ?? null, error: null });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unable to load visit.';
        setVisitState({ status: 'error', visit: null, error: message });
      }
    };

    if (authState.device && authState.staffToken && customerId) {
      void loadVisit(authState.device, authState.staffToken);
    }

    return () => {
      cancelled = true;
    };
  }, [authState.device, authState.staffToken, customerId]);

  const handleSubmit = async () => {
    if (!authState.device || !authState.staffToken || !visitState.visit) return;
    setSubmitting(true);
    try {
      const result = await captureAgreementSigned(
        authState.device,
        authState.staffToken,
        visitState.visit.id,
        {
          signedName: fullName.trim(),
          signedAt: new Date().toISOString(),
          customerId,
        }
      );
      setAgreement(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to capture agreement.';
      setVisitState((prev) => ({ ...prev, status: 'error', error: message }));
    } finally {
      setSubmitting(false);
    }
  };

  const missingAuth = !authState.device || !authState.staffToken;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ClubOps</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Customer Check-in</h1>
      </header>

      {!customerId && (
        <Card>
          <CardHeader>
            <CardTitle>Missing customer ID</CardTitle>
            <p className="text-sm text-muted-foreground">
              This link is missing a customerId. Ask staff to generate a new handoff link.
            </p>
          </CardHeader>
        </Card>
      )}

      {customerId && missingAuth && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication required</CardTitle>
            <p className="text-sm text-muted-foreground">
              Device and staff auth are required to continue.
            </p>
          </CardHeader>
          <CardContent>
            <AuthPanel onChange={setAuthState} />
          </CardContent>
        </Card>
      )}

      {customerId && !missingAuth && visitState.status === 'loading' && (
        <Card>
          <CardHeader>
            <CardTitle>Loading visit…</CardTitle>
          </CardHeader>
        </Card>
      )}

      {customerId && !missingAuth && visitState.status === 'error' && visitState.error && (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load visit</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-destructive">{visitState.error}</CardContent>
        </Card>
      )}

      {customerId && !missingAuth && visitState.status === 'idle' && !visitState.visit && (
        <Card>
          <CardHeader>
            <CardTitle>No active visit</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask staff to open the visit first.
            </p>
          </CardHeader>
        </Card>
      )}

      {customerId && !missingAuth && visitState.visit && !agreement && (
        <Card>
          <CardHeader>
            <CardTitle>Waiver and Agreement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review the waiver with the guest and capture their signature.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Visit ID: {visitState.visit.id}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>I agree to the terms and conditions.</span>
            </label>
            <div className="grid gap-2">
              <Label htmlFor="signature">Full name</Label>
              <Input
                id="signature"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Type full name"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!agreed || !fullName.trim() || submitting}
            >
              {submitting ? 'Submitting…' : 'Sign and continue'}
            </Button>
          </CardContent>
        </Card>
      )}

      {agreement && (
        <Card>
          <CardHeader>
            <CardTitle>All set</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please return to the front desk to finish check-in.
            </p>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Done</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
