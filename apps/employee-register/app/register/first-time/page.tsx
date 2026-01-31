import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function FirstTimePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>First-time</CardTitle>
        <p className="text-sm text-muted-foreground">
          First-time guest setup will live here.
        </p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the first-time panel.
      </CardContent>
    </Card>
  );
}
