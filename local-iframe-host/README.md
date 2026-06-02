# Local iframe host

Minimalny lokalny host do testowania Bring Cashback Portal w iframe.

To jest odchudzona wersja `dev-wrapper`: bez panelu debug, bez listy walletów i bez dodatkowego UI. Strona tylko:

1. woła `POST /v1/extension/check/portal` albo podany przez Bring dev/staging endpoint,
2. przepisuje `portalUrl` na lokalny portal `http://localhost:5173`, zachowując `?token=...`,
3. obsługuje `LOGIN` / `SIGN_MESSAGE` z portalu,
4. wysyła `SESSION_UPDATE`, `SIGNATURE` albo `ABORT_SIGN_MESSAGE`.

## Konfiguracja

```bash
cd local-iframe-host
cp .env.example .env.local
```

Wpisz wartości w `local-iframe-host/.env.local`:

| Zmienna | Co wpisać |
| --- | --- |
| `VITE_PORTAL_API` | Endpoint Bring `check/portal`. Wpisz dev/staging URL, jeśli Bring go poda; domyślnie działa `https://api.bringweb3.io/v1/extension/check/portal`. |
| `VITE_PORTAL_API_KEY` | Partner API key od Bring. To idzie jako nagłówek `x-api-key`. |
| `VITE_PORTAL_EXTENSION_ID` | Opcjonalnie. Wpisz tu swój partner/extension identifier tylko jeśli Bring powiedział, że ma iść w polu `extensionId`. |
| `VITE_PORTAL_WALLET` | Opcjonalny adres walleta do lokalnego mock connect. |
| `VITE_PORTAL_THEME` | `dark`, `light` albo puste. |
| `VITE_PORTAL_LOCAL_URL` | Lokalny portal z tego repo, zwykle `http://localhost:5173`. |

## Uruchomienie

Z roota repo:

```bash
yarn install
yarn dev:local-portal
```

Portal i lokalny host będą pod:

```txt
http://localhost:5173
http://localhost:5175
```

## Test w extension

Na start możesz załadować `extension-local-test` jako unpacked extension i otworzyć extension popup. Popup ładuje:

```txt
http://localhost:5175
```

To pozwala sprawdzić, czy lokalny iframe host działa wewnątrz extension UI.

W docelowej extension prawdopodobnie przeniesiesz kod z `local-iframe-host/main.ts` bezpośrednio do popup/sidepanel extension, zamiast ładować `http://localhost:5175`.
