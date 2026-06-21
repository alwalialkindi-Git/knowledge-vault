"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/language-provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-20 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-medium">{t("errors.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("errors.body")}</p>
      <Button className="mt-6" onClick={reset}>
        {t("errors.retry")}
      </Button>
    </div>
  );
}
