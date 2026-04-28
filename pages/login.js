import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import { useTheme } from "../lib/ThemeContext";

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
              color: C.dark, fontFamily: "inherit",
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
              color: C.dark, fontFamily: "inherit",
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
