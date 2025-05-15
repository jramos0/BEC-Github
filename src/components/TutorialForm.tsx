import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface Step {
  id: string;
  text: string;
  images: File[];
}

const languages = ["Español", "English", "Français", "Deutsch"];
const levels = ["Beginner", "Intermediate", "Advanced"];

const TutorialForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("Español");
  const [level, setLevel] = useState("Beginner");
  const [tags, setTags] = useState<string[]>([]);
  const [author, setAuthor] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [steps, setSteps] = useState<Step[]>([{
    id: uuidv4(),
    text: "",
    images: [],
  }]);

  const handleStepChange = (id: string, text: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, text } : step))
    );
  };

  const handleImageUpload = (id: string, files: FileList | null) => {
    if (!files) return;
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, images: Array.from(files) } : step
      )
    );
  };

  const addStep = () => {
    setSteps([...steps, { id: uuidv4(), text: "", images: [] }]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  };

  const handleTagChange = (value: string) => {
    setTags(value.split(",").map((tag) => tag.trim()));
  };

  const generateMarkdown = () => {
    let content = `---\nname: ${title}\ndescription: ${description}\n---\n\n![cover](assets/cover.webp)\n\n`;
    steps.forEach((step, i) => {
      content += `## Step ${i + 1}\n\n${step.text}\n\n`;
      step.images.forEach((_, idx) => {
        content += `![Step ${i + 1} - image ${idx + 1}](assets/tutorial-id/step-${i + 1}-img-${idx + 1}.webp)\n\n`;
      });
    });
    return content;
  };

  return (
  <div className="flex flex-col lg:flex-row gap-6 min-h-screen mx-2 w-4/5 px-6 py-8 bg-gray-100 text-black">
    {/* Formulario principal */}
    {/* Añadimos flex-grow-0 flex-shrink-1 flex-basis-0 */}
    <div className=" w-full min-w-0 space-y-4 bg-white p-4 rounded flex-grow-0 flex-shrink-1 flex-basis-0">
      <h1 className="text-2xl font-bold">Create Tutorial</h1>

      <input
        className="w-full p-2 border rounded break-words"
        placeholder="Tutorial title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full p-2 border rounded resize-none h-24 break-words break-all"
        placeholder="Tutorial description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex gap-4 flex-wrap">
        <select
          className="p-2 border rounded"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languages.map((lang) => (
            <option key={lang}>{lang}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          {levels.map((lvl) => (
            <option key={lvl}>{lvl}</option>
          ))}
        </select>
      </div>

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

      <div>
        <label className="block font-semibold">Cover (webp required)</label>
        <input
          type="file"
          accept="image/webp"
          onChange={(e) => setCover(e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Steps</h2>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="border p-4 rounded bg-white w-full break-words"
          >
            <label className="font-semibold">Step {index + 1}</label>
            <textarea
              className="w-full p-2 border rounded resize-none h-24 my-2 break-words overflow-x-hidden"
              placeholder="Step description"
              value={step.text}
              onChange={(e) => handleStepChange(step.id, e.target.value)}
            />
            <input
              type="file"
              multiple
              accept="image/webp"
              onChange={(e) => handleImageUpload(step.id, e.target.files)}
            />
            <button
              className="mt-2 text-red-600 text-sm"
              onClick={() => removeStep(step.id)}
            >
              Remove step
            </button>
          </div>
        ))}

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={addStep}
        >
          + Add Step
        </button>
      </div>
    </div>

    {/* Panel de Preview */}
    {/* Mantenemos overflow-auto, añadimos flex-grow-0 flex-shrink-1 flex-basis-0 */}
    <div className="lg:w-4/6 w-full min-w-0 bg-white p-4 rounded shadow overflow-auto max-h-[80vh] flex-grow-0 flex-shrink-1 flex-basis-0">
      <h2 className="text-xl font-bold mb-2">Preview</h2>
      <div className="w-full overflow-x-auto max-w-full">
        {/* Asegúrate de que estas clases sigan en el pre */}
        <pre className="w-full min-w-0 whitespace-pre-wrap break-words break-all text-sm">
          {generateMarkdown()}
        </pre>
      </div>
    </div>
  </div>
);
  
};

export default TutorialForm;
