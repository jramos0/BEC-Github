import  { useEffect, useState } from 'react';

import pbnLogo from '../assets/pbn_logo.png';

const Home = () => {
  const [render, setRender]= useState(false)
  const [userData, setUserData] = useState<Record<string, any>>({});
  useEffect (()=> {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const  codeParam = urlParams.get("code");
    console.log(codeParam)

    if (codeParam &&(localStorage.getItem("accessToken")===null)){
      async function getAccessToken(){
        await fetch("http://localhost:4000/getAccessToken?code="+ codeParam,{
          method:"GET"
        }).then((response)=>{
          return response.json()
        }).then((data)=>{
          console.log(data)
          if(data.access_token){
            localStorage.setItem('accessToken', data.access_token)
            setRender(!render)
          }
        })
      }
      getAccessToken();
    }

  },[]);

  async function getUserData() {
    await fetch ('http://localhost:4000/getUserData',{
      method: "GET",
      headers:{
        "Authorization": "Bearer " + localStorage.getItem("accessToken") as string
      }
    }).then((response)=>{
      return response.json()
    }).then((data)=>{
      console.log(data)
      setUserData(data)
    })
  }

  useEffect(() => {
    getUserData();
  }, [localStorage.getItem("accessToken")]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="mb-6">
        <img src={pbnLogo} alt="Plan B Network Logo" className="h-14 w-full" />
      </div>
      <h1 className="text-4xl font-bold my-3">Welcome</h1>
      {localStorage.getItem("accessToken")?
        <>
        {Object.keys(userData).length !== 0 ? (
            <>
              <h3 className='text-3xl'>User: <strong>{userData.login}</strong></h3>
            </>
          ) : (
            <p>Loading user...</p>
          )}
        <button onClick= {()=> {localStorage.removeItem("accessToken"); setUserData({}); setRender(!render); window.location.href='http://localhost:5173/'}} className="my-3">
          Log out
        </button>
        </>:
        <>
          <button onClick={()=>{window.location.href="http://localhost:5173/login"}}>Sign in</button>
          <button style={{marginTop: '5px'}} onClick={()=>{window.location.href="http://localhost:5173/events"}}>Events</button>
        </>
    }
    </div>
  );
};

export default Home;
