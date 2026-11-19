import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export type StatusBadgeVariant =
  | "admin"
  | "vendedor"
  | "activo"
  | "inactivo"
  | "emitida"
  | "anulada"
  | "bajo_minimo"
  | "sin_stock"
  | "stock_ok"
  | "deuda"
  | "al_dia";

const ESTILOS_ESTADO: Record<
  StatusBadgeVariant,
  { label: string; className: string }
> = {
  admin: {
    label: "Administrador",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  vendedor: {
    label: "Vendedor",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  activo: {
    label: "Activo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  inactivo: {
    label: "Inactivo",
    className: "border-border bg-muted text-muted-foreground",
  },
  emitida: {
    label: "Emitida",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  anulada: {
    label: "Anulada",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  bajo_minimo: {
    label: "Bajo mínimo",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  sin_stock: {
    label: "Sin stock",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  stock_ok: {
    label: "Normal",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  deuda: {
    label: "Con saldo",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  al_dia: {
    label: "Al día",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

export function StatusBadge({
  variant,
  label,
  className,
}: {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
}) {
  const config = ESTILOS_ESTADO[variant];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
    >
      {label ?? config.label}
    </Badge>
  );
}
