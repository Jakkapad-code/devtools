import { NextResponse } from "next/server";
import { suspendSchema, uuidSchema } from "@/features/admin/schema";
import { adminError, adminGuard } from "@/server/admin/guard";
import { getAccount, recordAction, suspendAccount, unsuspendAccount } from "@/server/admin/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

function untilLabel(until) {
  if (!until) return "ถาวร";
  return "ถึง " + until.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export async function PUT(request, context) {
  const { account, response } = await adminGuard();
  if (response) return response;

  try {
    await requireSameOrigin();
    const { userId } = await context.params;
    const id = uuidSchema.safeParse(userId);
    const input = suspendSchema.safeParse(await request.json());
    if (!id.success || !input.success) return jsonError("Invalid suspension", 422);
    // Suspending yourself would end your own session mid-request.
    if (id.data === account.id) return jsonError("You cannot suspend your own account", 422);

    const target = await getAccount(id.data);
    if (!target) return jsonError("Account not found", 404);
    if (target.role === "admin") return jsonError("Another admin cannot be suspended here", 422);

    const until = input.data.duration === "perm"
      ? null
      : new Date(Date.now() + input.data.duration * 86_400_000);

    await suspendAccount({
      accountId: id.data, until, reason: input.data.reason,
      resolution: `ระงับบัญชีแล้ว (${untilLabel(until)})`, moderatorId: account.id,
    });
    await recordAction(account.id, "suspend", "account", id.data, `${target.name} (${untilLabel(until)})`);

    return NextResponse.json({ account: await getAccount(id.data) });
  } catch (error) {
    return adminError(error, "Unable to suspend the account");
  }
}

export async function DELETE(request, context) {
  const { account, response } = await adminGuard();
  if (response) return response;

  try {
    await requireSameOrigin();
    const { userId } = await context.params;
    const id = uuidSchema.safeParse(userId);
    if (!id.success) return jsonError("Invalid account", 422);

    const target = await getAccount(id.data);
    if (!target) return jsonError("Account not found", 404);

    await unsuspendAccount(id.data);
    await recordAction(account.id, "unsuspend", "account", id.data, target.name);
    return NextResponse.json({ account: await getAccount(id.data) });
  } catch (error) {
    return adminError(error, "Unable to lift the suspension");
  }
}
