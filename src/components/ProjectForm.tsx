import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { supportedLanguages } from "../constants/languages";


const categories = [
  "Communities", "Conference", "Education", "Exchange", "Infrastructure",
  "Investment", "Manufacturer", "Merchant", "Mining", "News", "Node",
  "Privacy", "Service", "Wallet"
];

const ProjectForm = () => {
  const navigate = useNavigate();
  const [contributorName, setContributorName] = useState<string>("");

  const [formData, setFormData] = useState({
    id: uuidv4(),
    name: "",
    links: {
      website: "",
      twitter: "",
      github: "",
      nostr: ""
    },
    category: "Education",
    original_language: "en",
    tags: ["", "", ""],
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/user", {
          credentials: "include",
        });
        const data = await res.json();
        setContributorName(data.user?.username || "Unknown");
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    const finalData = {
      ...formData,
      contributor_names: [contributorName],
      submitted_by: contributorName
    };

    const formPayload = new FormData();
    Object.entries(finalData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formPayload.append(`${key}[${index}]`, item);
        });
      } else if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([subKey, subVal]) => {
          formPayload.append(`${key}.${subKey}`, String(subVal));
        });
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
      <input
        type="text"
        name="name"
        placeholder="Project Name"
        className="p-3 rounded bg-gray-800 text-white"
        value={formData.name}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["website", "twitter", "github", "nostr"].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} URL`}
            className="p-3 rounded bg-gray-800 text-white"
            value={formData.links[field as keyof typeof formData.links]}
            onChange={(e) => handleLinkChange(field as keyof typeof formData.links, e.target.value)}
          />
        ))}
      </div>

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
          {supportedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Tags</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formData.tags.map((tag, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Tag ${index + 1}`}
              className="p-3 rounded bg-gray-800 text-white"
              value={tag}
              onChange={(e) => handleTagChange(index, e.target.value)}
            />
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
