import React from 'react';

const InventoryIcon = ({ size = 56, className, ...props }) => (
  <svg
    height={size}
    width={size}
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 512 512"
    xmlSpace="preserve"
    fill="#000000"
    role="img"
    aria-label="Inventory icon"
    className={className}
    {...props}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <g>
        {/* Bottom box */}
        <path
          style={{ fill: '#5693c2' }}
          d="M96,320 L256,384 L416,320 L416,448 L256,512 L96,448 Z"
        ></path>
        <path
          style={{ fill: '#2f6b89' }}
          d="M96,320 L256,256 L416,320 L256,384 Z"
        ></path>

        {/* Middle box */}
        <path
          style={{ fill: '#5693c2' }}
          d="M96,192 L256,256 L416,192 L416,320 L256,384 L96,320 Z"
          opacity="0.8"
        ></path>
        <path
          style={{ fill: '#2f6b89' }}
          d="M96,192 L256,128 L416,192 L256,256 Z"
        ></path>

        {/* Top box */}
        <path
          style={{ fill: '#5693c2' }}
          d="M96,64 L256,128 L416,64 L416,192 L256,256 L96,192 Z"
          opacity="0.6"
        ></path>
        <path
          style={{ fill: '#2f6b89' }}
          d="M96,64 L256,0 L416,64 L256,128 Z"
        ></path>

        {/* Front faces for depth */}
        <path
          style={{ fill: '#4a7fa0' }}
          d="M256,128 L256,256 L96,192 L96,64 Z"
          opacity="0.3"
        ></path>
        <path
          style={{ fill: '#4a7fa0' }}
          d="M256,256 L256,384 L96,320 L96,192 Z"
          opacity="0.3"
        ></path>
        <path
          style={{ fill: '#4a7fa0' }}
          d="M256,384 L256,512 L96,448 L96,320 Z"
          opacity="0.3"
        ></path>

        {/* Highlight on boxes */}
        <path
          style={{ fill: '#FFFFFF' }}
          d="M256,0 L320,32 L256,64 L192,32 Z"
          opacity="0.4"
        ></path>
        <path
          style={{ fill: '#FFFFFF' }}
          d="M256,128 L320,160 L256,192 L192,160 Z"
          opacity="0.3"
        ></path>
        <path
          style={{ fill: '#FFFFFF' }}
          d="M256,256 L320,288 L256,320 L192,288 Z"
          opacity="0.2"
        ></path>
      </g>
    </g>
  </svg>
);

export default InventoryIcon;
