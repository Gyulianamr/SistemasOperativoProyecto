import React from "react";

export const Card = ({ children, ...props }) => {
  return (
    <div
      {...props}
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        margin: "16px 0",
      }}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, ...props }) => {
  return (
    <div
      {...props}
      style={{
        padding: "8px",
      }}
    >
      {children}
    </div>
  );
};