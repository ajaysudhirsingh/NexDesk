import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'blue', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-8">
      <svg 
        className={`animate-spin drop-shadow-2xl ${sizeClasses[size]} ${colorClasses[color]}`}
        style={{ filter: 'drop-shadow(0 4px 16px rgba(37,99,235,0.15))' }}
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="#3b82f6" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="#10b981" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className="text-base text-primary font-semibold font-sans drop-shadow-sm" style={{textShadow:'0 2px 4px rgba(16,185,129,0.10)'}}>{text}</span>}
    </div>
  );
};

export default LoadingSpinner; 