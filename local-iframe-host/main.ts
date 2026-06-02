/// <reference types="vite/client" />

import { createPortalBridge } from "../dev-wrapper/portalBridge";
import type { MockWallet, SignResult } from "../dev-wrapper/mockWallet";

type Theme = "light" | "dark";

interface PortalApiResponse {
  portalUrl?: string;
  iframeUrl?: string;
  token: string;
}

const env = import.meta.env;

const API_URL = env.VITE_PORTAL_API as string | undefined;
const API_KEY = env.VITE_PORTAL_API_KEY as string | undefined;
const EXTENSION_ID = (env.VITE_PORTAL_EXTENSION_ID as string | undefined) ?? "";
const DEFAULT_WALLET = (env.VITE_PORTAL_WALLET as string | undefined) ?? "";
const LOCAL_PORTAL_URL = (env.VITE_PORTAL_LOCAL_URL as string | undefined) ?? "";
const THEME = ((env.VITE_PORTAL_THEME as string | undefined) || undefined) as
  | Theme
  | undefined;

const iframe = document.getElementById("portal") as HTMLIFrameElement | null;
const statusEl = document.getElementById(
  "status",
) as HTMLParagraphElement | null;
const connectBtn = document.getElementById(
  "connect",
) as HTMLButtonElement | null;
const disconnectBtn = document.getElementById(
  "disconnect",
) as HTMLButtonElement | null;
const walletAddressEl = document.getElementById(
  "walletAddress",
) as HTMLElement | null;

if (
  !iframe ||
  !statusEl ||
  !connectBtn ||
  !disconnectBtn ||
  !walletAddressEl
) {
  throw new Error("Local iframe host HTML is missing required elements.");
}

const portalIframe = iframe;
const status = statusEl;
const connectButton = connectBtn;
const disconnectButton = disconnectBtn;
const walletAddressText = walletAddressEl;

let isFirstLoad = true;

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const encodeBase58 = (bytes: Uint8Array) => {
  const digits = [0];

  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let encoded = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded += BASE58_ALPHABET[0];
  }

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    encoded += BASE58_ALPHABET[digits[i]];
  }

  return encoded;
};

const randomBase58Bytes = (byteLength: number) => {
  return encodeBase58(crypto.getRandomValues(new Uint8Array(byteLength)));
};

const createBase58MockWallet = (preferredAddress?: string): MockWallet => {
  let address: string | null = null;

  return {
    getAddress: () => address,

    async connect(override?: string) {
      address = override || preferredAddress || randomBase58Bytes(32);
      return address;
    },

    async signMessage(message: string): Promise<SignResult> {
      if (!address) throw new Error("Wallet not connected");
      return {
        signature: randomBase58Bytes(64),
        key: address,
        message,
      };
    },

    async disconnect() {
      address = null;
    },
  };
};

const setStatus = (message: string, isError = false) => {
  status.textContent = message;
  status.classList.toggle("error", isError);
};

async function bootstrap(
  walletAddress: string | null,
): Promise<PortalApiResponse> {
  if (!API_URL || !API_KEY) {
    throw new Error(
      "Missing VITE_PORTAL_API or VITE_PORTAL_API_KEY in local-iframe-host/.env.local",
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      extensionId: EXTENSION_ID || undefined,
      walletAddress,
      theme: THEME,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Bootstrap failed: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as PortalApiResponse;
  if (!data.portalUrl || !data.token) {
    throw new Error("Bootstrap response is missing portalUrl or token.");
  }

  return data;
}

function buildIframeSrc(returnedUrl: string, token: string): string {
  const base = (() => {
    if (!LOCAL_PORTAL_URL) return returnedUrl;

    try {
      const remote = new URL(returnedUrl);
      const local = new URL(LOCAL_PORTAL_URL);
      local.search = remote.search;
      local.pathname = remote.pathname === "/" ? local.pathname : remote.pathname;
      return local.toString();
    } catch {
      return returnedUrl;
    }
  })();

  try {
    const url = new URL(base);
    if (!url.searchParams.get("token")) url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return base;
  }
}

async function syncSession(
  walletAddress: string | null,
): Promise<string | null> {
  const data = await bootstrap(walletAddress);

  if (isFirstLoad) {
    portalIframe.src = buildIframeSrc(data.portalUrl!, data.token);
    isFirstLoad = false;
    setStatus(
      walletAddress
        ? `Loaded local portal for ${walletAddress}`
        : "Loaded local portal without wallet.",
    );
    return data.token;
  }

  const targetOrigin = new URL(portalIframe.src).origin;
  portalIframe.contentWindow?.postMessage(
    { to: "bringweb3", action: "SESSION_UPDATE", token: data.token },
    targetOrigin,
  );
  setStatus(
    walletAddress
      ? `Session synced for ${walletAddress}`
      : "Session synced without wallet.",
  );
  return data.token;
}

const wallet = createBase58MockWallet(DEFAULT_WALLET);

const bridge = createPortalBridge({
  iframe: portalIframe,
  wallet,
  refreshToken: syncSession,
  onAddressChange: (address) => {
    walletAddressText.textContent = address || "Not connected";
    setStatus(
      address
        ? `Mock wallet connected: ${address}`
        : "Mock wallet disconnected.",
    );
  },
});

connectButton.addEventListener("click", () => {
  void bridge.connect(DEFAULT_WALLET || undefined);
});

disconnectButton.addEventListener("click", () => {
  void bridge.disconnect();
});

syncSession(null).catch((error: unknown) => {
  setStatus((error as Error).message, true);
});
