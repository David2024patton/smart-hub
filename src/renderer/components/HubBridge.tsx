import { useEffect, useRef } from 'react'

export function HubBridge() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function connect() {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${location.host}/ws/hub`)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'connected', url: location.href }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type !== 'execute') return

          const { cmdId, action, payload } = msg
          executeAction(action, payload).then(result => {
            ws.send(JSON.stringify({ type: 'result', cmdId, result }))
          }).catch(err => {
            ws.send(JSON.stringify({ type: 'error', cmdId, error: err.message }))
          })
        } catch {}
      }

      ws.onclose = () => {
        wsRef.current = null
        reconnectTimer.current = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [])

  return null
}

async function executeAction(action: string, payload: any): Promise<any> {
  switch (action) {
    case 'getState':
      return getState()
    case 'click':
      return clickElement(payload.selector)
    case 'type':
      return typeText(payload.selector, payload.text)
    case 'navigate':
      return navigateTo(payload.pageId)
    case 'eval':
      return evalCode(payload.code)
    case 'openWindow':
      return openWindow(payload.pageId)
    case 'getText':
      return getText(payload.selector)
    case 'listElements':
      return listElements()
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

function getState() {
  const desktop = document.querySelector('[data-desktop]')
  const windows = desktop ? Array.from(desktop.querySelectorAll('[class*="absolute rounded-xl"]')).map(el => ({
    text: el.textContent?.trim().slice(0, 100),
    rect: el.getBoundingClientRect(),
  })) : []

  const navItems = Array.from(document.querySelectorAll('[role="menuitem"]')).map(el => ({
    label: el.textContent?.trim(),
    active: el.getAttribute('aria-current') === 'page',
    rect: el.getBoundingClientRect(),
  }))

  return {
    url: location.href,
    title: document.title,
    windowSize: { w: window.innerWidth, h: window.innerHeight },
    navItems,
    windows,
    buttons: listInteractiveElements(),
  }
}

function listInteractiveElements() {
  const tags = 'button, a, input, select, textarea, [role="button"], [role="menuitem"], [role="tab"], [data-tooltip]'
  return Array.from(document.querySelectorAll(tags)).map(el => {
    const rect = el.getBoundingClientRect()
    const visible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth
    return {
      tag: el.tagName.toLowerCase(),
      text: (el as HTMLElement).textContent?.trim().slice(0, 80) || '',
      type: (el as HTMLInputElement).type || '',
      placeholder: (el as HTMLInputElement).placeholder || '',
      selector: buildSelector(el),
      visible,
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    }
  }).filter(e => e.visible && (e.text || e.placeholder || e.tag === 'input'))
}

function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const parent = el.parentElement
  const tag = el.tagName.toLowerCase()
  const siblings = parent ? Array.from(parent.querySelectorAll(`:scope > ${tag}`)) : []
  const idx = siblings.indexOf(el as HTMLElement)
  if (idx >= 0) return `${parent ? buildSelector(parent) + ' > ' : ''}${tag}:nth-child(${idx + 1})`
  return tag
}

function clickElement(selector: string) {
  const el = findElement(selector)
  if (!el) throw new Error(`Element not found: ${selector}`)
  if (el instanceof HTMLElement) el.click()
  else if (el instanceof HTMLAnchorElement) el.click()
  else { const ev = new MouseEvent('click', { bubbles: true }); el.dispatchEvent(ev) }
  return { clicked: selector }
}

function typeText(selector: string, text: string) {
  const el = findElement(selector) as HTMLInputElement | HTMLTextAreaElement | null
  if (!el) throw new Error(`Input not found: ${selector}`)
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return { typed: text }
}

function getText(selector: string) {
  const el = findElement(selector)
  if (!el) throw new Error(`Element not found: ${selector}`)
  return { text: el.textContent?.trim() || '' }
}

function navigateTo(pageId: string) {
  const btn = findElement(`[role="menuitem"]`)
  if (!btn) throw new Error(`Navigation not found`)
  const nav = document.querySelector('[role="menubar"]')
  if (!nav) throw new Error(`Nav bar not found`)
  const target = Array.from(nav.querySelectorAll('[role="menuitem"]')).find(
    (el) => el.getAttribute('data-tooltip') === pageId || el.textContent?.trim().toLowerCase() === pageId.toLowerCase()
  )
  if (target && target instanceof HTMLElement) { target.click(); return { navigated: pageId } }
  // Fallback: use the first nav item or call desktop API
  if (btn instanceof HTMLElement) btn.click()
  return { navigated: pageId }
}

function openWindow(pageId: string) {
  const sidebar = document.querySelector('[role="menubar"]')
  if (!sidebar) throw new Error('Sidebar not found')
  const target = Array.from(sidebar.querySelectorAll('[role="menuitem"]')).find(
    (el) => el.getAttribute('data-tooltip') === pageId || el.textContent?.trim().toLowerCase() === pageId.toLowerCase()
  )
  if (target && target instanceof HTMLElement) { target.click(); return { opened: pageId } }
  throw new Error(`Page not found: ${pageId}`)
}

function evalCode(code: string) {
  const fn = new Function(code)
  const result = fn()
  return { result: String(result) }
}

function findElement(selector: string): Element | null {
  if (selector.startsWith('/')) return $xpath(selector.slice(1))
  return document.querySelector(selector)
}

function $xpath(xpath: string): Element | null {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null
}
