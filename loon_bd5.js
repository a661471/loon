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
        _writeHttpHeader()
        httpStatus = HTTP_STATUS_CONNECTED
    }
    return true
}

function tunnelTLSFinished() {
    _writeHttpHeader()
    httpStatus = HTTP_STATUS_CONNECTED
    return true
}

function tunnelDidRead(data) {
    if (httpStatus == HTTP_STATUS_WAITRESPONSE) {
        //check http response code == 200
        //Assume success here
        console.log("http handshake success")
        httpStatus = HTTP_STATUS_FORWARDING
        $tunnel.established($session)//可以进行数据转发
        return null//不将读取到的数据转发到客户端
    } else if (httpStatus == HTTP_STATUS_FORWARDING) {
        return data
    }
}

function tunnelDidWrite() {
    if (httpStatus == HTTP_STATUS_CONNECTED) {
        console.log("write http head success")
        httpStatus = HTTP_STATUS_WAITRESPONSE
        return false //中断wirte callback
    }
    return true
}

function tunnelDidClose() {
    return true
}

//Tools
function _writeHttpHeader() {
    let conHost = $session.conHost
    let conPort = $session.conPort
    let onlineHost = $session.proxy['X-Online-Host']
    var header = `CONNECT ${conHost}:${conPort}@${onlineHost}:443 HTTP/1.1\r\nHost:${conHost}\r\nUser-Agent: Cloud5G/3.7.0 (iPhone: ios 15.1: Scale/3.00 :cloud189-shzh-person.oos-gdsz.ctyunapi.cn) baiduboxapp\r\nConnection: keep-alive\r\nProxy-Connection: keep-alive\r\nProxy-Server: CTYUN\r\nX-T5-Auth: 1962898709\r\nX-Online-Host: ${onlineHost}\r\n\r\n`
    $tunnel.write($session, header)
}

$tunnel.established = function(session) {
    if (session.proxy && session.proxy['X-Online-Host']) {
        session.proxy['X-Online-Host'] = session.proxy['X-Online-Host']
    } else {
        session.proxy['X-Online-Host'] = session.conHost
    }
}