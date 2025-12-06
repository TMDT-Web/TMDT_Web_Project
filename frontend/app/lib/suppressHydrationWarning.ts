// Suppress hydration warnings caused by browser extensions and React Router
// This must be imported before React hydrates
if (typeof window !== "undefined" && import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Hydration") ||
        args[0].includes("hydrated") ||
        args[0].includes("server rendered HTML") ||
        args[0].includes("did not match"))
    ) {
      // Suppress hydration mismatch warnings
      return;
    }
    originalError.call(console, ...args);
  };
}

export {};
