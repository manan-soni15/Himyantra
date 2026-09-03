"use client";

export default function SeaIceLegend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "24px",
        right: "24px",
        zIndex: 1000,
        background: "rgba(8, 15, 30, 0.92)",
        border: "1px solid rgba(34, 211, 238, 0.35)",
        borderRadius: "10px",
        padding: "14px 16px",
        width: "210px",
        color: "#e5f7ff",
        boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "0.08em",
          marginBottom: "10px",
        }}
      >
        SEA-ICE CONCENTRATION
      </div>

      <div
        style={{
          height: "12px",
          borderRadius: "6px",
          background:
            "linear-gradient(to right, #173b8f, #16a5c9, #54d3a5, #f4d35e, #ef6c4f, #b91c1c)",
          marginBottom: "6px",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#9fb3c8",
        }}
      >
        <span>0%</span>
        <span>20%</span>
        <span>40%</span>
        <span>60%</span>
        <span>80%</span>
        <span>100%</span>
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "10px",
          color: "#8fa3b8",
        }}
      >
        Source: NASA GIBS / AMSR2
      </div>
    </div>
  );
}