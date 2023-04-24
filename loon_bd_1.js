function tunnelDidConnected(httpStatus) {
    console.log($session);
    if ($session.proxy.isTLS) {
      // https
    } else {
      // http
      writeHttpHeader(httpStatus);
    }
}

function tunnelTLSFinished(httpStatus) {
    writeHttpHeader(httpStatus);
}

function tunnelDidRead(data, httpStatus) {
    if (httpStatus === 1) {
        // check http response code == 200
        // Assume success here
        console.log("http handshake success");
        httpStatus = 2;
        $tunnel.established($session); // can forwarding data
        return null;
    }
    //直接返回数据
    return data;
}

function tunnelDidWrite(httpStatus) {
    if (httpStatus === 0) {
        console.log("write http head success");
        httpStatus = 1;
        $tunnel.readTo($session, "\x0D\x0A\x0D\x0A"); // read remote data until \r\n\r\n
        return false; // interrupt write callback
    }
    return true;
}

function tunnelDidClose() {
    return true;
}

function writeHttpHeader(httpStatus) {
    const conHost = $session.conHost;
    const conPort = $session.conPort;
    const header = `CONNECT ${conHost}:${conPort} HTTP/1.1\r\nHost:${conHost}\r\nx-online-Host:${conHost}\r\nConnection: keep-alive\r\nUser-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 APP/91chengguo-iOS APPVersion/9.2.2 Ecloud/9.2.2 iOS/15.1 clientId/ecloud clientModel/iPhone proVersion/1.0.0\r\nX-T5-Auth: YTY0Nzlk\r\nAccess-Control-Allow-Headers: X-Requested-With, Authorization, Content-Type, X-H5App-ID, X-H5App-Timestamp, X-H5App-Signature, X-H5App-OS, X-H5App-Client, X-H5App-SDK, X-H5App-JSAPI, X-H5App-Device, X-H5App-Token\r\nProxy-Connection: keep-alive\r\n\r\n`;
    $tunnel.write($session, header);
}

// entry point
tunnelDidConnected(HTTP_STATUS_INVALID);