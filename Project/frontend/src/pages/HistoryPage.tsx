import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

type SavedReport = {
  id: string;
  userId: string;
  filename: string;
  totalReviews: number;
  flaggedReviews: number;
  flaggedUsers: number;
  bombingProducts: number;
  modelUsedForText: string;
  createdAt?: Timestamp;
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError("");

        const q = query(
          collection(db, "reports"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const data: SavedReport[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<SavedReport, "id">),
        }));

        data.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return bTime - aTime;
        });

        setReports(data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        setError("Failed to load report history");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, authLoading]);

  const formatDate = (createdAt?: Timestamp) => {
    if (!createdAt) return "Unknown";
    return createdAt.toDate().toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-8 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Report History</h1>
          <p className="text-slate-500 mt-2">
            Previously saved moderation reports.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            Loading reports...
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-red-600">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <p className="text-slate-600">No reports found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              >
                <h2 className="text-xl font-bold">{report.filename}</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {formatDate(report.createdAt)}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-sm">Total Reviews</p>
                    <p className="text-2xl font-bold mt-1">{report.totalReviews}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-sm">Flagged Reviews</p>
                    <p className="text-2xl font-bold mt-1">{report.flaggedReviews}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-sm">Flagged Users</p>
                    <p className="text-2xl font-bold mt-1">{report.flaggedUsers}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-500 text-sm">Bombing Products</p>
                    <p className="text-2xl font-bold mt-1">{report.bombingProducts}</p>
                  </div>
                </div>

                <p className="text-slate-500 text-sm mt-4">
                  Text model: {report.modelUsedForText}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}