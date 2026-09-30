import { NextResponse } from "next/server";
import { reportStatusSchema, reportTypeSchema } from "@/features/admin/schema";
import { adminError, adminGuard } from "@/server/admin/guard";
import { countReportsByStatus, listReports } from "@/server/admin/repository";
import { jsonError } from "@/server/http/response";

export async function GET(request) {
  const { response } = await adminGuard();
  if (response) return response;

  try {
    const params = request.nextUrl.searchParams;
    const status = reportStatusSchema.safeParse(params.get("status") ?? "all");
    const type = reportTypeSchema.safeParse(params.get("type") ?? "all");
    if (!status.success || !type.success) return jsonError("Invalid filter", 422);

    const [reports, counts] = await Promise.all([
      listReports({ status: status.data, type: type.data }),
      countReportsByStatus(),
    ]);
    return NextResponse.json({ reports, counts });
  } catch (error) {
    return adminError(error, "Unable to load reports");
  }
}
