import React from "react";
import pbnLogo from "../assets/pbn_logo.png";


const Events = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4">
      {/* Logo */}
      <div className="mb-6">
      <img src={pbnLogo} alt="Plan B Network Logo" className="h-24 w-full" />
      </div>

      {/* Input con tamaño controlado */}
      <input
        type="text"
        placeholder="Write down"
        className="w-full max-w-md p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default Events;
