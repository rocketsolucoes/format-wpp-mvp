import React from 'react';

/**
 * Props do componente Avatar
 */
interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Avatar Component
 *
 * Componente de avatar com imagem ou fallback (inicial do nome).
 *
 * Tamanhos disponíveis:
 * - sm: 32px
 * - md: 40px (padrão)
 * - lg: 48px
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  fallback = 'U',
  size = 'md',
  className = '',
}) => {
  /**
   * Retorna as classes de tamanho
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  /**
   * Extrai a primeira letra do fallback
   */
  const getInitial = () => {
    return fallback.charAt(0).toUpperCase();
  };

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-semibold ${getSizeClasses()} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitial()}</span>
      )}
    </div>
  );
};

export default Avatar;
