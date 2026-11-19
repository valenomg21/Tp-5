"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { editarProductoAction } from "@/actions/productos.actions";
import { Row } from "@/components/layout/primitives";
import { MovimientoStockDialog } from "@/components/productos/movimiento-stock-dialog";
import { ProductoFormDialog } from "@/components/productos/producto-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { CategoriaPublica } from "@/services/categorias.service";
import type { ProductoPublico } from "@/services/productos.service";

export function ProductoFichaAcciones({
  producto,
  categorias,
}: {
  producto: ProductoPublico;
  categorias: CategoriaPublica[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<"ingreso" | "egreso" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function confirmarBajaOReactivacion() {
    startTransition(async () => {
      const res = await editarProductoAction(producto.id, {
        activo: !producto.activo,
      });
      setConfirmOpen(false);

      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        producto.activo ? "Producto dado de baja." : "Producto reactivado."
      );
      router.refresh();
    });
  }

  return (
    <>
      <Row gap="xs" wrap>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMovTipo("ingreso")}
        >
          <ArrowUpCircle className="size-4" />
          Ingreso
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMovTipo("egreso")}
        >
          <ArrowDownCircle className="size-4" />
          Egreso
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button
          type="button"
          variant={producto.activo ? "destructive" : "secondary"}
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          {producto.activo ? (
            <>
              <PowerOff className="size-4" />
              Dar de baja
            </>
          ) : (
            <>
              <Power className="size-4" />
              Reactivar
            </>
          )}
        </Button>
      </Row>

      {editOpen ? (
        <ProductoFormDialog
          key={`edit-${producto.id}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          productoEditar={producto}
          categorias={categorias}
        />
      ) : null}

      {movTipo ? (
        <MovimientoStockDialog
          key={`mov-${producto.id}-${movTipo}`}
          open
          onOpenChange={(open) => {
            if (!open) setMovTipo(null);
          }}
          productoFijo={producto}
          tipoInicial={movTipo}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          producto.activo ? "Dar de baja el producto" : "Reactivar producto"
        }
        description={
          producto.activo
            ? `El producto ${producto.codigo} dejará de ofrecerse en ventas.`
            : `El producto ${producto.codigo} volverá a estar disponible.`
        }
        confirmLabel={producto.activo ? "Dar de baja" : "Reactivar"}
        variant={producto.activo ? "destructive" : "default"}
        isPending={isPending}
        onConfirm={confirmarBajaOReactivacion}
      />
    </>
  );
}
