import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Logo from "../components/Logo";
import { useLogoutMutation } from "../features/auth/authApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      const response = await logout().unwrap();
      toast.success(response.message);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Logout failed"));
    }
  };

  return (
    <div className="min-h-screen bg-primary text-secondary">
      <header className="flex items-center justify-between border-b border-secondary px-6 py-5 md:px-8">
        <Logo compact />
        <button
          className="rounded-2xl border border-secondary/10 bg-primary px-4 py-2.5 text-sm font-semibold transition hover:bg-tertiary disabled:cursor-not-allowed disabled:opacity-70"
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? "Logging out..." : "Logout"}
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:px-8">
        <section className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Hello, {user?.username}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            You are signed in. Your conversations and messages will appear here
            as you build out the app.
          </p>
        </section>

        {user && (
          <section className="max-w-md border border-secondary p-6">
            <h2 className="mb-4 text-lg font-semibold">Your profile</h2>

            <div className="flex items-center justify-between gap-4 border-b border-secondary/10 py-2.5 text-sm">
              <span className="text-muted">Username</span>
              <span className="font-medium">{user.username}</span>
            </div>

            <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-muted">Email</span>
              <span className="font-medium">{user.emailId}</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
