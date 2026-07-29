import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import Logo from "./Logo";

interface AuthFeature {
  title: string;
  description: string;
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  brandTitle: string;
  brandDescription: string;
  features: AuthFeature[];
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export default function AuthLayout({
  title,
  subtitle,
  brandTitle,
  brandDescription,
  features,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-primary lg:grid-cols-[1.05fr_0.95fr]">
      <aside
        className="relative flex flex-col justify-between overflow-hidden border-r border-secondary/8 bg-tertiary p-8 text-secondary md:p-12"
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(circle at center, black, transparent 80%)",
          }}
        />
        <div className="pointer-events-none absolute -right-10 top-[10%] h-[280px] w-[280px] rounded-full bg-primary opacity-70 blur-[80px]" />
        <div className="pointer-events-none absolute -left-8 bottom-[12%] h-[220px] w-[220px] rounded-full bg-secondary opacity-[0.04] blur-[80px]" />

        <div className="relative z-10 max-w-[460px] animate-fade-up">
          <Logo onBrandPanel />

          <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {brandTitle}
          </h2>
          <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-muted md:text-lg">
            {brandDescription}
          </p>

          <ul className="mt-10 hidden grid-cols-1 gap-4 lg:grid">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3.5">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                <div>
                  <strong className="block text-[0.95rem]">
                    {feature.title}
                  </strong>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-8 hidden max-w-[360px] animate-fade-up grid-cols-1 gap-3 [animation-delay:150ms] lg:grid">
          <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm border border-secondary/10 bg-primary px-4 py-3.5 text-sm leading-relaxed shadow-sm">
            Hey, are you online?
          </div>
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-3.5 text-sm leading-relaxed text-primary">
            Always. What&apos;s up?
          </div>
          <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm border border-secondary/10 bg-primary px-4 py-3.5 text-sm leading-relaxed shadow-sm">
            Let&apos;s build something great.
          </div>
        </div>
      </aside>

      <main className="flex justify-center bg-primary p-5 pt-10 overflow-y-auto md:p-8 lg:items-center">
        <div className="w-full max-w-[440px] animate-fade-up p-2">
          <div className="mb-6 lg:hidden">
            <Logo compact />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-secondary md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted">
              {subtitle}
            </p>
          </div>

          {children}

          <p className="mt-7 text-center text-sm text-muted">
            {footerText}{" "}
            <Link
              to={footerLinkTo}
              className="font-semibold text-secondary underline-offset-4 hover:opacity-70"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
