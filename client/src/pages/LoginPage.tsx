import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { verifyUser, isAuthenticated } = useAuth();

  const from =
    location.state?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  // If already logged in, redirect
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      await axiosInstance.post(
        "/auth/login",
        formData
      );

      await verifyUser();

      navigate(from, { replace: true });

    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to login."
      );

    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-xl">
        <h2 className="text-3xl font-bold text-center text-white">
          Welcome Back
        </h2>

        <p className="text-gray-400 text-center mt-2">
          Or{" "}
          <Link
            to="/signup"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Create a new account
          </Link>
        </p>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500 text-red-400 p-3 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded font-semibold disabled:opacity-50"
          >
            {isLoading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};