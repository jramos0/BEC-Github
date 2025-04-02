import { useState } from "react";
import LoadingSpinner from "./atoms/LoadingSpinner";

const GithubLoginButton = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const scope = import.meta.env.VITE_SCOPE;
    const redirectUri = window.location.origin;

    const githubAuthUrl = `${import.meta.env.VITE_BACKEND_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    setTimeout(() => {
      window.location.href = githubAuthUrl;
    }, 300);
  };
  return loading ? (
    <LoadingSpinner message="Redirecting to GitHub..." />
  ) : (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-white font-semibold transition duration-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path
          fillRule="evenodd"
          d="M12 2a10 10 0 00-3.162 19.495c..."
          clipRule="evenodd"
        />
      </svg>
      Continue with GitHub
    </button>
  );
};

export default GithubLoginButton;
