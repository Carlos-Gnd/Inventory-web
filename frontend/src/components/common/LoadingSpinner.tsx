// frontend/src/components/common/LoadingSpinner.tsx 

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div 
        className={`
          ${sizes[size]} 
          border-primary-600 
          dark:border-primary-400
          border-t-transparent 
          dark:border-t-transparent
          rounded-full 
          animate-spin
        `} 
      />
    </div>
  );
}