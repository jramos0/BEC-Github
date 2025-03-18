import pbnLogo from "../assets/pbn_logo.png";


const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      {/* Logo Placeholder */}
      <div className="mb-6">
      <img src={pbnLogo} alt="Plan B Network Logo" className="h-24 w-full" />
      </div>
      {/* Welcome Message */}
      <h1 className="text-4xl font-bold">Welcome</h1>
    </div>
  );
};

export default Home;
