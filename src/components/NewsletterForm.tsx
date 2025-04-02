import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NewsletterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "Newsletter",
    id: uuidv4(),
    title: "",
    author: "",
    level: "beginner",
    publication_date: new Date().toISOString().split("T")[0],
    website: "",
    language: "",
    description: "",
    contributor_names: [""],
    tags: ["", ""],
    thumbnail: null as File | null,
  });

  const levels = ["beginner", "intermediate", "expert"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (field: "tags" | "contributor_names", index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let githubUser = null;
    try {
      const userRes = await fetch("http://localhost:4000/api/user", {
        credentials: "include",
      });
      const userData = await userRes.json();
      githubUser = userData.user ? userData.user.username : "Unknown";
    } catch (err) {
      console.error("Error getting user:", err);
    }

    const finalData = { ...formData, submitted_by: githubUser };

    const formPayload = new FormData();
    Object.entries(finalData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formPayload.append(`${key}[${index}]`, item);
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
        console.log("Newsletter saved:", response.data);
        navigate("/");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-6xl mx-auto flex flex-col gap-6 px-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="title"
          placeholder="Newsletter Title"
          className="p-3 rounded bg-gray-800 text-white w-full"
          value={formData.title}
          onChange={handleChange}
        />
        <input
          type="text"
          name="author"
          placeholder="Author"
          className="p-3 rounded bg-gray-800 text-white w-full"
          value={formData.author}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          name="level"
          className="p-3 rounded bg-gray-800 text-white w-full"
          value={formData.level}
          onChange={handleChange}
        >
          {levels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <input
          type="date"
          name="publication_date"
          className="p-3 rounded bg-gray-800 text-white w-full"
          value={formData.publication_date}
          onChange={handleChange}
        />

        <input
          type="text"
          name="language"
          placeholder="Language (e.g., en)"
          className="p-3 rounded bg-gray-800 text-white w-full"
          value={formData.language}
          onChange={handleChange}
        />
      </div>

      <input
        type="text"
        name="website"
        placeholder="Website URL"
        className="p-3 rounded bg-gray-800 text-white w-full"
        value={formData.website}
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        className="p-3 rounded bg-gray-800 text-white w-full"
        value={formData.description}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Contributor(s)</label>
          {formData.contributor_names.map((contributor, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Contributor ${index + 1}`}
              className="p-3 rounded bg-gray-800 text-white"
              value={contributor}
              onChange={(e) => handleArrayChange("contributor_names", index, e.target.value)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Tags</label>
          {formData.tags.map((tag, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Tag ${index + 1}`}
              className="p-3 rounded bg-gray-800 text-white"
              value={tag}
              onChange={(e) => handleArrayChange("tags", index, e.target.value)}
            />
          ))}
        </div>
      </div>

      <label className="cursor-pointer bg-gray-800 hover:bg-orange-700 text-white text-sm px-5 py-3 rounded-md transition shadow-md w-full text-center">
        Upload Thumbnail
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFormData((prev) => ({ ...prev, thumbnail: file }));
            }
          }}
        />
      </label>

      <button
        type="submit"
        className="p-3 bg-orange-600 rounded text-white font-semibold hover:bg-blue-700 transition"
      >
        Send
      </button>
    </form>
  );
};

export default NewsletterForm;
