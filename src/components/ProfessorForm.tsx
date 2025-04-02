import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProfessorForm = () => {
  const navigate = useNavigate();
  
    type ProfessorFormData = {
    category: "Professor";
    id: string;
    name: string;
    contributor_id: string;
    twitter?: string;
    github?: string;
    website?: string;
    nostr?: string;
    lightning_address: string;
    company: string;
    affiliations: string[];
    tags: string[];
    bio: string;
    short_bio: string;
    thumbnail: File | null;
  };
  const [formData, setFormData] = useState<ProfessorFormData>({
    category: "Professor",
    id: uuidv4(),
    name: "",
    contributor_id: "",
    twitter: "",
    github: "",
    website: "",
    nostr: "",
    lightning_address: "",
    company: "",
    affiliations: [""],
    tags: ["", ""],
    bio: "",
    short_bio: "",
    thumbnail: null as File | null,
  });

  
  

  const [enabledLinks, setEnabledLinks] = useState({
    twitter: false,
    github: false,
    website: false,
    nostr: false,
  });
  

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (
    field: "tags" | "affiliations",
    index: number,
    value: string
  ) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
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

    const finalData = {
      ...formData,
      links: {
        ...(enabledLinks.twitter && { twitter: formData.twitter }),
        ...(enabledLinks.github && { github: formData.github }),
        ...(enabledLinks.website && { website: formData.website }),
        ...(enabledLinks.nostr && { nostr: formData.nostr }),
      },          
      tips: {
        lightning_address: formData.lightning_address,
      },
      submitted_by: githubUser,
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
        console.log("Professor saved:", response.data);
        navigate("/");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <form className="w-full max-w-6xl mx-auto flex flex-col gap-4 px-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" name="name" placeholder="Professor Name" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.name} onChange={handleChange} />
        <input type="text" name="contributor_id" placeholder="Contributor ID" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.contributor_id} onChange={handleChange} />
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

  {/* Campos condicionales */}
  {enabledLinks.twitter && (
    <input
      type="text"
      name="twitter"
      placeholder="Twitter Link"
      className="p-3 rounded bg-gray-800 text-white w-full"
      value={formData.twitter}
      onChange={handleChange}
    />
  )}

  {enabledLinks.github && (
    <input
      type="text"
      name="github"
      placeholder="GitHub Link"
      className="p-3 rounded bg-gray-800 text-white w-full"
      value={formData.github || ""}
      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
    />
  )}

  {enabledLinks.website && (
    <input
      type="text"
      name="website"
      placeholder="Website Link"
      className="p-3 rounded bg-gray-800 text-white w-full"
      value={formData.website || ""}
      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
    />
  )}

  {enabledLinks.nostr && (
    <input
      type="text"
      name="nostr"
      placeholder="Nostr pubkey"
      className="p-3 rounded bg-gray-800 text-white w-full"
      value={formData.nostr || ""}
      onChange={(e) => setFormData({ ...formData, nostr: e.target.value })}
    />
  )}
</div>
<textarea name="bio" placeholder="Full Bio" className="p-3 rounded bg-gray-800 text-white w-full" rows={4} value={formData.bio} onChange={handleChange} />
      <input type="text" name="short_bio" placeholder="Short Bio" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.short_bio} onChange={handleChange} />

      <label className="cursor-pointer bg-gray-800 hover:bg-orange-700 text-white text-sm px-5 py-3 rounded-md transition shadow-md w-full text-center">
        Upload Thumbnail
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setFormData((prev) => ({ ...prev, thumbnail: file }));
        }} />
      </label>

      <input type="text" name="lightning_address" placeholder="Lightning Address" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.lightning_address} onChange={handleChange} />

      <input type="text" name="company" placeholder="Company" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.company} onChange={handleChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm text-gray-400">Affiliations (UUIDs)</label>
          {formData.affiliations.map((aff, index) => (
            <input key={index} type="text" placeholder={`Affiliation ${index + 1}`} className="p-3 rounded bg-gray-800 text-white" value={aff} onChange={(e) => handleArrayChange("affiliations", index, e.target.value)} />
          ))}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm text-gray-400">Tags</label>
          {formData.tags.map((tag, index) => (
            <input key={index} type="text" placeholder={`Tag ${index + 1}`} className="p-3 rounded bg-gray-800 text-white" value={tag} onChange={(e) => handleArrayChange("tags", index, e.target.value)} />
          ))}
        </div>
      </div>

      

      <button type="submit" className="p-3 bg-orange-600 rounded text-white font-semibold hover:bg-blue-700 transition w-full">
        Send
      </button>
    </form>
  );
};

export default ProfessorForm;
