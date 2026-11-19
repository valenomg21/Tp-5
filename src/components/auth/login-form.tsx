"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Store } from "lucide-react";
import { loginAction } from "@/actions/auth.actions";
import { Heading, Row, Stack, Text } from "@/components/layout/primitives";
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
import { loginSchema } from "@/lib/schemas/auth";

export function LoginForm({ appName }: { appName: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { submit, isPending, fieldErrors, formError, clearFieldError } =
    useFormAction({
      schema: loginSchema,
      action: loginAction,
      successMessage: "Bienvenido al sistema.",
      onSuccess: () => {
        router.push("/");
        router.refresh();
      },
    });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({ email, password });
  }

  return (
    <Stack gap="lg" className="w-full max-w-md">
      <Row justify="center" gap="sm" align="center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
          <Store className="size-5" />
        </div>
        <Heading level={2}>{appName}</Heading>
      </Row>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresá con tu email y contraseña para operar el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <FormField
                id="login-email"
                label="Email"
                required
                error={fieldErrors.email}
              >
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.email)}
                  placeholder="usuario@comercio.test"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                />
              </FormField>

              <FormField
                id="login-password"
                label="Contraseña"
                required
                error={fieldErrors.password}
              >
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.password)}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
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

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                <LogIn className="size-4" />
                {isPending ? "Ingresando..." : "Ingresar"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
}
