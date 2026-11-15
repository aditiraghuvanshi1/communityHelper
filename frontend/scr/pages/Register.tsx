// Registration — every new account is a citizen; admin roles are granted server-side only.
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Landmark, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t("Enter your full name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t("Enter a valid email address");
    if (password.length < 8) next.password = t("Use at least 8 characters");
    if (password !== confirm) next.confirm = t("Passwords do not match");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const created = await apiPost<User>("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      beginSession(created);
      toast.success(`Welcome to CivicConnect, ${created.name.split(" ")[0]}`);
      navigate(next || "/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: t("An account with this email already exists — sign in instead") });
      } else if (err instanceof ApiError) {
        setErrors({ form: t("Could not create the account — check the details and try again") });
      } else {
        setErrors({ form: t("Something went wrong — please try again") });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="hidden flex-col justify-between rounded-2xl bg-[#237A62] p-10 lg:flex">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#172B3A] text-white">
              <Landmark className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold text-white">CivicConnect</span>
          </Link>
          <h2 className="mt-14 font-heading text-3xl font-bold leading-snug text-white">
            {t("Two minutes to join. Every report after that counts.")}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#EAEFEA]">
            {t("One account covers it all: pin issues on the map, add photos, support neighbours' complaints and watch the ward office respond — with every status change on your record.")}
          </p>
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-[#EAEFEA]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          {t("Your email is used only for account access and never shown publicly on complaints. Reports display your display name, nothing else.")}
        </p>
      </div>

      <div className="flex items-center">
        <Card className="w-full">
          <CardContent className="p-6 sm:p-8">
            <h1 className="font-heading text-xl font-bold text-[#172B3A]">{t("Create your account")}</h1>
            <p className="mt-1 text-sm text-[#52656F]">{t("Free, and built for your locality.")}</p>
            <form onSubmit={submit} className="mt-6 space-y-4" data-testid="register-form">
              <div className="space-y-1.5">
                <Label htmlFor="register-name">{t("Full name")}</Label>
                <Input
                  id="register-name"
                  data-testid="register-name-input"
                  placeholder="e.g. Arjun Rao"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-xs font-medium text-[#C2410C]">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-email">{t("Email")}</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  data-testid="register-email-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-xs font-medium text-[#C2410C]" data-testid="register-email-error">{errors.email}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="register-password">{t("Password")}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    data-testid="register-password-input"
                    placeholder="8+ characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && <p className="text-xs font-medium text-[#C2410C]">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-confirm">{t("Confirm password")}</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    autoComplete="new-password"
                    data-testid="register-confirm-input"
                    placeholder={t("Repeat it")}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {errors.confirm && <p className="text-xs font-medium text-[#C2410C]">{errors.confirm}</p>}
                </div>
              </div>
              {errors.form && (
                <p className="rounded-lg bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#991B1B]" data-testid="register-error">
                  {errors.form}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy} data-testid="register-submit">
                <UserPlus className="size-4" /> {busy ? t("Creating account…") : t("Create account")}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[#52656F]">
              {t("Already registered?")}{" "}
              <Link to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-[#237A62] hover:underline" data-testid="register-to-login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
