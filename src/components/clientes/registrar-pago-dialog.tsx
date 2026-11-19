"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarPagoAction } from "@/actions/clientes.actions";
import { Row, Stack, Text } from "@/components/layout/primitives";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { formatearMedioPago, formatearMoneda } from "@/lib/format";
import {
  MEDIOS_PAGO,
  registrarPagoSchema,
  type MedioPago,
} from "@/lib/schemas/pagos";
import type { PagoReciboPublico } from "@/services/pagos.service";

export function RegistrarPagoDialog({
  open,
  onOpenChange,
  cliente,
  onPagoRegistrado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: { id: number; nombre: string; saldo: number };
  onPagoRegistrado: (recibo: PagoReciboPublico) => void;
}) {
  const router = useRouter();
  const [importeCentavos, setImporteCentavos] = useState<number | null>(
    cliente.saldo > 0 ? cliente.saldo : null
  );
  const [medio, setMedio] = useState<MedioPago>("efectivo");
  const [observacion, setObservacion] = useState("");

  const { submit, isPending, fieldErrors, formError, clearFieldError } =
    useFormAction({
      schema: registrarPagoSchema,
      action: (values) => registrarPagoAction(cliente.id, values),
      successMessage: "Pago registrado correctamente.",
      onSuccess: (recibo) => {
        onOpenChange(false);
        onPagoRegistrado(recibo);
        router.refresh();
      },
    });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({
      importe: importeCentavos ?? 0,
      medio,
      observacion: observacion.trim() ? observacion.trim() : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago en cuenta corriente</DialogTitle>
          <DialogDescription>
            {cliente.nombre} · Deuda actual:{" "}
            <span className="font-mono font-semibold text-foreground">
              {formatearMoneda(cliente.saldo)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <FormField
              id="pago-importe"
              label="Importe a abonar"
              required
              error={fieldErrors.importe}
            >
              <Row gap="sm" align="center">
                <div className="flex-1">
                  <CurrencyInput
                    id="pago-importe"
                    disabled={isPending}
                    invalid={Boolean(fieldErrors.importe)}
                    valueCentavos={importeCentavos}
                    onChangeCentavos={(c) => {
                      setImporteCentavos(c);
                      clearFieldError("importe");
                    }}
                  />
                </div>
                {cliente.saldo > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setImporteCentavos(cliente.saldo);
                      clearFieldError("importe");
                    }}
                  >
                    Total deuda
                  </Button>
                ) : null}
              </Row>
            </FormField>

            <FormField
              id="pago-medio"
              label="Medio de pago"
              required
              error={fieldErrors.medio}
            >
              <Select
                value={medio}
                onValueChange={(value) => {
                  if (
                    value === "efectivo" ||
                    value === "transferencia" ||
                    value === "tarjeta_debito"
                  ) {
                    setMedio(value);
                    clearFieldError("medio");
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger id="pago-medio" className="w-full">
                  <SelectValue>{formatearMedioPago(medio)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MEDIOS_PAGO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatearMedioPago(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              id="pago-observacion"
              label="Observación (opcional)"
              error={fieldErrors.observacion}
            >
              <Textarea
                id="pago-observacion"
                rows={2}
                disabled={isPending}
                placeholder="Ej. Pago parcial, transferencia banco..."
                value={observacion}
                onChange={(e) => {
                  setObservacion(e.target.value);
                  clearFieldError("observacion");
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
                {isPending ? "Registrando..." : "Confirmar pago"}
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
