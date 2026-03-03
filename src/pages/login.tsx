import pbnLogo from '../assets/pbn_logo.png';
import GithubLoginButton from '../components/GithubLoginButton';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream dark:bg-black text-gray-900 dark:text-white">
      <div className="mb-8">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14" />
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-6 text-center">BEC-Github Login</h2>
        <GithubLoginButton />
      </div>
    </div>
  );
};

export default Login;
