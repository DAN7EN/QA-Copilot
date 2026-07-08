import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConversationStore } from "@/stores/conversation.store";

export function ModelSelector() {
  const models = useConversationStore((state) => state.models);
  const selectedModelId = useConversationStore((state) => state.selectedModelId);
  const setSelectedModelId = useConversationStore((state) => state.setSelectedModelId);

  if (models.length === 0) {
    return null;
  }

  return (
    <Select value={selectedModelId} onValueChange={setSelectedModelId}>
      <SelectTrigger size="sm" aria-label="Modelo">
        <SelectValue placeholder="Modelo" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
