// src/routes/ProtectedAdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAdminUser, fetchUserWithCargo } from "../utils/authUser";

export default function ProtectedAdminRoute({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const full = await fetchUserWithCargo();
        setMe(full);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;
  if (!me || !isAdminUser(me)) return <Navigate to="/" replace />;
  return children;
}

