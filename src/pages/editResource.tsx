import React, { useState } from "react";
import yaml from "js-yaml";
import axios from "axios";

const EditResource = () => {
  const [resourceCategory, setResourceCategory] = useState("");
  const [url, setUrl] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [parsedData, setParsedData] = useState<Record<string, any>>({});
  const [error, setError] = useState("");

  
  const isValidDateString = (str: string) => {
    const d = new Date(str);
    return !isNaN(d.getTime());
  };

  const getResourceCategory = (path: string) => {
    if(path.includes("newsletters")) return "Newsletter";
    if(path.includes("projects")) return "Project";
    if(path.includes("events")) return "Events";
    if(path.includes("professors")) return "Professor";
    return "undefined";
  };

  const formatDateForInput = (str: string) => {
    const d = new Date(str);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDatetimeForInput = (str: string) => {
    const d = new Date(str);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const containsTimeInfo = (str: string) => {
    return str.includes("T") || str.includes(":");
  };

  const handleFetch = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    if (!accessToken || !username) {
      setError("Token o username no disponible.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/load-file?url=${encodeURIComponent(
          url
        )}&username=${username}`,
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
        setResourceCategory(getResourceCategory(data.path));

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
    if (typeof value === "string" || value instanceof Date) {
      const dateStr = value instanceof Date ? value.toISOString() : value;
      if (isValidDateString(dateStr)) {
        if (containsTimeInfo(dateStr)) {
          return (
            <div key={keyPath.join(".")} className="mb-4">
              <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
              <input
                type="datetime-local"
                value={formatDatetimeForInput(dateStr)}
                onChange={(e) => handleFieldChange(keyPath, e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          );
        } else {
          return (
            <div key={keyPath.join(".")} className="mb-4">
              <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
              <input
                type="date"
                value={formatDateForInput(dateStr)}
                onChange={(e) => handleFieldChange(keyPath, e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          );
        }
      } else {
        return (
          <div key={keyPath.join(".")} className="mb-4">
            <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
            <input
              type="text"
              value={dateStr}
              onChange={(e) => handleFieldChange(keyPath, e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        );
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
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
      const isPrimitiveArray = value.every(
        (item) => ["string", "number", "boolean"].includes(typeof item)
      );

      if (isPrimitiveArray) {
        return (
          <div key={keyPath.join(".")} className="mb-4">
            <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
            <textarea
              value={value.join("\n")}
              onChange={(e) => {
                const updated = e.target.value.split("\n");
                handleFieldChange(keyPath, updated);
              }}
              className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={value.length > 0 ? value.length : 3}
            />
          </div>
        );
      } else {
        return (
          <div key={keyPath.join(".")} className="mb-4">
            <label className="block text-sm text-gray-300 mb-1 capitalize">{key}</label>
            <div className="space-y-2">
              {value.map((item, index) => (
                <div key={`${keyPath.join(".")}-${index}`} className="p-2 border border-gray-300 rounded">
                  {typeof item === "object" && item !== null ? (
                    Object.entries(item).map(([childKey, childValue]) =>
                      renderField(childKey, childValue, [...keyPath, index.toString()])
                    )
                  ) : (
                    <input
                      type="text"
                      value={String(item)}
                      onChange={(e) => {
                        const updated = [...value];
                        updated[index] = e.target.value;
                        handleFieldChange(keyPath, updated);
                      }}
                      className="w-full border border-gray-300 px-4 py-2 rounded bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
    } else if (typeof value === "object" && value !== null) {
      return (
        <div key={keyPath.join(".")} className="mb-6 border border-gray-600 rounded-xl p-4 bg-gray-900 shadow">
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const githubUser = localStorage.getItem("username");
    const githubToken = localStorage.getItem("accessToken");

    try{
      const finalData = {
        resourceCategory,
        ...parsedData,
        githubUser: githubUser,
        githubToken: githubToken,
      }
      console.log("Final data prepared for sending:", finalData);

      try {
        await axios.post("http://localhost:4000/edit-resource", JSON.stringify(finalData), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      handleClearResource();
      } catch (error) {
      console.error("Error sending data: ", error);
      }
    }
    catch (error) {
      console.error("Error processing data to send: ", error);
    }
  }

  const handleClearResource = () => {
    setResourceCategory("");
    setUrl("");
    setFileContent("");
    setFilePath("");
    setParsedData({});
    setError("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-black">
      <h2 className="text-2xl font-semibold mb-4">Edit resource from URL</h2>
      <input
        className="w-full border px-4 py-2 mb-4"
        type="text"
        placeholder="Paste the url that you want to modify"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={handleFetch}
        className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition mr-2"
      >
        Load resource
      </button>
      <button
        onClick={handleClearResource}
        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition"
      >
        Reset
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {fileContent && (
        <div className="mt-6 max-h-[70vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">
            Loaded file <code>{filePath}</code>
          </h3>
          {Object.entries(parsedData).map(([key, value]) => renderField(key, value))}
        </div>
      )}
      {Object.keys(parsedData).length > 0 && (
        <div className="p-6 max-w-4xl mx-auto text-black">
          <button
            onClick={handleSend}
            className="mt-2 bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
          >
            Send Changes
          </button>
        </div>)
      }
    </div>
  );
};

export default EditResource;