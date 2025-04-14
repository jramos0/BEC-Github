import DashboardView from "../components/DashboardView";
import pbnLogo from "../assets/pbn_logo.png";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-black text-white w-4/5 mx-auto py-8 px-4">
      <div className="flex justify-center mb-8">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14 w-auto" />
      </div>
      <DashboardView />
    </div>
  );
};

export default Dashboard;
