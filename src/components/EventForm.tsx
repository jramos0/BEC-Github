import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment-timezone";
const apiKey = import.meta.env.VITE_TIMEZONEDB_KEY;
import axios from "axios";
import { supportedLanguages } from "../constants/languages";
import { supportedTags } from "../constants/tags";

function convertToUTCFromZone(date: Date, timezone: string): string {
  const localStr = moment(date).format("YYYY-MM-DD HH:mm");
  const eventTime = moment.tz(localStr, "YYYY-MM-DD HH:mm", timezone);
  return eventTime.utc().format("YYYY-MM-DD HH:mm:ss");
}

const EventForm = () => {
  const [formData, setFormData] = useState({
    resourceCategory: "Events",
    id: uuidv4(),
    start_date: new Date(),
    end_date: new Date(),
    address_city_country: "",
    timezone: "",
    name: "",
    type: "conference",
    description: "",
    language1: "",
    language2: "",
    website: "",
    tags: ["", "", ""],
    githubUser: "",
    githubToken: "",
    thumbnail: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdPrUrl, setCreatedPrUrl] = useState("");

  const eventTypes = ["conference", "exam", "meetup", "lecture", "workshop"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Clean description field: remove \r characters
    const cleanedValue = name === 'description'
      ? value.replace(/\r\n/g, '\n').replace(/\r/g, '')
      : value;

    setFormData({ ...formData, [name]: cleanedValue });
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setCreatedPrUrl("");

    if (!formData.thumbnail) {
      alert("Thumbnail is required.");
      return;
    }

    if (formData.start_date >= formData.end_date) {
      alert("Start date must be earlier than end date.");
      return;
    }

    let timezone = moment.tz.guess();
    const locationQuery = encodeURIComponent(formData.address_city_country);

    try {
      const nominatimRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${locationQuery}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'YourAppName/1.0 (youremail@example.com)'
        }
      });

      const nominatimData = await nominatimRes.json();

      if (nominatimData.length > 0) {
        const lat = nominatimData[0].lat;
        const lon = nominatimData[0].lon;

        const timezoneRes = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${lat}&lng=${lon}`);
        const timezoneData = await timezoneRes.json();

        if (timezoneData.status === "OK") {
          timezone = timezoneData.zoneName;
        } else {
          console.warn("TimeZoneDB error:", timezoneData.message);
        }
      } else {
        console.warn("No location found in OpenStreetMap");
      }
    } catch (error) {
      console.error("Error fetching timezone:", error);
    }

    const utcStart = convertToUTCFromZone(formData.start_date, timezone);
    const utcEnd = convertToUTCFromZone(formData.end_date, timezone);

    const githubUser = localStorage.getItem('username');
    const githubToken = localStorage.getItem('accessToken');

    // Format description: remove all \r characters and format as YAML block scalar
    const cleanDescription = formData.description
      .replace(/\r\n/g, '\n')  // Replace Windows line breaks
      .replace(/\r/g, '')       // Remove any remaining \r
      .trim();

    // Filter out empty tags
    const filteredTags = formData.tags.filter(tag => tag.trim() !== '');

    // Create FormData object
    const formPayload = new FormData();
    formPayload.append('resourceCategory', formData.resourceCategory);
    formPayload.append('id', formData.id);
    formPayload.append('start_date', utcStart);
    formPayload.append('end_date', utcEnd);
    formPayload.append('timezone', timezone);
    formPayload.append('address_city_country', formData.address_city_country);
    formPayload.append('name', formData.name);
    formPayload.append('type', formData.type);
    formPayload.append('description', cleanDescription);
    formPayload.append('language1', formData.language1);
    formPayload.append('language2', formData.language2);
    formPayload.append('website', formData.website);

    // Append filtered tags
    filteredTags.forEach((tag, i) => formPayload.append(`tags[${i}]`, tag));

    if (formData.thumbnail) {
      formPayload.append('thumbnail', formData.thumbnail);
    }

    if (githubUser) formPayload.append('githubUser', githubUser);
    if (githubToken) formPayload.append('githubToken', githubToken);

    console.log('Form data being sent:', Object.fromEntries(formPayload.entries()));

    setIsSubmitting(true);
    try {
      const response = await axios.post("http://localhost:4000/", formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage("✅ PR Created Successfully");
      if (response?.data?.prUrl) {
        setCreatedPrUrl(response.data.prUrl);
      }
    } catch (error) {
      console.error("Error sending data: ", error);
      alert("Error creating the event PR. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="w-full max-w-4xl flex flex-col gap-4" onSubmit={handleSubmit}>
      <input type="text" name="name" placeholder="Event Name" className="p-3 rounded bg-gray-800 text-white" value={formData.name} onChange={handleChange} />

      <div className="flex gap-4">
        <div className="w-1/3">
          <DatePicker selected={formData.start_date} onChange={(date: Date | null) => { if (date) setFormData({ ...formData, start_date: date }); }} showTimeSelect dateFormat="yyyy-MM-dd HH:mm:ss" className="p-3 rounded bg-gray-800 text-white w-full" />
        </div>

        <div className="w-1/3">
          <DatePicker selected={formData.end_date} onChange={(date: Date | null) => { if (date) setFormData({ ...formData, end_date: date }); }} showTimeSelect dateFormat="yyyy-MM-dd HH:mm:ss" className="p-3 rounded bg-gray-800 text-white w-full" />
        </div>

        <div className="w-1/3 flex items-end">
          <label title="Upload only horizontal images" className="cursor-pointer bg-gray-800 hover:bg-orange-700 text-white text-sm px-5 py-3 rounded-md transition shadow-md w-full text-center">
            Upload Thumbnail
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { 
              const file = e.target.files?.[0]; 
              if (file) setFormData(prev => ({ ...prev, thumbnail: file })); 
            }} />
          </label>
        </div>
      </div>
      {formData.thumbnail && (
        <div className="text-green-500 text-xs text-right px-8">
          Selected image: '{formData.thumbnail.name}'
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        When choosing a date/time, please ensure it is in the local time of the event location. The system will convert it to the required format automatically.
      </div>

      <div className="flex gap-4">
        <input type="text" name="address_city_country" placeholder="City, Country (e.g., Riga, Latvia)" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.address_city_country} onChange={handleChange} />

        <select name="type" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.type} onChange={handleChange}>
          {eventTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
        </select>
      </div>

      <textarea name="description" placeholder="Description" className="p-3 rounded bg-gray-800 text-white w-full" value={formData.description} onChange={handleChange} />

      <div className="flex gap-4">
        <input type="text" name="website" placeholder="Website URL" className="p-3 rounded bg-gray-800 text-white flex-1" value={formData.website} onChange={handleChange} />

        <select name="language1" value={formData.language1} onChange={handleChange} className="p-3 rounded bg-gray-800 text-white w-full">
          <option value="">Select Language</option>
          {Object.entries(supportedLanguages).map(([code, name]) => (<option key={code} value={code}>{name}</option>))}
        </select>

        <select name="language2" value={formData.language2} onChange={handleChange} className="p-3 rounded bg-gray-800 text-white w-full">
          <option value="">Select Language</option>
          {Object.entries(supportedLanguages).map(([code, name]) => (<option key={code} value={code}>{name}</option>))}
        </select>
      </div>
      <label className="text-xs text-gray-400"> * Select at least one language.</label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {formData.tags.map((tag, index) => (
          <select key={index} className="p-3 rounded bg-gray-800 text-white" value={tag} onChange={(e) => handleTagChange(index, e.target.value)}>
            <option value="">Select a tag</option>
            {supportedTags.map((tag) => (<option key={tag} value={tag}>{tag}</option>))}
          </select>
        ))}
      </div>
      <label className="text-xs text-gray-400"> * Select at least two tags.</label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="p-3 bg-orange-600 rounded text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Send"}
      </button>
      {successMessage && (
        <div className="text-green-400 text-sm">
          {successMessage}
          {createdPrUrl && (
            <>
              {" "}
              <a
                href={createdPrUrl}
                target="_blank"
                rel="noreferrer"
                className="underline text-green-300"
              >
                View PR
              </a>
            </>
          )}
        </div>
      )}
    </form>
  );
};

export default EventForm;
