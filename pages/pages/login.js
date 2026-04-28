import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import { useTheme } from "../lib/themeContext";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { C } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Page will redirect to Google — no need to reset loading
    } catch (err) {
      setMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        maxWidth: "420px", width: "100%",
        background: C.paper, border: `1px solid ${C.soft}`,
        borderRadius: "20px", padding: "40px",
        boxShadow: `0 4px 24px ${C.dark}10`,
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px", height: "64px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
            borderRadius: "50%", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", color: "#fff",
          }}>✦</div>
          <h1 style={{ fontSize: "32px", margin: "0 0 8px", color: C.dark }}>
            Welcome to Spark
          </h1>
          <p style={{ fontSize: "14px", color: C.softDark, margin: 0 }}>
            {isSignup ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%", padding: "14px",
            background: "#fff", color: C.dark,
            border: `1px solid ${C.soft}`,
            borderRadius: "10px", fontSize: "15px", fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "10px", marginBottom: "20px", boxSizing: "border-box",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: C.soft }} />
          <span style={{ margin: "0 12px", color: C.softDark, fontSize: "13px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: C.soft }} />
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: "100%", padding: "14px",
              border: `1px solid ${C.soft}`,
              borderRadius: "10px", fontSize: "14px",
              marginBottom: "12px", background: C.bg,
              fontFamily: "inherit",
            }}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%", padding: "14px",
              border: `1px solid ${C.soft}`,
              borderRadius: "10px", fontSize: "14px",
              marginBottom: "16px", background: C.bg,
              fontFamily: "inherit",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? C.soft : `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
              color: "#fff", border: "none", borderRadius: "10px",
              fontSize: "15px", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: "16px", padding: "12px",
            background: C.bg, borderRadius: "10px",
            fontSize: "13px", color: C.mid, textAlign: "center",
          }}>
            {message}
          </div>
        )}

        <button
          onClick={() => { setIsSignup(!isSignup); setMessage(""); }}
          style={{
            width: "100%", marginTop: "20px",
            background: "transparent", border: "none",
            color: C.accent, fontSize: "13px", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
