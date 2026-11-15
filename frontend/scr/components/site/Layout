// App chrome: sticky header with primary nav + locality trigger + auth menu, and footer.
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LocalityPickerDialog } from "@/components/LocalityPicker";
import { useMe } from "@/lib/useAuth";
import { endSession } from "@/lib/session";
import { useLocality } from "@/lib/locality-context";
import { LANGUAGE_NAMES, useLanguage, type Language } from "@/lib/language-context";
import { cn } from "@/lib/utils";

function localityLabel(
  selection: ReturnType<typeof useLocality>["selection"],
  t: (text: string) => string,
): string {
  if (!selection) return t("Set your locality");
  return selection.locality ? `${selection.town} · ${selection.locality}` : selection.town;
}

function SiteHeader() {
  const { data: user, isLoading } = useMe();
  const { selection } = useLocality();
  const { language, setLanguage, t } = useLanguage();
  const [localityOpen, setLocalityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await endSession(navigate);
      toast("Signed out. See you soon.");
    } catch {
      toast.error("Could not sign out — check your connection and try again");
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const navItems = [
    { to: "/explore", label: t("Explore"), testid: "nav-explore" },
    { to: "/report", label: t("Report an Issue"), testid: "nav-report" },
    ...(user ? [{ to: "/dashboard", label: t("My Complaints"), testid: "nav-dashboard" }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: t("Admin"), testid: "nav-admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E4DC] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="nav-home">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#172B3A] text-white">
              <Landmark className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight text-[#172B3A]">
              CivicConnect
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={item.testid}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-[#52656F] transition-colors duration-150 hover:text-[#172B3A]",
                    isActive && "text-[#237A62]",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Language"
            data-testid="language-selector"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="h-9 max-w-24 rounded-lg border border-[#E2E4DC] bg-white px-2 text-sm text-[#172B3A] outline-none focus-visible:ring-2 focus-visible:ring-[#237A62] sm:max-w-none"
          >
            {(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => (
              <option key={code} value={code}>{LANGUAGE_NAMES[code]}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            data-testid="locality-picker-trigger"
            onClick={() => setLocalityOpen(true)}
            className="max-w-[220px]"
          >
            <MapPin className="size-4 shrink-0 text-[#237A62]" />
            <span className="truncate">{localityLabel(selection, t)}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          </Button>

          {isLoading ? (
            <div className="hidden size-9 animate-pulse rounded-full bg-muted md:block" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                data-testid="user-menu-trigger"
                className="hidden items-center gap-2 rounded-full border border-[#E2E4DC] py-1 pl-1 pr-3 transition-colors duration-150 hover:border-[#CBD5E1] md:flex"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[#237A62] text-xs font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate text-sm font-medium text-[#172B3A]">{user.name}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs font-normal text-[#52656F]">{user.email}</div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link to="/dashboard" />}>
                  <LayoutDashboard className="size-4" /> {t("My Complaints")}
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem render={<Link to="/admin" />}>
                    <ShieldCheck className="size-4" /> {t("Admin dashboard")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="signout-button"
                  disabled={signingOut}
                  onClick={() => {
                    void signOut();
                  }}
                >
                  <LogOut className="size-4" /> {signingOut ? t("Signing out…") : t("Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" render={<Link to="/login" />} data-testid="nav-login">
                {t("Sign in")}
              </Button>
              <Button size="sm" render={<Link to="/register" />} data-testid="nav-register">
                {t("Get started")}
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              data-testid="mobile-menu-trigger"
              className="flex size-9 items-center justify-center rounded-lg border border-[#E2E4DC] text-[#172B3A] md:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="font-heading">CivicConnect</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "rounded-lg px-3 py-2 text-sm font-medium text-[#172B3A] hover:bg-[#EAECE4]",
                        isActive && "bg-[#EAECE4] text-[#237A62]",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="mt-3 border-t border-[#E2E4DC] pt-3">
                  {user ? (
                    <button
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#C2410C] hover:bg-[#FEE2E2]"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                    >
                      <LogOut className="size-4" /> {signingOut ? t("Signing out…") : `${t("Sign out")} (${user.name})`}
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-[#172B3A] hover:bg-[#EAECE4]"
                      >
                        {t("Sign in")}
                      </Link>
                      <Link
                        to="/register"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-[#237A62] hover:bg-[#EAECE4]"
                      >
                        {t("Create an account")}
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <LocalityPickerDialog open={localityOpen} onOpenChange={setLocalityOpen} />
    </header>
  );
}

function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-12 bg-[#172B3A] text-[#CBD5E1]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#237A62] text-white">
                <Landmark className="size-4" />
              </span>
              <span className="font-heading text-base font-bold text-white">CivicConnect</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#9FB2BA]">
              {t("A community platform for reporting neighbourhood infrastructure problems and tracking their resolution — from potholes to streetlights.")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#E6A34A]">{t("Platform")}</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/explore" className="hover:text-white">{t("Explore complaints")}</Link></li>
                <li><Link to="/report" className="hover:text-white">{t("Report an issue")}</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">{t("My Complaints")}</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#E6A34A]">{t("Account")}</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white">{t("Sign in")}</Link></li>
                <li><Link to="/register" className="hover:text-white">{t("Create account")}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-[#9FB2BA]">
          Map data and imagery © {" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            OpenStreetMap
          </a>{" "}
          contributors. Location search by Nominatim.
        </div>
      </div>
    </footer>
  );
}

export function UserCircleFallback() {
  return <UserCircle2 className="size-9 text-[#52656F]" />;
}

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
