```javascript
// HTTP请求状态
const HTTP_STATUS = {
  INVALID: -1,
  CONNECTED: 0,
  WAITRESPONSE: 1,
  FORWARDING: 2,
  CONNECTING_TLS: 3,
  CONNECTED_TLS: 4
}

let httpStatus = HTTP_STATUS.INVALID
let tlsClient = null

function tunnelDidConnected() {
  console.log($session)

  if ($session.proxy.isTLS) {
    // HTTPS
    httpStatus = HTTP_STATUS.CONNECTING_TLS
    tlsClient = $tls.createClient({ host: $session.sni })
    tlsClient.connect()
  } else {
    // HTTP
    _writeHttpHeader()
    httpStatus = HTTP_STATUS.CONNECTED
  }

  return true
}

function tunnelTLSFinished() {
  _writeHttpHeader()
  httpStatus = HTTP_STATUS.CONNECTED
  return true
}

function tunnelDidRead(data) {
  switch (httpStatus) {
    case HTTP_STATUS.WAITRESPONSE:
      // Check HTTP response code == 200 (or other codes)
      // Assume success here
      console.log("HTTP handshake success")
      httpStatus = HTTP_STATUS.FORWARDING
      $tunnel.established($session)
      return null // Do not forward data to client
    case HTTP_STATUS.FORWARDING:
      return data
    default:
      return null
  }
}

function tunnelDidWrite() {
  switch (httpStatus) {
    case HTTP_STATUS.CONNECTED:
      console.log("Write HTTP CONNECT header success")
      httpStatus = HTTP_STATUS.WAITRESPONSE
      $tunnel.readTo($session, "\x0D\x0A\x0D\x0A") // Read remote data until "\r\n\r\n"
      return false // Interrupt write callback
    case HTTP_STATUS.CONNECTED_TLS:
      _writeHttpsHeader() // TLS握手结束后发送HTTP请求头
      httpStatus = HTTP_STATUS.CONNECTED
      return true
    default:
      return true
  }
}

function tunnelDidClose() {
  return true
}

// Helpers
function _writeHttpHeader() {
  const conHost = $session.conHost
  const conPort = $session.conPort

  const header =
    `CONNECT ${conHost}:${conPort} HTTP/1.1\r\n` +
    `Host:${conHost}\r\n` +
    `Connection: keep-alive\r\n` +
    `User-Agent: Cloud5G/3.7.0 (iPhone: ios 15.1: Scale/3.00) baiduboxapp\r\n` +
    `X-T5-Auth: 1962898709\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`

  $tunnel.write($session, header)
}

function _writeHttpsHeader() {
  const header =
    `GET / HTTP/1.1\r\n` +
    `Host: ${$session.sni}\r\n` +
    `Connection: keep-alive\r\n\r\n`
  tlsClient.write(header)
}
```