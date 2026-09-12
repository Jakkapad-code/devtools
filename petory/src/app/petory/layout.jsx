"use client";
import { usePathname } from "next/navigation";
import { PetoryProvider, usePetory } from "./context";
import GlobalStyles from "./components/GlobalStyles";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import Modals from "./components/Modals";
import Toast from "./components/Toast";

const AUTH_PATHS = new Set(["/petory", "/petory/login", "/petory/register", "/petory/forgot", "/petory/onboarding"]);

function Shell({ children }) {
  const pathname = usePathname();
  const { state } = usePetory();
  const isAuth = AUTH_PATHS.has(pathname);

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", color: "#201C16", fontFamily: "'Work Sans',sans-serif", backgroundColor: "#FDE6B12D" }}>
        {!isAuth && !state.isMobile && <TopNav />}
        {!isAuth && state.isMobile && <BottomNav />}
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
