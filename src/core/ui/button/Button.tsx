"use client";
import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
type IconSizeProps = {
  size?: number | string;
};
type SXProps = React.CSSProperties & {
  [key: string]: any; // so you can use arbitrary keys like "@hover", "@focus"
};
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  rounded?: "default" | "full";
  startIcon?: React.ReactElement<IconSizeProps>;
  endIcon?: React.ReactElement<IconSizeProps>;
  sx?: SXProps; // ✅ new sx prop
};
function sxToStyle(sx: SXProps = {}) {
  const style: React.CSSProperties = {};
  const pseudo: Record<string, React.CSSProperties> = {};

  Object.entries(sx).forEach(([key, value]) => {
    if (key.startsWith("@")) {
      pseudo[key] = value as React.CSSProperties;
    } else {
      style[key as any] = value as any;
    }
  });

  return { style, pseudo };
}

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all focus:outline-none cursor-pointer",
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
      rounded: { default: "rounded", full: "rounded-full" },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "default",
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
  rounded,
  startIcon,
  endIcon,
  sx,
  children,
  ...props
}: ButtonProps) {
  const iconSize = iconSizeMap[size];
  const start = startIcon
    ? React.cloneElement(startIcon, { size: iconSize })
    : null;
  const end = endIcon ? React.cloneElement(endIcon, { size: iconSize }) : null;

  const { style, pseudo } = sxToStyle(sx);

  const id = React.useId(); // unique CSS target

  return (
    <>
      {/* ✅ inline pseudo-class styling */}
      {Object.keys(pseudo).length > 0 && (
        <style>
          {Object.entries(pseudo)
            .map(([state, css]) => {
              const selector = state.replace("@", "&:");
              const rules = Object.entries(css)
                .map(
                  ([k, v]) =>
                    `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v};`
                )
                .join("");
              return `#${id}${selector}{${rules}}`;
            })
            .join("")}
        </style>
      )}

      <button
        id={id}
        style={style}
        className={cn(buttonVariants({ variant, size, rounded }), className)}
        {...props}
      >
        {start && <span className="mr-2 inline-flex">{start}</span>}
        {children}
        {end && <span className="ml-2 inline-flex">{end}</span>}
      </button>
    </>
  );
}
