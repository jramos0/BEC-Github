import { useEffect, useState } from 'react';
import pbnLogo from '../assets/pbn_logo.png';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/atoms/LoadingSpinner';

const Home = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Obtener token desde GitHub si viene con ?code=
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');

    if (codeParam && !localStorage.getItem('accessToken')) {
      setLoading(true);
      async function getAccessToken() {
        const response = await fetch(`http://localhost:4000/getAccessToken?code=${codeParam}`);
        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem('accessToken', data.access_token);
          setAccessToken(data.access_token);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setLoading(false);
      }

      getAccessToken();
    } else {
      const token = localStorage.getItem('accessToken');
      if (token) {
        setAccessToken(token);
      }
    }
  }, []);

  // Leer username desde localStorage cuando se monta
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Obtener el username desde la API si tenemos el token y no está ya guardado
  useEffect(() => {
    async function getUserData() {
      if (!accessToken || username) return;

      const response = await fetch('http://localhost:4000/getUserData', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      });

      const data = await response.json();
      localStorage.setItem('username', data.login);
      setUsername(data.login);

      const lastExecution = localStorage.getItem("lastForkExecution");
      const oneHour = 60 * 60 * 1000;

      if (lastExecution && Date.now() - parseInt(lastExecution) < oneHour) {
        console.log("⏳ Esperando 1 hora antes de volver a ejecutar fork sync...");
        return;
      }

      setLoading(true);
      try {
        const forkReq = await fetch('http://localhost:4000/manage/forks', {
          method: "GET",
          headers: {
            Authorization: "token " + accessToken,
          },
        });

        const forkRes = await forkReq.json();
        console.log(forkRes);

        localStorage.setItem("lastForkExecution", Date.now().toString());
      } catch (error) {
        console.error("❌ Error fetching fork:", error);
      } finally {
        setLoading(false);
      }
    }

    getUserData();
  }, [accessToken, username]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setAccessToken(null);
    setUsername(null);
    window.location.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner message="Preparing your session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="mb-6">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14 w-full" />
      </div>

      {accessToken ? (
        <>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => navigate('/editResource')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded shadow-md text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded shadow-md text-sm"
            >
              Dashboard
            </button>
          </div>
          {username ? (
            <div>
              <h3 className="text-3xl mb-6">
                Welcome <strong>{username}</strong>
              </h3>
            </div>
          ) : (
            <p className="mb-6">Loading user...</p>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-2 w-full max-w-4xl">
            {[
              { label: 'Events', path: '/events' },
              { label: 'Newsletter', path: '/newsletter' },
              { label: 'Professor', path: '/professor' },
              { label: 'Project', path: '/projects' },
              { label: 'Tutorial', path: '/tutorials' },
            ].map(({ label, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-orange-600 transition min-w-[120px] text-sm md:text-base"
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="my-6 text-sm underline text-gray-400 hover:text-orange-500"
          >
            Log out
          </button>
        </>
      ) : (
        <button
          onClick={() => navigate('/login')}
          className="bg-gray-800 px-4 py-2 rounded hover:bg-orange-600 transition"
        >
          Sign in
        </button>
      )}
    </div>
  );
};

export default Home;