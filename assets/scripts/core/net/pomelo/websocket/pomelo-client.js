/**
 * 做的修改
 * 增加断线重连机制
 */
const WS_CONNECTING = 0;       // ws 已经连接
const WS_OPEN = 1;       // ws 已经打开
const WS_CLOSING = 2;       // ws 正在关闭
const WS_CLOSED = 3;       // ws 已经关闭

const JAVA_WS_CLIENT = "sockets/WebSocketClient";

let JavaWebsocket = function (wsurl) {
    this.url = wsurl;
    this.readyState = WS_CONNECTING;
    jsb.reflection.callStaticMethod(JAVA_WS_CLIENT,
        "createWS", "(Ljava/lang/String;)V", wsurl);
    let websockets = window["wshandler"].websockets;
    websockets[wsurl] = this;
}

JavaWebsocket.prototype.send = function (uint8Array) {
    jsb.reflection.callStaticMethod(JAVA_WS_CLIENT,
        "sendPacket", "(Ljava/lang/String;Ljava/lang/String;)V", this.url, uint8Array.join("|"));
}

JavaWebsocket.prototype.close = function () {
    this.readyState = WS_CLOSING;
    let ret = jsb.reflection.callStaticMethod(JAVA_WS_CLIENT,
        "disconnect", "(Ljava/lang/String;)V", this.url);
    if (ret) {
        cc.log(ret);
    }
    let websockets = window["wshandler"].websockets;
    websockets[this.url] = null;
    delete websockets[this.url];
}

window["wshandler"] = {
    websockets: {},
    event: function (event, wsurl, strdata) {
        cc.log("[pomelo-client] receive event: ", event, wsurl);
        switch (event) {
            case "onopen": {
                let websocket = this.websockets[wsurl];
                if (websocket) {
                    websocket.readyState = WS_OPEN;
                    websocket.onopen({ target: websocket, data: strdata })
                } else {
                    cc.error(" websocket is null! url = ", wsurl);
                }
                break;
            }
            case "onmessage": {
                let websocket = this.websockets[wsurl];
                if (websocket) {
                    let ss = strdata.split("|");
                    let bytes = new Uint8Array(ss.length);
                    for (let i = 0; i < ss.length; i++) {
                        bytes[i] = parseInt(ss[i]);
                    }
                    websocket.onmessage({ target: websocket, data: bytes })
                } else {
                    cc.error(" websocket is null! url = ", wsurl);
                }
                break;
            }
            case "onclose": {
                let websocket = this.websockets[wsurl];
                if (websocket) {
                    websocket.readyState = WS_CLOSED;
                    websocket.onclose({ target: websocket, data: strdata })
                } else {
                    cc.error(" websocket is null! url = ", wsurl);
                }
                break;
            }
            case "onerror": {
                let websocket = this.websockets[wsurl];
                if (websocket) {
                    websocket.onerror({ target: websocket, data: strdata })
                } else {
                    cc.error(" websocket is null! url = ", wsurl);
                }
                break;
            }
            case "heartBeatTimeout": {
                let websocket = this.websockets[wsurl];
                if (websocket) {
                    websocket.heartBeatTimeout({ target: websocket, data: strdata })
                } else {
                    cc.error(" websocket is null! url = ", wsurl);
                }
                break;
            }
        }
    }
}

const Events = {
    "ERROR": "error",              // 错误
    "IOERROR": "ioError",            // io错误
    "HEARTBEAT_TIMEOUT": "heartbeatTimeout",   // 心跳超时
    "CLOSE": "close",              // 断开连接，onKick,服务端关闭，disconnect都会触发
    "PARSE_ERROR": "parseError",         // 解析服务端返回时发生异常
    "ONKICK": "onKick"              // 服务器主动踢出 
}

let EventEmitter = require("EventEmitter");

let pomeloCreator = function (protoLocalkey) {
    let protoLocalKey = protoLocalkey || "pomelokey";
    let pomeloProtos = null;                      // 握手数据，可以使用外部传入
    let JS_WS_CLIENT_TYPE = 'js-websocket';
    let JS_WS_CLIENT_VERSION = '0.0.1';

    let RES_OK = 200;
    let RES_FAIL = 500;
    let RES_OLD_CLIENT = 501;

    let Protobuf = require("protobuf");
    let Protocol = require("protocol");

    let Package = Protocol.Package;
    let Message = Protocol.Message;
    let localStorage = null;
    if (typeof localStorage != 'undefined') {
        localStorage = window.localStorage;
    } else if (typeof cc != 'undefined') {
        localStorage = cc.sys.localStorage;
    }


    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() { }
            F.prototype = o;
            return new F();
        };
    }

    let pomelo = Object.create(EventEmitter.prototype); // object extend from object

    pomelo.Events = Events;

    let socket = null;
    let reqId = 0;
    let callbacks = {};
    let handlers = {};

    //Map from request id to route
    let routeMap = {};
    let dict = {};    // route string to code
    let abbrs = {};   // code to route string
    let serverProtos = {};
    let clientProtos = {};
    let protoVersion = 0;

    // 心跳处理
    let heartbeatInterval = 0;
    let heartbeatTimeout = 0;
    let nextHeartbeatTimeout = 0;
    let gapThreshold = 100;   // heartbeat gap threashold
    let heartbeatId = null;
    let heartbeatTimeoutId = null;
    let heartbeatStartTime = 0;
    let heartbeatPing = 0;
    let handshakeCallback = null;

    let decode = null;
    let encode = null;

    let handshakeBuffer = {
        'sys': {
            type: JS_WS_CLIENT_TYPE,
            version: JS_WS_CLIENT_VERSION
        },
        'user': {
        }
    };

    let initCallback = null;
    let initErrorCallback = null;
    let isReconnect = false;

    let ws_url = "";

    let connected = false;       // 是否连接成功
    let closeCount = 0;          // 连接断开次数

    /**
     * 初始化连接的函数
     * @param params{Object}  eg.{host:"localhost",port:"3010"}
     * @param cb{Function}    初始化完成后回调
     */
    pomelo.init = function (params, cb, eb) {
        // let host = params.host;
        // let port = params.port;

        encode = params.encode || defaultEncode;
        decode = params.decode || defaultDecode;

        cc.log('【服务器协议压缩是否开启】' + !!params.encode);

        let url = params.url

        ws_url = params.url;

        handshakeBuffer.user = params.user;
        handshakeCallback = params.handshakeCallback;
        initWebSocket(url, cb, eb);
    };
    pomelo.destroy = function () {
        EventEmitter.prototype.destroy.call(this);
        pomelo.disconnect();
        pomelo.Events = null;

        routeMap = null;
        initCallback = null;
        initErrorCallback = null;
        handshakeBuffer = null;
        handshakeCallback = null;
        callbacks = null;
        handlers = null;
        //Map from request id to route
        dict = null    // route string to code
        abbrs = null   // code to route string
        serverProtos = null
        clientProtos = null
        decode = null;
        encode = null;
        cc.log(`[pomelo] destroy ${protoLocalKey}`)
    }
    pomelo.reconnect = function (params, cb, eb) {
        isReconnect = true;
        pomelo.disconnect();
        pomelo.init(params, cb, eb)
    }

    /**
     * 断开连接的函数
     */
    pomelo.disconnect = function () {
        try {
            if (socket) {
                cc.log("【pomelo】disconnect close socket!");
                try {
                    if (socket.close) {
                        socket.close();
                    }
                } catch (e) {
                    cc.log(" close error = ", e.toString())
                }
                socket = null;
            }
            if (heartbeatId) {
                clearTimeout(heartbeatId);
                heartbeatId = null;
            }
            if (heartbeatTimeoutId) {
                clearTimeout(heartbeatTimeoutId);
                heartbeatTimeoutId = null;
            }
        }
        catch (e) {
            cc.error("【pomelo】disconnect" + e);
        }
    };
    /** 
     * 发送请求，会有结果返回
     * @param route{String} 协议路由
     * @param msg{Object}   消息,如果定义了protobuf，则require字段必须有数据
     * @param cb{Function}  消息处理函数,参数是json数据 cb(json)
     */
    pomelo.request = function (route, msg, cb) {
        if (arguments.length === 2 && typeof msg === 'function') {
            cb = msg;
            msg = {};
        } else {
            msg = msg || {};
        }
        route = route || msg.route;
        if (!route) {
            return;
        }

        reqId++;
        sendMessage(reqId, route, msg);

        callbacks[reqId] = cb;
        routeMap[reqId] = route;
    };

    /**
     * 给服务端发送通知
     * @param route{String} 协议路由
     * @param msg{Object}   消息,如果定义了protobuf，则require字段必须有数据
     */
    pomelo.notify = function (route, msg) {
        msg = msg || {};
        sendMessage(0, route, msg);
    };

    pomelo.getPing = function () {
        return heartbeatPing;
    }

    /** 设置握手数据（暂未使用） */
    pomelo.setHandshake = function (protos) {
        pomeloProtos = protos;
    }

    /** 数据解码 */
    let defaultDecode = pomelo.decode = function (data) {
        //probuff decode
        let msg = Message.decode(data);

        if (msg.id > 0) {
            msg.route = routeMap[msg.id];
            delete routeMap[msg.id];
            if (!msg.route) {
                cc.log("【网络】协议路由不存在");
                return;
            }
        }

        msg.body = deCompose(msg);
        return msg;
    };

    let defaultEncode = pomelo.encode = function (reqId, route, msg) {
        let type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

        //compress message by protobuf
        if (clientProtos && clientProtos[route]) {
            msg = Protobuf.encode(route, msg);
        } else {
            msg = Protocol.strencode(JSON.stringify(msg));
        }

        let compressRoute = 0;
        if (dict && dict[route]) {
            route = dict[route];
            compressRoute = 1;
        }

        return Message.encode(reqId, type, compressRoute, route, msg);
    };

    let clearSocket = function (socket) {
        let nope = function () { };

        socket.onopen = nope;
        socket.onmessage = nope;
        socket.onerror = nope;
        socket.onclose = nope;
        socket.heartBeatTimeout = nope;
    }

    let initWebSocket = function (url, cb, eb) {
        initCallback = cb;
        initErrorCallback = eb;

        //Add protobuf version
        if (protoVersion === 0) {
            let protos;

            try {
                // 外部设置的数据比本地保存的数据优先级高
                if (pomeloProtos) {
                    protos = pomeloProtos;
                }
                else if (localStorage && localStorage.getItem(protoLocalKey)) {
                    protos = JSON.parse(localStorage.getItem(protoLocalKey));
                }
            }
            catch (err) {
                protos = null;
            }

            if (protos) {
                protoVersion = protos.version || 0;
                serverProtos = protos.server || {};
                clientProtos = protos.client || {};

                if (Protobuf) Protobuf.init({ encoderProtos: clientProtos, decoderProtos: serverProtos });
            }
        }

        //Set protoversion
        handshakeBuffer.sys.protoVersion = protoVersion;

        let createSocket = function () {
            pomelo.disconnect();
            try {
                let pemurl = cc.url.raw("resources/cacert.pem");
                if (cc.loader.md5Pipe) {
                    pemurl = cc.loader.md5Pipe.transformURL(pemurl)
                }
                cc.log("pemurl=", pemurl)
                socket = null;
                if (cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID) {
                    socket = new JavaWebsocket(ws_url, [], pemurl);
                } else {
                    socket = new WebSocket(url, [], pemurl);
                }

                socket.binaryType = 'arraybuffer';
                socket.onopen = onopen;
                socket.onmessage = onmessage;
                socket.onerror = onerror;
                socket.onclose = onclose;
                socket.heartBeatTimeout = function () {
                    pomelo.emit(Events.HEARTBEAT_TIMEOUT);
                    pomelo.disconnect();
                }
            }
            catch (e) {
                cc.log("createSocket error", e)
                pomelo.emit(Events.CLOSE);
            }
        };

        /** 连接成功 */
        let onopen = function (event) {
            closeCount = 0;
            connected = true;
            cc.log("【网络】连接成功");
            let obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
            send(obj);
        };

        /** 接收数据 */
        let onmessage = function (event) {
            try {
                let msg = Package.decode(event.data);
                processPackage(msg, cb);
            } catch (e) {
                cc.log("pomelo数据处理错误，", e)
            }
            // new package arrived, update the heartbeat timeout
            if (heartbeatTimeout) {
                nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
            }
        };

        /** 网络错误 */
        let onerror = function (event) {
            // pomelo.emit(Events.IOERROR, event); 

            cc.log("【网络】连接游戏服务器出错", event);
            pomelo.emit(Events.CLOSE);
        };

        /** 网络断开 */
        let onclose = function (event) {
            if (!socket) {
                cc.log("socket = null!")
            }
            if (isReconnect == false && event.target.readyState == WS_CLOSED && initErrorCallback) {
                initErrorCallback();
                return;
            }

            if (connected == false && closeCount < 3) {
                closeCount++;
                cc.log("【网络】WEBSOCKET 重握手");
                createSocket();
            }
            else {
                cc.log("【网络】WEBSOCKET 断开");
                closeCount = 0;
                connected = false;
                // socket = null;
                pomelo.emit(Events.CLOSE);
            }
        };

        if (socket) {
            clearSocket(socket);
        }

        cc.log('【网络】游戏服务器连接地址：' + url);

        createSocket();
    };

    /** 向服务器发消息 */
    let sendMessage = function (reqId, route, msg) {
        if (encode) {
            msg = encode(reqId, route, msg);
        }

        let packet = Package.encode(Package.TYPE_DATA, msg);
        send(packet);
    };

    /** 向服务器发消息 */
    let send = function (packet) {
        if (socket == null || socket.readyState != WS_OPEN) {
            cc.log("【网络】发送数据给服务器时检查与服务器已断开 socket.readyState", socket.readyState);
            pomelo.emit(Events.CLOSE);
        }
        else {
            socket.send(packet);
        }
    };

    let handler = {};

    let heartbeat = function (data) {
        if (!(socket instanceof WebSocket)) {
            return;
        }
        if (heartbeatStartTime) {
            heartbeatPing = (new Date()) - heartbeatStartTime;
        }

        if (!heartbeatInterval) {
            // no heartbeat
            return;
        }

        let obj = Package.encode(Package.TYPE_HEARTBEAT);
        if (heartbeatTimeoutId) {
            clearTimeout(heartbeatTimeoutId);
            heartbeatTimeoutId = null;
        }

        if (heartbeatId) {
            // already in a heartbeat interval
            return;
        }
        heartbeatId = setTimeout(function () {
            if (socket == null || socket.readyState != WS_OPEN) return;

            heartbeatId = null;
            heartbeatStartTime = new Date();
            send(obj);

            nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
            heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);

        }, heartbeatInterval);
    };

    let heartbeatTimeoutCb = function () {
        let gap = nextHeartbeatTimeout - Date.now();
        if (gap > gapThreshold) {
            heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
        } else {
            pomelo.emit(Events.HEARTBEAT_TIMEOUT);
            pomelo.disconnect();
        }
    };

    let handshake = function (data) {
        data = JSON.parse(Protocol.strdecode(data));
        if (data.code === RES_OLD_CLIENT) {
            pomelo.emit(Events.ERROR, 'client version not fullfill');
            return;
        }

        if (data.code !== RES_OK) {
            pomelo.emit(Events.ERROR, 'handshake fail');
            return;
        }

        handshakeInit(data);

        let obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
        send(obj);
        if (initCallback) {
            initCallback(socket);
            initCallback = null;
            initErrorCallback = null;
        }
    };

    let onData = function (data) {
        let msg = data;
        if (decode) {
            msg = decode(msg);
        }
        processMessage(pomelo, msg);
    };

    let onKick = function (data) {
        data = Protocol.strdecode(data);

        try {
            data = JSON.parse(data);
        } catch (e) {
            cc.log(e.message);
        }
        pomelo.emit(Events.ONKICK, data);
    };


    handlers[Package.TYPE_HANDSHAKE] = handshake;
    handlers[Package.TYPE_HEARTBEAT] = heartbeat;
    handlers[Package.TYPE_DATA] = onData;
    handlers[Package.TYPE_KICK] = onKick;

    let processPackage = function (msg) {
        handlers[msg.type](msg.body);
    };

    let processMessage = function (pomelo, msg) {
        if (!msg.id) {
            // server push message
            pomelo.emit(msg.route, msg.body);
            return;
        }

        //if have a id then find the callback function with the request
        let cb = callbacks[msg.id];

        delete callbacks[msg.id];
        if (typeof cb !== 'function') {
            return;
        }

        try {
            cb(msg.body);
        }
        catch (e) {
            pomelo.emit(Events.PARSE_ERROR, e);
        }

        return;
    };

    let processMessageBatch = function (pomelo, msgs) {
        for (let i = 0, l = msgs.length; i < l; i++) {
            processMessage(pomelo, msgs[i]);
        }
    };

    let deCompose = function (msg) {
        let route = msg.route;

        // Decompose route from dict
        if (msg.compressRoute) {
            if (!abbrs[route]) {
                return {};
            }

            route = msg.route = abbrs[route];
        }
        if (serverProtos && serverProtos[route]) {
            return Protobuf.decode(route, msg.body);
        }
        else {
            // cc.warn("【网络】协议需要使用 protobuf 压缩：" + route);
            return JSON.parse(Protocol.strdecode(msg.body));
        }
    };

    let handshakeInit = function (data) {
        if (data.sys && data.sys.heartbeat) {
            heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
            heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
        } else {
            heartbeatInterval = 0;
            heartbeatTimeout = 0;
        }

        initData(data);

        if (typeof handshakeCallback === 'function') {
            handshakeCallback(data.user);
        }
    };

    //Initilize data used in pomelo client
    let initData = function (data) {
        if (!data || !data.sys) {
            return;
        }
        dict = data.sys.dict;
        let protos = data.sys.protos;

        //Init compress dict
        if (dict) {
            dict = dict;
            abbrs = {};

            for (let route in dict) {
                abbrs[dict[route]] = route;
            }
        }

        //Init Protobuf protos
        if (protos) {
            protoVersion = protos.version || 0;
            serverProtos = protos.server || {};
            clientProtos = protos.client || {};
            if (!!Protobuf) {
                Protobuf.init({ encoderProtos: protos.client, decoderProtos: protos.server });
            }

            //Save protobuf protos to localStorage
            localStorage.setItem(protoLocalKey, JSON.stringify(protos));
        } else {
            localStorage.setItem(protoLocalKey, JSON.stringify({}));
        }
    };
    return pomelo;
};
module.exports = pomeloCreator;
