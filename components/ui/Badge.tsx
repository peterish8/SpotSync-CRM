import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "tamil" | "english" | "korean" | "genre";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    const variants = {
      default: "bg-background-tertiary text-text-secondary",
      tamil: "bg-orange-500/20 text-orange-400",
      english: "bg-blue-500/20 text-blue-400",
      korean: "bg-purple-500/20 text-purple-400",
      genre: "bg-spotify-green/20 text-spotify-green",
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
