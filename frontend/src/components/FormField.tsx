import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { EyeIcon, EyeOffIcon } from "./icons/AuthIcons";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  icon?: ReactNode;
  helperText?: string;
  helperTone?: "success" | "muted" | "error";
}

export default function FormField({
  label,
  error,
  icon,
  helperText,
  helperTone = "muted",
  id,
  name,
  type,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id ?? name;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2 text-left">
      <label htmlFor={fieldId} className="text-sm font-semibold text-secondary">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted [&_svg]:h-[1.1rem] [&_svg]:w-[1.1rem]">
            {icon}
          </span>
        )}

        <input
          id={fieldId}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          className={`w-full rounded-2xl border bg-tertiary px-4 py-3.5 text-base text-secondary outline-none transition placeholder:text-muted/70 ${
            icon ? "pl-11" : ""
          } ${
            error
              ? "border-red-600 bg-red-50"
              : "border-secondary/10 hover:border-secondary/20 hover:bg-primary focus:border-secondary focus:bg-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]"
          }`}
          {...inputProps}
        />

        {isPassword && (
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted [&_svg]:h-[1.1rem] [&_svg]:w-[1.1rem]"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error && <span className="text-xs text-red-600">{error.message}</span>}
      {!error && helperText && (
        <span
          className={`text-xs ${
            helperTone === "success"
              ? "text-emerald-600"
              : helperTone === "error"
                ? "text-red-600"
                : "text-muted"
          }`}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
