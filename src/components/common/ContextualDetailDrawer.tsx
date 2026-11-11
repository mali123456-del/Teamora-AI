import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ContextualDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const ContextualDetailDrawer: React.FC<ContextualDetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  width = 'md',
}) => {
  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass =
    width === 'lg'
      ? 'max-w-2xl'
      : width === 'sm'
      ? 'max-w-sm'
      : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} h-full bg-[#FFFEFC] dark:bg-[#2C2438] border-l border-[#E2DBD0] dark:border-[#382F47] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DBD0] dark:border-[#382F47] shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9] truncate">
                {title}
              </h3>
              {badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77717D] hover:text-[#211B2C] dark:hover:text-[#F5F1E9] hover:bg-[#F5F1E9] dark:hover:bg-[#211B2C] transition-colors cursor-pointer shrink-0"
            title="Close Drawer (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
