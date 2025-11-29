import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/axiosClient";

export default function AchievementDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const passed = location?.state?.achievement;
        if (passed && String(passed.id) === String(id)) {
          setItem(passed);
          if (mounted) setLoading(false);
          return;
        }

        const data = await apiClient.get(`/achievements/${id}`);
        if (!mounted) return;
        setItem(data.achievement || null);
      } catch (e) {
        console.error(e);
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!item) return (
    <div className="p-6">
      <h3 className="text-xl">Achievement not found</h3>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl p-6 bg-white shadow">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <div className="text-sm text-slate-500 mt-2">Awarded: {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</div>
        <p className="mt-4 text-slate-700">{item.description}</p>
      </div>
    </div>
  );
}
