/*
 * @CreateTime: Aug 9, 2019 3:34 PM 
 * @Author: undefined 
 * @Contact: undefined 
* @Last Modified By: howe
* @Last Modified Time: Jun 5, 2020 5:37 PM
 * @Description: Modify Here, Please  
 * 
 * http请求实体，api设计参考了axios
 * https://github.com/axios/axios
 */

import { RequestConfig } from "./RequestConfig";

const enhanceError = function (error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function () {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};
const createError = function (message, config, code, request, response?) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

const settle = function (resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};


const generatorUUID = (function () {
  let idCount = 1;
  return (url) => {
    return url + idCount++;
  }
})();

export class RequestEntity {

  public UUID: string = "";

  /**
   * 请求的所有配置数据
   */
  public get config(): RequestConfig {
    return this._config;
  }

  $complete: Function = null;

  private _config: RequestConfig = null;
  private _xhr: XMLHttpRequest = null;

  constructor(config: RequestConfig) {
    this._config = config;
    let method = config.method.toUpperCase()
    if (method != "GET" && method != "POST") {
      cc.error("[RequestEntity] 不支持其他方法", config)
      return;
    }
    let url = config.url;
    this.UUID = generatorUUID(url);

    if (config.baseURL && !/^https?:\/\//.test(url)) {
      let baseURL = config.baseURL
      if (url[0] === '/') {
        url = url.substring(1);
      }
      if (baseURL[0] === '/') {
        baseURL = baseURL.substring(1);
      }
      url = baseURL + "/" + url;
    }

    let requestHeaders = config.headers;

    let xhr = new XMLHttpRequest();
    if (config.params && typeof config.params === "object") {
      let paramss: Array<string> = [];
      for (let k in config.params) {
        paramss.push(`${k}=${config.params[k]}`)
      }
      url = url + '?' + paramss.join("&");
    }
    url = encodeURI(url);
    xhr.open(method.toUpperCase(), url);
    xhr.timeout = config.timeout;
    if (cc.sys.isBrowser) {
      xhr.withCredentials = config.withCredentials;
    }
    // HTTP basic authentication
    if (config.auth) {
      let username = config.auth.username || '';
      let password = config.auth.password || '';
      username.toString();
      const Base64 = window["Base64"];
      requestHeaders.Authorization = 'Basic ' + Base64.encode(username + ':' + password);
    }
    if ('setRequestHeader' in xhr && config.headers && typeof config.headers === "object") {
      for (let headerKey in config.headers) {
        xhr.setRequestHeader(headerKey, config.headers[headerKey])
      }
    }
    if (config.responseType) {
      try {
        xhr.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    this.handlerXHRCallback(xhr, config);
    if (config.data === undefined) {
      config.data = null;
    }
    xhr.send(config.data);
  }

  $abort() {
    try {
      this._xhr && this._xhr.abort();
    } catch (e) {

    }
  }

  $dispose() {
    this.$complete = null;
    this._xhr = null;
  }

  private handlerXHRCallback(request: XMLHttpRequest, config: RequestConfig): void {
    let resolve = (args) => {
      if (this.$complete && request) {
        this.$complete();
      }
      config.callback && config.callback(null, args);
    }
    let reject = (args) => {
      if (this.$complete && request) {
        this.$complete();
      }
      config.callback && config.callback(args);
    }

    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      let responseHeaders = 'getAllResponseHeaders' in request ? request.getAllResponseHeaders() : null;
      let responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      let response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };
      settle(resolve, reject, response);
      // Clean up request
      request = null;
    };

    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(createError('Request aborted', config, 'ECONNABORTED', request));
      // Clean up request
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', request));
      // Clean up request
      request = null;
    };
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };
  }
}
