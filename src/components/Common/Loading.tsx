'use client';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function Loading({ 
  text = "Chargement...", 
  size = 'md',
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: { container: 'h-32', logo: 'w-12 h-12', text: 'text-sm' },
    md: { container: 'h-48', logo: 'w-16 h-16', text: 'text-base' },
    lg: { container: 'h-64', logo: 'w-24 h-24', text: 'text-lg' }
  };

  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50"
    : `flex items-center justify-center ${sizeClasses[size].container}`;

  return (
    <div className={containerClass}>
      <div className="text-center animate-fade-in">
        {/* Logo with animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
          <div className={`relative ${sizeClasses[size].logo} mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-slow`}>
            <img 
              src="/logo.png" 
              alt="6vgli" 
              className="w-full h-full object-contain rounded-2xl"
              onError={(e) => {
                // Fallback to emoji if logo fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-white text-2xl font-bold">6v</span>
          </div>
        </div>

        {/* Animated loading dots */}
        <div className="flex justify-center space-x-1 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Loading text */}
        <p className={`text-slate-600 font-medium ${sizeClasses[size].text} animate-pulse`}>
          {text}
        </p>

        {/* 6vgli branding */}
        <div className="mt-4 text-xs text-slate-400 animate-fade-in-delayed">
          Powered by <span className="font-semibold text-blue-600">6vgli</span>
        </div>
      </div>
    </div>
  );
}

// Specific loading components for different contexts
export function TravelConnectLoading() {
  return (
    <Loading 
      text="Connecting travelers worldwide..." 
      size="lg" 
      fullScreen={true} 
    />
  );
}

export function BloodConnectLoading() {
  return (
    <Loading 
      text="Connecting donors and patients..." 
      size="lg" 
      fullScreen={true} 
    />
  );
}

export function PageLoading({ text }: { text?: string }) {
  return (
    <Loading 
      text={text || "Chargement de la page..."} 
      size="md" 
      fullScreen={false} 
    />
  );
}

export function ComponentLoading({ text }: { text?: string }) {
  return (
    <Loading 
      text={text || "Chargement..."} 
      size="sm" 
      fullScreen={false} 
    />
  );
}