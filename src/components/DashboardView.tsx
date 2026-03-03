// src/components/DashboardView.tsx
import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";

type PullRequest = {
  id: number | string;
  number?: number;
  title: string;
  created_at: string;
  resource_type?: string;
  state: string;
  draft: boolean;
  html_url?: string;
};

function DashboardView() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);

  const [activeBranches,setActiveBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPrCount, setTotalPrCount] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [deleteMessage, setDeleteMessage] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);



  const TOKEN = localStorage.getItem('accessToken');
  const REPO_OWNER = "jramos0";
  const REPO_NAME = "bitcoin-educational-content";
  const USERNAME = localStorage.getItem('username');

  useEffect(() => {
    const fetchUserPRs = async () => {
      if (!TOKEN || !USERNAME) {
        setError('No se encontró token o usuario.');
        setLoading(false);
        return;
      }

      try {
        const [prsResponse, countResponse] = await Promise.all([
          fetch('http://localhost:4000/manage/user-prs', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ USERNAME, REPO_OWNER, REPO_NAME }),
          }),
          fetch('http://localhost:4000/manage/user-prs-count', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ USERNAME, REPO_OWNER, REPO_NAME }),
          })
        ]);

        const [prsData, countData] = await Promise.all([
          prsResponse.json(),
          countResponse.json()
        ]);

        if (!prsResponse.ok) {
          throw new Error(prsData.error || `Error ${prsResponse.status}`);
        }

        if (!countResponse.ok) {
          throw new Error(countData.error || `Error ${countResponse.status}`);
        }

        setPullRequests(prsData);
        setTotalPrCount(typeof countData.total === "number" ? countData.total : prsData.length);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPRs();
  }, [TOKEN, USERNAME]);

  useEffect(() => {
      const getBranches = async () => {
        try {
          const response = await fetch("http://localhost:4000/manage/branches", {
            method: 'GET',
            headers: { 'Authorization': `token ${TOKEN}` },
          });
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
        const response = await fetch("http://localhost:4000/manage/deletebranch", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${TOKEN}`,
          },
          body: JSON.stringify({ branchName: selectedBranch }),
        });

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
        const response = await fetch("http://localhost:4000/manage/updatepr", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${TOKEN}`,
          },
          body: JSON.stringify({ branchName }),
        });

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


  const handleClick = (pr: PullRequest) => {
    const prUrl = pr.html_url || (pr.number ? `https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${pr.number}` : "");
    if (!prUrl) return;
    window.open(prUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Select a Branch</h1>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Cargando ramas...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 mb-10 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 flex-1 w-full">
                <GitBranch className="text-orange-400 w-5 h-5 shrink-0 mt-1" />
                <div className="w-full">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Branch seleccionada</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full bg-cream dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-4 py-2 rounded focus:ring-orange-400 focus:outline-none"
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
                Delete Branch
              </button>
              <button
                onClick={() => {
                  if (!selectedBranch) {
                    setUpdateStatus('❌ Selecciona una rama antes de marcar como ready.');
                    return;
                  }
                  markAsReady(selectedBranch);
                }}
                className="bg-green-600 text-white py-2 px-7 rounded hover:bg-green-700 transition-colors shadow"
              >
                Mark as Ready for Review
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
      {pullRequests.filter(pr=> pr.draft && pr.state == "open").length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 mb-6">No "draft" PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr=> pr.draft && pr.state == "open").map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleClick(pr)}
            >
              <h3 className="text-lg font-semibold">{pr.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resource: {pr.resource_type} — Created on {pr.created_at}
              </p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-2xl font-bold mb-2">Your Pull Requests Ready-For-Review</h2>
      {pullRequests.filter(pr => pr.state == "open" && pr.draft == false).length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 mb-6">No PRs "ready-for-review" found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr => pr.state == "open" && pr.draft == false).map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleClick(pr)}
            >
              <h3 className="text-lg font-semibold">{pr.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resource: {pr.resource_type} — Created on {pr.created_at}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold">Your Closed/Merged Pull Requests</h2>
        <span className="text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded px-2 py-1">
          Total created: {totalPrCount ?? 0}
        </span>
      </div>
      {pullRequests.filter(pr => pr.state == "closed").length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 mb-6">No "closed" or "merged" PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {pullRequests.filter(pr => pr.state == "closed").map((pr) => (
            <li
              key={pr.id}
              className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handleClick(pr)}
            >
              <h3 className="text-lg font-semibold">{pr.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
