import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {process.env.NEXT_PUBLIC_APP_NAME ?? "Sistema de Gestión Comercial"}
          </CardTitle>
          <CardDescription>
            Etapa 1: Base del proyecto, Drizzle ORM y utilidades compartidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Esquema relacional de 9 tablas configurado con SQLite local / Turso,
            migraciones de Drizzle y utilidades compartidas de formato, errores y
            adaptadores.
          </p>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-xs text-muted-foreground">
            Next.js App Router + Tailwind CSS + shadcn/ui
          </span>
          <Button type="button" variant="outline" size="sm" disabled>
            Acceso en Etapa 2
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
