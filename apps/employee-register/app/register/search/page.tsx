'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@clubops/ui';

export default function SearchPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search</CardTitle>
        <p className="text-sm text-muted-foreground">Advanced customer search tools go here.</p>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This is a placeholder for the search panel.
      </CardContent>
    </Card>
  );
}
