import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'forest' | 'sage' | 'warning' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'forest':
      variantClasses = 'bg-forest text-white';
      break;
    case 'sage':
      variantClasses = 'bg-sage text-white';
      break;
    case 'warning':
      variantClasses = 'bg-[#F9F5EC] text-[#7A5826] border border-[#E8DFC8]';
      break;
    case 'outline':
      variantClasses = 'bg-transparent text-mineral-dark border border-accent-dark';
      break;
    case 'default':
    default:
      variantClasses = 'bg-accent text-forest-dark border border-accent-dark/40';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded tracking-wide ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
