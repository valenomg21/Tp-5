import Link from "next/link";
import { PlusCircle, Receipt } from "lucide-react";
import { cn } from "cn";
import { Row } from "@/components/layout/primitives";

export function VentasNav({
  tabActiva,
}: {
  tabActiva: "facturas" | "nueva";
}) {
  const items = [
    {
      id: "facturas" as const,
      href: "/ventas",
      label: "Facturas",
      icon: Receipt,
    },
    {
      id: "nueva" as const,
      href: "/ventas/nueva",
      label: "Nueva venta",
      icon: PlusCircle,
    },
  ];

  return (
    <Row gap="xs" wrap className="border-b border-border pb-2">
      {items.map((item) => {
        const Icon = item.icon;
        const activo = tabActiva === item.id;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activo
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </Row>
  );
}
