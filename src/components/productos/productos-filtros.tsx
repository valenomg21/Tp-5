"use client";

import { useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
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
import type { CategoriaPublica } from "@/services/categorias.service";

const ETIQUETAS_ACTIVO: Record<string, string> = {
  true: "Solo activos",
  false: "Solo inactivos",
  todos: "Todos",
};

export function ProductosFiltros({
  qInicial,
  categoriaIdInicial,
  bajoMinimoInicial,
  activoInicial,
  categorias,
  esAdmin,
}: {
  qInicial: string;
  categoriaIdInicial: string;
  bajoMinimoInicial: boolean;
  activoInicial: "true" | "false" | "todos";
  categorias: CategoriaPublica[];
  esAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busqueda, setBusqueda] = useState(qInicial);

  function navegar(cambios: {
    q?: string;
    categoriaId?: string;
    bajoMinimo?: boolean;
    activo?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("tab");

    const qFinal = (cambios.q ?? busqueda).trim();
    const catFinal = cambios.categoriaId ?? categoriaIdInicial;
    const minFinal = cambios.bajoMinimo ?? bajoMinimoInicial;
    const actFinal = cambios.activo ?? activoInicial;

    if (qFinal) params.set("q", qFinal);
    else params.delete("q");

    if (catFinal && catFinal !== "todas") params.set("categoriaId", catFinal);
    else params.delete("categoriaId");

    if (minFinal) params.set("bajoMinimo", "true");
    else params.delete("bajoMinimo");

    if (esAdmin && actFinal && actFinal !== "true") params.set("activo", actFinal);
    else params.delete("activo");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navegar({ q: busqueda });
  }

  const categoriaNombre =
    categorias.find((c) => String(c.id) === categoriaIdInicial)?.nombre ??
    "Todas las categorías";

  const hayFiltros =
    Boolean(qInicial) ||
    Boolean(categoriaIdInicial) ||
    bajoMinimoInicial ||
    (esAdmin && activoInicial !== "true");

  return (
    <form onSubmit={handleSubmit}>
      <Row gap="sm" wrap align="center">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código o descripción..."
            className="pl-8"
            aria-label="Buscar productos"
          />
        </div>

        <Select
          value={categoriaIdInicial || "todas"}
          onValueChange={(value) => {
            if (value) navegar({ categoriaId: value });
          }}
        >
          <SelectTrigger className="w-48" aria-label="Filtrar por categoría">
            <SelectValue>{categoriaNombre}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={bajoMinimoInicial ? "default" : "outline"}
          size="sm"
          onClick={() => navegar({ bajoMinimo: !bajoMinimoInicial })}
        >
          <AlertTriangle className="size-4" />
          Bajo mínimo
        </Button>

        {esAdmin ? (
          <Select
            value={activoInicial}
            onValueChange={(value) => {
              if (value) navegar({ activo: value });
            }}
          >
            <SelectTrigger className="w-36" aria-label="Filtrar por estado">
              <SelectValue>{ETIQUETAS_ACTIVO[activoInicial]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Solo activos</SelectItem>
              <SelectItem value="false">Solo inactivos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        ) : null}

        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>

        {hayFiltros ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusqueda("");
              router.push(pathname);
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
