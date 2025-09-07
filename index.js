var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins = cap.Plugins = cap.Plugins || {};
      const getPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const isNativePlatform = () => getPlatform() !== "web";
      const isPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const getPluginHeader = (pluginName) => {
        var _a;
        return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
      };
      const handleError = (err) => win.console.error(err);
      const registeredPlugins = /* @__PURE__ */ new Map();
      const registerPlugin2 = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a, _b;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
            }
          } else if (impl) {
            return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
        });
        return proxy;
      };
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    WebPlugin = class {
      constructor() {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
  }
});

// node_modules/@capacitor/haptics/dist/esm/definitions.js
var ImpactStyle, NotificationType;
var init_definitions = __esm({
  "node_modules/@capacitor/haptics/dist/esm/definitions.js"() {
    (function(ImpactStyle2) {
      ImpactStyle2["Heavy"] = "HEAVY";
      ImpactStyle2["Medium"] = "MEDIUM";
      ImpactStyle2["Light"] = "LIGHT";
    })(ImpactStyle || (ImpactStyle = {}));
    (function(NotificationType2) {
      NotificationType2["Success"] = "SUCCESS";
      NotificationType2["Warning"] = "WARNING";
      NotificationType2["Error"] = "ERROR";
    })(NotificationType || (NotificationType = {}));
  }
});

// node_modules/@capacitor/haptics/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  HapticsWeb: () => HapticsWeb
});
var HapticsWeb;
var init_web = __esm({
  "node_modules/@capacitor/haptics/dist/esm/web.js"() {
    init_dist();
    init_definitions();
    HapticsWeb = class extends WebPlugin {
      constructor() {
        super(...arguments);
        this.selectionStarted = false;
      }
      async impact(options) {
        const pattern = this.patternForImpact(options === null || options === void 0 ? void 0 : options.style);
        this.vibrateWithPattern(pattern);
      }
      async notification(options) {
        const pattern = this.patternForNotification(options === null || options === void 0 ? void 0 : options.type);
        this.vibrateWithPattern(pattern);
      }
      async vibrate(options) {
        const duration = (options === null || options === void 0 ? void 0 : options.duration) || 300;
        this.vibrateWithPattern([duration]);
      }
      async selectionStart() {
        this.selectionStarted = true;
      }
      async selectionChanged() {
        if (this.selectionStarted) {
          this.vibrateWithPattern([70]);
        }
      }
      async selectionEnd() {
        this.selectionStarted = false;
      }
      patternForImpact(style = ImpactStyle.Heavy) {
        if (style === ImpactStyle.Medium) {
          return [43];
        } else if (style === ImpactStyle.Light) {
          return [20];
        }
        return [61];
      }
      patternForNotification(type = NotificationType.Success) {
        if (type === NotificationType.Warning) {
          return [30, 40, 30, 50, 60];
        } else if (type === NotificationType.Error) {
          return [27, 45, 50];
        }
        return [35, 65, 21];
      }
      vibrateWithPattern(pattern) {
        if (navigator.vibrate) {
          navigator.vibrate(pattern);
        } else {
          throw this.unavailable("Browser does not support the vibrate API");
        }
      }
    };
  }
});

// node_modules/@capacitor/filesystem/dist/esm/definitions.js
var Directory, Encoding;
var init_definitions2 = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
    (function(Directory2) {
      Directory2["Documents"] = "DOCUMENTS";
      Directory2["Data"] = "DATA";
      Directory2["Library"] = "LIBRARY";
      Directory2["Cache"] = "CACHE";
      Directory2["External"] = "EXTERNAL";
      Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
      Directory2["ExternalCache"] = "EXTERNAL_CACHE";
      Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
      Directory2["Temporary"] = "TEMPORARY";
    })(Directory || (Directory = {}));
    (function(Encoding2) {
      Encoding2["UTF8"] = "utf8";
      Encoding2["ASCII"] = "ascii";
      Encoding2["UTF16"] = "utf16";
    })(Encoding || (Encoding = {}));
  }
});

// node_modules/@capacitor/filesystem/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  FilesystemWeb: () => FilesystemWeb
});
function resolve(path) {
  const posix = path.split("/").filter((item) => item !== ".");
  const newPosix = [];
  posix.forEach((item) => {
    if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
      newPosix.pop();
    } else {
      newPosix.push(item);
    }
  });
  return newPosix.join("/");
}
function isPathParent(parent, children) {
  parent = resolve(parent);
  children = resolve(children);
  const pathsA = parent.split("/");
  const pathsB = children.split("/");
  return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
}
var FilesystemWeb;
var init_web2 = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
    init_dist();
    init_definitions2();
    FilesystemWeb = class _FilesystemWeb extends WebPlugin {
      constructor() {
        super(...arguments);
        this.DB_VERSION = 1;
        this.DB_NAME = "Disc";
        this._writeCmds = ["add", "put", "delete"];
        this.downloadFile = async (options) => {
          var _a, _b;
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const response = await fetch(options.url, requestInit);
          let blob;
          if (!options.progress)
            blob = await response.blob();
          else if (!(response === null || response === void 0 ? void 0 : response.body))
            blob = new Blob();
          else {
            const reader = response.body.getReader();
            let bytes = 0;
            const chunks = [];
            const contentType = response.headers.get("content-type");
            const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
            while (true) {
              const { done, value } = await reader.read();
              if (done)
                break;
              chunks.push(value);
              bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
              const status = {
                url: options.url,
                bytes,
                contentLength
              };
              this.notifyListeners("progress", status);
            }
            const allChunks = new Uint8Array(bytes);
            let position = 0;
            for (const chunk of chunks) {
              if (typeof chunk === "undefined")
                continue;
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
          }
          const result = await this.writeFile({
            path: options.path,
            directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
            recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
            data: blob
          });
          return { path: result.uri, blob };
        };
      }
      readFileInChunks(_options, _callback) {
        throw this.unavailable("Method not implemented.");
      }
      async initDb() {
        if (this._db !== void 0) {
          return this._db;
        }
        if (!("indexedDB" in window)) {
          throw this.unavailable("This browser doesn't support IndexedDB");
        }
        return new Promise((resolve2, reject) => {
          const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
          request.onupgradeneeded = _FilesystemWeb.doUpgrade;
          request.onsuccess = () => {
            this._db = request.result;
            resolve2(request.result);
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn("db blocked");
          };
        });
      }
      static doUpgrade(event) {
        const eventTarget = event.target;
        const db = eventTarget.result;
        switch (event.oldVersion) {
          case 0:
          case 1:
          default: {
            if (db.objectStoreNames.contains("FileStorage")) {
              db.deleteObjectStore("FileStorage");
            }
            const store = db.createObjectStore("FileStorage", { keyPath: "path" });
            store.createIndex("by_folder", "folder");
          }
        }
      }
      async dbRequest(cmd, args) {
        const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
        return this.initDb().then((conn) => {
          return new Promise((resolve2, reject) => {
            const tx = conn.transaction(["FileStorage"], readFlag);
            const store = tx.objectStore("FileStorage");
            const req = store[cmd](...args);
            req.onsuccess = () => resolve2(req.result);
            req.onerror = () => reject(req.error);
          });
        });
      }
      async dbIndexRequest(indexName, cmd, args) {
        const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
        return this.initDb().then((conn) => {
          return new Promise((resolve2, reject) => {
            const tx = conn.transaction(["FileStorage"], readFlag);
            const store = tx.objectStore("FileStorage");
            const index = store.index(indexName);
            const req = index[cmd](...args);
            req.onsuccess = () => resolve2(req.result);
            req.onerror = () => reject(req.error);
          });
        });
      }
      getPath(directory, uriPath) {
        const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
        let fsPath = "";
        if (directory !== void 0)
          fsPath += "/" + directory;
        if (uriPath !== "")
          fsPath += "/" + cleanedUriPath;
        return fsPath;
      }
      async clear() {
        const conn = await this.initDb();
        const tx = conn.transaction(["FileStorage"], "readwrite");
        const store = tx.objectStore("FileStorage");
        store.clear();
      }
      /**
       * Read a file from disk
       * @param options options for the file read
       * @return a promise that resolves with the read file data result
       */
      async readFile(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (entry === void 0)
          throw Error("File does not exist.");
        return { data: entry.content ? entry.content : "" };
      }
      /**
       * Write a file to disk in the specified location on device
       * @param options options for the file write
       * @return a promise that resolves with the file write result
       */
      async writeFile(options) {
        const path = this.getPath(options.directory, options.path);
        let data = options.data;
        const encoding = options.encoding;
        const doRecursive = options.recursive;
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (occupiedEntry && occupiedEntry.type === "directory")
          throw Error("The supplied path is a directory.");
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const parentEntry = await this.dbRequest("get", [parentPath]);
        if (parentEntry === void 0) {
          const subDirIndex = parentPath.indexOf("/", 1);
          if (subDirIndex !== -1) {
            const parentArgPath = parentPath.substr(subDirIndex);
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
        }
        if (!encoding && !(data instanceof Blob)) {
          data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
          if (!this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
        }
        const now = Date.now();
        const pathObj = {
          path,
          folder: parentPath,
          type: "file",
          size: data instanceof Blob ? data.size : data.length,
          ctime: now,
          mtime: now,
          content: data
        };
        await this.dbRequest("put", [pathObj]);
        return {
          uri: pathObj.path
        };
      }
      /**
       * Append to a file on disk in the specified location on device
       * @param options options for the file append
       * @return a promise that resolves with the file write result
       */
      async appendFile(options) {
        const path = this.getPath(options.directory, options.path);
        let data = options.data;
        const encoding = options.encoding;
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const now = Date.now();
        let ctime = now;
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (occupiedEntry && occupiedEntry.type === "directory")
          throw Error("The supplied path is a directory.");
        const parentEntry = await this.dbRequest("get", [parentPath]);
        if (parentEntry === void 0) {
          const subDirIndex = parentPath.indexOf("/", 1);
          if (subDirIndex !== -1) {
            const parentArgPath = parentPath.substr(subDirIndex);
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: true
            });
          }
        }
        if (!encoding && !this.isBase64String(data))
          throw Error("The supplied data is not valid base64 content.");
        if (occupiedEntry !== void 0) {
          if (occupiedEntry.content instanceof Blob) {
            throw Error("The occupied entry contains a Blob object which cannot be appended to.");
          }
          if (occupiedEntry.content !== void 0 && !encoding) {
            data = btoa(atob(occupiedEntry.content) + atob(data));
          } else {
            data = occupiedEntry.content + data;
          }
          ctime = occupiedEntry.ctime;
        }
        const pathObj = {
          path,
          folder: parentPath,
          type: "file",
          size: data.length,
          ctime,
          mtime: now,
          content: data
        };
        await this.dbRequest("put", [pathObj]);
      }
      /**
       * Delete a file from disk
       * @param options options for the file delete
       * @return a promise that resolves with the deleted file data result
       */
      async deleteFile(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (entry === void 0)
          throw Error("File does not exist.");
        const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
        if (entries.length !== 0)
          throw Error("Folder is not empty.");
        await this.dbRequest("delete", [path]);
      }
      /**
       * Create a directory.
       * @param options options for the mkdir
       * @return a promise that resolves with the mkdir result
       */
      async mkdir(options) {
        const path = this.getPath(options.directory, options.path);
        const doRecursive = options.recursive;
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const depth = (path.match(/\//g) || []).length;
        const parentEntry = await this.dbRequest("get", [parentPath]);
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (depth === 1)
          throw Error("Cannot create Root directory");
        if (occupiedEntry !== void 0)
          throw Error("Current directory does already exist.");
        if (!doRecursive && depth !== 2 && parentEntry === void 0)
          throw Error("Parent directory must exist");
        if (doRecursive && depth !== 2 && parentEntry === void 0) {
          const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
          await this.mkdir({
            path: parentArgPath,
            directory: options.directory,
            recursive: doRecursive
          });
        }
        const now = Date.now();
        const pathObj = {
          path,
          folder: parentPath,
          type: "directory",
          size: 0,
          ctime: now,
          mtime: now
        };
        await this.dbRequest("put", [pathObj]);
      }
      /**
       * Remove a directory
       * @param options the options for the directory remove
       */
      async rmdir(options) {
        const { path, directory, recursive } = options;
        const fullPath = this.getPath(directory, path);
        const entry = await this.dbRequest("get", [fullPath]);
        if (entry === void 0)
          throw Error("Folder does not exist.");
        if (entry.type !== "directory")
          throw Error("Requested path is not a directory");
        const readDirResult = await this.readdir({ path, directory });
        if (readDirResult.files.length !== 0 && !recursive)
          throw Error("Folder is not empty");
        for (const entry2 of readDirResult.files) {
          const entryPath = `${path}/${entry2.name}`;
          const entryObj = await this.stat({ path: entryPath, directory });
          if (entryObj.type === "file") {
            await this.deleteFile({ path: entryPath, directory });
          } else {
            await this.rmdir({ path: entryPath, directory, recursive });
          }
        }
        await this.dbRequest("delete", [fullPath]);
      }
      /**
       * Return a list of files from the directory (not recursive)
       * @param options the options for the readdir operation
       * @return a promise that resolves with the readdir directory listing result
       */
      async readdir(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (options.path !== "" && entry === void 0)
          throw Error("Folder does not exist.");
        const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
        const files = await Promise.all(entries.map(async (e) => {
          let subEntry = await this.dbRequest("get", [e]);
          if (subEntry === void 0) {
            subEntry = await this.dbRequest("get", [e + "/"]);
          }
          return {
            name: e.substring(path.length + 1),
            type: subEntry.type,
            size: subEntry.size,
            ctime: subEntry.ctime,
            mtime: subEntry.mtime,
            uri: subEntry.path
          };
        }));
        return { files };
      }
      /**
       * Return full File URI for a path and directory
       * @param options the options for the stat operation
       * @return a promise that resolves with the file stat result
       */
      async getUri(options) {
        const path = this.getPath(options.directory, options.path);
        let entry = await this.dbRequest("get", [path]);
        if (entry === void 0) {
          entry = await this.dbRequest("get", [path + "/"]);
        }
        return {
          uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
        };
      }
      /**
       * Return data about a file
       * @param options the options for the stat operation
       * @return a promise that resolves with the file stat result
       */
      async stat(options) {
        const path = this.getPath(options.directory, options.path);
        let entry = await this.dbRequest("get", [path]);
        if (entry === void 0) {
          entry = await this.dbRequest("get", [path + "/"]);
        }
        if (entry === void 0)
          throw Error("Entry does not exist.");
        return {
          name: entry.path.substring(path.length + 1),
          type: entry.type,
          size: entry.size,
          ctime: entry.ctime,
          mtime: entry.mtime,
          uri: entry.path
        };
      }
      /**
       * Rename a file or directory
       * @param options the options for the rename operation
       * @return a promise that resolves with the rename result
       */
      async rename(options) {
        await this._copy(options, true);
        return;
      }
      /**
       * Copy a file or directory
       * @param options the options for the copy operation
       * @return a promise that resolves with the copy result
       */
      async copy(options) {
        return this._copy(options, false);
      }
      async requestPermissions() {
        return { publicStorage: "granted" };
      }
      async checkPermissions() {
        return { publicStorage: "granted" };
      }
      /**
       * Function that can perform a copy or a rename
       * @param options the options for the rename operation
       * @param doRename whether to perform a rename or copy operation
       * @return a promise that resolves with the result
       */
      async _copy(options, doRename = false) {
        let { toDirectory } = options;
        const { to, from, directory: fromDirectory } = options;
        if (!to || !from) {
          throw Error("Both to and from must be provided");
        }
        if (!toDirectory) {
          toDirectory = fromDirectory;
        }
        const fromPath = this.getPath(fromDirectory, from);
        const toPath = this.getPath(toDirectory, to);
        if (fromPath === toPath) {
          return {
            uri: toPath
          };
        }
        if (isPathParent(fromPath, toPath)) {
          throw Error("To path cannot contain the from path");
        }
        let toObj;
        try {
          toObj = await this.stat({
            path: to,
            directory: toDirectory
          });
        } catch (e) {
          const toPathComponents = to.split("/");
          toPathComponents.pop();
          const toPath2 = toPathComponents.join("/");
          if (toPathComponents.length > 0) {
            const toParentDirectory = await this.stat({
              path: toPath2,
              directory: toDirectory
            });
            if (toParentDirectory.type !== "directory") {
              throw new Error("Parent directory of the to path is a file");
            }
          }
        }
        if (toObj && toObj.type === "directory") {
          throw new Error("Cannot overwrite a directory with a file");
        }
        const fromObj = await this.stat({
          path: from,
          directory: fromDirectory
        });
        const updateTime = async (path, ctime2, mtime) => {
          const fullPath = this.getPath(toDirectory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          entry.ctime = ctime2;
          entry.mtime = mtime;
          await this.dbRequest("put", [entry]);
        };
        const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
        switch (fromObj.type) {
          // The "from" object is a file
          case "file": {
            const file = await this.readFile({
              path: from,
              directory: fromDirectory
            });
            if (doRename) {
              await this.deleteFile({
                path: from,
                directory: fromDirectory
              });
            }
            let encoding;
            if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
              encoding = Encoding.UTF8;
            }
            const writeResult = await this.writeFile({
              path: to,
              directory: toDirectory,
              data: file.data,
              encoding
            });
            if (doRename) {
              await updateTime(to, ctime, fromObj.mtime);
            }
            return writeResult;
          }
          case "directory": {
            if (toObj) {
              throw Error("Cannot move a directory over an existing object");
            }
            try {
              await this.mkdir({
                path: to,
                directory: toDirectory,
                recursive: false
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
            } catch (e) {
            }
            const contents = (await this.readdir({
              path: from,
              directory: fromDirectory
            })).files;
            for (const filename of contents) {
              await this._copy({
                from: `${from}/${filename.name}`,
                to: `${to}/${filename.name}`,
                directory: fromDirectory,
                toDirectory
              }, doRename);
            }
            if (doRename) {
              await this.rmdir({
                path: from,
                directory: fromDirectory
              });
            }
          }
        }
        return {
          uri: toPath
        };
      }
      isBase64String(str) {
        try {
          return btoa(atob(str)) == str;
        } catch (err) {
          return false;
        }
      }
    };
    FilesystemWeb._debug = true;
  }
});

// node_modules/@capacitor/app/dist/esm/web.js
var web_exports3 = {};
__export(web_exports3, {
  AppWeb: () => AppWeb
});
var AppWeb;
var init_web3 = __esm({
  "node_modules/@capacitor/app/dist/esm/web.js"() {
    init_dist();
    AppWeb = class extends WebPlugin {
      constructor() {
        super();
        this.handleVisibilityChange = () => {
          const data = {
            isActive: document.hidden !== true
          };
          this.notifyListeners("appStateChange", data);
          if (document.hidden) {
            this.notifyListeners("pause", null);
          } else {
            this.notifyListeners("resume", null);
          }
        };
        document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
      }
      exitApp() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getInfo() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getLaunchUrl() {
        return { url: "" };
      }
      async getState() {
        return { isActive: document.hidden !== true };
      }
      async minimizeApp() {
        throw this.unimplemented("Not implemented on web.");
      }
      async toggleBackButtonHandler() {
        throw this.unimplemented("Not implemented on web.");
      }
    };
  }
});

// ts/ui-helpers.ts
init_dist();

// node_modules/@capacitor/haptics/dist/esm/index.js
init_dist();
init_definitions();
var Haptics = registerPlugin("Haptics", {
  web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.HapticsWeb())
});

// ts/ui-helpers.ts
var toastEl = document.getElementById("toast");
var sidebarEl = document.getElementById("sidebar");
var touchStartX = 0;
var touchStartY = 0;
var touchEndX = 0;
var touchEndY = 0;
var isSwipeInitiatedFromEdge = false;
var isPotentiallySwipingSidebar = false;
var SWIPE_THRESHOLD = 60;
var SWIPE_EDGE_THRESHOLD = 60;
var SIDEBAR_SWIPE_CLOSE_THRESHOLD = 80;
var MAX_VERTICAL_SWIPE = 80;
function toggleMenu() {
  sidebarEl?.classList.toggle("open");
}
function handleTouchStart(event) {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isSwipeInitiatedFromEdge = false;
  isPotentiallySwipingSidebar = false;
  if (!sidebarEl) return;
  if (!sidebarEl.classList.contains("open") && touchStartX > window.innerWidth - SWIPE_EDGE_THRESHOLD) {
    isSwipeInitiatedFromEdge = true;
    isPotentiallySwipingSidebar = true;
  } else if (sidebarEl.classList.contains("open") && touchStartX < sidebarEl.offsetWidth + SIDEBAR_SWIPE_CLOSE_THRESHOLD) {
    isSwipeInitiatedFromEdge = true;
    isPotentiallySwipingSidebar = true;
  }
}
function handleTouchMove(event) {
  if (!isPotentiallySwipingSidebar || event.touches.length === 0) return;
  const touch = event.touches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10 && isSwipeInitiatedFromEdge) {
    event.preventDefault();
  }
}
function handleTouchEnd() {
  if (!isSwipeInitiatedFromEdge || !isPotentiallySwipingSidebar || !sidebarEl) {
    isSwipeInitiatedFromEdge = false;
    isPotentiallySwipingSidebar = false;
    return;
  }
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  let menuToggled = false;
  if (Math.abs(deltaY) < MAX_VERTICAL_SWIPE) {
    if (!sidebarEl.classList.contains("open") && deltaX < -SWIPE_THRESHOLD && touchStartX > window.innerWidth - SWIPE_EDGE_THRESHOLD) {
      toggleMenu();
      menuToggled = true;
    } else if (sidebarEl.classList.contains("open") && deltaX > SWIPE_THRESHOLD && touchStartX < sidebarEl.offsetWidth + SIDEBAR_SWIPE_CLOSE_THRESHOLD) {
      toggleMenu();
      menuToggled = true;
    }
  }
  if (menuToggled && Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Light });
  }
  isSwipeInitiatedFromEdge = false;
  isPotentiallySwipingSidebar = false;
  touchStartX = 0;
  touchStartY = 0;
  touchEndX = 0;
  touchEndY = 0;
}
function showToast(msg, isError = false) {
  if (!toastEl) {
    console.error("Toast element not found");
    return;
  }
  toastEl.textContent = msg;
  toastEl.className = "status-toast " + (isError ? "toast-error" : "toast-success");
  toastEl.style.opacity = "1";
  setTimeout(() => {
    toastEl.style.opacity = "0";
  }, 3e3);
}
function toggleSpinner(spinnerElement, show) {
  if (!spinnerElement) {
    return;
  }
  spinnerElement.style.display = show ? "block" : "none";
}
function displayTool(appId, currentToolSectionsMap) {
  const dashboardAppEl = document.getElementById("dashboardApp");
  const appTitleEl = document.getElementById("appTitle");
  if (dashboardAppEl) dashboardAppEl.style.display = "none";
  let currentTitle = "Novelist Tools";
  let toolDisplayed = false;
  for (const id in currentToolSectionsMap) {
    const toolInfo = currentToolSectionsMap[id];
    const appElement = document.getElementById(toolInfo.elementId);
    if (appElement) {
      if (id === appId) {
        appElement.style.display = "block";
        currentTitle = toolInfo.title;
        toolDisplayed = true;
      } else {
        appElement.style.display = "none";
      }
    }
  }
  if (appTitleEl) appTitleEl.textContent = currentTitle;
  if (sidebarEl && sidebarEl.classList.contains("open")) {
    toggleMenu();
  }
  return toolDisplayed;
}
function showDashboard(fromPopStateUpdate = false, currentToolSectionsMap) {
  const dashboardAppEl = document.getElementById("dashboardApp");
  const appTitleEl = document.getElementById("appTitle");
  if (dashboardAppEl) dashboardAppEl.style.display = "block";
  for (const id in currentToolSectionsMap) {
    const toolInfo = currentToolSectionsMap[id];
    const appElement = document.getElementById(toolInfo.elementId);
    if (appElement) appElement.style.display = "none";
  }
  if (appTitleEl) appTitleEl.textContent = "Novelist Tools";
  if (sidebarEl && sidebarEl.classList.contains("open")) {
    toggleMenu();
  }
  const targetHash = "#dashboard";
  if (!fromPopStateUpdate && window.location.hash !== targetHash) {
    const historyUrl = window.location.protocol === "blob:" ? null : targetHash;
    history.pushState({ view: "dashboard" }, "Novelist Tools Dashboard", historyUrl);
    console.log("UI: Pushed history state for Dashboard. URL used:", historyUrl === null ? "null (blob)" : historyUrl);
  } else if (fromPopStateUpdate) {
    console.log("UI: Show Dashboard from popstate, hash is:", window.location.hash);
  }
  sessionStorage.removeItem("activeToolId");
}
function launchAppFromCard(appId, fromPopStateUpdate = false, currentToolSectionsMap) {
  const toolDisplayed = displayTool(appId, currentToolSectionsMap);
  if (!toolDisplayed) {
    console.warn(`Tool with ID '${appId}' not found or failed to launch. Showing dashboard.`);
    showDashboard(fromPopStateUpdate, currentToolSectionsMap);
    if (!fromPopStateUpdate) {
      const targetDashboardHash = "#dashboard";
      const historyUrl = window.location.protocol === "blob:" ? null : targetDashboardHash;
      if (window.location.hash !== targetDashboardHash && historyUrl !== null) {
        history.replaceState({ view: "dashboard" }, "Novelist Tools Dashboard", historyUrl);
      }
    }
    return;
  }
  const toolInfo = currentToolSectionsMap[appId];
  const targetToolHash = `#tool-${appId}`;
  if (!fromPopStateUpdate && window.location.hash !== targetToolHash) {
    if (toolInfo) {
      const historyUrl = window.location.protocol === "blob:" ? null : targetToolHash;
      history.pushState({ view: "tool", toolId: appId }, toolInfo.title, historyUrl);
      console.log(`UI: Pushed history state for tool '${appId}'. URL used:`, historyUrl === null ? "null (blob)" : historyUrl);
    } else {
      console.error(`Tool info not found for ${appId} during pushState, though displayTool succeeded.`);
    }
  } else if (fromPopStateUpdate) {
    console.log(`UI: Launch app '${appId}' from popstate, hash is:`, window.location.hash);
  }
  sessionStorage.setItem("activeToolId", appId);
}

// ts/epub-splitter.ts
init_dist();

// ts/capacitor-helpers.ts
init_dist();

// node_modules/@capacitor/filesystem/dist/esm/index.js
init_dist();

// node_modules/@capacitor/synapse/dist/synapse.mjs
function s(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return new Proxy({}, {
          get(w, o) {
            return (c, p, r) => {
              const i = t.Capacitor.Plugins[n];
              if (i === void 0) {
                r(new Error(`Capacitor plugin ${n} not found`));
                return;
              }
              if (typeof i[o] != "function") {
                r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                return;
              }
              (async () => {
                try {
                  const a = await i[o](c);
                  p(a);
                } catch (a) {
                  r(a);
                }
              })();
            };
          }
        });
      }
    }
  );
}
function u(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return t.cordova.plugins[n];
      }
    }
  );
}
function f(t = false) {
  typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
}

// node_modules/@capacitor/filesystem/dist/esm/index.js
init_definitions2();
var Filesystem = registerPlugin("Filesystem", {
  web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.FilesystemWeb())
});
f();

// ts/capacitor-helpers.ts
async function saveBlobNative(blob, filename, mimeType, showToastFunction) {
  if (!Capacitor.isNativePlatform()) {
    console.log("saveBlobNative: Not on a native platform. Skipping native save.");
    return false;
  }
  const pathInExternalDir = `Downloads/${filename}`;
  console.log(`saveBlobNative: Attempting to save "${filename}" natively to app's external directory: "${pathInExternalDir}" with MIME type "${mimeType}".`);
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);
    console.log(`saveBlobNative: Converted blob to base64. Attempting Filesystem.writeFile to Directory.External.`);
    const writeResult = await Filesystem.writeFile({
      path: pathInExternalDir,
      data: base64Data,
      directory: Directory.External,
      recursive: true
      // Create “Downloads/” if it doesn’t exist
    });
    console.log("saveBlobNative: File saved successfully to app external directory. URI:", writeResult.uri);
    showToastFunction(`File saved: ${filename} (in app folder/Downloads)`, false);
    try {
      console.log(`Attempting to open file: ${writeResult.uri} with MIME: ${mimeType}`);
      const fileOpener = window.cordova?.plugins?.fileOpener2;
      if (fileOpener && typeof fileOpener.open === "function") {
        fileOpener.open(
          writeResult.uri,
          mimeType,
          {
            error: (error) => {
              console.warn("Could not open file automatically with FileOpener:", error);
              let openErrorMessage = `Could not auto-open file: ${error.message}`;
              showToastFunction(openErrorMessage, true);
            },
            success: () => {
              console.log("FileOpener.open call succeeded.");
            }
          }
        );
      } else {
        console.warn("FileOpener plugin is not available. Skipping open.");
        showToastFunction("File saved. Opener not available.", false);
      }
    } catch (e) {
      console.warn("Could not open file automatically with FileOpener plugin:", e);
      let openErrorMessage = "Could not auto-open file";
      if (e && e.message) {
        openErrorMessage += `: ${e.message}`;
      }
      showToastFunction(openErrorMessage, true);
    }
    return true;
  } catch (error) {
    console.error("saveBlobNative: Capacitor Filesystem save error:", error);
    let errorMessage = "Unknown error during save";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error.message === "string") {
      errorMessage = error.message;
    }
    showToastFunction(`Error saving file natively: ${errorMessage}`, true);
    return false;
  }
}
async function triggerDownload(blob, filename, mimeType, showAppToast) {
  const nativeSaveSucceeded = await saveBlobNative(blob, filename, mimeType, showAppToast);
  if (!nativeSaveSucceeded) {
    console.log(`triggerDownload: Native save failed or not native platform. Falling back to web download for "${filename}".`);
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAppToast(`Download started: ${filename}`, false);
    } catch (webDownloadError) {
      console.error("triggerDownload: Web download fallback error:", webDownloadError);
      showAppToast(`Error during web download: ${webDownloadError.message || "Unknown error"}`, true);
    }
  }
}

// ts/epub-splitter.ts
function readFileAsArrayBuffer(file) {
  return new Promise((resolve2, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve2(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
function initializeEpubSplitter(showAppToast, toggleAppSpinner) {
  const uploadInput = document.getElementById("epubUpload");
  const fileNameEl = document.getElementById("epubFileName");
  const clearFileBtn = document.getElementById("clearEpubUpload");
  const splitBtn = document.getElementById("splitBtn");
  const modeSelect = document.getElementById("modeSelect");
  const groupSizeGrp = document.getElementById("groupSizeGroup");
  const statusEl = document.getElementById("statusMessage");
  const downloadSec = document.querySelector("#splitterApp .download-section");
  const downloadLink = document.getElementById("downloadLink");
  const chapterPatternLabel = document.querySelector('label[for="chapterPattern"]');
  const tooltipTrigger = chapterPatternLabel?.querySelector(".tooltip-trigger");
  const chapterPatternEl = document.getElementById("chapterPattern");
  const startNumberEl = document.getElementById("startNumber");
  const offsetNumberEl = document.getElementById("offsetNumber");
  const groupSizeEl = document.getElementById("groupSize");
  const chapterSelectionArea = document.getElementById("splitterChapterSelectionArea");
  const chapterListUl = document.getElementById("splitterChapterList");
  const selectAllChaptersBtn = document.getElementById("splitterSelectAllChapters");
  const deselectAllChaptersBtn = document.getElementById("splitterDeselectAllChapters");
  let selectedFile = null;
  let parsedChaptersForSelection = [];
  if (!uploadInput || !splitBtn || !modeSelect || !fileNameEl || !clearFileBtn || !groupSizeGrp || !statusEl || !downloadSec || !downloadLink || !tooltipTrigger || !chapterPatternEl || !startNumberEl || !offsetNumberEl || !groupSizeEl || !chapterSelectionArea || !chapterListUl || !selectAllChaptersBtn || !deselectAllChaptersBtn) {
    console.error("EPUB Splitter UI elements not found. Initialization failed.");
    return;
  }
  tooltipTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    tooltipTrigger.classList.toggle("active");
  });
  tooltipTrigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      tooltipTrigger.click();
    }
  });
  document.addEventListener("click", (e) => {
    if (tooltipTrigger.classList.contains("active") && !tooltipTrigger.contains(e.target)) {
      tooltipTrigger.classList.remove("active");
    }
  });
  function resetChapterSelectionUI() {
    if (chapterListUl) chapterListUl.innerHTML = "";
    if (chapterSelectionArea) chapterSelectionArea.style.display = "none";
    parsedChaptersForSelection = [];
  }
  function displayChapterSelectionUI(chapters) {
    if (!chapterListUl || !chapterSelectionArea) return;
    chapterListUl.innerHTML = "";
    if (chapters.length === 0) {
      chapterSelectionArea.style.display = "none";
      return;
    }
    chapters.forEach((chapInfo, index) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `splitter-chap-${index}`;
      checkbox.value = index.toString();
      checkbox.checked = true;
      checkbox.setAttribute("data-chapter-index", index.toString());
      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = chapInfo.title;
      li.appendChild(checkbox);
      li.appendChild(label);
      li.addEventListener("click", (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      });
      chapterListUl.appendChild(li);
    });
    chapterSelectionArea.style.display = "block";
  }
  selectAllChaptersBtn.addEventListener("click", () => {
    chapterListUl.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.checked = true);
  });
  deselectAllChaptersBtn.addEventListener("click", () => {
    chapterListUl.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.checked = false);
  });
  uploadInput.addEventListener("change", async (e) => {
    const target = e.target;
    selectedFile = target.files ? target.files[0] : null;
    resetChapterSelectionUI();
    statusEl.style.display = "none";
    downloadSec.style.display = "none";
    if (selectedFile) {
      fileNameEl.textContent = `Selected: ${selectedFile.name}`;
      if (clearFileBtn) clearFileBtn.style.display = "inline-block";
      splitBtn.disabled = true;
      toggleAppSpinner(true);
      try {
        const buffer = await readFileAsArrayBuffer(selectedFile);
        const epub = await JSZip.loadAsync(buffer);
        const tempChapters = [];
        const structure = {};
        const promises = [];
        epub.forEach((path, file) => {
          structure[path] = { dir: file.dir, contentType: file.options.contentType };
          if (!file.dir && (path.endsWith(".xhtml") || path.endsWith(".html") || path.includes("content.opf") || path.includes("toc.ncx"))) {
            promises.push(file.async("text").then((c) => structure[path].content = c));
          }
        });
        await Promise.all(promises);
        const parser = new DOMParser();
        for (let path in structure) {
          const info = structure[path];
          if (!info.dir && info.content) {
            let doc = parser.parseFromString(info.content, "text/xml");
            if (doc.querySelector("parsererror")) {
              doc = parser.parseFromString(info.content, "text/html");
            }
            const sections = doc.querySelectorAll(
              'section[epub\\:type="chapter"], div[epub\\:type="chapter"], section.chapter, div.chapter, section[role="chapter"], div[role="chapter"]'
            );
            if (sections.length) {
              sections.forEach((sec) => {
                sec.querySelectorAll("h1,h2,h3,.title,.chapter-title").forEach((el) => el.remove());
                const paras = sec.querySelectorAll("p");
                const text = paras.length ? Array.from(paras).map((p) => p.textContent?.trim() || "").filter((t) => t).join("\n") : (sec.textContent || "").replace(/\s*\n\s*/g, "\n").trim();
                if (text) tempChapters.push(text);
              });
            } else {
              const headings = doc.querySelectorAll("h1,h2,h3");
              if (headings.length > 1) {
                for (let i = 0; i < headings.length; i++) {
                  let node = headings[i].nextSibling;
                  let content = "";
                  while (node && !(node.nodeType === 1 && /H[1-3]/.test(node.tagName))) {
                    content += node.nodeType === 1 ? node.textContent + "\n" : node.textContent;
                    node = node.nextSibling;
                  }
                  content = content.replace(/\n{3,}/g, "\n").trim();
                  if (content) tempChapters.push(content);
                }
              }
            }
          }
        }
        parsedChaptersForSelection = tempChapters.map((text, index) => ({
          index,
          title: `Chapter ${index + 1} (Preview: ${text.substring(0, 50).replace(/\s+/g, " ")}${text.length > 50 ? "..." : ""})`,
          text
        }));
        if (parsedChaptersForSelection.length > 0) {
          displayChapterSelectionUI(parsedChaptersForSelection);
          splitBtn.disabled = false;
          showAppToast(`Found ${parsedChaptersForSelection.length} potential chapters. Review selection.`, false);
        } else {
          showAppToast("No chapters found for selection. Check EPUB structure.", true);
          statusEl.textContent = "Error: No chapters found for selection. Check EPUB structure.";
          statusEl.className = "status error";
          statusEl.style.display = "block";
          splitBtn.disabled = true;
        }
      } catch (err) {
        console.error("EPUB parsing for chapter selection failed:", err);
        showAppToast(`Error parsing EPUB for chapter list: ${err.message}`, true);
        statusEl.textContent = `Error: ${err.message || "Could not parse EPUB for chapter list."}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
        splitBtn.disabled = true;
      } finally {
        toggleAppSpinner(false);
      }
    } else {
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
      splitBtn.disabled = true;
    }
  });
  clearFileBtn.addEventListener("click", () => {
    selectedFile = null;
    uploadInput.value = "";
    fileNameEl.textContent = "";
    clearFileBtn.style.display = "none";
    splitBtn.disabled = true;
    statusEl.style.display = "none";
    downloadSec.style.display = "none";
    resetChapterSelectionUI();
  });
  modeSelect.addEventListener("change", () => {
    if (groupSizeGrp) {
      groupSizeGrp.style.display = modeSelect.value === "grouped" ? "block" : "none";
    }
  });
  splitBtn.addEventListener("click", async () => {
    statusEl.style.display = "none";
    downloadSec.style.display = "none";
    if (!selectedFile) {
      showAppToast("No file selected for EPUB splitting.", true);
      statusEl.textContent = "Error: No file selected.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      uploadInput.focus();
      return;
    }
    if (parsedChaptersForSelection.length === 0) {
      showAppToast("No chapters available for splitting. Please re-upload or check the EPUB.", true);
      statusEl.textContent = "Error: No chapters available for splitting.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      return;
    }
    const selectedChapterIndices = [];
    chapterListUl.querySelectorAll('input[type="checkbox"]:checked').forEach((cb) => {
      const index = parseInt(cb.value, 10);
      selectedChapterIndices.push(index);
    });
    if (selectedChapterIndices.length === 0) {
      showAppToast("No chapters selected to split. Please select at least one chapter.", true);
      statusEl.textContent = "Error: No chapters selected to split.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      return;
    }
    const chaptersToProcess = parsedChaptersForSelection.filter((chapInfo) => selectedChapterIndices.includes(chapInfo.index)).map((chapInfo) => chapInfo.text);
    const pattern = chapterPatternEl.value.trim() || "Chapter";
    const startNumber = parseInt(startNumberEl.value, 10);
    if (isNaN(startNumber) || startNumber < 1) {
      showAppToast("Start Number must be 1 or greater.", true);
      statusEl.textContent = "Error: Start Number must be 1 or greater.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      startNumberEl.focus();
      return;
    }
    const offset = parseInt(offsetNumberEl.value, 10);
    if (isNaN(offset) || offset < 0) {
      showAppToast("Offset must be 0 or greater.", true);
      statusEl.textContent = "Error: Offset must be 0 or greater.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      offsetNumberEl.focus();
      return;
    }
    const mode = modeSelect.value;
    let groupSize = 1;
    if (mode === "grouped") {
      groupSize = parseInt(groupSizeEl.value, 10);
      if (isNaN(groupSize) || groupSize < 1) {
        showAppToast("Chapters per File (for grouped mode) must be 1 or greater.", true);
        statusEl.textContent = "Error: Chapters per File must be 1 or greater.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
        groupSizeEl.focus();
        return;
      }
    }
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    toggleAppSpinner(true);
    try {
      const usableChaps = chaptersToProcess.slice(offset);
      if (usableChaps.length === 0) {
        showAppToast(`Offset of ${offset} resulted in no chapters to process from your selection.`, true);
        statusEl.textContent = `Warning: Offset of ${offset} resulted in 0 chapters to process from selection.`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
        toggleAppSpinner(false);
        return;
      }
      const effectiveStart = startNumber;
      const zip = new JSZip();
      if (mode === "single") {
        usableChaps.forEach((text, i) => {
          const chapNum = String(effectiveStart + i).padStart(2, "0");
          zip.file(`${pattern}${chapNum}.txt`, text);
        });
      } else {
        for (let i = 0; i < usableChaps.length; i += groupSize) {
          const groupStartNum = effectiveStart + i;
          const groupEndNum = Math.min(
            effectiveStart + i + groupSize - 1,
            effectiveStart + usableChaps.length - 1
          );
          const name = groupStartNum === groupEndNum ? `${pattern}${String(groupStartNum).padStart(2, "0")}.txt` : `${pattern}${String(groupStartNum).padStart(2, "0")}-${String(groupEndNum).padStart(2, "0")}.txt`;
          let content = "";
          for (let j = 0; j < groupSize && i + j < usableChaps.length; j++) {
            if (j > 0) content += "\n\n\n---------------- END ----------------\n\n\n";
            content += usableChaps[i + j];
          }
          zip.file(name, content);
        }
      }
      const { blob, count } = await zip.generateAsync({ type: "blob" }).then((blob2) => ({ blob: blob2, count: usableChaps.length }));
      if (downloadLink) {
        const downloadFilename = `${pattern}_chapters.zip`;
        const nativeSaveSucceeded = await saveBlobNative(blob, downloadFilename, "application/zip", showAppToast);
        if (!nativeSaveSucceeded) {
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = downloadFilename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(downloadLink.href);
        }
      }
      downloadSec.style.display = "block";
      statusEl.textContent = `Extracted ${count} chapter(s) from your selection. Download started.`;
      statusEl.className = "status success";
      statusEl.style.display = "block";
      showAppToast(`Extracted ${count} chapter(s).`);
    } catch (err) {
      console.error("EPUB Splitter Error:", err);
      statusEl.textContent = `Error: ${err.message}`;
      statusEl.className = "status error";
      statusEl.style.display = "block";
      showAppToast(`Error splitting EPUB: ${err.message}`, true);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/zip-to-epub.ts
init_dist();
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function sanitizeForXML(str) {
  if (!str) return "";
  return str.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function escapeHTML(str) {
  if (typeof str !== "string") {
    return "";
  }
  return str.replace(/[&<>"']/g, function(match) {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });
}
function escapeAndProcessInlines(line) {
  let processedLine = line.replace(/\*\*(.*?)\*\*|__(.*?)__/g, "%%STRONG_START%%$1$2%%STRONG_END%%").replace(/\*(.*?)\*|_(.*?)_/g, "%%EM_START%%$1$2%%EM_END%%");
  processedLine = escapeHTML(processedLine);
  processedLine = processedLine.replace(/%%STRONG_START%%/g, "<strong>").replace(/%%STRONG_END%%/g, "</strong>").replace(/%%EM_START%%/g, "<em>").replace(/%%EM_END%%/g, "</em>");
  return processedLine;
}
function textToXHTML(text, chapterTitle, useMarkdown, language) {
  const bodyContent = `<h2>${escapeHTML(chapterTitle)}</h2>
`;
  let chapterBody = "";
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      let lineHtml = "";
      if (useMarkdown) {
        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const content = headingMatch[2];
          lineHtml = `  <h${level}>${escapeAndProcessInlines(content)}</h${level}>
`;
        } else {
          const processedLine = escapeAndProcessInlines(trimmedLine);
          lineHtml = `    <p>${processedLine}</p>
`;
        }
      } else {
        lineHtml = `    <p>${escapeHTML(trimmedLine)}</p>
`;
      }
      chapterBody += lineHtml;
    } else if (line.length === 0) {
      chapterBody += "    <p>&nbsp;</p>\n";
    }
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeHTML(language)}">
<head>
  <title>${escapeHTML(chapterTitle)}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css" /> 
</head>
<body>
  <section epub:type="chapter">
${bodyContent}${chapterBody}  </section>
</body>
</html>`;
}
function initializeZipToEpub(showAppToast, toggleAppSpinner) {
  const zipUploadInput = document.getElementById("zipUploadForEpub");
  const zipFileNameEl = document.getElementById("zipFileNameForEpub");
  const clearZipBtn = document.getElementById("clearZipUploadForEpub");
  const epubTitleInput = document.getElementById("epubTitle");
  const epubAuthorInput = document.getElementById("epubAuthor");
  const epubLangInput = document.getElementById("epubLanguage");
  const epubCoverImageInput = document.getElementById("epubCoverImage");
  const epubCoverFileNameEl = document.getElementById("epubCoverFileName");
  const clearCoverBtn = document.getElementById("clearEpubCoverImage");
  const processMarkdownCheckbox = document.getElementById("processMarkdown");
  const chapterArea = document.getElementById("zipToEpubChapterArea");
  const chapterListUl = document.getElementById("zipToEpubChapterList");
  const createBtn = document.getElementById("createEpubBtn");
  const statusEl = document.getElementById("statusMessageZipToEpub");
  const downloadSec = document.getElementById("downloadSectionZipToEpub");
  const downloadLink = document.getElementById("downloadLinkEpub");
  let selectedZipFile = null;
  let selectedCoverFile = null;
  let chapters = [];
  let draggedItem = null;
  if (!zipUploadInput || !createBtn || !zipFileNameEl || !clearZipBtn || !epubTitleInput || !epubAuthorInput || !epubLangInput || !epubCoverImageInput || !epubCoverFileNameEl || !clearCoverBtn || !processMarkdownCheckbox || !chapterArea || !chapterListUl || !statusEl || !downloadSec || !downloadLink) {
    console.error("ZIP to EPUB UI elements not found. Initialization failed.");
    return;
  }
  function resetUI(full = false) {
    if (downloadSec) downloadSec.style.display = "none";
    if (statusEl) statusEl.style.display = "none";
    if (chapterArea) chapterArea.style.display = "none";
    if (chapterListUl) chapterListUl.innerHTML = "";
    chapters = [];
    if (full) {
      selectedZipFile = null;
      zipUploadInput.value = "";
      zipFileNameEl.textContent = "";
      clearZipBtn.style.display = "none";
      createBtn.disabled = true;
    }
  }
  function renderChapterList() {
    if (!chapterListUl) return;
    chapterListUl.innerHTML = "";
    chapters.forEach((chapter) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.name = chapter.name;
      const handle = document.createElement("span");
      handle.className = "drag-handle";
      handle.textContent = "\u2630";
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "chapter-title-input";
      titleInput.value = chapter.title;
      titleInput.ariaLabel = `Title for chapter ${chapter.name}`;
      titleInput.addEventListener("input", () => {
        const chapterToUpdate = chapters.find((c) => c.name === chapter.name);
        if (chapterToUpdate) {
          chapterToUpdate.title = titleInput.value;
        }
      });
      li.appendChild(handle);
      li.appendChild(titleInput);
      chapterListUl.appendChild(li);
    });
  }
  chapterListUl.addEventListener("dragstart", (e) => {
    draggedItem = e.target;
    setTimeout(() => {
      if (draggedItem) draggedItem.classList.add("dragging");
    }, 0);
  });
  chapterListUl.addEventListener("dragend", () => {
    if (draggedItem) {
      draggedItem.classList.remove("dragging");
      draggedItem = null;
    }
  });
  chapterListUl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(chapterListUl, e.clientY);
    const currentDragged = document.querySelector(".dragging");
    if (currentDragged) {
      if (afterElement == null) {
        chapterListUl.appendChild(currentDragged);
      } else {
        chapterListUl.insertBefore(currentDragged, afterElement);
      }
    }
  });
  chapterListUl.addEventListener("drop", (e) => {
    e.preventDefault();
    const newOrderedNames = Array.from(chapterListUl.querySelectorAll("li")).map((li) => li.dataset.name);
    chapters.sort((a, b) => {
      const indexA = newOrderedNames.indexOf(a.name);
      const indexB = newOrderedNames.indexOf(b.name);
      return indexA - indexB;
    });
  });
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }
  zipUploadInput.addEventListener("change", async (e) => {
    const target = e.target;
    resetUI();
    selectedZipFile = target.files ? target.files[0] : null;
    if (selectedZipFile) {
      zipFileNameEl.textContent = `Selected ZIP: ${selectedZipFile.name}`;
      if (clearZipBtn) clearZipBtn.style.display = "inline-block";
      createBtn.disabled = true;
      toggleAppSpinner(true);
      try {
        const contentZip = await JSZip.loadAsync(selectedZipFile);
        const chapterPromises = [];
        contentZip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith(".txt")) {
            chapterPromises.push(
              zipEntry.async("string").then((text) => ({
                name: zipEntry.name,
                content: text,
                title: zipEntry.name.replace(/\.txt$/i, "").replace(/_/g, " ")
              }))
            );
          }
        });
        const loadedChapters = (await Promise.all(chapterPromises)).filter(Boolean);
        if (loadedChapters.length === 0) {
          throw new Error("No .txt files found in the uploaded ZIP.");
        }
        loadedChapters.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
        chapters = loadedChapters;
        renderChapterList();
        chapterArea.style.display = "block";
        createBtn.disabled = false;
      } catch (err) {
        showAppToast(`Error reading ZIP: ${err.message}`, true);
        resetUI(true);
      } finally {
        toggleAppSpinner(false);
      }
    } else {
      resetUI(true);
    }
  });
  clearZipBtn.addEventListener("click", () => {
    resetUI(true);
  });
  epubCoverImageInput.addEventListener("change", (e) => {
    const target = e.target;
    selectedCoverFile = target.files ? target.files[0] : null;
    if (selectedCoverFile) {
      epubCoverFileNameEl.textContent = `Cover: ${selectedCoverFile.name}`;
      if (clearCoverBtn) clearCoverBtn.style.display = "inline-block";
    } else {
      epubCoverFileNameEl.textContent = "";
      if (clearCoverBtn) clearCoverBtn.style.display = "none";
    }
  });
  clearCoverBtn.addEventListener("click", () => {
    selectedCoverFile = null;
    epubCoverImageInput.value = "";
    epubCoverFileNameEl.textContent = "";
    clearCoverBtn.style.display = "none";
  });
  createBtn.addEventListener("click", async () => {
    if (statusEl) statusEl.style.display = "none";
    if (chapters.length === 0) {
      showAppToast("Please upload a ZIP file with .txt chapters.", true);
      statusEl.textContent = "Error: No chapters loaded to create an EPUB.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      zipUploadInput.focus();
      return;
    }
    const title = epubTitleInput.value.trim();
    if (!title) {
      showAppToast("EPUB Title is required.", true);
      statusEl.textContent = "Error: EPUB Title is required.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      epubTitleInput.focus();
      return;
    }
    const author = epubAuthorInput.value.trim();
    if (!author) {
      showAppToast("Author is required.", true);
      statusEl.textContent = "Error: Author is required.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      epubAuthorInput.focus();
      return;
    }
    const language = epubLangInput.value.trim() || "en";
    const useMarkdown = processMarkdownCheckbox.checked;
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    const bookUUID = `urn:uuid:${generateUUID()}`;
    toggleAppSpinner(true);
    if (downloadSec) downloadSec.style.display = "none";
    try {
      const epubZip = new JSZip();
      epubZip.file("mimetype", "application/epub+zip", { compression: "STORE" });
      const containerXML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
      epubZip.folder("META-INF")?.file("container.xml", containerXML);
      const oebps = epubZip.folder("OEBPS");
      if (!oebps) throw new Error("Could not create OEBPS folder.");
      const cssFolder = oebps.folder("css");
      const textFolder = oebps.folder("text");
      const imagesFolder = oebps.folder("images");
      const basicCSS = `body { font-family: sans-serif; line-height: 1.6; margin: 1em; }
h1, h2, h3, h4, h5, h6 { text-align: center; line-height: 1.3; }
p { text-indent: 1.5em; margin-top: 0; margin-bottom: 0.5em; text-align: justify; }
.cover { text-align: center; margin: 0; padding: 0; height: 100vh; page-break-after: always; }
.cover img { max-width: 100%; max-height: 100vh; object-fit: contain; }`;
      cssFolder.file("style.css", basicCSS);
      const manifestItems = [
        { id: "css", href: "css/style.css", "media-type": "text/css" },
        { id: "nav", href: "nav.xhtml", "media-type": "application/xhtml+xml", properties: "nav" }
      ];
      const spineItems = [];
      const navLiItems = [];
      const ncxNavPoints = [];
      let playOrder = 1;
      if (selectedCoverFile) {
        const coverExt = selectedCoverFile.name.split(".").pop()?.toLowerCase() || "png";
        const coverImageFilename = `cover.${coverExt}`;
        const coverMediaType = coverExt === "jpg" || coverExt === "jpeg" ? "image/jpeg" : "image/png";
        const coverImageData = await selectedCoverFile.arrayBuffer();
        imagesFolder.file(coverImageFilename, coverImageData);
        manifestItems.push({ id: "cover-image", href: `images/${coverImageFilename}`, "media-type": coverMediaType, properties: "cover-image" });
        const coverXHTMLContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${language}">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css" />
</head>
<body>
  <div class="cover">
    <img src="../images/${coverImageFilename}" alt="Cover Image"/>
  </div>
</body>
</html>`;
        textFolder.file("cover.xhtml", coverXHTMLContent);
        manifestItems.push({ id: "cover-page", href: "text/cover.xhtml", "media-type": "application/xhtml+xml" });
        spineItems.push({ idref: "cover-page", linear: "no" });
      }
      chapters.forEach((chapter, i) => {
        const chapterBaseName = sanitizeForXML(chapter.title) || `chapter_${i + 1}`;
        const chapterFilename = `${chapterBaseName}.xhtml`;
        const xhtmlContent = textToXHTML(chapter.content, chapter.title, useMarkdown, language);
        textFolder.file(chapterFilename, xhtmlContent);
        const itemId = `chapter-${i + 1}`;
        manifestItems.push({ id: itemId, href: `text/${chapterFilename}`, "media-type": "application/xhtml+xml" });
        spineItems.push({ idref: itemId, linear: "yes" });
        navLiItems.push(`<li><a href="text/${chapterFilename}">${escapeHTML(chapter.title)}</a></li>`);
        ncxNavPoints.push(`
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>${escapeHTML(chapter.title)}</text></navLabel>
      <content src="text/${chapterFilename}"/>
    </navPoint>`);
        playOrder++;
      });
      const navXHTMLContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${language}">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="css/style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${navLiItems.join("\n      ")}
    </ol>
  </nav>
</body>
</html>`;
      oebps.file("nav.xhtml", navXHTMLContent);
      const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookUUID}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeHTML(title)}</text></docTitle>
  <navMap>
    ${ncxNavPoints.join("\n    ")}
  </navMap>
</ncx>`;
      oebps.file("toc.ncx", ncxContent);
      manifestItems.push({ id: "ncx", href: "toc.ncx", "media-type": "application/x-dtbncx+xml" });
      let manifestXML = manifestItems.map((item) => {
        let props = item.properties ? ` properties="${item.properties}"` : "";
        return `<item id="${item.id}" href="${item.href}" media-type="${item["media-type"]}"${props}/>`;
      }).join("\n    ");
      let spineXML = spineItems.map((item) => {
        let linearAttr = item.linear ? ` linear="${item.linear}"` : "";
        return `<itemref idref="${item.idref}"${linearAttr}/>`;
      }).join("\n    ");
      const contentOPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${bookUUID}</dc:identifier>
    <dc:title>${escapeHTML(title)}</dc:title>
    <dc:language>${language}</dc:language>
    <dc:creator id="creator">${escapeHTML(author)}</dc:creator>
    <meta property="dcterms:modified">${(/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z")}</meta>
    ${selectedCoverFile ? '<meta name="cover" content="cover-image"/>' : ""}
  </metadata>
  <manifest>
    ${manifestXML}
  </manifest>
  <spine toc="ncx">
    ${spineXML}
  </spine>
</package>`;
      oebps.file("content.opf", contentOPF);
      const epubBlob = await epubZip.generateAsync({
        type: "blob",
        mimeType: "application/epub+zip",
        compression: "DEFLATE"
      });
      if (downloadLink) {
        const safeFileName = title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "generated_epub";
        const downloadFilename = `${safeFileName}.epub`;
        const nativeSaveSucceeded = await saveBlobNative(epubBlob, downloadFilename, "application/epub+zip", showAppToast);
        if (!nativeSaveSucceeded) {
          downloadLink.href = URL.createObjectURL(epubBlob);
          downloadLink.download = downloadFilename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(downloadLink.href);
        }
      }
      if (downloadSec) downloadSec.style.display = "block";
      statusEl.textContent = `EPUB "${title}" created successfully with ${chapters.length} chapter(s). Download started.`;
      statusEl.className = "status success";
      statusEl.style.display = "block";
      showAppToast("EPUB created successfully!");
    } catch (err) {
      console.error("ZIP to EPUB Error:", err);
      statusEl.textContent = `Error: ${err.message}`;
      statusEl.className = "status error";
      statusEl.style.display = "block";
      showAppToast(`Error creating EPUB: ${err.message}`, true);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/epub-to-zip.ts
init_dist();
var currentZipInstance = null;
var currentTocEntries = [];
var currentOpfDirPath = "";
var currentEpubFilename = "";
var domParser = new DOMParser();
function readFileAsArrayBuffer2(file) {
  return new Promise((resolve2, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve2(event.target?.result);
    reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
    reader.readAsArrayBuffer(file);
  });
}
async function readFileFromZip(zip, path) {
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
  const fileEntry = zip.file(normalizedPath);
  if (!fileEntry) {
    console.error(`File not found in EPUB archive: ${normalizedPath}`);
    return null;
  }
  try {
    const content = await fileEntry.async("string");
    return { path: normalizedPath, content };
  } catch (err) {
    console.error(`Error reading file "${normalizedPath}" from zip:`, err);
    return null;
  }
}
function parseXml(xmlString, sourceFileName = "XML") {
  try {
    const doc = domParser.parseFromString(xmlString, "application/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      console.error(`XML Parsing Error in ${sourceFileName}:`, errorNode.textContent);
      return null;
    }
    return doc;
  } catch (e) {
    console.error(`Exception during XML parsing of ${sourceFileName}:`, e);
    return null;
  }
}
function parseHtml(htmlString, sourceFileName = "HTML") {
  try {
    const doc = domParser.parseFromString(htmlString, "text/html");
    if (!doc || !doc.body && !doc.documentElement) {
      console.warn(`Parsed HTML for ${sourceFileName} seems empty or invalid.`);
    }
    return doc;
  } catch (e) {
    console.error(`Exception during HTML parsing of ${sourceFileName}:`, e);
    return null;
  }
}
function extractTextFromHtml(htmlString) {
  try {
    const PARA_BREAK_MARKER = " \uE000P\uE000 ";
    const LINE_BREAK_MARKER = " \uE000L\uE000 ";
    let processedHtml = htmlString;
    processedHtml = processedHtml.replace(/<\/(p|h[1-6]|div|li|blockquote|pre|section|article|aside|header|footer|nav|figure|figcaption|table|tr|th|td)>\s*/gi, "$&" + PARA_BREAK_MARKER);
    processedHtml = processedHtml.replace(/<br\s*\/?>/gi, LINE_BREAK_MARKER);
    const doc = domParser.parseFromString(processedHtml, "text/html");
    const body = doc.body;
    if (!body) {
      console.warn("HTML string appears to lack a <body> tag, attempting fallback.");
      let fallbackText = doc.documentElement?.innerText || doc.documentElement?.textContent || "";
      return fallbackText.trim();
    }
    body.querySelectorAll("script, style").forEach((el) => el.remove());
    let text = body.textContent || "";
    text = text.replace(new RegExp(PARA_BREAK_MARKER.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), "\n\n");
    text = text.replace(new RegExp(LINE_BREAK_MARKER.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), "\n");
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/ *\n */g, "\n");
    text = text.replace(/\n{3,}/g, "\n\n");
    return text.trim();
  } catch (e) {
    console.error("Error extracting text from HTML:", e);
    return "";
  }
}
function resolvePath(relativePath, baseDirPath) {
  if (!relativePath) return "";
  if (!baseDirPath) {
    return relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
  }
  try {
    const baseUrl = `file:///${baseDirPath}/`;
    const resolvedUrl = new URL(relativePath, baseUrl);
    let resolved = resolvedUrl.pathname.substring(1);
    return decodeURIComponent(resolved);
  } catch (e) {
    console.error(`Error resolving path: relative="${relativePath}", base="${baseDirPath}"`, e);
    const simplePath = (baseDirPath + "/" + relativePath).replace(/\/+/g, "/");
    console.warn(`Falling back to simple path concatenation: ${simplePath}`);
    return simplePath;
  }
}
function sanitizeFilenameForZip(name) {
  if (!name) return "download";
  let sanitized = name.replace(/[^\p{L}\p{N}._-]+/gu, "_");
  sanitized = sanitized.replace(/__+/g, "_");
  sanitized = sanitized.replace(/^[_.-]+|[_.-]+$/g, "");
  sanitized = sanitized.substring(0, 100);
  return sanitized || "file";
}
async function triggerDownload2(blob, filename, mimeType, showAppToast) {
  const nativeSaveSucceeded = await saveBlobNative(blob, filename, mimeType, showAppToast);
  if (!nativeSaveSucceeded) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
function delay(ms) {
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}
async function findOpfPath(zip) {
  const containerPath = "META-INF/container.xml";
  const containerContent = await readFileFromZip(zip, containerPath);
  if (!containerContent) return null;
  const containerDoc = parseXml(containerContent.content, containerPath);
  if (!containerDoc) return null;
  const rootfileElement = containerDoc.querySelector("rootfile[full-path]");
  const rootfilePath = rootfileElement?.getAttribute("full-path");
  if (!rootfilePath) {
    console.error("Cannot find rootfile[full-path] attribute in container.xml");
    return null;
  }
  const opfDir = rootfilePath.includes("/") ? rootfilePath.substring(0, rootfilePath.lastIndexOf("/")) : "";
  return { path: rootfilePath, dir: opfDir };
}
function findTocHref(opfDoc) {
  const navItem = opfDoc.querySelector('manifest > item[properties~="nav"]');
  if (navItem) {
    const href = navItem.getAttribute("href");
    if (href) {
      console.log("Found EPUB3 NAV ToC reference:", href);
      return { href, type: "nav" };
    }
  }
  const spineTocAttr = opfDoc.querySelector("spine[toc]");
  if (spineTocAttr) {
    const ncxId = spineTocAttr.getAttribute("toc");
    if (ncxId) {
      const ncxItem = opfDoc.querySelector(`manifest > item[id="${ncxId}"]`);
      if (ncxItem) {
        const href = ncxItem.getAttribute("href");
        if (href) {
          console.log("Found EPUB2 NCX ToC reference:", href);
          return { href, type: "ncx" };
        }
      }
    }
  }
  return null;
}
function extractChaptersFromNcx(ncxDoc, baseDir) {
  const chapters = [];
  let originalIndex = 0;
  const navPoints = ncxDoc.querySelectorAll("navMap navPoint");
  navPoints.forEach((point) => {
    const label = point.querySelector("navLabel > text")?.textContent?.trim();
    const contentSrc = point.querySelector("content")?.getAttribute("src");
    if (label && contentSrc) {
      const href = resolvePath(contentSrc.split("#")[0], baseDir);
      chapters.push({ title: label, href, id: `epubzip-chap-${originalIndex}`, originalIndex: originalIndex++ });
    }
  });
  return chapters;
}
function extractChaptersFromNav(navDoc, baseDir) {
  const chapters = [];
  let originalIndex = 0;
  let tocList = navDoc.querySelector('nav[epub\\:type="toc"] ol, nav#toc ol, nav.toc ol');
  if (!tocList && navDoc.body) {
    tocList = navDoc.body.querySelector("ol");
    if (tocList) console.warn("Using generic 'ol' fallback for NAV ToC list.");
  }
  if (tocList) {
    const links = tocList.querySelectorAll(":scope > li > a[href]");
    links.forEach((link) => {
      const label = (link.textContent || "").replace(/\s+/g, " ").trim();
      const rawHref = link.getAttribute("href");
      if (label && rawHref) {
        const href = resolvePath(rawHref.split("#")[0], baseDir);
        chapters.push({ title: label, href, id: `epubzip-chap-${originalIndex}`, originalIndex: originalIndex++ });
      }
    });
  } else {
    console.warn("Could not find a suitable <ol> list within the NAV document for the Table of Contents.");
  }
  return chapters;
}
function deduplicateChapters(chapters) {
  const uniqueChapters = [];
  const seenHrefs = /* @__PURE__ */ new Set();
  for (const chapter of chapters) {
    if (chapter.href && !seenHrefs.has(chapter.href)) {
      uniqueChapters.push(chapter);
      seenHrefs.add(chapter.href);
    } else if (seenHrefs.has(chapter.href)) {
      console.log(`Duplicate chapter href found and removed: ${chapter.href} (Title: ${chapter.title})`);
    } else {
      console.warn(`Chapter entry skipped due to missing href: (Title: ${chapter.title})`);
    }
  }
  return uniqueChapters;
}
async function getChapterListFromEpub(zip, updateAppStatus) {
  currentOpfDirPath = "";
  currentTocEntries = [];
  const opfPathData = await findOpfPath(zip);
  if (!opfPathData) {
    updateAppStatus("Error: Could not find EPUB's OPF file.", true);
    return [];
  }
  currentOpfDirPath = opfPathData.dir;
  const opfContentFile = await readFileFromZip(zip, opfPathData.path);
  if (!opfContentFile) {
    updateAppStatus(`Error: Could not read OPF file at ${opfPathData.path}`, true);
    return [];
  }
  const opfDoc = parseXml(opfContentFile.content, opfContentFile.path);
  if (!opfDoc) {
    updateAppStatus(`Error: Could not parse OPF XML at ${opfPathData.path}`, true);
    return [];
  }
  const tocInfo = findTocHref(opfDoc);
  if (!tocInfo) {
    updateAppStatus("Warning: No standard Table of Contents (NAV/NCX) link found in OPF.", true);
    return [];
  }
  const tocFullPath = resolvePath(tocInfo.href, currentOpfDirPath);
  const tocContentFile = await readFileFromZip(zip, tocFullPath);
  if (!tocContentFile) {
    updateAppStatus(`Error: ToC file not found at ${tocFullPath}`, true);
    return [];
  }
  let chapters;
  if (tocInfo.type === "ncx") {
    const ncxDoc = parseXml(tocContentFile.content, tocContentFile.path);
    chapters = ncxDoc ? extractChaptersFromNcx(ncxDoc, currentOpfDirPath) : [];
    if (!ncxDoc) updateAppStatus(`Error: Could not parse NCX file XML at ${tocContentFile.path}`, true);
  } else {
    const navDoc = parseHtml(tocContentFile.content, tocContentFile.path);
    chapters = navDoc ? extractChaptersFromNav(navDoc, currentOpfDirPath) : [];
    if (!navDoc) updateAppStatus(`Error: Could not parse NAV file HTML at ${tocContentFile.path}`, true);
  }
  currentTocEntries = deduplicateChapters(chapters);
  return currentTocEntries;
}
function initializeEpubToZip(showAppToast, toggleAppSpinner) {
  const fileInput = document.getElementById("epubUploadForTxt");
  const fileNameEl = document.getElementById("epubFileNameForTxt");
  const clearFileBtn = document.getElementById("clearEpubUploadForTxt");
  const extractBtn = document.getElementById("extractChaptersBtn");
  const statusEl = document.getElementById("statusMessageEpubToZip");
  const downloadSec = document.getElementById("downloadSectionEpubToZip");
  const downloadLink = document.getElementById("downloadLinkZipFromEpub");
  const enableRemoveLinesToggle = document.getElementById("epubToZipEnableRemoveLines");
  const removeLinesOptionsGroup = document.getElementById("epubToZipRemoveLinesOptionsGroup");
  const linesToRemoveInput = document.getElementById("epubToZipLinesToRemove");
  const chapterSelectionArea = document.getElementById("epubToZipChapterSelectionArea");
  const chapterListUl = document.getElementById("epubToZipChapterList");
  const selectAllChaptersBtn = document.getElementById("epubToZipSelectAllChapters");
  const deselectAllChaptersBtn = document.getElementById("epubToZipDeselectAllChapters");
  if (!fileInput || !extractBtn || !enableRemoveLinesToggle || !removeLinesOptionsGroup || !linesToRemoveInput || !fileNameEl || !clearFileBtn || !statusEl || !downloadSec || !downloadLink || !chapterSelectionArea || !chapterListUl || !selectAllChaptersBtn || !deselectAllChaptersBtn) {
    console.error("EPUB to ZIP UI elements not found.");
    return;
  }
  enableRemoveLinesToggle.addEventListener("change", (e) => {
    const target = e.target;
    if (removeLinesOptionsGroup) {
      removeLinesOptionsGroup.style.display = target.checked ? "block" : "none";
    }
  });
  function updateLocalStatus(message, isError = false) {
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.display = "block";
      statusEl.className = isError ? "status error" : "status success";
    }
    if (isError) showAppToast(message, true);
    else if (message.toLowerCase().includes("download started") || message.toLowerCase().includes("file saved") || message.toLowerCase().includes("found") || message.toLowerCase().includes("reading")) {
      showAppToast(message, false);
    }
  }
  function resetChapterSelectionUI() {
    if (chapterListUl) chapterListUl.innerHTML = "";
    if (chapterSelectionArea) chapterSelectionArea.style.display = "none";
  }
  function displayChapterSelectionList(tocEntries) {
    if (!chapterListUl || !chapterSelectionArea) return;
    chapterListUl.innerHTML = "";
    if (tocEntries.length === 0) {
      chapterSelectionArea.style.display = "none";
      return;
    }
    tocEntries.forEach((entry) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = entry.id || `epubzip-chap-${entry.originalIndex}`;
      checkbox.value = entry.originalIndex !== void 0 ? entry.originalIndex.toString() : entry.href;
      checkbox.checked = true;
      checkbox.setAttribute("data-chapter-href", entry.href);
      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = entry.title;
      li.appendChild(checkbox);
      li.appendChild(label);
      chapterListUl.appendChild(li);
    });
    chapterSelectionArea.style.display = "block";
  }
  selectAllChaptersBtn.addEventListener("click", () => {
    chapterListUl.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.checked = true);
  });
  deselectAllChaptersBtn.addEventListener("click", () => {
    chapterListUl.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.checked = false);
  });
  function resetUIState(fullReset = true) {
    updateLocalStatus("Select an EPUB file.");
    if (downloadSec) downloadSec.style.display = "none";
    extractBtn.disabled = true;
    currentZipInstance = null;
    currentTocEntries = [];
    currentOpfDirPath = "";
    currentEpubFilename = "";
    resetChapterSelectionUI();
    if (fullReset) {
      fileInput.value = "";
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
    }
    if (enableRemoveLinesToggle) enableRemoveLinesToggle.checked = false;
    if (removeLinesOptionsGroup) removeLinesOptionsGroup.style.display = "none";
    if (linesToRemoveInput) linesToRemoveInput.value = "1";
  }
  clearFileBtn.addEventListener("click", () => {
    resetUIState(true);
  });
  fileInput.addEventListener("change", async (event) => {
    const target = event.target;
    const file = target.files ? target.files[0] : null;
    resetUIState(false);
    if (!file) {
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
      extractBtn.disabled = true;
      return;
    }
    if (!file.name.toLowerCase().endsWith(".epub")) {
      updateLocalStatus("Error: Please select a valid .epub file.", true);
      fileInput.value = "";
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
      extractBtn.disabled = true;
      return;
    }
    currentEpubFilename = file.name;
    fileNameEl.textContent = `Selected: ${file.name}`;
    if (clearFileBtn) clearFileBtn.style.display = "inline-block";
    updateLocalStatus(`Reading ${file.name}...`);
    toggleAppSpinner(true);
    try {
      const arrayBuffer = await readFileAsArrayBuffer2(file);
      updateLocalStatus("Unzipping EPUB...");
      currentZipInstance = await JSZip.loadAsync(arrayBuffer);
      updateLocalStatus("Parsing Table of Contents...");
      const chapters = await getChapterListFromEpub(currentZipInstance, updateLocalStatus);
      if (chapters.length > 0) {
        displayChapterSelectionList(chapters);
        updateLocalStatus(`Found ${chapters.length} chapters. Review selection and options.`);
        extractBtn.disabled = false;
      } else {
        let existingMessage = statusEl?.textContent || "";
        if (!existingMessage.toLowerCase().includes("error") && !existingMessage.toLowerCase().includes("warning")) {
          updateLocalStatus("No chapters found or ToC unparsable. EPUB might lack a standard ToC or be structured differently.", true);
        } else if (existingMessage.toLowerCase().includes("warning")) {
          updateLocalStatus("Table of Contents link was found, but no chapter items could be extracted. Check EPUB structure.", true);
        }
        extractBtn.disabled = true;
      }
    } catch (error) {
      console.error("EPUB selection/parsing Error:", error);
      updateLocalStatus(`Error: ${error.message || "Could not process EPUB."}`, true);
      resetUIState(true);
    } finally {
      toggleAppSpinner(false);
    }
  });
  extractBtn.addEventListener("click", async () => {
    statusEl.style.display = "none";
    if (!currentZipInstance || currentTocEntries.length === 0) {
      updateLocalStatus("Cannot extract: No EPUB loaded or no chapters found.", true);
      fileInput.focus();
      return;
    }
    const selectedChapterCheckboxes = chapterListUl.querySelectorAll('input[type="checkbox"]:checked');
    if (selectedChapterCheckboxes.length === 0) {
      updateLocalStatus("No chapters selected to extract. Please select at least one chapter.", true);
      return;
    }
    const selectedChapters = [];
    selectedChapterCheckboxes.forEach((cb) => {
      const checkbox = cb;
      const href = checkbox.getAttribute("data-chapter-href");
      const entry = currentTocEntries.find((e) => e.href === href);
      if (entry) {
        selectedChapters.push(entry);
      }
    });
    let numLinesToRemove = 0;
    if (enableRemoveLinesToggle.checked) {
      numLinesToRemove = parseInt(linesToRemoveInput.value, 10);
      if (isNaN(numLinesToRemove) || numLinesToRemove < 0) {
        showAppToast('Invalid "Number of lines to remove". Must be 0 or greater.', true);
        statusEl.textContent = 'Error: "Number of lines to remove" must be 0 or greater.';
        statusEl.className = "status error";
        statusEl.style.display = "block";
        linesToRemoveInput.focus();
        return;
      }
    }
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    extractBtn.disabled = true;
    extractBtn.textContent = "Extracting...";
    toggleAppSpinner(true);
    const outputZip = new JSZip();
    let filesAdded = 0;
    const totalChaptersToProcess = selectedChapters.length;
    try {
      updateLocalStatus(`Starting chapter extraction (0/${totalChaptersToProcess})...`);
      for (let i = 0; i < totalChaptersToProcess; i++) {
        const entry = selectedChapters[i];
        updateLocalStatus(`Processing chapter ${i + 1}/${totalChaptersToProcess}: ${entry.title.substring(0, 30)}...`);
        const chapterFile = currentZipInstance.file(entry.href);
        if (!chapterFile) {
          console.warn(`Chapter file not found in EPUB: ${entry.href}`);
          continue;
        }
        const chapterBytes = await chapterFile.async("uint8array");
        let chapterHtml;
        try {
          const decoder = new TextDecoder("utf-8", { fatal: false });
          chapterHtml = decoder.decode(chapterBytes);
        } catch (e) {
          console.error(`Error decoding chapter ${entry.href} as UTF-8:`, e);
          chapterHtml = "";
          updateLocalStatus(`Warning: Could not decode chapter "${entry.title.substring(0, 30)}". It may be corrupted or not UTF-8.`, true);
        }
        let chapterText = extractTextFromHtml(chapterHtml);
        if (numLinesToRemove > 0 && chapterText) {
          const lines = chapterText.split("\n");
          if (lines.length > numLinesToRemove) {
            chapterText = lines.slice(numLinesToRemove).join("\n");
          } else {
            chapterText = "";
          }
        }
        if (chapterText && chapterText.trim().length > 0) {
          const safeChapterTitle = sanitizeFilenameForZip(entry.title) || `Chapter_${String(i + 1).padStart(2, "0")}`;
          const txtFilename = `${safeChapterTitle}.txt`;
          outputZip.file(txtFilename, chapterText);
          filesAdded++;
        } else {
          console.warn(`No text content extracted (or became empty after line removal) from: ${entry.href}`);
        }
        await delay(5);
      }
      if (filesAdded > 0) {
        updateLocalStatus(`Generating ZIP file with ${filesAdded} chapters...`);
        const zipBlob = await outputZip.generateAsync({ type: "blob", compression: "DEFLATE" });
        const downloadFilenameBase = currentEpubFilename.replace(/\.epub$/i, "") || "epub_content";
        const finalFilename = `${sanitizeFilenameForZip(downloadFilenameBase)}_chapters.zip`;
        await triggerDownload2(zipBlob, finalFilename, "application/zip", showAppToast);
        updateLocalStatus(`Download started / File saved (${filesAdded}/${totalChaptersToProcess} chapters).`);
        if (downloadSec && downloadLink) {
          downloadLink.href = "#";
          downloadLink.setAttribute("download", finalFilename);
          downloadLink.textContent = `Download ${finalFilename}`;
          downloadSec.style.display = "block";
        }
      } else {
        updateLocalStatus("Extraction complete, but no chapter content was retrieved or all content was removed. Check EPUB and options.", true);
      }
    } catch (err) {
      console.error("Error during chapter extraction or ZIP creation:", err);
      updateLocalStatus(`Error: ${err.message}`, true);
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = "Extract Chapters to ZIP";
      toggleAppSpinner(false);
    }
  });
}

// ts/create-backup-from-zip.ts
init_dist();
function initializeCreateBackupFromZip(showAppToast, toggleAppSpinner) {
  const zipFileInput = document.getElementById("zipBackupFile");
  const zipFileNameEl = document.getElementById("zipBackupFileName");
  const clearZipFileBtn = document.getElementById("clearZipBackupFile");
  const projectTitleInput = document.getElementById("zipProjectTitle");
  const descriptionInput = document.getElementById("zipDescription");
  const uniqueCodeInput = document.getElementById("zipUniqueCode");
  const chapterPatternInput = document.getElementById("zipChapterPattern");
  const startNumberInput = document.getElementById("zipStartNumber");
  const extraChaptersInput = document.getElementById("zipExtraChapters");
  const createBtn = document.getElementById("createFromZipBtn");
  const statusMessageEl = document.getElementById("statusMessageCreateBackupFromZip");
  const tooltipTrigger = document.querySelector("#createBackupFromZipApp .tooltip-trigger");
  if (!zipFileInput || !zipFileNameEl || !clearZipFileBtn || !projectTitleInput || !descriptionInput || !uniqueCodeInput || !chapterPatternInput || !startNumberInput || !extraChaptersInput || !createBtn || !statusMessageEl || !tooltipTrigger) {
    console.error("Create Backup from ZIP: One or more UI elements not found. Initialization failed.");
    return;
  }
  tooltipTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    tooltipTrigger.classList.toggle("active");
  });
  document.addEventListener("click", (e) => {
    if (tooltipTrigger.classList.contains("active") && !tooltipTrigger.contains(e.target)) {
      tooltipTrigger.classList.remove("active");
    }
  });
  zipFileInput.addEventListener("change", () => {
    createBtn.disabled = !(zipFileInput.files && zipFileInput.files.length > 0);
    if (statusMessageEl) statusMessageEl.style.display = "none";
    if (zipFileInput.files && zipFileInput.files.length > 0) {
      zipFileNameEl.textContent = `Selected: ${zipFileInput.files[0].name}`;
      if (clearZipFileBtn) clearZipFileBtn.style.display = "inline-block";
    } else {
      zipFileNameEl.textContent = "";
      if (clearZipFileBtn) clearZipFileBtn.style.display = "none";
    }
  });
  clearZipFileBtn.addEventListener("click", () => {
    zipFileInput.value = "";
    zipFileNameEl.textContent = "";
    clearZipFileBtn.style.display = "none";
    createBtn.disabled = true;
    if (statusMessageEl) statusMessageEl.style.display = "none";
  });
  createBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusMessageEl) statusMessageEl.style.display = "none";
    if (!zipFileInput.files || zipFileInput.files.length === 0) {
      showAppToast("Please upload a ZIP file.", true);
      if (statusMessageEl) {
        statusMessageEl.textContent = "Error: Please upload a ZIP file.";
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      zipFileInput.focus();
      return;
    }
    const projectTitle = projectTitleInput.value.trim();
    if (!projectTitle) {
      showAppToast("Project Title is required.", true);
      if (statusMessageEl) {
        statusMessageEl.textContent = "Error: Project Title is required.";
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      projectTitleInput.focus();
      return;
    }
    const effectiveStartNumber = parseInt(startNumberInput.value, 10);
    if (isNaN(effectiveStartNumber) || effectiveStartNumber < 1) {
      showAppToast("Start Number must be 1 or greater.", true);
      if (statusMessageEl) {
        statusMessageEl.textContent = "Error: Start Number must be 1 or greater.";
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      startNumberInput.focus();
      return;
    }
    const numExtraChapters = parseInt(extraChaptersInput.value, 10);
    if (isNaN(numExtraChapters) || numExtraChapters < 0) {
      showAppToast("Extra Empty Chapters must be 0 or greater.", true);
      if (statusMessageEl) {
        statusMessageEl.textContent = "Error: Extra Chapters must be 0 or greater.";
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      extraChaptersInput.focus();
      return;
    }
    toggleAppSpinner(true);
    const file = zipFileInput.files[0];
    const description = descriptionInput.value.trim();
    const uniqueCodeProvided = uniqueCodeInput.value.trim();
    const chapterPatternValue = chapterPatternInput.value.trim();
    try {
      const zip = await JSZip.loadAsync(file);
      const scenes = [];
      const sections = [];
      let currentProcessingIndex = 0;
      const chapterFilePromises = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith(".txt")) {
          chapterFilePromises.push(
            zipEntry.async("string").then((text) => ({ name: zipEntry.name, text }))
          );
        }
      });
      const chapterFiles = await Promise.all(chapterFilePromises);
      chapterFiles.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
      for (const chapterFile of chapterFiles) {
        const currentRank = effectiveStartNumber + currentProcessingIndex;
        const sceneCode = `scene${currentRank}`;
        const sectionCode = `section${currentRank}`;
        let chapterTitle;
        if (chapterPatternValue) {
          chapterTitle = `${chapterPatternValue}${currentRank}`;
        } else {
          chapterTitle = chapterFile.name.replace(/\.txt$/i, "");
        }
        const rawChapterText = chapterFile.text;
        const normalizedText = rawChapterText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const contentSegments = normalizedText.split(/\n{2,}/).map((s2) => s2.trim()).filter((s2) => s2 !== "");
        const blocks = [];
        for (let i = 0; i < contentSegments.length; i++) {
          blocks.push({ type: "text", align: "left", text: contentSegments[i] });
          if (i < contentSegments.length - 1 || contentSegments.length === 0) {
            blocks.push({ type: "text", align: "left" });
          }
        }
        if (contentSegments.length === 0) {
          if (rawChapterText.trim() === "" && rawChapterText.length > 0) {
            blocks.push({ type: "text", align: "left" });
          } else if (rawChapterText.trim() === "") {
            blocks.push({ type: "text", align: "left", text: "" });
          }
        }
        if (blocks.length === 0) {
          blocks.push({ type: "text", align: "left", text: "" });
        }
        const sceneText = JSON.stringify({ blocks });
        scenes.push({
          code: sceneCode,
          title: chapterTitle,
          text: sceneText,
          ranking: currentRank,
          status: "1"
        });
        sections.push({
          code: sectionCode,
          title: chapterTitle,
          synopsis: "",
          ranking: currentRank,
          section_scenes: [{ code: sceneCode, ranking: 1 }]
        });
        currentProcessingIndex++;
      }
      if (numExtraChapters > 0) {
        for (let i = 0; i < numExtraChapters; i++) {
          const currentRank = effectiveStartNumber + currentProcessingIndex;
          const sceneCode = `scene${currentRank}`;
          const sectionCode = `section${currentRank}`;
          let chapterTitle;
          if (chapterPatternValue) {
            chapterTitle = `${chapterPatternValue}${currentRank}`;
          } else {
            chapterTitle = `Chapter ${currentRank}`;
          }
          const emptySceneContent = { blocks: [{ type: "text", align: "left", text: "" }] };
          scenes.push({
            code: sceneCode,
            title: chapterTitle,
            text: JSON.stringify(emptySceneContent),
            ranking: currentRank,
            status: "1"
          });
          sections.push({
            code: sectionCode,
            title: chapterTitle,
            synopsis: "",
            ranking: currentRank,
            section_scenes: [{ code: sceneCode, ranking: 1 }]
          });
          currentProcessingIndex++;
        }
      }
      if (scenes.length === 0) {
        showAppToast("No .txt files found in ZIP and no extra chapters requested. Backup not created.", true);
        if (statusMessageEl) {
          statusMessageEl.textContent = "Error: No chapters to include in backup.";
          statusMessageEl.className = "status error";
          statusMessageEl.style.display = "block";
        }
        toggleAppSpinner(false);
        return;
      }
      const uniqueCode = uniqueCodeProvided || Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0");
      const now = Date.now();
      let totalWordCount = 0;
      scenes.forEach((scene) => {
        try {
          const sceneContent = JSON.parse(scene.text);
          sceneContent.blocks.forEach((block) => {
            if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
              totalWordCount += block.text.trim().split(/\s+/).length;
            }
          });
        } catch (e) {
          console.warn("Word count parse error:", e);
        }
      });
      const backupData = {
        version: 4,
        code: uniqueCode,
        title: projectTitle,
        description,
        show_table_of_contents: true,
        apply_automatic_indentation: false,
        last_update_date: now,
        last_backup_date: now,
        revisions: [{
          number: 1,
          date: now,
          book_progresses: [{ year: (/* @__PURE__ */ new Date()).getFullYear(), month: (/* @__PURE__ */ new Date()).getMonth() + 1, day: (/* @__PURE__ */ new Date()).getDate(), word_count: totalWordCount }],
          statuses: [{ code: "1", title: "Todo", color: -2697255, ranking: 1 }],
          scenes,
          sections
        }]
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const safeFileNameBase = projectTitle.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_");
      const filename = `${safeFileNameBase || "backup_from_zip"}.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      if (statusMessageEl) {
        statusMessageEl.textContent = `Backup file created with ${scenes.length} chapter(s). Download started.`;
        statusMessageEl.className = "status success";
        statusMessageEl.style.display = "block";
      }
      showAppToast(`Backup file created with ${scenes.length} chapter(s).`);
    } catch (err) {
      console.error("Create Backup from ZIP Error:", err);
      if (statusMessageEl) {
        statusMessageEl.textContent = `Error: ${err.message}`;
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      showAppToast(`Error: ${err.message}`, true);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/create-new-backup.ts
init_dist();
function initializeCreateNewBackup(showAppToast, toggleAppSpinner) {
  const createBtn = document.getElementById("createNewBackupBtn");
  const statusEl = document.getElementById("statusCreateNewBackup");
  const titleInput = document.getElementById("createProjectTitle");
  const descInput = document.getElementById("createDescription");
  const codeInputElement = document.getElementById("createUniqueCode");
  const chaptersInput = document.getElementById("createChapters");
  const startNumberInput = document.getElementById("createStartNumber");
  const prefixInput = document.getElementById("createPrefix");
  if (!createBtn || !titleInput || !descInput || !codeInputElement || !chaptersInput || !startNumberInput || !prefixInput || !statusEl) {
    console.error("Create New Backup: One or more UI elements not found. Initialization failed.");
    return;
  }
  createBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    statusEl.style.display = "none";
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const codeInputVal = codeInputElement.value.trim();
    const count = parseInt(chaptersInput.value, 10);
    const startNum = parseInt(startNumberInput.value, 10);
    const prefix = prefixInput.value.trim();
    if (!title) {
      showAppToast("Project Title is required.", true);
      statusEl.textContent = "Error: Project Title is required.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      titleInput.focus();
      return;
    }
    if (isNaN(count) || count < 1) {
      showAppToast("Number of Chapters must be at least 1.", true);
      statusEl.textContent = "Error: Number of Chapters must be at least 1.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      chaptersInput.focus();
      return;
    }
    if (isNaN(startNum) || startNum < 1) {
      showAppToast("Start Number must be at least 1.", true);
      statusEl.textContent = "Error: Start Number must be at least 1.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      startNumberInput.focus();
      return;
    }
    toggleAppSpinner(true);
    try {
      const showTOC = true;
      const autoIndent = false;
      const uniqueCode = codeInputVal || Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0");
      const now = Date.now();
      const scenes = [];
      const sections = [];
      for (let i = 0; i < count; i++) {
        const currentChapterNumber = startNum + i;
        const chapTitle = prefix ? `${prefix}${currentChapterNumber}` : `Chapter ${currentChapterNumber}`;
        const sceneCode = `scene${currentChapterNumber}`;
        const sectionCode = `section${currentChapterNumber}`;
        const sceneContent = { blocks: [{ type: "text", align: "left", text: "" }] };
        scenes.push({
          code: sceneCode,
          title: chapTitle,
          text: JSON.stringify(sceneContent),
          ranking: currentChapterNumber,
          status: "1"
        });
        sections.push({
          code: sectionCode,
          title: chapTitle,
          synopsis: "",
          ranking: currentChapterNumber,
          section_scenes: [{ code: sceneCode, ranking: 1 }]
        });
      }
      const backup = {
        version: 4,
        code: uniqueCode,
        title,
        description: desc,
        show_table_of_contents: showTOC,
        apply_automatic_indentation: autoIndent,
        last_update_date: now,
        last_backup_date: now,
        revisions: [{
          number: 1,
          date: now,
          book_progresses: [{
            year: (/* @__PURE__ */ new Date()).getFullYear(),
            month: (/* @__PURE__ */ new Date()).getMonth() + 1,
            day: (/* @__PURE__ */ new Date()).getDate(),
            word_count: 0
          }],
          statuses: [{ code: "1", title: "Todo", color: -2697255, ranking: 1 }],
          scenes,
          sections
        }]
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const filenameBase = title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "new_backup";
      const filename = `${filenameBase}.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      statusEl.textContent = "Backup file created successfully. Download started.";
      statusEl.className = "status success";
      statusEl.style.display = "block";
      showAppToast("Backup file created successfully.");
    } catch (err) {
      showAppToast(err.message || "Error creating backup.", true);
      statusEl.textContent = `Error: ${err.message || "Could not create backup."}`;
      statusEl.className = "status error";
      statusEl.style.display = "block";
      console.error("Create New Backup Error:", err);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/extend-backup.ts
init_dist();
function initializeExtendBackup(showAppToast, toggleAppSpinner) {
  const extendBtn = document.getElementById("extendBackupBtn");
  const fileInput = document.getElementById("extendBackupFile");
  const fileNameEl = document.getElementById("extendBackupFileName");
  const clearFileBtn = document.getElementById("clearExtendBackupFile");
  const extraChaptersInput = document.getElementById("extendExtraChapters");
  const startNumberInput = document.getElementById("extendStartNumber");
  const prefixInput = document.getElementById("extendPrefix");
  const statusEl = document.getElementById("statusExtendBackup");
  const tooltipTrigger = document.querySelector("#extendBackupApp .tooltip-trigger");
  if (!extendBtn || !fileInput || !fileNameEl || !clearFileBtn || !extraChaptersInput || !startNumberInput || !prefixInput || !statusEl || !tooltipTrigger) {
    console.error("Extend Backup: One or more UI elements not found. Initialization failed.");
    return;
  }
  tooltipTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    tooltipTrigger.classList.toggle("active");
  });
  document.addEventListener("click", (e) => {
    if (tooltipTrigger.classList.contains("active") && !tooltipTrigger.contains(e.target)) {
      tooltipTrigger.classList.remove("active");
    }
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length > 0) {
      fileNameEl.textContent = `Selected: ${fileInput.files[0].name}`;
      if (clearFileBtn) clearFileBtn.style.display = "inline-block";
    } else {
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
    }
    statusEl.style.display = "none";
  });
  clearFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    fileNameEl.textContent = "";
    clearFileBtn.style.display = "none";
    statusEl.style.display = "none";
  });
  extendBtn.addEventListener("click", () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    statusEl.style.display = "none";
    if (!fileInput.files || !fileInput.files.length) {
      showAppToast("Please upload a backup file to extend.", true);
      statusEl.textContent = "Error: Please upload a backup file.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      fileInput.focus();
      return;
    }
    const extraChapters = parseInt(extraChaptersInput.value, 10);
    if (isNaN(extraChapters) || extraChapters <= 0) {
      showAppToast("Number of extra chapters must be greater than 0.", true);
      statusEl.textContent = "Error: Number of extra chapters must be greater than 0.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      extraChaptersInput.focus();
      return;
    }
    const newChaptersStartNum = parseInt(startNumberInput.value, 10);
    if (isNaN(newChaptersStartNum) || newChaptersStartNum < 1) {
      showAppToast("Start Number for New Chapters must be 1 or greater.", true);
      statusEl.textContent = "Error: Start Number for New Chapters must be 1 or greater.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      startNumberInput.focus();
      return;
    }
    toggleAppSpinner(true);
    const prefix = prefixInput.value.trim();
    const reader = new FileReader();
    reader.onerror = () => {
      showAppToast("Error reading file.", true);
      statusEl.textContent = "Error: Could not read the uploaded file.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      toggleAppSpinner(false);
    };
    reader.onload = async (e) => {
      try {
        if (!e.target || typeof e.target.result !== "string") {
          throw new Error("File content could not be read.");
        }
        const backup = JSON.parse(e.target.result);
        const rev = backup.revisions && backup.revisions[0];
        if (!rev || !rev.scenes || !rev.sections) {
          throw new Error("Invalid backup file structure for extending.");
        }
        let maxExistingRanking = 0;
        rev.scenes.forEach((s2) => {
          if (s2.ranking > maxExistingRanking) maxExistingRanking = s2.ranking;
        });
        rev.sections.forEach((s2) => {
          if (s2.ranking > maxExistingRanking) maxExistingRanking = s2.ranking;
        });
        for (let i = 0; i < extraChapters; i++) {
          const titleAndCodeNumPart = newChaptersStartNum + i;
          const actualRanking = maxExistingRanking + 1 + i;
          const chapTitle = prefix ? `${prefix}${titleAndCodeNumPart}` : `Chapter ${titleAndCodeNumPart}`;
          const sceneCode = `scene${titleAndCodeNumPart}`;
          const sectionCode = `section${titleAndCodeNumPart}`;
          const sceneContent = { blocks: [{ type: "text", align: "left", text: "" }] };
          rev.scenes.push({
            code: sceneCode,
            title: chapTitle,
            text: JSON.stringify(sceneContent),
            ranking: actualRanking,
            status: "1"
          });
          rev.sections.push({
            code: sectionCode,
            title: chapTitle,
            synopsis: "",
            ranking: actualRanking,
            section_scenes: [{ code: sceneCode, ranking: 1 }]
          });
        }
        const now = Date.now();
        backup.last_update_date = now;
        backup.last_backup_date = now;
        if (rev) rev.date = now;
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const filenameBase = backup.title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "extended_backup";
        const filename = `${filenameBase}.json`;
        await triggerDownload(blob, filename, "application/json", showAppToast);
        statusEl.textContent = `Backup extended with ${extraChapters} chapter(s). Download started.`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
        showAppToast("Backup extended successfully.");
      } catch (err) {
        showAppToast(err.message || "Error extending backup.", true);
        statusEl.textContent = `Error: ${err.message || "Could not extend backup."}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
        console.error("Extend Backup Error:", err);
      } finally {
        toggleAppSpinner(false);
      }
    };
    reader.readAsText(fileInput.files[0]);
  });
}

// ts/merge-backup.ts
init_dist();
async function processMergeBackupFiles(files, mergedTitle, mergedDesc, chapterPrefix, preserveOriginalTitles, showAppToast) {
  let combinedScenes = [];
  let combinedSections = [];
  const allStatuses = [];
  const seenStatusCodes = /* @__PURE__ */ new Set();
  for (const file of files) {
    try {
      const fileText = await file.text();
      const data = JSON.parse(fileText);
      const rev = data.revisions && data.revisions[0];
      if (rev) {
        if (rev.scenes) {
          if (preserveOriginalTitles) {
            rev.scenes.forEach((s2) => s2.originalTitle = s2.title);
          }
          combinedScenes = combinedScenes.concat(rev.scenes);
        }
        if (rev.sections) {
          if (preserveOriginalTitles) {
            rev.sections.forEach((s2) => s2.originalTitle = s2.title);
          }
          combinedSections = combinedSections.concat(rev.sections);
        }
        if (rev.statuses && rev.statuses.length > 0) {
          rev.statuses.forEach((status) => {
            if (!seenStatusCodes.has(status.code)) {
              allStatuses.push(status);
              seenStatusCodes.add(status.code);
            }
          });
        }
      } else {
        console.warn(`Skipping file ${file.name} in merge: No valid revision found.`);
        showAppToast(`Skipped ${file.name} (no revision data).`, true);
      }
    } catch (e) {
      console.warn(`Skipping file ${file.name} in merge due to parse error:`, e);
      showAppToast(`Skipped ${file.name} during merge (invalid JSON format).`, true);
    }
  }
  const finalStatuses = allStatuses.sort((a, b) => {
    return (a.ranking || Infinity) - (b.ranking || Infinity);
  }).map((status, index) => ({
    ...status,
    ranking: index + 1
  }));
  if (finalStatuses.length === 0) {
    finalStatuses.push({ code: "1", title: "Todo", color: -2697255, ranking: 1 });
  }
  combinedScenes.forEach((s2, i) => {
    const n = i + 1;
    s2.code = "scene" + n;
    if (preserveOriginalTitles && s2.originalTitle) {
      s2.title = chapterPrefix ? `${chapterPrefix}${s2.originalTitle}` : s2.originalTitle;
    } else {
      s2.title = chapterPrefix ? `${chapterPrefix}${n}` : `Chapter ${n}`;
    }
    s2.ranking = n;
    delete s2.originalTitle;
  });
  combinedSections.forEach((s2, i) => {
    const n = i + 1;
    s2.code = "section" + n;
    if (preserveOriginalTitles && s2.originalTitle) {
      s2.title = chapterPrefix ? `${chapterPrefix}${s2.originalTitle}` : s2.originalTitle;
    } else {
      s2.title = chapterPrefix ? `${chapterPrefix}${n}` : `Chapter ${n}`;
    }
    s2.ranking = n;
    delete s2.originalTitle;
    s2.section_scenes = [{ code: "scene" + n, ranking: 1 }];
  });
  const now = Date.now();
  let totalWordCount = 0;
  combinedScenes.forEach((scene) => {
    try {
      const sceneContent = JSON.parse(scene.text);
      sceneContent.blocks.forEach((block) => {
        if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
          totalWordCount += block.text.trim().split(/\s+/).length;
        }
      });
    } catch (e) {
      console.warn("Word count error in merged scene:", e);
    }
  });
  return {
    version: 4,
    code: Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0"),
    title: mergedTitle,
    description: mergedDesc,
    show_table_of_contents: true,
    apply_automatic_indentation: false,
    last_update_date: now,
    last_backup_date: now,
    revisions: [{
      number: 1,
      date: now,
      book_progresses: [{ year: (/* @__PURE__ */ new Date()).getFullYear(), month: (/* @__PURE__ */ new Date()).getMonth() + 1, day: (/* @__PURE__ */ new Date()).getDate(), word_count: totalWordCount }],
      statuses: finalStatuses,
      scenes: combinedScenes,
      sections: combinedSections
    }]
  };
}
function initializeMergeBackup(showAppToast, toggleAppSpinner) {
  const mergeBtn = document.getElementById("mergeBackupBtn");
  const filesInput = document.getElementById("mergeBackupFiles");
  const fileNamesEl = document.getElementById("mergeBackupFileNames");
  const clearFilesBtn = document.getElementById("clearMergeBackupFiles");
  const mergedTitleInput = document.getElementById("mergeProjectTitle");
  const mergedDescInput = document.getElementById("mergeDescription");
  const chapterPrefixInput = document.getElementById("mergePrefix");
  const preserveTitlesCheckbox = document.getElementById("mergePreserveTitles");
  const statusEl = document.getElementById("statusMergeBackup");
  if (!mergeBtn || !filesInput || !fileNamesEl || !clearFilesBtn || !mergedTitleInput || !mergedDescInput || !chapterPrefixInput || !preserveTitlesCheckbox || !statusEl) {
    console.error("Merge Backup: One or more UI elements not found. Initialization failed.");
    return;
  }
  filesInput.addEventListener("change", () => {
    if (filesInput.files && filesInput.files.length > 0) {
      let fileListHtml = '<ul style="margin: 0; padding-left: 15px; font-size: 0.9em;">';
      for (let i = 0; i < filesInput.files.length; i++) {
        fileListHtml += `<li>${filesInput.files[i].name}</li>`;
      }
      fileListHtml += "</ul>";
      fileNamesEl.innerHTML = fileListHtml;
      if (clearFilesBtn) clearFilesBtn.style.display = "inline-block";
    } else {
      fileNamesEl.textContent = "No files selected.";
      if (clearFilesBtn) clearFilesBtn.style.display = "none";
    }
    statusEl.style.display = "none";
  });
  clearFilesBtn.addEventListener("click", () => {
    filesInput.value = "";
    fileNamesEl.textContent = "No files selected.";
    clearFilesBtn.style.display = "none";
    statusEl.style.display = "none";
  });
  mergeBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    statusEl.style.display = "none";
    const files = filesInput.files ? Array.from(filesInput.files) : [];
    const mergedTitle = mergedTitleInput.value.trim();
    const mergedDesc = mergedDescInput.value.trim();
    const chapterPrefix = chapterPrefixInput.value.trim();
    const preserveOriginalTitles = preserveTitlesCheckbox.checked;
    if (!files.length) {
      showAppToast("Select at least one backup file to merge.", true);
      statusEl.textContent = "Error: Select at least one backup file.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      filesInput.focus();
      return;
    }
    if (!mergedTitle) {
      showAppToast("Merged Project Title is required.", true);
      statusEl.textContent = "Error: Merged Project Title is required.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      mergedTitleInput.focus();
      return;
    }
    toggleAppSpinner(true);
    try {
      const mergedData = await processMergeBackupFiles(
        files,
        mergedTitle,
        mergedDesc,
        chapterPrefix,
        preserveOriginalTitles,
        showAppToast
      );
      if (mergedData.revisions[0].scenes.length === 0) {
        showAppToast("No valid chapters found in the selected files to merge.", true);
        if (statusEl) {
          statusEl.textContent = "Error: No valid chapters to merge from selected files.";
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
      } else {
        const blob = new Blob([JSON.stringify(mergedData, null, 2)], { type: "application/json" });
        const filenameBase = mergedTitle.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "merged_backup";
        const filename = `${filenameBase}.json`;
        await triggerDownload(blob, filename, "application/json", showAppToast);
        statusEl.textContent = `Backup files merged into "${mergedTitle}". Download started.`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
        showAppToast("Backup files merged successfully.");
      }
    } catch (err) {
      if (!(statusEl.textContent && statusEl.textContent.includes("No valid chapters"))) {
        showAppToast(err.message || "Error merging backup files.", true);
        statusEl.textContent = `Error: ${err.message || "Could not merge backups."}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      console.error("Merge Backup Error:", err);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/augment-backup-with-zip.ts
init_dist();
function initializeAugmentBackupWithZip(showAppToast, toggleAppSpinner) {
  const baseBackupFileInput = document.getElementById("augmentBaseBackupFile");
  const baseBackupFileNameEl = document.getElementById("augmentBaseBackupFileName");
  const clearBaseBackupFileBtn = document.getElementById("clearAugmentBaseBackupFile");
  const zipFileInput = document.getElementById("augmentZipFile");
  const zipFileNameEl = document.getElementById("augmentZipFileName");
  const clearZipFileBtn = document.getElementById("clearAugmentZipFile");
  const prefixInput = document.getElementById("augmentPrefix");
  const preserveTxtTitlesCheckbox = document.getElementById("augmentPreserveTxtTitles");
  const augmentBtn = document.getElementById("augmentBackupBtn");
  const statusEl = document.getElementById("statusAugmentBackup");
  let selectedBaseFile = null;
  let selectedZipFile = null;
  if (!baseBackupFileInput || !baseBackupFileNameEl || !clearBaseBackupFileBtn || !zipFileInput || !zipFileNameEl || !clearZipFileBtn || !prefixInput || !preserveTxtTitlesCheckbox || !augmentBtn || !statusEl) {
    console.error("Augment Backup with ZIP: One or more UI elements not found. Initialization failed.");
    return;
  }
  function checkEnableButton() {
    augmentBtn.disabled = !(selectedBaseFile && selectedZipFile);
  }
  baseBackupFileInput.addEventListener("change", (e) => {
    selectedBaseFile = e.target.files?.[0] || null;
    if (selectedBaseFile) {
      baseBackupFileNameEl.textContent = `Selected: ${selectedBaseFile.name}`;
      clearBaseBackupFileBtn.style.display = "inline-block";
    } else {
      baseBackupFileNameEl.textContent = "";
      clearBaseBackupFileBtn.style.display = "none";
    }
    statusEl.style.display = "none";
    checkEnableButton();
  });
  clearBaseBackupFileBtn.addEventListener("click", () => {
    baseBackupFileInput.value = "";
    selectedBaseFile = null;
    baseBackupFileNameEl.textContent = "";
    clearBaseBackupFileBtn.style.display = "none";
    statusEl.style.display = "none";
    checkEnableButton();
  });
  zipFileInput.addEventListener("change", (e) => {
    selectedZipFile = e.target.files?.[0] || null;
    if (selectedZipFile) {
      zipFileNameEl.textContent = `Selected: ${selectedZipFile.name}`;
      clearZipFileBtn.style.display = "inline-block";
    } else {
      zipFileNameEl.textContent = "";
      clearZipFileBtn.style.display = "none";
    }
    statusEl.style.display = "none";
    checkEnableButton();
  });
  clearZipFileBtn.addEventListener("click", () => {
    zipFileInput.value = "";
    selectedZipFile = null;
    zipFileNameEl.textContent = "";
    clearZipFileBtn.style.display = "none";
    statusEl.style.display = "none";
    checkEnableButton();
  });
  augmentBtn.addEventListener("click", async () => {
    statusEl.style.display = "none";
    if (!selectedBaseFile) {
      showAppToast("Please select a base backup file.", true);
      statusEl.textContent = "Error: Base backup file is required.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      baseBackupFileInput.focus();
      return;
    }
    if (!selectedZipFile) {
      showAppToast("Please select a ZIP file.", true);
      statusEl.textContent = "Error: ZIP file is required.";
      statusEl.className = "status error";
      statusEl.style.display = "block";
      zipFileInput.focus();
      return;
    }
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    toggleAppSpinner(true);
    const prefix = prefixInput.value.trim();
    const preserveTitles = preserveTxtTitlesCheckbox.checked;
    try {
      const baseFileText = await selectedBaseFile.text();
      let backupData;
      try {
        backupData = JSON.parse(baseFileText);
      } catch (jsonErr) {
        throw new Error("Base backup file is not valid JSON.");
      }
      if (!backupData.revisions || backupData.revisions.length === 0 || !backupData.revisions[0].scenes || !backupData.revisions[0].sections) {
        throw new Error("Base backup file has an invalid or incomplete structure.");
      }
      const currentRevision = backupData.revisions[0];
      const zip = await JSZip.loadAsync(selectedZipFile);
      const chapterFilePromises = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith(".txt")) {
          chapterFilePromises.push(
            zipEntry.async("string").then((text) => ({ name: zipEntry.name, text }))
          );
        }
      });
      const chapterFiles = await Promise.all(chapterFilePromises);
      chapterFiles.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
      if (chapterFiles.length === 0) {
        showAppToast("No .txt files found in the ZIP archive. No changes made.", false);
        statusEl.textContent = "Info: No .txt files found in ZIP. Backup not augmented.";
        statusEl.className = "status success";
        statusEl.style.display = "block";
        toggleAppSpinner(false);
        return;
      }
      let maxExistingRank = 0;
      currentRevision.scenes.forEach((s2) => {
        if (s2.ranking > maxExistingRank) maxExistingRank = s2.ranking;
      });
      currentRevision.sections.forEach((s2) => {
        if (s2.ranking > maxExistingRank) maxExistingRank = s2.ranking;
      });
      let newChapterIndex = 0;
      for (const chapterFile of chapterFiles) {
        const newRank = maxExistingRank + 1 + newChapterIndex;
        const sceneCode = `scene${newRank}`;
        const sectionCode = `section${newRank}`;
        let chapterTitle;
        const txtFilename = chapterFile.name.replace(/\.txt$/i, "");
        if (preserveTitles) {
          if (prefix) {
            if (txtFilename.toLowerCase().startsWith(prefix.toLowerCase())) {
              chapterTitle = txtFilename;
            } else {
              chapterTitle = `${prefix}${txtFilename}`;
            }
          } else {
            chapterTitle = txtFilename;
          }
        } else {
          chapterTitle = prefix ? `${prefix}${newRank}` : `Chapter ${newRank}`;
        }
        const rawChapterText = chapterFile.text;
        const normalizedText = rawChapterText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const contentSegments = normalizedText.split(/\n{2,}/).map((s2) => s2.trim()).filter((s2) => s2 !== "");
        const blocks = [];
        for (let i = 0; i < contentSegments.length; i++) {
          blocks.push({ type: "text", align: "left", text: contentSegments[i] });
          if (i < contentSegments.length - 1 || contentSegments.length === 0) {
            blocks.push({ type: "text", align: "left" });
          }
        }
        if (contentSegments.length === 0) {
          if (rawChapterText.trim() === "" && rawChapterText.length > 0) {
            blocks.push({ type: "text", align: "left" });
          } else if (rawChapterText.trim() === "") {
            blocks.push({ type: "text", align: "left", text: "" });
          }
        }
        if (blocks.length === 0) {
          blocks.push({ type: "text", align: "left", text: "" });
        }
        const sceneText = JSON.stringify({ blocks });
        currentRevision.scenes.push({
          code: sceneCode,
          title: chapterTitle,
          text: sceneText,
          ranking: newRank,
          status: "1"
        });
        currentRevision.sections.push({
          code: sectionCode,
          title: chapterTitle,
          synopsis: "",
          ranking: newRank,
          section_scenes: [{ code: sceneCode, ranking: 1 }]
        });
        newChapterIndex++;
      }
      const now = Date.now();
      backupData.last_update_date = now;
      backupData.last_backup_date = now;
      currentRevision.date = now;
      let totalWordCount = 0;
      currentRevision.scenes.forEach((scene) => {
        try {
          const sceneContent = JSON.parse(scene.text);
          sceneContent.blocks.forEach((block) => {
            if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
              totalWordCount += block.text.trim().split(/\s+/).length;
            }
          });
        } catch (e) {
          console.warn("Word count parse error for scene:", scene.title, e);
        }
      });
      if (currentRevision.book_progresses && currentRevision.book_progresses.length > 0) {
        const lastProgress = currentRevision.book_progresses[currentRevision.book_progresses.length - 1];
        const today = /* @__PURE__ */ new Date();
        if (lastProgress.year === today.getFullYear() && lastProgress.month === today.getMonth() + 1 && lastProgress.day === today.getDate()) {
          lastProgress.word_count = totalWordCount;
        } else {
          currentRevision.book_progresses.push({
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate(),
            word_count: totalWordCount
          });
        }
      } else {
        if (!currentRevision.book_progresses) currentRevision.book_progresses = [];
        currentRevision.book_progresses.push({
          year: (/* @__PURE__ */ new Date()).getFullYear(),
          month: (/* @__PURE__ */ new Date()).getMonth() + 1,
          day: (/* @__PURE__ */ new Date()).getDate(),
          word_count: totalWordCount
        });
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const safeFileNameBase = backupData.title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_");
      const filename = `${safeFileNameBase || "augmented_backup"}.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      statusEl.textContent = `Backup augmented with ${chapterFiles.length} chapter(s) from ZIP. Download started.`;
      statusEl.className = "status success";
      statusEl.style.display = "block";
      showAppToast(`Backup augmented successfully with ${chapterFiles.length} chapters.`);
    } catch (err) {
      console.error("Augment Backup with ZIP Error:", err);
      statusEl.textContent = `Error: ${err.message || "Could not augment backup."}`;
      statusEl.className = "status error";
      statusEl.style.display = "block";
      showAppToast(`Error: ${err.message || "Could not augment backup."}`, true);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/find-replace-backup.ts
init_dist();
var frData = null;
var frAllMatches = [];
var frCurrentMatchIndex = -1;
var frLastFindPattern = "";
var frLastUseRegex = false;
var frLastCaseSensitive = false;
var frLastWholeWord = false;
function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") return "";
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function updateMatchDisplay(currentMatchDisplay, matchSceneTitleEl, matchBlockIndexEl, matchCountDisplayEl) {
  if (!currentMatchDisplay || !matchSceneTitleEl || !matchBlockIndexEl || !matchCountDisplayEl) return;
  if (frCurrentMatchIndex !== -1 && frAllMatches[frCurrentMatchIndex]) {
    const match = frAllMatches[frCurrentMatchIndex];
    matchSceneTitleEl.textContent = escapeHtml(match.chapterTitle);
    matchBlockIndexEl.textContent = match.blockIndex.toString();
    matchCountDisplayEl.textContent = `Match ${frCurrentMatchIndex + 1} of ${frAllMatches.length}`;
    const blockText = match.blockText;
    const matchStart = match.matchIndexInBlock;
    const matchEnd = matchStart + match.matchLength;
    const before = escapeHtml(blockText.substring(0, matchStart));
    const highlighted = `<span class="fr-match-highlight">${escapeHtml(blockText.substring(matchStart, matchEnd))}</span>`;
    const after = escapeHtml(blockText.substring(matchEnd));
    currentMatchDisplay.innerHTML = (before + highlighted + after).replace(/\n/g, "<br>");
  } else {
    matchSceneTitleEl.textContent = "N/A";
    matchBlockIndexEl.textContent = "N/A";
    if (frAllMatches.length > 0 && frCurrentMatchIndex === -1) {
      matchCountDisplayEl.textContent = `${frAllMatches.length} matches found`;
    } else if (frLastFindPattern) {
      matchCountDisplayEl.textContent = `0 matches found for "${escapeHtml(frLastFindPattern)}"`;
    } else {
      matchCountDisplayEl.textContent = "0 matches";
    }
    currentMatchDisplay.innerHTML = frLastFindPattern ? "No match found for the current criteria." : "No match found yet.";
  }
}
function performInitialFind(findPatternValue, useRegexValue, caseSensitiveValue, wholeWordValue, showAppToast) {
  if (!frData || !frData.revisions || !frData.revisions[0] || !frData.revisions[0].scenes) {
    showAppToast("Backup data is not loaded or invalid.", true);
    return;
  }
  if (!findPatternValue && !useRegexValue) {
    showAppToast("Please enter a find pattern.", true);
    frAllMatches = [];
    frCurrentMatchIndex = -1;
    return;
  }
  frAllMatches = [];
  frCurrentMatchIndex = -1;
  frLastFindPattern = findPatternValue;
  frLastUseRegex = useRegexValue;
  frLastCaseSensitive = caseSensitiveValue;
  frLastWholeWord = wholeWordValue;
  const scenes = frData.revisions[0].scenes;
  let regex = null;
  if (useRegexValue) {
    try {
      regex = new RegExp(findPatternValue, `g${caseSensitiveValue ? "" : "i"}`);
    } catch (err) {
      showAppToast(`Invalid Regular Expression: ${err.message}`, true);
      return;
    }
  } else {
    if (wholeWordValue) {
      const escapedPattern = findPatternValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      try {
        regex = new RegExp(`\\b${escapedPattern}\\b`, `g${caseSensitiveValue ? "" : "i"}`);
      } catch (err) {
        showAppToast(`Error creating whole word regex: ${err.message}`, true);
        return;
      }
    }
  }
  scenes.forEach((scene, sceneIdx) => {
    if (!scene || typeof scene.text !== "string") return;
    try {
      const sceneContent = JSON.parse(scene.text);
      if (!sceneContent.blocks || !Array.isArray(sceneContent.blocks)) return;
      sceneContent.blocks.forEach((block, blockIdx) => {
        if (block.type !== "text" || typeof block.text !== "string" || !block.text) return;
        const blockText = block.text;
        let matchResult;
        if (regex) {
          while ((matchResult = regex.exec(blockText)) !== null) {
            frAllMatches.push({
              sceneIndex: sceneIdx,
              blockIndex: blockIdx,
              matchIndexInBlock: matchResult.index,
              matchLength: matchResult[0].length,
              chapterTitle: scene.title,
              blockText,
              matchedText: matchResult[0]
            });
            if (regex.lastIndex === matchResult.index && matchResult[0].length === 0) {
              regex.lastIndex++;
            }
          }
        } else {
          let searchFromIndex = 0;
          let foundIndex;
          const patternToSearch = caseSensitiveValue ? findPatternValue : findPatternValue.toLowerCase();
          const textToSearchIn = caseSensitiveValue ? blockText : blockText.toLowerCase();
          while ((foundIndex = textToSearchIn.indexOf(patternToSearch, searchFromIndex)) !== -1) {
            if (findPatternValue.length === 0 && foundIndex === searchFromIndex) {
              frAllMatches.push({
                sceneIndex: sceneIdx,
                blockIndex: blockIdx,
                matchIndexInBlock: foundIndex,
                matchLength: 0,
                chapterTitle: scene.title,
                blockText,
                matchedText: ""
              });
              searchFromIndex = foundIndex + 1;
              if (searchFromIndex > blockText.length) break;
              continue;
            }
            if (findPatternValue.length === 0) {
              searchFromIndex++;
              if (searchFromIndex > blockText.length) break;
              continue;
            }
            frAllMatches.push({
              sceneIndex: sceneIdx,
              blockIndex: blockIdx,
              matchIndexInBlock: foundIndex,
              matchLength: findPatternValue.length,
              chapterTitle: scene.title,
              blockText,
              matchedText: blockText.substring(foundIndex, foundIndex + findPatternValue.length)
            });
            searchFromIndex = foundIndex + findPatternValue.length;
          }
        }
      });
    } catch (e) {
      console.warn(`Skipping scene "${scene.title || "Untitled"}" due to invalid JSON during find:`, e);
    }
  });
  if (frAllMatches.length > 0) {
    showAppToast(`${frAllMatches.length} match(es) found.`);
  } else {
    showAppToast(`No matches found for "${escapeHtml(findPatternValue)}".`);
  }
}
function initializeFindReplaceBackup(showAppToast, toggleAppSpinner) {
  const frBackupFileInput = document.getElementById("frBackupFile");
  const frBackupFileNameEl = document.getElementById("frBackupFileName");
  const clearFrBackupFileBtn = document.getElementById("clearFrBackupFile");
  const findPatternInput = document.getElementById("findPattern");
  const useRegexCheckbox = document.getElementById("useRegexBackup");
  const caseSensitiveCheckbox = document.getElementById("frCaseSensitiveCheckbox");
  const wholeWordCheckbox = document.getElementById("frWholeWordCheckbox");
  const replaceTextInput = document.getElementById("replaceText");
  const findNextBtn = document.getElementById("findNextBtn");
  const findPreviousBtn = document.getElementById("findPreviousBtn");
  const replaceNextBtn = document.getElementById("replaceNextBtn");
  const replaceAllBtn = document.getElementById("replaceAllBtn");
  const downloadCurrentFrBackupBtn = document.getElementById("downloadCurrentFrBackupBtn");
  const currentMatchDisplay = document.getElementById("currentMatchDisplay");
  const matchSceneTitleEl = document.getElementById("frMatchSceneTitle");
  const matchBlockIndexEl = document.getElementById("frMatchBlockIndex");
  const matchCountDisplayEl = document.getElementById("frMatchCountDisplay");
  const statusEl = document.getElementById("statusFindReplaceBackup");
  if (!frBackupFileInput || !frBackupFileNameEl || !clearFrBackupFileBtn || !findPatternInput || !useRegexCheckbox || !caseSensitiveCheckbox || !wholeWordCheckbox || !replaceTextInput || !findNextBtn || !findPreviousBtn || !replaceNextBtn || !replaceAllBtn || !downloadCurrentFrBackupBtn || !currentMatchDisplay || !matchSceneTitleEl || !matchBlockIndexEl || !matchCountDisplayEl || !statusEl) {
    console.error("Find & Replace Backup: One or more UI elements not found. Initialization failed.");
    return;
  }
  function resetFrState(fullReset = true) {
    if (fullReset) {
      frData = null;
      frLastFindPattern = "";
    }
    frAllMatches = [];
    frCurrentMatchIndex = -1;
    updateMatchDisplay(currentMatchDisplay, matchSceneTitleEl, matchBlockIndexEl, matchCountDisplayEl);
    if (statusEl) statusEl.style.display = "none";
    if (downloadCurrentFrBackupBtn) downloadCurrentFrBackupBtn.disabled = !frData;
  }
  frBackupFileInput.addEventListener("change", (e) => {
    const target = e.target;
    resetFrState(true);
    if (!target.files || !target.files.length) {
      frBackupFileNameEl.textContent = "";
      if (clearFrBackupFileBtn) clearFrBackupFileBtn.style.display = "none";
      return;
    }
    frBackupFileNameEl.textContent = `Selected: ${target.files[0].name}`;
    if (clearFrBackupFileBtn) clearFrBackupFileBtn.style.display = "inline-block";
    toggleAppSpinner(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        frData = JSON.parse(event.target?.result);
        if (!frData.revisions || !frData.revisions[0] || !Array.isArray(frData.revisions[0].scenes)) {
          throw new Error("Invalid backup structure (missing scenes array).");
        }
        showAppToast("Backup file loaded.");
        if (downloadCurrentFrBackupBtn) downloadCurrentFrBackupBtn.disabled = false;
      } catch (err) {
        showAppToast(err.message || "Error loading backup.", true);
        if (statusEl) {
          statusEl.textContent = `Error: ${err.message || "Could not load backup."}`;
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
        resetFrState(true);
        frBackupFileNameEl.textContent = "";
        if (clearFrBackupFileBtn) clearFrBackupFileBtn.style.display = "none";
        frBackupFileInput.value = "";
      } finally {
        toggleAppSpinner(false);
      }
    };
    reader.onerror = () => {
      showAppToast("Error reading backup file.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Could not read backup file.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      resetFrState(true);
      frBackupFileNameEl.textContent = "";
      if (clearFrBackupFileBtn) clearFrBackupFileBtn.style.display = "none";
      frBackupFileInput.value = "";
      toggleAppSpinner(false);
    };
    reader.readAsText(target.files[0]);
  });
  clearFrBackupFileBtn.addEventListener("click", () => {
    frBackupFileInput.value = "";
    frBackupFileNameEl.textContent = "";
    clearFrBackupFileBtn.style.display = "none";
    resetFrState(true);
  });
  useRegexCheckbox.addEventListener("change", () => {
    wholeWordCheckbox.disabled = useRegexCheckbox.checked;
    if (useRegexCheckbox.checked) {
      wholeWordCheckbox.checked = false;
    }
    resetFrState(false);
  });
  caseSensitiveCheckbox.addEventListener("change", () => resetFrState(false));
  wholeWordCheckbox.addEventListener("change", () => resetFrState(false));
  findPatternInput.addEventListener("input", () => resetFrState(false));
  function handleFind(direction) {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData) {
      showAppToast("Upload a backup file first.", true);
      return;
    }
    const pattern = findPatternInput.value;
    const useRegex = useRegexCheckbox.checked;
    const caseSensitive = caseSensitiveCheckbox.checked;
    const wholeWord = wholeWordCheckbox.checked && !useRegex;
    if (pattern !== frLastFindPattern || useRegex !== frLastUseRegex || caseSensitive !== frLastCaseSensitive || wholeWord !== frLastWholeWord || frAllMatches.length === 0 && pattern) {
      performInitialFind(pattern, useRegex, caseSensitive, wholeWord, showAppToast);
    }
    if (frAllMatches.length === 0) {
      updateMatchDisplay(currentMatchDisplay, matchSceneTitleEl, matchBlockIndexEl, matchCountDisplayEl);
      return;
    }
    if (direction === "next") {
      if (frCurrentMatchIndex < frAllMatches.length - 1) {
        frCurrentMatchIndex++;
      } else {
        showAppToast("Reached end of document. Looping to start.", false);
        frCurrentMatchIndex = 0;
      }
    } else {
      if (frCurrentMatchIndex > 0) {
        frCurrentMatchIndex--;
      } else {
        showAppToast("Reached beginning of document. Looping to end.", false);
        frCurrentMatchIndex = frAllMatches.length - 1;
      }
    }
    updateMatchDisplay(currentMatchDisplay, matchSceneTitleEl, matchBlockIndexEl, matchCountDisplayEl);
  }
  findNextBtn.addEventListener("click", () => handleFind("next"));
  findPreviousBtn.addEventListener("click", () => handleFind("previous"));
  replaceNextBtn.addEventListener("click", () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData || frCurrentMatchIndex === -1 || !frAllMatches[frCurrentMatchIndex]) {
      showAppToast('No current match to replace. Use "Find Next" first.', true);
      return;
    }
    try {
      const currentMatch = frAllMatches[frCurrentMatchIndex];
      const replacementText = replaceTextInput.value;
      const scene = frData.revisions[0].scenes[currentMatch.sceneIndex];
      const parsedSceneContent = JSON.parse(scene.text);
      const targetBlock = parsedSceneContent.blocks[currentMatch.blockIndex];
      if (targetBlock.type !== "text" || typeof targetBlock.text !== "string") {
        showAppToast("Cannot replace in non-text block.", true);
        return;
      }
      const originalBlockText = targetBlock.text;
      const textBeforeMatch = originalBlockText.substring(0, currentMatch.matchIndexInBlock);
      const textAfterMatch = originalBlockText.substring(currentMatch.matchIndexInBlock + currentMatch.matchLength);
      targetBlock.text = textBeforeMatch + replacementText + textAfterMatch;
      scene.text = JSON.stringify(parsedSceneContent);
      showAppToast("Match replaced.", false);
      const oldMatchGlobalIndex = frCurrentMatchIndex;
      performInitialFind(findPatternInput.value, useRegexCheckbox.checked, caseSensitiveCheckbox.checked, wholeWordCheckbox.checked && !useRegexCheckbox.checked, showAppToast);
      if (frAllMatches.length > 0) {
        frCurrentMatchIndex = Math.min(oldMatchGlobalIndex, frAllMatches.length - 1);
        if (frCurrentMatchIndex < 0 && frAllMatches.length > 0) frCurrentMatchIndex = 0;
      } else {
        frCurrentMatchIndex = -1;
      }
      updateMatchDisplay(currentMatchDisplay, matchSceneTitleEl, matchBlockIndexEl, matchCountDisplayEl);
    } catch (err) {
      showAppToast(err.message || "Error replacing text.", true);
      console.error("Replace Next Error:", err);
    }
  });
  replaceAllBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData) {
      showAppToast("Upload a backup file first.", true);
      return;
    }
    const findPattern = findPatternInput.value;
    const replacementText = replaceTextInput.value;
    const useRegex = useRegexCheckbox.checked;
    const caseSensitive = caseSensitiveCheckbox.checked;
    const wholeWord = wholeWordCheckbox.checked && !useRegex;
    if (!findPattern && !useRegex) {
      showAppToast("Enter a find pattern.", true);
      return;
    }
    if (!findPattern && useRegex && findPattern.length === 0 && replacementText.length === 0) {
      showAppToast("Replacing empty regex match with empty string can be risky. Aborting.", true);
      return;
    }
    toggleAppSpinner(true);
    try {
      const rev = frData.revisions[0];
      let totalReplacementsMade = 0;
      let regex = null;
      if (useRegex) {
        regex = new RegExp(findPattern, `g${caseSensitive ? "" : "i"}`);
      } else if (wholeWord) {
        const escapedPattern = findPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(`\\b${escapedPattern}\\b`, `g${caseSensitive ? "" : "i"}`);
      }
      rev.scenes.forEach((scene) => {
        try {
          const sceneContent = JSON.parse(scene.text);
          sceneContent.blocks.forEach((block) => {
            if (block.type === "text" && typeof block.text === "string" && block.text) {
              const originalText = block.text;
              let newText = originalText;
              if (regex) {
                newText = originalText.replace(regex, (match) => {
                  totalReplacementsMade++;
                  return replacementText;
                });
              } else {
                const patternToSearch = caseSensitive ? findPattern : findPattern.toLowerCase();
                const textToSearchIn = caseSensitive ? originalText : originalText.toLowerCase();
                let result = "";
                let lastIndex = 0;
                let foundIndex;
                if (patternToSearch.length === 0) {
                  if (replacementText.length > 0) {
                    for (let k = 0; k < originalText.length; k++) {
                      result += replacementText + originalText[k];
                      totalReplacementsMade++;
                    }
                    result += replacementText;
                    totalReplacementsMade++;
                    newText = result;
                  } else {
                    newText = originalText;
                  }
                } else {
                  while ((foundIndex = textToSearchIn.indexOf(patternToSearch, lastIndex)) !== -1) {
                    result += originalText.substring(lastIndex, foundIndex) + replacementText;
                    lastIndex = foundIndex + findPattern.length;
                    totalReplacementsMade++;
                  }
                  result += originalText.substring(lastIndex);
                  newText = result;
                }
              }
              block.text = newText;
            }
          });
          scene.text = JSON.stringify(sceneContent);
        } catch (e) {
          console.warn(`Error processing scene "${scene.title}" during Replace All:`, e);
        }
      });
      const now = Date.now();
      frData.last_update_date = now;
      frData.last_backup_date = now;
      if (rev) rev.date = now;
      const blob = new Blob([JSON.stringify(frData, null, 2)], { type: "application/json" });
      const filename = `${frData.title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "replaced_backup"}.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      showAppToast(`Replace All complete. ${totalReplacementsMade} replacement(s) made. Download started.`);
      resetFrState(false);
    } catch (err) {
      showAppToast(err.message || "Error during Replace All.", true);
      console.error("Replace All Error:", err);
    } finally {
      toggleAppSpinner(false);
    }
  });
  downloadCurrentFrBackupBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData) {
      showAppToast("No backup file loaded to download.", true);
      return;
    }
    toggleAppSpinner(true);
    try {
      const now = Date.now();
      frData.last_update_date = now;
      frData.last_backup_date = now;
      if (frData.revisions && frData.revisions[0]) {
        frData.revisions[0].date = now;
      }
      const blob = new Blob([JSON.stringify(frData, null, 2)], { type: "application/json" });
      const filename = `${frData.title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "current_backup"}_current.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      showAppToast(`Current backup download started: ${filename}`);
      if (statusEl) {
        statusEl.textContent = `Current backup download started: ${filename}`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
      }
    } catch (err) {
      showAppToast(err.message || "Error downloading current backup.", true);
      if (statusEl) {
        statusEl.textContent = `Error: ${err.message || "Could not download current backup."}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      console.error("Download Current Backup Error:", err);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/main.ts
init_dist();

// node_modules/@capacitor/status-bar/dist/esm/index.js
init_dist();

// node_modules/@capacitor/status-bar/dist/esm/definitions.js
var Style;
(function(Style2) {
  Style2["Dark"] = "DARK";
  Style2["Light"] = "LIGHT";
  Style2["Default"] = "DEFAULT";
})(Style || (Style = {}));
var Animation;
(function(Animation2) {
  Animation2["None"] = "NONE";
  Animation2["Slide"] = "SLIDE";
  Animation2["Fade"] = "FADE";
})(Animation || (Animation = {}));

// node_modules/@capacitor/status-bar/dist/esm/index.js
var StatusBar = registerPlugin("StatusBar");

// node_modules/@capacitor/app/dist/esm/index.js
init_dist();
var App = registerPlugin("App", {
  web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.AppWeb())
});

// ts/main.ts
var toolSectionsMap = {
  "splitter": { elementId: "splitterApp", title: "EPUB Chapter Splitter" },
  "zipToEpub": { elementId: "zipToEpubApp", title: "ZIP to EPUB Converter" },
  "epubToZip": { elementId: "epubToZipApp", title: "EPUB to ZIP (TXT)" },
  "createBackupFromZip": { elementId: "createBackupFromZipApp", title: "Create Backup from ZIP" },
  "createNewBackup": { elementId: "createNewBackupApp", title: "Create New Backup File" },
  "extendBackup": { elementId: "extendBackupApp", title: "Extend Existing Backup File" },
  "mergeBackup": { elementId: "mergeBackupApp", title: "Merge Backup Files" },
  "augmentBackupWithZip": { elementId: "augmentBackupWithZipApp", title: "Augment Backup with ZIP" },
  "findReplaceBackup": { elementId: "findReplaceBackupApp", title: "Find & Replace in Backup File" }
};
window.toggleMenu = () => {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Light });
  }
  toggleMenu();
};
window.launchAppFromCard = (appId) => {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Light });
  }
  launchAppFromCard(appId, false, toolSectionsMap);
};
window.showDashboard = () => {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Light });
  }
  showDashboard(false, toolSectionsMap);
};
function registerServiceWorker() {
  if ("serviceWorker" in navigator && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
    const swUrl = new URL("service-worker.js", window.location.href).href;
    navigator.serviceWorker.register(swUrl).then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope);
    }).catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
  }
}
function initializeApp() {
  registerServiceWorker();
  const spinnerSplEl = document.getElementById("spinnerSplitter");
  const spinnerZipToEpubEl = document.getElementById("spinnerZipToEpub");
  const spinnerEpubToZipEl = document.getElementById("spinnerEpubToZip");
  const spinnerCreateBackupFromZipEl = document.getElementById("spinnerCreateBackupFromZip");
  const spinnerCreateNewBackupEl = document.getElementById("spinnerCreateNewBackup");
  const spinnerExtendBackupEl = document.getElementById("spinnerExtendBackup");
  const spinnerMergeBackupEl = document.getElementById("spinnerMergeBackup");
  const spinnerAugmentBackupEl = document.getElementById("spinnerAugmentBackup");
  const spinnerFindReplaceBackupEl = document.getElementById("spinnerFindReplaceBackup");
  initializeEpubSplitter(showToast, (show) => toggleSpinner(spinnerSplEl, show));
  initializeZipToEpub(showToast, (show) => toggleSpinner(spinnerZipToEpubEl, show));
  initializeEpubToZip(showToast, (show) => toggleSpinner(spinnerEpubToZipEl, show));
  initializeCreateBackupFromZip(showToast, (show) => toggleSpinner(spinnerCreateBackupFromZipEl, show));
  initializeCreateNewBackup(showToast, (show) => toggleSpinner(spinnerCreateNewBackupEl, show));
  initializeExtendBackup(showToast, (show) => toggleSpinner(spinnerExtendBackupEl, show));
  initializeMergeBackup(showToast, (show) => toggleSpinner(spinnerMergeBackupEl, show));
  initializeAugmentBackupWithZip(showToast, (show) => toggleSpinner(spinnerAugmentBackupEl, show));
  initializeFindReplaceBackup(showToast, (show) => toggleSpinner(spinnerFindReplaceBackupEl, show));
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark }).catch((err) => console.error("StatusBar.setStyle error:", err));
    StatusBar.setBackgroundColor({ color: "#111111" }).catch((err) => console.error("StatusBar.setBackgroundColor error:", err));
    App.addListener("backButton", ({ canGoBack }) => {
      const sidebarEl2 = document.getElementById("sidebar");
      if (sidebarEl2?.classList.contains("open")) {
        toggleMenu();
      } else if (window.location.hash !== "#dashboard" && window.location.hash !== "") {
        showDashboard(false, toolSectionsMap);
      } else {
        App.exitApp();
      }
    }).catch((err) => console.error("App.addListener(backButton) error:", err));
  }
  function routeApp(fromPopStateUpdate) {
    const hash = window.location.hash;
    console.log(`Routing based on hash: '${hash}', fromPopStateUpdate: ${fromPopStateUpdate}`);
    if (hash.startsWith("#tool-")) {
      const toolId = hash.substring("#tool-".length);
      if (toolSectionsMap[toolId]) {
        launchAppFromCard(toolId, fromPopStateUpdate, toolSectionsMap);
      } else {
        console.warn(`Invalid tool ID in hash: ${toolId}. Defaulting to dashboard.`);
        showDashboard(fromPopStateUpdate, toolSectionsMap);
        if (!fromPopStateUpdate) {
          const targetDashboardHash = "#dashboard";
          const historyUrl = window.location.protocol === "blob:" ? null : targetDashboardHash;
          if (window.location.hash !== targetDashboardHash && historyUrl !== null) {
            history.replaceState({ view: "dashboard" }, "Novelist Tools Dashboard", historyUrl);
          }
        }
      }
    } else if (hash === "#dashboard" || hash === "") {
      showDashboard(fromPopStateUpdate, toolSectionsMap);
      if (hash === "" && !fromPopStateUpdate) {
        const targetDashboardHash = "#dashboard";
        const historyUrl = window.location.protocol === "blob:" ? null : targetDashboardHash;
        if (historyUrl !== null) {
          history.pushState({ view: "dashboard" }, "Novelist Tools Dashboard", historyUrl);
        }
      }
    } else {
      console.warn(`Unknown hash: ${hash}. Defaulting to dashboard.`);
      showDashboard(fromPopStateUpdate, toolSectionsMap);
      if (!fromPopStateUpdate) {
        const targetDashboardHash = "#dashboard";
        const historyUrl = window.location.protocol === "blob:" ? null : targetDashboardHash;
        if (window.location.hash !== targetDashboardHash && historyUrl !== null) {
          history.replaceState({ view: "dashboard" }, "Novelist Tools Dashboard", historyUrl);
        }
      }
    }
  }
  window.addEventListener("popstate", (event) => {
    console.log("MAIN: Popstate event. State:", event.state, "Current Hash:", window.location.hash);
    routeApp(true);
  });
  if (window.location.protocol === "blob:") {
    console.log("MAIN: Initial load from blob URL. Showing dashboard directly.");
    showDashboard(true, toolSectionsMap);
  } else if (window.location.hash) {
    console.log("MAIN: Initial load with hash:", window.location.hash);
    routeApp(true);
  } else {
    const persistedToolId = sessionStorage.getItem("activeToolId");
    if (persistedToolId && toolSectionsMap[persistedToolId]) {
      console.log(`MAIN: Initial load, no hash, persisted tool: ${persistedToolId}`);
      launchAppFromCard(persistedToolId, false, toolSectionsMap);
    } else {
      console.log("MAIN: Initial load, no hash, no persisted tool. Showing dashboard.");
      showDashboard(false, toolSectionsMap);
    }
  }
}

// index.tsx
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
