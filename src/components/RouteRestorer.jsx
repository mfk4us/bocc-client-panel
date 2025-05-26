import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RouteRestorer() {
  const navigate = useNavigate();
  useEffect(() => {
    const lastRoute = localStorage.getItem("last_route");
    if (lastRoute && window.location.pathname !== lastRoute) {
      localStorage.removeItem("last_route");
      navigate(lastRoute, { replace: true });
    }
  }, [navigate]);
  return null;
}