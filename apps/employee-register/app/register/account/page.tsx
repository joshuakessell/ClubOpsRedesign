import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function AccountPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <p className="text-sm text-muted-foreground">Staff account settings will live here.</p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the account panel.
      </CardContent>
    </Card>
  );
}
