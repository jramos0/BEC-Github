const GithubLoginButton = () => {
  const handleLogin = () => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const scope = import.meta.env.VITE_SCOPE;
    const redirectUri = window.location.origin;

    const githubAuthUrl = `${import.meta.env.VITE_BACKEND_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    window.location.assign(githubAuthUrl);
  };
  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-white font-semibold transition duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2a10 10 0 00-3.162 19.495c.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.34-3.369-1.34-.454-1.152-1.11-1.458-1.11-1.458-.908-.62.069-.607.069-.607 1.004.07 1.532 1.032 1.532 1.032.892 1.528 2.341 1.087 2.91.831.09-.646.35-1.087.636-1.337-2.22-.252-4.555-1.112-4.555-4.95 0-1.093.39-1.988 1.029-2.689-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026a9.564 9.564 0 012.504-.337c.85.004 1.705.114 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.546 1.377.203 2.394.1 2.647.64.701 1.028 1.596 1.028 2.689 0 3.846-2.338 4.695-4.566 4.942.358.308.678.917.678 1.85 0 1.336-.012 2.414-.012 2.743 0 .267.18.579.688.48A10.002 10.002 0 0012 2z" clipRule="evenodd" />
      </svg>
      Continue with GitHub
    </button>
  );
};

export default GithubLoginButton;
