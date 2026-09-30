import { NextResponse } from "next/server";
import { adminError, adminGuard } from "@/server/admin/guard";
import {
  countAccounts, countPosts, countRemovedPosts, countReportsByStatus, countSuspended,
  listRecentActions, listReports, listUsers, tallyReportReasons,
} from "@/server/admin/repository";

/** Everything the dashboard draws, in one request. */
export async function GET() {
  const { account, response } = await adminGuard();
  if (response) return response;

  try {
    const [counts, reasons, actions, pending, users, posts, removedPosts, accounts, suspended] = await Promise.all([
      countReportsByStatus(), tallyReportReasons(), listRecentActions(6),
      listReports({ status: "pending" }), listUsers({ viewerId: account.id }),
      countPosts(), countRemovedPosts(), countAccounts(), countSuspended(),
    ]);

    return NextResponse.json({
      counts,
      totalReports: counts.pending + counts.resolved + counts.dismissed,
      reasons,
      actions,
      pendingQueue: pending.slice(0, 5),
      topReportedUsers: users.filter((user) => user.reportCount > 0).slice(0, 4),
      totals: { posts, removedPosts, accounts, suspended },
    });
  } catch (error) {
    return adminError(error, "Unable to load the overview");
  }
}
