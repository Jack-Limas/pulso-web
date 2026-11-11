import { describe, expect, it } from "vitest";
import { toSocketUrl } from "./realtime-provider";

describe("toSocketUrl", () => {
  it.each([
    ["https://api.example.com/ws", "wss://api.example.com/ws"],
    ["http://localhost:8080/ws", "ws://localhost:8080/ws"],
    ["wss://api.example.com/ws", "wss://api.example.com/ws"],
  ])("turns %s into %s", (input, expected) => {
    expect(toSocketUrl(input)).toBe(expected);
  });
});
