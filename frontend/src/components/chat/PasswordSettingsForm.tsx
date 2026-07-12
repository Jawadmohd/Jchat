import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import FormField from "../FormField";
import { LockIcon } from "../icons/AuthIcons";
import { useUpdateProfileMutation } from "../../features/auth/authApi";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/getErrorMessage";
import SettingsSection from "./SettingsSection";

interface PasswordFormValues {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export default function PasswordSettingsForm() {
  const { user } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("password");

  if (!user) {
    return null;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile({
        currentPassword: data.currentPassword,
        password: data.password,
      }).unwrap();

      toast.success("Password updated");
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update password"));
    }
  });

  return (
    <SettingsSection
      title="Password"
      description="Enter your current password to set a new one."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Current password"
          type="password"
          autoComplete="current-password"
          icon={<LockIcon />}
          error={errors.currentPassword}
          {...register("currentPassword", {
            required: "Current password is required",
          })}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            icon={<LockIcon />}
            error={errors.password}
            {...register("password", {
              required: "New password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />

          <FormField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            icon={<LockIcon />}
            error={errors.confirmPassword}
            {...register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            })}
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
