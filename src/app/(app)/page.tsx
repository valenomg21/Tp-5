import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Grid, Heading, Row, Stack, Text } from "@/components/layout/primitives";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function InicioPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title={`Hola, ${usuario.nombre}`}
        description="Sesión iniciada correctamente. El tablero completo con indicadores y gráficos se incorpora en la Etapa 6."
        actions={<StatusBadge variant={usuario.rol} />}
      />

      <Grid cols={2} gap="md">
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
            <CardDescription>
              Consultá tu perfil o actualizá tu contraseña de acceso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap="md">
              <Stack gap="xs">
                <Text variant="small">Usuario conectado</Text>
                <Text className="font-medium">{usuario.email}</Text>
              </Stack>
              <Row>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/perfil" />}
                >
                  <KeyRound className="size-4" />
                  Ir a Mi perfil
                </Button>
              </Row>
            </Stack>
          </CardContent>
        </Card>

        {usuario.rol === "admin" ? (
          <Card>
            <CardHeader>
              <CardTitle>Administración de usuarios</CardTitle>
              <CardDescription>
                Creá cuentas para vendedores y administradores, editá roles o
                restablecé contraseñas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <Heading level={3}>Control de acceso por rol</Heading>
                <Row>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/usuarios" />}
                  >
                    <ShieldCheck className="size-4" />
                    Gestionar usuarios
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Permisos de mostrador</CardTitle>
              <CardDescription>
                Tu perfil opera ventas, clientes y consultas de catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="muted">
                Los módulos de Ventas, Productos y Clientes se habilitan en las
                siguientes etapas del proyecto.
              </Text>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Stack>
  );
}
