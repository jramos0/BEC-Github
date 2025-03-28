import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment-timezone";

const EventForm = () => {
  const [formData, setFormData] = useState({
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
  });

  const eventTypes = ["conference", "exam", "meetup", "lecture", "workshop"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Obtener timezone solo al enviar
    let timezone = moment.tz.guess();
    const country = formData.address_city_country.split(", ")[1];

    try {
      const response = await fetch(`https://worldtimeapi.org/api/timezone`);
      const timezones = await response.json();
      timezone = timezones.find((tz: string) => tz.includes(country)) || timezone;
    } catch (error) {
      console.error("Could not fetch timezone:", error);
    }

    const finalData = { ...formData, timezone };
    console.log(finalData);
  };

  return (
    <form className="w-full max-w-4xl flex flex-col gap-4" onSubmit={handleSubmit}>
  <input
    type="text"
    name="name"
    placeholder="Event Name"
    className="p-3 rounded bg-gray-800 text-white"
    value={formData.name}
    onChange={handleChange}
  />

  <div className="flex gap-4">
    <DatePicker
      selected={formData.start_date}
      onChange={(date: Date | null) => {
        if (date) setFormData({ ...formData, start_date: date });
      }}
      showTimeSelect
      dateFormat="yyyy-MM-dd HH:mm:ss"
      className="p-3 rounded bg-gray-800 text-white w-full"
    />

    <DatePicker
      selected={formData.end_date}
      onChange={(date: Date | null) => {
        if (date) setFormData({ ...formData, end_date: date });
      }}
      showTimeSelect
      dateFormat="yyyy-MM-dd HH:mm:ss"
      className="p-3 rounded bg-gray-800 text-white w-full"
    />
  </div>

  <div className="flex gap-4">
    <input
      type="text"
      name="address_city_country"
      placeholder="City, Country (e.g., Riga, Latvia)"
      className="p-3 rounded bg-gray-800 text-white w-full"
      value={formData.address_city_country}
      onChange={handleChange}
    />

    <select
      name="type"
      className="p-3 rounded bg-gray-800 text-white w-full"
      value={formData.type}
      onChange={handleChange}
    >
      {eventTypes.map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
  </div>

  <textarea
    name="description"
    placeholder="Description"
    className="p-3 rounded bg-gray-800 text-white w-full"
    value={formData.description}
    onChange={handleChange}
  />

<div className="flex gap-4">
  <input
    type="text"
    name="website"
    placeholder="Website URL"
    className="p-3 rounded bg-gray-800 text-white flex-1"
    value={formData.website}
    onChange={handleChange}
  />

  <input
    type="text"
    placeholder="Primary Language (e.g., en)"
    className="p-3 rounded bg-gray-800 text-white w-40"
    value={formData.language1}
    onChange={(e) => setFormData({ ...formData, language1: e.target.value })}
  />

  <input
    type="text"
    placeholder="Secondary Lang"
    className="p-3 rounded bg-gray-800 text-white w-40"
    value={formData.language2}
    onChange={(e) => setFormData({ ...formData, language2: e.target.value })}
  />
</div>


  <div className="flex gap-2">
    {formData.tags.map((tag, index) => (
      <input
        key={index}
        type="text"
        placeholder={`Tag ${index + 1}`}
        className="p-3 rounded bg-gray-800 text-white flex-1"
        value={tag}
        onChange={(e) => handleTagChange(index, e.target.value)}
      />
    ))}
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

export default EventForm;
