// TutorialForm.tsx
import React, { useState, useRef } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { tutorialSubcategories, getParentCategory } from "../constants/tutorialCategories";
import { supportedLanguages } from "../constants/languages";
import { supportedTags } from "../constants/tags";
import { v4 as uuidv4 } from "uuid";

const levels = ["Beginner", "Intermediate", "Advanced"];

// Validation error interface
interface ValidationError {
  field: string;
  message: string;
}

const TutorialForm: React.FC = () => {
  const navigate = useNavigate();

  // ─── Metadata ────────────────────────────────────────────────────────
  const [id] = useState(uuidv4());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subcategory, setSubcategory] = useState(""); // User selects subcategory
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [tags, setTags] = useState<string[]>(["", "", ""]);
  const [author, setAuthor] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  // ─── Contenido + imágenes ────────────────────────────────────────────
  const [content, setContent] = useState<string>("");
  const [contentImages, setContentImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Quote Modal State ───────────────────────────────────────────────
  // Tracks modal visibility, quote text, reference note, and cursor position
  // Trigger source distinguishes between @@quote typing and toolbar button click
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [savedCursorPosition, setSavedCursorPosition] = useState(0);
  const [contentBeforeTrigger, setContentBeforeTrigger] = useState("");
  const [quoteTriggerSource, setQuoteTriggerSource] = useState<"typing" | "toolbar">("toolbar");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Validation ──────────────────────────────────────────────────────
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ─── Custom commands: Disable H1, keep H2-H6 ─────────────────────────
  const customCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.hr,
    commands.title2,  // H2 - Allowed
    commands.title3,  // H3 - Allowed
    commands.title4,  // H4 - Allowed
    commands.title5,  // H5 - Allowed
    commands.title6,  // H6 - Allowed
    commands.divider,
    commands.link,
    commands.quote,
    commands.code,
    commands.codeBlock,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
  ];

  // Customize the image command to use our file picker
  const imageCommand = {
    ...commands.image,
    execute: () => {
      fileInputRef.current?.click();
      return "";
    },
  };

  // Custom quote command that triggers the confirmation modal
  // Uses ❝ symbol and opens modal at current cursor position
  const quoteConfirmCommand = {
    name: "quote-confirmation",
    keyCommand: "quoteConfirm",
    buttonProps: { "aria-label": "Insert quote with confirmation" },
    icon: (
      <span style={{ fontSize: "16px", fontWeight: "bold" }}>❝</span>
    ),
    execute: () => {
      // Save current cursor position for toolbar trigger
      const cursorPos = textareaRef.current?.selectionStart || content.length;
      setContentBeforeTrigger(content);
      setSavedCursorPosition(cursorPos);
      setQuoteTriggerSource("toolbar");
      setQuoteModalOpen(true);
    },
  };

  const finalCommands = [...customCommands, imageCommand, quoteConfirmCommand];

  // ─── Validation Functions ────────────────────────────────────────────
  const validateContent = (contentValue: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check for H1 headers (# at start of line or after newline)
    if (/^#\s/m.test(contentValue) || /\n#\s/.test(contentValue)) {
      errors.push({
        field: "content",
        message: "❌ H1 headers (#) are not allowed. Please use H2 (##) or lower.",
      });
    }

    // Check for excessive empty lines (3 or more consecutive newlines)
    if (/\n\n\n+/.test(contentValue)) {
      errors.push({
        field: "content",
        message: "⚠️ Multiple empty lines detected. Content will be auto-formatted to remove extra spacing.",
      });
    }

    return errors;
  };

  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];
    const selectedTags = tags.filter((tag) => tag.trim() !== "");

    if (!title.trim()) {
      errors.push({ field: "title", message: "Title is required" });
    }

    if (!description.trim()) {
      errors.push({ field: "description", message: "Description is required" });
    }

    if (!subcategory) {
      errors.push({ field: "subcategory", message: "Subcategory is required" });
    }

    if (!language) {
      errors.push({ field: "language", message: "Language is required" });
    }

    if (!cover) {
      errors.push({ field: "cover", message: "Cover image is required" });
    }

    if (!logo) {
      errors.push({ field: "logo", message: "Logo image is required" });
    }

    if (!content.trim()) {
      errors.push({ field: "content", message: "Content cannot be empty" });
    }

    if (selectedTags.length < 2) {
      errors.push({ field: "tags", message: "Please select at least 2 tags" });
    }

    if (new Set(selectedTags).size !== selectedTags.length) {
      errors.push({ field: "tags", message: "Duplicate tags are not allowed" });
    }

    // Add content validation errors
    const contentErrors = validateContent(content);
    errors.push(...contentErrors);

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // ─── Tag Handling ────────────────────────────────────────────────────
  const handleTagChange = (index: number, value: string) => {
    const updatedTags = [...tags];
    updatedTags[index] = value;
    setTags(updatedTags);
  };

  // ─── Image Upload ────────────────────────────────────────────────────
  const handleContentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!language) {
      alert("Please select a language before inserting images.");
      return;
    }
    const files = Array.from(e.target.files);
    const existingCount = contentImages.length;
    const folder = `assets/${language}`;

    // Generate numbered placeholders
    const placeholders = files.map((file, idx) => {
      const num = String(existingCount + idx + 1).padStart(2, "0");
      return `\n\n![${file.name}](${folder}/${num}.webp)\n\n`;
    });

    // Update state
    setContentImages((prev) => [...prev, ...files]);
    setContent((prev) => prev + placeholders.join(""));
  };

  // ─── Content Change Handler with Validation ──────────────────────────
  const handleContentChange = (val: string | undefined) => {
    if (!val) {
      setContent("");
      return;
    }

    // @@quote trigger detection: intercept before it reaches final content
    // Using unique token @@quote (never appears in final markdown) to avoid
    // conflicts with standard markdown blockquote syntax (>)
    if (val.includes("@@quote")) {
      // Find the position where @@quote starts
      const quoteIndex = val.indexOf("@@quote");

      // Save state before trigger for cancellation restoration
      setContentBeforeTrigger(content); // Previous content state (without @@quote)
      setSavedCursorPosition(quoteIndex); // Where @@quote started
      setQuoteTriggerSource("typing");

      // Remove @@quote from content immediately (never persisted)
      const cleanedContent = val.replace("@@quote", "");
      setContent(cleanedContent);

      // Open modal for user confirmation
      setQuoteModalOpen(true);
      return;
    }

    // Auto-format: Remove excessive empty lines (keep max 2 newlines = 1 empty line)
    const formatted = val.replace(/\n{3,}/g, "\n\n");

    setContent(formatted);

    // Real-time validation
    const errors = validateContent(formatted);
    setValidationErrors(errors);
  };

  // ─── Quote Modal Handlers ────────────────────────────────────────────
  const handleQuoteConfirm = () => {
    if (!quoteText.trim()) {
      alert("Quote text is required");
      return;
    }

    // Generate blockquote markdown in the format:
    // > "Quote text"
    // >
    // > — reference note (optional line, omitted if empty)
    let blockquote = `> "${quoteText.trim()}"`;
    if (referenceNote.trim()) {
      blockquote += `\n>\n> — ${referenceNote.trim()}`;
    }

    // Insert at saved cursor position
    const before = content.substring(0, savedCursorPosition);
    const after = content.substring(savedCursorPosition);
    const newContent = before + blockquote + after;

    setContent(newContent);

    // Reset modal state
    setQuoteModalOpen(false);
    setQuoteText("");
    setReferenceNote("");

    // Position cursor after the inserted blockquote
    // Using setTimeout to ensure DOM has updated before setting cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = savedCursorPosition + blockquote.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleQuoteCancel = () => {
    // Restore content to state before trigger (only for typing trigger)
    // Toolbar trigger doesn't modify content, so restoration is no-op
    if (quoteTriggerSource === "typing") {
      setContent(contentBeforeTrigger);
    }

    // Reset modal state
    setQuoteModalOpen(false);
    setQuoteText("");
    setReferenceNote("");

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(savedCursorPosition, savedCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
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
    const filteredTags = tags.filter((tag) => tag.trim() !== "");

    // Validate before submission
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const githubUser = localStorage.getItem("username");
    const githubToken = localStorage.getItem("accessToken");

    // Get parent category from subcategory
    const category = getParentCategory(subcategory);

    if (!category) {
      alert("Invalid subcategory selected");
      return;
    }

    const payload = {
      id,
      resourceCategory: "Tutorial",
      subcategory, // Store subcategory for reference
      category, // Parent category for folder structure
      title,
      description,
      language,
      level,
      tags: filteredTags,
      author,
      markdown: generateMarkdown(),
      thumbnail: cover,
      logo: logo,
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

    // Attach images
    contentImages.forEach((img) => formPayload.append("stepsImages", img));

    try {
      const res = await axios.post(
        "http://localhost:4000/upload-tutorial",
        formPayload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.status === 200) {
        alert("Tutorial submitted successfully!");
        navigate("/");
      }
    } catch (err) {
      console.error("Error submitting tutorial:", err);
      alert("Failed to submit tutorial. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen w-4/5 mx-auto px-6 py-8 bg-cream dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="w-full bg-white dark:bg-gray-800 p-4 rounded space-y-4">
          <h1 className="text-2xl font-bold">Create Tutorial</h1>

          {/* Validation Errors Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1">Tutorial Title *</label>
            <input
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter tutorial title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1">Description *</label>
            <textarea
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of the tutorial"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <label className="block text-sm font-semibold mb-1">Subcategory *</label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              required
            >
              <option value="" disabled>
                Select tutorial subcategory
              </option>
              {tutorialSubcategories.map((sub) => (
                <option key={sub.value} value={sub.value}>
                  {sub.label}
                </option>
              ))}
            </select>
            {subcategory && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Category: {getParentCategory(subcategory)}
              </p>
            )}
          </div>

          {/* Language & Level */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">Language *</label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select language
                </option>
                {Object.entries(supportedLanguages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">Difficulty Level</label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          </div>

          {/* Tags & Author */}
          <div>
            <label className="block text-sm font-semibold mb-1">Tags</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tags.map((tag, index) => (
                <select
                  key={index}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={tag}
                  onChange={(e) => handleTagChange(index, e.target.value)}
                >
                  <option value="">Select a tag</option>
                  {supportedTags.map((supportedTag) => (
                    <option key={supportedTag} value={supportedTag}>
                      {supportedTag}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Author Name</label>
            <input
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold mb-1">Cover Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            {cover && (
              <p className="text-xs text-green-600 mt-1">✓ {cover.name}</p>
            )}
          </div>

          {/* Logo Image */}
          <div>
            <label className="block text-sm font-semibold mb-1">Logo Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            {logo && (
              <p className="text-xs text-green-600 mt-1">✓ {logo.name}</p>
            )}
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Tutorial Content</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Note: H1 headers are not allowed. Use H2 (##) or lower.
            </p>
            <button
              type="button"
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Insert Image
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
                onChange={handleContentChange}
                height={400}
                preview="live"
                commands={finalCommands}
                textareaProps={{
                  placeholder:
                    "Write your tutorial content here...\n\n## Section Title\n\nYour content...",
                }}
              />
            </div>

            {contentImages.length > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                📎 {contentImages.length} image(s) attached
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full p-3 bg-orange-600 rounded text-white font-semibold hover:bg-orange-700 transition"
          >
            Submit Tutorial
          </button>
        </div>
      </div>

      {/* Quote Confirmation Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 text-gray-900 dark:text-white">
            <h3 className="text-lg font-semibold mb-2">Confirm Quote / Mention</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Confirm that this sentence was already mentioned in the previous paragraph.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quote Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter the quote text..."
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Optional Reference Note
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='e.g., "as mentioned above"'
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition"
                onClick={handleQuoteCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
                onClick={handleQuoteConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default TutorialForm;
