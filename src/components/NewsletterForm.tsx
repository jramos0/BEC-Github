import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { supportedLanguages } from "../constants/languages";
import { supportedTags } from "../constants/tags";

const inputClass = "p-3 rounded bg-white border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full";
const selectClass = "p-3 rounded bg-white border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full";

const NewsletterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    resourceCategory: "Newsletter",
    id: uuidv4(),
    title: "",
    author: "",
    level: "beginner",
    publication_date: new Date().toISOString().split("T")[0],
    website: "",
    language: "",
    description: "",
    tags: ["", "", ""],
    thumbnail: null as File | null,
    githubUser: "",
    githubToken: "",
  });

  const levels = ["beginner", "intermediate", "advanced", "expert"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (field: "tags", index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const githubUser = localStorage.getItem('username');
    const githubToken = localStorage.getItem('accessToken');

    const finalData = { ...formData, githubUser: githubUser, githubToken: githubToken };

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
          className={inputClass}
          value={formData.title}
          onChange={handleChange}
        />
        <input
          type="text"
          name="author"
          placeholder="Author"
          className={inputClass}
          value={formData.author}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          name="level"
          className={selectClass}
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
          className={inputClass}
          value={formData.publication_date}
          onChange={handleChange}
        />

        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          className={selectClass}
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
        name="website"
        placeholder="Website URL"
        className={inputClass}
        value={formData.website}
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Description"
        className={inputClass}
        value={formData.description}
        onChange={handleChange}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Tags</label>
        <div className="flex flex-row gap-4 w-full">
          {formData.tags.map((tag, index) => (
            <select
              key={index}
              className={selectClass + " flex-1"}
              value={tag}
              onChange={(e) => handleArrayChange("tags", index, e.target.value)}
            >
              <option value="">Select a tag</option>
              {supportedTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          ))}
        </div>
        <label className="text-xs text-gray-500 dark:text-gray-400"> * Select at least two tags.</label>
      </div>

      <div className="flex flex-row items-center gap-4">
        <label className="cursor-pointer bg-gray-200 hover:bg-orange-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-orange-700 dark:text-white text-sm px-5 py-3 rounded-md transition shadow-md w-full text-center">
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
            }} />
        </label>
        {formData.thumbnail && (
          <div className="text-green-600 dark:text-green-500 text-xs text-center">
            Selected image: '{formData.thumbnail.name}'
          </div>
        )}
      </div>

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
