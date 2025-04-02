// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Events from "./pages/events";
import Newsletter from "./pages/newsletters";
import Professor from "./pages/professors"; 
// import Project from "./pages/project"; (pronto)

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/events" element={<Events />} />
        <Route path="/newsletter" element={<Newsletter />} />
        {/* futuros */}
        {/* <Route path="/professor" element={<Professor />} />
        
        <Route path="/project" element={<Project />} /> */}
        <Route path="/professor" element={<Professor />} />
        <Route path="*" element={<h1 className="text-white text-center mt-10">404 - Page not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
