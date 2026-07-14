import { describe, expect, it } from "vitest";
import { GherkinRightPanel } from "@/components/gherkin/GherkinRightPanel";
import { getCapabilityDescriptor, listCapabilityDescriptors } from "./capability-registry";

describe("capability-registry", () => {
  it("registra un descriptor para chat sin RightPanel propio", () => {
    const descriptor = getCapabilityDescriptor("chat");

    expect(descriptor).toBeDefined();
    expect(descriptor?.RightPanel).toBeUndefined();
  });

  it("registra un descriptor para gherkin con su RightPanel", () => {
    const descriptor = getCapabilityDescriptor("gherkin");

    expect(descriptor).toBeDefined();
    expect(descriptor?.RightPanel).toBe(GherkinRightPanel);
  });

  it("devuelve undefined para una capacidad no registrada", () => {
    expect(getCapabilityDescriptor("no-existe")).toBeUndefined();
  });

  it("lista todos los descriptores registrados", () => {
    const ids = listCapabilityDescriptors().map((descriptor) => descriptor.id);

    expect(ids).toEqual(["chat", "gherkin"]);
  });
});
