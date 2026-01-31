import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function RetailPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Retail</CardTitle>
        <p className="text-sm text-muted-foreground">
          Retail add-ons and purchases will live here.
        </p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the retail panel.
      </CardContent>
    </Card>
  );
}
