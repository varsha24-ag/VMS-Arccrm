import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, className = "", id, ...props }, ref) => {
        return (
            <label className="group flex cursor-pointer items-center gap-2.5 text-sm font-medium text-[#344054]">
                <div className="relative flex h-5 w-5 items-center justify-center">
                    <input
                        type="checkbox"
                        id={id}
                        ref={ref}
                        className={`peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-[#cfd4dc] bg-white transition-all duration-200 checked:border-[#e9774b] checked:bg-[#e9774b] focus:outline-none focus:ring-4 focus:ring-[#e9774b]/10 group-hover:border-[#e9774b] ${className}`}
                        {...props}
                    />
                    <svg
                        className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" transform="scale(0.6) translate(-4, -6)" />
                    </svg>
                </div>
                <span className="select-none">{label}</span>
            </label>
        );
    }
);

Checkbox.displayName = "Checkbox";
