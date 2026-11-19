"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { cambiarPasswordAction } from "@/actions/auth.actions";
import { Stack, Text } from "@/components/layout/primitives";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { cambiarPasswordFormSchema } from "@/lib/schemas/auth";

export function CambiarPasswordForm() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const { submit, isPending, fieldErrors, formError, clearFieldError } =
    useFormAction({
      schema: cambiarPasswordFormSchema,
      action: (values) =>
        cambiarPasswordAction({
          actual: values.actual,
          nueva: values.nueva,
        }),
      successMessage: "Contraseña actualizada correctamente.",
      onSuccess: () => {
        setActual("");
        setNueva("");
        setConfirmacion("");
      },
    });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ actual, nueva, confirmacion });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>
          La nueva contraseña debe tener al menos 8 caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <FormField
              id="password-actual"
              label="Contraseña actual"
              required
              error={fieldErrors.actual}
            >
              <Input
                id="password-actual"
                type="password"
                autoComplete="current-password"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.actual)}
                value={actual}
                onChange={(e) => {
                  setActual(e.target.value);
                  clearFieldError("actual");
                }}
              />
            </FormField>

            <FormField
              id="password-nueva"
              label="Nueva contraseña"
              required
              error={fieldErrors.nueva}
            >
              <Input
                id="password-nueva"
                type="password"
                autoComplete="new-password"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.nueva)}
                value={nueva}
                onChange={(e) => {
                  setNueva(e.target.value);
                  clearFieldError("nueva");
                }}
              />
            </FormField>

            <FormField
              id="password-confirmacion"
              label="Confirmar nueva contraseña"
              required
              error={fieldErrors.confirmacion}
            >
              <Input
                id="password-confirmacion"
                type="password"
                autoComplete="new-password"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.confirmacion)}
                value={confirmacion}
                onChange={(e) => {
                  setConfirmacion(e.target.value);
                  clearFieldError("confirmacion");
                }}
              />
            </FormField>

            {formError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <Text variant="small" className="font-medium text-destructive">
                  {formError}
                </Text>
              </div>
            ) : null}

            <div className="pt-1">
              <Button type="submit" disabled={isPending}>
                <KeyRound className="size-4" />
                {isPending ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </div>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
