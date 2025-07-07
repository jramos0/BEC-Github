import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { supportedLanguages } from "../constants/languages";
import { supportedTags } from "../constants/tags";

const categories = [
  "Communities", "Conference", "Education", "Exchange", "Infrastructure",
  "Investment", "Manufacturer", "Merchant", "Mining", "News", "Node",
  "Privacy", "Service", "Wallet"
];

const ProjectForm = () => {
  const navigate = useNavigate();
  const [contributorName, setContributorName] = useState<string>("");

  const [formData, setFormData] = useState({
    resourceCategory: "Project",
    id: uuidv4(),
    name: "",
    description: "",
    thumbnail: null as File | null,
    links: {
      website: "",
      twitter: "",
      github: "",
      nostr: ""
    },
    category: "Education",
    original_language: "en",
    tags: ["", "", ""],
    githubUser: "",
    githubToken: "",
  });

  const [enabledLinks, setEnabledLinks] = useState({
  website: false,
  twitter: false,
  github: false,
  nostr: false,
});


  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setContributorName(storedUsername);
    } else {
      setContributorName("Unknown");
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTagChange = (index: number, value: string) => {
    const updated = [...formData.tags];
    updated[index] = value;
    setFormData({ ...formData, tags: updated });
  };

  const handleLinkChange = (field: keyof typeof formData.links, value: string) => {
    setFormData({ ...formData, links: { ...formData.links, [field]: value } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const githubUser = localStorage.getItem('username');
    const githubToken = localStorage.getItem('accessToken');

    const finalData = {
      ...formData,
      contributor_names: [contributorName],
      githubUser: githubUser,
      githubToken: githubToken,
    };

    const formPayload = new FormData();
    Object.entries(finalData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formPayload.append(`${key}[${index}]`, item);
        });
      } else if (typeof value === "object" && value !== null && !(value instanceof File)) {
        Object.entries(value).forEach(([subKey, subVal]) => {
          formPayload.append(`${key}.${subKey}`, String(subVal));
        });
      } else if (value instanceof File) {
        formPayload.append(key, value);
      } else {
        formPayload.append(key, value as string);
      }
    });

    try {
      const response = await axios.post("http://localhost:4000/", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        console.log("Project saved:", response.data);
        navigate("/");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <form className="w-full max-w-6xl mx-auto flex flex-col gap-4 px-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="category"
          className="p-3 rounded bg-gray-800 text-white"
          value={formData.category}
          onChange={handleChange}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          name="original_language"
          value={formData.original_language}
          onChange={handleChange}
          className="p-3 rounded bg-gray-800 text-white w-full"
        >
          <option value="">Select Language</option>
          {Object.entries(supportedLanguages).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        name="name"
        placeholder="Project Name"
        className="p-3 rounded bg-gray-800 text-white"
        value={formData.name}
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        className="p-3 rounded bg-gray-800 text-white"
        rows={4}
        value={formData.description}
        onChange={handleChange}
      />

      <div className="flex flex-row items-center gap-4">
        <label className="cursor-pointer bg-gray-800 hover:bg-orange-700 text-white text-sm px-5 py-3 rounded-md transition shadow-md w-full text-center">
        Upload Thumbnail
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setFormData((prev) => ({ ...prev, thumbnail: file }));
          }}
        />
      </label>
      {formData.thumbnail && (
        <div className="text-green-500 text-xs text-center">
            Selected image: '{formData.thumbnail.name}'
        </div>
      )}
      </div>

<div className="flex flex-col gap-2">
  <label className="text-sm text-gray-400">Select which links to add</label>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    {Object.keys(enabledLinks).map((key) => (
      <label key={key} className="inline-flex items-center text-white space-x-2">
        <input
          type="checkbox"
          checked={enabledLinks[key as keyof typeof enabledLinks]}
          onChange={() =>
            setEnabledLinks((prev) => ({
              ...prev,
              [key]: !prev[key as keyof typeof enabledLinks],
            }))
          }
          className="form-checkbox h-4 w-4 text-orange-600 rounded border-gray-600 bg-gray-900 focus:ring-0"
        />
        <span className="capitalize">{key}</span>
      </label>
    ))}
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
    {enabledLinks.website && (
      <input
        type="text"
        placeholder="Website URL"
        className="p-3 rounded bg-gray-800 text-white"
        value={formData.links.website}
        onChange={(e) => handleLinkChange("website", e.target.value)}
      />
    )}
    {enabledLinks.twitter && (
      <input
        type="text"
        placeholder="Twitter URL"
        className="p-3 rounded bg-gray-800 text-white"
        value={formData.links.twitter}
        onChange={(e) => handleLinkChange("twitter", e.target.value)}
      />
    )}
    {enabledLinks.github && (
      <input
        type="text"
        placeholder="Github URL"
        className="p-3 rounded bg-gray-800 text-white"
        value={formData.links.github}
        onChange={(e) => handleLinkChange("github", e.target.value)}
      />
    )}
    {enabledLinks.nostr && (
      <input
        type="text"
        placeholder="Nostr URL"
        className="p-3 rounded bg-gray-800 text-white"
        value={formData.links.nostr}
        onChange={(e) => handleLinkChange("nostr", e.target.value)}
      />
    )}
  </div>
</div>


      <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-400">Tags</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {formData.tags.map((tag, index) => (
          <select
            key={index}
            className="p-3 rounded bg-gray-800 text-white"
            value={tag}
            onChange={(e) => handleTagChange(index, e.target.value)}
          >
            <option value= "">Select a tag</option>
            {supportedTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option> 
            ))}
          </select>
        ))}
      </div>
    </div>

      <button
        type="submit"
        className="p-3 bg-orange-600 rounded text-white font-semibold hover:bg-blue-700 transition w-full"
      >
        Send
      </button>
    </form>
  );
};

export default ProjectForm;