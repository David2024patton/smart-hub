(function() {
  var id = Math.random().toString(36).slice(2)
  var parent = window.parent

  function send(type, data) {
    parent.postMessage({ type: '__br__', id: id, sub: type, data: data, time: Date.now() }, '*')
  }

  // Console capture
  ;['log','warn','error','info','debug'].forEach(function(lvl) {
    var orig = console[lvl]
    console[lvl] = function() {
      var args = Array.prototype.map.call(arguments, function(a) {
        try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a) } catch(e) { return String(a) }
      })
      send('console', { level: lvl, args: args })
      return orig.apply(console, arguments)
    }
  })

  // Error capture
  window.onerror = function(msg, url, line, col, error) {
    send('error', { message: String(msg), url: url, line: line, col: col, stack: error ? error.stack : '' })
  }
  window.addEventListener('unhandledrejection', function(e) {
    send('error', { message: String(e.reason), stack: e.reason ? e.reason.stack : '' })
  })

  // Fetch capture
  var origFetch = window.fetch
  window.fetch = function(input, init) {
    var start = performance.now()
    var url = typeof input === 'string' ? input : input.url
    return origFetch.apply(this, arguments).then(function(response) {
      var cloned = response.clone()
      send('network', { url: url, method: init ? init.method || 'GET' : 'GET', status: response.status, statusText: response.statusText, duration: Math.round(performance.now() - start) })
      return response
    }).catch(function(err) {
      send('network', { url: url, method: init ? init.method || 'GET' : 'GET', status: 0, statusText: err.message, duration: Math.round(performance.now() - start) })
      throw err
    })
  }

  // XHR capture
  var xhrOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function(method, url) {
    this.__br_url = typeof url === 'string' ? url : String(url)
    this.__br_method = method
    return xhrOpen.apply(this, arguments)
  }
  var xhrSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function(body) {
    var start = performance.now()
    var xhr = this
    xhr.addEventListener('load', function() {
      send('network', { url: xhr.__br_url, method: xhr.__br_method, status: xhr.status, statusText: xhr.statusText, duration: Math.round(performance.now() - start) })
    })
    xhr.addEventListener('error', function() {
      send('network', { url: xhr.__br_url, method: xhr.__br_method, status: 0, statusText: 'Network error', duration: Math.round(performance.now() - start) })
    })
    return xhrSend.apply(this, arguments)
  }

  send('ready', { agent: navigator.userAgent })
})()
