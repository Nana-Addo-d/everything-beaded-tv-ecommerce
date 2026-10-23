"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: "3rem auto",
          maxWidth: "42rem",
          padding: "1.5rem",
          lineHeight: 1.6,
        }}
      >
        <h1>The store is temporarily unavailable</h1>
        <p>
          We could not load the latest store information. Your saved bag remains
          in this browser.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ padding: "0.75rem 1.25rem", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
