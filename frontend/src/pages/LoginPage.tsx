import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { ArrowRightIcon, LockIcon, MailIcon } from "../components/icons/AuthIcons";
import { useLoginMutation } from "../features/auth/authApi";
import type { LoginRequest } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

const loginFeatures = [
  {
    title: "Real-time messaging",
    description: "Stay connected with instant chat powered by Socket.IO.",
  },
  {
    title: "Secure sessions",
    description: "Your account is protected with encrypted cookies and JWT.",
  },
  {
    title: "Clean experience",
    description: "A focused interface designed for fast, distraction-free chats.",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      emailId: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await login(data).unwrap();
      toast.success(response.message);
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your conversations right where you left off."
      brandTitle="Messaging made simple."
      brandDescription="Connect instantly, chat in real time, and keep every conversation in one beautiful place."
      features={loginFeatures}
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerLinkTo="/signup"
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
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          icon={<LockIcon />}
          error={errors.password}
          {...register("password", {
            required: "Password is required",
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
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRightIcon width={18} height={18} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
