import type { ReactNode } from "react";
import { Stack, Text } from "@/components/layout/primitives";
import { Label } from "@/components/ui/label";

export function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="xs">
      <Label htmlFor={id} className="gap-1">
        <span>{label}</span>
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint && !error ? <Text variant="small">{hint}</Text> : null}
      {error ? (
        <Text
          variant="small"
          className="font-medium text-destructive"
          as="p"
        >
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
