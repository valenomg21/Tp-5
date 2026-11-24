"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearProductoAction, editarProductoAction } from "@/actions/productos.actions";
import { Grid, Stack, Text } from "@/components/layout/primitives";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import {
  crearProductoSchema,
  editarProductoSchema,
} from "@/lib/schemas/productos";
import type { CategoriaPublica } from "@/services/categorias.service";
import type { ProductoPublico } from "@/services/productos.service";

export function ProductoFormDialog({
  open,
  onOpenChange,
  productoEditar,
  categorias,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoEditar: ProductoPublico | null;
  categorias: CategoriaPublica[];
}) {
  const router = useRouter();
  const esEdicion = productoEditar !== null;

  const [codigo, setCodigo] = useState(productoEditar?.codigo ?? "");
  const [descripcion, setDescripcion] = useState(
    productoEditar?.descripcion ?? ""
  );
  const [categoriaId, setCategoriaId] = useState<string>(
    productoEditar
      ? String(productoEditar.categoria.id)
      : categorias[0]
        ? String(categorias[0].id)
        : ""
  );
  const [precioCentavos, setPrecioCentavos] = useState<number | null>(
    productoEditar?.precio ?? null
  );
  const [stockMinimo, setStockMinimo] = useState<string>(
    productoEditar ? String(productoEditar.stockMinimo) : "0"
  );
  const [stockInicial, setStockInicial] = useState<string>("");

  const formCrear = useFormAction({
    schema: crearProductoSchema,
    action: crearProductoAction,
    successMessage: "Producto creado correctamente.",
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  const formEditar = useFormAction({
    schema: editarProductoSchema,
    action: (values) => editarProductoAction(productoEditar!.id, values),
    successMessage: "Producto actualizado correctamente.",
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  const activoForm = esEdicion ? formEditar : formCrear;
  const { isPending, fieldErrors, formError, clearFieldError } = activoForm;

  const categoriaSeleccionada = categorias.find(
    (c) => String(c.id) === categoriaId
  );

  function parsearEnteroOIndefinido(valor: string): number | undefined {
    const limpio = valor.trim();
    if (!limpio) return undefined;
    if (!/^\d+$/.test(limpio)) return Number.NaN;
    return Number.parseInt(limpio, 10);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const catIdNum = categoriaId ? Number.parseInt(categoriaId, 10) : 0;
    const minNum = parsearEnteroOIndefinido(stockMinimo) ?? 0;

    if (esEdicion) {
      formEditar.submit({
        codigo,
        descripcion,
        categoriaId: catIdNum,
        precio: precioCentavos ?? 0,
        stockMinimo: minNum,
      });
    } else {
      const inicialNum = parsearEnteroOIndefinido(stockInicial);
      formCrear.submit({
        codigo,
        descripcion,
        categoriaId: catIdNum,
        precio: precioCentavos ?? 0,
        stockMinimo: minNum,
        ...(inicialNum !== undefined ? { stockInicial: inicialNum } : {}),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "La existencia no se edita a mano: usá Ingreso o Egreso de stock."
              : "Completá los datos del catálogo. Podés cargar el stock inicial en el mismo paso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <Grid cols={2} gap="md">
              <FormField
                id="producto-codigo"
                label="Código"
                required
                error={fieldErrors.codigo}
              >
                <Input
                  id="producto-codigo"
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.codigo)}
                  placeholder="Ej. SOB-001"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    clearFieldError("codigo");
                  }}
                />
              </FormField>

              <FormField
                id="producto-categoria"
                label="Categoría"
                required
                error={fieldErrors.categoriaId}
              >
                <Select
                  value={categoriaId}
                  onValueChange={(value) => {
                    if (value) {
                      setCategoriaId(value);
                      clearFieldError("categoriaId");
                    }
                  }}
                  disabled={isPending || categorias.length === 0}
                >
                  <SelectTrigger id="producto-categoria" className="w-full">
                    <SelectValue placeholder="Seleccioná una categoría">
                      {categoriaSeleccionada?.nombre ?? "Seleccioná una categoría"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </Grid>

            <FormField
              id="producto-descripcion"
              label="Descripción"
              required
              error={fieldErrors.descripcion}
            >
              <Input
                id="producto-descripcion"
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.descripcion)}
                placeholder="Ej. Sobre Scarlet & Violet: Prismatic Evolutions"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  clearFieldError("descripcion");
                }}
              />
            </FormField>

            <Grid cols={2} gap="md">
              <FormField
                id="producto-precio"
                label="Precio de venta"
                required
                error={fieldErrors.precio}
                hint="Precio final en pesos."
              >
                <CurrencyInput
                  id="producto-precio"
                  disabled={isPending}
                  invalid={Boolean(fieldErrors.precio)}
                  valueCentavos={precioCentavos}
                  onChangeCentavos={(c) => {
                    setPrecioCentavos(c);
                    clearFieldError("precio");
                  }}
                />
              </FormField>

              <FormField
                id="producto-stock-minimo"
                label="Stock mínimo"
                required
                error={fieldErrors.stockMinimo}
              >
                <Input
                  id="producto-stock-minimo"
                  type="number"
                  min={0}
                  step={1}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.stockMinimo)}
                  value={stockMinimo}
                  onChange={(e) => {
                    setStockMinimo(e.target.value);
                    clearFieldError("stockMinimo");
                  }}
                />
              </FormField>
            </Grid>

            {!esEdicion ? (
              <FormField
                id="producto-stock-inicial"
                label="Stock inicial (opcional)"
                error={fieldErrors.stockInicial}
                hint="Si ingresás unidades, se registra un movimiento de ingreso «Stock inicial»."
              >
                <Input
                  id="producto-stock-inicial"
                  type="number"
                  min={0}
                  step={1}
                  disabled={isPending}
                  aria-invalid={Boolean(fieldErrors.stockInicial)}
                  placeholder="0"
                  value={stockInicial}
                  onChange={(e) => {
                    setStockInicial(e.target.value);
                    clearFieldError("stockInicial");
                  }}
                />
              </FormField>
            ) : (
              <div className="rounded-lg border bg-muted/40 px-3 py-2">
                <Text variant="small">
                  Existencia actual:{" "}
                  <strong className="font-mono text-foreground">
                    {productoEditar.existencia}
                  </strong>{" "}
                  unidades (solo cambia por movimientos).
                </Text>
              </div>
            )}

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
                disabled={isPending || categorias.length === 0}
              >
                {isPending
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar cambios"
                    : "Crear producto"}
              </Button>
            </DialogFooter>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
