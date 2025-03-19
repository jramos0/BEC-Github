import React from "react";
import ReactDOM from "react-dom/client"; // Cambia la importación correcta
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/home";
import Login from "./pages/login";
import Events from "./pages/events";

ReactDOM.hydrateRoot( // Cambia createRoot por hydrateRoot
  document.getElementById("root")!,
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/events" element={<Events />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
