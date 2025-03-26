import { useEffect, useState } from 'react';
import { GitHubUser } from '../types/github';
import pbnLogo from '../assets/pbn_logo.png';

const Home = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<GitHubUser | null>(null);

  // Detectar el código de GitHub y pedir el access_token
  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const codeParam = urlParams.get("code");

    // Si no hay token pero sí hay un code, pedimos uno nuevo
    if (codeParam && !localStorage.getItem("accessToken")) {
      async function getAccessToken() {
        const response = await fetch(`http://localhost:4000/getAccessToken?code=${codeParam}`);
        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem("accessToken", data.access_token);
          setAccessToken(data.access_token);

          // Limpiar la URL (quitar ?code=...)
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

  // Obtener datos del usuario con el access token
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
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="mb-6">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14 w-full" />
      </div>

      <h1 className="text-4xl font-bold my-3">Welcome</h1>

      {accessToken ? (
        <>
          {userData ? (
            <h3 className="text-3xl">User: <strong>{userData.login}</strong></h3>
          ) : (
            <p>Loading user...</p>
          )}
          <button onClick={handleLogout} className="my-3">Log out</button>
        </>
      ) : (
        <>
          <button onClick={() => window.location.href = "/login"}>Sign in</button>
          <button style={{ marginTop: '5px' }} onClick={() => window.location.href = "/events"}>Events</button>
        </>
      )}
    </div>
  );
};

export default Home;
