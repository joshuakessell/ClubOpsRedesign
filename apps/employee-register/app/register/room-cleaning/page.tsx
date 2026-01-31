import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function RoomCleaningPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Room cleaning</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cleaning batch workflows will appear here.
        </p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the room cleaning panel.
      </CardContent>
    </Card>
  );
}
