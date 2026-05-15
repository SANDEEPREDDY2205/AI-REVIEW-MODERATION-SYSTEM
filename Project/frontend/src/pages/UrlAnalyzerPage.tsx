import { useState } from "react";

type SingleReviewResult = {
  review_text: string;
  verdict: string;
  score: number;
  explanation: string;
  model_used: string;
  detected_language?: string;
};

type UrlAnalysisResponse = {
  success: boolean;
  url: string;
  message: string;
  results: SingleReviewResult[];
};

function getVerdictBadgeClass(verdict: string) {
  switch (verdict) {
    case "Likely Genuine":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Suspicious":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Likely Manipulated":
      return "bg-red-100 text-red-700 border border-red-200";
    case "Language Not Supported":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export default function UrlAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<UrlAnalysisResponse | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setMessage("Please enter a product URL");
      return;
    }

    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.detail || "URL analysis failed");
        setLoading(false);
        return;
      }

      setResult(data);
      setMessage(data.message || "Analysis completed");
    } catch (error) {
      console.error(error);
      setMessage("Failed to analyze the URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-8 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Review URL Analyzer</h1>
          <p className="text-slate-500 mt-2">
            Paste a product URL to extract review text and analyze each review individually.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <label className="block text-sm font-medium mb-2">Product URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste product page URL here"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze URL"}
          </button>

          {message && <p className="mt-4 text-slate-600">{message}</p>}
        </div>

        {result && result.results.length > 0 && (
          <div className="space-y-6">
            {result.results.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-bold">Review {index + 1}</h2>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getVerdictBadgeClass(
                      item.verdict
                    )}`}
                  >
                    {item.verdict}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Score</p>
                    <p className="font-semibold">{item.score}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Model</p>
                    <p className="font-semibold">{item.model_used}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Language</p>
                    <p className="font-semibold">{item.detected_language || "unknown"}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-500">Review Text</p>
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                    {item.review_text}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Explanation</p>
                  <p className="mt-1">{item.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result && result.results.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <p className="text-slate-600">No review results were extracted from this URL.</p>
          </div>
        )}
      </div>
    </div>
  );
}