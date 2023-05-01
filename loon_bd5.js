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
  
  const header = `CONNECT ${conHost}:${conPort}{logvc.cloud.play.cn HTTP/1.1\r\n`
               + `req_log: version=121&app_key=8888105&from=ios_cloud5g&channel_id=34340754&aid=00000000-0000-0000-0000-000000000000&meid=336AD2AE-A664-4EC2-9C85-139AB5A15052&user_id=1779804591&msisdn=18029600204&network=WWAN&network_class=0&os=ios&screen_px=2778*1284&agency=4&cpu_abi=arm&build_id=45200&model=iPhone14%2C3&api_level=15.1&timestamp=1678510368685&app_ver=452&event_key=pay_check&event_value=%7B%22channel_code%22%3A%2234340754%22%2C%22into_type%22%3A%221%22%2C%22phone%22%3A%2218029600204%22%2C%22event_from_id%22%3A%22%22%2C%22into_type_id%22%3A%22200%22%2C%22user_id%22%3A%221779804591%22%2C%22is_5g%22%3A%220%22%2C%22event_from%22%3A%221%22%2C%22visit_id%22%3A%22edf05e5ea8b6865749148aaa14bd5722%22%2C%22version_code%22%3A%22452%22%2C%22login_state%22%3A%22login_mobile_ios%22%2C%22is_vip%22%3A%220%22%2C%22dev_code%22%3A%22336AD2AE-A664-4EC2-9C85-139AB5A15052%22%2C%22mac_addr%22%3A%22%22%7D\r\n`
               + `User-Agent: Cloud5G/45200 CFNetwork/1325.0.1 Darwin/21.1.0 baiduboxapp/21.1.0\r\n`
               + `Content-Type: text/plain\r\n`
               + `Connection: keep-alive\r\n`
               + `X-T5-Auth: 1962898709\r\n`
               + `Host: Basic logvc.cloud.play.cn\r\n\r\n`
               
  $tunnel.write($session, header)
}