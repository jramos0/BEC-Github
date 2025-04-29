import { useEffect, useState } from 'react';
import { GitHubUser } from '../types/github';
import pbnLogo from '../assets/pbn_logo.png';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/atoms/LoadingSpinner';

const Home = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<GitHubUser | null>(null);
  
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

  useEffect(() => {
    async function getUserData() {
      if (!accessToken) return;
      const response = await fetch('http://localhost:4000/getUserData', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      });

      const data = await response.json();
      setUserData(data);
      const lastExecution = localStorage.getItem("lastForkExecution");
      const oneHour = 60 * 60 * 1000;
  
      // Si la última ejecución fue hace menos de una hora, no ejecutar de nuevo
      if (lastExecution && Date.now() - parseInt(lastExecution) < oneHour) {
        console.log("⏳ Esperando 1 hora antes de volver a ejecutar fork sync...");
        return;
      }
  
      setLoading(true);
  
      try {
        
        localStorage.setItem("username", data.login);
  
        const forkReq = await fetch('http://localhost:4000/manage/forks', {
          method: "GET",
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        });
  
        const forkRes = await forkReq.json();
        console.log(forkRes)
  
        // Guardar la hora actual como última ejecución
        localStorage.setItem("lastForkExecution", Date.now().toString());
      } catch (error) {
        console.error("❌ Error fetching user data or fork:", error);
      } finally {
        setLoading(false);
      }
    }
  
    getUserData();
  }, [accessToken]);
  

  // useEffect(() => {
  //   if (!accessToken) return;

  //   const interval = setInterval(async () => {
  //     try {
  //       console.log("Checking...")
  //       const res = await fetch('http://localhost:4000/manage/checkPR', {
  //         method: 'GET',
  //         headers: {
  //           Authorization: 'Bearer ' + accessToken,
  //         },
  //       });

  //       const data = await res.json();
  //       if (data.message?.includes("Fork eliminado")) {
  //         alert("Your session has ended. Please sign in again.");
  //         handleLogout(); // Cierra sesión automáticamente
  //       }
  //     } catch (err) {
  //       console.error("Error checking PR status:", err);
  //     }
  //   }, 30000); // 30 segundos

  //   // Limpieza cuando se desmonta el componente o cambia el token
  //   return () => clearInterval(interval);
  // }, [accessToken]);


  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username')
    setAccessToken(null);
    setUserData(null);
    window.location.replace('/');
  };

  // Mostrar spinner mientras carga
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
        <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 right-4 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded shadow-md text-sm"
      >
        Dashboard
      </button>
          {userData ? (
            <div>
              <h3 className="text-3xl mb-6">
              Welcome <strong>{userData.login}</strong>
            </h3>
            </div>
          ) : (
            <p className="mb-6">Loading user...</p>
          )}

          {/* Botones de navegación */}
          <div className="flex flex-wrap justify-center gap-4 mt-2 w-full max-w-4xl">
            {[
              { label: 'Events', path: '/events' },
              { label: 'Newsletter', path: '/newsletter' },
              { label: 'Professor', path: '/professor' },
              { label: 'Project', path: '/projects' },
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
