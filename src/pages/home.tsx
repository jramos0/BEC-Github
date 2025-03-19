import  { useEffect, useState } from 'react';
import axios from 'axios';
import pbnLogo from '../assets/pbn_logo.png';

interface GitHubUser {
  username: string;
  displayName?: string;
}

const Home = () => {
  const [user, setUser] = useState<GitHubUser | null>(null);

useEffect(() => {
    axios.get('http://localhost:4000/api/user', { withCredentials: true })
      .then(response => {
        const profile = response.data.user;
        setUser({
          username: profile.username,
          displayName: profile.displayName,
        });
      })
      .catch(err => {
        console.error('Error fetching user:', err);
      });
  }, []);
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="mb-6">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14 w-full" />
      </div>
      <h1 className="text-4xl font-bold">Welcome</h1>
      {user && (
        <p className="mt-4 text-xl">
          Signed in as: <strong>{user.displayName || user.username}</strong>
        </p>
      )}
    </div>
  );
};

export default Home;
