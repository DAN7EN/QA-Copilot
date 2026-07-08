import { afterEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./httpClient";

describe("httpClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("realiza un GET contra la URL base configurada y devuelve el JSON parseado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await httpClient.get("/health");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/health"),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    expect(result).toEqual({ status: "ok" });
  });

  it("lanza un error cuando la respuesta no es exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error" }),
    );

    await expect(httpClient.get("/health")).rejects.toThrow();
  });

  it("realiza un POST sin body sin forzar el header Content-Type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "conv-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await httpClient.post("/conversations");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/conversations"),
      expect.objectContaining({ method: "POST", headers: {}, body: undefined }),
    );
  });

  it("realiza un POST con body serializado en JSON e incluye Content-Type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await httpClient.post("/conversations/conv-1/messages", { content: "hola" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/conversations/conv-1/messages"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "hola" }),
      }),
    );
  });
});
