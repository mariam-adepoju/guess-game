import { useCallback, useEffect, useState } from "react";

/** Minimal History API routing: the current path plus a navigate function. */
export function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setPathname(path);
  }, []);

  return { pathname, navigate };
}
