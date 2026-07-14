import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCapabilityDescriptor } from "@/lib/capability/capability-registry";
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
        {capabilities.map((capability) => {
          const Icon = getCapabilityDescriptor(capability.id)?.icon;
          return (
            <SelectItem key={capability.id} value={capability.id}>
              <span className="flex items-center gap-2">
                {Icon && <Icon className="size-4" />}
                {capability.name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
