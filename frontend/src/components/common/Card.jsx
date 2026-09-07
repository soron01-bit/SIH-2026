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
      className={`bg-meteor-900/80 backdrop-blur-md border border-meteor-border rounded-xl shadow-lg transition-all duration-200 hover:border-meteor-border-light ${className}`}
    >
      {(title || subtitle || Icon || action) && (
        <div className={`px-5 py-4 border-b border-meteor-border/60 flex items-center justify-between ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
