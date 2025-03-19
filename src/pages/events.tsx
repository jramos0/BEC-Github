import pbnLogo from "../assets/pbn_logo.png";
import EventForm from "../components/EventForm";

const Events = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-black text-white px-4 py-8">
      <div className="mb-8">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-12 w-auto" />
      </div>
      <EventForm />
    </div>
  );
};

export default Events;
