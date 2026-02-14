import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "메디포닥 - 병원/의료기관 전용 구인구직";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
            <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
            <circle cx="20" cy="10" r="2" />
          </svg>
          <span style={{ fontSize: "56px", fontWeight: 800 }}>메디포닥</span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.8)",
            marginTop: "0",
          }}
        >
          병원/의료기관 전용 구인구직 플랫폼
        </p>
        <p
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "16px",
          }}
        >
          간호사 · 치위생사 · 물리치료사 · 방사선사 · 임상병리사
        </p>
      </div>
    ),
    { ...size }
  );
}
