import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", ttl = 4000) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, type }]);
      if (ttl) setTimeout(() => remove(id), ttl);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => remove(t.id)}
            className={`animate-fade-in-up cursor-pointer rounded-lg px-4 py-3 text-sm shadow-soft ${
              t.type === "error"
                ? "bg-red-600 text-white"
                : t.type === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-ink text-cream"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
