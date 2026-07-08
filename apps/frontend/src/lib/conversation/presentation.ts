import type { ConversationDto } from "@qa-copilot/shared";

const FALLBACK_TITLE = "Nueva conversación";
const MAX_TITLE_LENGTH = 48;

export function deriveConversationTitle(conversation: ConversationDto): string {
  const firstUserMessage = conversation.messages.find((message) => message.role === "user");

  if (!firstUserMessage) {
    return FALLBACK_TITLE;
  }

  const normalized = firstUserMessage.content.trim().replace(/\s+/g, " ");

  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`;
}

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const DIVISIONS: ReadonlyArray<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

export function formatRelativeTime(dateIso: string): string {
  let duration = (new Date(dateIso).getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_TIME_FORMATTER.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return RELATIVE_TIME_FORMATTER.format(Math.round(duration), "years");
}
