import React from 'react';

export const Card = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`bg-[#0c1220] border border-slate-800 rounded-lg shadow-sm transition-colors ${className}`}
    >
      {(title || subtitle || Icon || action) && (
        <div className={`px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between ${headerClassName}`}>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-1.5 rounded bg-slate-800/80 text-sky-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-100">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
