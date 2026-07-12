import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import {
  ArrowRightIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "../components/icons/AuthIcons";
import { useRegisterMutation } from "../features/auth/authApi";
import type { RegisterRequest } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

const signupFeatures = [
  {
    title: "Create your identity",
    description: "Pick a username and start building your presence on jChat.",
  },
  {
    title: "Private by design",
    description: "Passwords are hashed and sessions stay secure in httpOnly cookies.",
  },
  {
    title: "Ready in seconds",
    description: "Sign up once and jump straight into conversations.",
  },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    defaultValues: {
      emailId: "",
      username: "",
      name: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await registerUser(data).unwrap();
      toast.success(response.message);
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed"));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join jChat and start connecting with people in a modern, real-time workspace."
      brandTitle="Your next conversation starts here."
      brandDescription="Build your profile, meet new people, and experience messaging without the clutter."
      features={signupFeatures}
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormField
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
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

        <FormField
          label="Display name"
          type="text"
          placeholder="Your full name"
          autoComplete="name"
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
          type="text"
          placeholder="Choose a unique username"
          autoComplete="username"
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
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          icon={<LockIcon />}
          error={errors.password}
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />

        <button
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3.5 text-base font-semibold text-primary shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition hover:-translate-y-px hover:shadow-[0_18px_34px_rgba(0,0,0,0.18)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRightIcon width={18} height={18} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
