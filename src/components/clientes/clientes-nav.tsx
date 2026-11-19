import Link from "next/link";
import { Users, Wallet } from "lucide-react";
import { cn } from "cn";
import { Row } from "@/components/layout/primitives";

export function ClientesNav({
  tabActiva,
}: {
  tabActiva: "listado" | "saldos";
}) {
  const items = [
    {
      id: "listado" as const,
      href: "/clientes",
      label: "Listado",
      icon: Users,
    },
    {
      id: "saldos" as const,
      href: "/clientes/saldos",
      label: "Saldos",
      icon: Wallet,
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
