"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "info" | "warning" | "error";

type ToastEventDetail = {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastItem = ToastEventDetail & { id: number };

export function pushToast(detail: ToastEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastEventDetail>("app:toast", { detail }));
}

export const ToastPresets = {
  bookAdded: {
    type: "success" as ToastType,
    title: "Book added!",
    description: "Successfully added to your library",
  },
  bookUpdated: {
    type: "success" as ToastType,
    title: "Changes saved",
    description: "Book details updated successfully",
  },
  bookDeleted: {
    type: "success" as ToastType,
    title: "Book removed",
    description: "Removed from your library",
  },
  error: {
    type: "error" as ToastType,
    title: "Something went wrong",
    description: "Please try again",
  },
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(evt: Event) {
      const custom = evt as CustomEvent<ToastEventDetail>;
      const title = String(custom.detail?.title || "").trim();
      if (!title) return;

      const toast: ToastItem = {
        id: Date.now() + Math.random(),
        title,
        description: custom.detail?.description,
        type: custom.detail?.type || "info",
        duration: custom.detail?.duration,
      };

      setToasts((prev) => [...prev, toast]);

      const duration = toast.duration || 4000;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== toast.id));
      }, duration);
    }

    window.addEventListener("app:toast", onToast as EventListener);
    return () => window.removeEventListener("app:toast", onToast as EventListener);
  }, []);

  return (
    <div className="fgToastStack" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className={`fgToast fgToast-${t.type || "info"}`}>
          <div className={`fgToastIcon fgToastIcon-${t.type || "info"}`}>{iconFor(t.type || "info")}</div>
          <div className="fgToastBody">
            <h4>{t.title}</h4>
            {t.description ? <p>{t.description}</p> : null}
          </div>
          <button type="button" className="fgToastClose" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Close notification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function iconFor(type: ToastType) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "warning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
