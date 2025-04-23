import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";

export default function Team() {
  const [team, setTeam] = useState([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const workflow = localStorage.getItem("workflow");
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("workflow_name", workflow);

      if (!error) {
        setTeam(data);
      }
    };

    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-4">👥 Team Members</h2>
        {team.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No team members found.</p>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded">
            <table className="w-full table-auto border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="p-3 border-b border-gray-200 dark:border-gray-600">Email</th>
                  <th className="p-3 border-b border-gray-200 dark:border-gray-600">Role</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 border-b border-gray-200 dark:border-gray-700">{member.email}</td>
                    <td className="p-3 border-b border-gray-200 dark:border-gray-700">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}