import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConversationStore } from "@/stores/conversation.store";

export function CapabilitySelector() {
  const capabilities = useConversationStore((state) => state.capabilities);
  const selectedCapabilityId = useConversationStore((state) => state.selectedCapabilityId);
  const setSelectedCapabilityId = useConversationStore((state) => state.setSelectedCapabilityId);

  if (capabilities.length === 0) {
    return null;
  }

  return (
    <Select value={selectedCapabilityId} onValueChange={setSelectedCapabilityId}>
      <SelectTrigger size="sm" aria-label="Capacidad">
        <SelectValue placeholder="Capacidad" />
      </SelectTrigger>
      <SelectContent>
        {capabilities.map((capability) => (
          <SelectItem key={capability.id} value={capability.id}>
            {capability.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
