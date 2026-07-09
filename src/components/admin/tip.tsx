/** Small hover tooltip (ⓘ) for beginner-friendly hints in the admin forms. */
export function Tip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span
        aria-hidden
        className="grid h-4 w-4 cursor-help place-items-center rounded-full border border-line bg-surface-alt text-[10px] font-bold text-ink-soft"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-56 max-w-[70vw] -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
