import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Loading...");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "user" }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage(`Welcome ${data.user.name}! Redirecting...`);
      setTimeout(() => navigate("/user/dashboard"), 1500);
    } catch (err) {
      setMessage(err.message || "Account not found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Sign In</h1>
          <p style={styles.subtitle}>Enter your credentials to access your account</p>
        </div>
        
        {message && (
          <div style={message.includes("Welcome") ? styles.success : styles.error}>
            {message}
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            style={{
              ...styles.submit,
              ...(isLoading ? styles.submitDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = "#1f2937";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = "#374151";
              }
            }}
          >
            {isLoading ? (
              <span style={styles.loadingContent}>
                <span style={styles.spinner}></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account?</span>
          <button 
            onClick={() => navigate("/register")}
            style={styles.registerLink}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.target.style.textDecoration = "none";
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: "100vh", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#f9fafb",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    padding: "24px"
  },
  
  card: { 
    backgroundColor: "#ffffff", 
    padding: "48px", 
    borderRadius: "8px", 
    width: "100%", 
    maxWidth: "400px", 
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb"
  },
  
  header: {
    textAlign: "center",
    marginBottom: "32px"
  },
  
  title: { 
    fontSize: "24px", 
    fontWeight: "600", 
    color: "#111827",
    margin: "0 0 8px 0",
    letterSpacing: "-0.025em"
  },
  
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0",
    fontWeight: "400",
    lineHeight: "1.5"
  },
  
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    display: "block"
  },
  
  input: { 
    width: "100%",
    padding: "12px 14px", 
    borderRadius: "6px", 
    border: "1px solid #d1d5db", 
    fontSize: "14px", 
    outline: "none",
    transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
    backgroundColor: "#ffffff",
    color: "#111827",
    boxSizing: "border-box"
  },
  
  submit: { 
    width: "100%",
    padding: "12px", 
    backgroundColor: "#374151", 
    color: "#ffffff", 
    borderRadius: "6px", 
    border: "none", 
    cursor: "pointer", 
    fontWeight: "500",
    fontSize: "14px",
    transition: "background-color 0.15s ease-in-out",
    marginTop: "8px"
  },
  
  submitDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed"
  },
  
  loadingContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  
  error: { 
    padding: "12px", 
    backgroundColor: "#fef2f2", 
    color: "#dc2626", 
    borderRadius: "6px",
    border: "1px solid #fecaca",
    fontSize: "14px",
    marginBottom: "24px"
  },
  
  success: { 
    padding: "12px", 
    backgroundColor: "#f0fdf4", 
    color: "#166534", 
    borderRadius: "6px",
    border: "1px solid #bbf7d0",
    fontSize: "14px",
    marginBottom: "24px"
  },
  
  footer: {
    textAlign: "center",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb"
  },
  
  footerText: {
    fontSize: "14px",
    color: "#6b7280",
    marginRight: "8px"
  },
  
  registerLink: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "none",
    transition: "text-decoration 0.15s ease-in-out",
    padding: "0"
  }
};

// Add CSS for focus states and animations
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
  }
`;
document.head.appendChild(styleSheet);

export default Login;