import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function InventoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <p className="text-sm text-muted-foreground">
          Room and locker inventory actions will appear here.
        </p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the inventory panel.
      </CardContent>
    </Card>
  );
}
