"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type OptProps = { value?: string | number; disabled?: boolean; children?: ReactNode };
type Props = {
  children: ReactNode; // <option> biasa, supaya pemakaian sama seperti <select>
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string; // hanya tata letak (mt-1 w-full dst.)
  "aria-label"?: string;
};

const text = (n: ReactNode) => Children.toArray(n).join("");

// Pengganti <select> bergaya kustom. Menyertakan <input hidden name> supaya form GET/POST tetap jalan.
export function Select({ children, name, value, defaultValue = "", onValueChange, required, disabled, className = "", ...rest }: Props) {
  const opts = Children.toArray(children)
    .filter((c): c is ReactElement<OptProps> => isValidElement(c))
    .map((c) => ({ value: String(c.props.value ?? text(c.props.children)), label: text(c.props.children), disabled: !!c.props.disabled }));
  const [inner, setInner] = useState(defaultValue);
  const cur = value ?? inner;
  const selected = opts.find((o) => o.value === cur);
  const muted = !selected || (cur === "" && (selected.disabled || selected.label.endsWith("…")));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, up: false });
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const shown = opts.filter((o) => !(o.disabled && o.value === ""));

  function openList() {
    const r = btn.current!.getBoundingClientRect();
    const up = window.innerHeight - r.bottom < 280 && r.top > 280;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: r.left, width: r.width, up });
    setActive(Math.max(0, shown.findIndex((o) => o.value === cur)));
    setOpen(true);
  }
  function pick(v: string) {
    setInner(v);
    onValueChange?.(v);
    setOpen(false);
    btn.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!list.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    const w = window.innerWidth;
    const hide = (e: Event) => { if (e.type === "resize" ? window.innerWidth !== w : !list.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => { document.removeEventListener("pointerdown", close); window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide); };
  }, [open]);

  useEffect(() => { if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [open, active]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Tab") return setOpen(false);
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const o = shown[active]; if (o && !o.disabled) pick(o.value); }
    else if (e.key.length === 1) { // ketik huruf = loncat ke opsi
      const i = shown.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={cur} />}
      {required && <input tabIndex={-1} aria-hidden required value={cur} onChange={() => {}} className="pointer-events-none absolute h-0 w-0 opacity-0" />}
      <button
        ref={btn} type="button" disabled={disabled} role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-controls={id} aria-label={rest["aria-label"]}
        onClick={() => (open ? setOpen(false) : openList())} onKeyDown={onKey}
        className={`raw flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm font-normal shadow-sm transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${open ? "border-gold ring-2 ring-gold" : "border-slate-300"} ${muted ? "text-slate-400" : "text-navy"} ${className}`}
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <>
        <div aria-hidden className="fixed inset-0 z-[99] bg-navy/40 sm:hidden" />
        <ul
          ref={list} id={id} role="listbox"
          style={{ position: "fixed", left: pos.left, minWidth: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
          className="raw z-[100] max-h-64 w-max max-w-[min(28rem,92vw)] overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl ring-1 ring-black/5 max-sm:!inset-x-0 max-sm:!top-auto max-sm:!bottom-0 max-sm:!left-0 max-sm:!min-w-0 max-sm:max-h-[65vh] max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:p-2 max-sm:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {shown.map((o, i) => (
            <li
              key={o.value} role="option" aria-selected={o.value === cur} aria-disabled={o.disabled}
              onMouseEnter={() => setActive(i)} onClick={() => !o.disabled && pick(o.value)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 max-sm:py-3 max-sm:text-base ${i === active ? "bg-gold-soft/60" : ""} ${o.value === cur ? "font-semibold text-navy" : "text-slate-700"} ${o.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span>{o.label}</span>
              {o.value === cur && <Check size={14} aria-hidden className="shrink-0 text-gold" />}
            </li>
          ))}
        </ul>
        </>,
        document.body,
      )}
    </>
  );
}
