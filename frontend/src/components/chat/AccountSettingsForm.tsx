import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import FormField from "../FormField";
import { MailIcon, UserIcon } from "../icons/AuthIcons";
import { useUpdateProfileMutation } from "../../features/auth/authApi";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/getErrorMessage";
import SettingsSection from "./SettingsSection";

interface AccountFormValues {
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
    formState: { errors, isDirty },
  } = useForm<AccountFormValues>({
    defaultValues: {
      username: user?.username ?? "",
      emailId: user?.emailId ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        emailId: user.emailId,
      });
    }
  }, [reset, user]);

  if (!user) {
    return null;
  }

  const onSubmit = handleSubmit(async (data) => {
    const payload: { username?: string; emailId?: string } = {};

    if (data.username.trim() !== user.username) {
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
      description="Update your username and email address."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="Username"
          icon={<UserIcon />}
          error={errors.username}
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
            disabled={isLoading || !isDirty}
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
