import { NextResponse } from "next/server";
import { searchSchema } from "@/features/admin/schema";
import { adminError, adminGuard } from "@/server/admin/guard";
import { listUsers } from "@/server/admin/repository";
import { jsonError } from "@/server/http/response";

export async function GET(request) {
  const { account, response } = await adminGuard();
  if (response) return response;

  try {
    const search = searchSchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
    if (!search.success) return jsonError("Invalid search", 422);
    return NextResponse.json({ users: await listUsers({ search: search.data, viewerId: account.id }) });
  } catch (error) {
    return adminError(error, "Unable to load users");
  }
}
