import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const routeOrder = ["/", "/research", "/life", "/about"];

export function PublicTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const previous = useRef(location.pathname);
  const from = routeOrder.indexOf(previous.current);
  const to = routeOrder.indexOf(location.pathname);
  const direction = from >= 0 && to >= 0 && to < from ? "back" : "forward";
  useEffect(() => { previous.current = location.pathname; }, [location.pathname]);
  return <div className={`route-transition ${direction}`} key={location.pathname}>{children}</div>;
}
