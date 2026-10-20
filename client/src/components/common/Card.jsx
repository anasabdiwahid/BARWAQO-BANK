import React from 'react';

export const Card = ({ children, className = '', title, subtitle, headerAction, ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/90 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

