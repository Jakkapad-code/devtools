import { NextResponse } from "next/server";
import { resolveReportSchema, uuidSchema } from "@/features/admin/schema";
import { adminError, adminGuard } from "@/server/admin/guard";
import { getReport, recordAction, resolveReport } from "@/server/admin/repository";
import { jsonError } from "@/server/http/response";
import { requireSameOrigin } from "@/server/security/origin";

/** Closes one report without touching the post or the account it is about. */
export async function PATCH(request, context) {
  const { account, response } = await adminGuard();
  if (response) return response;

  try {
    await requireSameOrigin();
    const { reportId } = await context.params;
    const id = uuidSchema.safeParse(reportId);
    const input = resolveReportSchema.safeParse(await request.json());
    if (!id.success || !input.success) return jsonError("Invalid report update", 422);

    const updated = await resolveReport({
      reportId: id.data, status: input.data.status,
      resolution: input.data.resolution, moderatorId: account.id,
    });
    if (!updated) return jsonError("Report not found", 404);

    const report = await getReport(id.data);
    await recordAction(account.id, "dismiss_report", "report", id.data,
      `${input.data.resolution} · ${report?.reason ?? ""}`);
    return NextResponse.json({ report });
  } catch (error) {
    return adminError(error, "Unable to update the report");
  }
}
