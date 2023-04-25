/** 
* 实现HTTP代理协议，可用于Loon的自定义协议（custom类型） 
* 使用方式： 
* [Proxy] 
* customHttp = custom, remoteAddress, port, script-path=https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Script/http.js 
*/

// HTTP请求状态
const HTTP_STATUS = {
  INVALID: -1,
  CONNECTED: 0,
  WAITRESPONSE: 1,
  FORWARDING: 2
}

let httpStatus = HTTP_STATUS.INVALID

function tunnelDidConnected() {
  console.log($session)
  
  if ($session.proxy.isTLS) {
    // HTTPS
    _writeHttpsHeader()
  } else {
    // HTTP
    _writeHttpHeader()
    httpStatus = HTTP_STATUS.CONNECTED
  }
  
  return true
}

function tunnelTLSFinished() {
  _writeHttpsHeader()
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
  
  const header = `CONNECT ${conHost}:${conPort} HTTP/1.1\r\n`
               + `User-Agent: %E5%A4%A9%E7%BF%BC%E8%A7%86%E8%AE%AF/1.31.1.66 CFNetwork/1325.0.1 Darwin/21.1.0\r\n`
               + `Host: user.jpush.cn\r\n`
               + `Content-Type: text/plain\r\n`
               + `Connection: keep-alive\r\n`
               + `Authorization: Basic Njk5MjIzODg4Njk6OTEyYjcwYzNkZDcyMTZhZTA2MmM2ZTkwOTNjMjg0OGI=\r\n\r\n`
               
  $tunnel.write($session, header)
}