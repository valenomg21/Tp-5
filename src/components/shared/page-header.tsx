import type { ReactNode } from "react";
import { Heading, Row, Stack, Text } from "@/components/layout/primitives";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Row
      justify="between"
      align="center"
      wrap
      gap="md"
      className="border-b border-border pb-4"
    >
      <Stack gap="xs" className="min-w-0">
        <Heading level={1}>{title}</Heading>
        {description ? <Text variant="muted">{description}</Text> : null}
      </Stack>
      {actions ? (
        <Row gap="sm" wrap className="shrink-0">
          {actions}
        </Row>
      ) : null}
    </Row>
  );
}
