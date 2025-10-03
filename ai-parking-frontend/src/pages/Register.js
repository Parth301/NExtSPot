import React, { useState } from "react";
import { User, Mail, Lock, UserCheck, LogIn } from "lucide-react";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Loading...");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setMessage(data.message);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
   
    console.log("Navigate to login page");
     window.location.href = "/login";
  };

  const handleOwnerLoginClick = () => {
    
    console.log("Navigate to owner login page");
     window.location.href = "/owner-login";
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
              <UserCheck size={24} color="#2563eb" />
            </div>
            <h2 style={styles.title}>Create Account</h2>
            <p style={styles.subtitle}>Please fill in your information to register</p>
          </div>

          {/* Messages */}
          {message && (
            <div style={
              message.includes("success") || message.includes("Success") || message.includes("created")
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
            {/* Name Field */}
            <div style={styles.fieldContainer}>
              <label style={styles.label}>
                Full Name
              </label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

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
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div style={styles.fieldContainer}>
              <label style={styles.label}>
                Account Type
              </label>
              <div style={styles.selectWrapper}>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="user">User Account</option>
                  <option value="owner">Business Owner</option>
                </select>
                <div style={styles.selectArrow}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
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
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine}></div>
            </div>

            {/* Owner Login Link */}
            <div style={styles.ownerLoginContainer}>
              <p style={styles.ownerLoginText}>
                Business owner?{" "}
                <button 
                  onClick={handleOwnerLoginClick}
                  style={styles.ownerLoginLink}
                  className="owner-login-link"
                >
                  Access owner portal
                </button>
              </p>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLoginClick}
              style={styles.loginButton}
              className="login-button"
            >
              <LogIn size={16} style={styles.loginIcon} />
              Already have an account? Sign in
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div style={styles.termsContainer}>
          <p style={styles.termsText}>
            By creating an account, you agree to our{" "}
            <button style={styles.termsLink}>
              Terms of Service
            </button>{" "}
            and{" "}
            <button style={styles.termsLink}>
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eef2ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  ownerLoginContainer: {
    textAlign: "center",
    margin: "4px 0",
  },
  ownerLoginText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0",
  },
  ownerLoginLink: {
    color: "#dc2626",
    fontWeight: "500",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  wrapper: {
    width: "100%",
    maxWidth: "448px",
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
    marginBottom: "24px",
  },
  iconContainer: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
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
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
    borderRadius: "8px",
  },
  successMessage: {
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "14px",
    borderRadius: "8px",
  },
  loadingMessage: {
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#eff6ff",
    border: "1px solid #c7d2fe",
    color: "#1d4ed8",
    fontSize: "14px",
    borderRadius: "8px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
    marginBottom: "6px",
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
    paddingTop: "10px",
    paddingBottom: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#111827",
    fontSize: "16px",
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  selectWrapper: {
    position: "relative",
  },
  select: {
    width: "100%",
    padding: "10px 40px 10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#111827",
    fontSize: "16px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  selectArrow: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    pointerEvents: "none",
  },
  submitButton: {
    width: "100%",
    padding: "10px 16px",
    background: "linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)",
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
    margin: "4px 0",
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
  loginButton: {
    width: "100%",
    padding: "10px 16px",
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
  loginIcon: {
    color: "#6b7280"
  },
  termsContainer: {
    marginTop: "16px",
    textAlign: "center",
  },
  termsText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
  },
  termsLink: {
    color: "#2563eb",
    fontWeight: "500",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.2s ease",
  }
};

// Add CSS animations and styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus, select:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
  }
  
  .submit-button:hover:not(:disabled) {
    background: linear-gradient(90deg, #1d4ed8 0%, #4338ca 100%) !important;
    transform: translateY(-1px);
  }
  
  .login-button:hover {
    background: #f9fafb !important;
    border-color: #9ca3af !important;
    transform: translateY(-1px);
  }
  
  .card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  }
  
  .terms-link:hover {
    color: #1d4ed8 !important;
  }
  
  .owner-login-link:hover {
    color: #b91c1c !important;
  }
`;

if (!document.getElementById('register-styles')) {
  styleSheet.id = 'register-styles';
  document.head.appendChild(styleSheet);
}

export default Register;