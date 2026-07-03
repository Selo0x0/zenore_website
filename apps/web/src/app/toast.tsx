"use client";

type ToastProps = {
  message: string;
  onClose: () => void;
};

export function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed left-1/2 top-24 z-50 w-full max-w-md -translate-x-1/2 px-4">
      <div className="flex items-start gap-3 border border-neutral-200 bg-white px-5 py-4 shadow-2xl">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg className="h-3 w-3 text-red-600" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm-.5 2.5a.5.5 0 0 1 1 0v3a.5.5 0 0 1-1 0v-3zm.5 5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
        </div>
        <p className="flex-1 text-sm font-medium text-neutral-800">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 text-neutral-400 transition hover:text-neutral-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
