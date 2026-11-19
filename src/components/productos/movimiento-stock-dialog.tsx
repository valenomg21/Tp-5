"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarMovimientoStockAction } from "@/actions/productos.actions";
import { Grid, Stack, Text } from "@/components/layout/primitives";
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
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import {
  MOTIVOS_EGRESO,
  MOTIVOS_INGRESO,
  registrarMovimientoStockSchema,
} from "@/lib/schemas/stock";
import type { ProductoPublico } from "@/services/productos.service";

export function MovimientoStockDialog({
  open,
  onOpenChange,
  productoFijo,
  productosDisponibles = [],
  tipoInicial = "ingreso",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoFijo: ProductoPublico | null;
  productosDisponibles?: ProductoPublico[];
  tipoInicial?: "ingreso" | "egreso";
}) {
  const router = useRouter();
  const [productoIdStr, setProductoIdStr] = useState<string>(
    productoFijo
      ? String(productoFijo.id)
      : productosDisponibles[0]
        ? String(productosDisponibles[0].id)
        : ""
  );
  const [tipo, setTipo] = useState<"ingreso" | "egreso">(tipoInicial);
  const [cantidad, setCantidad] = useState<string>("1");
  const [motivo, setMotivo] = useState<string>(
    tipoInicial === "ingreso" ? MOTIVOS_INGRESO[0] : MOTIVOS_EGRESO[0]
  );
  const [observacion, setObservacion] = useState<string>("");

  const productoSeleccionado =
    productoFijo ??
    productosDisponibles.find((p) => String(p.id) === productoIdStr) ??
    null;

  const motivosDisponibles =
    tipo === "ingreso" ? MOTIVOS_INGRESO : MOTIVOS_EGRESO;

  const { submit, isPending, fieldErrors, formError, clearFieldError } =
    useFormAction({
      schema: registrarMovimientoStockSchema,
      action: (values) =>
        registrarMovimientoStockAction(productoSeleccionado?.id ?? 0, values),
      successMessage:
        tipo === "ingreso"
          ? "Ingreso de stock registrado."
          : "Egreso de stock registrado.",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });

  function cambiarTipo(nuevoTipo: "ingreso" | "egreso") {
    setTipo(nuevoTipo);
    setMotivo(
      nuevoTipo === "ingreso" ? MOTIVOS_INGRESO[0] : MOTIVOS_EGRESO[0]
    );
    clearFieldError("motivo");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productoSeleccionado) return;

    const cantidadNum = /^\d+$/.test(cantidad.trim())
      ? Number.parseInt(cantidad.trim(), 10)
      : 0;

    submit({
      tipo,
      cantidad: cantidadNum,
      motivo,
      observacion: observacion.trim() ? observacion.trim() : null,
    });
  }

  const cantidadPreview = /^\d+$/.test(cantidad.trim())
    ? Number.parseInt(cantidad.trim(), 10)
    : 0;
  const resultanteEstimada = productoSeleccionado
    ? tipo === "ingreso"
      ? productoSeleccionado.existencia + cantidadPreview
      : productoSeleccionado.existencia - cantidadPreview
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Movimiento manual de stock</DialogTitle>
          <DialogDescription>
            {productoFijo
              ? `${productoFijo.codigo} — ${productoFijo.descripcion}`
              : "Registrá un ingreso o egreso manual sobre el inventario."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            {!productoFijo ? (
              <FormField
                id="mov-producto"
                label="Producto"
                required
              >
                <Select
                  value={productoIdStr}
                  onValueChange={(value) => {
                    if (value) setProductoIdStr(value);
                  }}
                  disabled={isPending || productosDisponibles.length === 0}
                >
                  <SelectTrigger id="mov-producto" className="w-full">
                    <SelectValue placeholder="Seleccioná un producto">
                      {productoSeleccionado
                        ? `${productoSeleccionado.codigo} — ${productoSeleccionado.descripcion}`
                        : "Seleccioná un producto"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} — {p.descripcion} (Disp: {p.existencia})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}

            <Grid cols={2} gap="md">
              <FormField id="mov-tipo" label="Tipo" required error={fieldErrors.tipo}>
                <Select
                  value={tipo}
                  onValueChange={(value) => {
                    if (value === "ingreso" || value === "egreso") {
                      cambiarTipo(value);
                    }
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger id="mov-tipo" className="w-full">
                    <SelectValue>
                      {tipo === "ingreso" ? "Ingreso (+)" : "Egreso (-)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso (+)</SelectItem>
                    <SelectItem value="egreso">Egreso (-)</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                id="mov-cantidad"
                label="Cantidad"
                required
                error={fieldErrors.cantidad}
              >
                <Input
                  id="mov-cantidad"
                  type="number"
                  min={1}
                  step={1}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.cantidad)}
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value);
                    clearFieldError("cantidad");
                  }}
                />
              </FormField>
            </Grid>

            <FormField
              id="mov-motivo"
              label="Motivo"
              required
              error={fieldErrors.motivo}
            >
              <Select
                value={motivo}
                onValueChange={(value) => {
                  if (value) {
                    setMotivo(value);
                    clearFieldError("motivo");
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger id="mov-motivo" className="w-full">
                  <SelectValue>{motivo}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {motivosDisponibles.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              id="mov-observacion"
              label="Observación (opcional)"
              error={fieldErrors.observacion}
            >
              <Textarea
                id="mov-observacion"
                rows={2}
                disabled={isPending}
                placeholder="Detalle opcional del movimiento..."
                value={observacion}
                onChange={(e) => {
                  setObservacion(e.target.value);
                  clearFieldError("observacion");
                }}
              />
            </FormField>

            {productoSeleccionado ? (
              <div className="rounded-lg border bg-muted/40 px-3 py-2">
                <Text variant="small">
                  Disponible:{" "}
                  <strong className="font-mono text-foreground">
                    {productoSeleccionado.existencia}
                  </strong>
                  {resultanteEstimada !== null ? (
                    <>
                      {" "}
                      → Existencia resultante:{" "}
                      <strong
                        className={
                          resultanteEstimada < 0
                            ? "font-mono text-destructive"
                            : "font-mono text-foreground"
                        }
                      >
                        {resultanteEstimada}
                      </strong>
                    </>
                  ) : null}
                </Text>
              </div>
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
              <Button
                type="submit"
                disabled={isPending || !productoSeleccionado}
              >
                {isPending ? "Registrando..." : "Confirmar movimiento"}
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
