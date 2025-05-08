// src/components/DashboardView.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DashboardView() {
  const navigate = useNavigate();
  const [pullRequests, setPullRequests] = useState([{
    id: "",
    title: "",
    created_at: "",
    resource_type: "",
    state: "",
    draft: false as Boolean,
  }]);

  const [activeBranches,setActiveBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [deleteMessage, setDeleteMessage] = useState<string>('');



  const TOKEN = localStorage.getItem('accessToken');
  const REPO_OWNER = "jramos0";
  const REPO_NAME = "bitcoin-educational-content";
  const USERNAME = localStorage.getItem('username');

  useEffect(() => {
    const fetchPRs = async () => {
    try{
        // Obtener PRs del repositorio
        const prsResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all`, {
            headers: { Authorization: `token ${TOKEN}` },
        });
        const prsData = await prsResponse.json();

        // Filtrar PRs del usuario autenticado
        const userPRs = prsData.filter((pr: any) => pr.user.login === USERNAME);
        setPullRequests(userPRs);
    }catch(error){
      console.error({error: "Error fetching user's PRs"})
    }
  }
    fetchPRs();
}, []);

  useEffect(()=>{
    const getBranches = async () =>{
      try {
         const response = await fetch("http://localhost:4000/manage/branches",{
          method: 'GET',
          headers: { Authorization: `token ${TOKEN}` },
         })
         if (!response.ok) {
          throw new Error(`Error al obtener ramas: ${response.status}`);
        }

         const jsonData: string[] = await response.json()

         setActiveBranches(jsonData)
      }catch(err: unknown){
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido');
        }
      }finally {
        setLoading(false);
      }
    }
    getBranches();
  },[]);

  const deleteBranch = async () => {
    if (!selectedBranch) {
      setDeleteMessage('Selecciona una rama para eliminar.');
      return;
    }
    try {
      const response = await fetch("http://localhost:4000/manage/deletebranch", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${TOKEN}`,
        },
        body: JSON.stringify({ branchName: selectedBranch })
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar la rama: ${response.status}`);
      }

      const result = await response.json();
      setDeleteMessage(result.message || 'Rama eliminada correctamente.');

      // Actualiza la lista de ramas eliminando la rama borrada
      setActiveBranches(prev => prev.filter(branch => branch !== selectedBranch));
      setSelectedBranch('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteMessage(`Error: ${err.message}`);
      } else {
        setDeleteMessage('Error desconocido al eliminar la rama.');
      }
    }
  };


  const handleClick = (id: string) => {
    navigate(`/dashboard/pr/${id}`); // Aquí se redirigirá a la vista individual del PR
  };

  return (
    <div>
       <div className="rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Select a Branch</h1>
        {loading ? (
          <p className="text-black-500">Cargando ramas...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
          <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className=" text-white bg-black p-2 border border-white-300 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
            Expand to choose a branch
            </option>
            {activeBranches.map((activeBranches) => (
              <option key={activeBranches} value={activeBranches}>
                {activeBranches}
              </option>
            ))}
          </select>
          <button
              onClick={deleteBranch}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors"
            >
              Eliminar Rama
            </button>
            {deleteMessage && (
              <p className={`mt-4 ${deleteMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {deleteMessage}
              </p>
            )}
          </>
        )}
       </div>
      <h2 className="text-2xl font-bold mb-2">Your Draft Pull Requests</h2>
      {pullRequests.filter(pr=> pr.draft && pr.state == "open").length === 0 ? (
        <p className="text-gray-400 mb-6">No "draft" PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr=> pr.draft && pr.state == "open").map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-700 rounded p-4 hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleClick(pr.id)}
            >
              <h3 className="text-lg font-semibold">{pr.title}</h3>
              <p className="text-sm text-gray-400">
                Resource: {pr.resource_type} — Created on {pr.created_at}
              </p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-2xl font-bold mb-2">Your Pull Requests Ready-For-Review</h2>
      {pullRequests.filter(pr => pr.state == "open" && pr.draft == false).length === 0 ? (
        <p className="text-gray-400 mb-6">No PRs "ready-for-review" found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr => pr.state == "open" && pr.draft == false).map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-700 rounded p-4 hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleClick(pr.id)}
            >
              <h3 className="text-lg font-semibold">{pr.title}</h3>
              <p className="text-sm text-gray-400">
                Resource: {pr.resource_type} — Created on {pr.created_at}
              </p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-2xl font-bold mb-2">Your Closed/Merged Pull Requests</h2>
      {pullRequests.filter(pr => pr.state == "closed").length === 0 ? (
        <p className="text-gray-400 mb-6">No "closed" or "merged" PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr => pr.state == "closed").map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-700 rounded p-4 hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleClick(pr.id)}
            >
              <h3 className="text-lg font-semibold">{pr.title}</h3>
              <p className="text-sm text-gray-400">
                Resource: {pr.resource_type} — Created on {pr.created_at}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DashboardView;
