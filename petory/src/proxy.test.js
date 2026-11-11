import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("public and protected pages", () => {
  it("allows a logged-out visitor to open the password reset link", () => {
    const response = proxy(new NextRequest("http://localhost:3000/petory/reset?token=test-token"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects a logged-out visitor away from a protected page", () => {
    const response = proxy(new NextRequest("http://localhost:3000/petory/home"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/petory/login");
  });
});
