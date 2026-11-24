import { cn } from "cn";

export function PokeballIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
    >
      {/* Mitad superior roja Pokéball */}
      <path
        d="M2.5 16a13.5 13.5 0 0 1 27 0H2.5Z"
        fill="#dc2626"
      />
      {/* Mitad inferior blanca */}
      <path
        d="M29.5 16a13.5 13.5 0 0 1-27 0h27Z"
        fill="#ffffff"
      />
      {/* Franja divisoria horizontal */}
      <rect x="2" y="14.4" width="28" height="3.2" fill="#0f172a" />
      {/* Contorno circular exterior */}
      <circle
        cx="16"
        cy="16"
        r="13.5"
        stroke="#0f172a"
        strokeWidth="2.2"
      />
      {/* Botón central */}
      <circle
        cx="16"
        cy="16"
        r="4.8"
        fill="#ffffff"
        stroke="#0f172a"
        strokeWidth="2.2"
      />
      <circle
        cx="16"
        cy="16"
        r="2.1"
        fill="#f1f5f9"
        stroke="#64748b"
        strokeWidth="1"
      />
    </svg>
  );
}
