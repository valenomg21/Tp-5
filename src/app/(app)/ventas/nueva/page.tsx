import { redirect } from "next/navigation";
import { Stack } from "@/components/layout/primitives";
import { PageHeader } from "@/components/shared/page-header";
import { NuevaVentaPanel } from "@/components/ventas/nueva-venta-panel";
import { VentasNav } from "@/components/ventas/ventas-nav";
import { obtenerUsuarioActual } from "@/lib/session";
import { listarClientes } from "@/services/clientes.service";
import { obtenerProximoNumero } from "@/services/facturas.service";
import { listarProductos } from "@/services/productos.service";

export default async function NuevaVentaPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const [proximo, productosRes, clientesRes] = await Promise.all([
    obtenerProximoNumero(usuario),
    listarProductos(usuario, { activo: "true", page: 1, pageSize: 8 }),
    listarClientes(usuario, { activo: "true", page: 1, pageSize: 8 }),
  ]);

  return (
    <Stack gap="lg">
      <PageHeader
        title="Ventas y facturación"
        description="Mostrador ágil: identificá al comprador, agregá productos y elegí la forma de pago."
      />

      <VentasNav tabActiva="nueva" />

      <NuevaVentaPanel
        numeroProximoInicial={proximo.numeroFormateado}
        productosIniciales={productosRes.data}
        clientesIniciales={clientesRes.data}
      />
    </Stack>
  );
}
