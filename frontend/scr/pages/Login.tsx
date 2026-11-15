// Sign in — branded split layout with one-tap demo credential fill for reviewers.
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Landmark, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import { useLanguage } from "@/lib/language-context";
import { useMe } from "@/lib/useAuth";
import type { User } from "@/lib/types";

const DEMO_ACCOUNTS = [
  { role: "Administrator", email: "admin@civicconnect.app", password: "Admin@1234" },
  { role: "Citizen", email: "citizen@civicconnect.app", password: "Citizen@1234" },
];

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "";
  const { data: user } = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError(t("Enter your email and password"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const signedIn = await apiPost<User>("/auth/login", { email: email.trim(), password });
      beginSession(signedIn);
      toast.success(`Welcome back, ${signedIn.name.split(" ")[0]}`);
      navigate(next || (signedIn.role === "admin" ? "/admin" : "/"), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? t("Invalid email or password")
          : t("Sign in failed — check your connection and try again"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between rounded-2xl bg-[#172B3A] p-10 lg:flex">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#237A62] text-white">
              <Landmark className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold text-white">CivicConnect</span>
          </Link>
          <h2 className="mt-14 font-heading text-3xl font-bold leading-snug text-white">
            {t("Welcome back to the record.")}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9FB2BA]">
            {t("Sign in to report new issues, support your neighbours' complaints and follow the official timeline on everything you have reported.")}
          </p>
        </div>
        <ul className="space-y-3 text-sm text-[#CBD5E1]">
          {["Track every complaint you filed", "Support issues in your locality", "See admin remarks the moment they land"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#E6A34A]" /> {t(item)}
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <div className="flex items-center">
        <Card className="w-full">
          <CardContent className="p-6 sm:p-8">
            <h1 className="font-heading text-xl font-bold text-[#172B3A]">{t("Sign in")}</h1>
            <p className="mt-1 text-sm text-[#52656F]">{t("Use your CivicConnect account.")}</p>
            {user && (
              <p className="mt-3 rounded-lg bg-[#EAEFEA] px-3 py-2 text-xs text-[#237A62]">
                {t("You are already signed in as")} {user.name} — {t("proceeding will switch accounts.")}
              </p>
            )}
            <form onSubmit={submit} className="mt-6 space-y-4" data-testid="login-form">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("Email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  data-testid="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("Password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("Your password")}
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#991B1B]" data-testid="login-error">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy} data-testid="login-submit">
                <LogIn className="size-4" /> {busy ? t("Signing in…") : t("Sign in")}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-[#E2E4DC] bg-[#EAECE4] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#52656F]">
                <Lock className="size-3.5" /> {t("Demo accounts")}
              </p>
              <div className="mt-2 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <div key={account.email} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#52656F]">
                      <strong className="text-[#172B3A]">{account.role}</strong> · {account.email}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      data-testid={`login-fill-${account.role.toLowerCase()}`}
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                      }}
                    >
                      {t("Fill")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-[#52656F]">
              {t("New here?")}{" "}
              <Link to={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-[#237A62] hover:underline" data-testid="login-to-register">
                {t("Create an account")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
