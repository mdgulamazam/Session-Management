import { useEffect, useState } from "react";

const API = "http://localhost:8000/api/auth";
const SESSION_SECONDS = 600;

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const [userEmail, setUserEmail] = useState("");

  async function getCsrfToken() {
    const response = await fetch(`${API}/csrf/`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Could not get CSRF token.");
    }

    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("csrftoken="));

    if (!cookie) {
      throw new Error(
        "CSRF token not found. Check Django CSRF cookie and CORS settings."
      );
    }

    return decodeURIComponent(cookie.split("=")[1]);
  }

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    showMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API}/register/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsRegistering(false);
      showMessage(
        data.message || "Registration successful! Please log in.",
        "success"
      );
    } catch (error) {
      showMessage(error.message || "Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    showMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API}/login/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setUserEmail(data.email || email);
      setRemaining(SESSION_SECONDS);
      setLoggedIn(true);
      setPassword("");
      showMessage(data.message || "Login successful.", "success");
    } catch (error) {
      showMessage(error.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loggedIn) return;

    let lastSent = 0;

    async function recordActivity() {
      const now = Date.now();

      if (now - lastSent < 5000) return;
      lastSent = now;

      try {
        const csrfToken = await getCsrfToken();

        const response = await fetch(`${API}/activity/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        });

        if (response.status === 401) {
          const data = await response.json();

          setLoggedIn(false);
          setUserEmail("");
          setRemaining(0);
          showMessage(
            data.message ||
            "Your session has expired. Please login again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Could not record activity:", error);
      }
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true })
    );

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, recordActivity)
      );
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;

    const timer = setInterval(() => {
      setRemaining((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setLoggedIn(false);
          setUserEmail("");
          showMessage(
            "Your session has expired. Please login again.",
            "error"
          );
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loggedIn]);

  async function handleVerifySession() {
    setVerifying(true);
    showMessage("");

    try {
      const response = await fetch(`${API}/dashboard/`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        setLoggedIn(false);
        setUserEmail("");
        setRemaining(0);
        showMessage(
          data.message || "Your session has expired. Please login again.",
          "error"
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not verify session.");
      }

      if (data.email) {
        setUserEmail(data.email);
      }

      showMessage(data.message || "Your session is valid.", "success");
    } catch (error) {
      showMessage(error.message || "Session verification failed.", "error");
    } finally {
      setVerifying(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    showMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API}/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Logout failed (${response.status})`
        );
      }

      setLoggedIn(false);
      setUserEmail("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRemaining(0);
      showMessage("Logged out successfully.", "success");
    } catch (error) {
      showMessage(error.message || "Logout failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  const timerText = `${String(minutes).padStart(2, "0")}:${seconds}`;
  const timerProgress = (remaining / SESSION_SECONDS) * 100;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl"
      />

      <section className="relative w-full max-w-lg">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 sm:text-4xl">
            Session <span className="text-blue-600">Manager</span>
          </h1>

          <p className="mt-2 text-sm text-orange-500 sm:text-base">
            Secure access. Simple session management.
          </p>
        </header>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
          {loggedIn ? (
            <div>
              <div className="mb-7 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    YOUR WORKSPACE
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Welcome back!
                  </h2>
                  <p className="mt-2 break-all text-sm text-slate-500">
                    {userEmail}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Session time remaining
                    </p>
                    <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                      {timerText}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l3 2M9 2h6M12 2v3" />
                    </svg>
                  </div>
                </div>

                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-white"
                  role="progressbar"
                  aria-label="Session time remaining"
                  aria-valuemin={0}
                  aria-valuemax={SESSION_SECONDS}
                  aria-valuenow={remaining}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-1000"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Your session is monitored for security. The countdown
                  represents the configured 10-minute timer.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleVerifySession}
                  disabled={verifying || loading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Session"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading || verifying}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-7">
                <p className="text-sm font-semibold text-blue-600">
                  {isRegistering ? "GET STARTED" : "WELCOME"}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {isRegistering
                    ? "Create your account"
                    : "Sign in to your account"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isRegistering
                    ? "Register to access your secure dashboard."
                    : "Enter your credentials to securely access your dashboard."}
                </p>
              </div>

              <form
                onSubmit={isRegistering ? handleRegister : handleLogin}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {isRegistering && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      required
                      placeholder="Confirm your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 font-semibold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Please wait...
                    </>
                  ) : isRegistering ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                {isRegistering
                  ? "Already have an account?"
                  : "Don't have an account?"}

                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering((previous) => !previous);
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    showMessage("");
                  }}
                  className="ml-2 font-semibold text-blue-600 hover:text-violet-600"
                >
                  {isRegistering ? "Login" : "Register"}
                </button>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                Protected by Django session authentication and CSRF security.
              </p>
            </div>
          )}

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-6 rounded-xl border p-3.5 text-sm leading-6 ${messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
            >
              {message}
            </div>
          )}
        </div>

        <footer className="mt-6 text-center text-xs text-slate-400">
          Session Manager · Secure session control
        </footer>
      </section>
    </main>
  );
}

export default App;
