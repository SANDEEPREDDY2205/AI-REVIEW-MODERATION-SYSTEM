import { useEffect, useState } from "react";
import { logOut } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

type ReportDoc = {
  filename: string;
  flaggedReviews: number;
  flaggedUsers: number;
  bombingProducts: number;
  modelUsedForText: string;
  createdAt?: {
    toDate?: () => Date;
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState({
    totalReports: 0,
    flaggedUsers: 0,
    bombingIncidents: 0,
    spamCampaigns: 0,
  });

  const [recentReports, setRecentReports] = useState<ReportDoc[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading) return;
      if (!user) {
        setLoadingStats(false);
        return;
      }

      try {
        const q = query(
          collection(db, "reports"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const reports: ReportDoc[] = snapshot.docs.map(
          (doc) => doc.data() as ReportDoc
        );

        reports.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return bTime - aTime;
        });

        const totalReports = snapshot.size;
        const flaggedUsers = reports.reduce(
          (sum, report) => sum + (report.flaggedUsers || 0),
          0
        );
        const bombingIncidents = reports.reduce(
          (sum, report) => sum + (report.bombingProducts || 0),
          0
        );
        const spamCampaigns = reports.filter(
          (report) => (report.flaggedReviews || 0) > 0
        ).length;

        setStats({
          totalReports,
          flaggedUsers,
          bombingIncidents,
          spamCampaigns,
        });

        setRecentReports(reports.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, authLoading]);

  const handleLogout = async () => {
    await logOut();
    navigate("/signup");
  };

  const formatDate = (createdAt?: { toDate?: () => Date }) => {
    if (!createdAt?.toDate) return "Unknown";
    return createdAt.toDate().toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="w-72 bg-white border-r border-slate-200 px-6 py-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-11 w-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center font-bold shadow-sm">
              AI
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Review Moderation System</h2>
              <p className="text-sm text-slate-500">Moderation Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full text-left px-4 py-3 rounded-xl bg-cyan-50 text-cyan-700 font-medium border border-cyan-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/upload")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              Upload CSV
            </button>
            <button
              onClick={() => navigate("/url-analyzer")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              Review URL Analyzer
            </button>
            <button
              onClick={() => navigate("/history")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              History
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 p-3 rounded-xl text-white font-medium shadow-sm"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 px-8 py-8 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-cyan-700 font-medium">Overview</p>
            <h1 className="text-4xl font-bold mt-1">Dashboard</h1>
            <p className="text-slate-500 mt-2">
              Monitor uploaded reports, suspicious users, and product risk activity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">Current Workspace</p>
            <p className="font-semibold mt-1">Review Moderation Intelligence</p>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">Total Reports</p>
            <h2 className="text-3xl font-bold mt-3">
              {loadingStats ? "..." : stats.totalReports}
            </h2>
            <p className="text-sm text-slate-400 mt-2">Uploaded moderation reports</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">Flagged Users</p>
            <h2 className="text-3xl font-bold mt-3">
              {loadingStats ? "..." : stats.flaggedUsers}
            </h2>
            <p className="text-sm text-slate-400 mt-2">Users requiring attention</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">Bombing Incidents</p>
            <h2 className="text-3xl font-bold mt-3">
              {loadingStats ? "..." : stats.bombingIncidents}
            </h2>
            <p className="text-sm text-slate-400 mt-2">High-risk product bursts detected</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm">Spam Campaigns</p>
            <h2 className="text-3xl font-bold mt-3">
              {loadingStats ? "..." : stats.spamCampaigns}
            </h2>
            <p className="text-sm text-slate-400 mt-2">Reports containing flagged reviews</p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold">Recent Reports</h2>
                <p className="text-slate-500 mt-1">
                  Latest uploads available in your account
                </p>
              </div>

              <button
                onClick={() => navigate("/history")}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium"
              >
                View History
              </button>
            </div>

            {loadingStats ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                Loading recent reports...
              </div>
            ) : recentReports.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                No reports uploaded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <div
                    key={`${report.filename}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{report.filename}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {formatDate(report.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                          Flagged Reviews: {report.flaggedReviews || 0}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          Flagged Users: {report.flaggedUsers || 0}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                          Bombing: {report.bombingProducts || 0}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 mt-3">
                      Text model: {report.modelUsedForText || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
            <p className="text-slate-500 mt-1 mb-5">
              Jump directly into core workflows
            </p>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/upload")}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100"
              >
                <p className="font-semibold">Upload CSV</p>
                <p className="text-sm text-slate-500 mt-1">
                  Run full moderation analysis on review datasets
                </p>
              </button>

              <button
                onClick={() => navigate("/url-analyzer")}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100"
              >
                <p className="font-semibold">Analyze Product URL</p>
                <p className="text-sm text-slate-500 mt-1">
                  Check extracted review text one by one using Gemini
                </p>
              </button>

              <button
                onClick={() => navigate("/history")}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100"
              >
                <p className="font-semibold">Open History</p>
                <p className="text-sm text-slate-500 mt-1">
                  Review previously generated reports and summaries
                </p>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}