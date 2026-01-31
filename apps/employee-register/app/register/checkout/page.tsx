'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@clubops/ui';
import { useRegisterStore, type TenderType } from '../register-store';

const tenderOptions: Array<{ value: TenderType; label: string }> = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'account', label: 'Account' },
  { value: 'comp', label: 'Comp' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export default function CheckoutPage() {
  const {
    cart,
    cartStatus,
    cartError,
    selectedCustomer,
    createOrLoadCart,
    updateLineItemQty,
    removeLineItem,
    setTender,
    completeSale,
  } = useRegisterStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void createOrLoadCart();
  }, [createOrLoadCart]);

  const lineItems = cart.lineItems;
  const hasItems = lineItems.length > 0;

  const totalSummary = useMemo(() => {
    return [
      { label: 'Subtotal', value: formatCurrency(cart.totals.subtotal) },
      { label: 'Tax', value: formatCurrency(cart.totals.tax) },
      { label: 'Discounts', value: formatCurrency(cart.totals.discounts) },
      { label: 'Total', value: formatCurrency(cart.totals.total), emphasis: true },
    ];
  }, [cart.totals]);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await completeSale();
      toast.success('Sale completed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete sale.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const tenderValue = cart.tender?.type ?? '';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cart</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review items before tendering payment.
          </p>
        </CardHeader>
        <CardContent>
          {cartStatus === 'loading' && lineItems.length === 0 && (
            <div className="grid gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          )}

          {cartStatus !== 'loading' && !hasItems && (
            <div className="grid gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p>No line items yet.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/register/scan">Go to scan</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/register/retail">Browse retail</Link>
                </Button>
              </div>
            </div>
          )}

          {hasItems && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.sku && (
                          <span className="text-xs text-muted-foreground">SKU {item.sku}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => void updateLineItemQty(item.id, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </Button>
                        <span className="min-w-6 text-center text-sm font-medium">
                          {item.qty}
                        </span>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => void updateLineItemQty(item.id, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Remove
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Remove line item?</DialogTitle>
                            <DialogDescription>
                              This will remove {item.name} from the cart.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                variant="destructive"
                                onClick={() => void removeLineItem(item.id)}
                              >
                                Remove
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <p className="text-sm text-muted-foreground">Totals and tender selection.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 text-sm">
            {totalSummary.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={row.emphasis ? 'font-semibold text-foreground' : ''}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Tender</span>
            <Select
              value={tenderValue}
              onValueChange={(value) =>
                setTender({ type: value as TenderType, amount: cart.totals.total })
              }
              disabled={!hasItems || cartStatus === 'loading'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tender" />
              </SelectTrigger>
              <SelectContent align="start">
                {tenderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer ? (
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Customer ready: {selectedCustomer.displayName || selectedCustomer.firstName}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Select a customer before completing the sale.
            </div>
          )}

          {cartError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {cartError}
            </div>
          )}

          <Button
            className="w-full"
            disabled={
              !hasItems ||
              !tenderValue ||
              !selectedCustomer ||
              submitting ||
              cartStatus === 'loading'
            }
            onClick={() => void handleComplete()}
          >
            {submitting ? 'Completing…' : 'Complete Sale'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
