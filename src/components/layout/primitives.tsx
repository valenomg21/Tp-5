import type { ReactNode } from "react";
import { cn } from "cn";

const STACK_GAP = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

const ROW_GAP = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
} as const;

const ROW_ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const ROW_JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

const GRID_COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
} as const;

export function Stack({
  children,
  gap = "md",
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  gap?: keyof typeof STACK_GAP;
  as?: "div" | "section" | "main";
  className?: string;
}) {
  return (
    <Tag className={cn("flex flex-col", STACK_GAP[gap], className)}>
      {children}
    </Tag>
  );
}

export function Row({
  children,
  gap = "md",
  align = "center",
  justify = "start",
  wrap = false,
  className,
}: {
  children: ReactNode;
  gap?: keyof typeof ROW_GAP;
  align?: keyof typeof ROW_ALIGN;
  justify?: keyof typeof ROW_JUSTIFY;
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex",
        ROW_GAP[gap],
        ROW_ALIGN[align],
        ROW_JUSTIFY[justify],
        wrap && "flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Grid({
  children,
  cols = 2,
  gap = "md",
  className,
}: {
  children: ReactNode;
  cols?: keyof typeof GRID_COLS;
  gap?: keyof typeof STACK_GAP;
  className?: string;
}) {
  return (
    <div className={cn("grid", GRID_COLS[cols], STACK_GAP[gap], className)}>
      {children}
    </div>
  );
}

const HEADING_VARIANTS = {
  1: "text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
  2: "text-lg font-semibold tracking-tight text-foreground",
  3: "text-base font-medium text-foreground",
} as const;

export function Heading({
  children,
  level = 1,
  className,
}: {
  children: ReactNode;
  level?: keyof typeof HEADING_VARIANTS;
  className?: string;
}) {
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return (
    <Tag className={cn(HEADING_VARIANTS[level], className)}>{children}</Tag>
  );
}

const TEXT_VARIANTS = {
  default: "text-sm text-foreground",
  muted: "text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
  label: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
  mono: "font-mono text-sm tabular-nums text-foreground",
} as const;

export function Text({
  children,
  variant = "default",
  as: Tag = "p",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof TEXT_VARIANTS;
  as?: "p" | "span" | "div";
  className?: string;
}) {
  return (
    <Tag className={cn(TEXT_VARIANTS[variant], className)}>{children}</Tag>
  );
}
