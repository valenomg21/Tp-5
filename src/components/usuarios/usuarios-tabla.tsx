"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  KeyRound,
  Pencil,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  editarUsuarioAction,
  resetPasswordUsuarioAction,
} from "@/actions/usuarios.actions";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UsuarioFormDialog } from "@/components/usuarios/usuario-form-dialog";
import { UsuariosFiltros } from "@/components/usuarios/usuarios-filtros";
import type { UsuarioPublico } from "@/services/usuarios.service";

export function UsuariosPanel({
  usuarios,
  page,
  pageSize,
  total,
  qInicial,
  activoInicial,
  usuarioActualId,
}: {
  usuarios: UsuarioPublico[];
  page: number;
  pageSize: number;
  total: number;
  qInicial: string;
  activoInicial: "true" | "false" | "todos";
  usuarioActualId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioPublico | null>(null);

  const [usuarioEstado, setUsuarioEstado] = useState<UsuarioPublico | null>(null);
  const [usuarioReset, setUsuarioReset] = useState<UsuarioPublico | null>(null);
  const [passwordGenerada, setPasswordGenerada] = useState<{
    nombre: string;
    passwordTemporal: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  function abrirCrear() {
    setUsuarioEditar(null);
    setFormOpen(true);
  }

  function abrirEditar(u: UsuarioPublico) {
    setUsuarioEditar(u);
    setFormOpen(true);
  }

  function confirmarCambioEstado() {
    if (!usuarioEstado) return;
    const objetivo = usuarioEstado;

    startTransition(async () => {
      const res = await editarUsuarioAction(objetivo.id, {
        activo: !objetivo.activo,
      });
      setUsuarioEstado(null);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        objetivo.activo
          ? `Usuario ${objetivo.nombre} desactivado.`
          : `Usuario ${objetivo.nombre} reactivado.`
      );
      router.refresh();
    });
  }

  function confirmarResetPassword() {
    if (!usuarioReset) return;
    const objetivo = usuarioReset;

    startTransition(async () => {
      const res = await resetPasswordUsuarioAction(objetivo.id);
      setUsuarioReset(null);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      setCopiado(false);
      setPasswordGenerada({
        nombre: objetivo.nombre,
        passwordTemporal: res.data.passwordTemporal,
      });
      toast.success("Contraseña temporal generada.");
    });
  }

  async function copiarPasswordTemporal() {
    if (!passwordGenerada) return;
    try {
      await navigator.clipboard.writeText(passwordGenerada.passwordTemporal);
      setCopiado(true);
      toast.success("Contraseña copiada al portapapeles.");
    } catch {
      toast.error("No se pudo copiar automáticamente.");
    }
  }

  return (
    <Stack gap="md">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <Row justify="between" align="center" wrap gap="sm">
            <div className="min-w-0 flex-1">
              <UsuariosFiltros
                qInicial={qInicial}
                activoInicial={activoInicial}
              />
            </div>
            <Button type="button" onClick={abrirCrear}>
              <UserPlus className="size-4" />
              Nuevo usuario
            </Button>
          </Row>

          {usuarios.length === 0 ? (
            <EmptyState
              title="No hay usuarios para mostrar"
              description="Probá cambiar los filtros de búsqueda o creá un nuevo usuario."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => {
                  const esMismo = u.id === usuarioActualId;

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <Row gap="xs" align="center">
                          <span>{u.nombre}</span>
                          {esMismo ? (
                            <Text variant="small" as="span">
                              (vos)
                            </Text>
                          ) : null}
                        </Row>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={u.rol} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={u.activo ? "activo" : "inactivo"}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Row justify="end" gap="xs">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => abrirEditar(u)}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => setUsuarioReset(u)}
                          >
                            <KeyRound className="size-3.5" />
                            Restablecer
                          </Button>
                          <Button
                            type="button"
                            variant={u.activo ? "destructive" : "secondary"}
                            size="xs"
                            disabled={esMismo && u.activo}
                            title={
                              esMismo && u.activo
                                ? "No podés desactivar tu propia cuenta"
                                : undefined
                            }
                            onClick={() => setUsuarioEstado(u)}
                          >
                            {u.activo ? (
                              <>
                                <UserX className="size-3.5" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="size-3.5" />
                                Activar
                              </>
                            )}
                          </Button>
                        </Row>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {total > 0 ? (
            <Pagination page={page} pageSize={pageSize} total={total} />
          ) : null}
        </CardContent>
      </Card>

      {formOpen ? (
        <UsuarioFormDialog
          key={usuarioEditar?.id ?? "nuevo"}
          open={formOpen}
          onOpenChange={setFormOpen}
          usuarioEditar={usuarioEditar}
          usuarioActualId={usuarioActualId}
        />
      ) : null}

      <ConfirmDialog
        open={usuarioEstado !== null}
        onOpenChange={(open) => {
          if (!open) setUsuarioEstado(null);
        }}
        title={
          usuarioEstado?.activo ? "Desactivar usuario" : "Reactivar usuario"
        }
        description={
          usuarioEstado?.activo
            ? `¿Seguro que querés desactivar a ${usuarioEstado.nombre}? Perderá acceso inmediato al sistema.`
            : `¿Seguro que querés reactivar a ${usuarioEstado?.nombre ?? ""}?`
        }
        confirmLabel={usuarioEstado?.activo ? "Desactivar" : "Reactivar"}
        variant={usuarioEstado?.activo ? "destructive" : "default"}
        isPending={isPending}
        onConfirm={confirmarCambioEstado}
      />

      <ConfirmDialog
        open={usuarioReset !== null}
        onOpenChange={(open) => {
          if (!open) setUsuarioReset(null);
        }}
        title="Restablecer contraseña"
        description={`Se generará una nueva contraseña temporal para ${usuarioReset?.nombre ?? ""}. La clave actual dejará de funcionar.`}
        confirmLabel="Generar contraseña"
        isPending={isPending}
        onConfirm={confirmarResetPassword}
      />

      <Dialog
        open={passwordGenerada !== null}
        onOpenChange={(open) => {
          if (!open) setPasswordGenerada(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contraseña temporal generada</DialogTitle>
            <DialogDescription>
              Entregale esta clave a {passwordGenerada?.nombre}. Se muestra una
              única vez.
            </DialogDescription>
          </DialogHeader>

          <Row
            justify="between"
            align="center"
            className="rounded-lg border bg-muted/50 px-3 py-2.5"
          >
            <Text variant="mono" className="text-base font-semibold select-all">
              {passwordGenerada?.passwordTemporal}
            </Text>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copiarPasswordTemporal}
            >
              {copiado ? (
                <>
                  <Check className="size-4" />
                  Copiada
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copiar
                </>
              )}
            </Button>
          </Row>

          <DialogFooter>
            <Button type="button" onClick={() => setPasswordGenerada(null)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
