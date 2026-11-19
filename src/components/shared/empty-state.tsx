import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Heading, Stack, Text } from "@/components/layout/primitives";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10">
        <Stack gap="sm" className="items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon ?? <Inbox className="size-5" />}
          </div>
          <Heading level={3}>{title}</Heading>
          {description ? (
            <Text variant="muted" className="max-w-md">
              {description}
            </Text>
          ) : null}
          {action ? <div className="pt-2">{action}</div> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
