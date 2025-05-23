// src/components/DashboardView.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch } from "lucide-react";

function DashboardView() {
  const navigate = useNavigate();
  const [pullRequests, setPullRequests] = useState([{
    id: "",
    title: "",
    created_at: "",
    resource_type: "",
    state: "",
    draft: false as boolean,
    html_url: "",
    user: { login: "" }
  }]);

  const [activeBranches, setActiveBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [deleteMessage, setDeleteMessage] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const TOKEN = localStorage.getItem('accessToken');
  const REPO_OWNER = "jramos0";
  const REPO_NAME = "bitcoin-educational-content";
  const USERNAME = localStorage.getItem('username');

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        const prsResponse = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all`,
          { headers: { Authorization: `token ${TOKEN}` } }
        );
        const prsData = await prsResponse.json();

        // Filter PRs by authenticated user
        const userPRs = prsData.filter((pr: any) => pr.user.login === USERNAME);
        setPullRequests(userPRs);
      } catch (error) {
        console.error({ error: "Error fetching user's PRs" });
      }
    };
    fetchPRs();
  }, []);

  useEffect(() => {
  const getBranches = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/manage/branches`, // ✅ Variable de entorno
        {
          method: 'GET',
          headers: { Authorization: `token ${TOKEN}` },
        }
      );
      if (!response.ok) {
        throw new Error(`Error al obtener ramas: ${response.status}`);
      }
      const jsonData: string[] = await response.json();
      setActiveBranches(jsonData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };
  getBranches();
}, []);

const deleteBranch = async () => {
  if (!selectedBranch) {
    setDeleteMessage('Selecciona una rama para eliminar.');
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/manage/deletebranch`, // ✅ Variable de entorno
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${TOKEN}`,
        },
        body: JSON.stringify({ branchName: selectedBranch }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error al eliminar la rama: ${response.status}`);
    }

    const result = await response.json();
    setDeleteMessage(result.message || 'Rama eliminada correctamente.');
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

const markAsReady = async (branchName: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/manage/updatepr`, // ✅ Variable de entorno
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ branchName }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error desconocido');
    }

    setUpdateStatus(data.message || '✅ PR marcado como Ready for Review');
  } catch (err: unknown) {
    if (err instanceof Error) {
      setUpdateStatus(`❌ Error: ${err.message}`);
    } else {
      setUpdateStatus('❌ Error desconocido al actualizar el PR.');
    }
  }
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
            <div className="bg-gray-900 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 mb-10 border border-gray-700">
              <div className="flex items-center gap-3 flex-1 w-full">
                <GitBranch className="text-orange-400 w-5 h-5 shrink-0 mt-1" />
                <div className="w-full">
                  <label className="block text-sm text-gray-400 mb-2">Branch seleccionada</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full bg-black text-white border border-gray-600 px-4 py-2 rounded focus:ring-orange-400 focus:outline-none"
                  >
                    <option value="" disabled>Elegí una rama</option>
                    {activeBranches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={deleteBranch}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded shadow transition-all"
              >
                Eliminar Rama
              </button>
              <button
                onClick={() => {
                  if (!selectedBranch) {
                    setUpdateStatus('❌ Selecciona una rama antes de marcar como ready.');
                    return;
                  }
                  markAsReady(selectedBranch);
                }}
                className="bg-green-600 text-white py-2 px-7 rounded hover:bg-green-700 transition-colors rounded shadow"
              >
                Marcar como Ready for Review
              </button>
            </div>

            {(deleteMessage || updateStatus) && (
              <p
                className={`mt-4 ${(deleteMessage?.startsWith('Error') || updateStatus?.startsWith('❌'))
                  ? 'text-red-500'
                  : 'text-green-500'
                }`}
              >
                {deleteMessage || updateStatus}
              </p>
            )}
          </>
        )}
      </div>
      <h2 className="text-2xl font-bold mb-2">Your Draft Pull Requests</h2>
      {pullRequests.filter(pr => pr.draft && pr.state == "open").length === 0 ? (
        <p className="text-gray-400 mb-6">No \"draft\" PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr => pr.draft && pr.state == "open").map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-700 rounded p-4 hover:bg-gray-800 transition cursor-pointer"
            >
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h3 className="text-lg font-semibold text-blue-400 underline">{pr.title}</h3>
                <p className="text-sm text-gray-400">
                  Resource: {pr.resource_type} — Created on {pr.created_at}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-2xl font-bold mb-2">Your Pull Requests Ready-For-Review</h2>
      {pullRequests.filter(pr => pr.state == "open" && pr.draft == false).length === 0 ? (
        <p className="text-gray-400 mb-6">No PRs \"ready-for-review\" found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr => pr.state == "open" && pr.draft == false).map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-700 rounded p-4 hover:bg-gray-800 transition cursor-pointer"
            >
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h3 className="text-lg font-semibold text-blue-400 underline">{pr.title}</h3>
                <p className="text-sm text-gray-400">
                  Resource: {pr.resource_type} — Created on {pr.created_at}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-2xl font-bold mb-2">Your Closed/Merged Pull Requests</h2>
      {pullRequests.filter(pr => pr.state == "closed").length === 0 ? (
        <p className="text-gray-400 mb-6">No \"closed\" or \"merged\" PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests
            .filter(pr => pr.state == "closed")
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 7)
            .map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-700 rounded p-4 hover:bg-gray-800 transition cursor-pointer"
            >
              <a
                href={pr.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h3 className="text-lg font-semibold text-blue-400 underline">{pr.title}</h3>
                <p className="text-sm text-gray-400">
                  Resource: {pr.resource_type} — Created on {pr.created_at}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DashboardView;
