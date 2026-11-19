"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Row, Text } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(total, page * pageSize);

  function irAPagina(nuevaPagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nuevaPagina <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nuevaPagina));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Row
      justify="between"
      align="center"
      wrap
      gap="sm"
      className="border-t border-border pt-4"
    >
      <Text variant="small" className="tabular-nums">
        Mostrando {desde}–{hasta} de {total} registros
      </Text>
      <Row gap="sm" align="center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => irAPagina(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Text variant="small" className="px-1 font-medium tabular-nums text-foreground">
          Página {page} de {totalPages}
        </Text>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => irAPagina(page + 1)}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </Row>
    </Row>
  );
}
