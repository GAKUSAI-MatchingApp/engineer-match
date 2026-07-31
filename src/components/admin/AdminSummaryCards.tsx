import { memo } from "react";
import {
  Briefcase,
  Building2,
  Send,
  ShieldAlert,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { AdminSummaryCardData } from "@/lib/admin/dashboard";

const ICON_MAP = {
  userRound: UserRound,
  building2: Building2,
  briefcase: Briefcase,
  send: Send,
  shieldAlert: ShieldAlert,
  userPlus: UserPlus,
} as const;

function AdminSummaryCardItem({ card }: { card: AdminSummaryCardData }) {
  const Icon = ICON_MAP[card.icon as keyof typeof ICON_MAP];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{card.label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {card.value}
      </p>
    </div>
  );
}

interface AdminSummaryCardsProps {
  cards: AdminSummaryCardData[];
}

export const AdminSummaryCards = memo(function AdminSummaryCards({ cards }: AdminSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <AdminSummaryCardItem key={card.id} card={card} />
      ))}
    </div>
  );
});
