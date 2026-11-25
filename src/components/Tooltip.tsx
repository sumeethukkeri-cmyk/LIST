import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = 'top',
}) => {
  const [visible, setVisible] = useState(false);

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-lg bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-100 border border-white/10 flex items-center gap-2 ${posClasses}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="font-mono-tabular text-[10px] px-1 py-0.5 rounded bg-white/10 text-slate-300">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
