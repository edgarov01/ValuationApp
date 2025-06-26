
import React, { useState } from 'react';
import { TooltipProps } from '../../types';

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-2">
      {children ? (
        <span 
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onFocus={() => setIsVisible(true)}
          onBlur={() => setIsVisible(false)}
          tabIndex={0} // Make it focusable
          className="cursor-help"
        >
          {children}
        </span>
      ) : (
        <span
          className="cursor-help text-blue-500 hover:text-blue-700"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onFocus={() => setIsVisible(true)}
          onBlur={() => setIsVisible(false)}
          tabIndex={0} // Make it focusable
        >
          (?)
        </span>
      )}
      {isVisible && (
        <div
          role="tooltip"
          className="absolute z-10 w-64 p-3 -mt-2 text-sm leading-tight text-white transform -translate-x-1/2 -translate-y-full bg-slate-700 rounded-lg shadow-lg left-1/2"
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
    