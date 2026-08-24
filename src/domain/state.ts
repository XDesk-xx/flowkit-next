export const DELIVERY_STATES = ["active", "completed", "cancelled"] as const;
export type DeliveryState = (typeof DELIVERY_STATES)[number];

export const CHANGE_STATES = [
  "planned",
  "active",
  "completed",
  "cancelled",
] as const;
export type ChangeState = (typeof CHANGE_STATES)[number];

export function isDeliveryState(value: unknown): value is DeliveryState {
  return (
    typeof value === "string" &&
    (DELIVERY_STATES as readonly string[]).includes(value)
  );
}

export function isChangeState(value: unknown): value is ChangeState {
  return (
    typeof value === "string" &&
    (CHANGE_STATES as readonly string[]).includes(value)
  );
}
