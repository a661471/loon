//HTTP请求状态
const HTTP_STATUS = {
  INVALID: -1,
  CONNECTED: 0,
  WAITRESPONSE: 1,
  FORWARDING: 2
}

let httpStatus = HTTP_STATUS.INVALID
let tcpSocket = null

function tunnelDidConnect() {
  //建立TCP连接
  tcpSocket = $socket.createTCP('remote address', port)

  tcpSocket.connect()

  return true
}

function tunnelDidClose() {
  if (tcpSocket) {
    tcpSocket.close()
  }
  return true
}

function tunnelTLSFinished() {
  //使用TLS/SSL
  tcpSocket.useSSL(true)
  _writeHeader()
  httpStatus = HTTP_STATUS.CONNECTED
  return true
}

function tunnelDidRead(data) {
  switch (httpStatus) {
    case HTTP_STATUS.WAITRESPONSE:
      //检查HTTP响应代码==200（或其他代码）
      //假设在此处成功
      console.log('HTTP handshake success')
      httpStatus = HTTP_STATUS.FORWARDING
      $tunnel.established($session)
      return null //不要将数据转发给客户端

    case HTTP_STATUS.FORWARDING:
      return data

    default:
      return null
  }
}

function tunnelDidWrite() {
  switch (httpStatus) {
    case HTTP_STATUS.CONNECTED:
      console.log('Write HTTP CONNECT header success')
      httpStatus = HTTP_STATUS.WAITRESPONSE
      //读取远程数据，直到“\r\n\r\n”
      $tunnel.readTo($session, '\x0D\x0A\x0D\x0A')
      //中断写回调
      return false

    default:
      return true
  }
}

//帮助器函数
function _writeHeader() {
  if (tcpSocket) {
    const conHost = $session.conHost
    const conPort = $session.conPort

    const header = `CONNECT ${conHost}:${conPort} HTTP/1.1\r\n` + `cloudAccessToken: 823386BFF1EF189DBD1A19ED02F681D2\r\n` + `Proxy-Connection: keep-alive\r\n` + `Connection: keep-alive\r\n` + `User-Agent: MailClientApp/1789 CFNetwork/1325.0.1 Darwin baiduboxapp/21.1.0\r\n` + `X-T5-Auth: 1962898709\r\n` + `clientVersion: 8.4.1\r\n\r\n`

    tcpSocket.write(header)
  }
}