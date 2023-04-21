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
    `User-Agent: MailClientApp/1789 CFNetwork/1325.0.1 Darwin/21.1.0\r\n` +
    `cloudAccessToken: 823386BFF1EF189DBD1A19ED02F681D2\r\n` +
    `Proxy-Connection: keep-alive\r\n\r\n`

  $tunnel.write($session, header)
}

function _writeHttpsHeader() {
  const conHost = $session.conHost
  const conPort = $session.conPort
  const conUrl = $session.conUrl

  const header =
    `GET http://${conHost}/${conUrl} HTTP/1.1\r\n` +
    `Host: gz189cloud2.oos-gz.ctyunapi.cn\r\n` +
    `cloudAccessToken: 823386BFF1EF189DBD1A19ED02F681D2\r\n` +
    `User-Agent: MailClientApp/1789 CFNetwork/1325.0.1 Darwin/21.1.0\r\n` +
    `Connection: keep-alive\r\n\r\n`
  tlsClient.write(header)
}