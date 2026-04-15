import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    user,
    setIsAuthenticated,
    setUser,
    loading,
  } = useAuth();

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");

      setIsAuthenticated(false);
      setUser(null);

      navigate("/login");

    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link
        to="/"
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500"
      >
        CodeVista
      </Link>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span className="text-gray-300 font-medium">
              Hello, {user?.name}
            </span>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};