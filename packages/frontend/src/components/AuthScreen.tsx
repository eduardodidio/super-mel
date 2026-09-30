import { useState } from "react";

interface AuthScreenProps {
  onAuth: () => void;
}

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"guest" | "login" | "register">("guest");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Digite um nome");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "guest" ? "/api/auth/guest"
        : mode === "login" ? "/api/auth/login"
        : "/api/auth/register";

      const body = mode === "guest"
        ? { name: name.trim() }
        : { name: name.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao conectar");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("supermel_token", data.token);
      localStorage.setItem("supermel_player_id", data.player.id);
      localStorage.setItem("supermel_player_name", data.player.name);

      // Migrate guest localStorage progress to backend after registration
      if (mode === "register") {
        const localCoins = parseInt(
          localStorage.getItem("supermel_total_coins") || "0",
          10
        );
        if (localCoins > 0) {
          fetch("/api/progress", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({ totalCoins: localCoins, data: {} }),
          }).catch(() => {
            // Non-critical: progress sync will retry via useProgressSync
          });
        }
      }

      onAuth();
    } catch {
      setError("Erro de conexao. O servidor esta rodando?");
      // Allow playing offline as guest
      localStorage.setItem("supermel_player_id", `local-${Date.now()}`);
      localStorage.setItem("supermel_player_name", name.trim());
      onAuth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SUPER MEL</h1>
      <p style={styles.subtitle}>A Yorkshire Micro Heroina</p>

      <div style={styles.tabs}>
        <button
          style={mode === "guest" ? styles.tabActive : styles.tab}
          onClick={() => setMode("guest")}
        >
          Visitante
        </button>
        <button
          style={mode === "login" ? styles.tabActive : styles.tab}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          style={mode === "register" ? styles.tabActive : styles.tab}
          onClick={() => setMode("register")}
        >
          Registrar
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          maxLength={50}
        />
        {mode !== "guest" && (
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        )}
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "..." : mode === "guest" ? "JOGAR" : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a2e",
    fontFamily: "monospace",
    color: "#ffffff",
  },
  title: {
    fontSize: "56px",
    color: "#ffcc00",
    margin: 0,
    textShadow: "3px 3px 0 #000",
  },
  subtitle: {
    fontSize: "16px",
    color: "#cccccc",
    marginBottom: 30,
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: 20,
  },
  tab: {
    padding: "8px 20px",
    fontSize: "14px",
    border: "1px solid #4a4a8a",
    background: "transparent",
    color: "#aaa",
    cursor: "pointer",
    fontFamily: "monospace",
  },
  tabActive: {
    padding: "8px 20px",
    fontSize: "14px",
    border: "1px solid #6a6aaa",
    background: "#4a4a8a",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "monospace",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 280,
  },
  input: {
    padding: "10px 14px",
    fontSize: "16px",
    border: "1px solid #4a4a8a",
    borderRadius: 4,
    background: "#2a2a4e",
    color: "#fff",
    fontFamily: "monospace",
    outline: "none",
  },
  button: {
    padding: "12px",
    fontSize: "18px",
    background: "#4a8a4a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  error: {
    color: "#ff6666",
    fontSize: "13px",
    margin: 0,
  },
};
