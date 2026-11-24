"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, Store, UserCheck } from "lucide-react";
import { loginAction, loginDemoAction } from "@/actions/auth.actions";
import {
  Grid,
  Heading,
  Row,
  Stack,
  Text,
} from "@/components/layout/primitives";
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
import { Separator } from "@/components/ui/separator";
import { useFormAction } from "@/hooks/use-form-action";
import { loginDemoSchema, loginSchema } from "@/lib/schemas/auth";

export function LoginForm({ appName }: { appName: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rolDemoActivo, setRolDemoActivo] = useState<
    "admin" | "vendedor" | null
  >(null);

  const {
    submit,
    isPending,
    fieldErrors,
    formError,
    clearErrors,
    clearFieldError,
  } = useFormAction({
    schema: loginSchema,
    action: loginAction,
    successMessage: "Bienvenido al sistema.",
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  const formDemo = useFormAction({
    schema: loginDemoSchema,
    action: loginDemoAction,
    successMessage: "Sesión demo iniciada.",
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  const bloqueado = isPending || formDemo.isPending;
  const errorGeneral = formError ?? formDemo.formError;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    formDemo.clearErrors();
    setRolDemoActivo(null);
    submit({ email, password });
  }

  function manejarLoginDemo(rol: "admin" | "vendedor") {
    clearErrors();
    setRolDemoActivo(rol);
    formDemo.submit({ rol });
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
            Ingresá con tu email y contraseña o elegí un acceso rápido en modo
            demo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap="lg">
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
                    disabled={bloqueado}
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
                    disabled={bloqueado}
                    aria-invalid={Boolean(fieldErrors.password)}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
                    }}
                  />
                </FormField>

                {errorGeneral ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                    <Text variant="small" className="font-medium text-destructive">
                      {errorGeneral}
                    </Text>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={bloqueado}
                >
                  <LogIn className="size-4" />
                  {isPending ? "Ingresando..." : "Ingresar"}
                </Button>
              </Stack>
            </form>

            <Stack gap="sm">
              <Row align="center" gap="sm">
                <Separator className="w-auto flex-1" />
                <Text variant="small" className="shrink-0">
                  O entrá en modo demo
                </Text>
                <Separator className="w-auto flex-1" />
              </Row>

              <Grid cols={2} gap="sm">
                <Button
                  type="button"
                  variant="outline"
                  disabled={bloqueado}
                  onClick={() => manejarLoginDemo("admin")}
                >
                  <ShieldCheck className="size-4" />
                  {formDemo.isPending && rolDemoActivo === "admin"
                    ? "Ingresando..."
                    : "Administrador"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={bloqueado}
                  onClick={() => manejarLoginDemo("vendedor")}
                >
                  <UserCheck className="size-4" />
                  {formDemo.isPending && rolDemoActivo === "vendedor"
                    ? "Ingresando..."
                    : "Vendedor"}
                </Button>
              </Grid>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
