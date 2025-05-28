import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../components/supabaseClient";

export default function Login({ setRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    // clear any stale auth info
    localStorage.removeItem('workflow_name');
    localStorage.removeItem('email');
    e.preventDefault();

    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      return;
    }


    console.log("Logged in user ID:", authData?.user?.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, workflow_name, status')
      .eq('id', authData.user.id?.toString())
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      setErrorMsg("Couldn't load profile.");
      return;
    }

    if (profile.status !== 'active') {
      setErrorMsg("Your account is inactive. Please contact support.");
      await supabase.auth.signOut();
      return;
    }

    localStorage.setItem('role', profile.role);
    localStorage.setItem('workflow_name', profile.workflow_name);
    if (authData?.user?.email) {
      localStorage.setItem('email', authData.user.email);
    }

    if (setRole) setRole(profile.role);

    const destination = profile.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';
    console.log(`Redirecting to ${destination}`);
    navigate(destination);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-8 rounded shadow-md max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Login</h2>

        {errorMsg && <p className="text-red-600 dark:text-red-300 text-sm mb-4">{errorMsg}</p>}

        <input
          type="email"
          className="w-full p-2 mb-3 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          className="w-full p-2 mb-4 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Log In
        </button>
      </form>
    </div>
  );
}