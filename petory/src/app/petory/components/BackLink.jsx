"use client";
import { useRouter } from "next/navigation";
import { sx } from "../ui";

export default function BackLink({ children = "← Back", style, fallbackHref }) {
  const router = useRouter();
  return (
    <span
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref || "/petory/home"))}
      style={sx(style || "font-weight:800;font-size:15px;color:#E3402B;cursor:pointer;text-decoration-line:none")}
    >
      {children}
    </span>
  );
}
