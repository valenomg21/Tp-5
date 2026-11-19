import { redirect } from "next/navigation";
import { CambiarPasswordForm } from "@/components/auth/cambiar-password-form";
import { Grid, Row, Stack, Text } from "@/components/layout/primitives";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function PerfilPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Mi perfil"
        description="Información de tu cuenta y actualización de contraseña."
      />

      <Grid cols={2} gap="lg">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la cuenta</CardTitle>
            <CardDescription>
              Tus permisos se verifican en el servidor en cada operación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap="md">
              <Stack gap="xs">
                <Text variant="label">Nombre</Text>
                <Text className="font-medium">{usuario.nombre}</Text>
              </Stack>
              <Stack gap="xs">
                <Text variant="label">Email</Text>
                <Text>{usuario.email}</Text>
              </Stack>
              <Stack gap="xs">
                <Text variant="label">Rol asignado</Text>
                <Row>
                  <StatusBadge variant={usuario.rol} />
                </Row>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <CambiarPasswordForm />
      </Grid>
    </Stack>
  );
}
