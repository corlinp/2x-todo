import { cn } from "@/lib/utils";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  full_name?: string;
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ user, size = 'sm', className }: UserAvatarProps) {
  // Extract initials from name or email
  const getInitials = (user: User) => {
    const name = user.name || user.full_name;
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    
    // Fallback to email
    const emailName = user.email.split('@')[0];
    const emailParts = emailName.split(/[._-]+/);
    
    if (emailParts.length >= 2) {
      return (emailParts[0][0] + emailParts[1][0]).toUpperCase();
    }
    return emailName.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on email
  const getAvatarColor = (email: string) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm', 
    lg: 'w-10 h-10 text-base'
  };

  const initials = getInitials(user);
  const colorClass = getAvatarColor(user.email);
  const displayName = user.name || user.full_name || user.email;

  // If we have an avatar URL, use it
  if (user.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={displayName}
        width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        className={cn(
          'rounded-full object-cover shrink-0',
          sizeClasses[size],
          className
        )}
        title={`Assigned to ${displayName}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  // Fallback to initials
  return (
    <div 
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium shrink-0',
        sizeClasses[size],
        colorClass,
        className
      )}
      title={`Assigned to ${displayName}`}
    >
      {initials}
    </div>
  );
} 