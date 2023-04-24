let HTTP_STATUS_INVALID = -1
let HTTP_STATUS_FORWARDING = 2
var httpStatus = HTTP_STATUS_INVALID

function tunnelDidConnected() {
    console.log($session)
    if ($session.proxy.isTLS) {
        //https
    } else {
        //http
        _writeHttpHeader()
        httpStatus = HTTP_STATUS_FORWARDING
    }
    return true
}

function tunnelTLSFinished() {
    _writeHttpHeader()
    httpStatus = HTTP_STATUS_FORWARDING
    return true
}

function tunnelDidRead(data) {
    if (httpStatus == HTTP_STATUS_FORWARDING) {
        return data
    } else {
        console.error(`unexpected httpStatus: ${httpStatus}`)
        return null
    }
}

function tunnelDidWrite() {
    console.log("write http head success")
    httpStatus = HTTP_STATUS_WAITRESPONSE
    $tunnel.readTo($session, "\x0D\x0A\x0D\x0A") //读取远端数据直到出现\r\n\r\n
    return false //中断wirte callback
}

function tunnelDidClose() {
    httpStatus = HTTP_STATUS_INVALID
    return true
}

//Tools
function _writeHttpHeader() {
    let conHost = $session.conHost
    let conPort = $session.conPort
    var header = `CONNECT ${conHost}:${conPort} HTTP/1.1\r\nHost:${conHost}\r\nConnection: keep-alive\r\nUser-Agent: Cloud5G/4.5.2 (iPhone; iOS 15.1; Scale/3.00) baiduboxapp\r\nX-T5-Auth: YTY0Nzlk\r\nProxy-Connection: keep-alive\r\n\r\n`
    $tunnel.write($session, header)
}