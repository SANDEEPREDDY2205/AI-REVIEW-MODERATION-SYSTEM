import { useMemo, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

type UploadResponse = {
  filename: string;
  total_reviews: number;
  total_flagged_reviews: number;
  total_flagged_users: number;
  total_bombing_products: number;
  review_results: ReviewResult[];
  user_summaries: UserSummary[];
  product_summaries: ProductSummary[];
  model_used_for_text: string;
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const BAR_COLOR = "#06b6d4";

function getRiskBadgeClass(label: string) {
  switch (label) {
    case "Likely Genuine":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Suspicious":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Likely Manipulated":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function getActionBadgeClass(action: string) {
  switch (action) {
    case "Approved":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Verify User":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "Restrict User":
      return "bg-orange-100 text-orange-700 border border-orange-200";
    case "Escalate to Moderation Team":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<UploadResponse | null>(null);

  const reportRef = useRef<HTMLDivElement | null>(null);

  const labelData = useMemo(() => {
    if (!report) return [];
    const counts: Record<string, number> = {};
    report.review_results.forEach((r) => {
      counts[r.authenticity_label] = (counts[r.authenticity_label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [report]);

  const actionData = useMemo(() => {
    if (!report) return [];
    const counts: Record<string, number> = {};
    report.review_results.forEach((r) => {
      counts[r.recommended_action] = (counts[r.recommended_action] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [report]);

  const topRiskyProducts = useMemo(() => {
    if (!report) return [];
    return [...report.product_summaries]
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
    return [...report.user_summaries]
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
  if (!report) return;

  try {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
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
      return;
    }
  } catch (error) {
    console.error("Canvas PDF failed, falling back to text PDF:", error);
  }

  try {
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 15;

    pdf.setFontSize(18);
    pdf.text("ReviewShield Moderation Report", 14, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.text(`File: ${report.filename}`, 14, y);
    y += 8;
    pdf.text(`Total Reviews: ${report.total_reviews}`, 14, y);
    y += 8;
    pdf.text(`Flagged Reviews: ${report.total_flagged_reviews}`, 14, y);
    y += 8;
    pdf.text(`Flagged Users: ${report.total_flagged_users}`, 14, y);
    y += 8;
    pdf.text(`Bombing Products: ${report.total_bombing_products}`, 14, y);
    y += 8;
    pdf.text(`Text Model: ${report.model_used_for_text}`, 14, y);
    y += 12;

    pdf.setFontSize(14);
    pdf.text("Top Review Results", 14, y);
    y += 8;

    pdf.setFontSize(10);

    report.review_results.slice(0, 10).forEach((review, index) => {
      const line = `${index + 1}. ${review.product_id} | ${review.user_id} | ${review.authenticity_label} | ${review.recommended_action}`;
      const split = pdf.splitTextToSize(line, 180);
      pdf.text(split, 14, y);
      y += split.length * 5 + 2;

      if (y > 270) {
        pdf.addPage();
        y = 15;
      }
    });

    pdf.save(`moderation-report-${report.filename}.pdf`);
    setMessage("PDF downloaded using fallback mode");
  } catch (error) {
    console.error("PDF generation failed completely:", error);
    setMessage("Failed to generate PDF report");
  }
};

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.detail || "Upload failed");
        setReport(null);
        return;
      }

      const typedData: UploadResponse = data;
      setReport(typedData);

      const user = auth.currentUser;

      if (user) {
        try {
          await addDoc(collection(db, "reports"), {
            userId: user.uid,
            filename: typedData.filename,
            totalReviews: typedData.total_reviews,
            flaggedReviews: typedData.total_flagged_reviews,
            flaggedUsers: typedData.total_flagged_users,
            bombingProducts: typedData.total_bombing_products,
            modelUsedForText: typedData.model_used_for_text,
            createdAt: serverTimestamp(),
          });

          setMessage("Upload, analysis, and history save completed successfully");
        } catch (saveError) {
          console.error("Firestore save failed:", saveError);
          setMessage("Analysis completed, but history save failed");
        }
      } else {
        setMessage("Analysis completed, but user session was not found");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
      setReport(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-8 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Upload CSV</h1>
          <p className="text-slate-500 mt-2">
            Upload company review data and generate a moderation report.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
            />

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold text-white"
            >
              {uploading ? "Analyzing..." : "Upload & Analyze"}
            </button>
          </div>

          {file && (
            <p className="mt-4 text-sm text-slate-500">
              Selected file: <span className="text-slate-700">{file.name}</span>
            </p>
          )}

          {message && <p className="mt-4 text-slate-600">{message}</p>}
        </div>

        {report && (
          <div ref={reportRef} className="bg-white text-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-end mb-6">
              <button
                onClick={downloadPdfReport}
                className="bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-lg font-semibold text-white"
              >
                Download PDF Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <p className="text-slate-500 text-sm">Total Reviews</p>
                <h2 className="text-3xl font-bold mt-2">{report.total_reviews}</h2>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <p className="text-slate-500 text-sm">Flagged Reviews</p>
                <h2 className="text-3xl font-bold mt-2">{report.total_flagged_reviews}</h2>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <p className="text-slate-500 text-sm">Flagged Users</p>
                <h2 className="text-3xl font-bold mt-2">{report.total_flagged_users}</h2>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <p className="text-slate-500 text-sm">Bombing Products</p>
                <h2 className="text-3xl font-bold mt-2">{report.total_bombing_products}</h2>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <p className="text-slate-500 text-sm">Text Model</p>
                <h2 className="text-base font-semibold mt-3 break-words">
                  {report.model_used_for_text}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[360px]">
                <h2 className="text-xl font-bold mb-4">Authenticity Distribution</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={labelData} dataKey="value" nameKey="name" outerRadius={110} label>
                      {labelData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[360px]">
                <h2 className="text-xl font-bold mb-4">Recommended Actions</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Count" fill={BAR_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[360px]">
                <h2 className="text-xl font-bold mb-4">Top Risky Products</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRiskyProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clusters" name="Campaign Clusters" fill={BAR_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[360px]">
                <h2 className="text-xl font-bold mb-4">Top Risky Users</h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRiskyUsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="duplicateRatio" name="Duplicate Ratio" fill={BAR_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">Review Results</h2>

              <table className="w-full min-w-[1200px] text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="py-3 pr-4">Product</th>
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Text Label</th>
                    <th className="py-3 pr-4">Final Label</th>
                    <th className="py-3 pr-4">Text Score</th>
                    <th className="py-3 pr-4">Duplicate</th>
                    <th className="py-3 pr-4">Final Score</th>
                    <th className="py-3 pr-4">Bombing</th>
                    <th className="py-3 pr-4">Spam</th>
                    <th className="py-3 pr-4">Action</th>
                    <th className="py-3 pr-4">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.review_results.slice(0, 20).map((review, index) => (
                    <tr key={index} className="border-b border-slate-200 align-top">
                      <td className="py-4 pr-4">{review.product_id}</td>
                      <td className="py-4 pr-4">{review.user_id}</td>
                      <td className="py-4 pr-4">{review.text_authenticity_label}</td>
                      <td className="py-4 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeClass(review.authenticity_label)}`}>
                          {review.authenticity_label}
                        </span>
                      </td>
                      <td className="py-4 pr-4">{review.text_suspicion_score}</td>
                      <td className="py-4 pr-4">{review.duplicate_campaign_score}</td>
                      <td className="py-4 pr-4">{review.suspicious_review_score}</td>
                      <td className="py-4 pr-4">{review.bombing_flag ? "Yes" : "No"}</td>
                      <td className="py-4 pr-4">{review.spam_reviewing_flag ? "Yes" : "No"}</td>
                      <td className="py-4 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(review.recommended_action)}`}>
                          {review.recommended_action}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-600 max-w-xs">{review.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">User Summary</h2>

              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
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
                  {report.user_summaries.map((user, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-4 pr-4">{user.user_id}</td>
                      <td className="py-4 pr-4">{user.review_count}</td>
                      <td className="py-4 pr-4">{user.unverified_ratio}</td>
                      <td className="py-4 pr-4">{user.extreme_rating_ratio}</td>
                      <td className="py-4 pr-4">{user.duplicate_ratio}</td>
                      <td className="py-4 pr-4">{user.spam_reviewing_flag ? "Yes" : "No"}</td>
                      <td className="py-4 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(user.user_action)}`}>
                          {user.user_action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">Product Summary</h2>

              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="py-3 pr-4">Product</th>
                    <th className="py-3 pr-4">Review Count</th>
                    <th className="py-3 pr-4">Burst Score</th>
                    <th className="py-3 pr-4">Extreme Ratio</th>
                    <th className="py-3 pr-4">Bombing</th>
                    <th className="py-3 pr-4">Campaign Clusters</th>
                  </tr>
                </thead>
                <tbody>
                  {report.product_summaries.map((product, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-4 pr-4">{product.product_id}</td>
                      <td className="py-4 pr-4">{product.review_count}</td>
                      <td className="py-4 pr-4">{product.burst_score}</td>
                      <td className="py-4 pr-4">{product.extreme_ratio}</td>
                      <td className="py-4 pr-4">{product.bombing_flag ? "Yes" : "No"}</td>
                      <td className="py-4 pr-4">{product.campaign_cluster_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}