
import { useState } from "react";

const API = "http://localhost:8000/api/auth";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
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
      throw new Error("CSRF token not found.");
    }

    return decodeURIComponent(cookie.split("=")[1]);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API}/login/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setUserEmail(data.email);
      setLoggedIn(true);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }


  async function handleLogout() {
    setLoading(true);
    setMessage("");

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
        throw new Error(data.message || `Logout failed (${response.status})`);
      }

      setLoggedIn(false);
      setUserEmail("");
      setEmail("");
      setPassword("");
      setRemaining(0);
      setMessage("Logged out successfully");
    } catch (error) {
      setMessage(error.message || "Logout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }



  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-orange-600">
          Session Manager
        </h1>

        <p className="mb-6 text-center text-gray-500">
          Secure login with Django sessions
        </p>

        {message && (
          <p
            role="status"
            className="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-700"
          >
            {message}
          </p>
        )}

        {loggedIn ? (
          <div className="text-center">
            <h2 className="mb-3 text-xl font-semibold">Welcome!</h2>
            <p className="mb-6 text-gray-600">{userEmail}</p>


            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {loading ? "Logging out..." : "Logout"}
            </button>

          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default App;
