"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Row } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductoPublico } from "@/services/productos.service";

const ETIQUETAS_TIPO: Record<string, string> = {
  todos: "Todos los tipos",
  ingreso: "Ingreso",
  egreso: "Egreso",
  venta: "Venta",
  anulacion: "Anulación",
};

export function MovimientosFiltros({
  productoIdInicial,
  tipoInicial,
  desdeInicial,
  hastaInicial,
  productosDisponibles,
  conservarTabExistencias = false,
}: {
  productoIdInicial?: string;
  tipoInicial: string;
  desdeInicial: string;
  hastaInicial: string;
  productosDisponibles?: ProductoPublico[];
  conservarTabExistencias?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);

  function navegar(cambios: {
    productoId?: string;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (conservarTabExistencias) {
      params.set("tab", "existencias");
    }

    const prodFinal = cambios.productoId ?? productoIdInicial ?? "";
    const tipoFinal = cambios.tipo ?? tipoInicial;
    const desdeFinal = cambios.desde ?? desde;
    const hastaFinal = cambios.hasta ?? hasta;

    if (productosDisponibles) {
      if (prodFinal && prodFinal !== "todos") params.set("productoId", prodFinal);
      else params.delete("productoId");
    }

    if (tipoFinal && tipoFinal !== "todos") params.set("tipo", tipoFinal);
    else params.delete("tipo");

    if (desdeFinal) params.set("desde", desdeFinal);
    else params.delete("desde");

    if (hastaFinal) params.set("hasta", hastaFinal);
    else params.delete("hasta");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navegar({ desde, hasta });
  }

  const productoLabel =
    productosDisponibles?.find((p) => String(p.id) === productoIdInicial)
      ?.descripcion ?? "Todos los productos";

  const hayFiltros =
    Boolean(productoIdInicial) ||
    (tipoInicial && tipoInicial !== "todos") ||
    Boolean(desdeInicial) ||
    Boolean(hastaInicial);

  return (
    <form onSubmit={handleSubmit}>
      <Row gap="sm" wrap align="center">
        {productosDisponibles ? (
          <Select
            value={productoIdInicial || "todos"}
            onValueChange={(value) => {
              if (value) navegar({ productoId: value });
            }}
          >
            <SelectTrigger className="w-56" aria-label="Filtrar por producto">
              <SelectValue>{productoLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los productos</SelectItem>
              {productosDisponibles.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.codigo} — {p.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select
          value={tipoInicial || "todos"}
          onValueChange={(value) => {
            if (value) navegar({ tipo: value });
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por tipo">
            <SelectValue>{ETIQUETAS_TIPO[tipoInicial || "todos"]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="ingreso">Ingreso</SelectItem>
            <SelectItem value="egreso">Egreso</SelectItem>
            <SelectItem value="venta">Venta</SelectItem>
            <SelectItem value="anulacion">Anulación</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          aria-label="Desde fecha"
          className="w-38"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />

        <Input
          type="date"
          aria-label="Hasta fecha"
          className="w-38"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />

        <Button type="submit" variant="secondary" size="sm">
          <Filter className="size-4" />
          Filtrar
        </Button>

        {hayFiltros ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDesde("");
              setHasta("");
              router.push(
                conservarTabExistencias ? `${pathname}?tab=existencias` : pathname
              );
            }}
          >
            <X className="size-4" />
            Limpiar
          </Button>
        ) : null}
      </Row>
    </form>
  );
}
