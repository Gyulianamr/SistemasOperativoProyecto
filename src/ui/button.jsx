import React from "react";

export const Button = ({ children, ...props }) => {
  return (
    <button
      {...props}
      style={{
        padding: "10px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
      }}
    >
      {children}
    </button>
  );
};