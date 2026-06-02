# MV3 contained portal demo

Ten przykład pokazuje portal jako lokalny kod w Chrome extension. Popup ma szerokość `360px` i ładuje:

```txt
chrome-extension://<id>/portal/index.html?token=...
```

Nie ma zewnętrznego `<script src="https://...">`; bundle React portalu jest budowany do folderu `portal/` i pakowany razem z extension.

## 1. Konfiguracja token bootstrap

Uzupełnij:

```txt
extension-mv3-contained/config.js
```

Minimalnie:

```js
export const BRING_PARTNER_API_KEY = '...'
```

To jest tylko demo. Produkcyjnie nie trzymaj sekretów w extension; użyj backend proxy albo klucza/origina uzgodnionego z Bring.

## 2. Build portalu do extension

Z roota repo:

```bash
yarn build:extension-portal
```

To zbuduje portal do:

```txt
extension-mv3-contained/portal/
```

Build używa `.env.extension`. Obecny wariant dev ustawia:

```env
VITE_API_URL=http://localhost:5173/bring-api/v1/
VITE_API_KEY=local-proxy
```

Dlatego podczas testu merchant/cache działa przez lokalny Vite proxy z rootowego `vite.config.ts`. Uruchom też:

```bash
yarn dev:local-portal
```

Dla produkcji ustaw `VITE_API_URL` na własny backend proxy albo endpoint allowlistowany przez Bring dla extension.

## 3. Load unpacked

1. Otwórz `chrome://extensions`.
2. Włącz Developer mode.
3. Kliknij Load unpacked.
4. Wskaż folder:

```txt
extension-mv3-contained
```

## 4. Co jest lokalne

Lokalne w extension:

- `popup.html`, `popup.js`, `popup.css`
- `portal/index.html`
- `portal/assets/*.js`
- `portal/assets/*.css`

Zewnętrzne są tylko requesty danych:

- bootstrap tokenu,
- merchanty,
- rewards/cache,
- media assety.

## 5. Produkcyjna uwaga

Chrome MV3 nie pozwala wykonywać zdalnego kodu JS jako kodu extension. Ten przykład jest zgodny z tym kierunkiem, bo JS portalu jest bundled lokalnie.

API `platforms/*` może odrzucać requesty z originu `chrome-extension://...`, jeśli Bring nie allowlistuje extension. Wtedy użyj:

```txt
extension -> Twój backend proxy -> Bring API
```
