import { NextResponse } from "next/server";
import { searchSchema } from "@/features/admin/schema";
import { adminError, adminGuard } from "@/server/admin/guard";
import { listPosts } from "@/server/admin/repository";
import { jsonError } from "@/server/http/response";

export async function GET(request) {
  const { response } = await adminGuard();
  if (response) return response;

  try {
    const search = searchSchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
    if (!search.success) return jsonError("Invalid search", 422);
    return NextResponse.json({ posts: await listPosts({ search: search.data }) });
  } catch (error) {
    return adminError(error, "Unable to load posts");
  }
}
