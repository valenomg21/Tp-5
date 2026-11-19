"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearUsuarioAction, editarUsuarioAction } from "@/actions/usuarios.actions";
import { Stack, Text } from "@/components/layout/primitives";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
} from "@/lib/schemas/usuarios";
import type { RolUsuario } from "@/lib/session";
import type { UsuarioPublico } from "@/services/usuarios.service";

export function UsuarioFormDialog({
  open,
  onOpenChange,
  usuarioEditar,
  usuarioActualId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioEditar: UsuarioPublico | null;
  usuarioActualId: number;
}) {
  const router = useRouter();
  const esEdicion = usuarioEditar !== null;
  const esMismoUsuario = usuarioEditar?.id === usuarioActualId;

  const [nombre, setNombre] = useState(usuarioEditar?.nombre ?? "");
  const [email, setEmail] = useState(usuarioEditar?.email ?? "");
  const [rol, setRol] = useState<RolUsuario>(usuarioEditar?.rol ?? "vendedor");
  const [password, setPassword] = useState("");

  const formCrear = useFormAction({
    schema: crearUsuarioSchema,
    action: crearUsuarioAction,
    successMessage: "Usuario creado correctamente.",
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  const formEditar = useFormAction({
    schema: editarUsuarioSchema,
    action: (values) => editarUsuarioAction(usuarioEditar!.id, values),
    successMessage: "Usuario actualizado correctamente.",
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  const activoForm = esEdicion ? formEditar : formCrear;
  const { isPending, fieldErrors, formError, clearFieldError } = activoForm;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (esEdicion) {
      formEditar.submit({
        nombre,
        email,
        ...(esMismoUsuario ? {} : { rol }),
      });
    } else {
      formCrear.submit({ nombre, email, rol, password });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Actualizá los datos del usuario seleccionado."
              : "Creá una cuenta para un integrante del comercio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <FormField
              id="usuario-nombre"
              label="Nombre completo"
              required
              error={fieldErrors.nombre}
            >
              <Input
                id="usuario-nombre"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.nombre)}
                placeholder="Ej. Pablo Ruiz"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError("nombre");
                }}
              />
            </FormField>

            <FormField
              id="usuario-email"
              label="Email"
              required
              error={fieldErrors.email}
            >
              <Input
                id="usuario-email"
                type="email"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.email)}
                placeholder="nombre@comercio.test"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
              />
            </FormField>

            <FormField
              id="usuario-rol"
              label="Rol"
              required
              error={fieldErrors.rol}
              hint={
                esMismoUsuario
                  ? "No podés modificar tu propio rol de administrador."
                  : undefined
              }
            >
              <Select
                value={rol}
                onValueChange={(value) => {
                  if (value === "admin" || value === "vendedor") {
                    setRol(value);
                    clearFieldError("rol");
                  }
                }}
                disabled={isPending || esMismoUsuario}
              >
                <SelectTrigger id="usuario-rol" className="w-full">
                  <SelectValue>
                    {rol === "admin" ? "Administrador" : "Vendedor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {!esEdicion ? (
              <FormField
                id="usuario-password"
                label="Contraseña inicial"
                required
                error={fieldErrors.password}
                hint="Mínimo 8 caracteres."
              >
                <Input
                  id="usuario-password"
                  type="password"
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
            ) : null}

            {formError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <Text variant="small" className="font-medium text-destructive">
                  {formError}
                </Text>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar cambios"
                    : "Crear usuario"}
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
