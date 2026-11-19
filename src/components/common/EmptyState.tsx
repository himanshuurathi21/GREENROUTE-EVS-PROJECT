import React from 'react';
import { Leaf, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = Leaf,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-accent-dark/50 max-w-xl mx-auto my-8">
      <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-forest mb-4">
        <Icon className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-medium text-slate-dark mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-mineral leading-relaxed max-w-md mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-forest hover:bg-forest-hover rounded transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
