import React, { useState } from "react";
import yaml from "js-yaml";

const EditResource = () => {
  const [url, setUrl] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [parsedData, setParsedData] = useState<Record<string, any>>({});
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

        try {
          const parsed = yaml.load(data.content) as Record<string, any>;
          setParsedData(parsed || {});
        } catch (parseError) {
          console.error("Error al parsear YAML:", parseError);
          setError("Contenido YAML inválido.");
        }

        setError("");
      } else {
        setError(data.error || "Error al cargar archivo.");
      }
    } catch (err) {
      setError("Error de red o servidor.");
      console.error(err);
    }
  };

  const handleFieldChange = (keyPath: string[], value: any) => {
    const newData = { ...parsedData };
    let ref = newData;

    for (let i = 0; i < keyPath.length - 1; i++) {
      ref = ref[keyPath[i]];
    }

    ref[keyPath[keyPath.length - 1]] = value;
    setParsedData(newData);
  };

  const renderField = (key: string, value: any, parentKeyPath: string[] = []) => {
    const keyPath = [...parentKeyPath, key];

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return (
        <div key={keyPath.join(".")} className="mb-4">
          <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFieldChange(keyPath, e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      );
    } else if (Array.isArray(value)) {
      return (
        <div key={keyPath.join(".")} className="mb-4">
          <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
          <div className="flex flex-col gap-2">
            {value.map((item, index) => (
              <input
                key={`${keyPath.join(".")}[${index}]`}
                type="text"
                value={String(item)}
                onChange={(e) => {
                  const updated = [...value];
                  updated[index] = e.target.value;
                  handleFieldChange(keyPath, updated);
                }}
                className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ))}
          </div>
        </div>
      );
    } else if (typeof value === "object" && value !== null) {
      return (
        <div
          key={keyPath.join(".")}
          className="mb-6 border border-gray-600 rounded-xl p-4 bg-gray-900 shadow"
        >
          <h4 className="text-lg font-semibold text-orange-400 mb-4 capitalize">{key}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(value).map(([childKey, childValue]) =>
              renderField(childKey, childValue, keyPath)
            )}
          </div>
        </div>
      );
    }

    return null;
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
       <button
      onClick={() => {
        setUrl("");
        setFileContent("");
        setFilePath("");
        setError("");
      }}
      className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition"
    >
      Eliminar recurso
    </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {fileContent && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">
            Archivo cargado: <code>{filePath}</code>
          </h3>
          {Object.entries(parsedData).map(([key, value]) =>
            renderField(key, value)
          )}
        </div>
      )}
    </div>
  );
};

export default EditResource;
