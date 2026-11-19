"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action-handler";
import type { ErrorFieldDetail } from "@/lib/errors";

interface UseFormActionOptions<TInput, TOutput> {
  schema?: z.ZodType<TInput>;
  action: (values: TInput) => Promise<ActionResult<TOutput>>;
  onSuccess?: (data: TOutput) => void;
  successMessage?: string;
}

export function useFormAction<TInput, TOutput>({
  schema,
  action,
  onSuccess,
  successMessage,
}: UseFormActionOptions<TInput, TOutput>) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function clearErrors() {
    setFieldErrors({});
    setFormError(null);
  }

  function setFieldError(campo: string, mensaje: string) {
    setFieldErrors((prev) => ({ ...prev, [campo]: mensaje }));
  }

  function clearFieldError(campo: string) {
    setFieldErrors((prev) => {
      if (!(campo in prev)) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  }

  function submit(rawValues: unknown) {
    clearErrors();

    let validatedValues: TInput;
    if (schema) {
      const parsed = schema.safeParse(rawValues);
      if (!parsed.success) {
        const errores: Record<string, string> = {};
        let general: string | null = null;

        for (const issue of parsed.error.issues) {
          const campo = issue.path.map(String).join(".");
          if (campo) {
            if (!errores[campo]) errores[campo] = issue.message;
          } else if (!general) {
            general = issue.message;
          }
        }

        setFieldErrors(errores);
        setFormError(general);
        return;
      }
      validatedValues = parsed.data;
    } else {
      validatedValues = rawValues as TInput;
    }

    startTransition(async () => {
      const result = await action(validatedValues);

      if (!result.ok) {
        const errores: Record<string, string> = {};
        if (Array.isArray(result.error.details)) {
          for (const item of result.error.details as Partial<ErrorFieldDetail>[]) {
            if (
              typeof item?.campo === "string" &&
              typeof item?.mensaje === "string" &&
              item.campo
            ) {
              errores[item.campo] = item.mensaje;
            }
          }
        }
        setFieldErrors(errores);
        setFormError(result.error.message);
        toast.error(result.error.message);
        return;
      }

      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(result.data);
    });
  }

  return {
    submit,
    isPending,
    fieldErrors,
    formError,
    clearErrors,
    setFieldError,
    clearFieldError,
  };
}
