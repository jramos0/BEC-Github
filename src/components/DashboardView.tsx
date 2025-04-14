// src/components/DashboardView.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DraftPR {
  id: string;
  title: string;
  created_at: string;
  resource_type: string;
}

const mockDraftPRs: DraftPR[] = [
  {
    id: "pr-001",
    title: "Fix broken links in Professor Form",
    created_at: "2025-04-06",
    resource_type: "Professor",
  },
  {
    id: "pr-002",
    title: "Add newsletter about Bitcoin in Brazil",
    created_at: "2025-04-05",
    resource_type: "Newsletter",
  },
];

const DashboardView = () => {
  const [drafts, setDrafts] = useState<DraftPR[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulamos fetch de drafts
    setDrafts(mockDraftPRs);
  }, []);

  const handleClick = (id: string) => {
    navigate(`/dashboard/pr/${id}`); // Aquí se redirigirá a la vista individual del PR
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Draft Pull Requests</h2>
      {drafts.length === 0 ? (
        <p className="text-gray-400">No draft PRs found.</p>
      ) : (
        <ul className="space-y-4">
          {drafts.map((pr) => (
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
