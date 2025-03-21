'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /** Size of the spinner - sm: small, md: medium, lg: large, xl: extra large */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color theme for the spinner */
  color?: string;
  /** Custom loading message to display (defaults to "Chargement en cours") */
  text?: string | null;
  /** Whether to hide the text completely */
  hideText?: boolean;
}

/**
 * A versatile loading spinner component with customizable size, color and text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = 'blue',
  text = 'Chargement en cours',
  hideText = false
}) => {
  // Map size to specific pixel values
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Map color names to tailwind color classes
  const colorMap = {
    blue: 'border-blue-500',
    red: 'border-red-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
    gray: 'border-gray-500'
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = colorMap[color as keyof typeof colorMap] || 'border-blue-500';
  
  // Dynamic dots for animation
  const [dots, setDots] = React.useState('.');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.');
    }, 400);
    
    return () => clearInterval(interval);
  }, []);

  // Display message - use provided text or default
  const displayText = text !== null ? text : 'Chargement en cours';

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative">
        {/* Main spinner */}
        <div className={`${spinnerSize} border-4 border-gray-200 rounded-full animate-spin`}>
          <div className={`${spinnerSize} border-t-4 ${spinnerColor} rounded-full`}></div>
        </div>
        
        {/* Background glow effect */}
        <div className={`absolute inset-0 ${spinnerSize} bg-${color.split('-')[0]}-400 rounded-full opacity-25 blur-md animate-pulse`}></div>
      </div>
      
      {!hideText && displayText && (
        <div className="mt-4 text-center w-full">
          {/* Fixed height container for the text to prevent layout shifts */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-gray-700 font-medium">
              {/* Ensure consistent width with non-breaking space after text */}
              <span>{displayText}</span>
              <span className="inline-block w-9 text-left">{dots}</span>
            </p>
          </div>
          <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-full bg-red-500 animate-loadingBar rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
