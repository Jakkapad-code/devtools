"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PetoryProvider, usePetory } from "./context";
import GlobalStyles from "./components/GlobalStyles";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import Modals from "./components/Modals";
import Toast from "./components/Toast";

const AUTH_PATHS = new Set(["/petory", "/petory/login", "/petory/register", "/petory/forgot", "/petory/reset", "/petory/onboarding"]);

function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = usePetory();
  const isAuth = AUTH_PATHS.has(pathname);
  // The admin console carries its own sidebar and fills the viewport, so the
  // member navigation has nothing to sit beside there.
  const isAdmin = pathname.startsWith("/petory/admin");
  const showNav = !isAuth && !isAdmin;

  // An operator reopening the app lands on the feed, which is not their screen.
  // Only the feed redirects: a reported post still has to be openable from the
  // console, so every other member page stays reachable.
  const role = state.user?.role;
  useEffect(() => {
    if (role === "admin" && pathname === "/petory/home") router.replace("/petory/admin");
  }, [role, pathname, router]);

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", color: "#201C16", fontFamily: "'Work Sans',sans-serif", backgroundColor: "#FDE6B12D" }}>
        {showNav && !state.isMobile && <TopNav />}
        {showNav && state.isMobile && <BottomNav />}
        {children}
        <Modals />
        <Toast />
      </div>
    </>
  );
}

export default function PetoryLayout({ children }) {
  return (
    <PetoryProvider>
      <Shell>{children}</Shell>
    </PetoryProvider>
  );
}
