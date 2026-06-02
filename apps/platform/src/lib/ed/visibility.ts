import type { SubscriptionState } from "@/lib/subscription/state";

export const ED_CHATBOT_MODULE_ID = "ed-ai-coach";

export function hasEdChatbotAccess(
  subscription: Pick<SubscriptionState, "enabledModules" | "isActive"> | null | undefined,
) {
  return Boolean(
    subscription?.isActive &&
      subscription.enabledModules.includes(ED_CHATBOT_MODULE_ID),
  );
}
