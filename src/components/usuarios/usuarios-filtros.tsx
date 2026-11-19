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

const ETIQUETAS_ESTADO: Record<string, string> = {
  todos: "Todos los estados",
  true: "Solo activos",
  false: "Solo inactivos",
};

export function UsuariosFiltros({
  qInicial,
  activoInicial,
}: {
  qInicial: string;
  activoInicial: "true" | "false" | "todos";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busqueda, setBusqueda] = useState(qInicial);

  function actualizarUrl(nuevoQ: string, nuevoActivo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const qLimpio = nuevoQ.trim();
    if (qLimpio) {
      params.set("q", qLimpio);
    } else {
      params.delete("q");
    }

    if (nuevoActivo && nuevoActivo !== "todos") {
      params.set("activo", nuevoActivo);
    } else {
      params.delete("activo");
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    actualizarUrl(busqueda, activoInicial);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Row gap="sm" wrap align="center">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="pl-8"
            aria-label="Buscar usuarios"
          />
        </div>

        <Select
          value={activoInicial}
          onValueChange={(value) => {
            if (value) actualizarUrl(busqueda, value);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por estado">
            <SelectValue>{ETIQUETAS_ESTADO[activoInicial]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="true">Solo activos</SelectItem>
            <SelectItem value="false">Solo inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>

        {qInicial || activoInicial !== "todos" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusqueda("");
              actualizarUrl("", "todos");
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
