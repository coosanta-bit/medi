"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES, getLabel, REGIONS } from "@/lib/constants";
import { api } from "@/lib/api";
import type { FavoriteRead, FavoriteListResponse } from "@/types/favorite";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteRead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    api
      .get<FavoriteListResponse>("/me/favorites")
      .then((data) => {
        setFavorites(data.items);
        setTotal(data.total);
      })
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (jobPostId: string) => {
    try {
      await api.post(`/me/favorites/${jobPostId}`, {});
      setFavorites((prev) => prev.filter((f) => f.job_post_id !== jobPostId));
      setTotal((prev) => prev - 1);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">스크랩</h1>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[80px] rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">스크랩</h1>
      <p className="text-sm text-muted-foreground mb-4">총 {total}건</p>

      {favorites.length > 0 ? (
        <div className="space-y-3">
          {favorites.map((fav) => {
            const isExpired =
              fav.close_at && new Date(fav.close_at) < new Date();
            return (
              <Card
                key={fav.id}
                className={isExpired ? "opacity-60" : ""}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={ROUTES.JOB_DETAIL(fav.job_post_id)}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {fav.job_title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{fav.company_name}</span>
                      {fav.location_code && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {getLabel(REGIONS, fav.location_code)}
                        </span>
                      )}
                      {fav.close_at && (
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {isExpired ? "마감" : `~${fav.close_at}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(fav.job_post_id)}
                    title="스크랩 해제"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg mb-2">
            스크랩한 공고가 없습니다
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            관심 있는 공고를 스크랩하면 여기에 모아볼 수 있어요
          </p>
          <Button asChild>
            <Link href={ROUTES.JOBS}>공고 둘러보기</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
