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

// node_modules/@awesome-cordova-plugins/core/bootstrap.js
function checkReady() {
  if (typeof process === "undefined") {
    var win_1 = typeof window !== "undefined" ? window : {};
    var DEVICE_READY_TIMEOUT_1 = 5e3;
    var before_1 = Date.now();
    var didFireReady_1 = false;
    win_1.document.addEventListener("deviceready", function() {
      console.log("Ionic Native: deviceready event fired after " + (Date.now() - before_1) + " ms");
      didFireReady_1 = true;
    });
    setTimeout(function() {
      if (!didFireReady_1 && win_1.cordova) {
        console.warn("Ionic Native: deviceready did not fire within " + DEVICE_READY_TIMEOUT_1 + "ms. This can happen when plugins are in an inconsistent state. Try removing plugins from plugins/ and reinstalling them.");
      }
    }, DEVICE_READY_TIMEOUT_1);
  }
}

// node_modules/tslib/tslib.es6.mjs
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f2, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f2) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f2 = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f2 = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __values(o) {
  var s2 = typeof Symbol === "function" && Symbol.iterator, m = s2 && o[s2], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function awaitReturn(f2) {
    return function(v) {
      return Promise.resolve(v).then(f2, reject);
    };
  }
  function verb(n, f2) {
    if (g[n]) {
      i[n] = function(v) {
        return new Promise(function(a, b) {
          q.push([n, v, a, b]) > 1 || resume(n, v);
        });
      };
      if (f2) i[n] = f2(i[n]);
    }
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f2, v) {
    if (f2(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve2, reject) {
        v = o[n](v), settle(resolve2, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve2, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve2({ value: v2, done: d });
    }, reject);
  }
}

// node_modules/rxjs/dist/esm5/internal/util/isFunction.js
function isFunction(value) {
  return typeof value === "function";
}

// node_modules/rxjs/dist/esm5/internal/util/createErrorClass.js
function createErrorClass(createImpl) {
  var _super = function(instance) {
    Error.call(instance);
    instance.stack = new Error().stack;
  };
  var ctorFunc = createImpl(_super);
  ctorFunc.prototype = Object.create(Error.prototype);
  ctorFunc.prototype.constructor = ctorFunc;
  return ctorFunc;
}

// node_modules/rxjs/dist/esm5/internal/util/UnsubscriptionError.js
var UnsubscriptionError = createErrorClass(function(_super) {
  return function UnsubscriptionErrorImpl(errors) {
    _super(this);
    this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
      return i + 1 + ") " + err.toString();
    }).join("\n  ") : "";
    this.name = "UnsubscriptionError";
    this.errors = errors;
  };
});

// node_modules/rxjs/dist/esm5/internal/util/arrRemove.js
function arrRemove(arr, item) {
  if (arr) {
    var index = arr.indexOf(item);
    0 <= index && arr.splice(index, 1);
  }
}

// node_modules/rxjs/dist/esm5/internal/Subscription.js
var Subscription = function() {
  function Subscription2(initialTeardown) {
    this.initialTeardown = initialTeardown;
    this.closed = false;
    this._parentage = null;
    this._finalizers = null;
  }
  Subscription2.prototype.unsubscribe = function() {
    var e_1, _a, e_2, _b;
    var errors;
    if (!this.closed) {
      this.closed = true;
      var _parentage = this._parentage;
      if (_parentage) {
        this._parentage = null;
        if (Array.isArray(_parentage)) {
          try {
            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
              var parent_1 = _parentage_1_1.value;
              parent_1.remove(this);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        } else {
          _parentage.remove(this);
        }
      }
      var initialFinalizer = this.initialTeardown;
      if (isFunction(initialFinalizer)) {
        try {
          initialFinalizer();
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e];
        }
      }
      var _finalizers = this._finalizers;
      if (_finalizers) {
        this._finalizers = null;
        try {
          for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
            var finalizer = _finalizers_1_1.value;
            try {
              execFinalizer(finalizer);
            } catch (err) {
              errors = errors !== null && errors !== void 0 ? errors : [];
              if (err instanceof UnsubscriptionError) {
                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
              } else {
                errors.push(err);
              }
            }
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
          } finally {
            if (e_2) throw e_2.error;
          }
        }
      }
      if (errors) {
        throw new UnsubscriptionError(errors);
      }
    }
  };
  Subscription2.prototype.add = function(teardown) {
    var _a;
    if (teardown && teardown !== this) {
      if (this.closed) {
        execFinalizer(teardown);
      } else {
        if (teardown instanceof Subscription2) {
          if (teardown.closed || teardown._hasParent(this)) {
            return;
          }
          teardown._addParent(this);
        }
        (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
      }
    }
  };
  Subscription2.prototype._hasParent = function(parent) {
    var _parentage = this._parentage;
    return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
  };
  Subscription2.prototype._addParent = function(parent) {
    var _parentage = this._parentage;
    this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
  };
  Subscription2.prototype._removeParent = function(parent) {
    var _parentage = this._parentage;
    if (_parentage === parent) {
      this._parentage = null;
    } else if (Array.isArray(_parentage)) {
      arrRemove(_parentage, parent);
    }
  };
  Subscription2.prototype.remove = function(teardown) {
    var _finalizers = this._finalizers;
    _finalizers && arrRemove(_finalizers, teardown);
    if (teardown instanceof Subscription2) {
      teardown._removeParent(this);
    }
  };
  Subscription2.EMPTY = function() {
    var empty = new Subscription2();
    empty.closed = true;
    return empty;
  }();
  return Subscription2;
}();
var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
  return value instanceof Subscription || value && "closed" in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe);
}
function execFinalizer(finalizer) {
  if (isFunction(finalizer)) {
    finalizer();
  } else {
    finalizer.unsubscribe();
  }
}

// node_modules/rxjs/dist/esm5/internal/config.js
var config = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: void 0,
  useDeprecatedSynchronousErrorHandling: false,
  useDeprecatedNextContext: false
};

// node_modules/rxjs/dist/esm5/internal/scheduler/timeoutProvider.js
var timeoutProvider = {
  setTimeout: function(handler, timeout) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      args[_i - 2] = arguments[_i];
    }
    var delegate = timeoutProvider.delegate;
    if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
      return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
    }
    return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
  },
  clearTimeout: function(handle) {
    var delegate = timeoutProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
  },
  delegate: void 0
};

// node_modules/rxjs/dist/esm5/internal/util/reportUnhandledError.js
function reportUnhandledError(err) {
  timeoutProvider.setTimeout(function() {
    var onUnhandledError = config.onUnhandledError;
    if (onUnhandledError) {
      onUnhandledError(err);
    } else {
      throw err;
    }
  });
}

// node_modules/rxjs/dist/esm5/internal/util/noop.js
function noop() {
}

// node_modules/rxjs/dist/esm5/internal/NotificationFactories.js
var COMPLETE_NOTIFICATION = function() {
  return createNotification("C", void 0, void 0);
}();
function errorNotification(error) {
  return createNotification("E", void 0, error);
}
function nextNotification(value) {
  return createNotification("N", value, void 0);
}
function createNotification(kind, value, error) {
  return {
    kind,
    value,
    error
  };
}

// node_modules/rxjs/dist/esm5/internal/util/errorContext.js
var context = null;
function errorContext(cb) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    var isRoot = !context;
    if (isRoot) {
      context = { errorThrown: false, error: null };
    }
    cb();
    if (isRoot) {
      var _a = context, errorThrown = _a.errorThrown, error = _a.error;
      context = null;
      if (errorThrown) {
        throw error;
      }
    }
  } else {
    cb();
  }
}
function captureError(err) {
  if (config.useDeprecatedSynchronousErrorHandling && context) {
    context.errorThrown = true;
    context.error = err;
  }
}

// node_modules/rxjs/dist/esm5/internal/Subscriber.js
var Subscriber = function(_super) {
  __extends(Subscriber2, _super);
  function Subscriber2(destination) {
    var _this = _super.call(this) || this;
    _this.isStopped = false;
    if (destination) {
      _this.destination = destination;
      if (isSubscription(destination)) {
        destination.add(_this);
      }
    } else {
      _this.destination = EMPTY_OBSERVER;
    }
    return _this;
  }
  Subscriber2.create = function(next, error, complete) {
    return new SafeSubscriber(next, error, complete);
  };
  Subscriber2.prototype.next = function(value) {
    if (this.isStopped) {
      handleStoppedNotification(nextNotification(value), this);
    } else {
      this._next(value);
    }
  };
  Subscriber2.prototype.error = function(err) {
    if (this.isStopped) {
      handleStoppedNotification(errorNotification(err), this);
    } else {
      this.isStopped = true;
      this._error(err);
    }
  };
  Subscriber2.prototype.complete = function() {
    if (this.isStopped) {
      handleStoppedNotification(COMPLETE_NOTIFICATION, this);
    } else {
      this.isStopped = true;
      this._complete();
    }
  };
  Subscriber2.prototype.unsubscribe = function() {
    if (!this.closed) {
      this.isStopped = true;
      _super.prototype.unsubscribe.call(this);
      this.destination = null;
    }
  };
  Subscriber2.prototype._next = function(value) {
    this.destination.next(value);
  };
  Subscriber2.prototype._error = function(err) {
    try {
      this.destination.error(err);
    } finally {
      this.unsubscribe();
    }
  };
  Subscriber2.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  };
  return Subscriber2;
}(Subscription);
var _bind = Function.prototype.bind;
function bind(fn, thisArg) {
  return _bind.call(fn, thisArg);
}
var ConsumerObserver = function() {
  function ConsumerObserver2(partialObserver) {
    this.partialObserver = partialObserver;
  }
  ConsumerObserver2.prototype.next = function(value) {
    var partialObserver = this.partialObserver;
    if (partialObserver.next) {
      try {
        partialObserver.next(value);
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  ConsumerObserver2.prototype.error = function(err) {
    var partialObserver = this.partialObserver;
    if (partialObserver.error) {
      try {
        partialObserver.error(err);
      } catch (error) {
        handleUnhandledError(error);
      }
    } else {
      handleUnhandledError(err);
    }
  };
  ConsumerObserver2.prototype.complete = function() {
    var partialObserver = this.partialObserver;
    if (partialObserver.complete) {
      try {
        partialObserver.complete();
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  return ConsumerObserver2;
}();
var SafeSubscriber = function(_super) {
  __extends(SafeSubscriber2, _super);
  function SafeSubscriber2(observerOrNext, error, complete) {
    var _this = _super.call(this) || this;
    var partialObserver;
    if (isFunction(observerOrNext) || !observerOrNext) {
      partialObserver = {
        next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
        error: error !== null && error !== void 0 ? error : void 0,
        complete: complete !== null && complete !== void 0 ? complete : void 0
      };
    } else {
      var context_1;
      if (_this && config.useDeprecatedNextContext) {
        context_1 = Object.create(observerOrNext);
        context_1.unsubscribe = function() {
          return _this.unsubscribe();
        };
        partialObserver = {
          next: observerOrNext.next && bind(observerOrNext.next, context_1),
          error: observerOrNext.error && bind(observerOrNext.error, context_1),
          complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
        };
      } else {
        partialObserver = observerOrNext;
      }
    }
    _this.destination = new ConsumerObserver(partialObserver);
    return _this;
  }
  return SafeSubscriber2;
}(Subscriber);
function handleUnhandledError(error) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    captureError(error);
  } else {
    reportUnhandledError(error);
  }
}
function defaultErrorHandler(err) {
  throw err;
}
function handleStoppedNotification(notification, subscriber) {
  var onStoppedNotification = config.onStoppedNotification;
  onStoppedNotification && timeoutProvider.setTimeout(function() {
    return onStoppedNotification(notification, subscriber);
  });
}
var EMPTY_OBSERVER = {
  closed: true,
  next: noop,
  error: defaultErrorHandler,
  complete: noop
};

// node_modules/rxjs/dist/esm5/internal/symbol/observable.js
var observable = function() {
  return typeof Symbol === "function" && Symbol.observable || "@@observable";
}();

// node_modules/rxjs/dist/esm5/internal/util/identity.js
function identity(x) {
  return x;
}

// node_modules/rxjs/dist/esm5/internal/util/pipe.js
function pipeFromArray(fns) {
  if (fns.length === 0) {
    return identity;
  }
  if (fns.length === 1) {
    return fns[0];
  }
  return function piped(input) {
    return fns.reduce(function(prev, fn) {
      return fn(prev);
    }, input);
  };
}

// node_modules/rxjs/dist/esm5/internal/Observable.js
var Observable = function() {
  function Observable2(subscribe) {
    if (subscribe) {
      this._subscribe = subscribe;
    }
  }
  Observable2.prototype.lift = function(operator) {
    var observable2 = new Observable2();
    observable2.source = this;
    observable2.operator = operator;
    return observable2;
  };
  Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
    var _this = this;
    var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
    errorContext(function() {
      var _a = _this, operator = _a.operator, source = _a.source;
      subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
    });
    return subscriber;
  };
  Observable2.prototype._trySubscribe = function(sink) {
    try {
      return this._subscribe(sink);
    } catch (err) {
      sink.error(err);
    }
  };
  Observable2.prototype.forEach = function(next, promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve2, reject) {
      var subscriber = new SafeSubscriber({
        next: function(value) {
          try {
            next(value);
          } catch (err) {
            reject(err);
            subscriber.unsubscribe();
          }
        },
        error: reject,
        complete: resolve2
      });
      _this.subscribe(subscriber);
    });
  };
  Observable2.prototype._subscribe = function(subscriber) {
    var _a;
    return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
  };
  Observable2.prototype[observable] = function() {
    return this;
  };
  Observable2.prototype.pipe = function() {
    var operations = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      operations[_i] = arguments[_i];
    }
    return pipeFromArray(operations)(this);
  };
  Observable2.prototype.toPromise = function(promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve2, reject) {
      var value;
      _this.subscribe(function(x) {
        return value = x;
      }, function(err) {
        return reject(err);
      }, function() {
        return resolve2(value);
      });
    });
  };
  Observable2.create = function(subscribe) {
    return new Observable2(subscribe);
  };
  return Observable2;
}();
function getPromiseCtor(promiseCtor) {
  var _a;
  return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
  return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
  return value && value instanceof Subscriber || isObserver(value) && isSubscription(value);
}

// node_modules/rxjs/dist/esm5/internal/util/lift.js
function hasLift(source) {
  return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
  return function(source) {
    if (hasLift(source)) {
      return source.lift(function(liftedSource) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError("Unable to lift unknown Observable type");
  };
}

// node_modules/rxjs/dist/esm5/internal/operators/OperatorSubscriber.js
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
  return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = function(_super) {
  __extends(OperatorSubscriber2, _super);
  function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
    var _this = _super.call(this, destination) || this;
    _this.onFinalize = onFinalize;
    _this.shouldUnsubscribe = shouldUnsubscribe;
    _this._next = onNext ? function(value) {
      try {
        onNext(value);
      } catch (err) {
        destination.error(err);
      }
    } : _super.prototype._next;
    _this._error = onError ? function(err) {
      try {
        onError(err);
      } catch (err2) {
        destination.error(err2);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._error;
    _this._complete = onComplete ? function() {
      try {
        onComplete();
      } catch (err) {
        destination.error(err);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._complete;
    return _this;
  }
  OperatorSubscriber2.prototype.unsubscribe = function() {
    var _a;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var closed_1 = this.closed;
      _super.prototype.unsubscribe.call(this);
      !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
    }
  };
  return OperatorSubscriber2;
}(Subscriber);

// node_modules/rxjs/dist/esm5/internal/util/isArrayLike.js
var isArrayLike = function(x) {
  return x && typeof x.length === "number" && typeof x !== "function";
};

// node_modules/rxjs/dist/esm5/internal/util/isPromise.js
function isPromise(value) {
  return isFunction(value === null || value === void 0 ? void 0 : value.then);
}

// node_modules/rxjs/dist/esm5/internal/util/isInteropObservable.js
function isInteropObservable(input) {
  return isFunction(input[observable]);
}

// node_modules/rxjs/dist/esm5/internal/util/isAsyncIterable.js
function isAsyncIterable(obj) {
  return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}

// node_modules/rxjs/dist/esm5/internal/util/throwUnobservableError.js
function createInvalidObservableTypeError(input) {
  return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}

// node_modules/rxjs/dist/esm5/internal/symbol/iterator.js
function getSymbolIterator() {
  if (typeof Symbol !== "function" || !Symbol.iterator) {
    return "@@iterator";
  }
  return Symbol.iterator;
}
var iterator = getSymbolIterator();

// node_modules/rxjs/dist/esm5/internal/util/isIterable.js
function isIterable(input) {
  return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}

// node_modules/rxjs/dist/esm5/internal/util/isReadableStreamLike.js
function readableStreamLikeToAsyncGenerator(readableStream) {
  return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
    var reader, _a, value, done;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          reader = readableStream.getReader();
          _b.label = 1;
        case 1:
          _b.trys.push([1, , 9, 10]);
          _b.label = 2;
        case 2:
          if (false) return [3, 8];
          return [4, __await(reader.read())];
        case 3:
          _a = _b.sent(), value = _a.value, done = _a.done;
          if (!done) return [3, 5];
          return [4, __await(void 0)];
        case 4:
          return [2, _b.sent()];
        case 5:
          return [4, __await(value)];
        case 6:
          return [4, _b.sent()];
        case 7:
          _b.sent();
          return [3, 2];
        case 8:
          return [3, 10];
        case 9:
          reader.releaseLock();
          return [7];
        case 10:
          return [2];
      }
    });
  });
}
function isReadableStreamLike(obj) {
  return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}

// node_modules/rxjs/dist/esm5/internal/observable/innerFrom.js
function innerFrom(input) {
  if (input instanceof Observable) {
    return input;
  }
  if (input != null) {
    if (isInteropObservable(input)) {
      return fromInteropObservable(input);
    }
    if (isArrayLike(input)) {
      return fromArrayLike(input);
    }
    if (isPromise(input)) {
      return fromPromise(input);
    }
    if (isAsyncIterable(input)) {
      return fromAsyncIterable(input);
    }
    if (isIterable(input)) {
      return fromIterable(input);
    }
    if (isReadableStreamLike(input)) {
      return fromReadableStreamLike(input);
    }
  }
  throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
  return new Observable(function(subscriber) {
    var obs = obj[observable]();
    if (isFunction(obs.subscribe)) {
      return obs.subscribe(subscriber);
    }
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function fromArrayLike(array) {
  return new Observable(function(subscriber) {
    for (var i = 0; i < array.length && !subscriber.closed; i++) {
      subscriber.next(array[i]);
    }
    subscriber.complete();
  });
}
function fromPromise(promise) {
  return new Observable(function(subscriber) {
    promise.then(function(value) {
      if (!subscriber.closed) {
        subscriber.next(value);
        subscriber.complete();
      }
    }, function(err) {
      return subscriber.error(err);
    }).then(null, reportUnhandledError);
  });
}
function fromIterable(iterable) {
  return new Observable(function(subscriber) {
    var e_1, _a;
    try {
      for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
        var value = iterable_1_1.value;
        subscriber.next(value);
        if (subscriber.closed) {
          return;
        }
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
    subscriber.complete();
  });
}
function fromAsyncIterable(asyncIterable) {
  return new Observable(function(subscriber) {
    process2(asyncIterable, subscriber).catch(function(err) {
      return subscriber.error(err);
    });
  });
}
function fromReadableStreamLike(readableStream) {
  return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process2(asyncIterable, subscriber) {
  var asyncIterable_1, asyncIterable_1_1;
  var e_2, _a;
  return __awaiter(this, void 0, void 0, function() {
    var value, e_2_1;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 5, 6, 11]);
          asyncIterable_1 = __asyncValues(asyncIterable);
          _b.label = 1;
        case 1:
          return [4, asyncIterable_1.next()];
        case 2:
          if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
          value = asyncIterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return [2];
          }
          _b.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          e_2_1 = _b.sent();
          e_2 = { error: e_2_1 };
          return [3, 11];
        case 6:
          _b.trys.push([6, , 9, 10]);
          if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
          return [4, _a.call(asyncIterable_1)];
        case 7:
          _b.sent();
          _b.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (e_2) throw e_2.error;
          return [7];
        case 10:
          return [7];
        case 11:
          subscriber.complete();
          return [2];
      }
    });
  });
}

// node_modules/rxjs/dist/esm5/internal/util/executeSchedule.js
function executeSchedule(parentSubscription, scheduler, work, delay2, repeat) {
  if (delay2 === void 0) {
    delay2 = 0;
  }
  if (repeat === void 0) {
    repeat = false;
  }
  var scheduleSubscription = scheduler.schedule(function() {
    work();
    if (repeat) {
      parentSubscription.add(this.schedule(null, delay2));
    } else {
      this.unsubscribe();
    }
  }, delay2);
  parentSubscription.add(scheduleSubscription);
  if (!repeat) {
    return scheduleSubscription;
  }
}

// node_modules/rxjs/dist/esm5/internal/operators/map.js
function map(project, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      subscriber.next(project.call(thisArg, value, index++));
    }));
  });
}

// node_modules/rxjs/dist/esm5/internal/util/mapOneOrManyArgs.js
var isArray = Array.isArray;
function callOrApply(fn, args) {
  return isArray(args) ? fn.apply(void 0, __spreadArray([], __read(args))) : fn(args);
}
function mapOneOrManyArgs(fn) {
  return map(function(args) {
    return callOrApply(fn, args);
  });
}

// node_modules/rxjs/dist/esm5/internal/operators/mergeInternals.js
function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
  var buffer = [];
  var active = 0;
  var index = 0;
  var isComplete = false;
  var checkComplete = function() {
    if (isComplete && !buffer.length && !active) {
      subscriber.complete();
    }
  };
  var outerNext = function(value) {
    return active < concurrent ? doInnerSub(value) : buffer.push(value);
  };
  var doInnerSub = function(value) {
    expand && subscriber.next(value);
    active++;
    var innerComplete = false;
    innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function(innerValue) {
      onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
      if (expand) {
        outerNext(innerValue);
      } else {
        subscriber.next(innerValue);
      }
    }, function() {
      innerComplete = true;
    }, void 0, function() {
      if (innerComplete) {
        try {
          active--;
          var _loop_1 = function() {
            var bufferedValue = buffer.shift();
            if (innerSubScheduler) {
              executeSchedule(subscriber, innerSubScheduler, function() {
                return doInnerSub(bufferedValue);
              });
            } else {
              doInnerSub(bufferedValue);
            }
          };
          while (buffer.length && active < concurrent) {
            _loop_1();
          }
          checkComplete();
        } catch (err) {
          subscriber.error(err);
        }
      }
    }));
  };
  source.subscribe(createOperatorSubscriber(subscriber, outerNext, function() {
    isComplete = true;
    checkComplete();
  }));
  return function() {
    additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
  };
}

// node_modules/rxjs/dist/esm5/internal/operators/mergeMap.js
function mergeMap(project, resultSelector, concurrent) {
  if (concurrent === void 0) {
    concurrent = Infinity;
  }
  if (isFunction(resultSelector)) {
    return mergeMap(function(a, i) {
      return map(function(b, ii) {
        return resultSelector(a, b, i, ii);
      })(innerFrom(project(a, i)));
    }, concurrent);
  } else if (typeof resultSelector === "number") {
    concurrent = resultSelector;
  }
  return operate(function(source, subscriber) {
    return mergeInternals(source, subscriber, project, concurrent);
  });
}

// node_modules/rxjs/dist/esm5/internal/observable/fromEvent.js
var nodeEventEmitterMethods = ["addListener", "removeListener"];
var eventTargetMethods = ["addEventListener", "removeEventListener"];
var jqueryMethods = ["on", "off"];
function fromEvent(target, eventName, options, resultSelector) {
  if (isFunction(options)) {
    resultSelector = options;
    options = void 0;
  }
  if (resultSelector) {
    return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs(resultSelector));
  }
  var _a = __read(isEventTarget(target) ? eventTargetMethods.map(function(methodName) {
    return function(handler) {
      return target[methodName](eventName, handler, options);
    };
  }) : isNodeStyleEventEmitter(target) ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName)) : isJQueryStyleEventEmitter(target) ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName)) : [], 2), add = _a[0], remove = _a[1];
  if (!add) {
    if (isArrayLike(target)) {
      return mergeMap(function(subTarget) {
        return fromEvent(subTarget, eventName, options);
      })(innerFrom(target));
    }
  }
  if (!add) {
    throw new TypeError("Invalid event target");
  }
  return new Observable(function(subscriber) {
    var handler = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return subscriber.next(1 < args.length ? args : args[0]);
    };
    add(handler);
    return function() {
      return remove(handler);
    };
  });
}
function toCommonHandlerRegistry(target, eventName) {
  return function(methodName) {
    return function(handler) {
      return target[methodName](eventName, handler);
    };
  };
}
function isNodeStyleEventEmitter(target) {
  return isFunction(target.addListener) && isFunction(target.removeListener);
}
function isJQueryStyleEventEmitter(target) {
  return isFunction(target.on) && isFunction(target.off);
}
function isEventTarget(target) {
  return isFunction(target.addEventListener) && isFunction(target.removeEventListener);
}

// node_modules/@awesome-cordova-plugins/core/decorators/common.js
var ERR_CORDOVA_NOT_AVAILABLE = { error: "cordova_not_available" };
var ERR_PLUGIN_NOT_INSTALLED = { error: "plugin_not_installed" };
function getPromise(callback) {
  var tryNativePromise = function() {
    if (Promise) {
      return new Promise(function(resolve2, reject) {
        callback(resolve2, reject);
      });
    } else {
      console.error("No Promise support or polyfill found. To enable Ionic Native support, please add the es6-promise polyfill before this script, or run with a library like Angular or on a recent browser.");
    }
  };
  if (typeof window !== "undefined" && window.angular) {
    var doc = window.document;
    var injector = window.angular.element(doc.querySelector("[ng-app]") || doc.body).injector();
    if (injector) {
      var $q = injector.get("$q");
      return $q(function(resolve2, reject) {
        callback(resolve2, reject);
      });
    }
    console.warn("Angular 1 was detected but $q couldn't be retrieved. This is usually when the app is not bootstrapped on the html or body tag. Falling back to native promises which won't trigger an automatic digest when promises resolve.");
  }
  return tryNativePromise();
}
function wrapPromise(pluginObj, methodName, args, opts) {
  if (opts === void 0) {
    opts = {};
  }
  var pluginResult, rej;
  var p = getPromise(function(resolve2, reject) {
    if (opts.destruct) {
      pluginResult = callCordovaPlugin(pluginObj, methodName, args, opts, function() {
        var args2 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args2[_i] = arguments[_i];
        }
        return resolve2(args2);
      }, function() {
        var args2 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args2[_i] = arguments[_i];
        }
        return reject(args2);
      });
    } else {
      pluginResult = callCordovaPlugin(pluginObj, methodName, args, opts, resolve2, reject);
    }
    rej = reject;
  });
  if (pluginResult && pluginResult.error) {
    p.catch(function() {
    });
    typeof rej === "function" && rej(pluginResult.error);
  }
  return p;
}
function wrapOtherPromise(pluginObj, methodName, args, opts) {
  if (opts === void 0) {
    opts = {};
  }
  return getPromise(function(resolve2, reject) {
    var pluginResult = callCordovaPlugin(pluginObj, methodName, args, opts);
    if (pluginResult) {
      if (pluginResult.error) {
        reject(pluginResult.error);
      } else if (pluginResult.then) {
        pluginResult.then(resolve2).catch(reject);
      }
    } else {
      reject({ error: "unexpected_error" });
    }
  });
}
function wrapObservable(pluginObj, methodName, args, opts) {
  if (opts === void 0) {
    opts = {};
  }
  return new Observable(function(observer) {
    var pluginResult;
    if (opts.destruct) {
      pluginResult = callCordovaPlugin(pluginObj, methodName, args, opts, function() {
        var args2 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args2[_i] = arguments[_i];
        }
        return observer.next(args2);
      }, function() {
        var args2 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args2[_i] = arguments[_i];
        }
        return observer.error(args2);
      });
    } else {
      pluginResult = callCordovaPlugin(pluginObj, methodName, args, opts, observer.next.bind(observer), observer.error.bind(observer));
    }
    if (pluginResult && pluginResult.error) {
      observer.error(pluginResult.error);
      observer.complete();
    }
    return function() {
      try {
        if (opts.clearFunction) {
          if (opts.clearWithArgs) {
            return callCordovaPlugin(pluginObj, opts.clearFunction, args, opts, observer.next.bind(observer), observer.error.bind(observer));
          }
          return callCordovaPlugin(pluginObj, opts.clearFunction, []);
        }
      } catch (e) {
        console.warn("Unable to clear the previous observable watch for", pluginObj.constructor.getPluginName(), methodName);
        console.warn(e);
      }
    };
  });
}
function wrapEventObservable(event, element) {
  element = typeof window !== "undefined" && element ? get(window, element) : element || (typeof window !== "undefined" ? window : {});
  return fromEvent(element, event);
}
function checkAvailability(plugin, methodName, pluginName) {
  var pluginRef, pluginPackage;
  if (typeof plugin === "string") {
    pluginRef = plugin;
  } else {
    pluginRef = plugin.constructor.getPluginRef();
    pluginName = plugin.constructor.getPluginName();
    pluginPackage = plugin.constructor.getPluginInstallName();
  }
  var pluginInstance = getPlugin(pluginRef);
  if (!pluginInstance || !!methodName && typeof pluginInstance[methodName] === "undefined") {
    if (typeof window === "undefined" || !window.cordova) {
      cordovaWarn(pluginName, methodName);
      return ERR_CORDOVA_NOT_AVAILABLE;
    }
    pluginWarn(pluginName, pluginPackage, methodName);
    return ERR_PLUGIN_NOT_INSTALLED;
  }
  return true;
}
function setIndex(args, opts, resolve2, reject) {
  if (opts === void 0) {
    opts = {};
  }
  if (opts.sync) {
    return args;
  }
  if (opts.callbackOrder === "reverse") {
    args.unshift(reject);
    args.unshift(resolve2);
  } else if (opts.callbackStyle === "node") {
    args.push(function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve2(result);
      }
    });
  } else if (opts.callbackStyle === "object" && opts.successName && opts.errorName) {
    var obj = {};
    obj[opts.successName] = resolve2;
    obj[opts.errorName] = reject;
    args.push(obj);
  } else if (typeof opts.successIndex !== "undefined" || typeof opts.errorIndex !== "undefined") {
    var setSuccessIndex = function() {
      if (opts.successIndex > args.length) {
        args[opts.successIndex] = resolve2;
      } else {
        args.splice(opts.successIndex, 0, resolve2);
      }
    };
    var setErrorIndex = function() {
      if (opts.errorIndex > args.length) {
        args[opts.errorIndex] = reject;
      } else {
        args.splice(opts.errorIndex, 0, reject);
      }
    };
    if (opts.successIndex > opts.errorIndex) {
      setErrorIndex();
      setSuccessIndex();
    } else {
      setSuccessIndex();
      setErrorIndex();
    }
  } else {
    args.push(resolve2);
    args.push(reject);
  }
  return args;
}
function callCordovaPlugin(pluginObj, methodName, args, opts, resolve2, reject) {
  if (opts === void 0) {
    opts = {};
  }
  args = setIndex(args, opts, resolve2, reject);
  var availabilityCheck = checkAvailability(pluginObj, methodName);
  if (availabilityCheck === true) {
    var pluginInstance = getPlugin(pluginObj.constructor.getPluginRef());
    return pluginInstance[methodName].apply(pluginInstance, args);
  } else {
    return availabilityCheck;
  }
}
function getPlugin(pluginRef) {
  if (typeof window !== "undefined") {
    return get(window, pluginRef);
  }
  return null;
}
function get(element, path) {
  var paths = path.split(".");
  var obj = element;
  for (var i = 0; i < paths.length; i++) {
    if (!obj) {
      return null;
    }
    obj = obj[paths[i]];
  }
  return obj;
}
function pluginWarn(pluginName, plugin, method) {
  if (method) {
    console.warn("Native: tried calling " + pluginName + "." + method + ", but the " + pluginName + " plugin is not installed.");
  } else {
    console.warn("Native: tried accessing the " + pluginName + " plugin but it's not installed.");
  }
  if (plugin) {
    console.warn("Install the " + pluginName + " plugin: 'ionic cordova plugin add " + plugin + "'");
  }
}
function cordovaWarn(pluginName, method) {
  if (typeof process === "undefined") {
    if (method) {
      console.warn("Native: tried calling " + pluginName + "." + method + ", but Cordova is not available. Make sure to include cordova.js or run in a device/simulator");
    } else {
      console.warn("Native: tried accessing the " + pluginName + " plugin but Cordova is not available. Make sure to include cordova.js or run in a device/simulator");
    }
  }
}
var wrap = function(pluginObj, methodName, opts) {
  if (opts === void 0) {
    opts = {};
  }
  return function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    if (opts.sync) {
      return callCordovaPlugin(pluginObj, methodName, args, opts);
    } else if (opts.observable) {
      return wrapObservable(pluginObj, methodName, args, opts);
    } else if (opts.eventObservable && opts.event) {
      return wrapEventObservable(opts.event, opts.element);
    } else if (opts.otherPromise) {
      return wrapOtherPromise(pluginObj, methodName, args, opts);
    } else {
      return wrapPromise(pluginObj, methodName, args, opts);
    }
  };
};

// node_modules/@awesome-cordova-plugins/core/util.js
function get2(element, path) {
  var paths = path.split(".");
  var obj = element;
  for (var i = 0; i < paths.length; i++) {
    if (!obj) {
      return null;
    }
    obj = obj[paths[i]];
  }
  return obj;
}

// node_modules/@awesome-cordova-plugins/core/awesome-cordova-plugin.js
var AwesomeCordovaNativePlugin = (
  /** @class */
  function() {
    function AwesomeCordovaNativePlugin2() {
    }
    AwesomeCordovaNativePlugin2.installed = function() {
      var isAvailable = checkAvailability(this.pluginRef) === true;
      return isAvailable;
    };
    AwesomeCordovaNativePlugin2.getPlugin = function() {
      if (typeof window !== "undefined") {
        return get2(window, this.pluginRef);
      }
      return null;
    };
    AwesomeCordovaNativePlugin2.getPluginName = function() {
      var pluginName = this.pluginName;
      return pluginName;
    };
    AwesomeCordovaNativePlugin2.getPluginRef = function() {
      var pluginRef = this.pluginRef;
      return pluginRef;
    };
    AwesomeCordovaNativePlugin2.getPluginInstallName = function() {
      var plugin = this.plugin;
      return plugin;
    };
    AwesomeCordovaNativePlugin2.getSupportedPlatforms = function() {
      var platform = this.platforms;
      return platform;
    };
    AwesomeCordovaNativePlugin2.pluginName = "";
    AwesomeCordovaNativePlugin2.pluginRef = "";
    AwesomeCordovaNativePlugin2.plugin = "";
    AwesomeCordovaNativePlugin2.repo = "";
    AwesomeCordovaNativePlugin2.platforms = [];
    AwesomeCordovaNativePlugin2.install = "";
    return AwesomeCordovaNativePlugin2;
  }()
);

// node_modules/@awesome-cordova-plugins/core/decorators/cordova.js
function cordova(pluginObj, methodName, config2, args) {
  return wrap(pluginObj, methodName, config2).apply(this, args);
}

// node_modules/@awesome-cordova-plugins/core/index.js
checkReady();

// node_modules/@awesome-cordova-plugins/file-opener/index.js
var __extends2 = /* @__PURE__ */ function() {
  var extendStatics2 = function(d, b) {
    extendStatics2 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics2(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics2(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var FileOpenerOriginal = (
  /** @class */
  function(_super) {
    __extends2(FileOpenerOriginal2, _super);
    function FileOpenerOriginal2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    FileOpenerOriginal2.prototype.open = function(filePath, fileMIMEType) {
      return cordova(this, "open", { "callbackStyle": "object", "successName": "success", "errorName": "error" }, arguments);
    };
    FileOpenerOriginal2.prototype.uninstall = function(packageId) {
      return cordova(this, "uninstall", { "callbackStyle": "object", "successName": "success", "errorName": "error" }, arguments);
    };
    FileOpenerOriginal2.prototype.appIsInstalled = function(packageId) {
      return cordova(this, "appIsInstalled", { "callbackStyle": "object", "successName": "success", "errorName": "error" }, arguments);
    };
    FileOpenerOriginal2.prototype.showOpenWithDialog = function(filePath, fileMIMEType) {
      return cordova(this, "showOpenWithDialog", { "callbackStyle": "object", "successName": "success", "errorName": "error" }, arguments);
    };
    FileOpenerOriginal2.pluginName = "FileOpener";
    FileOpenerOriginal2.plugin = "cordova-plugin-file-opener2";
    FileOpenerOriginal2.pluginRef = "cordova.plugins.fileOpener2";
    FileOpenerOriginal2.repo = "https://github.com/pwlin/cordova-plugin-file-opener2";
    FileOpenerOriginal2.platforms = ["Android", "iOS", "Windows", "Windows Phone 8"];
    return FileOpenerOriginal2;
  }(AwesomeCordovaNativePlugin)
);
var FileOpener = new FileOpenerOriginal();

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
      if (FileOpener && typeof FileOpener.open === "function") {
        await FileOpener.open(writeResult.uri, mimeType);
        console.log("FileOpener.open call succeeded.");
      } else {
        console.warn("FileOpener or FileOpener.open is not available. Skipping open.");
        showToastFunction("File saved. Opener not available.", false);
      }
    } catch (e) {
      console.warn("Could not open file automatically with FileOpener:", e);
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
  const chapterSelectionArea = document.getElementById("splitterChapterSelectionArea");
  const chapterListUl = document.getElementById("splitterChapterList");
  const selectAllChaptersBtn = document.getElementById("splitterSelectAllChapters");
  const deselectAllChaptersBtn = document.getElementById("splitterDeselectAllChapters");
  let selectedFile = null;
  let parsedChaptersForSelection = [];
  if (!uploadInput || !splitBtn || !modeSelect || !fileNameEl || !clearFileBtn || !groupSizeGrp || !statusEl || !downloadSec || !downloadLink || !tooltipTrigger || !chapterSelectionArea || !chapterListUl || !selectAllChaptersBtn || !deselectAllChaptersBtn) {
    console.error("EPUB Splitter UI elements (or tooltip/chapter selection) not found. Initialization failed.");
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
    if (selectedFile) {
      fileNameEl.textContent = `Selected: ${selectedFile.name}`;
      if (clearFileBtn) clearFileBtn.style.display = "inline-block";
      splitBtn.disabled = true;
      if (statusEl) statusEl.style.display = "none";
      if (downloadSec) downloadSec.style.display = "none";
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
          // Use "Chapter X" as title for now, getting actual titles is complex without full ToC parsing.
          title: `Chapter ${index + 1} (Preview: ${text.substring(0, 50).replace(/\s+/g, " ")}${text.length > 50 ? "..." : ""})`,
          text
        }));
        if (parsedChaptersForSelection.length > 0) {
          displayChapterSelectionUI(parsedChaptersForSelection);
          splitBtn.disabled = false;
          showAppToast(`Found ${parsedChaptersForSelection.length} potential chapters. Review selection.`, false);
        } else {
          showAppToast("No chapters found for selection. Check EPUB structure.", true);
          splitBtn.disabled = true;
        }
      } catch (err) {
        console.error("EPUB parsing for chapter selection failed:", err);
        showAppToast(`Error parsing EPUB for chapter list: ${err.message}`, true);
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
    if (statusEl) statusEl.style.display = "none";
    if (downloadSec) downloadSec.style.display = "none";
    resetChapterSelectionUI();
  });
  modeSelect.addEventListener("change", () => {
    if (groupSizeGrp) {
      groupSizeGrp.style.display = modeSelect.value === "grouped" ? "block" : "none";
    }
  });
  splitBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      showAppToast("No file selected for EPUB splitting.", true);
      return;
    }
    if (parsedChaptersForSelection.length === 0) {
      showAppToast("No chapters available for splitting. Please re-upload or check the EPUB.", true);
      return;
    }
    const selectedChapterIndices = [];
    chapterListUl.querySelectorAll('input[type="checkbox"]:checked').forEach((cb) => {
      const index = parseInt(cb.value, 10);
      selectedChapterIndices.push(index);
    });
    if (selectedChapterIndices.length === 0) {
      showAppToast("No chapters selected to split. Please select at least one chapter.", true);
      return;
    }
    const chaptersToProcess = parsedChaptersForSelection.filter((chapInfo) => selectedChapterIndices.includes(chapInfo.index)).map((chapInfo) => chapInfo.text);
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    toggleAppSpinner(true);
    if (statusEl) statusEl.style.display = "none";
    if (downloadSec) downloadSec.style.display = "none";
    const chapterPatternEl = document.getElementById("chapterPattern");
    const startNumberEl = document.getElementById("startNumber");
    const offsetNumberEl = document.getElementById("offsetNumber");
    const groupSizeEl = document.getElementById("groupSize");
    try {
      const pattern = chapterPatternEl.value.trim() || "chapter";
      const startNumber = parseInt(startNumberEl.value, 10) || 1;
      const offset = Math.max(0, parseInt(offsetNumberEl.value, 10) || 0);
      const mode = modeSelect.value;
      const usableChaps = chaptersToProcess.slice(offset);
      const effectiveStart = startNumber;
      const zip = new JSZip();
      if (mode === "single") {
        usableChaps.forEach((text, i) => {
          const chapNum = String(effectiveStart + i).padStart(2, "0");
          zip.file(`${pattern}${chapNum}.txt`, text);
        });
      } else {
        let groupSize = parseInt(groupSizeEl.value, 10) || 1;
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
      const { blob, count, skipped } = await zip.generateAsync({ type: "blob" }).then((blob2) => ({ blob: blob2, count: usableChaps.length, skipped: offset }));
      if (downloadLink) {
        const downloadFilename = `${chapterPatternEl.value.trim() || "chapter"}_chapters.zip`;
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
      if (downloadSec) downloadSec.style.display = "block";
      if (statusEl) {
        statusEl.textContent = `Extracted ${count} chapter(s) from your selection.`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
      }
      showAppToast(`Extracted ${count} chapter(s).`);
    } catch (err) {
      console.error("EPUB Splitter Error:", err);
      if (statusEl) {
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      showAppToast(`Error: ${err.message}`, true);
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
function textToXHTML(text, chapterTitle) {
  let bodyContent = `<h2>${escapeHTML(chapterTitle)}</h2>
`;
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n\n+/);
  paragraphs.forEach((p) => {
    const trimmedP = p.trim();
    if (trimmedP) {
      bodyContent += `    <p>${escapeHTML(trimmedP)}</p>
`;
    }
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>${escapeHTML(chapterTitle)}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css" /> 
</head>
<body>
  <section epub:type="chapter">
${bodyContent}  </section>
</body>
</html>`;
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
  const createBtn = document.getElementById("createEpubBtn");
  const statusEl = document.getElementById("statusMessageZipToEpub");
  const downloadSec = document.getElementById("downloadSectionZipToEpub");
  const downloadLink = document.getElementById("downloadLinkEpub");
  let selectedZipFile = null;
  let selectedCoverFile = null;
  if (!zipUploadInput || !createBtn || !zipFileNameEl || !clearZipBtn || !epubTitleInput || !epubAuthorInput || !epubLangInput || !epubCoverImageInput || !epubCoverFileNameEl || !clearCoverBtn || !statusEl || !downloadSec || !downloadLink) {
    console.error("ZIP to EPUB UI elements not found. Initialization failed.");
    return;
  }
  zipUploadInput.addEventListener("change", (e) => {
    const target = e.target;
    selectedZipFile = target.files ? target.files[0] : null;
    if (selectedZipFile) {
      zipFileNameEl.textContent = `Selected ZIP: ${selectedZipFile.name}`;
      if (clearZipBtn) clearZipBtn.style.display = "inline-block";
      createBtn.disabled = false;
      if (statusEl) statusEl.style.display = "none";
      if (downloadSec) downloadSec.style.display = "none";
    } else {
      zipFileNameEl.textContent = "";
      if (clearZipBtn) clearZipBtn.style.display = "none";
      createBtn.disabled = true;
    }
  });
  clearZipBtn.addEventListener("click", () => {
    selectedZipFile = null;
    zipUploadInput.value = "";
    zipFileNameEl.textContent = "";
    clearZipBtn.style.display = "none";
    createBtn.disabled = true;
    if (statusEl) statusEl.style.display = "none";
    if (downloadSec) downloadSec.style.display = "none";
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
    if (!selectedZipFile) {
      showAppToast("Please upload a ZIP file containing chapter .txt files.", true);
      return;
    }
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    const title = epubTitleInput.value.trim() || "Untitled EPUB";
    const author = epubAuthorInput.value.trim() || "Unknown Author";
    const language = epubLangInput.value.trim() || "en";
    const bookUUID = `urn:uuid:${generateUUID()}`;
    toggleAppSpinner(true);
    if (statusEl) statusEl.style.display = "none";
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
      if (!cssFolder) throw new Error("Could not create OEBPS/css folder.");
      const textFolder = oebps.folder("text");
      if (!textFolder) throw new Error("Could not create OEBPS/text folder.");
      const imagesFolder = oebps.folder("images");
      if (!imagesFolder) throw new Error("Could not create OEBPS/images folder.");
      const basicCSS = `body { font-family: sans-serif; line-height: 1.5; margin: 1em; }
h1, h2, h3 { text-align: center; }
p { text-indent: 1.5em; margin-top: 0; margin-bottom: 0.5em; }
.cover { text-align: center; margin-top: 20%; }
.cover img { max-width: 80%; max-height: 80vh; }`;
      cssFolder.file("style.css", basicCSS);
      const contentZip = await JSZip.loadAsync(selectedZipFile);
      const chapterPromises = [];
      contentZip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith(".txt")) {
          chapterPromises.push(
            zipEntry.async("string").then((text) => ({
              name: zipEntry.name,
              originalName: relativePath,
              content: text
            }))
          );
        }
      });
      let chapters = await Promise.all(chapterPromises);
      if (chapters.length === 0) {
        throw new Error("No .txt files found in the uploaded ZIP.");
      }
      chapters.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }));
      const manifestItems = [
        { id: "css", href: "css/style.css", "media-type": "text/css" },
        { id: "nav", href: "nav.xhtml", "media-type": "application/xhtml+xml", properties: "nav" }
      ];
      const spineItems = [];
      const navLiItems = [];
      const ncxNavPoints = [];
      let playOrder = 1;
      let coverImageFilename = null;
      let coverXHTMLAdded = false;
      if (selectedCoverFile) {
        const coverExt = selectedCoverFile.name.split(".").pop()?.toLowerCase() || "png";
        coverImageFilename = `cover.${coverExt}`;
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
  <section epub:type="cover" class="cover">
    <img src="../images/${coverImageFilename}" alt="Cover Image"/>
  </section>
</body>
</html>`;
        textFolder.file("cover.xhtml", coverXHTMLContent);
        manifestItems.push({ id: "cover-page", href: "text/cover.xhtml", "media-type": "application/xhtml+xml" });
        spineItems.push({ idref: "cover-page", linear: "no" });
        coverXHTMLAdded = true;
      }
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterBaseName = sanitizeForXML(chapter.name.replace(/\.txt$/i, "")) || `chapter_${i + 1}`;
        const chapterFilename = `${chapterBaseName}.xhtml`;
        const chapterTitle = chapter.name.replace(/\.txt$/i, "").replace(/_/g, " ");
        const xhtmlContent = textToXHTML(chapter.content, chapterTitle);
        textFolder.file(chapterFilename, xhtmlContent);
        const itemId = `chapter-${i + 1}`;
        manifestItems.push({ id: itemId, href: `text/${chapterFilename}`, "media-type": "application/xhtml+xml" });
        spineItems.push({ idref: itemId, linear: "yes" });
        navLiItems.push(`<li><a href="text/${chapterFilename}">${escapeHTML(chapterTitle)}</a></li>`);
        ncxNavPoints.push(`
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>${escapeHTML(chapterTitle)}</text></navLabel>
      <content src="text/${chapterFilename}"/>
    </navPoint>`);
        playOrder++;
      }
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
  <nav epub:type="landmarks" hidden="hidden">
    <ol>
      ${coverXHTMLAdded ? `<li><a epub:type="cover" href="text/cover.xhtml">Cover</a></li>` : ""}
      <li><a epub:type="toc" href="nav.xhtml">Table of Contents</a></li>
      <li><a epub:type="bodymatter" href="text/${sanitizeForXML(chapters[0].name.replace(/\.txt$/i, "")) || "chapter_1"}.xhtml">Start Reading</a></li>
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
      if (statusEl) {
        statusEl.textContent = `EPUB "${title}" created successfully with ${chapters.length} chapter(s).`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
      }
      showAppToast("EPUB created successfully!");
    } catch (err) {
      console.error("ZIP to EPUB Error:", err);
      if (statusEl) {
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      showAppToast(`Error: ${err.message}`, true);
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
    else if (message.toLowerCase().includes("download started") || message.toLowerCase().includes("file saved")) showAppToast(message, false);
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
      return;
    }
    if (!file.name.toLowerCase().endsWith(".epub")) {
      updateLocalStatus("Error: Please select a valid .epub file.", true);
      fileInput.value = "";
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
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
        if (!statusEl?.textContent?.toLowerCase().includes("error") && !statusEl?.textContent?.toLowerCase().includes("warning")) {
          updateLocalStatus("No chapters found or ToC unparsable. Some EPUBs might lack a standard ToC.", true);
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
    if (!currentZipInstance || currentTocEntries.length === 0) {
      updateLocalStatus("Cannot extract: No EPUB loaded or no chapters found.", true);
      return;
    }
    const selectedChapters = [];
    chapterListUl.querySelectorAll('input[type="checkbox"]:checked').forEach((cb) => {
      const checkbox = cb;
      const href = checkbox.getAttribute("data-chapter-href");
      const entry = currentTocEntries.find((e) => e.href === href);
      if (entry) {
        selectedChapters.push(entry);
      }
    });
    if (selectedChapters.length === 0) {
      updateLocalStatus("No chapters selected to extract. Please select at least one chapter.", true);
      return;
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
    let numLinesToRemove = 0;
    if (enableRemoveLinesToggle.checked) {
      numLinesToRemove = parseInt(linesToRemoveInput.value, 10);
      if (isNaN(numLinesToRemove) || numLinesToRemove < 0) {
        numLinesToRemove = 0;
      }
    }
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
        await triggerDownload2(zipBlob, finalFilename, "application/zip", updateLocalStatus);
        updateLocalStatus(`Download started / File saved (${filesAdded}/${totalChaptersToProcess} chapters).`);
        if (downloadSec && downloadLink) {
          downloadLink.href = "#";
          downloadLink.download = finalFilename;
          downloadSec.style.display = "block";
        }
      } else {
        updateLocalStatus("Extraction complete, but no chapter content was retrieved or all content was removed by line filter. Ensure EPUB content is as expected and check 'lines to remove' setting.", true);
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
  createBtn.disabled = true;
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
    toggleAppSpinner(true);
    if (!zipFileInput.files || zipFileInput.files.length === 0) {
      showAppToast("Please upload a ZIP file.", true);
      if (statusMessageEl) {
        statusMessageEl.textContent = "Error: Please upload a ZIP file.";
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      toggleAppSpinner(false);
      return;
    }
    const projectTitle = projectTitleInput.value;
    if (!projectTitle) {
      showAppToast("Project Title is required.", true);
      if (statusMessageEl) {
        statusMessageEl.textContent = "Error: Project Title is required.";
        statusMessageEl.className = "status error";
        statusMessageEl.style.display = "block";
      }
      toggleAppSpinner(false);
      return;
    }
    const file = zipFileInput.files[0];
    const description = descriptionInput.value;
    const uniqueCodeProvided = uniqueCodeInput.value.trim();
    const chapterPatternValue = chapterPatternInput.value.trim();
    const effectiveStartNumber = parseInt(startNumberInput.value, 10) || 1;
    const numExtraChapters = parseInt(extraChaptersInput.value, 10) || 0;
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
            chapterTitle = `Extra Chapter ${currentRank}`;
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
        throw new Error("No .txt files found in ZIP and no extra chapters requested. Backup not created.");
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
        // Hardcoded
        apply_automatic_indentation: false,
        // Hardcoded
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
  if (!createBtn) {
    console.error("Create New Backup: 'Generate and Download' button not found. Initialization failed.");
    return;
  }
  createBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    toggleAppSpinner(true);
    try {
      const titleInput = document.getElementById("createProjectTitle");
      const descInput = document.getElementById("createDescription");
      const codeInputElement = document.getElementById("createUniqueCode");
      const chaptersInput = document.getElementById("createChapters");
      const prefixInput = document.getElementById("createPrefix");
      if (!titleInput || !descInput || !codeInputElement || !chaptersInput || !prefixInput) {
        showAppToast("One or more form elements are missing for Create New Backup.", true);
        throw new Error("Missing form elements.");
      }
      const title = titleInput.value;
      const desc = descInput.value;
      const codeInputVal = codeInputElement.value.trim();
      const count = parseInt(chaptersInput.value, 10) || 0;
      const prefix = prefixInput.value;
      const showTOC = true;
      const autoIndent = false;
      if (!title || count < 1) {
        showAppToast("Project Title and at least 1 chapter are required.", true);
        if (statusEl) {
          statusEl.textContent = "Error: Project Title and at least 1 chapter are required.";
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
        throw new Error("Validation failed for create new backup.");
      }
      const uniqueCode = codeInputVal || Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0");
      const now = Date.now();
      const scenes = [];
      const sections = [];
      for (let i = 1; i <= count; i++) {
        const chapTitle = prefix ? prefix + i : i.toString();
        const sceneCode = "scene" + i;
        const sceneContent = { blocks: [{ type: "text", align: "left", text: "" }] };
        scenes.push({
          code: sceneCode,
          title: chapTitle,
          text: JSON.stringify(sceneContent),
          ranking: i,
          status: "1"
        });
        sections.push({
          code: "section" + i,
          title: chapTitle,
          synopsis: "",
          ranking: i,
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
      const filename = `${title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "new_backup"}.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      if (statusEl) {
        statusEl.textContent = "Backup file created successfully. Download started.";
        statusEl.className = "status success";
        statusEl.style.display = "block";
      }
      showAppToast("Backup file created successfully.");
    } catch (err) {
      if (err.message !== "Validation failed for create new backup." && err.message !== "Missing form elements.") {
        showAppToast(err.message || "Error creating backup.", true);
        if (statusEl) {
          statusEl.textContent = `Error: ${err.message || "Could not create backup."}`;
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
      }
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
  const prefixInput = document.getElementById("extendPrefix");
  const statusEl = document.getElementById("statusExtendBackup");
  if (!extendBtn || !fileInput || !fileNameEl || !clearFileBtn || !extraChaptersInput || !prefixInput) {
    console.error("Extend Backup: One or more UI elements not found. Initialization failed.");
    return;
  }
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length > 0) {
      fileNameEl.textContent = `Selected: ${fileInput.files[0].name}`;
      if (clearFileBtn) clearFileBtn.style.display = "inline-block";
    } else {
      fileNameEl.textContent = "";
      if (clearFileBtn) clearFileBtn.style.display = "none";
    }
    if (statusEl) statusEl.style.display = "none";
  });
  clearFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    fileNameEl.textContent = "";
    clearFileBtn.style.display = "none";
    if (statusEl) statusEl.style.display = "none";
  });
  extendBtn.addEventListener("click", () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (!fileInput.files || !fileInput.files.length) {
      showAppToast("Please upload a backup file to extend.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Please upload a backup file.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      return;
    }
    if (statusEl) statusEl.style.display = "none";
    toggleAppSpinner(true);
    const extraChapters = parseInt(extraChaptersInput.value, 10) || 0;
    if (extraChapters <= 0) {
      showAppToast("Number of extra chapters must be greater than 0.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Number of extra chapters must be greater than 0.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      toggleAppSpinner(false);
      return;
    }
    const prefix = prefixInput.value;
    const reader = new FileReader();
    reader.onerror = () => {
      showAppToast("Error reading file.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Could not read the uploaded file.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      toggleAppSpinner(false);
    };
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target?.result);
        const rev = backup.revisions && backup.revisions[0];
        if (!rev || !rev.scenes || !rev.sections) {
          throw new Error("Invalid backup file structure for extending.");
        }
        let maxRanking = 0;
        rev.scenes.forEach((s2) => {
          if (s2.ranking > maxRanking) maxRanking = s2.ranking;
        });
        rev.sections.forEach((s2) => {
          if (s2.ranking > maxRanking) maxRanking = s2.ranking;
        });
        for (let i = 1; i <= extraChapters; i++) {
          const num = maxRanking + i;
          const chapTitle = prefix ? prefix + num : `Chapter ${num}`;
          const sceneCode = "scene" + num;
          const sceneContent = { blocks: [{ type: "text", align: "left", text: "" }] };
          rev.scenes.push({
            code: sceneCode,
            title: chapTitle,
            text: JSON.stringify(sceneContent),
            ranking: num,
            status: "1"
          });
          rev.sections.push({
            code: "section" + num,
            title: chapTitle,
            synopsis: "",
            ranking: num,
            section_scenes: [{ code: sceneCode, ranking: 1 }]
          });
        }
        const now = Date.now();
        backup.last_update_date = now;
        backup.last_backup_date = now;
        if (rev) rev.date = now;
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const filename = `${backup.title.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "extended_backup"}.json`;
        await triggerDownload(blob, filename, "application/json", showAppToast);
        if (statusEl) {
          statusEl.textContent = `Backup extended with ${extraChapters} chapter(s). Download started.`;
          statusEl.className = "status success";
          statusEl.style.display = "block";
        }
        showAppToast("Backup extended successfully.");
      } catch (err) {
        showAppToast(err.message || "Error extending backup.", true);
        if (statusEl) {
          statusEl.textContent = `Error: ${err.message || "Could not extend backup."}`;
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
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
      }
    } catch (e) {
      console.warn(`Skipping file ${file.name} in merge due to parse error:`, e);
      showAppToast(`Skipped ${file.name} during merge (invalid format).`, true);
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
    // New unique code
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
  if (!mergeBtn || !filesInput || !fileNamesEl || !clearFilesBtn || !mergedTitleInput || !mergedDescInput || !chapterPrefixInput || !preserveTitlesCheckbox) {
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
    if (statusEl) statusEl.style.display = "none";
  });
  clearFilesBtn.addEventListener("click", () => {
    filesInput.value = "";
    fileNamesEl.textContent = "No files selected.";
    clearFilesBtn.style.display = "none";
    if (statusEl) statusEl.style.display = "none";
  });
  mergeBtn.addEventListener("click", async () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    const files = filesInput.files ? Array.from(filesInput.files) : [];
    const mergedTitle = mergedTitleInput.value;
    const mergedDesc = mergedDescInput.value;
    const chapterPrefix = chapterPrefixInput.value;
    const preserveOriginalTitles = preserveTitlesCheckbox.checked;
    if (!files.length) {
      showAppToast("Select at least one backup file to merge.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Select at least one backup file.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      return;
    }
    if (!mergedTitle) {
      showAppToast("Merged Project Title is required.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Merged Project Title is required.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      return;
    }
    if (statusEl) statusEl.style.display = "none";
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
          statusEl.textContent = "Error: No valid chapters to merge.";
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
        throw new Error("Merge resulted in no scenes.");
      }
      const blob = new Blob([JSON.stringify(mergedData, null, 2)], { type: "application/json" });
      const filename = `${mergedTitle.replace(/[^a-z0-9_\-\s]/gi, "_").replace(/\s+/g, "_") || "merged_backup"}.json`;
      await triggerDownload(blob, filename, "application/json", showAppToast);
      if (statusEl) {
        statusEl.textContent = `Backup files merged into "${mergedTitle}". Download started.`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
      }
      showAppToast("Backup files merged successfully.");
    } catch (err) {
      if (err.message !== "Merge resulted in no scenes.") {
        showAppToast(err.message || "Error merging backup files.", true);
        if (statusEl) {
          statusEl.textContent = `Error: ${err.message || "Could not merge backups."}`;
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
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
    if (statusEl) statusEl.style.display = "none";
    checkEnableButton();
  });
  clearBaseBackupFileBtn.addEventListener("click", () => {
    baseBackupFileInput.value = "";
    selectedBaseFile = null;
    baseBackupFileNameEl.textContent = "";
    clearBaseBackupFileBtn.style.display = "none";
    if (statusEl) statusEl.style.display = "none";
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
    if (statusEl) statusEl.style.display = "none";
    checkEnableButton();
  });
  clearZipFileBtn.addEventListener("click", () => {
    zipFileInput.value = "";
    selectedZipFile = null;
    zipFileNameEl.textContent = "";
    clearZipFileBtn.style.display = "none";
    if (statusEl) statusEl.style.display = "none";
    checkEnableButton();
  });
  augmentBtn.addEventListener("click", async () => {
    if (!selectedBaseFile || !selectedZipFile) {
      showAppToast("Please select both a base backup file and a ZIP file.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Both base backup and ZIP file are required.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      return;
    }
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    toggleAppSpinner(true);
    const prefix = prefixInput.value.trim();
    const preserveTitles = preserveTxtTitlesCheckbox.checked;
    try {
      const baseFileText = await selectedBaseFile.text();
      let backupData = JSON.parse(baseFileText);
      if (!backupData.revisions || backupData.revisions.length === 0) {
        backupData.revisions = [{
          number: 1,
          date: Date.now(),
          book_progresses: [],
          statuses: [{ code: "1", title: "Todo", color: -2697255, ranking: 1 }],
          scenes: [],
          sections: []
        }];
      }
      const currentRevision = backupData.revisions[0];
      if (!currentRevision.scenes) currentRevision.scenes = [];
      if (!currentRevision.sections) currentRevision.sections = [];
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
        showAppToast("No .txt files found in the ZIP archive.", true);
        throw new Error("No .txt files in ZIP.");
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
          // Default status
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
        lastProgress.word_count = totalWordCount;
        const today = /* @__PURE__ */ new Date();
        if (lastProgress.year === today.getFullYear() && lastProgress.month === today.getMonth() + 1 && lastProgress.day === today.getDate()) {
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
      if (statusEl) {
        statusEl.textContent = `Backup augmented with ${chapterFiles.length} chapter(s) from ZIP. Download started.`;
        statusEl.className = "status success";
        statusEl.style.display = "block";
      }
      showAppToast(`Backup augmented successfully with ${chapterFiles.length} chapters.`);
    } catch (err) {
      console.error("Augment Backup with ZIP Error:", err);
      if (statusEl) {
        statusEl.textContent = `Error: ${err.message || "Could not augment backup."}`;
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      showAppToast(`Error: ${err.message || "Could not augment backup."}`, true);
    } finally {
      toggleAppSpinner(false);
    }
  });
}

// ts/find-replace-backup.ts
init_dist();
var frData = null;
var frPtr = { scene: 0, block: 0, offset: 0 };
var frMatch = null;
function displayMatchText(matchDisplayElement, matchDetails) {
  if (!matchDisplayElement) return;
  if (matchDetails) {
    const line = matchDetails.matchLine;
    let displayLine = line;
    const matchStartIndexInLine = line.indexOf(matchDetails.matchedText);
    if (matchStartIndexInLine !== -1) {
      const before = escapeHtml(line.substring(0, matchStartIndexInLine));
      const matched = `<span class="fr-match-highlight">${escapeHtml(line.substring(matchStartIndexInLine, matchStartIndexInLine + matchDetails.matchLength))}</span>`;
      const after = escapeHtml(line.substring(matchStartIndexInLine + matchDetails.matchLength));
      displayLine = before + matched + after;
    } else {
      displayLine = escapeHtml(line);
    }
    matchDisplayElement.innerHTML = `Match in "${escapeHtml(matchDetails.chapterTitle)}":<br>${displayLine.replace(/\n/g, "<br>")}`;
  } else {
    matchDisplayElement.innerHTML = "No further matches found.";
  }
}
function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function findNextMatch(findPatternValue, useRegexValue, showAppToast) {
  if (!frData || !frData.revisions || !frData.revisions[0] || !frData.revisions[0].scenes) {
    console.error("FindNext: frData or scenes array is missing/invalid.");
    return null;
  }
  const scenes = frData.revisions[0].scenes;
  if (typeof frPtr.scene !== "number" || frPtr.scene < 0) {
    frPtr = { scene: 0, block: 0, offset: 0 };
  }
  if (frPtr.scene >= scenes.length) {
    return null;
  }
  for (let i = frPtr.scene; i < scenes.length; i++) {
    const currentSceneObject = scenes[i];
    if (!currentSceneObject) {
      console.warn(`FindNext: Scene at index ${i} is undefined. Advancing pointer.`);
      frPtr = { scene: scenes.length, block: 0, offset: 0 };
      return null;
    }
    const sceneTextJSON = currentSceneObject.text;
    if (typeof sceneTextJSON !== "string") {
      if (i === frPtr.scene) {
        frPtr.block = 0;
        frPtr.offset = 0;
      }
      continue;
    }
    let sceneContent;
    try {
      sceneContent = JSON.parse(sceneTextJSON);
      if (!Array.isArray(sceneContent.blocks)) sceneContent.blocks = [];
    } catch (e) {
      console.warn(`FindNext: Skipping scene "${currentSceneObject.title || "Untitled"}" (index ${i}) due to invalid JSON:`, e.message);
      if (i === frPtr.scene) {
        frPtr.block = 0;
        frPtr.offset = 0;
      }
      continue;
    }
    const blocks = sceneContent.blocks;
    for (let j = i === frPtr.scene ? frPtr.block : 0; j < blocks.length; j++) {
      const currentBlock = blocks[j];
      if (!currentBlock || currentBlock.type !== "text") {
        if (i === frPtr.scene && j === frPtr.block) {
          frPtr.offset = 0;
          frPtr.block = j + 1;
        }
        continue;
      }
      const blockText = currentBlock.text || "";
      let searchStartIndex = 0;
      if (i === frPtr.scene && j === frPtr.block) {
        searchStartIndex = frPtr.offset;
      }
      if (searchStartIndex >= blockText.length && blockText.length > 0) {
        if (i === frPtr.scene && j === frPtr.block) {
          frPtr.offset = 0;
        }
        continue;
      }
      if (!blockText && findPatternValue) {
        if (i === frPtr.scene && j === frPtr.block) {
          frPtr.offset = 0;
        }
        continue;
      }
      let matchIndex = -1;
      let matchedTextValue = "";
      if (blockText || useRegexValue && !findPatternValue) {
        if (useRegexValue) {
          try {
            if (findPatternValue === void 0 || findPatternValue === null) {
              showAppToast("Regex pattern is undefined.", true);
              return null;
            }
            const rx = new RegExp(findPatternValue, "g");
            rx.lastIndex = searchStartIndex;
            const m = rx.exec(blockText);
            if (m) {
              matchIndex = m.index;
              matchedTextValue = m[0];
            }
          } catch (err) {
            showAppToast("Invalid regular expression.", true);
            return null;
          }
        } else {
          if (findPatternValue) {
            matchIndex = blockText.indexOf(findPatternValue, searchStartIndex);
            if (matchIndex !== -1) matchedTextValue = findPatternValue;
          }
        }
      }
      if (matchIndex !== -1) {
        const lines = blockText.split("\n");
        let cumulativeLength = 0, lineContent = "";
        for (const line of lines) {
          if (matchIndex >= cumulativeLength && matchIndex < cumulativeLength + line.length + 1) {
            lineContent = line;
            break;
          }
          cumulativeLength += line.length + 1;
        }
        frMatch = {
          sceneIndex: i,
          blockIndex: j,
          matchIndex,
          matchLength: matchedTextValue.length,
          chapterTitle: currentSceneObject.title,
          matchLine: lineContent,
          matchedText: matchedTextValue
        };
        frPtr = { scene: i, block: j, offset: matchIndex + matchedTextValue.length };
        return frMatch;
      }
      if (i === frPtr.scene && j === frPtr.block) {
        frPtr.offset = 0;
      }
    }
    if (i === frPtr.scene) {
      frPtr.block = 0;
      frPtr.offset = 0;
    }
  }
  frPtr = { scene: scenes.length, block: 0, offset: 0 };
  return null;
}
function findPreviousMatch(findPatternValue, useRegexValue, showAppToast) {
  if (!frData || !frData.revisions || !frData.revisions[0] || !frData.revisions[0].scenes) {
    console.error("FindPrev: frData or scenes array is missing/invalid.");
    return null;
  }
  const scenes = frData.revisions[0].scenes;
  if (typeof frPtr.scene !== "number" || frPtr.scene >= scenes.length) {
    if (scenes.length > 0) {
      const lastScene = scenes[scenes.length - 1];
      let lastBlockIndex = 0;
      let lastBlockOffset = 0;
      try {
        const lastSceneContent = JSON.parse(lastScene.text);
        if (lastSceneContent.blocks && lastSceneContent.blocks.length > 0) {
          lastBlockIndex = lastSceneContent.blocks.length - 1;
          const lastBlock = lastSceneContent.blocks[lastBlockIndex];
          if (lastBlock && lastBlock.type === "text" && lastBlock.text) {
            lastBlockOffset = lastBlock.text.length;
          }
        }
      } catch (e) {
      }
      frPtr = { scene: scenes.length - 1, block: lastBlockIndex, offset: lastBlockOffset };
    } else {
      return null;
    }
  }
  if (frPtr.scene < 0) {
    return null;
  }
  for (let i = frPtr.scene; i >= 0; i--) {
    const currentSceneObject = scenes[i];
    if (!currentSceneObject) {
      console.warn(`FindPrev: Scene at index ${i} is undefined. Advancing pointer.`);
      frPtr = { scene: -1, block: 0, offset: 0 };
      return null;
    }
    const sceneTextJSON = currentSceneObject.text;
    if (typeof sceneTextJSON !== "string") {
      if (i === frPtr.scene) {
        frPtr.block = 0;
        frPtr.offset = 0;
      }
      continue;
    }
    let sceneContent;
    try {
      sceneContent = JSON.parse(sceneTextJSON);
      if (!Array.isArray(sceneContent.blocks)) sceneContent.blocks = [];
    } catch (e) {
      console.warn(`FindPrev: Skipping scene "${currentSceneObject.title || "Untitled"}" (index ${i}) due to invalid JSON:`, e.message);
      if (i === frPtr.scene) {
        frPtr.block = 0;
        frPtr.offset = 0;
      }
      continue;
    }
    const blocks = sceneContent.blocks;
    if (blocks.length === 0) {
      if (i === frPtr.scene) {
        frPtr.block = 0;
        frPtr.offset = 0;
      }
      continue;
    }
    let startBlockIndex;
    if (i < frPtr.scene) {
      startBlockIndex = blocks.length - 1;
    } else {
      startBlockIndex = frPtr.block;
      if (startBlockIndex >= blocks.length) startBlockIndex = blocks.length - 1;
      if (startBlockIndex < 0) {
        if (i === frPtr.scene) {
          frPtr.block = -1;
          frPtr.offset = 0;
        }
        continue;
      }
    }
    for (let j = startBlockIndex; j >= 0; j--) {
      const currentBlock = blocks[j];
      if (!currentBlock || currentBlock.type !== "text") {
        if (i === frPtr.scene && j === frPtr.block) {
          frPtr.offset = 0;
        }
        continue;
      }
      const blockText = currentBlock.text || "";
      let searchEndOffset;
      if (i === frPtr.scene && j === frPtr.block) {
        searchEndOffset = frPtr.offset;
      } else {
        searchEndOffset = blockText.length;
      }
      if (searchEndOffset <= 0 && blockText.length > 0) {
        if (i === frPtr.scene && j === frPtr.block) {
          frPtr.offset = 0;
        }
        continue;
      }
      if (!blockText && findPatternValue) {
        if (i === frPtr.scene && j === frPtr.block) {
          frPtr.offset = 0;
        }
        continue;
      }
      let matchIndex = -1;
      let matchedTextValue = "";
      if (blockText || useRegexValue && !findPatternValue) {
        if (useRegexValue) {
          try {
            if (findPatternValue === void 0 || findPatternValue === null) {
              showAppToast("Regex pattern is undefined.", true);
              return null;
            }
            const rx = new RegExp(findPatternValue, "g");
            let lastMatchResult = null;
            let currentMatchRegexResult;
            while ((currentMatchRegexResult = rx.exec(blockText)) !== null) {
              if (currentMatchRegexResult.index < searchEndOffset) {
                lastMatchResult = currentMatchRegexResult;
              } else {
                break;
              }
              if (rx.lastIndex === currentMatchRegexResult.index && findPatternValue) rx.lastIndex++;
              else if (rx.lastIndex === currentMatchRegexResult.index && !findPatternValue) break;
            }
            if (lastMatchResult) {
              matchIndex = lastMatchResult.index;
              matchedTextValue = lastMatchResult[0];
            }
          } catch (err) {
            showAppToast("Invalid regular expression.", true);
            return null;
          }
        } else {
          if (findPatternValue && searchEndOffset > 0) {
            let effectiveSearchStartForLastIndexOf = searchEndOffset;
            if (findPatternValue.length > 0) {
              effectiveSearchStartForLastIndexOf = searchEndOffset - findPatternValue.length;
            } else {
              effectiveSearchStartForLastIndexOf = searchEndOffset - 1;
            }
            if (effectiveSearchStartForLastIndexOf >= 0) {
              matchIndex = blockText.lastIndexOf(findPatternValue, effectiveSearchStartForLastIndexOf);
            }
            if (matchIndex !== -1) matchedTextValue = findPatternValue;
          }
        }
      }
      if (matchIndex !== -1) {
        const lines = blockText.split("\n");
        let cumulativeLength = 0, lineContent = "";
        for (const line of lines) {
          if (matchIndex >= cumulativeLength && matchIndex < cumulativeLength + line.length + 1) {
            lineContent = line;
            break;
          }
          cumulativeLength += line.length + 1;
        }
        frMatch = {
          sceneIndex: i,
          blockIndex: j,
          matchIndex,
          matchLength: matchedTextValue.length,
          chapterTitle: currentSceneObject.title,
          matchLine: lineContent,
          matchedText: matchedTextValue
        };
        frPtr = { scene: i, block: j, offset: matchIndex };
        return frMatch;
      }
      if (i === frPtr.scene && j === frPtr.block) {
        frPtr.offset = 0;
      }
    }
    if (i === frPtr.scene) {
      frPtr.block = -1;
      frPtr.offset = 0;
    }
  }
  frPtr = { scene: -1, block: 0, offset: 0 };
  return null;
}
function initializeFindReplaceBackup(showAppToast, toggleAppSpinner) {
  const frBackupFileInput = document.getElementById("frBackupFile");
  const frBackupFileNameEl = document.getElementById("frBackupFileName");
  const clearFrBackupFileBtn = document.getElementById("clearFrBackupFile");
  const findPatternInput = document.getElementById("findPattern");
  const useRegexCheckbox = document.getElementById("useRegexBackup");
  const currentMatchDisplay = document.getElementById("currentMatchDisplay");
  const replaceTextInput = document.getElementById("replaceText");
  const findNextBtn = document.getElementById("findNextBtn");
  const findPreviousBtn = document.getElementById("findPreviousBtn");
  const replaceNextBtn = document.getElementById("replaceNextBtn");
  const replaceAllBtn = document.getElementById("replaceAllBtn");
  const statusEl = document.getElementById("statusFindReplaceBackup");
  if (!frBackupFileInput || !frBackupFileNameEl || !clearFrBackupFileBtn || !findPatternInput || !useRegexCheckbox || !currentMatchDisplay || !replaceTextInput || !findNextBtn || !findPreviousBtn || !replaceNextBtn || !replaceAllBtn) {
    console.error("Find & Replace Backup: One or more UI elements not found. Initialization failed.");
    return;
  }
  function resetFrState() {
    frData = null;
    frMatch = null;
    frPtr = { scene: 0, block: 0, offset: 0 };
    displayMatchText(currentMatchDisplay, null);
    if (statusEl) statusEl.style.display = "none";
  }
  frBackupFileInput.addEventListener("change", (e) => {
    const target = e.target;
    resetFrState();
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
          throw new Error("Invalid backup structure for Find & Replace (missing scenes array).");
        }
        showAppToast("Backup file loaded for Find & Replace.");
      } catch (err) {
        showAppToast(err.message || "Error loading F&R backup.", true);
        if (statusEl) {
          statusEl.textContent = `Error: ${err.message || "Could not load backup."}`;
          statusEl.className = "status error";
          statusEl.style.display = "block";
        }
        resetFrState();
        frBackupFileNameEl.textContent = "";
        if (clearFrBackupFileBtn) clearFrBackupFileBtn.style.display = "none";
        frBackupFileInput.value = "";
        console.error("F&R Load Error:", err);
      } finally {
        toggleAppSpinner(false);
      }
    };
    reader.onerror = () => {
      showAppToast("Error reading F&R backup file.", true);
      if (statusEl) {
        statusEl.textContent = "Error: Could not read backup file.";
        statusEl.className = "status error";
        statusEl.style.display = "block";
      }
      resetFrState();
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
    resetFrState();
  });
  findNextBtn.addEventListener("click", () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData) {
      showAppToast("Upload a backup file first for Find & Replace.", true);
      return;
    }
    const pattern = findPatternInput.value;
    const useRegex = useRegexCheckbox.checked;
    if (!pattern && !useRegex) {
      showAppToast("Enter a find pattern.", true);
      return;
    }
    const match = findNextMatch(pattern, useRegex, showAppToast);
    displayMatchText(currentMatchDisplay, match);
    if (!match && frData && frData.revisions[0] && frPtr.scene >= frData.revisions[0].scenes.length) {
      showAppToast("Reached end of document.", false);
    }
  });
  findPreviousBtn.addEventListener("click", () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData) {
      showAppToast("Upload a backup file first for Find & Replace.", true);
      return;
    }
    const pattern = findPatternInput.value;
    const useRegex = useRegexCheckbox.checked;
    if (!pattern && !useRegex) {
      showAppToast("Enter a find pattern.", true);
      return;
    }
    const match = findPreviousMatch(pattern, useRegex, showAppToast);
    displayMatchText(currentMatchDisplay, match);
    if (!match && frPtr.scene < 0) {
      showAppToast("Reached beginning of document.", false);
    }
  });
  replaceNextBtn.addEventListener("click", () => {
    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    if (statusEl) statusEl.style.display = "none";
    if (!frData || !frMatch) {
      showAppToast('No current match to replace. Use "Find Next" first.', true);
      return;
    }
    try {
      const replacementText = replaceTextInput.value;
      const scene = frData.revisions[0].scenes[frMatch.sceneIndex];
      const parsedSceneContent = JSON.parse(scene.text);
      const targetBlock = parsedSceneContent.blocks[frMatch.blockIndex];
      if (targetBlock.type !== "text" || typeof targetBlock.text !== "string") {
        showAppToast("Cannot replace in non-text block.", true);
        return;
      }
      const originalBlockText = targetBlock.text || "";
      const textBeforeMatch = originalBlockText.substring(0, frMatch.matchIndex);
      const textAfterMatch = originalBlockText.substring(frMatch.matchIndex + frMatch.matchLength);
      targetBlock.text = textBeforeMatch + replacementText + textAfterMatch;
      scene.text = JSON.stringify(parsedSceneContent);
      showAppToast("Match replaced.", false);
      frPtr = { scene: frMatch.sceneIndex, block: frMatch.blockIndex, offset: frMatch.matchIndex + replacementText.length };
      frMatch = null;
      const pattern = findPatternInput.value;
      const useRegex = useRegexCheckbox.checked;
      const nextMatchToShow = findNextMatch(pattern, useRegex, showAppToast);
      displayMatchText(currentMatchDisplay, nextMatchToShow);
      if (!nextMatchToShow && frData.revisions[0] && frPtr.scene >= frData.revisions[0].scenes.length) {
        showAppToast("Reached end of document.", false);
      }
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
    if (!findPattern && !useRegex) {
      showAppToast("Enter a find pattern.", true);
      return;
    }
    toggleAppSpinner(true);
    try {
      const rev = frData.revisions[0];
      let replacementsMade = false;
      const replacerRegex = useRegex ? new RegExp(findPattern, "g") : null;
      rev.scenes.forEach((scene) => {
        try {
          const sceneContent = JSON.parse(scene.text);
          sceneContent.blocks.forEach((block) => {
            if (block.type === "text" && typeof block.text === "string") {
              const originalText = block.text;
              if (useRegex && replacerRegex) {
                block.text = block.text.replace(replacerRegex, replacementText);
              } else if (!useRegex && findPattern.length > 0) {
                block.text = block.text.split(findPattern).join(replacementText);
              } else if (!useRegex && findPattern.length === 0) {
              }
              if (block.text !== originalText) {
                replacementsMade = true;
              }
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
      if (replacementsMade) {
        showAppToast(`Replace All complete. Content updated. Download started.`);
      } else {
        showAppToast(`Replace All complete. No changes made (pattern not found or replacement is same). Download started.`);
      }
      frMatch = null;
      frPtr = { scene: 0, block: 0, offset: 0 };
      displayMatchText(currentMatchDisplay, null);
    } catch (err) {
      showAppToast(err.message || "Error during Replace All.", true);
      console.error("Replace All Error:", err);
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
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
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
