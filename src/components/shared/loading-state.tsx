import { Stack } from "@/components/layout/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({
  rows = 5,
  showHeader = true,
}: {
  rows?: number;
  showHeader?: boolean;
}) {
  return (
    <Stack gap="lg">
      {showHeader ? (
        <Stack gap="sm" className="border-b border-border pb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </Stack>
      ) : null}
      <Card>
        <CardContent className="space-y-3 py-4">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </Stack>
  );
}
