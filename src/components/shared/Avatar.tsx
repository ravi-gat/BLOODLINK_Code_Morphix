interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  src?: string;
}

export function Avatar({ initials, size = "md", src }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-2xl",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
