import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/session";
import { profileInputSchema } from "@/features/profile/schema";
import { query } from "@/server/db/pool";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ account });
}

export async function PATCH(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);

    const input = profileInputSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid profile data", 422);

    const result = await query(
      `UPDATE accounts
       SET display_name = $2, bio = $3, phone = NULLIF($4, ''), location_label = NULLIF($5, '')
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, email, display_name, bio, phone, location_label, avatar_url,
                 avatar_media_id AS "avatarMediaId", created_at`,
      [account.id, input.data.displayName, input.data.bio, input.data.phone, input.data.locationLabel]
    );
    return NextResponse.json({ account: result.rows[0] });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to update profile", 500);
  }
}
