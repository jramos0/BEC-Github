import pbnLogo from "../assets/pbn_logo.png";
import NewsletterForm from "../components/NewsletterForm";

const Newsletter = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-black text-white px-4 py-8">
      <div className="mb-8">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-12 w-auto" />
      </div>
      <NewsletterForm />
    </div>
  );
};

export default Newsletter;
