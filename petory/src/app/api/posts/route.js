import { NextResponse } from "next/server";
import { postInputSchema } from "@/features/posts/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { createPost, listFeedPosts } from "@/server/posts/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["all", "recipe", "place", "clinic", "tips"]);
const SPECIES = new Set(["all", "Dog", "Cat", "Other"]);

function parseFeedQuery(request) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category") || "all";
  const species = params.get("species") || "all";
  const sort = params.get("sort") || "latest";
  const scope = params.get("scope") || "home";
  const search = (params.get("search") || "").trim();
  const limit = Number(params.get("limit") || 20);
  if (!CATEGORIES.has(category) || !SPECIES.has(species) || !["latest", "popular"].includes(sort) || !["home", "explore"].includes(scope) || !Number.isInteger(limit) || limit < 1 || limit > 50 || search.length > 120) return null;
  let cursor;
  if (params.get("cursor")) {
    try { cursor = JSON.parse(Buffer.from(params.get("cursor"), "base64url").toString("utf8")); } catch { return null; }
    if (!Array.isArray(cursor) || cursor.length !== 2) return null;
  }
  return { category, species, sort, scope, search, limit, cursor };
}

export async function GET(request) {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Unauthorized", 401);
  const filters = parseFeedQuery(request);
  if (!filters) return jsonError("Invalid feed query", 422);
  const rows = await listFeedPosts(account.id, filters);
  const hasMore = rows.length > filters.limit;
  const posts = rows.slice(0, filters.limit);
  const last = posts.at(-1);
  return NextResponse.json({ posts, nextCursor: hasMore && last ? Buffer.from(JSON.stringify([last.createdAt, last.id])).toString("base64url") : null });
}

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);
    const input = postInputSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid post data", 422);
    const post = await createPost(account.id, input.data);
    if (!post) return jsonError("Selected pet or photo was not found", 422);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to create post", 500);
  }
}
