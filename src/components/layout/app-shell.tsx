"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { logoutAction } from "@/actions/auth.actions";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UsuarioSesion } from "@/lib/session";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  soloAdmin?: boolean;
}

const MODULOS_NAVEGACION: NavItem[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/usuarios", label: "Usuarios", icon: ShieldCheck, soloAdmin: true },
];

function esRutaActiva(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  usuario,
  pathname,
  onNavigate,
}: {
  usuario: UsuarioSesion;
  pathname: string;
  onNavigate?: () => void;
}) {
  const itemsVisibles = MODULOS_NAVEGACION.filter(
    (item) => !item.soloAdmin || usuario.rol === "admin"
  );

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 p-3">
      {itemsVisibles.map((item) => {
        const Icon = item.icon;
        const activo = esRutaActiva(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              activo
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-xs"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  usuario,
  appName,
  children,
}: {
  usuario: UsuarioSesion;
  appName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function manejarSalida() {
    setSaliendo(true);
    try {
      await logoutAction();
      toast.success("Sesión cerrada.");
      router.push("/login");
      router.refresh();
    } finally {
      setSaliendo(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-4" />
          </div>
          <Stack gap="xs" className="min-w-0">
            <Text className="truncate font-semibold text-sidebar-foreground">
              {appName}
            </Text>
          </Stack>
        </div>

        <SidebarNav usuario={usuario} pathname={pathname} />

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/perfil"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              esRutaActiva(pathname, "/perfil")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <KeyRound className="size-4 shrink-0" />
            <span>Mi perfil</span>
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <Row gap="sm" align="center" className="min-w-0">
            <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="lg:hidden"
                    aria-label="Abrir menú de navegación"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-68 p-0">
                <SheetHeader className="border-b border-sidebar-border px-4 py-3.5">
                  <Row gap="sm" align="center">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Store className="size-4" />
                    </div>
                    <SheetTitle className="truncate text-sm font-semibold">
                      {appName}
                    </SheetTitle>
                  </Row>
                </SheetHeader>
                <SidebarNav
                  usuario={usuario}
                  pathname={pathname}
                  onNavigate={() => setMenuAbierto(false)}
                />
                <Separator />
                <div className="p-3">
                  <Link
                    href="/perfil"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-accent"
                  >
                    <KeyRound className="size-4 shrink-0" />
                    <span>Mi perfil</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            <Text className="truncate font-semibold lg:hidden">{appName}</Text>
          </Row>

          <Row gap="sm" align="center" className="shrink-0">
            <Link
              href="/perfil"
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-right transition-colors hover:bg-muted"
            >
              <Stack gap="xs" className="hidden text-right sm:flex">
                <Text className="text-sm leading-none font-medium">
                  {usuario.nombre}
                </Text>
                <Text variant="small" className="leading-none">
                  {usuario.email}
                </Text>
              </Stack>
              <StatusBadge variant={usuario.rol} />
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saliendo}
              onClick={manejarSalida}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">
                {saliendo ? "Saliendo..." : "Salir"}
              </span>
            </Button>
          </Row>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
