interface MessageDateDividerProps {
  label: string;
}

export default function MessageDateDivider({ label }: MessageDateDividerProps) {
  return (
    <div className="flex justify-center py-2">
      <span className="rounded-full bg-tertiary px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
        {label}
      </span>
    </div>
  );
}
