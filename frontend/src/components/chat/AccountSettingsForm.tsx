import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import FormField from "../FormField";
import { MailIcon, UserIcon } from "../icons/AuthIcons";
import { useUpdateProfileMutation } from "../../features/auth/authApi";
import { useAuth } from "../../hooks/useAuth";
import { useUsernameAvailability } from "../../hooks/useUsernameAvailability";
import { getErrorMessage } from "../../utils/getErrorMessage";
import SettingsSection from "./SettingsSection";

interface AccountFormValues {
  name: string;
  username: string;
  emailId: string;
}

export default function AccountSettingsForm() {
  const { user } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<AccountFormValues>({
    defaultValues: {
      name: user?.name ?? "",
      username: user?.username ?? "",
      emailId: user?.emailId ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        username: user.username,
        emailId: user.emailId,
      });
    }
  }, [reset, user]);

  const usernameValue = watch("username");
  const usernameAvailability = useUsernameAvailability(usernameValue, {
    currentUsername: user?.username,
  });

  if (!user) {
    return null;
  }

  const onSubmit = handleSubmit(async (data) => {
    const payload: { name?: string; username?: string; emailId?: string } = {};

    if (data.name.trim() !== user.name) {
      payload.name = data.name.trim();
    }

    if (data.username.trim() !== user.username) {
      if (usernameAvailability.status === "taken") {
        setError("username", { message: "Username is already taken" });
        return;
      }

      if (usernameAvailability.status === "checking") {
        toast.error("Please wait while we check username availability");
        return;
      }

      payload.username = data.username.trim();
    }

    if (data.emailId.trim() !== user.emailId) {
      payload.emailId = data.emailId.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast.error("No changes to save");
      return;
    }

    try {
      const updatedUser = await updateProfile(payload).unwrap();
      toast.success("Account updated");
      reset({
        name: updatedUser.name,
        username: updatedUser.username,
        emailId: updatedUser.emailId,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update account"));
    }
  });

  return (
    <SettingsSection
      title="Account"
      description="Update your display name, username, and email address."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Display name"
          icon={<UserIcon />}
          error={errors.name}
          {...register("name", {
            required: "Name is required",
            maxLength: {
              value: 60,
              message: "Name cannot exceed 60 characters",
            },
          })}
        />

        <FormField
          label="Username"
          icon={<UserIcon />}
          error={errors.username}
          helperText={usernameAvailability.helperText}
          helperTone={
            usernameAvailability.status === "available"
              ? "success"
              : usernameAvailability.status === "taken" ||
                  usernameAvailability.status === "invalid"
                ? "error"
                : "muted"
          }
          {...register("username", {
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
            maxLength: {
              value: 30,
              message: "Username cannot exceed 30 characters",
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: "Use letters, numbers, and underscores only",
            },
            onChange: () => clearErrors("username"),
            validate: () =>
              usernameAvailability.status !== "taken" || "Username is already taken",
          })}
        />

        <FormField
          label="Email"
          type="email"
          icon={<MailIcon />}
          error={errors.emailId}
          {...register("emailId", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Please enter a valid email address",
            },
          })}
        />

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={
              isLoading ||
              !isDirty ||
              usernameAvailability.isChecking ||
              usernameAvailability.status === "taken"
            }
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
