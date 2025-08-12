import { useRouteError } from "react-router-dom";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { House } from "lucide-react";

export default function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  const is404 = error?.status === 404;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center justify-center gap-4 rounded-lg bg-content1 p-6 text-center shadow-custom">
        <h1 className="text-4xl font-semibold tracking-tight">
          {is404 ? "404" : "500"}
        </h1>
        <div className="text-sm text-default-400">
          {is404
            ? t("error.description404")
            : error?.message || t("error.description500")}
        </div>
        <Button
          as="a"
          href="/"
          color="primary"
          size="sm"
          startContent={<House className="size-4" />}
          className={
            "shadow-custom-button text-sm bg-primary bg-linear-to-b from-white/15 to-transparent border-primary border"
          }
        >
          {t("error.backToHome")}
        </Button>
      </div>
    </div>
  );
}
