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
  
  const header = `CONNECT ${conHost} @http://gz189cloud2.oos-gz.ctyunapi.cn/92ff4c61-ff2a-4104-82dd-5b5593ebcae1?response-content-disposition=attachment%3Bfilename%3D%22readme.txt%22&x-amz-CLIENTNETWORK=UNKNOWN&x-amz-CLOUDTYPEIN=PERSON&x-amz-CLIENTTYPEIN=UNKNOWN&Signature=f%2B1yHxmpBMz8/h9Ih8dpsetgzEE%3D&AWSAccessKeyId=6667aad7f6576995b9ae&x-amz-userLevel=0&Expires=1691290498&x-amz-limitrate=10240&x-amz-FSIZE=770&x-amz-UID=350658027&x-amz-UFID=215081624106378 HTTP/1.1\r\n`
               + `Server: CTYUN\r\n`
               + `Proxy-Connection: keep-alive\r\n`
               + `Connection: keep-alive\r\n`
               + `User-Agent: Cloud189/8 CFNetwork/1325.0.1 Darwin/21.1.0 baiduboxapp/21.1.0\r\n`
               + `X-T5-Auth: 1962898709\r\n\r\n`
               
  $tunnel.write($session, header)
}