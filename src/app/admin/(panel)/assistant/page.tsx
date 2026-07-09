import { isAiConfigured } from "@/lib/env";
import { AssistantChat } from "./assistant-chat";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <div>
      <h1 className="font-display text-2xl">AI Assistant</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Tell me what to change in plain English — prices, visibility, images, descriptions, discount
        codes. Drop in a photo to update a product image. Nothing changes until you press{" "}
        <strong>Apply</strong>.
      </p>
      <div className="mt-6">
        <AssistantChat configured={isAiConfigured()} />
      </div>
    </div>
  );
}
