"use client";
import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
type IconSizeProps = {
  size?: number | string;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  startIcon?: React.ReactElement<IconSizeProps>;
  endIcon?: React.ReactElement<IconSizeProps>;
};

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-gray-200 hover:bg-gray-300",
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-700 text-white hover:bg-gray-800",
        outline: "border border-gray-400 hover:bg-gray-100",
      },
      size: {
        xs: "px-1 py-1 text-xs h-6",
        sm: "px-3 py-1 text-sm h-8",
        md: "px-4 py-2 text-base h-10",
        lg: "px-6 py-3 text-lg h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
};

export default function Button({
  className,
  variant,
  size = "md",
  startIcon,
  endIcon,
  children,
  ...props
}: ButtonProps) {
  const iconSize = iconSizeMap[size];

  const start = startIcon
    ? React.cloneElement(startIcon, { size: iconSize })
    : null;

  const end = endIcon ? React.cloneElement(endIcon, { size: iconSize }) : null;

  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {start && <span className="mr-2 inline-flex">{start}</span>}
      {children}
      {end && <span className="ml-2 inline-flex">{end}</span>}
    </button>
  );
}
