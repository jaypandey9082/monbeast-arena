"use client";

import { BeastModelCard, type BeastModelCardData } from "@/components/BeastModelCard";
import type { MockBeast } from "@/lib/mockData";

export type BeastCardData = BeastModelCardData;

type BeastCardProps = {
  beast: MockBeast | BeastCardData;
  selected?: boolean;
  locked?: boolean;
  variant?: "full" | "compact";
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionTitle?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionDisabled?: boolean;
  secondaryActionTitle?: string;
  className?: string;
};

export function BeastCard(props: BeastCardProps) {
  return <BeastModelCard {...props} />;
}
