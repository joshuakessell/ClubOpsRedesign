import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function UpgradesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrades</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage upgrade offers and transitions here.
        </p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the upgrades panel.
      </CardContent>
    </Card>
  );
}
