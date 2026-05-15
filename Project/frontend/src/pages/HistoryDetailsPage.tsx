import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type ReviewResult = {
  product_id: string;
  user_id: string;
  review_text: string;
  timestamp: string;
  rating: number;
  verified_purchase: boolean;
  text_authenticity_label: string;
  authenticity_label: string;
  text_suspicion_score: number;
  duplicate_campaign_score: number;
  bombing_flag: boolean;
  spam_reviewing_flag: boolean;
  suspicious_review_score: number;
  recommended_action: string;
  reason: string;
};

type UserSummary = {
  user_id: string;
  review_count: number;
  unverified_ratio: number;
  extreme_rating_ratio: number;
  duplicate_ratio: number;
  spam_reviewing_flag: boolean;
  user_action: string;
};

type ProductSummary = {
  product_id: string;
  review_count: number;
  burst_score: number;
  extreme_ratio: number;
  bombing_flag: boolean;
  campaign_cluster_count: number;
};

type SavedReport = {
  id: string;
  userId: string;
  filename: string;
  totalReviews: number;
  flaggedReviews: number;
  flaggedUsers: number;
  bombingProducts: number;
  modelUsedForText: string;
  reviewResults: ReviewResult[];
  userSummaries: UserSummary[];
  productSummaries: ProductSummary[];
};

function getRiskBadgeClass(label: string) {
  switch (label) {
    case "Likely Genuine":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "Suspicious":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
    case "Likely Manipulated":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

function getActionBadgeClass(action: string) {
  switch (action) {
    case "Approved":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "Verify User":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "Restrict User":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    case "Escalate to Moderation Team":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    default:
      return "bg-slate-700 text-slate-200 border border-slate-600";
  }
}

export default function HistoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !id) {
          setLoading(false);
          return;
        }

        const ref = doc(db, "reports", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data() as Omit<SavedReport, "id">;

        if (data.userId !== user.uid) {
          setLoading(false);
          return;
        }

        setReport({ id: snap.id, ...data });
      } catch (error) {
        console.error("Failed to fetch report details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const labelData = useMemo(() => {
    if (!report) return [];
    const counts: Record<string, number> = {};
    report.reviewResults.forEach((r) => {
      counts[r.authenticity_label] = (counts[r.authenticity_label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [report]);

  const actionData = useMemo(() => {
    if (!report) return [];
    const counts: Record<string, number> = {};
    report.reviewResults.forEach((r) => {
      counts[r.recommended_action] = (counts[r.recommended_action] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [report]);

  const topRiskyProducts = useMemo(() => {
    if (!report) return [];
    return [...report.productSummaries]
      .sort(
        (a, b) =>
          Number(b.bombing_flag) - Number(a.bombing_flag) ||
          b.campaign_cluster_count - a.campaign_cluster_count ||
          b.extreme_ratio - a.extreme_ratio
      )
      .slice(0, 8)
      .map((p) => ({
        name: p.product_id,
        clusters: p.campaign_cluster_count,
      }));
  }, [report]);

  const topRiskyUsers = useMemo(() => {
    if (!report) return [];
    return [...report.userSummaries]
      .sort(
        (a, b) =>
          Number(b.spam_reviewing_flag) - Number(a.spam_reviewing_flag) ||
          b.duplicate_ratio - a.duplicate_ratio ||
          b.unverified_ratio - a.unverified_ratio
      )
      .slice(0, 8)
      .map((u) => ({
        name: u.user_id,
        duplicateRatio: u.duplicate_ratio,
      }));
  }, [report]);

  const downloadPdfReport = async () => {
    if (!reportRef.current || !report) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#020617",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const usableWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= pdfHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;
    }

    pdf.save(`moderation-report-${report.filename}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-10">
        Loading report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-10">
        <p>Report not found.</p>
        <button
          onClick={() => navigate("/history")}
          className="mt-4 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-10">
      <div className="max-w-7xl mx-auto" ref={reportRef}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{report.filename}</h1>
            <p className="text-slate-400 mt-2">Saved moderation report details.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/history")}
              className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg font-semibold"
            >
              Back
            </button>
            <button
              onClick={downloadPdfReport}
              className="bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-lg font-semibold"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Total Reviews</p>
            <h2 className="text-3xl font-bold mt-2">{report.totalReviews}</h2>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Flagged Reviews</p>
            <h2 className="text-3xl font-bold mt-2">{report.flaggedReviews}</h2>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Flagged Users</p>
            <h2 className="text-3xl font-bold mt-2">{report.flaggedUsers}</h2>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Bombing Products</p>
            <h2 className="text-3xl font-bold mt-2">{report.bombingProducts}</h2>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <p className="text-slate-400 text-sm">Text Model</p>
            <h2 className="text-base font-semibold mt-3 break-words">
              {report.modelUsedForText}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-[360px]">
            <h2 className="text-xl font-bold mb-4">Authenticity Distribution</h2>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={labelData} dataKey="value" nameKey="name" outerRadius={110} label />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-[360px]">
            <h2 className="text-xl font-bold mb-4">Recommended Actions</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-[360px]">
            <h2 className="text-xl font-bold mb-4">Top Risky Products</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRiskyProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="clusters" name="Campaign Clusters" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 h-[360px]">
            <h2 className="text-xl font-bold mb-4">Top Risky Users</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRiskyUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="duplicateRatio" name="Duplicate Ratio" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">Review Results</h2>

          <table className="w-full min-w-[1200px] text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Final Label</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Bombing</th>
                <th className="py-3 pr-4">Spam</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {report.reviewResults.slice(0, 20).map((review, index) => (
                <tr key={index} className="border-b border-slate-800">
                  <td className="py-4 pr-4">{review.product_id}</td>
                  <td className="py-4 pr-4">{review.user_id}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeClass(
                        review.authenticity_label
                      )}`}
                    >
                      {review.authenticity_label}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{review.suspicious_review_score}</td>
                  <td className="py-4 pr-4">{review.bombing_flag ? "Yes" : "No"}</td>
                  <td className="py-4 pr-4">{review.spam_reviewing_flag ? "Yes" : "No"}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(
                        review.recommended_action
                      )}`}
                    >
                      {review.recommended_action}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{review.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">User Summary</h2>

          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Reviews</th>
                <th className="py-3 pr-4">Unverified Ratio</th>
                <th className="py-3 pr-4">Extreme Ratio</th>
                <th className="py-3 pr-4">Duplicate Ratio</th>
                <th className="py-3 pr-4">Spam Reviewing</th>
                <th className="py-3 pr-4">User Action</th>
              </tr>
            </thead>
            <tbody>
              {report.userSummaries.map((user, index) => (
                <tr key={index} className="border-b border-slate-800">
                  <td className="py-4 pr-4">{user.user_id}</td>
                  <td className="py-4 pr-4">{user.review_count}</td>
                  <td className="py-4 pr-4">{user.unverified_ratio}</td>
                  <td className="py-4 pr-4">{user.extreme_rating_ratio}</td>
                  <td className="py-4 pr-4">{user.duplicate_ratio}</td>
                  <td className="py-4 pr-4">
                    {user.spam_reviewing_flag ? "Yes" : "No"}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(
                        user.user_action
                      )}`}
                    >
                      {user.user_action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">Product Summary</h2>

          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Review Count</th>
                <th className="py-3 pr-4">Burst Score</th>
                <th className="py-3 pr-4">Extreme Ratio</th>
                <th className="py-3 pr-4">Bombing</th>
                <th className="py-3 pr-4">Campaign Clusters</th>
              </tr>
            </thead>
            <tbody>
              {report.productSummaries.map((product, index) => (
                <tr key={index} className="border-b border-slate-800">
                  <td className="py-4 pr-4">{product.product_id}</td>
                  <td className="py-4 pr-4">{product.review_count}</td>
                  <td className="py-4 pr-4">{product.burst_score}</td>
                  <td className="py-4 pr-4">{product.extreme_ratio}</td>
                  <td className="py-4 pr-4">
                    {product.bombing_flag ? "Yes" : "No"}
                  </td>
                  <td className="py-4 pr-4">{product.campaign_cluster_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}