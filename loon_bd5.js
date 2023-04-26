let HTTP_STATUS_INVALID = -1 
let HTTP_STATUS_CONNECTED = 0 
let HTTP_STATUS_WAITRESPONSE = 1 
let HTTP_STATUS_FORWARDING = 2 

var httpStatus = HTTP_STATUS_INVALID 
var requestMethod = 'CONNECT'
var requestData = ''

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
        requestData ? $tunnel.write($session, requestData) : null // post 数据转发
        return null//不将读取到的数据转发到客户端
    } else if (httpStatus == HTTP_STATUS_FORWARDING) {
        return data
    }
}

function tunnelDidWrite() {
    if (httpStatus == HTTP_STATUS_CONNECTED) {
        console.log("write http head success")
        httpStatus = HTTP_STATUS_WAITRESPONSE 
        if (requestMethod === 'POST' || requestMethod === 'GET') {
            $tunnel.write($session, `${requestMethod} ${requestData} HTTP/1.1\r\nHost: ${$session.conHost}\r\nConnection: Keep-Alive\r\nContent-Length: 0\r\n\r\n`) // 写入请求行和请求头
        } else {
            $tunnel.readTo($session, "\x0D\x0A\x0D\x0A")//读取远端数据直到出现\r\n\r\n
        }
        return false //中断write callback
    }
    return true
}

function tunnelDidClose() {
    return true
}

//新增方法：处理get协议请求
function handleGetProtocol(path) {
    return `${path}`
}

//新增方法：处理post协议请求
function handlePostProtocol(path, requestBody) {
    return `${path}\r\n${requestBody}`
}

//Tools
function _writeHttpHeader() {
    let conHost = $session.conHost 
    let conPort = $session.conPort 
    
    let formattedPath = ''
    if (requestData && requestData.includes('GET ')) {
        formattedPath = handleGetProtocol(requestData.split(' ')[1])
    } 

    if (requestData && requestData.includes('POST ')) {
        formattedPath = handlePostProtocol(requestData.split(' ')[1], requestData.substring(requestData.indexOf('\r\n\r\n') + 4))
    }

    requestMethod = requestData.split(' ')[0]
    requestData = formattedPath || null

    var header = `${requestMethod} ${formattedPath ? formattedPath : `${conHost}:${conProt} `} HTTP/1.1\r\nHost:gz189cloud2.oos-gz.ctyunapi.cn\r\nConnection:keep-alive\r\nUser-Agent:Cloud189/8 CFNetwork/1325.0.1 Darwin/21.1.0 baiduboxapp/21.1.0\r\nProxy-Connection:keep-alive\r\nX-T5-Auth:1962898709\r\n\r\n`
    $tunnel.write($session, header)
}