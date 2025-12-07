// frontend/src/components/common/Card.tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  subtitle,
  children,
  action,
  className = ''
}: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-soft border border-gray-100 ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

