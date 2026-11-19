import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Heading, Stack, Text } from "@/components/layout/primitives";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title = "No se pudo cargar la información",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="py-8">
        <Stack gap="sm" className="items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <Heading level={3}>{title}</Heading>
          <Text variant="muted" className="max-w-md">
            {message}
          </Text>
          {action ? <div className="pt-2">{action}</div> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
