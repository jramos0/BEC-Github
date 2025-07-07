import pbnLogo from "../assets/pbn_logo.png";
import TutorialForm from "../components/TutorialForm";

const Tutorials = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-black text-white w-full">
      <div className="mb-8">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-12 w-auto" />
      </div>
      <div className="w-full lg:w-4/5 mt-8 mx-auto">
        <TutorialForm />
      </div>
    </div>
  );
};

export default Tutorials;
