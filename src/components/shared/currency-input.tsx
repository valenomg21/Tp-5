"use client";

import { useState } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { parsearMonedaACentavos } from "@/lib/format";

function centavosATextoEditable(centavos: number | null): string {
  if (centavos === null) return "";
  const entero = Math.trunc(centavos);
  const abs = Math.abs(entero);
  const pesos = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, "0");
  return `${entero < 0 ? "-" : ""}${pesos},${cents}`;
}

export function CurrencyInput({
  id,
  valueCentavos,
  onChangeCentavos,
  placeholder = "0,00",
  disabled = false,
  invalid = false,
  className,
}: {
  id?: string;
  valueCentavos: number | null;
  onChangeCentavos: (centavos: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [texto, setTexto] = useState<string>(() =>
    centavosATextoEditable(valueCentavos)
  );
  const [enfocado, setEnfocado] = useState(false);

  const valorMostrado = enfocado
    ? texto
    : centavosATextoEditable(valueCentavos);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={valorMostrado}
        onFocus={() => {
          setTexto(centavosATextoEditable(valueCentavos));
          setEnfocado(true);
        }}
        onChange={(e) => {
          const nuevoTexto = e.target.value;
          setTexto(nuevoTexto);
          if (!nuevoTexto.trim()) {
            onChangeCentavos(null);
            return;
          }
          const centavos = parsearMonedaACentavos(nuevoTexto);
          if (centavos !== null) {
            onChangeCentavos(centavos);
          }
        }}
        onBlur={() => {
          setEnfocado(false);
          const centavos = parsearMonedaACentavos(texto);
          if (centavos !== null) {
            onChangeCentavos(centavos);
            setTexto(centavosATextoEditable(centavos));
          } else if (!texto.trim()) {
            onChangeCentavos(null);
            setTexto("");
          }
        }}
        className={cn("pl-7 text-right font-mono tabular-nums", className)}
      />
    </div>
  );
}
