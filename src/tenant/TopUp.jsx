// src/tenant/TopUp.jsx
import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";

export default function TopUp() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const tenantWorkflow = localStorage.getItem("workflow");

  useEffect(() => {
    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from("tenant_balances")
        .select("balance")
        .eq("workflow_name", tenantWorkflow)
        .single();

      if (error) {
        console.error("Error fetching balance:", error.message);
        setBalance(0); // fallback
      } else {
        setBalance(data?.balance || 0);
      }

      setLoading(false);
    };

    fetchBalance();
  }, [tenantWorkflow]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow">
      <h2 className="text-xl font-bold mb-4">💳 Top-Up Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className="mb-4 text-lg">
            Current Balance: <span className="font-semibold text-blue-600">SAR {balance}</span>
          </p>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Top-Up (Coming Soon)</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You will be able to top up your balance using Tap Payments or other methods.
            </p>
          </div>
        </>
      )}
    </div>
  );
}