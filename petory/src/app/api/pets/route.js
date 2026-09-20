import { NextResponse } from "next/server";
import { petInputSchema } from "@/features/pets/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { createPet, listPetsForOwner } from "@/server/pets/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Unauthorized", 401);
  return NextResponse.json({ pets: await listPetsForOwner(account.id) });
}

export async function POST(request) {
  try {
    await requireSameOrigin();
    const account = await getCurrentAccount();
    if (!account) return jsonError("Unauthorized", 401);

    const input = petInputSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid pet data", 422);

    const pet = await createPet(account.id, input.data);
    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to create pet", 500);
  }
}
