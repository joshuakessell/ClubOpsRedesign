import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function CheckoutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <p className="text-sm text-muted-foreground">
          Checkout requests and completions will appear here.
        </p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the checkout panel.
      </CardContent>
    </Card>
  );
}
