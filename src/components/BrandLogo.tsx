import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="VoiceCraft AI Logo"
    >
      <defs>
        {/* Hexagon Clip Path */}
        <clipPath id="hexagon-clip">
          <polygon points="100,10 180,56 180,148 100,194 20,148 20,56" />
        </clipPath>
      </defs>

      {/* Hexagon Base Background */}
      <polygon
        points="100,10 180,56 180,148 100,194 20,148 20,56"
        fill="#2B323B"
        stroke="#2B323B"
        strokeWidth="1"
      />

      {/* Intersecting White Geometric Lines inside Hexagon */}
      <g clipPath="url(#hexagon-clip)" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square">
        {/* Diagonal Line from top-left area to lower-left */}
        <line x1="90" y1="0" x2="35" y2="180" />
        
        {/* Steep diagonal from upper-center to lower-right */}
        <line x1="105" y1="0" x2="160" y2="190" />
        
        {/* Diagonal crossing from top-right to bottom-left */}
        <line x1="145" y1="20" x2="65" y2="185" />
        
        {/* Upper-left cut line */}
        <line x1="10" y1="75" x2="195" y2="190" />
        
        {/* Lower right cut line */}
        <line x1="185" y1="125" x2="135" y2="195" />
      </g>
    </svg>
  );
};
