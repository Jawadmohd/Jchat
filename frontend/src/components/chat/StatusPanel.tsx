import { HiSignal } from "react-icons/hi2";

export default function StatusPanel() {
  return (
    <div className="flex h-full flex-col bg-primary">
      <header className="border-b border-secondary/10 bg-tertiary px-4 py-4 md:px-6">
        <h1 className="text-xl font-semibold text-secondary">Status</h1>
        <p className="mt-1 text-sm text-muted">Share updates with your contacts</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-secondary/10 bg-tertiary">
          <HiSignal className="h-9 w-9 text-muted" />
        </div>
        <h2 className="text-lg font-medium text-secondary">No status updates</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Status updates from your contacts will appear here.
        </p>
      </div>
    </div>
  );
}
