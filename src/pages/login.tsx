import React from "react";
import pbnLogo from "../assets/pbn_logo.png";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      {/* Logo Placeholder */}
      <div className="mb-6">
      <img src={pbnLogo} alt="Plan B Network Logo" className="h-24 w-full" />
      </div>

      {/* Login Form */}
      <div className="w-80 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold">
          Sign In
        </button>
      </div>
    </div>
  );
};

export default Login;
