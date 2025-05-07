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

  const handleClick = (id: string) => {
    navigate(`/dashboard/pr/${id}`); // Aquí se redirigirá a la vista individual del PR
  };

  return (
    <div>
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
