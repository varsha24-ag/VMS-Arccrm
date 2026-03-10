import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = "", id, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label htmlFor={id} className="block text-sm font-medium text-[#101828]">
                        {label}
                    </label>
                )}
                <input
                    id={id}
                    ref={ref}
                    className={`w-full rounded-md border border-[#cfd4dc] bg-white px-3.5 py-2.5 text-base text-[#101828] placeholder:text-[#667085] outline-none transition-shadow duration-200 focus:border-[#e9774b] focus:ring-4 focus:ring-[#e9774b]/10 ${error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""
                        } ${className}`}
                    {...props}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
