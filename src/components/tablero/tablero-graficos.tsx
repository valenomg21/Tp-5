"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { BarChart3, PieChart } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Grid } from "@/components/layout/primitives";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatearFormaPago, formatearMoneda } from "@/lib/format";
import type { FormaPago } from "@/lib/schemas/facturas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const COLOR_BARRAS = "rgba(30, 58, 95, 0.86)";
const COLOR_BARRAS_HOVER = "#1e3a5f";
const COLORES_FORMAS_PAGO: Record<FormaPago, string> = {
  contado: "#1e3a5f",
  tarjeta: "#0284c7",
  cuenta_corriente: "#d97706",
};

function formatearEtiquetaDiaCorto(fechaISO: string): string {
  const [, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}`;
}

function formatearEjePesos(centavos: number): string {
  const pesos = Math.round(centavos / 100);
  const textoMiles = pesos
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$ ${textoMiles}`;
}

export function TableroGraficos({
  ventasDiarias,
  porFormaDePago,
}: {
  ventasDiarias: { fecha: string; importe: number }[];
  porFormaDePago: { forma: FormaPago; importe: number }[];
}) {
  const total30Dias = ventasDiarias.reduce((acc, item) => acc + item.importe, 0);
  const totalMesPorForma = porFormaDePago.reduce(
    (acc, item) => acc + item.importe,
    0
  );

  const dataBarras: ChartData<"bar"> = {
    labels: ventasDiarias.map((d) => formatearEtiquetaDiaCorto(d.fecha)),
    datasets: [
      {
        label: "Ventas diarias",
        data: ventasDiarias.map((d) => d.importe),
        backgroundColor: COLOR_BARRAS,
        hoverBackgroundColor: COLOR_BARRAS_HOVER,
        borderRadius: 4,
        maxBarThickness: 22,
      },
    ],
  };

  const opcionesBarras: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            const fecha = ventasDiarias[idx]?.fecha;
            if (!fecha) return "";
            const [y, m, d] = fecha.split("-");
            return `${d}/${m}/${y}`;
          },
          label: (ctx) => {
            const valor = Number(ctx.parsed.y ?? 0);
            return `Total: ${formatearMoneda(valor)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          color: "#64748b",
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.2)",
        },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          callback: (value) => formatearEjePesos(Number(value)),
        },
      },
    },
  };

  const dataTorta: ChartData<"doughnut"> = {
    labels: porFormaDePago.map((item) => formatearFormaPago(item.forma)),
    datasets: [
      {
        data: porFormaDePago.map((item) => item.importe),
        backgroundColor: porFormaDePago.map(
          (item) => COLORES_FORMAS_PAGO[item.forma]
        ),
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const opcionesTorta: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 16,
          color: "#334155",
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const valor = Number(ctx.parsed ?? 0);
            const pct =
              totalMesPorForma > 0
                ? ((valor / totalMesPorForma) * 100).toFixed(1)
                : "0.0";
            return `${ctx.label}: ${formatearMoneda(valor)} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <Grid cols={2} gap="lg">
      <Card>
        <CardHeader>
          <CardTitle>Ventas diarias (últimos 30 días)</CardTitle>
          <CardDescription>
            Facturación emitida por día en horario de Argentina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total30Dias > 0 ? (
            <div className="relative h-72 w-full">
              <Bar data={dataBarras} options={opcionesBarras} />
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="size-5" />}
              title="Sin ventas en los últimos 30 días"
              description="Cuando emitas facturas vas a ver la evolución diaria de la facturación."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventas del mes por forma de pago</CardTitle>
          <CardDescription>
            Distribución entre contado, tarjeta y cuenta corriente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalMesPorForma > 0 ? (
            <div className="relative h-72 w-full">
              <Doughnut data={dataTorta} options={opcionesTorta} />
            </div>
          ) : (
            <EmptyState
              icon={<PieChart className="size-5" />}
              title="Sin ventas en el mes actual"
              description="Todavía no hay facturas emitidas durante el mes en curso."
            />
          )}
        </CardContent>
      </Card>
    </Grid>
  );
}
