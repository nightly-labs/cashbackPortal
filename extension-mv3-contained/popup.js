import {
  BRING_CHECK_PORTAL_URL,
  BRING_PARTNER_API_KEY,
  EXTENSION_ID,
  THEME,
} from './config.js'

const PORTAL_TAG = 'bringweb3'
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const iframe = document.getElementById('portal')
const statusEl = document.getElementById('status')
const walletButton = document.getElementById('walletButton')
const walletAddressEl = document.getElementById('walletAddress')

let walletAddress = null
let isFirstLoad = true

function setStatus(message, isError = false) {
  statusEl.textContent = message
  statusEl.classList.toggle('error', isError)
}

function encodeBase58(bytes) {
  const digits = [0]

  for (const byte of bytes) {
    let carry = byte
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] << 8
      digits[i] = carry % 58
      carry = Math.floor(carry / 58)
    }

    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }

  let encoded = ''
  for (const byte of bytes) {
    if (byte !== 0) break
    encoded += BASE58_ALPHABET[0]
  }

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    encoded += BASE58_ALPHABET[digits[i]]
  }

  return encoded
}

function randomBase58(byteLength) {
  return encodeBase58(crypto.getRandomValues(new Uint8Array(byteLength)))
}

function updateWalletUi(address) {
  walletAddressEl.textContent = address || 'Not connected'
  walletButton.textContent = address ? 'Disconnect' : 'Connect'
}

async function bootstrap(address) {
  if (!BRING_PARTNER_API_KEY || BRING_PARTNER_API_KEY.includes('replace-with')) {
    throw new Error('Set BRING_PARTNER_API_KEY in extension-mv3-contained/config.js')
  }

  const response = await fetch(BRING_CHECK_PORTAL_URL, {
    method: 'POST',
    headers: {
      'x-api-key': BRING_PARTNER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      extensionId: EXTENSION_ID || undefined,
      walletAddress: address,
      theme: THEME,
    }),
  })

  if (!response.ok) {
    throw new Error(`Bootstrap failed: HTTP ${response.status}`)
  }

  const data = await response.json()
  if (!data.token) {
    throw new Error('Bootstrap response is missing token')
  }

  return data.token
}

function localPortalUrl(token) {
  return chrome.runtime.getURL(`portal/index.html?token=${encodeURIComponent(token)}`)
}

async function syncSession(address) {
  const token = await bootstrap(address)

  if (isFirstLoad) {
    iframe.src = localPortalUrl(token)
    isFirstLoad = false
    setStatus(address ? 'Loaded with wallet' : 'Loaded without wallet')
    return token
  }

  iframe.contentWindow?.postMessage(
    { to: PORTAL_TAG, action: 'SESSION_UPDATE', token },
    new URL(iframe.src).origin,
  )
  setStatus(address ? 'Session synced' : 'Disconnected')
  return token
}

async function connectWallet() {
  walletAddress = randomBase58(32)
  updateWalletUi(walletAddress)
  await syncSession(walletAddress)
}

async function disconnectWallet() {
  walletAddress = null
  updateWalletUi(null)
  await syncSession(null)
}

async function signMessage(message) {
  if (!walletAddress) throw new Error('Wallet not connected')
  return {
    signature: randomBase58(64),
    key: walletAddress,
    message,
  }
}

function postToPortal(payload) {
  iframe.contentWindow?.postMessage(
    { ...payload, to: PORTAL_TAG },
    new URL(iframe.src).origin,
  )
}

window.addEventListener('message', async (event) => {
  const data = event.data
  if (!data || data.from !== PORTAL_TAG || !data.action) return

  if (data.action === 'LOGIN') {
    try {
      await connectWallet()
    } catch (error) {
      setStatus(error.message, true)
    }
  }

  if (data.action === 'SIGN_MESSAGE') {
    try {
      postToPortal({
        action: 'SIGNATURE',
        ...(await signMessage(String(data.messageToSign || ''))),
      })
    } catch {
      postToPortal({ action: 'ABORT_SIGN_MESSAGE' })
    }
  }
})

walletButton.addEventListener('click', () => {
  void (walletAddress ? disconnectWallet() : connectWallet()).catch((error) => {
    setStatus(error.message, true)
  })
})

updateWalletUi(null)
syncSession(null).catch((error) => {
  setStatus(error.message, true)
})
