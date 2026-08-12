interface BloodTypePillProps {
  type: string;
  size?: "sm" | "md" | "lg";
}

export function BloodTypePill({ type, size = "sm" }: BloodTypePillProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-lg bg-red-600 text-white flex-shrink-0 ${sizes[size]}`}
    >
      {type}
    </span>
  );
}
