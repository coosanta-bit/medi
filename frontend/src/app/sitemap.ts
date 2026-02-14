import type { MetadataRoute } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://medifordoc.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const res = await fetch(`${API_BASE}/jobs/sitemap`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const jobs: { id: string; updated_at: string }[] = await res.json();
      const jobPages = jobs.map((job) => ({
        url: `${SITE_URL}/jobs/${job.id}`,
        lastModified: new Date(job.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
      return [...staticPages, ...jobPages];
    }
  } catch {
    /* fallback to static only */
  }

  return staticPages;
}
