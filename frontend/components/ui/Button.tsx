import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "outline";
    isLoading?: boolean;
}

export function Button({
    children,
    variant = "primary",
    isLoading,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

    const variants = {
        primary: "bg-[#e9774b] text-white hover:bg-[#d8663d] focus:ring-[#e9774b]/50 shadow-sm",
        secondary: "bg-[#102a45] text-white hover:bg-[#0d233a] focus:ring-[#102a45]/50 shadow-sm",
        outline: "border border-[#cfd4dc] bg-transparent text-[#344054] hover:bg-[#f9fafb] focus:ring-gray-200"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="mr-2 h-4 w-4 animate-spin text-current" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : null}
            {children}
        </button>
    );
}
