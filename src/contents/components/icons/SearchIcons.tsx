import React from "react"

interface SearchIconProps {
  theme: "light" | "dark"
  size?: string
}

export const ShowSearchIcon = ({ theme, size = "18" }: SearchIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#fff" : "#000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Magnifying glass */}  
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

export const HideSearchIcon = ({ theme, size = "18" }: SearchIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#fff" : "#000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Slashed Magnifying glass */}  
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
    <line x1="4" y1="4" x2="18" y2="18"></line> {/* Adjusted slash */}
  </svg>
) 