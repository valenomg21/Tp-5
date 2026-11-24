"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import {
  crearCategoriaAction,
  editarCategoriaAction,
} from "@/actions/categorias.actions";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormAction } from "@/hooks/use-form-action";
import {
  crearCategoriaSchema,
  editarCategoriaSchema,
} from "@/lib/schemas/categorias";
import type { CategoriaConConteo } from "@/services/categorias.service";

function CategoriaFormDialog({
  open,
  onOpenChange,
  categoriaEditar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaEditar: CategoriaConConteo | null;
}) {
  const router = useRouter();
  const esEdicion = categoriaEditar !== null;
  const [nombre, setNombre] = useState(categoriaEditar?.nombre ?? "");

  const formCrear = useFormAction({
    schema: crearCategoriaSchema,
    action: crearCategoriaAction,
    successMessage: "Categoría creada correctamente.",
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  const formEditar = useFormAction({
    schema: editarCategoriaSchema,
    action: (values) => editarCategoriaAction(categoriaEditar!.id, values),
    successMessage: "Categoría actualizada correctamente.",
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  const activo = esEdicion ? formEditar : formCrear;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (esEdicion) {
      formEditar.submit({ nombre });
    } else {
      formCrear.submit({ nombre });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Modificá el nombre de la categoría."
              : "Agregá un rubro para organizar los productos del catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <FormField
              id="categoria-nombre"
              label="Nombre"
              required
              error={activo.fieldErrors.nombre}
            >
              <Input
                id="categoria-nombre"
                autoFocus
                disabled={activo.isPending}
                aria-invalid={Boolean(activo.fieldErrors.nombre)}
                placeholder="Ej. Elite Trainer Boxes"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  activo.clearFieldError("nombre");
                }}
              />
            </FormField>

            {activo.formError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <Text variant="small" className="font-medium text-destructive">
                  {activo.formError}
                </Text>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={activo.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={activo.isPending}>
                {activo.isPending
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar cambios"
                    : "Crear categoría"}
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriasPanel({
  categorias,
}: {
  categorias: CategoriaConConteo[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [categoriaEditar, setCategoriaEditar] =
    useState<CategoriaConConteo | null>(null);
  const [categoriaEstado, setCategoriaEstado] =
    useState<CategoriaConConteo | null>(null);

  function confirmarCambioEstado() {
    if (!categoriaEstado) return;
    const objetivo = categoriaEstado;

    startTransition(async () => {
      const res = await editarCategoriaAction(objetivo.id, {
        activa: !objetivo.activa,
      });
      setCategoriaEstado(null);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        objetivo.activa
          ? `Categoría ${objetivo.nombre} desactivada.`
          : `Categoría ${objetivo.nombre} reactivada.`
      );
      router.refresh();
    });
  }

  return (
    <Stack gap="md">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <Row justify="between" align="center" wrap gap="sm">
            <Text variant="muted">
              Las categorías con productos activos no pueden desactivarse.
            </Text>
            <Button
              type="button"
              onClick={() => {
                setCategoriaEditar(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nueva categoría
            </Button>
          </Row>

          {categorias.length === 0 ? (
            <EmptyState
              title="No hay categorías cargadas"
              description="Creá tu primera categoría para empezar a cargar productos."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Productos activos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {c.productosActivos}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={c.activa ? "activo" : "inactivo"}
                        label={c.activa ? "Activa" : "Inactiva"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Row justify="end" gap="xs">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setCategoriaEditar(c);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant={c.activa ? "destructive" : "secondary"}
                          size="xs"
                          onClick={() => setCategoriaEstado(c)}
                        >
                          {c.activa ? (
                            <>
                              <PowerOff className="size-3.5" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Power className="size-3.5" />
                              Activar
                            </>
                          )}
                        </Button>
                      </Row>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {formOpen ? (
        <CategoriaFormDialog
          key={categoriaEditar?.id ?? "nueva"}
          open={formOpen}
          onOpenChange={setFormOpen}
          categoriaEditar={categoriaEditar}
        />
      ) : null}

      <ConfirmDialog
        open={categoriaEstado !== null}
        onOpenChange={(open) => {
          if (!open) setCategoriaEstado(null);
        }}
        title={
          categoriaEstado?.activa
            ? "Desactivar categoría"
            : "Reactivar categoría"
        }
        description={
          categoriaEstado?.activa
            ? `¿Seguro que querés desactivar la categoría ${categoriaEstado.nombre}?`
            : `¿Querés volver a activar la categoría ${categoriaEstado?.nombre ?? ""}?`
        }
        confirmLabel={categoriaEstado?.activa ? "Desactivar" : "Reactivar"}
        variant={categoriaEstado?.activa ? "destructive" : "default"}
        isPending={isPending}
        onConfirm={confirmarCambioEstado}
      />
    </Stack>
  );
}
