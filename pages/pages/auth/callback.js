import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

const C = { bg: "#F5F0E8", mid: "#6B4226" };

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          router.push("/login");
          return;
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      router.push(session ? "/" : "/login");
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <p style={{ color: C.mid, fontSize: "16px" }}>Signing you in...</p>
    </div>
  );
}
