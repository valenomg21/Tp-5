"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
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

const ETIQUETAS_ORDEN: Record<string, string> = {
  nombre: "Ordenar por nombre",
  saldo: "Mayor saldo",
};

const ETIQUETAS_ACTIVO: Record<string, string> = {
  true: "Solo activos",
  false: "Solo inactivos",
  todos: "Todos",
};

export function ClientesFiltros({
  qInicial,
  ordenInicial,
  activoInicial,
}: {
  qInicial: string;
  ordenInicial: "nombre" | "saldo";
  activoInicial: "true" | "false" | "todos";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busqueda, setBusqueda] = useState(qInicial);

  function navegar(cambios: {
    q?: string;
    orden?: string;
    activo?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const qFinal = (cambios.q ?? busqueda).trim();
    const ordenFinal = cambios.orden ?? ordenInicial;
    const activoFinal = cambios.activo ?? activoInicial;

    if (qFinal) params.set("q", qFinal);
    else params.delete("q");

    if (ordenFinal && ordenFinal !== "nombre") params.set("orden", ordenFinal);
    else params.delete("orden");

    if (activoFinal && activoFinal !== "true") params.set("activo", activoFinal);
    else params.delete("activo");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navegar({ q: busqueda });
  }

  const hayFiltros =
    Boolean(qInicial) || ordenInicial !== "nombre" || activoInicial !== "true";

  return (
    <form onSubmit={handleSubmit}>
      <Row gap="sm" wrap align="center">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o DNI / CUIT..."
            className="pl-8"
            aria-label="Buscar clientes"
          />
        </div>

        <Select
          value={ordenInicial}
          onValueChange={(value) => {
            if (value) navegar({ orden: value });
          }}
        >
          <SelectTrigger className="w-44" aria-label="Ordenar clientes">
            <SelectValue>{ETIQUETAS_ORDEN[ordenInicial]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">Ordenar por nombre</SelectItem>
            <SelectItem value="saldo">Mayor saldo</SelectItem>
          </SelectContent>
        </Select>

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
