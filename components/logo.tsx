import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  linkTo?: string;
}

export function Logo({ size = "md", className = "", linkTo }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  };

  const logoImage = (
    <Image
      src="/2xlogo.png"
      alt="2xTODO - Double Your Productivity"
      width={200}
      height={200}
      className={`${sizeClasses[size]} ${className}`}
      priority
    />
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-block">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
} 