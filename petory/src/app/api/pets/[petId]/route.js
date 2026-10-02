import { NextResponse } from "next/server";
import { petIdSchema, petInputSchema } from "@/features/pets/schema";
import { getCurrentAccount } from "@/server/auth/session";
import { deleteOwnedPet, getVisiblePet, updateOwnedPet } from "@/server/pets/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

async function accountAndPetId(context) {
  const account = await getCurrentAccount();
  if (!account) return { error: jsonError("Unauthorized", 401) };

  const { petId } = await context.params;
  const parsedId = petIdSchema.safeParse(petId);
  if (!parsedId.success) return { error: jsonError("Pet not found", 404) };
  return { account, petId: parsedId.data };
}

export const dynamic = "force-dynamic";

export async function GET(_request, context) {
  const resolved = await accountAndPetId(context);
  if (resolved.error) return resolved.error;

  const pet = await getVisiblePet(resolved.account.id, resolved.petId);
  if (!pet) return jsonError("Pet not found", 404);
  return NextResponse.json({ pet });
}

export async function PUT(request, context) {
  try {
    await requireSameOrigin();
    const resolved = await accountAndPetId(context);
    if (resolved.error) return resolved.error;

    const input = petInputSchema.safeParse(await request.json());
    if (!input.success) return jsonError("Invalid pet data", 422);
    const pet = await updateOwnedPet(resolved.account.id, resolved.petId, input.data);
    if (pet === null) return jsonError("Pet not found", 404);
    if (!pet) return jsonError("Selected photo was not found", 422);
    return NextResponse.json({ pet });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to update pet", 500);
  }
}

export async function DELETE(_request, context) {
  try {
    await requireSameOrigin();
    const resolved = await accountAndPetId(context);
    if (resolved.error) return resolved.error;

    const deleted = await deleteOwnedPet(resolved.account.id, resolved.petId);
    if (!deleted) return jsonError("Pet not found", 404);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error?.message === "Forbidden cross-origin request") return jsonError("Forbidden", 403);
    return jsonError("Unable to delete pet", 500);
  }
}
