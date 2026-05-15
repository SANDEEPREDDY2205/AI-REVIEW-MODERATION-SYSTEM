import { useState } from "react";
import { signUp } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await signUp(email, password, name);
      navigate("/dashboard");
    } catch (err: any) {
      setMessage(err.message || "Sign up failed");
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
                <p className="text-slate-500 text-sm">Create Your Moderation Workspace</p>
              </div>
            </div>

            <div className="mb-10">
              <p className="text-sm text-cyan-700 font-medium">Get Started</p>
              <h2 className="text-4xl font-bold mt-2 leading-tight">
                Create an account to begin review moderation and risk analysis.
              </h2>
              <p className="text-slate-500 mt-4 text-base leading-7">
                Set up your workspace and access tools for CSV upload, URL-based review
                analysis, report tracking, and suspicious activity monitoring.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold">Intelligent Detection</p>
                <p className="text-sm text-slate-500 mt-1">
                  Classify genuine and suspicious reviews with moderation-ready outputs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold">Risk Monitoring</p>
                <p className="text-sm text-slate-500 mt-1">
                  Track suspicious users, campaign clusters, and review bombing patterns.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold">Exportable Reports</p>
                <p className="text-sm text-slate-500 mt-1">
                  Save history and generate downloadable moderation reports for review.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4">
            <p className="text-sm text-cyan-700 font-medium">Access Level</p>
            <p className="font-semibold mt-1">AI Review Moderation Dashboard</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mt-2">Create Account</h2>
              <p className="text-slate-500 mt-3">
                Register to access the moderation dashboard and analytics tools.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/signin" className="text-cyan-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}