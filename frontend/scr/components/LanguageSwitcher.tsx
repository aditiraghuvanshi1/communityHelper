// Language picker: a compact dropdown for the header ("menu") or three buttons for the
// mobile sheet ("inline"). Choice is saved by the I18nProvider.
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({
  variant = "menu",
  className,
}: {
  variant?: "menu" | "inline";
  className?: string;
}) {
  const { lang, setLang, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label={t("common.language")}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            data-testid={`lang-inline-${l.code}`}
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              lang === l.code
                ? "border-[#237A62] bg-[#EAEFEA] text-[#237A62]"
                : "border-[#E2E4DC] text-[#172B3A] hover:border-[#CBD5E1]",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="language-switcher"
        aria-label={t("common.language")}
        className={cn(
          "items-center gap-1.5 rounded-lg border border-[#E2E4DC] px-2.5 py-1.5 text-sm font-medium text-[#172B3A] transition-colors duration-150 hover:border-[#CBD5E1]",
          className ?? "flex",
        )}
      >
        <Globe className="size-4 text-[#237A62]" />
        <span>{current.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} data-testid={`lang-option-${l.code}`} onClick={() => setLang(l.code)}>
            <span className="flex-1">{l.label}</span>
            {lang === l.code && <Check className="size-4 text-[#237A62]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
