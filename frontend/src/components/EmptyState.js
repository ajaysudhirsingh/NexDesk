import React from 'react';

const EmptyState = ({ 
  title = "No data found", 
  description = "There's nothing to display here yet.", 
  icon, 
  action,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`bg-gradient-to-br from-primary-light via-background to-accent-light shadow-xl rounded-2xl border border-gray-200 text-center ${sizeClasses[size]} px-8 max-w-lg mx-auto flex flex-col items-center justify-center`} style={{minHeight:'320px'}}>
      {icon && (
        <div className="mx-auto mb-6">
          <div className={`mx-auto ${iconSizes[size]} text-primary drop-shadow-xl bg-white/70 rounded-full flex items-center justify-center p-4 shadow-lg`}>
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-2xl font-bold text-primary-dark mb-3 font-sans drop-shadow-sm">
        {title}
      </h3>
      <p className="text-base text-gray-500 mb-8 max-w-sm mx-auto font-sans">
        {description}
      </p>
      {action && (
        <div className="flex justify-center mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState; 