/**
 * @intocal/react — React components for embedding IntoCal booking pages.
 *
 * Two components:
 *   <InlineWidget user="jane" eventType="intro-30" />
 *   <PopupButton  user="jane" eventType="intro-30">Book a call</PopupButton>
 *
 * Auto-resizes via postMessage; emits onBookingCreated when a booking completes.
 *
 * @example
 * ```tsx
 * import { InlineWidget } from "@intocal/react";
 * export default function Page() {
 *   return <InlineWidget user="jane" eventType="intro-30" />;
 * }
 * ```
 */
import React, { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_BASE_URL = "https://intocal.com";

export interface IntoCalEvents {
  /** Fired with the new booking payload when the iframe reports a successful booking. */
  onBookingCreated?: (booking: { id: string; start: string; end: string }) => void;
  /** Fired when the user navigates to a slot view. */
  onSlotSelected?: (slot: { start: string; end: string }) => void;
}

export interface BaseProps extends IntoCalEvents {
  /** IntoCal username (the part after intocal.com/) */
  user: string;
  /** Event type slug, e.g. "intro-30" */
  eventType: string;
  /** Override base URL (self-hosted / staging) */
  baseUrl?: string;
  /** Optional pre-fill query params (name, email, utm_*, etc.) */
  prefill?: Record<string, string>;
}

function buildSrc(p: BaseProps): string {
  const base = p.baseUrl || DEFAULT_BASE_URL;
  const qs = new URLSearchParams({ embed: "1", ...(p.prefill || {}) });
  return `${base}/${encodeURIComponent(p.user)}/${encodeURIComponent(p.eventType)}?${qs}`;
}

function useIntoCalMessages(
  ref: React.RefObject<HTMLIFrameElement>,
  ev: IntoCalEvents,
  expectedOrigin: string,
) {
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Only trust messages coming from the IntoCal iframe origin.
      if (e.origin !== expectedOrigin) return;
      if (ref.current && e.source !== ref.current.contentWindow) return;
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.source !== "intocal") return;
      if (e.data.type === "booking.created" && ev.onBookingCreated) {
        ev.onBookingCreated(e.data.booking);
      }
      if (e.data.type === "slot.selected" && ev.onSlotSelected) {
        ev.onSlotSelected(e.data.slot);
      }
      // auto-resize
      if (e.data.type === "resize" && ref.current && typeof e.data.height === "number") {
        ref.current.style.height = `${Math.max(500, e.data.height)}px`;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [ref, ev.onBookingCreated, ev.onSlotSelected, expectedOrigin]);
}

function originOf(baseUrl?: string): string {
  try {
    return new URL(baseUrl || DEFAULT_BASE_URL).origin;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export interface InlineWidgetProps extends BaseProps {
  /** Initial height before the iframe reports its content size. */
  minHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function InlineWidget(props: InlineWidgetProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  useIntoCalMessages(ref, props, originOf(props.baseUrl));
  return (
    <iframe
      ref={ref}
      src={buildSrc(props)}
      title={`Book ${props.user} / ${props.eventType}`}
      loading="lazy"
      style={{
        border: 0,
        width: "100%",
        minHeight: props.minHeight ?? 720,
        ...props.style,
      }}
      className={props.className}
      allow="payment"
    />
  );
}

export interface PopupButtonProps extends BaseProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PopupButton({ children, className, style, ...rest }: PopupButtonProps) {
  const [open, setOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useIntoCalMessages(iframeRef, rest, originOf(rest.baseUrl));

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button type="button" className={className} style={style} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book a meeting"
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2147483647,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "min(960px, 100%)",
              height: "min(800px, 90vh)",
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              position: "relative",
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "transparent",
                border: 0,
                fontSize: 24,
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              ×
            </button>
            <iframe
              ref={iframeRef}
              src={buildSrc(rest)}
              title={`Book ${rest.user} / ${rest.eventType}`}
              style={{ border: 0, width: "100%", height: "100%" }}
              allow="payment"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default { InlineWidget, PopupButton };
