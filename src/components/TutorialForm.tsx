// TutorialForm.tsx
import React, { useState, useRef } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const languages = { es: "Español", en: "English", fr: "Français", de: "Deutsch" };
const levels = ["Beginner", "Intermediate", "Advanced"];

const TutorialForm: React.FC = () => {
  const navigate = useNavigate();

  // ─── Metadata ────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [tags, setTags] = useState<string[]>([]);
  const [author, setAuthor] = useState("");
  const [cover, setCover] = useState<File | null>(null);

  // ─── Contenido + imágenes ────────────────────────────────────────────
  const [content, setContent] = useState<string>("");
  const [contentImages, setContentImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTagChange = (val: string) =>
    setTags(val.split(",").map((t) => t.trim()));

  const handleContentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!language) {
      alert("Please select a language before inserting images.");
      return;
    }
    const files = Array.from(e.target.files);
    const existingCount = contentImages.length;
    // Carpeta según idioma
    const folder = `assets/${language}`;

    // Generar placeholders numerados
    const placeholders = files.map((file, idx) => {
      const num = String(existingCount + idx + 1).padStart(2, "0");
      return `\n\n![${file.name}](${folder}/${num}.webp)\n\n`;
    });

    // Actualizar estado
    setContentImages((prev) => [...prev, ...files]);
    setContent((prev) => prev + placeholders.join(""));
  };

  // ─── Markdown + frontmatter ─────────────────────────────────────────
  const generateMarkdown = () => {
    return `---
name: ${title}
description: ${description}
---

![cover](assets/cover.webp)

${content}`.trim();
  };

  // ─── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const githubUser = localStorage.getItem("username");
    const githubToken = localStorage.getItem("accessToken");

    const payload = {
      resourceCategory: "Tutorial",
      title,
      language,
      markdown: generateMarkdown(),
      thumbnail: cover,
      githubUser,
      githubToken,
    };

    const formPayload = new FormData();
    Object.entries(payload).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((v, i) => formPayload.append(`${key}[${i}]`, v));
      } else if (val instanceof File) {
        formPayload.append(key, val);
      } else if (val != null) {
        formPayload.append(key, val as string);
      }
    });
    // Adjuntar imágenes
    contentImages.forEach((img) => formPayload.append("stepsImages", img));

    try {
      const res = await axios.post(
        "http://localhost:4000/upload-tutorial",
        formPayload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.status === 200) navigate("/");
    } catch (err) {
      console.error("Error submitting tutorial:", err);
    }
  };

  // ─── Comando custom para “image” en toolbar ─────────────────────────
  const mdCommands = commands.getCommands().map((cmd) =>
    cmd.name === "image"
      ? {
          ...cmd,
          execute: () => {
            fileInputRef.current?.click();
            return "";
          },
        }
      : cmd
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen w-4/5 mx-auto px-6 py-8 bg-gray-100 text-black">        {/* ─── IZQ: metadata + editor ─────────────────────────────────── */}
        <div className="w-full bg-white p-4 rounded space-y-4">
          <h1 className="text-2xl font-bold">Create Tutorial</h1>

          {/* Título & Descripción */}
          <input
            className="w-full p-2 border rounded"
            placeholder="Tutorial title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded h-24"
            placeholder="Tutorial description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Language & Level */}
          <div className="flex gap-4 flex-wrap">
            <select
              className="p-2 border rounded"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="" disabled>
                Select a language
              </option>
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="p-2 border rounded"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Tags & Author */}
          <input
            className="w-full p-2 border rounded"
            placeholder="Tags (comma separated)"
            value={tags.join(", ")}
            onChange={(e) => handleTagChange(e.target.value)}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Author name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />

          {/* Cover */}
          <div>
            <label className="block font-semibold">Cover (webp required)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
            />
          </div>

          {/* Contenido */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Contenido</h2>
            <button
              type="button"
              className="px-3 py-1 border rounded text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Insert Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleContentImageUpload}
            />

            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={300}
                preview="live"
                commands={mdCommands}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-orange-600 rounded text-white font-semibold hover:bg-orange-700"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
};

export default TutorialForm;
