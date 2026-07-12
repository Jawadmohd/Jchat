interface LogoProps {
  compact?: boolean;
  onBrandPanel?: boolean;
}

export default function Logo(_props: LogoProps = {}) {
  return (
    <div className="inline-flex items-center gap-1.5 font-bold tracking-tight text-secondary">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-lg text-primary">
        j
      </span>
      <span className="text-2xl">Chat</span>
    </div>
  );
}
