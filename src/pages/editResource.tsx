import React, { useState } from "react";

const EditResource = () => {
  const [url, setUrl] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [error, setError] = useState("");

  const handleFetch = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    if (!accessToken || !username) {
      setError("Token o username no disponible.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/load-file?url=${encodeURIComponent(url)}&username=${username}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFileContent(data.content);
        setFilePath(data.path);
        setError("");
      } else {
        setError(data.error || "Error al cargar archivo.");
      }
    } catch (err) {
      setError("Error de red o servidor.");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-black">
      <h2 className="text-2xl font-semibold mb-4">Editar recurso desde URL</h2>
      <input
        className="w-full border px-4 py-2 mb-4"
        type="text"
        placeholder="Pega la URL del recurso (project, newsletter o profesor)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={handleFetch}
        className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
      >
        Cargar recurso
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {fileContent && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Archivo: {filePath}</h3>
          <textarea
            className="w-full h-[400px] border p-4 text-sm font-mono"
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default EditResource;
