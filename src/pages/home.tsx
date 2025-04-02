import { useEffect, useState } from 'react';
import { GitHubUser } from '../types/github';
import pbnLogo from '../assets/pbn_logo.png';

const Home = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<GitHubUser | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");

    if (codeParam && !localStorage.getItem("accessToken")) {
      async function getAccessToken() {
        const response = await fetch(`http://localhost:4000/getAccessToken?code=${codeParam}`);
        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem("accessToken", data.access_token);
          setAccessToken(data.access_token);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      getAccessToken();
    } else {
      const token = localStorage.getItem("accessToken");
      if (token) {
        setAccessToken(token);
      }
    }
  }, []);

  useEffect(() => {
    async function getUserData() {
      if (!accessToken) return;

      const response = await fetch('http://localhost:4000/getUserData', {
        method: "GET",
        headers: {
          Authorization: "Bearer " + accessToken
        }
      });

      const data = await response.json();
      console.log("GitHub User:", data);
      setUserData(data);
    }

    getUserData();
  }, [accessToken]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUserData(null);
    window.location.replace("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="mb-6">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14 w-full" />
      </div>

      {accessToken ? (
        <>
          {userData ? (
            <h3 className="text-3xl mb-6">Welcome <strong>{userData.login}</strong></h3>
          ) : (
            <p className="mb-6">Loading user...</p>
          )}

          {/* Botones de navegación */}
            <div className="flex flex-wrap justify-center gap-4 mt-4 w-full max-w-4xl">
              {[
                { label: "Events", path: "/events" },
                { label: "Newsletter", path: "/newsletter" },
                { label: "Professor", path: "/professor" },
                { label: "Project", path: "/project" }
              ].map(({ label, path }) => (
                <button
                  key={label}
                  onClick={() => window.location.href = path}
                  className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-orange-600 transition min-w-[120px] text-sm md:text-base"
                >
                  {label}
                </button>
              ))}
            </div>


          <button onClick={handleLogout} className="my-6 text-sm underline text-gray-400 hover:text-orange-500">
            Log out
          </button>
        </>
      ) : (
        <>
          <button onClick={() => window.location.href = "/login"} className="bg-gray-800 px-4 py-2 rounded hover:bg-orange-600 transition">
            Sign in
          </button>
        </>
      )}
    </div>
  );
};

export default Home;
