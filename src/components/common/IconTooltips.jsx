import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

// Use existing accessible names so icon labels stay consistent across the store
// and dashboard. data-tooltip can supply a shorter visual label when needed.
const selector = [
  "a[data-tooltip]",
  "button[data-tooltip]",
  ".icon-button[aria-label]",
  ".wish-button[aria-label]",
  ".quantity button[aria-label]",
  ".toast button[aria-label]",
].join(",");

export default function IconTooltips() {
  const { key } = useLocation();
  const id = useId();
  const bubble = useRef(null);
  const [target, setTarget] = useState(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    let timer;
    let current;
    let observer;
    const hide = () => {
      clearTimeout(timer);
      observer?.disconnect();
      current = null;
      setTarget(null);
    };
    const show = (event) => {
      if (event.pointerType === "touch") return;
      if (bubble.current?.contains(event.target)) {
        clearTimeout(timer);
        return;
      }
      const element = event.target.closest?.(selector);
      if (!element) return;
      clearTimeout(timer);
      if (element === current) return;
      observer?.disconnect();
      current = element;
      const update = () =>
        setLabel(element.dataset.tooltip || element.getAttribute("aria-label"));
      update();
      setTarget(element);
      observer = new MutationObserver(update);
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["aria-label", "data-tooltip"],
      });
    };
    const leave = (event) => {
      if (current?.contains(event.relatedTarget)) return;
      if (bubble.current?.contains(event.relatedTarget)) return;
      if (event.type === "pointerout" && current === document.activeElement)
        return;
      clearTimeout(timer);
      timer = setTimeout(hide, 120);
    };
    const escape = (event) => {
      if (event.key === "Escape") hide();
    };
    document.addEventListener("pointerover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusout", leave);
    document.addEventListener("keydown", escape);
    document.addEventListener("click", hide);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      hide();
      document.removeEventListener("pointerover", show);
      document.removeEventListener("focusin", show);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusout", leave);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("click", hide);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [key]);

  useLayoutEffect(() => {
    const tooltip = bubble.current;
    if (!target || !target.isConnected) {
      tooltip.hidePopover();
      return;
    }
    // The popover top layer prevents clipping inside cards, tables and dialogs.
    tooltip.showPopover();
    const anchor = target.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    const gap = 8;
    const left = Math.max(
      gap,
      Math.min(
        anchor.left + (anchor.width - bounds.width) / 2,
        window.innerWidth - bounds.width - gap,
      ),
    );
    const below = anchor.bottom + gap;
    const top =
      below + bounds.height <= window.innerHeight - gap
        ? below
        : Math.max(gap, anchor.top - bounds.height - gap);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    const previous = target.getAttribute("aria-describedby");
    target.setAttribute(
      "aria-describedby",
      [previous, id].filter(Boolean).join(" "),
    );
    return () => {
      tooltip.hidePopover();
      if (previous === null) target.removeAttribute("aria-describedby");
      else target.setAttribute("aria-describedby", previous);
    };
  }, [target, label, id]);

  return createPortal(
    <div
      ref={bubble}
      id={id}
      role="tooltip"
      popover="manual"
      className="icon-tooltip"
    >
      {label}
    </div>,
    target?.closest("dialog") || document.body,
  );
}
