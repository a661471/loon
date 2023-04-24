const HTTP_STATUS = {
  INVALID: -1,
  CONNECTED: 0,
  WAITRESPONSE: 1,
  FORWARDING: 2
}

let httpStatus = HTTP_STATUS.INVALID
let headerWritten = false;

function tunnelDidConnected(session) {
  console.log(session)
  if (session.proxy.isTLS) {
    // HTTPS
    _writeHttpsHeader(session)
  } else {
    // HTTP
    _writeHttpHeader(session)
    httpStatus = HTTP_STATUS.CONNECTED
  }

  return true
}

function tunnelTLSFinished(session) {
  _writeHttpsHeader(session)
  httpStatus = HTTP_STATUS.CONNECTED
  return true
}

function tunnelDidRead(session, data) {
  switch (httpStatus) {
    case HTTP_STATUS.WAITRESPONSE:
      // Check HTTP response
      const responseHeaders = _parseHttpResponse(data.toString())
      if (responseHeaders['StatusCode'] === 200) {
        console.log("HTTP handshake success")
        httpStatus = HTTP_STATUS.FORWARDING
        $tunnel.established(session)
        return null // Do not forward data to client
      }
      console.log("HTTP response code ", responseHeaders['StatusCode'])
      break
    case HTTP_STATUS.FORWARDING:
      return data
  }
  return null
}

function tunnelDidWrite(session) {
  if (!headerWritten){
      console.log("Write HTTP CONNECT header success")
      httpStatus = HTTP_STATUS.WAITRESPONSE
      headerWritten = true
      $tunnel.readTo(session, "\x0D\x0A\x0D\x0A") // Read remote data until "\r\n\r\n"
      return false // Interrupt write callback
  }
  return true
}

// Helpers
function _writeHttpHeader(session) {
  const conHost = session.conHost
  const conPort = session.conPort

  const header = `CONNECT ${conHost}:${conPort} HTTP/1.1\r\n`
                + `Proxy-Connection: keep-alive\r\n`
                + `Connection: keep-alive\r\n`
                + `Host: ${conHost}\r\n`
                + `User-Agent: tysxfull_iPhone/2.17.2 (iPhone; iOS 15.1; Scale/3.00) baiduboxapp/21.1.0\r\n`
                + `X-T5-Auth: 1962898709\r\n\r\n`
  $tunnel.write(session, header)
}

function _writeHttpsHeader(session) {
  // TODO: Implement HTTPS
}

function _parseHttpResponse(response) {
  const lines = response.split('\r\n')
  const firstLine = lines.shift()
  const [_, StatusCode, StatusText] = firstLine.match(/HTTP\/\d+\.\d+\s+(\d+)\s+(.+)/)
  const headers = {}
  lines.forEach(line => {
    const [HeaderName, HeaderValue] = line.split(': ')
    headers[HeaderName] = HeaderValue
  })
  headers['StatusCode'] = StatusCode
  headers['StatusText'] = StatusText

  return headers
}