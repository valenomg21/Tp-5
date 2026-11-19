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
import { formatearFormaPago } from "@/lib/format";
import type { ClientePublico } from "@/services/clientes.service";

const ETIQUETAS_ESTADO: Record<string, string> = {
  todos: "Todos los estados",
  emitida: "Solo emitidas",
  anulada: "Solo anuladas",
};

export function VentasFiltros({
  qInicial,
  desdeInicial,
  hastaInicial,
  formaInicial,
  estadoInicial,
  clienteIdInicial,
  vendedorIdInicial,
  clientes,
  vendedores,
}: {
  qInicial: string;
  desdeInicial: string;
  hastaInicial: string;
  formaInicial: string;
  estadoInicial: string;
  clienteIdInicial: string;
  vendedorIdInicial: string;
  clientes: ClientePublico[];
  vendedores: Array<{ id: number; nombre: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(qInicial);
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);

  function navegar(cambios: {
    q?: string;
    desde?: string;
    hasta?: string;
    forma?: string;
    estado?: string;
    clienteId?: string;
    vendedorId?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const qFinal = (cambios.q ?? q).trim();
    const desdeFinal = cambios.desde ?? desde;
    const hastaFinal = cambios.hasta ?? hasta;
    const formaFinal = cambios.forma ?? formaInicial;
    const estadoFinal = cambios.estado ?? estadoInicial;
    const clienteFinal = cambios.clienteId ?? clienteIdInicial;
    const vendedorFinal = cambios.vendedorId ?? vendedorIdInicial;

    if (qFinal) params.set("q", qFinal);
    else params.delete("q");

    if (desdeFinal) params.set("desde", desdeFinal);
    else params.delete("desde");

    if (hastaFinal) params.set("hasta", hastaFinal);
    else params.delete("hasta");

    if (formaFinal && formaFinal !== "todas") params.set("forma", formaFinal);
    else params.delete("forma");

    if (estadoFinal && estadoFinal !== "todos") params.set("estado", estadoFinal);
    else params.delete("estado");

    if (clienteFinal && clienteFinal !== "todos")
      params.set("clienteId", clienteFinal);
    else params.delete("clienteId");

    if (vendedorFinal && vendedorFinal !== "todos")
      params.set("vendedorId", vendedorFinal);
    else params.delete("vendedorId");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navegar({ q, desde, hasta });
  }

  const clienteNombre =
    clientes.find((c) => String(c.id) === clienteIdInicial)?.nombre ??
    "Todos los clientes";
  const vendedorNombre =
    vendedores.find((v) => String(v.id) === vendedorIdInicial)?.nombre ??
    "Todos los vendedores";

  const hayFiltros =
    Boolean(qInicial) ||
    Boolean(desdeInicial) ||
    Boolean(hastaInicial) ||
    (formaInicial && formaInicial !== "todas") ||
    (estadoInicial && estadoInicial !== "todos") ||
    Boolean(clienteIdInicial) ||
    Boolean(vendedorIdInicial);

  return (
    <form onSubmit={handleSubmit}>
      <Row gap="sm" wrap align="center">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número o cliente..."
            className="pl-8"
            aria-label="Buscar facturas"
          />
        </div>

        <Input
          type="date"
          aria-label="Desde fecha"
          className="w-36"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />

        <Input
          type="date"
          aria-label="Hasta fecha"
          className="w-36"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />

        <Select
          value={formaInicial || "todas"}
          onValueChange={(value) => {
            if (value) navegar({ forma: value });
          }}
        >
          <SelectTrigger className="w-40" aria-label="Forma de pago">
            <SelectValue>
              {formaInicial && formaInicial !== "todas"
                ? formatearFormaPago(formaInicial)
                : "Todas las formas"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las formas</SelectItem>
            <SelectItem value="contado">Contado</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="cuenta_corriente">Cuenta corriente</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={estadoInicial || "todos"}
          onValueChange={(value) => {
            if (value) navegar({ estado: value });
          }}
        >
          <SelectTrigger className="w-40" aria-label="Estado de factura">
            <SelectValue>{ETIQUETAS_ESTADO[estadoInicial || "todos"]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="emitida">Solo emitidas</SelectItem>
            <SelectItem value="anulada">Solo anuladas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={clienteIdInicial || "todos"}
          onValueChange={(value) => {
            if (value) navegar({ clienteId: value });
          }}
        >
          <SelectTrigger className="w-48" aria-label="Filtrar por cliente">
            <SelectValue>{clienteNombre}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={vendedorIdInicial || "todos"}
          onValueChange={(value) => {
            if (value) navegar({ vendedorId: value });
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por vendedor">
            <SelectValue>{vendedorNombre}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los vendedores</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" variant="secondary" size="sm">
          Filtrar
        </Button>

        {hayFiltros ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setDesde("");
              setHasta("");
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
