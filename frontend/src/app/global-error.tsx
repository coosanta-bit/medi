"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            서비스 오류
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              border: "1px solid #ddd",
              borderRadius: "0.375rem",
              cursor: "pointer",
              backgroundColor: "#fff",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
