import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Mocked auth: always use Google mock login for both login and signup actions
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      setError(err?.message || (isSignup ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setSocialLoading("google");
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black px-3 sm:px-4">
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-600/20 blur-[140px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-600/20 blur-[140px] rounded-full -z-10" />

      <div className="w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/5 border border-white/10 shadow-xl rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <img
              src="/images/logo.png"
              alt="Khel-Setu"
              className="h-12 w-auto"
            />
            <h3 className="text-2xl font-bold text-white tracking-tight">Khel Setu</h3>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md text-center">
                {error}
              </p>
            )}

            <Button
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition text-white font-semibold shadow-lg"
              isLoading={loading}
              type="submit"
            >
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="mx-2 text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Google Button (shown for both Sign In and Sign Up) */}
          <button
            onClick={onGoogle}
            disabled={socialLoading === "google"}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition border border-white/10"
          >
            {socialLoading === "google" ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <img
                alt="Google"
                src="https://www.google.com/favicon.ico"
                className="h-5 w-5"
              />
            )}
            Continue with Google
          </button>

          {/* Toggle Signup/Login */}
          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              className="text-indigo-400 hover:underline"
              onClick={() => setIsSignup((v) => !v)}
            >
              {isSignup
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
