import React, { useState } from "react";
import { Mail, Lock, Crown, UserPlus } from "lucide-react";
import { useNavigate } from 'react-router-dom';


function OwnerLogin() {
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
    body: JSON.stringify({ ...form, role: "owner" }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  setMessage(`Welcome ${data.user.name}! Logged in successfully.`);
  setTimeout(() => {
    window.location.href = "/owner/dashboard";
  }, 1500);

} catch (err) {
  setMessage(err.message);
} finally {
  setIsLoading(false);
}
  };

  const handleRegisterClick = () => {
    console.log("Navigate to register page");
     navigate('/register');
  };

  return (
    <div style={styles.container}>
      {/* Main Container */}
      <div style={styles.wrapper}>
        {/* Professional Card */}
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <Crown size={24} color="#dc2626" />
            </div>
            <h2 style={styles.title}>Owner Portal</h2>
            <p style={styles.subtitle}>Sign in to your business dashboard</p>
          </div>

          {/* Messages */}
          {message && (
            <div style={
              message.includes("Welcome") || message.includes("successfully")
                ? styles.successMessage
                : message === "Loading..."
                ? styles.loadingMessage
                : styles.errorMessage
            }>
              {message}
            </div>
          )}

          {/* Form Fields */}
          <div style={styles.formContainer}>
            {/* Email Field */}
            <div style={styles.fieldContainer}>
              <label style={styles.label}>
                Email Address
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.fieldContainer}>
              <label style={styles.label}>
                Password
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                ...styles.submitButton,
                ...(isLoading ? styles.submitButtonDisabled : {})
              }}
              className="submit-button"
            >
              {isLoading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  Signing in...
                </div>
              ) : (
                "Access Dashboard"
              )}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine}></div>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegisterClick}
              style={styles.registerButton}
              className="register-button"
            >
              <UserPlus size={16} style={styles.registerIcon} />
              Create Business Account
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div style={styles.termsContainer}>
          <p style={styles.termsText}>
            Exclusive access for verified business owners
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fef2f2 0%, #f8fafc 50%, #fdf2f8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  wrapper: {
    width: "100%",
    maxWidth: "400px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    transition: "box-shadow 0.3s ease",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  iconContainer: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #fee2e2 0%, #fce7f3 100%)",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0",
  },
  errorMessage: {
    marginBottom: "24px",
    padding: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
    borderRadius: "8px",
  },
  successMessage: {
    marginBottom: "24px",
    padding: "12px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "14px",
    borderRadius: "8px",
  },
  loadingMessage: {
    marginBottom: "24px",
    padding: "12px",
    backgroundColor: "#eff6ff",
    border: "1px solid #c7d2fe",
    color: "#1d4ed8",
    fontSize: "14px",
    borderRadius: "8px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldContainer: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    paddingLeft: "40px",
    paddingRight: "16px",
    paddingTop: "12px",
    paddingBottom: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#111827",
    fontSize: "16px",
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  submitButton: {
    width: "100%",
    padding: "12px 16px",
    background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
    color: "#ffffff",
    fontWeight: "500",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
    outline: "none",
  },
  submitButtonDisabled: {
    opacity: "0.5",
    cursor: "not-allowed",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid transparent",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "8px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e5e7eb"
  },
  dividerText: {
    padding: "0 16px",
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500"
  },
  registerButton: {
    width: "100%",
    padding: "12px 16px",
    background: "#ffffff",
    color: "#374151",
    fontWeight: "500",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
    outline: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  registerIcon: {
    color: "#6b7280"
  },
  termsContainer: {
    marginTop: "24px",
    textAlign: "center",
  },
  termsText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
  }
};

// Add CSS animations and styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #dc2626 !important;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
  }
  
  .submit-button:hover:not(:disabled) {
    background: linear-gradient(90deg, #b91c1c 0%, #991b1b 100%) !important;
    transform: translateY(-1px);
  }
  
  .register-button:hover {
    background: #f9fafb !important;
    border-color: #9ca3af !important;
    transform: translateY(-1px);
  }
  
  .card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  }
`;

if (!document.getElementById('owner-login-styles')) {
  styleSheet.id = 'owner-login-styles';
  document.head.appendChild(styleSheet);
}

export default OwnerLogin;