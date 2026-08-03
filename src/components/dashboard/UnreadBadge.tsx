const MAX_DISPLAY_COUNT = 99;

/** 0 -> hidden (null), 1-99 -> exact count, 100+ -> "99+". */
export function formatUnreadBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  return count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(count);
}

interface UnreadBadgeProps {
  count: number;
  /**
   * Full accessible description, e.g. "未読メッセージ3件". Omit when the
   * badge sits inside a control that already exposes an equivalent
   * aria-label itself (e.g. the mobile menu button) -- the badge then
   * renders as purely decorative (aria-hidden) to avoid a duplicate
   * announcement.
   */
  ariaLabel?: string;
}

/**
 * Small red unread-count pill, absolutely positioned over the top-right
 * corner of a `relative`-positioned icon wrapper by the caller -- it never
 * takes up layout space itself, so it can't affect surrounding spacing.
 */
export function UnreadBadge({ count, ariaLabel }: UnreadBadgeProps) {
  const display = formatUnreadBadgeCount(count);
  if (!display) return null;

  return (
    <span
      {...(ariaLabel ? { "aria-label": ariaLabel } : { "aria-hidden": "true" })}
      className="animate-in fade-in zoom-in-75 absolute -top-1.5 -right-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] leading-none font-bold text-white ring-2 ring-surface duration-200 motion-reduce:animate-none"
    >
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
