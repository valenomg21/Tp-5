"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteAction, editarClienteAction } from "@/actions/clientes.actions";
import { Grid, Row, Stack, Text } from "@/components/layout/primitives";
import { CurrencyInput } from "@/components/shared/currency-input";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFormAction } from "@/hooks/use-form-action";
import {
  crearClienteSchema,
  editarClienteSchema,
} from "@/lib/schemas/clientes";
import type { ClientePublico } from "@/services/clientes.service";

export function ClienteFormDialog({
  open,
  onOpenChange,
  clienteEditar,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteEditar: ClientePublico | null;
  onSaved?: (cliente: ClientePublico) => void;
}) {
  const router = useRouter();
  const esEdicion = clienteEditar !== null;

  const [tipoDoc, setTipoDoc] = useState<"DNI" | "CUIT">(
    clienteEditar?.tipoDoc ?? "DNI"
  );
  const [nroDoc, setNroDoc] = useState(clienteEditar?.nroDoc ?? "");
  const [nombre, setNombre] = useState(clienteEditar?.nombre ?? "");
  const [domicilio, setDomicilio] = useState(clienteEditar?.domicilio ?? "");
  const [telefono, setTelefono] = useState(clienteEditar?.telefono ?? "");
  const [email, setEmail] = useState(clienteEditar?.email ?? "");
  const [cuentaCorriente, setCuentaCorriente] = useState(
    clienteEditar?.cuentaCorriente ?? false
  );
  const [limiteCredito, setLimiteCredito] = useState<number | null>(
    clienteEditar?.limiteCredito ?? null
  );

  const formCrear = useFormAction({
    schema: crearClienteSchema,
    action: crearClienteAction,
    successMessage: "Cliente creado correctamente.",
    onSuccess: (cliente) => {
      onOpenChange(false);
      onSaved?.(cliente);
      router.refresh();
    },
  });

  const formEditar = useFormAction({
    schema: editarClienteSchema,
    action: (values) => editarClienteAction(clienteEditar!.id, values),
    successMessage: "Cliente actualizado correctamente.",
    onSuccess: (cliente) => {
      onOpenChange(false);
      onSaved?.(cliente);
      router.refresh();
    },
  });

  const activoForm = esEdicion ? formEditar : formCrear;
  const { isPending, fieldErrors, formError, clearFieldError } = activoForm;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      tipoDoc,
      nroDoc,
      nombre,
      domicilio: domicilio.trim() ? domicilio.trim() : null,
      telefono: telefono.trim() ? telefono.trim() : null,
      email: email.trim() ? email.trim() : null,
      cuentaCorriente,
      limiteCredito: cuentaCorriente ? limiteCredito : null,
    };

    if (esEdicion) {
      formEditar.submit(payload);
    } else {
      formCrear.submit(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Actualizá los datos del cliente y su configuración de cuenta corriente."
              : "Completá los datos para registrar al cliente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <Grid cols={2} gap="md">
              <FormField
                id="cliente-tipo-doc"
                label="Tipo de documento"
                required
                error={fieldErrors.tipoDoc}
              >
                <Select
                  value={tipoDoc}
                  onValueChange={(value) => {
                    if (value === "DNI" || value === "CUIT") {
                      setTipoDoc(value);
                      clearFieldError("tipoDoc");
                      clearFieldError("nroDoc");
                    }
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger id="cliente-tipo-doc" className="w-full">
                    <SelectValue>{tipoDoc}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="CUIT">CUIT</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                id="cliente-nro-doc"
                label="Número de documento"
                required
                error={fieldErrors.nroDoc}
              >
                <Input
                  id="cliente-nro-doc"
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.nroDoc)}
                  placeholder={tipoDoc === "DNI" ? "28.456.123" : "20-28456123-4"}
                  value={nroDoc}
                  onChange={(e) => {
                    setNroDoc(e.target.value);
                    clearFieldError("nroDoc");
                  }}
                />
              </FormField>
            </Grid>

            <FormField
              id="cliente-nombre"
              label="Nombre o razón social"
              required
              error={fieldErrors.nombre}
            >
              <Input
                id="cliente-nombre"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.nombre)}
                placeholder="Ej. Mariana López"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError("nombre");
                }}
              />
            </FormField>

            <FormField
              id="cliente-domicilio"
              label="Domicilio"
              error={fieldErrors.domicilio}
            >
              <Input
                id="cliente-domicilio"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.domicilio)}
                placeholder="Ej. Las Heras 455"
                value={domicilio}
                onChange={(e) => {
                  setDomicilio(e.target.value);
                  clearFieldError("domicilio");
                }}
              />
            </FormField>

            <Grid cols={2} gap="md">
              <FormField
                id="cliente-telefono"
                label="Teléfono"
                error={fieldErrors.telefono}
              >
                <Input
                  id="cliente-telefono"
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.telefono)}
                  placeholder="381 455-2210"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    clearFieldError("telefono");
                  }}
                />
              </FormField>

              <FormField
                id="cliente-email"
                label="Email"
                error={fieldErrors.email}
              >
                <Input
                  id="cliente-email"
                  type="email"
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.email)}
                  placeholder="cliente@correo.test"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                />
              </FormField>
            </Grid>

            <div className="rounded-lg border bg-muted/30 p-3">
              <Stack gap="md">
                <Row justify="between" align="center" gap="md">
                  <Stack gap="xs">
                    <Label htmlFor="cliente-cc">Habilitar cuenta corriente</Label>
                    <Text variant="small">
                      Permite vender fiado y registrar pagos a cuenta.
                    </Text>
                  </Stack>
                  <Switch
                    id="cliente-cc"
                    checked={cuentaCorriente}
                    disabled={isPending}
                    onCheckedChange={(checked) => {
                      setCuentaCorriente(checked);
                      if (!checked) {
                        setLimiteCredito(null);
                        clearFieldError("limiteCredito");
                      }
                    }}
                  />
                </Row>

                {cuentaCorriente ? (
                  <FormField
                    id="cliente-limite"
                    label="Límite de crédito (opcional)"
                    error={fieldErrors.limiteCredito}
                    hint="Dejalo vacío si el cliente opera sin tope de crédito."
                  >
                    <CurrencyInput
                      id="cliente-limite"
                      disabled={isPending}
                      invalid={Boolean(fieldErrors.limiteCredito)}
                      valueCentavos={limiteCredito}
                      onChangeCentavos={(c) => {
                        setLimiteCredito(c);
                        clearFieldError("limiteCredito");
                      }}
                    />
                  </FormField>
                ) : null}
              </Stack>
            </div>

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
                    : "Crear cliente"}
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
