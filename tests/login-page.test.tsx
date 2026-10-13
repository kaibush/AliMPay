import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/login", pretendToBeVisual: true });
const globals = globalThis as typeof globalThis & Record<string, unknown>;
globals.window = dom.window as unknown as Window & typeof globalThis;
globals.document = dom.window.document;
globals.navigator = dom.window.navigator;
globals.HTMLElement = dom.window.HTMLElement;
globals.Node = dom.window.Node;
globals.Element = dom.window.Element;
globals.SVGElement = dom.window.SVGElement;
globals.DocumentFragment = dom.window.DocumentFragment;
globals.MutationObserver = dom.window.MutationObserver;
globals.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globals.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16) as unknown as number;
globals.cancelAnimationFrame = (id: number) => clearTimeout(id);
globals.IS_REACT_ACT_ENVIRONMENT = true;

const { act, cleanup, fireEvent, render, screen } = await import("@testing-library/react");
const { StrictMode } = await import("react");
const { MemoryRouter } = await import("react-router-dom");
const { SWRConfig, mutate } = await import("swr");
const { App } = await import("../src/web/app");

const realFetch = globalThis.fetch;

afterEach(async () => {
  cleanup();
  globalThis.fetch = realFetch;
  await mutate(() => true, undefined, { revalidate: false });
});

describe("admin login", () => {
  it("stays in the dashboard when an older unauthorized session response arrives after login", async () => {
    let releaseUnauthorized: (() => void) | undefined;
    const unauthorized = new Promise<void>((resolve) => {
      releaseUnauthorized = resolve;
    });
    let loggedIn = false;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
      if (url.endsWith("/admin-api/setup/status")) return json({ setup_completed: true });
      if (url.endsWith("/admin-api/login") && method === "POST") {
        loggedIn = true;
        return json({ ok: true, username: "admin" });
      }
      if (url.endsWith("/admin-api/me")) {
        if (!loggedIn) {
          await unauthorized;
          return json({ error: "AUTH_REQUIRED", message: "请先登录" }, 401);
        }
        return json({ user: { id: "1", username: "admin" }, csrf: true });
      }
      if (url.endsWith("/admin-api/dashboard")) {
        return json({
          today_order_count: 0,
          today_paid_count: 0,
          today_paid_cents: 0,
          pending_count: 0,
          late_paid_count: 0,
          active_monitors: 0,
          notify_failed_count: 0,
          last_scan: null,
          recent_orders: [],
          configured: true,
          collection_mode: "business_qr",
        });
      }
      return json({ message: url }, 404);
    }) as typeof fetch;

    render(
      <StrictMode>
        <SWRConfig value={{ revalidateOnFocus: true, dedupingInterval: 1_000 }}>
          <MemoryRouter initialEntries={["/login"]}>
            <App />
          </MemoryRouter>
        </SWRConfig>
      </StrictMode>,
    );

    fireEvent.change(await screen.findByLabelText("用户名"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret-password" } });
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /登录/ }).closest("form")!);
      await new Promise((resolve) => setTimeout(resolve, 50));
      releaseUnauthorized?.();
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(document.body.textContent ?? "").toContain("仪表盘");
    expect(document.body.textContent ?? "").not.toContain("管理员登录");
  });
});
