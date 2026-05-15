import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import HistoryPage from "./pages/HistoryPage";
import UrlAnalyzerPage from "./pages/UrlAnalyzerPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center font-bold shadow-sm">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Review Moderation System</h1>
              
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium shadow-sm"
            >
              Create Account
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-16 lg:py-24">
          <div>
            <div className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm text-cyan-700 mb-6">
              Smarter review fraud detection
            </div>

            <h2 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Detect fake reviews, spam campaigns, and review bombing.
            </h2>

            <p className="mt-6 text-lg text-slate-600 max-w-2xl">
              Upload company review CSVs, analyze suspicious behavior with AI and
              rules-based signals, visualize trends, and generate clean moderation
              reports in minutes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm text-center"
              >
                Get Started
              </Link>
              <Link
                to="/signin"
                className="px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-center"
              >
                Open Platform
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold">CSV</p>
                <p className="text-sm text-slate-500 mt-1">Bulk review upload</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold">AI</p>
                <p className="text-sm text-slate-500 mt-1">Text authenticity analysis</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold">PDF</p>
                <p className="text-sm text-slate-500 mt-1">Downloadable reports</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500">Moderation Overview</p>
                  <h3 className="text-2xl font-bold mt-1">Risk Summary</h3>
                </div>
                <div className="rounded-xl bg-cyan-50 px-3 py-2 text-cyan-700 text-sm font-medium">
                  Live Insights
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Flagged Reviews</p>
                  <p className="text-3xl font-bold mt-2">128</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Flagged Users</p>
                  <p className="text-3xl font-bold mt-2">19</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Bombing Incidents</p>
                  <p className="text-3xl font-bold mt-2">7</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Spam Campaigns</p>
                  <p className="text-3xl font-bold mt-2">11</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-4 bg-slate-50 text-sm text-slate-500 px-4 py-3">
                  <span>Product</span>
                  <span>User</span>
                  <span>Risk</span>
                  <span>Action</span>
                </div>

                <div className="grid grid-cols-4 px-4 py-3 border-t border-slate-200 text-sm">
                  <span>P-102</span>
                  <span>U-44</span>
                  <span className="text-amber-600 font-medium">Suspicious</span>
                  <span>Verify User</span>
                </div>

                <div className="grid grid-cols-4 px-4 py-3 border-t border-slate-200 text-sm">
                  <span>P-301</span>
                  <span>U-12</span>
                  <span className="text-red-600 font-medium">Manipulated</span>
                  <span>Escalate</span>
                </div>

                <div className="grid grid-cols-4 px-4 py-3 border-t border-slate-200 text-sm">
                  <span>P-208</span>
                  <span>U-88</span>
                  <span className="text-emerald-600 font-medium">Genuine</span>
                  <span>Approved</span>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 top-8 -right-4 h-72 w-72 rounded-full bg-cyan-100 blur-3xl opacity-70" />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Spam Reviewing Detection</h3>
            <p className="text-slate-600">
              Detect repeated review behavior, duplicate wording patterns, and
              suspicious activity across multiple products.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Review Bombing Analysis</h3>
            <p className="text-slate-600">
              Identify short-window spikes in extreme ratings from groups of users
              targeting the same product.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">URL Review Analyzer</h3>
            <p className="text-slate-600">
              Paste product URLs and analyze extracted reviews one by one without
              saving them to history.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/url-analyzer"
          element={
            <ProtectedRoute>
              <UrlAnalyzerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}