import React, { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { lang } from "../lang";

export default function Team({ language }) {
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
        <h2 className="text-2xl font-bold mb-4">👥 {lang("teamMembers", language)}</h2>
        {team.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">{lang("noTeamMembersFound", language)}</p>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded">
            <table className="w-full table-auto border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="p-3 border-b border-gray-200 dark:border-gray-600">{lang("email", language)}</th>
                  <th className="p-3 border-b border-gray-200 dark:border-gray-600">{lang("role", language)}</th>
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