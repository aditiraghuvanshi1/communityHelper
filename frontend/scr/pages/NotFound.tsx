import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/lib/language-context";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={Compass}
        title={t("Page not found")}
        description={t("The page you were looking for doesn't exist. The map and every complaint are still right where you left them.")}
        action={<Button render={<Link to="/" />}>{t("Back to the homepage")}</Button>}
      />
    </div>
  );
}
