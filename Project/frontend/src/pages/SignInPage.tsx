import { useState } from "react";
import { signIn } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setMessage(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 px-6 py-8 md:px-10">
        <div className="hidden lg:flex flex-col justify-between rounded-[2rem] bg-white border border-slate-200 shadow-sm p-10">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500 text-white flex items-center justify-center font-bold shadow-sm">
                AI
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Review Moderation System</h1>
                <p className="text-slate-500 text-sm">Secure Moderation Console Access</p>
              </div>
            </div>

            <div className="mb-10">
              <p className="text-sm text-cyan-700 font-medium">Welcome Back</p>
              <h2 className="text-4xl font-bold mt-2 leading-tight">
                Sign in to manage review intelligence and moderation reports.
              </h2>
              <p className="text-slate-500 mt-4 text-base leading-7">
                Access your dashboard, upload review datasets, inspect suspicious activity,
                and monitor flagged users and bombing incidents from one place.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold">Moderation Dashboard</p>
                <p className="text-sm text-slate-500 mt-1">
                  View total reports, recent activity, flagged users, and product risk trends.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold">CSV & URL Analysis</p>
                <p className="text-sm text-slate-500 mt-1">
                  Upload review files or analyze product URLs to detect suspicious behavior.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold">Saved History</p>
                <p className="text-sm text-slate-500 mt-1">
                  Revisit previous moderation results and download report summaries anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4">
            <p className="text-sm text-cyan-700 font-medium">Workspace</p>
            <p className="font-semibold mt-1">Review Moderation Intelligence</p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] bg-white border border-slate-200 shadow-sm p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="h-11 w-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center font-bold shadow-sm">
                AI
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Review Moderation System</h2>
                <p className="text-sm text-slate-500">Moderation Console</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm text-cyan-700 font-medium">Authentication</p>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">Sign In</h2>
              <p className="text-slate-500 mt-3">
                Enter your credentials to continue to your moderation workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {message && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 disabled:cursor-not-allowed px-6 py-3.5 text-white font-semibold shadow-sm"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-cyan-700 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}