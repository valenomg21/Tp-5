"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserCheck,
  UserPlus,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { Grid, Row, Stack, Text } from "@/components/layout/primitives";
import { CurrencyInput } from "@/components/shared/currency-input";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatearMoneda } from "@/lib/format";
import {
  emitirFacturaSchema,
  type FormaPago,
  type TipoTarjeta,
} from "@/lib/schemas/facturas";
import type { ClientePublico } from "@/services/clientes.service";
import type { ProductoPublico } from "@/services/productos.service";

interface ItemCarrito {
  producto: ProductoPublico;
  cantidad: number;
}

export function NuevaVentaPanel({
  numeroProximoInicial,
  productosIniciales,
  clientesIniciales,
}: {
  numeroProximoInicial: string;
  productosIniciales: ProductoPublico[];
  clientesIniciales: ClientePublico[];
}) {
  const router = useRouter();
  const productoInputRef = useRef<HTMLInputElement>(null);

  // Zona 1: Comprador
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClientePublico | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosClientes, setResultadosClientes] =
    useState<ClientePublico[]>(clientesIniciales);
  const [indiceCliente, setIndiceCliente] = useState(0);
  const [nuevoClienteOpen, setNuevoClienteOpen] = useState(false);

  // Zona 2: Ítems
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [resultadosProductos, setResultadosProductos] =
    useState<ProductoPublico[]>(productosIniciales);
  const [indiceProducto, setIndiceProducto] = useState(0);
  const [cantidadAgregar, setCantidadAgregar] = useState("1");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Zona 3: Forma de pago
  const [formaPago, setFormaPago] = useState<FormaPago>("contado");
  const [montoRecibido, setMontoRecibido] = useState<number | null>(null);
  const [tarjetaTipo, setTarjetaTipo] = useState<TipoTarjeta>("debito");
  const [tarjetaMarca, setTarjetaMarca] = useState("");
  const [tarjetaUltimos4, setTarjetaUltimos4] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Búsqueda en vivo de clientes contra /api/clientes
  useEffect(() => {
    const q = busquedaCliente.trim();
    if (!q) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/clientes?q=${encodeURIComponent(q)}&activo=true&pageSize=8`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const json = await res.json();
        setResultadosClientes(json.data ?? []);
        setIndiceCliente(0);
      } catch {
        // Petición cancelada o error transitorio
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busquedaCliente]);

  // Búsqueda en vivo de productos contra /api/productos
  useEffect(() => {
    const q = busquedaProducto.trim();
    if (!q) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/productos?q=${encodeURIComponent(q)}&activo=true&pageSize=8`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const json = await res.json();
        setResultadosProductos(json.data ?? []);
        setIndiceProducto(0);
      } catch {
        // Petición cancelada o error transitorio
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busquedaProducto]);

  const clientesMostrados = busquedaCliente.trim()
    ? resultadosClientes
    : clientesIniciales;
  const productosMostrados = busquedaProducto.trim()
    ? resultadosProductos
    : productosIniciales;

  const total = carrito.reduce(
    (acc, item) => acc + item.producto.precio * item.cantidad,
    0
  );

  function agregarProductoAlCarrito(producto: ProductoPublico) {
    setErrorGeneral(null);

    if (producto.existencia <= 0) {
      toast.error(`${producto.codigo} no tiene existencia disponible.`);
      return;
    }

    const cantNum = /^\d+$/.test(cantidadAgregar.trim())
      ? Number.parseInt(cantidadAgregar.trim(), 10)
      : 1;
    const cantidadASumar = Math.max(1, cantNum);

    const existente = carrito.find((i) => i.producto.id === producto.id);
    const nuevaCantidad = (existente?.cantidad ?? 0) + cantidadASumar;

    if (nuevaCantidad > producto.existencia) {
      toast.error(
        `Stock insuficiente para ${producto.codigo}: disponible ${producto.existencia} u.`
      );
      return;
    }

    setCarrito((prev) => {
      const yaExiste = prev.some((i) => i.producto.id === producto.id);
      if (yaExiste) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, producto, cantidad: i.cantidad + cantidadASumar }
            : i
        );
      }
      return [...prev, { producto, cantidad: cantidadASumar }];
    });

    setBusquedaProducto("");
    setCantidadAgregar("1");
    productoInputRef.current?.focus();
  }

  function actualizarCantidadItem(productoId: number, nuevaCantidad: number) {
    setErrorGeneral(null);
    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 1) return;

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.producto.id !== productoId) return item;
        if (nuevaCantidad > item.producto.existencia) {
          toast.error(
            `Máximo disponible para ${item.producto.codigo}: ${item.producto.existencia} u.`
          );
          return { ...item, cantidad: item.producto.existencia };
        }
        return { ...item, cantidad: nuevaCantidad };
      })
    );
  }

  function quitarItem(productoId: number) {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId));
  }

  const excedeLimite =
    formaPago === "cuenta_corriente" &&
    clienteSeleccionado !== null &&
    clienteSeleccionado.cuentaCorriente &&
    clienteSeleccionado.limiteCredito !== null &&
    clienteSeleccionado.saldo + total > clienteSeleccionado.limiteCredito;

  const vuelto =
    formaPago === "contado" && montoRecibido !== null
      ? montoRecibido - total
      : 0;

  async function confirmarVenta() {
    if (enviando) return;
    setErrorGeneral(null);
    setFieldErrors({});

    const payload = {
      clienteId: clienteSeleccionado ? clienteSeleccionado.id : null,
      items: carrito.map((i) => ({
        productoId: i.producto.id,
        cantidad: i.cantidad,
      })),
      pago:
        formaPago === "contado"
          ? {
              forma: "contado" as const,
              montoRecibido: montoRecibido ?? total,
            }
          : formaPago === "tarjeta"
            ? {
                forma: "tarjeta" as const,
                tarjeta: {
                  tipo: tarjetaTipo,
                  marca: tarjetaMarca.trim(),
                  ultimos4: tarjetaUltimos4.trim(),
                },
              }
            : {
                forma: "cuenta_corriente" as const,
              },
    };

    const parsed = emitirFacturaSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      let firstMsg: string | null = null;
      for (const issue of parsed.error.issues) {
        const campo = issue.path.map(String).join(".");
        if (campo) errs[campo] = issue.message;
        if (!firstMsg) firstMsg = issue.message;
      }
      setFieldErrors(errs);
      setErrorGeneral(firstMsg ?? "Revisá los datos de la venta.");
      toast.error(firstMsg ?? "Revisá los datos de la venta.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await res.json();

      if (!res.ok) {
        const msg = body?.error?.message ?? "No se pudo emitir la factura.";
        setErrorGeneral(msg);
        if (Array.isArray(body?.error?.details)) {
          const errs: Record<string, string> = {};
          for (const d of body.error.details) {
            if (d?.campo && d?.mensaje) errs[d.campo] = d.mensaje;
          }
          setFieldErrors(errs);
        }
        toast.error(msg);
        return;
      }

      toast.success(`Factura ${body.numeroFormateado} emitida correctamente.`);
      router.push(`/ventas/${body.id}`);
      router.refresh();
    } catch {
      setErrorGeneral("Error de conexión al confirmar la venta.");
      toast.error("Error de conexión al confirmar la venta.");
    } finally {
      setEnviando(false);
    }
  }

  // Atajos de teclado globales en mostrador: F2 busca producto, Ctrl+Enter confirma
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        productoInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void confirmarVenta();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <Stack gap="lg">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Stack gap="lg" className="xl:col-span-2">
          {/* ZONA 1: COMPRADOR */}
          <Card>
            <CardHeader>
              <Row justify="between" align="center" wrap gap="sm">
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="size-4" />
                  1. Comprador
                </CardTitle>
                <Row gap="xs" wrap>
                  {clienteSeleccionado ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setClienteSeleccionado(null)}
                    >
                      Usar Consumidor final
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setNuevoClienteOpen(true)}
                  >
                    <UserPlus className="size-3.5" />
                    Nuevo cliente
                  </Button>
                </Row>
              </Row>
            </CardHeader>
            <CardContent className="space-y-3">
              {clienteSeleccionado ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <Row justify="between" align="center" wrap gap="sm">
                    <Stack gap="xs">
                      <Row gap="xs" align="center">
                        <UserCheck className="size-4 text-primary" />
                        <Text className="font-semibold">
                          {clienteSeleccionado.nombre}
                        </Text>
                      </Row>
                      <Text variant="small">
                        {clienteSeleccionado.tipoDoc}{" "}
                        {clienteSeleccionado.nroDoc}
                        {clienteSeleccionado.domicilio
                          ? ` · ${clienteSeleccionado.domicilio}`
                          : ""}
                      </Text>
                    </Stack>

                    <Stack gap="xs" className="sm:text-right">
                      {clienteSeleccionado.cuentaCorriente ? (
                        <>
                          <StatusBadge
                            variant={
                              clienteSeleccionado.saldo > 0 ? "deuda" : "al_dia"
                            }
                            label={`Saldo: ${formatearMoneda(clienteSeleccionado.saldo)}`}
                          />
                          <Text variant="small">
                            {clienteSeleccionado.limiteCredito !== null
                              ? `Disponible: ${formatearMoneda(clienteSeleccionado.disponible ?? 0)}`
                              : "Cuenta corriente sin límite"}
                          </Text>
                        </>
                      ) : (
                        <Text variant="small">Sin cuenta corriente</Text>
                      )}
                    </Stack>
                  </Row>
                </div>
              ) : (
                <Row
                  justify="between"
                  align="center"
                  className="rounded-lg border bg-muted/20 px-3 py-2"
                >
                  <Text className="font-medium">Consumidor final</Text>
                  <Text variant="small">
                    Buscá un cliente abajo o continuá sin datos.
                  </Text>
                </Row>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar cliente por nombre o DNI/CUIT..."
                  className="pl-8"
                  value={busquedaCliente}
                  onChange={(e) => {
                    setBusquedaCliente(e.target.value);
                    setIndiceCliente(0);
                  }}
                  onKeyDown={(e) => {
                    if (clientesMostrados.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setIndiceCliente((i) =>
                        Math.min(clientesMostrados.length - 1, i + 1)
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setIndiceCliente((i) => Math.max(0, i - 1));
                    } else if (e.key === "Enter" && busquedaCliente.trim()) {
                      e.preventDefault();
                      const elegido = clientesMostrados[indiceCliente];
                      if (elegido) {
                        setClienteSeleccionado(elegido);
                        setBusquedaCliente("");
                      }
                    }
                  }}
                />
              </div>

              {busquedaCliente.trim() ? (
                <div className="max-h-44 overflow-y-auto rounded-lg border divide-y">
                  {clientesMostrados.length === 0 ? (
                    <div className="p-3">
                      <Text variant="small">
                        Sin clientes coincidentes. Podés crear uno con «Nuevo
                        cliente».
                      </Text>
                    </div>
                  ) : (
                    clientesMostrados.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClienteSeleccionado(c);
                          setBusquedaCliente("");
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                          idx === indiceCliente && "bg-muted/80"
                        )}
                      >
                        <span>
                          <strong>{c.nombre}</strong>{" "}
                          <span className="text-xs text-muted-foreground">
                            ({c.tipoDoc} {c.nroDoc})
                          </span>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.cuentaCorriente ? "Cta. Cte." : "Solo contado/tarj."}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ZONA 2: ÍTEMS */}
          <Card>
            <CardHeader>
              <Row justify="between" align="center" wrap gap="sm">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="size-4" />
                  2. Ítems de la venta
                </CardTitle>
                <Text variant="small">
                  F2 para buscar · Enter para agregar rápido
                </Text>
              </Row>
            </CardHeader>
            <CardContent className="space-y-4">
              <Row gap="sm" wrap align="center">
                <div className="relative min-w-56 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={productoInputRef}
                    type="search"
                    autoFocus
                    placeholder="Buscar producto por código o descripción..."
                    className="pl-8"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value);
                      setIndiceProducto(0);
                    }}
                    onKeyDown={(e) => {
                      if (productosMostrados.length === 0) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setIndiceProducto((i) =>
                          Math.min(productosMostrados.length - 1, i + 1)
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setIndiceProducto((i) => Math.max(0, i - 1));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const elegido = productosMostrados[indiceProducto];
                        if (elegido) agregarProductoAlCarrito(elegido);
                      }
                    }}
                  />
                </div>

                <Input
                  type="number"
                  min={1}
                  step={1}
                  aria-label="Cantidad a agregar"
                  className="w-22 text-right font-mono"
                  value={cantidadAgregar}
                  onChange={(e) => setCantidadAgregar(e.target.value)}
                />
              </Row>

              <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
                {productosMostrados.length === 0 ? (
                  <div className="p-3">
                    <Text variant="small">
                      No se encontraron productos activos.
                    </Text>
                  </div>
                ) : (
                  productosMostrados.map((p, idx) => (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 text-sm",
                        idx === indiceProducto && "bg-muted/60"
                      )}
                    >
                      <Stack gap="xs" className="min-w-0">
                        <Row gap="xs" align="center" wrap>
                          <Text variant="mono" className="text-xs font-semibold">
                            {p.codigo}
                          </Text>
                          <Text className="truncate font-medium">
                            {p.descripcion}
                          </Text>
                        </Row>
                        <Text variant="small">
                          Stock disp:{" "}
                          <strong
                            className={
                              p.existencia <= 0
                                ? "text-destructive"
                                : "text-foreground"
                            }
                          >
                            {p.existencia} u.
                          </strong>{" "}
                          · {formatearMoneda(p.precio)}
                        </Text>
                      </Stack>

                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={p.existencia <= 0}
                        onClick={() => agregarProductoAlCarrito(p)}
                      >
                        <Plus className="size-3.5" />
                        Agregar
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {carrito.length === 0 ? (
                <EmptyState
                  title="Todavía no agregaste productos"
                  description="Buscá un producto arriba y presioná Enter o Agregar para sumarlo a la factura."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio unit.</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Quitar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carrito.map(({ producto, cantidad }) => (
                      <TableRow key={producto.id}>
                        <TableCell>
                          <Stack gap="xs">
                            <Text className="font-medium">
                              {producto.descripcion}
                            </Text>
                            <Text variant="small">
                              {producto.codigo} · Disp: {producto.existencia} u.
                            </Text>
                          </Stack>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatearMoneda(producto.precio)}
                        </TableCell>
                        <TableCell>
                          <Row justify="center" gap="xs">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-xs"
                              disabled={cantidad <= 1}
                              onClick={() =>
                                actualizarCantidadItem(
                                  producto.id,
                                  cantidad - 1
                                )
                              }
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="size-3" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              max={producto.existencia}
                              value={cantidad}
                              onChange={(e) => {
                                const val = Number.parseInt(e.target.value, 10);
                                if (!Number.isNaN(val)) {
                                  actualizarCantidadItem(producto.id, val);
                                }
                              }}
                              className="h-7 w-16 text-center font-mono"
                              aria-label={`Cantidad de ${producto.descripcion}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-xs"
                              disabled={cantidad >= producto.existencia}
                              onClick={() =>
                                actualizarCantidadItem(
                                  producto.id,
                                  cantidad + 1
                                )
                              }
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="size-3" />
                            </Button>
                          </Row>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          {formatearMoneda(producto.precio * cantidad)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => quitarItem(producto.id)}
                            aria-label={`Quitar ${producto.descripcion}`}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* ZONA 3: FORMA DE PAGO Y CONFIRMACIÓN */}
        <Stack gap="lg">
          <Card className="sticky top-20">
            <CardHeader>
              <Row justify="between" align="center">
                <CardTitle>3. Forma de pago</CardTitle>
                <Text variant="mono" className="text-xs text-muted-foreground">
                  Próx. {numeroProximoInicial}
                </Text>
              </Row>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <Stack gap="xs">
                  <Text variant="label">Total a cobrar</Text>
                  <Text variant="mono" className="text-3xl font-semibold">
                    {formatearMoneda(total)}
                  </Text>
                  <Text variant="small">
                    {carrito.length}{" "}
                    {carrito.length === 1 ? "renglón" : "renglones"} ·{" "}
                    {carrito.reduce((a, b) => a + b.cantidad, 0)} unidades
                  </Text>
                </Stack>
              </div>

              <Grid cols={3} gap="xs">
                <Button
                  type="button"
                  size="sm"
                  variant={formaPago === "contado" ? "default" : "outline"}
                  onClick={() => setFormaPago("contado")}
                >
                  <Banknote className="size-4" />
                  Contado
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formaPago === "tarjeta" ? "default" : "outline"}
                  onClick={() => setFormaPago("tarjeta")}
                >
                  <CreditCard className="size-4" />
                  Tarjeta
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    formaPago === "cuenta_corriente" ? "default" : "outline"
                  }
                  onClick={() => setFormaPago("cuenta_corriente")}
                >
                  <Wallet className="size-4" />
                  Cta. Cte.
                </Button>
              </Grid>

              <Separator />

              {formaPago === "contado" ? (
                <Stack gap="sm">
                  <FormField
                    id="venta-monto-recibido"
                    label="Monto recibido"
                    error={fieldErrors["pago.montoRecibido"]}
                    hint="Dejalo vacío para cobrar el importe exacto."
                  >
                    <Row gap="xs">
                      <div className="flex-1">
                        <CurrencyInput
                          id="venta-monto-recibido"
                          valueCentavos={montoRecibido}
                          onChangeCentavos={setMontoRecibido}
                          disabled={enviando}
                        />
                      </div>
                      {total > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMontoRecibido(total)}
                        >
                          Exacto
                        </Button>
                      ) : null}
                    </Row>
                  </FormField>

                  {montoRecibido !== null && total > 0 ? (
                    <div className="rounded-lg border bg-muted/30 px-3 py-2">
                      <Row justify="between" align="center">
                        <Text variant="small">
                          {vuelto >= 0 ? "Vuelto" : "Faltante"}
                        </Text>
                        <Text
                          variant="mono"
                          className={
                            vuelto >= 0
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-destructive"
                          }
                        >
                          {formatearMoneda(Math.abs(vuelto))}
                        </Text>
                      </Row>
                    </div>
                  ) : null}
                </Stack>
              ) : null}

              {formaPago === "tarjeta" ? (
                <Stack gap="sm">
                  <FormField
                    id="venta-tarjeta-tipo"
                    label="Tipo de tarjeta"
                    required
                    error={fieldErrors["pago.tarjeta.tipo"]}
                  >
                    <Select
                      value={tarjetaTipo}
                      onValueChange={(v) => {
                        if (v === "debito" || v === "credito") {
                          setTarjetaTipo(v);
                        }
                      }}
                      disabled={enviando}
                    >
                      <SelectTrigger id="venta-tarjeta-tipo" className="w-full">
                        <SelectValue>
                          {tarjetaTipo === "debito" ? "Débito" : "Crédito"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debito">Débito</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    id="venta-tarjeta-marca"
                    label="Marca"
                    required
                    error={fieldErrors["pago.tarjeta.marca"]}
                  >
                    <Input
                      id="venta-tarjeta-marca"
                      placeholder="Ej. Visa, Mastercard, Cabal..."
                      value={tarjetaMarca}
                      disabled={enviando}
                      onChange={(e) => setTarjetaMarca(e.target.value)}
                    />
                  </FormField>

                  <FormField
                    id="venta-tarjeta-ultimos4"
                    label="Últimos 4 dígitos"
                    required
                    error={fieldErrors["pago.tarjeta.ultimos4"]}
                    hint="Por seguridad nunca ingreses el número completo."
                  >
                    <Input
                      id="venta-tarjeta-ultimos4"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      className="font-mono"
                      value={tarjetaUltimos4}
                      disabled={enviando}
                      onChange={(e) =>
                        setTarjetaUltimos4(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                    />
                  </FormField>
                </Stack>
              ) : null}

              {formaPago === "cuenta_corriente" ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  {!clienteSeleccionado ? (
                    <Text variant="small" className="font-medium text-destructive">
                      Consumidor final no puede operar en cuenta corriente.
                      Seleccioná o creá un cliente habilitado.
                    </Text>
                  ) : !clienteSeleccionado.cuentaCorriente ? (
                    <Text variant="small" className="font-medium text-destructive">
                      {clienteSeleccionado.nombre} no tiene cuenta corriente
                      habilitada.
                    </Text>
                  ) : (
                    <Stack gap="xs">
                      <Row justify="between">
                        <Text variant="small">Saldo actual</Text>
                        <Text variant="mono" className="text-xs">
                          {formatearMoneda(clienteSeleccionado.saldo)}
                        </Text>
                      </Row>
                      <Row justify="between">
                        <Text variant="small">Saldo proyectado</Text>
                        <Text
                          variant="mono"
                          className={
                            excedeLimite
                              ? "text-xs font-semibold text-destructive"
                              : "text-xs font-semibold"
                          }
                        >
                          {formatearMoneda(clienteSeleccionado.saldo + total)}
                        </Text>
                      </Row>
                      {excedeLimite ? (
                        <Text
                          variant="small"
                          className="font-medium text-destructive"
                        >
                          Supera el límite de crédito (
                          {formatearMoneda(
                            clienteSeleccionado.limiteCredito ?? 0
                          )}
                          ).
                        </Text>
                      ) : null}
                    </Stack>
                  )}
                </div>
              ) : null}

              {errorGeneral ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                  <Text variant="small" className="font-medium text-destructive">
                    {errorGeneral}
                  </Text>
                </div>
              ) : null}

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={enviando || carrito.length === 0}
                onClick={confirmarVenta}
              >
                <CheckCircle2 className="size-4" />
                {enviando ? "Confirmando factura..." : "Confirmar venta"}
              </Button>
              <Text variant="small" className="text-center">
                Atajo: Ctrl + Enter para confirmar
              </Text>
            </CardContent>
          </Card>
        </Stack>
      </div>

      {nuevoClienteOpen ? (
        <ClienteFormDialog
          open={nuevoClienteOpen}
          onOpenChange={setNuevoClienteOpen}
          clienteEditar={null}
          onSaved={(nuevo) => {
            setClienteSeleccionado(nuevo);
            setBusquedaCliente("");
          }}
        />
      ) : null}
    </Stack>
  );
}
