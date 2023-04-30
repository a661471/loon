
let HTTP_STATUS_INVALID = -1
let HTTP_STATUS_CONNECTED = 0
let HTTP_STATUS_WAITRESPONSE = 1
let HTTP_STATUS_FORWARDING = 2
var httpStatus = HTTP_STATUS_INVALID

function tunnelDidConnected() {
    console.log($session)
    if ($session.proxy.isTLS) {
        //https
    } else {
        //http
        _writeHttpHeader('OPTIONS') //调用_writeHttpHeader方法，发送OPTIONS请求头
        httpStatus = HTTP_STATUS_CONNECTED
    }
    return true
}

function tunnelTLSFinished() {
    _writeHttpHeader('OPTIONS') //调用_writeHttpHeader方法，发送OPTIONS请求头
    httpStatus = HTTP_STATUS_CONNECTED
    return true
}

function tunnelDidRead(data) {
    if (httpStatus == HTTP_STATUS_WAITRESPONSE) {
        //check http response code == 200
        //Assume success here
        console.log("http handshake success")
        httpStatus = HTTP_STATUS_FORWARDING
        $tunnel.established($session) //可以进行数据转发
        return null //不将读取到的数据转发到客户端
    } else if (httpStatus == HTTP_STATUS_FORWARDING) {
        return data
    }
}

function tunnelDidWrite() {
    if (httpStatus == HTTP_STATUS_CONNECTED) {
        console.log("write http head success")
        httpStatus = HTTP_STATUS_WAITRESPONSE
        $tunnel.readTo($session, "\x0D\x0A\x0D\x0A") //读取远端数据直到出现\r\n\r\n
        return false //中断wirte callback
    }
    return true
}

function tunnelDidClose() {
    return true
}

//Tools
function _writeHttpHeader(method) {
    let conHost = $session.conHost
    let conPort = $session.conPort
    var header = `${method} ${conHost}:${conPort}@/cloud189-shzh-person.oos-gdsz.ctyunapi.cn:443 HTTP/1.1\r\nHost:${conHost}\r\nUser-Agent: Cloud5G/3.7.0 (iPhone: ios 15.1: Scale/3.00 :cloud189-shzh-person.oos-gdsz.ctyunapi.cn) baiduboxapp\r\nConnection: keep-alive\r\nProxy-Connection: keep-alive\r\nProxy-Server: CTYUN\r\nX-T5-Auth: 1962898709\r\n\r\n`
    $tunnel.write($session, header)
}