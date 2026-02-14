"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

export function ScrapButton({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ items: { job_post_id: string }[] }>("/me/favorites?size=100")
      .then((data) => {
        setFavorited(data.items.some((f) => f.job_post_id === jobId));
      })
      .catch(() => {});
  }, [user, jobId]);

  const handleToggle = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ favorited: boolean }>(
        `/me/favorites/${jobId}`,
        {}
      );
      setFavorited(res.favorited);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="flex-1"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart
        className={`h-4 w-4 mr-1 ${favorited ? "fill-red-500 text-red-500" : ""}`}
      />
      {favorited ? "스크랩됨" : "스크랩"}
    </Button>
  );
}
