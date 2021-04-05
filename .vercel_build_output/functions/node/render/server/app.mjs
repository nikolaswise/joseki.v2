import {randomBytes, createHash} from "crypto";
import http from "http";
import https from "https";
import zlib from "zlib";
import Stream, {PassThrough, pipeline} from "stream";
import {types} from "util";
import {format, parse, resolve as resolve$1, URLSearchParams as URLSearchParams$1} from "url";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var src = dataUriToBuffer;
const {Readable} = Stream;
const wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
class Blob$1 {
  constructor(blobParts = [], options = {type: ""}) {
    let size = 0;
    const parts = blobParts.map((element) => {
      let buffer;
      if (element instanceof Buffer) {
        buffer = element;
      } else if (ArrayBuffer.isView(element)) {
        buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      } else if (element instanceof ArrayBuffer) {
        buffer = Buffer.from(element);
      } else if (element instanceof Blob$1) {
        buffer = element;
      } else {
        buffer = Buffer.from(typeof element === "string" ? element : String(element));
      }
      size += buffer.length || buffer.size || 0;
      return buffer;
    });
    const type = options.type === void 0 ? "" : String(options.type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(type) ? "" : type,
      size,
      parts
    });
  }
  get size() {
    return wm.get(this).size;
  }
  get type() {
    return wm.get(this).type;
  }
  async text() {
    return Buffer.from(await this.arrayBuffer()).toString();
  }
  async arrayBuffer() {
    const data = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return data.buffer;
  }
  stream() {
    return Readable.from(read(wm.get(this).parts));
  }
  slice(start = 0, end = this.size, type = "") {
    const {size} = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this).parts.values();
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        relativeStart = 0;
        if (added >= span) {
          break;
        }
      }
    }
    const blob = new Blob$1([], {type});
    Object.assign(wm.get(blob), {size: span, parts: blobParts});
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
}
Object.defineProperties(Blob$1.prototype, {
  size: {enumerable: true},
  type: {enumerable: true},
  slice: {enumerable: true}
});
var fetchBlob = Blob$1;
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class FetchError extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
}
const NAME = Symbol.toStringTag;
const isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
const isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
const isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
const carriage = "\r\n";
const dashes = "-".repeat(2);
const carriageLength = Buffer.byteLength(carriage);
const getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
const getBoundary = () => randomBytes(8).toString("hex");
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length2 = 0;
  for (const [name, value] of form) {
    length2 += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length2 += value.size;
    } else {
      length2 += Buffer.byteLength(String(value));
    }
    length2 += carriageLength;
  }
  length2 += Buffer.byteLength(getFooter(boundary));
  return length2;
}
const INTERNALS$2 = Symbol("Body internals");
class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer.isBuffer(body))
      ;
    else if (types.isAnyArrayBuffer(body)) {
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream)
      ;
    else if (isFormData(body)) {
      boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
      body = Stream.Readable.from(formDataIterator(body, boundary));
    } else {
      body = Buffer.from(String(body));
    }
    this[INTERNALS$2] = {
      body,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof Stream) {
      body.on("error", (err) => {
        const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error2;
      });
    }
  }
  get body() {
    return this[INTERNALS$2].body;
  }
  get bodyUsed() {
    return this[INTERNALS$2].disturbed;
  }
  async arrayBuffer() {
    const {buffer, byteOffset, byteLength} = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
    const buf = await this.buffer();
    return new fetchBlob([buf], {
      type: ct
    });
  }
  async json() {
    const buffer = await consumeBody(this);
    return JSON.parse(buffer.toString());
  }
  async text() {
    const buffer = await consumeBody(this);
    return buffer.toString();
  }
  buffer() {
    return consumeBody(this);
  }
}
Object.defineProperties(Body.prototype, {
  body: {enumerable: true},
  bodyUsed: {enumerable: true},
  arrayBuffer: {enumerable: true},
  blob: {enumerable: true},
  json: {enumerable: true},
  text: {enumerable: true}
});
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let {body} = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof Stream)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let {body} = instance;
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof Stream && typeof body.getBoundary !== "function") {
    p1 = new PassThrough({highWaterMark});
    p2 = new PassThrough({highWaterMark});
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].body = p1;
    body = p2;
  }
  return body;
};
const extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  }
  if (isFormData(body)) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body instanceof Stream) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
const getTotalBytes = (request) => {
  const {body} = request;
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  if (isFormData(body)) {
    return getFormDataLength(request[INTERNALS$2].boundary);
  }
  return null;
};
const writeToStream = (dest, {body}) => {
  if (body === null) {
    dest.end();
  } else if (isBlob(body)) {
    body.stream().pipe(dest);
  } else if (Buffer.isBuffer(body)) {
    dest.write(body);
    dest.end();
  } else {
    body.pipe(dest);
  }
};
const validateHeaderName = typeof http.validateHeaderName === "function" ? http.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_HTTP_TOKEN"});
    throw err;
  }
};
const validateHeaderValue = typeof http.validateHeaderValue === "function" ? http.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_CHAR"});
    throw err;
  }
};
class Headers extends URLSearchParams {
  constructor(init2) {
    let result = [];
    if (init2 instanceof Headers) {
      const raw = init2.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init2 == null)
      ;
    else if (typeof init2 === "object" && !types.isBoxedPrimitive(init2)) {
      const method = init2[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init2));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init2].map((pair) => {
          if (typeof pair !== "object" || types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback) {
    for (const name of this.keys()) {
      callback(this.get(name), name);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
}
Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
  result[property] = {enumerable: true};
  return result;
}, {}));
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch (e) {
      return false;
    }
  }));
}
const redirectStatus = new Set([301, 302, 303, 307, 308]);
const isRedirect = (code) => {
  return redirectStatus.has(code);
};
const INTERNALS$1 = Symbol("Response internals");
class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status || 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  get highWaterMark() {
    return this[INTERNALS$1].highWaterMark;
  }
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size
    });
  }
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(Response.prototype, {
  url: {enumerable: true},
  status: {enumerable: true},
  ok: {enumerable: true},
  redirected: {enumerable: true},
  statusText: {enumerable: true},
  headers: {enumerable: true},
  clone: {enumerable: true}
});
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};
const INTERNALS = Symbol("Request internals");
const isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
class Request extends Body {
  constructor(input, init2 = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    let method = init2.method || input.method || "GET";
    method = method.toUpperCase();
    if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init2.size || input.size || 0
    });
    const headers = new Headers(init2.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init2) {
      signal = init2.signal;
    }
    if (signal !== null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
    }
    this[INTERNALS] = {
      method,
      redirect: init2.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal
    };
    this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
    this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
    this.counter = init2.counter || input.counter || 0;
    this.agent = init2.agent || input.agent;
    this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
  }
  get method() {
    return this[INTERNALS].method;
  }
  get url() {
    return format(this[INTERNALS].parsedURL);
  }
  get headers() {
    return this[INTERNALS].headers;
  }
  get redirect() {
    return this[INTERNALS].redirect;
  }
  get signal() {
    return this[INTERNALS].signal;
  }
  clone() {
    return new Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(Request.prototype, {
  method: {enumerable: true},
  url: {enumerable: true},
  headers: {enumerable: true},
  redirect: {enumerable: true},
  clone: {enumerable: true},
  signal: {enumerable: true}
});
const getNodeRequestOptions = (request) => {
  const {parsedURL} = request[INTERNALS];
  const headers = new Headers(request[INTERNALS].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip,deflate,br");
  }
  let {agent} = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  if (!headers.has("Connection") && !agent) {
    headers.set("Connection", "close");
  }
  const search = getSearch(parsedURL);
  const requestOptions = {
    path: parsedURL.pathname + search,
    pathname: parsedURL.pathname,
    hostname: parsedURL.hostname,
    protocol: parsedURL.protocol,
    port: parsedURL.port,
    hash: parsedURL.hash,
    search: parsedURL.search,
    query: parsedURL.query,
    href: parsedURL.href,
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return requestOptions;
};
class AbortError extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
}
const supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve2, reject2) => {
    const request = new Request(url, options_);
    const options = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, {headers: {"Content-Type": data.typeFull}});
      resolve2(response2);
      return;
    }
    const send = (options.protocol === "https:" ? https : http).request;
    const {signal} = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject2(error2);
      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject2(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location2 = headers.get("Location");
        const locationURL = location2 === null ? null : new URL(location2, request.url);
        switch (request.redirect) {
          case "error":
            reject2(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject2(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject2(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof Stream.Readable) {
              reject2(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = pipeline(response_, new PassThrough(), (error2) => {
        reject2(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = pipeline(body, zlib.createGunzip(zlibOptions), (error2) => {
          reject2(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = pipeline(response_, new PassThrough(), (error2) => {
          reject2(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pipeline(body, zlib.createInflate(), (error2) => {
              reject2(error2);
            });
          } else {
            body = pipeline(body, zlib.createInflateRaw(), (error2) => {
              reject2(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = pipeline(body, zlib.createBrotliDecompress(), (error2) => {
          reject2(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function noop$1() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue = [];
function writable(value, start = noop$1) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe: subscribe2};
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
const s = JSON.stringify;
async function get_response({request, options, $session, route, status = 200, error: error2}) {
  const dependencies = {};
  const serialized_session = try_serialize($session, (error3) => {
    throw new Error(`Failed to serialize session data: ${error3.message}`);
  });
  const serialized_data = [];
  const match = error2 ? null : route.pattern.exec(request.path);
  const params2 = error2 ? {} : route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: params2
  };
  let uses_credentials = false;
  const fetcher = async (resource, opts = {}) => {
    let url;
    if (typeof resource === "string") {
      url = resource;
    } else {
      url = resource.url;
      opts = {
        method: resource.method,
        headers: resource.headers,
        body: resource.body,
        mode: resource.mode,
        credentials: resource.credentials,
        cache: resource.cache,
        redirect: resource.redirect,
        referrer: resource.referrer,
        integrity: resource.integrity,
        ...opts
      };
    }
    if (options.local && url.startsWith(options.paths.assets)) {
      url = url.replace(options.paths.assets, "");
    }
    const parsed = parse(url);
    if (opts.credentials !== "omit") {
      uses_credentials = true;
    }
    let response;
    if (parsed.protocol) {
      response = await fetch(parsed.href, opts);
    } else {
      const resolved = resolve$1(request.path, parsed.pathname);
      const filename = resolved.slice(1);
      const filename_html = `${filename}/index.html`;
      const asset = options.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
      if (asset) {
        if (options.get_static_file) {
          response = new Response(options.get_static_file(asset.file), {
            headers: {
              "content-type": asset.type
            }
          });
        } else {
          response = await fetch(`http://${page2.host}/${asset.file}`, opts);
        }
      }
      if (!response) {
        const rendered2 = await ssr({
          host: request.host,
          method: opts.method || "GET",
          headers: opts.headers || {},
          path: resolved,
          body: opts.body,
          query: new URLSearchParams$1(parsed.query || "")
        }, {
          ...options,
          fetched: url,
          initiator: route
        });
        if (rendered2) {
          dependencies[resolved] = rendered2;
          response = new Response(rendered2.body, {
            status: rendered2.status,
            headers: rendered2.headers
          });
        }
      }
    }
    if (response) {
      const proxy = new Proxy(response, {
        get(response2, key, receiver) {
          async function text() {
            const body2 = await response2.text();
            const headers2 = {};
            response2.headers.forEach((value, key2) => {
              if (key2 !== "etag")
                headers2[key2] = value;
            });
            serialized_data.push({
              url,
              json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers2)},"body":${escape$2(body2)}}`
            });
            return body2;
          }
          if (key === "text") {
            return text;
          }
          if (key === "json") {
            return async () => {
              return JSON.parse(await text());
            };
          }
          return Reflect.get(response2, key, receiver);
        }
      });
      return proxy;
    }
    return new Response("Not found", {
      status: 404
    });
  };
  const component_promises = error2 ? [options.manifest.layout()] : [options.manifest.layout(), ...route.parts.map((part) => part.load())];
  const components2 = [];
  const props_promises = [];
  let context = {};
  let maxage;
  let page_component;
  try {
    page_component = error2 ? {ssr: options.ssr, router: options.router, hydrate: options.hydrate} : await component_promises[component_promises.length - 1];
  } catch (e) {
    return await get_response({
      request,
      options,
      $session,
      route: null,
      status: 500,
      error: e instanceof Error ? e : {name: "Error", message: e.toString()}
    });
  }
  const page_config = {
    ssr: "ssr" in page_component ? page_component.ssr : options.ssr,
    router: "router" in page_component ? page_component.router : options.router,
    hydrate: "hydrate" in page_component ? page_component.hydrate : options.hydrate
  };
  if (options.only_render_prerenderable_pages) {
    if (error2)
      return;
    if (!page_component.prerender)
      return;
  }
  let rendered;
  if (page_config.ssr) {
    for (let i = 0; i < component_promises.length; i += 1) {
      let loaded;
      try {
        const mod = await component_promises[i];
        components2[i] = mod.default;
        if (mod.preload) {
          throw new Error("preload has been deprecated in favour of load. Please consult the documentation: https://kit.svelte.dev/docs#loading");
        }
        if (mod.load) {
          loaded = await mod.load.call(null, {
            page: page2,
            get session() {
              uses_credentials = true;
              return $session;
            },
            fetch: fetcher,
            context: {...context}
          });
          if (!loaded && mod === page_component)
            return;
        }
      } catch (e) {
        if (error2)
          throw e instanceof Error ? e : new Error(e);
        loaded = {
          error: e instanceof Error ? e : {name: "Error", message: e.toString()},
          status: 500
        };
      }
      if (loaded) {
        loaded = normalize(loaded);
        if (loaded.error) {
          return await get_response({
            request,
            options,
            $session,
            route: null,
            status: loaded.status,
            error: loaded.error
          });
        }
        if (loaded.redirect) {
          return {
            status: loaded.status,
            headers: {
              location: loaded.redirect
            }
          };
        }
        if (loaded.context) {
          context = {
            ...context,
            ...loaded.context
          };
        }
        maxage = loaded.maxage || 0;
        props_promises[i] = loaded.props;
      }
    }
    const session = writable($session);
    let session_tracking_active = false;
    const unsubscribe2 = session.subscribe(() => {
      if (session_tracking_active)
        uses_credentials = true;
    });
    session_tracking_active = true;
    if (error2) {
      if (options.dev) {
        error2.stack = await options.get_stack(error2);
      } else {
        error2.stack = String(error2);
      }
    }
    const props = {
      status,
      error: error2,
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page: page2,
      components: components2
    };
    for (let i = 0; i < props_promises.length; i += 1) {
      props[`props_${i}`] = await props_promises[i];
    }
    try {
      rendered = options.root.render(props);
    } catch (e) {
      if (error2)
        throw e instanceof Error ? e : new Error(e);
      return await get_response({
        request,
        options,
        $session,
        route: null,
        status: 500,
        error: e instanceof Error ? e : {name: "Error", message: e.toString()}
      });
    }
    unsubscribe2();
  } else {
    rendered = {
      head: "",
      html: "",
      css: ""
    };
  }
  const js_deps = route ? route.js : [];
  const css_deps = route ? route.css : [];
  const style = route ? route.style : "";
  const prefix = `${options.paths.assets}/${options.app_dir}`;
  const links = options.amp ? `<style amp-custom>${style || (await Promise.all(css_deps.map((dep) => options.get_amp_css(dep)))).join("\n")}</style>` : [
    ...js_deps.map((dep) => `<link rel="modulepreload" href="${prefix}/${dep}">`),
    ...css_deps.map((dep) => `<link rel="stylesheet" href="${prefix}/${dep}">`)
  ].join("\n			");
  let init2 = "";
  if (options.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>`;
  } else if (page_config.router || page_config.hydrate) {
    init2 = `
		<script type="module">
			import { start } from ${s(options.entry)};
			start({
				target: ${options.target ? `document.querySelector(${s(options.target)})` : "document.body"},
				paths: ${s(options.paths)},
				session: ${serialized_session},
				host: ${request.host ? s(request.host) : "location.host"},
				route: ${!!page_config.router},
				hydrate: ${page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: ${route ? `[
						${(route ? route.parts : []).map((part) => `import(${s(options.get_component_path(part.id))})`).join(",\n						")}
					]` : "[]"},
					page: {
						host: ${request.host ? s(request.host) : "location.host"}, // TODO this is redundant
						path: ${s(request.path)},
						query: new URLSearchParams(${s(request.query.toString())}),
						params: ${s(params2)}
					}
				}` : "null"}
			});
		</script>`;
  }
  const head = [
    rendered.head,
    style && !options.amp ? `<style data-svelte>${style}</style>` : "",
    links,
    init2
  ].join("\n\n");
  const body = options.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, json}) => `<script type="svelte-data" url="${url}">${json}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${uses_credentials ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options.template({head, body}),
    dependencies
  };
}
async function render_page(request, route, options) {
  if (options.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options.hooks.getSession({context: request.context});
  const response = await get_response({
    request,
    options,
    $session,
    route,
    status: route ? 200 : 404,
    error: route ? null : new Error(`Not found: ${request.path}`)
  });
  if (response) {
    return response;
  }
  if (options.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${options.fetched}`
    };
  }
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
const escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$2(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params2 = route.params(match);
    const response = await handler({...request, params: params2});
    if (response) {
      if (typeof response !== "object" || response.body == null) {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; ${response.body == null ? "body is missing" : `expected an object, got ${typeof response}`}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function md5(body) {
  return createHash("md5").update(body).digest("hex");
}
async function ssr(incoming, options) {
  if (incoming.path.endsWith("/") && incoming.path !== "/") {
    const q = incoming.query.toString();
    return {
      status: 301,
      headers: {
        location: incoming.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const context = await options.hooks.getContext(incoming) || {};
  try {
    return await options.hooks.handle({
      ...incoming,
      params: null,
      context
    }, async (request) => {
      for (const route of options.manifest.routes) {
        if (!route.pattern.test(request.path))
          continue;
        const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options);
        if (response) {
          if (response.status === 200) {
            if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
              const etag = `"${md5(response.body)}"`;
              if (request.headers["if-none-match"] === etag) {
                return {
                  status: 304,
                  headers: {},
                  body: null
                };
              }
              response.headers["etag"] = etag;
            }
          }
          return response;
        }
      }
      return await render_page(request, null, options);
    });
  } catch (e) {
    if (e && e.stack) {
      e.stack = await options.get_stack(e);
    }
    console.error(e && e.stack || e);
    return {
      status: 500,
      headers: {},
      body: options.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function subscribe$1(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape$1(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, {$$slots = {}, context = new Map()} = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape$1(value)) : `"${value}"`}`}`;
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape$1(status)}</h1>

<p>${escape$1(error2.message)}</p>


${error2.stack ? `<pre>${escape$1(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Error$1
});
var root_svelte = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$9 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\timport ErrorComponent from \\"../components/error.svelte\\";\\n\\n\\t// error handling\\n\\texport let status = undefined;\\n\\texport let error = undefined;\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\n\\tconst Layout = components[0];\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title;\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<Layout {...(props_0 || {})}>\\n\\t{#if error}\\n\\t\\t<ErrorComponent {status} {error}/>\\n\\t{:else}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}/>\\n\\t{/if}\\n</Layout>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AA0DC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status = void 0} = $$props;
  let {error: error2 = void 0} = $$props;
  let {stores} = $$props;
  let {page: page2} = $$props;
  let {components: components2} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  const Layout = components2[0];
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe2 = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title;
      }
    });
    mounted = true;
    return unsubscribe2;
  });
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components2 !== void 0)
    $$bindings.components(components2);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  $$result.css.add(css$9);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(Layout, "Layout").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${error2 ? `${validate_component(Error$1, "ErrorComponent").$$render($$result, {status, error: error2}, {}, {})}` : `${validate_component(components2[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {})}`}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `Navigated to ${escape$1(title)}` : ``}</div>` : ``}`;
});
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head, body}) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
function init({paths}) {
}
const d = decodeURIComponent;
const empty = () => ({});
const components = [
  () => Promise.resolve().then(function() {
    return index;
  }),
  () => Promise.resolve().then(function() {
    return _new;
  }),
  () => Promise.resolve().then(function() {
    return _slug_;
  })
];
const client_component_lookup = {".svelte/build/runtime/internal/start.js": "start-96936697.js", "src/routes/index.svelte": "pages/index.svelte-549df977.js", "src/routes/new.svelte": "pages/new.svelte-f8b4d975.js", "src/routes/[slug].svelte": "pages/[slug].svelte-467d1468.js"};
const manifest = {
  assets: [{file: "favicon.ico", size: 1150, type: "image/vnd.microsoft.icon"}, {file: "fonts/Input-Regular.woff", size: 48592, type: "font/woff"}, {file: "fonts/Input-Regular.woff2", size: 37564, type: "font/woff2"}, {file: "fonts/Rza-Trial-Black.otf", size: 51696, type: "font/otf"}, {file: "fonts/Rza-Trial-Black.woff", size: 28188, type: "font/woff"}, {file: "fonts/Rza-Trial-Bold.otf", size: 47272, type: "font/otf"}, {file: "fonts/Rza-Trial-Bold.woff", size: 26556, type: "font/woff"}, {file: "fonts/Rza-Trial-Light.otf", size: 44608, type: "font/otf"}, {file: "fonts/Rza-Trial-Light.woff", size: 26076, type: "font/woff"}, {file: "fonts/Rza-Trial-Medium.otf", size: 48576, type: "font/otf"}, {file: "fonts/Rza-Trial-Medium.woff", size: 27744, type: "font/woff"}, {file: "fonts/Rza-Trial-Regular.otf", size: 48876, type: "font/otf"}, {file: "fonts/Rza-Trial-Regular.woff", size: 27596, type: "font/woff"}, {file: "fonts/Rza-Trial-Semibold.otf", size: 48608, type: "font/otf"}, {file: "fonts/Rza-Trial-Semibold.woff", size: 27820, type: "font/woff"}, {file: "robots.txt", size: 67, type: "text/plain"}],
  layout: () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  error: () => Promise.resolve().then(function() {
    return error;
  }),
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      parts: [{id: "src/routes/index.svelte", load: components[0]}],
      css: ["assets/start-07ae7a7a.css", "assets/singletons-ec6c4ddc.css"],
      js: ["start-96936697.js", "chunks/vendor-03fcee4d.js", "chunks/singletons-90137d57.js", "pages/index.svelte-549df977.js"]
    },
    {
      type: "page",
      pattern: /^\/new\/?$/,
      params: empty,
      parts: [{id: "src/routes/new.svelte", load: components[1]}],
      css: ["assets/start-07ae7a7a.css", "assets/singletons-ec6c4ddc.css", "assets/pages/new.svelte-f82022f5.css"],
      js: ["start-96936697.js", "chunks/vendor-03fcee4d.js", "chunks/singletons-90137d57.js", "pages/new.svelte-f8b4d975.js"]
    },
    {
      type: "page",
      pattern: /^\/([^/]+?)\/?$/,
      params: (m) => ({slug: d(m[1])}),
      parts: [{id: "src/routes/[slug].svelte", load: components[2]}],
      css: ["assets/start-07ae7a7a.css", "assets/singletons-ec6c4ddc.css", "assets/pages/[slug].svelte-dfc5c861.css"],
      js: ["start-96936697.js", "chunks/vendor-03fcee4d.js", "chunks/singletons-90137d57.js", "pages/[slug].svelte-467d1468.js"]
    }
  ]
};
const get_hooks = (hooks2) => ({
  getContext: hooks2.getContext || (() => ({})),
  getSession: hooks2.getSession || (() => ({})),
  handle: hooks2.handle || ((request, render2) => render2(request))
});
const hooks = get_hooks(user_hooks);
function render(request, {
  paths = {base: "", assets: "/."},
  local = false,
  only_render_prerenderable_pages = false,
  get_static_file
} = {}) {
  return ssr({
    ...request,
    host: request.headers["host"]
  }, {
    paths,
    local,
    template,
    manifest,
    target: "#svelte",
    entry: "/./_app/start-96936697.js",
    root: Root,
    hooks,
    dev: false,
    amp: false,
    only_render_prerenderable_pages,
    app_dir: "_app",
    get_component_path: (id) => "/./_app/" + client_component_lookup[id],
    get_stack: (error2) => error2.stack,
    get_static_file,
    get_amp_css: (dep) => amp_css_lookup[dep],
    ssr: true,
    router: true,
    hydrate: true
  });
}
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<main></main>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Routes
});
var adjectives = ["black", "white", "gray", "brown", "red", "pink", "crimson", "carnelian", "orange", "yellow", "ivory", "cream", "green", "viridian", "aquamarine", "cyan", "blue", "cerulean", "azure", "indigo", "navy", "violet", "purple", "lavender", "magenta", "rainbow", "iridescent", "spectrum", "prism", "bold", "vivid", "pale", "clear", "glass", "translucent", "misty", "dark", "light", "gold", "silver", "copper", "bronze", "steel", "iron", "brass", "mercury", "zinc", "chrome", "platinum", "titanium", "nickel", "lead", "pewter", "rust", "metal", "stone", "quartz", "granite", "marble", "alabaster", "agate", "jasper", "pebble", "pyrite", "crystal", "geode", "obsidian", "mica", "flint", "sand", "gravel", "boulder", "basalt", "ruby", "beryl", "scarlet", "citrine", "sulpher", "topaz", "amber", "emerald", "malachite", "jade", "abalone", "lapis", "sapphire", "diamond", "peridot", "gem", "jewel", "bevel", "coral", "jet", "ebony", "wood", "tree", "cherry", "maple", "cedar", "branch", "bramble", "rowan", "ash", "fir", "pine", "cactus", "alder", "grove", "forest", "jungle", "palm", "bush", "mulberry", "juniper", "vine", "ivy", "rose", "lily", "tulip", "daffodil", "honeysuckle", "fuschia", "hazel", "walnut", "almond", "lime", "lemon", "apple", "blossom", "bloom", "crocus", "rose", "buttercup", "dandelion", "iris", "carnation", "fern", "root", "branch", "leaf", "seed", "flower", "petal", "pollen", "orchid", "mangrove", "cypress", "sequoia", "sage", "heather", "snapdragon", "daisy", "mountain", "hill", "alpine", "chestnut", "valley", "glacier", "forest", "grove", "glen", "tree", "thorn", "stump", "desert", "canyon", "dune", "oasis", "mirage", "well", "spring", "meadow", "field", "prairie", "grass", "tundra", "island", "shore", "sand", "shell", "surf", "wave", "foam", "tide", "lake", "river", "brook", "stream", "pool", "pond", "sun", "sprinkle", "shade", "shadow", "rain", "cloud", "storm", "hail", "snow", "sleet", "thunder", "lightning", "wind", "hurricane", "typhoon", "dawn", "sunrise", "morning", "noon", "twilight", "evening", "sunset", "midnight", "night", "sky", "star", "stellar", "comet", "nebula", "quasar", "solar", "lunar", "planet", "meteor", "sprout", "pear", "plum", "kiwi", "berry", "apricot", "peach", "mango", "pineapple", "coconut", "olive", "ginger", "root", "plain", "fancy", "stripe", "spot", "speckle", "spangle", "ring", "band", "blaze", "paint", "pinto", "shade", "tabby", "brindle", "patch", "calico", "checker", "dot", "pattern", "glitter", "glimmer", "shimmer", "dull", "dust", "dirt", "glaze", "scratch", "quick", "swift", "fast", "slow", "clever", "fire", "flicker", "flash", "spark", "ember", "coal", "flame", "chocolate", "vanilla", "sugar", "spice", "cake", "pie", "cookie", "candy", "caramel", "spiral", "round", "jelly", "square", "narrow", "long", "short", "small", "tiny", "big", "giant", "great", "atom", "peppermint", "mint", "butter", "fringe", "rag", "quilt", "truth", "lie", "holy", "curse", "noble", "sly", "brave", "shy", "lava", "foul", "leather", "fantasy", "keen", "luminous", "feather", "sticky", "gossamer", "cotton", "rattle", "silk", "satin", "cord", "denim", "flannel", "plaid", "wool", "linen", "silent", "flax", "weak", "valiant", "fierce", "gentle", "rhinestone", "splash", "north", "south", "east", "west", "summer", "winter", "autumn", "spring", "season", "equinox", "solstice", "paper", "motley", "torch", "ballistic", "rampant", "shag", "freckle", "wild", "free", "chain", "sheer", "crazy", "mad", "candle", "ribbon", "lace", "notch", "wax", "shine", "shallow", "deep", "bubble", "harvest", "fluff", "venom", "boom", "slash", "rune", "cold", "quill", "love", "hate", "garnet", "zircon", "power", "bone", "void", "horn", "glory", "cyber", "nova", "hot", "helix", "cosmic", "quark", "quiver", "holly", "clover", "polar", "regal", "ripple", "ebony", "wheat", "phantom", "dew", "chisel", "crack", "chatter", "laser", "foil", "tin", "clever", "treasure", "maze", "twisty", "curly", "fortune", "fate", "destiny", "cute", "slime", "ink", "disco", "plume", "time", "psychadelic", "relic", "fossil", "water", "savage", "ancient", "rapid", "road", "trail", "stitch", "button", "bow", "nimble", "zest", "sour", "bitter", "phase", "fan", "frill", "plump", "pickle", "mud", "puddle", "pond", "river", "spring", "stream", "battle", "arrow", "plume", "roan", "pitch", "tar", "cat", "dog", "horse", "lizard", "bird", "fish", "saber", "scythe", "sharp", "soft", "razor", "neon", "dandy", "weed", "swamp", "marsh", "bog", "peat", "moor", "muck", "mire", "grave", "fair", "just", "brick", "puzzle", "skitter", "prong", "fork", "dent", "dour", "warp", "luck", "coffee", "split", "chip", "hollow", "heavy", "legend", "hickory", "mesquite", "nettle", "rogue", "charm", "prickle", "bead", "sponge", "whip", "bald", "frost", "fog", "oil", "veil", "cliff", "volcano", "rift", "maze", "proud", "dew", "mirror", "shard", "salt", "pepper", "honey", "thread", "bristle", "ripple", "glow", "zenith"];
var nouns = ["aji", "atari", "board", "dame", "eyes", "ears", "gote", "hane", "hayago", "jigo", "joseki", "kami", "kakari", "keima", "kiai", "kikashi", "ko", "komi", "korigatachi", "kosumi", "liberty", "miai", "monkey-jump", "moyo", "myoushu", "nakade", "nerai", "ni-dan-bane", "pincer", "sabaki", "seki", "sente", "shape", "shoulder", "tesuji", "thickness", "yose", "yosu-miru", "moose", "heron", "owl", "stork", "crane", "sparrow", "parrot", "cockatoo", "lizard", "gecko", "iguana", "snake", "python", "viper", "condor", "vulture", "spider", "heron", "toucan", "bee", "wasp", "hornet", "rabbit", "hare", "brow", "mustang", "ox", "piper", "mask", "hero", "antler", "chiller", "gem", "ogre", "myth", "elf", "fairy", "pixie", "dragon", "griffin", "unicorn", "pegasus", "chopper", "slicer", "skinner", "butterfly", "legend", "wanderer", "rover", "loon", "lancer", "glass", "glazer", "flame", "crystal", "lantern", "lighter", "cloak", "bell", "ringer", "keeper", "bolt", "catcher", "rat", "mouse", "serpent", "wyrm", "gargoyle", "thorn", "whip", "rider", "spirit", "sentry", "bat", "beetle", "burn", "stone", "collar", "mark", "grin", "scowl", "spear", "razor", "edge", "jay", "ape", "monkey", "gorilla", "koala", "kangaroo", "yak", "sloth", "ant", "weed", "seed", "eater", "razor", "face", "mind", "shift", "rider", "face", "mole", "vole", "stag", "cap", "boot", "drop", "hugger", "carpet", "curtain", "head", "crown", "fang", "frill", "skull", "tongue", "throat", "nose", "sight", "seer", "song", "jaw", "bite", "fin", "lifter", "hand", "toe", "thumb", "palm", "hoof", "fly", "flier", "swoop", "hiss", "snarl", "rib", "chest", "back", "ridge", "leg", "tail", "swisher", "weaver", "crafter", "binder", "scribe", "muse", "snap", "friend", "foe", "guardian", "belly", "stealer", "giver", "dancer", "twister", "turner", "dart", "drifter"];
function randomNoun(generator) {
  generator = generator || Math.random;
  return nouns[Math.floor(generator() * nouns.length)];
}
function randomAdjective(generator) {
  generator = generator || Math.random;
  return adjectives[Math.floor(generator() * adjectives.length)];
}
function generateName(generator) {
  var noun = randomNoun(generator);
  var adjective = randomAdjective(generator);
  return `${adjective}-${noun}`;
}
var Button_svelte = "a.svelte-1aw59nu,button.svelte-1aw59nu{width:max-content;display:inline-block;color:var(--color-ground);background-color:var(--color-figure);padding:calc(var(--u-1p) + var(--u-6p)) calc(var(--u-3p) + var(--u-6p));border:1px solid var(--color-ground);text-decoration:none;border-radius:2em;transform:translate3d(0,0,0);box-shadow:rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px;transition:all 200ms ease-in-out;position:relative;cursor:pointer}a.svelte-1aw59nu:hover,button.svelte-1aw59nu:hover{transition:all 200ms ease-in-out;transform:translate3d(0,calc(-1 * var(--u-1p)),0)}a.svelte-1aw59nu:active,button.svelte-1aw59nu:active{transition:all 100ms ease-in-out;transform:translate3d(0,calc(var(--u-1p)),0)}a.svelte-1aw59nu::after,button.svelte-1aw59nu::after{content:'';display:block;border-radius:1rem;top:0;left:0;bottom:0;width:100%;position:absolute;box-shadow:rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px;opacity:0;transition:all 200ms ease-in-out}a.svelte-1aw59nu:hover::after,button.svelte-1aw59nu:hover::after{opacity:1;transition:all 200ms ease-in-out}.large.svelte-1aw59nu{font-size:var(--s-18);padding:calc(var(--u-3p) + var(--u-6p)) calc(1rem + var(--u-6p));border-radius:1rem}.large.svelte-1aw59nu:hover{transform:translate3d(0,calc(-1 * var(--u-2p)),0)}.large.svelte-1aw59nu:active{transform:translate3d(0,calc(var(--u-1p)),0)}";
const css$8 = {
  code: "a.svelte-1aw59nu,button.svelte-1aw59nu{width:max-content;display:inline-block;color:var(--color-ground);background-color:var(--color-figure);padding:calc(var(--u-1p) + var(--u-6p)) calc(var(--u-3p) + var(--u-6p));border:1px solid var(--color-ground);text-decoration:none;border-radius:2em;transform:translate3d(0,0,0);box-shadow:rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px;transition:all 200ms ease-in-out;position:relative;cursor:pointer}a.svelte-1aw59nu:hover,button.svelte-1aw59nu:hover{transition:all 200ms ease-in-out;transform:translate3d(0,calc(-1 * var(--u-1p)),0)}a.svelte-1aw59nu:active,button.svelte-1aw59nu:active{transition:all 100ms ease-in-out;transform:translate3d(0,calc(var(--u-1p)),0)}a.svelte-1aw59nu::after,button.svelte-1aw59nu::after{content:'';display:block;border-radius:1rem;top:0;left:0;bottom:0;width:100%;position:absolute;box-shadow:rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px;opacity:0;transition:all 200ms ease-in-out}a.svelte-1aw59nu:hover::after,button.svelte-1aw59nu:hover::after{opacity:1;transition:all 200ms ease-in-out}.large.svelte-1aw59nu{font-size:var(--s-18);padding:calc(var(--u-3p) + var(--u-6p)) calc(1rem + var(--u-6p));border-radius:1rem}.large.svelte-1aw59nu:hover{transform:translate3d(0,calc(-1 * var(--u-2p)),0)}.large.svelte-1aw59nu:active{transform:translate3d(0,calc(var(--u-1p)),0)}",
  map: `{"version":3,"file":"Button.svelte","sources":["Button.svelte"],"sourcesContent":["<script>\\n  export let href = false\\n  export let small = false\\n  export let medium = true\\n  export let large = false\\n</script>\\n\\n<style>\\n  a,\\n  button {\\n    width: max-content;\\n    display: inline-block;\\n    color: var(--color-ground);\\n    background-color: var(--color-figure);\\n    padding: calc(var(--u-1p) + var(--u-6p)) calc(var(--u-3p) + var(--u-6p));\\n    border: 1px solid var(--color-ground);\\n    text-decoration: none;\\n    border-radius: 2em;\\n    transform: translate3d(0,0,0);\\n    box-shadow: rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px;\\n    transition: all 200ms ease-in-out;\\n    position: relative;\\n    cursor: pointer;\\n  }\\n  a:hover,\\n  button:hover {\\n    transition: all 200ms ease-in-out;\\n    transform: translate3d(0,calc(-1 * var(--u-1p)),0);\\n  }\\n  a:active,\\n  button:active {\\n    transition: all 100ms ease-in-out;\\n    transform: translate3d(0,calc(var(--u-1p)),0);\\n  }\\n  a::after,\\n  button::after {\\n    content: '';\\n    display: block;\\n    border-radius: 1rem;\\n    top: 0;\\n    left: 0;\\n    bottom: 0;\\n    width: 100%;\\n    position: absolute;\\n    box-shadow: rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px;\\n    opacity: 0;\\n    transition: all 200ms ease-in-out;\\n  }\\n  a:hover::after,\\n  button:hover::after {\\n    opacity: 1;\\n    transition: all 200ms ease-in-out;\\n  }\\n\\n  .large {\\n    font-size: var(--s-18);\\n    padding: calc(var(--u-3p) + var(--u-6p)) calc(1rem + var(--u-6p));\\n\\n    border-radius: 1rem;\\n  }\\n  .large:hover {\\n    transform: translate3d(0,calc(-1 * var(--u-2p)),0);\\n  }\\n  .large:active {\\n    transform: translate3d(0,calc(var(--u-1p)),0);\\n  }\\n\\n\\n</style>\\n\\n{#if href}\\n  <a\\n    class={\`\${large ? 'large' : ''}\`}\\n    href={href}>\\n    <slot></slot>\\n  </a>\\n{:else}\\n  <button\\n    class={\`\${large ? 'large' : ''}\`}>\\n    <slot></slot>\\n  </button>\\n{/if}"],"names":[],"mappings":"AAQE,gBAAC,CACD,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,WAAW,CAClB,OAAO,CAAE,YAAY,CACrB,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,OAAO,CAAE,KAAK,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAAC,KAAK,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CACxE,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,cAAc,CAAC,CACrC,eAAe,CAAE,IAAI,CACrB,aAAa,CAAE,GAAG,CAClB,SAAS,CAAE,YAAY,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAC7B,UAAU,CAAE,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,IAAI,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CACnF,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,WAAW,CACjC,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,OAAO,AACjB,CAAC,AACD,gBAAC,MAAM,CACP,qBAAM,MAAM,AAAC,CAAC,AACZ,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,WAAW,CACjC,SAAS,CAAE,YAAY,CAAC,CAAC,KAAK,EAAE,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,CAAC,AACpD,CAAC,AACD,gBAAC,OAAO,CACR,qBAAM,OAAO,AAAC,CAAC,AACb,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,WAAW,CACjC,SAAS,CAAE,YAAY,CAAC,CAAC,KAAK,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,CAAC,AAC/C,CAAC,AACD,gBAAC,OAAO,CACR,qBAAM,OAAO,AAAC,CAAC,AACb,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,KAAK,CACd,aAAa,CAAE,IAAI,CACnB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,CAAC,CACT,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,IAAI,CAAC,IAAI,CACtH,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,WAAW,AACnC,CAAC,AACD,gBAAC,MAAM,OAAO,CACd,qBAAM,MAAM,OAAO,AAAC,CAAC,AACnB,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,WAAW,AACnC,CAAC,AAED,MAAM,eAAC,CAAC,AACN,SAAS,CAAE,IAAI,MAAM,CAAC,CACtB,OAAO,CAAE,KAAK,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAAC,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAEjE,aAAa,CAAE,IAAI,AACrB,CAAC,AACD,qBAAM,MAAM,AAAC,CAAC,AACZ,SAAS,CAAE,YAAY,CAAC,CAAC,KAAK,EAAE,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,CAAC,AACpD,CAAC,AACD,qBAAM,OAAO,AAAC,CAAC,AACb,SAAS,CAAE,YAAY,CAAC,CAAC,KAAK,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,CAAC,AAC/C,CAAC"}`
};
const Button = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {href = false} = $$props;
  let {small = false} = $$props;
  let {medium = true} = $$props;
  let {large = false} = $$props;
  if ($$props.href === void 0 && $$bindings.href && href !== void 0)
    $$bindings.href(href);
  if ($$props.small === void 0 && $$bindings.small && small !== void 0)
    $$bindings.small(small);
  if ($$props.medium === void 0 && $$bindings.medium && medium !== void 0)
    $$bindings.medium(medium);
  if ($$props.large === void 0 && $$bindings.large && large !== void 0)
    $$bindings.large(large);
  $$result.css.add(css$8);
  return `${href ? `<a class="${escape$1(null_to_empty(`${large ? "large" : ""}`)) + " svelte-1aw59nu"}"${add_attribute("href", href, 0)}>${slots.default ? slots.default({}) : ``}</a>` : `<button class="${escape$1(null_to_empty(`${large ? "large" : ""}`)) + " svelte-1aw59nu"}">${slots.default ? slots.default({}) : ``}</button>`}`;
});
var new_svelte = 'form.svelte-m0bn0e{max-width:max-content;margin:auto;border-top:2px solid var(--color-figure)}label.svelte-m0bn0e{padding:calc(var(--u-2p) + var(--u-3p)) 0;border-bottom:2px solid var(--color-figure);display:grid;grid-template-columns:1fr 1fr;font-family:"Input";align-items:center}input.svelte-m0bn0e,select.svelte-m0bn0e{margin-bottom:0}.submit.svelte-m0bn0e{text-align:right;margin-top:1rem}';
const css$7 = {
  code: 'form.svelte-m0bn0e{max-width:max-content;margin:auto;border-top:2px solid var(--color-figure)}label.svelte-m0bn0e{padding:calc(var(--u-2p) + var(--u-3p)) 0;border-bottom:2px solid var(--color-figure);display:grid;grid-template-columns:1fr 1fr;font-family:"Input";align-items:center}input.svelte-m0bn0e,select.svelte-m0bn0e{margin-bottom:0}.submit.svelte-m0bn0e{text-align:right;margin-top:1rem}',
  map: `{"version":3,"file":"new.svelte","sources":["new.svelte"],"sourcesContent":["<script>\\n  import { goto } from '$app/navigation';\\n  import generateName from '$lib/game-names.js'\\n  import Button from '$lib/Button.svelte'\\n\\n  let name = generateName()\\n  let komi = 0.5\\n  let size = 19\\n  let color = 'white'\\n\\n  const createGame = (e) => {\\n    e.preventDefault()\\n    console.log('new game!')\\n    goto(\`/\${name}\`)\\n  }\\n</script>\\n\\n<form\\n  on:submit={createGame}>\\n  <label>\\n    Room\\n    <input type=\\"text\\" bind:value={name}  >\\n  </label>\\n\\n  <label>\\n    Komi\\n    <select bind:value={komi}>\\n      <option value=0>\\n        No Komi\\n      </option>\\n      <option value=0.5>\\n        1/2\\n      </option>\\n      <option value=1.5>\\n        1 1/2\\n      </option>\\n      <option value=2.5>\\n        2 1/2\\n      </option>\\n      <option value=3.5>\\n        3 1/2\\n      </option>\\n      <option value=4.5>\\n        4 1/2\\n      </option>\\n    </select>\\n  </label>\\n\\n  <label>\\n    Size\\n    <select bind:value={size}>\\n      <option value=\\"9\\">\\n        9x9\\n      </option>\\n      <option value=\\"13\\">\\n        13x13\\n      </option>\\n      <option selected value=\\"19\\">\\n        19x19\\n      </option>\\n    </select>\\n  </label>\\n\\n  <label>\\n    Color\\n    <select bind:value={color}>\\n      <option value=\\"white\\">\\n        White\\n      </option>\\n      <option value=\\"black\\">\\n        Black\\n      </option>\\n    </select>\\n  </label>\\n\\n  <div class=\\"submit\\">\\n    <Button\\n      large={true}>\\n      Create Game\\n    </Button>\\n  </div>\\n</form>\\n\\n<style>\\n  form {\\n    max-width: max-content;\\n    margin: auto;\\n    border-top: 2px solid var(--color-figure);\\n  }\\n  label {\\n    padding: calc(var(--u-2p) + var(--u-3p)) 0;\\n    border-bottom: 2px solid var(--color-figure);\\n    display: grid;\\n    grid-template-columns: 1fr 1fr;\\n    font-family: \\"Input\\";\\n    align-items: center;\\n  }\\n  input,\\n  select {\\n    margin-bottom: 0;\\n  }\\n\\n  .submit {\\n    text-align: right;\\n    margin-top: 1rem;\\n  }\\n</style>"],"names":[],"mappings":"AAoFE,IAAI,cAAC,CAAC,AACJ,SAAS,CAAE,WAAW,CACtB,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,cAAc,CAAC,AAC3C,CAAC,AACD,KAAK,cAAC,CAAC,AACL,OAAO,CAAE,KAAK,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,IAAI,MAAM,CAAC,CAAC,CAAC,CAAC,CAC1C,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,cAAc,CAAC,CAC5C,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,GAAG,CAAC,GAAG,CAC9B,WAAW,CAAE,OAAO,CACpB,WAAW,CAAE,MAAM,AACrB,CAAC,AACD,mBAAK,CACL,MAAM,cAAC,CAAC,AACN,aAAa,CAAE,CAAC,AAClB,CAAC,AAED,OAAO,cAAC,CAAC,AACP,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,IAAI,AAClB,CAAC"}`
};
const New = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let name = generateName();
  let komi = 0.5;
  let size = 19;
  let color = "white";
  $$result.css.add(css$7);
  return `<form class="${"svelte-m0bn0e"}"><label class="${"svelte-m0bn0e"}">Room
    <input type="${"text"}" class="${"svelte-m0bn0e"}"${add_attribute("value", name, 1)}></label>

  <label class="${"svelte-m0bn0e"}">Komi
    <select class="${"svelte-m0bn0e"}"${add_attribute("value", komi, 1)}><option value="${"0"}">No Komi
      </option><option value="${"0.5"}">1/2
      </option><option value="${"1.5"}">1 1/2
      </option><option value="${"2.5"}">2 1/2
      </option><option value="${"3.5"}">3 1/2
      </option><option value="${"4.5"}">4 1/2
      </option></select></label>

  <label class="${"svelte-m0bn0e"}">Size
    <select class="${"svelte-m0bn0e"}"${add_attribute("value", size, 1)}><option value="${"9"}">9x9
      </option><option value="${"13"}">13x13
      </option><option selected value="${"19"}">19x19
      </option></select></label>

  <label class="${"svelte-m0bn0e"}">Color
    <select class="${"svelte-m0bn0e"}"${add_attribute("value", color, 1)}><option value="${"white"}">White
      </option><option value="${"black"}">Black
      </option></select></label>

  <div class="${"submit svelte-m0bn0e"}">${validate_component(Button, "Button").$$render($$result, {large: true}, {}, {
    default: () => `Create Game
    `
  })}</div>
</form>`;
});
var _new = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: New
});
const Goban = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `a board`;
});
var _slug__svelte = ".container.svelte-15ib6o2{display:flex;flex-wrap:wrap}.meta.svelte-15ib6o2{flex-grow:2;flex-basis:200px;padding-left:2rem;padding-right:2rem}.board.svelte-15ib6o2{flex-basis:750px;flex-grow:1}";
const css$6 = {
  code: ".container.svelte-15ib6o2{display:flex;flex-wrap:wrap}.meta.svelte-15ib6o2{flex-grow:2;flex-basis:200px;padding-left:2rem;padding-right:2rem}.board.svelte-15ib6o2{flex-basis:750px;flex-grow:1}",
  map: `{"version":3,"file":"[slug].svelte","sources":["[slug].svelte"],"sourcesContent":["<script>\\n  import Goban from '$lib/Goban.svelte'\\n</script>\\n\\n<div class=\\"container\\">\\n  <div class=\\"meta\\">\\n    <h2>A Game</h2>\\n  </div>\\n  <div class=\\"board\\">\\n    <Goban />\\n  </div>\\n</div>\\n\\n<style>\\n  .container {\\n    display: flex;\\n    flex-wrap: wrap;\\n  }\\n  .meta {\\n    flex-grow: 2;\\n    flex-basis: 200px;\\n    padding-left: 2rem;\\n    padding-right: 2rem;\\n  }\\n  .board {\\n    flex-basis: 750px;\\n    flex-grow: 1;\\n  }\\n</style>"],"names":[],"mappings":"AAcE,UAAU,eAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,IAAI,AACjB,CAAC,AACD,KAAK,eAAC,CAAC,AACL,SAAS,CAAE,CAAC,CACZ,UAAU,CAAE,KAAK,CACjB,YAAY,CAAE,IAAI,CAClB,aAAa,CAAE,IAAI,AACrB,CAAC,AACD,MAAM,eAAC,CAAC,AACN,UAAU,CAAE,KAAK,CACjB,SAAS,CAAE,CAAC,AACd,CAAC"}`
};
const U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$6);
  return `<div class="${"container svelte-15ib6o2"}"><div class="${"meta svelte-15ib6o2"}"><h2>A Game</h2></div>
  <div class="${"board svelte-15ib6o2"}">${validate_component(Goban, "Goban").$$render($$result, {}, {}, {})}</div>
</div>`;
});
var _slug_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: U5Bslugu5D
});
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var Blob_svelte = '.blob.svelte-1tmw5hv{position:relative;display:inline-block;margin:var(--u-1p);height:var(--s-18);width:var(--s-18);background-color:var(--color-black);border-radius:100%}.white.svelte-1tmw5hv{background-color:var(--color-white)}.small.svelte-1tmw5hv{height:var(--s-10);width:var(--s-10)}.large.svelte-1tmw5hv{height:var(--s-36);width:var(--s-36)}.animate.svelte-1tmw5hv{filter:url("#goo")}.blobber.svelte-1tmw5hv{width:60%;height:60%;left:20%;top:20%;background-color:inherit;border-radius:100%;display:inline-block;position:absolute;transition-timing-function:linear}.defs.svelte-1tmw5hv{height:0}';
const css$5 = {
  code: '.blob.svelte-1tmw5hv{position:relative;display:inline-block;margin:var(--u-1p);height:var(--s-18);width:var(--s-18);background-color:var(--color-black);border-radius:100%}.white.svelte-1tmw5hv{background-color:var(--color-white)}.small.svelte-1tmw5hv{height:var(--s-10);width:var(--s-10)}.large.svelte-1tmw5hv{height:var(--s-36);width:var(--s-36)}.animate.svelte-1tmw5hv{filter:url("#goo")}.blobber.svelte-1tmw5hv{width:60%;height:60%;left:20%;top:20%;background-color:inherit;border-radius:100%;display:inline-block;position:absolute;transition-timing-function:linear}.defs.svelte-1tmw5hv{height:0}',
  map: `{"version":3,"file":"Blob.svelte","sources":["Blob.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte'\\n  export let color = 'black'\\n  export let size = 'medium'\\n  export let animate = false\\n  export let count = 8\\n  export let drift = 40\\n  export let deform = 80\\n  export let speed = 3000\\n\\n  let blob\\n\\n  const blobbers = new Array(count)\\n\\n  const getRando = () => Math.floor(Math.random() * (drift * 2)) - drift\\n  const animateBlobbers = (blobbers) => {\\n    blobbers.forEach(blobber => {\\n      blobber.style.transform = \`translate3d(\${getRando()}%, \${getRando()}%, 0)\`;\\n    })\\n    setTimeout(function() {\\n      animateBlobbers(blobbers)\\n    }, speed)\\n  }\\n  onMount(() => {\\n    if (animate) {\\n      let blobbers = [...blob.querySelectorAll('.blobber')]\\n      blobbers.forEach(blobber => {\\n        blobber.style.height = \`\${deform}%\`\\n        blobber.style.width = \`\${deform}%\`\\n        blobber.style.top = \`\${(100 - deform) / 2}%\`\\n        blobber.style.right = \`\${(100 - deform) / 2}%\`\\n        blobber.style.transitionDuration = \`\${speed}ms\`;\\n      })\\n      animateBlobbers(blobbers)\\n    }\\n  })\\n</script>\\n\\n<style>\\n  .blob {\\n    position: relative;\\n    display: inline-block;\\n    margin: var(--u-1p);\\n    height: var(--s-18);\\n    width: var(--s-18);\\n    background-color: var(--color-black);\\n    border-radius: 100%;\\n  }\\n\\n  .white {\\n    background-color: var(--color-white);\\n  }\\n\\n  .small {\\n    height: var(--s-10);\\n    width: var(--s-10);\\n  }\\n\\n  .large {\\n    height: var(--s-36);\\n    width: var(--s-36);\\n  }\\n\\n  .animate {\\n    filter: url(\\"#goo\\");\\n  }\\n\\n  .blobber {\\n    width: 60%;\\n    height: 60%;\\n    left: 20%;\\n    top: 20%;\\n    background-color: inherit;\\n    border-radius: 100%;\\n    display: inline-block;\\n    position: absolute;\\n    transition-timing-function: linear;\\n  }\\n  .defs {\\n    height: 0;\\n  }\\n</style>\\n\\n<svg\\n  class=\\"defs\\"\\n  xmlns=\\"http://www.w3.org/2000/svg\\" version=\\"1.1\\">\\n  <defs>\\n    <filter id=\\"goo\\">\\n      <feGaussianBlur in=\\"SourceGraphic\\" stdDeviation=\\"10\\" result=\\"blur\\" />\\n      <feColorMatrix in=\\"blur\\" mode=\\"matrix\\" values=\\"1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7\\" result=\\"goo\\" />\\n      <feComposite in=\\"SourceGraphic\\" in2=\\"goo\\" operator=\\"mix\\"/>\\n    </filter>\\n  </defs>\\n</svg>\\n\\n<div\\n  bind:this={blob}\\n  class={\`\\n    blob\\n    \${color == 'white' ? 'white' : 'black'}\\n    \${size == 'small' ? 'small' : ''}\\n    \${size == 'large' ? 'large' : ''}\\n    \${animate ? 'animate' : ''}\\n  \`}\\n>\\n  {#if animate}\\n    {#each blobbers as blobber, index (index)}\\n      <div\\n        class=\\"blobber\\">\\n      </div>\\n    {/each}\\n  {/if}\\n</div>"],"names":[],"mappings":"AAuCE,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,MAAM,CAAE,IAAI,MAAM,CAAC,CACnB,MAAM,CAAE,IAAI,MAAM,CAAC,CACnB,KAAK,CAAE,IAAI,MAAM,CAAC,CAClB,gBAAgB,CAAE,IAAI,aAAa,CAAC,CACpC,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,MAAM,eAAC,CAAC,AACN,gBAAgB,CAAE,IAAI,aAAa,CAAC,AACtC,CAAC,AAED,MAAM,eAAC,CAAC,AACN,MAAM,CAAE,IAAI,MAAM,CAAC,CACnB,KAAK,CAAE,IAAI,MAAM,CAAC,AACpB,CAAC,AAED,MAAM,eAAC,CAAC,AACN,MAAM,CAAE,IAAI,MAAM,CAAC,CACnB,KAAK,CAAE,IAAI,MAAM,CAAC,AACpB,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,MAAM,CAAE,IAAI,MAAM,CAAC,AACrB,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,GAAG,CACT,GAAG,CAAE,GAAG,CACR,gBAAgB,CAAE,OAAO,CACzB,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,YAAY,CACrB,QAAQ,CAAE,QAAQ,CAClB,0BAA0B,CAAE,MAAM,AACpC,CAAC,AACD,KAAK,eAAC,CAAC,AACL,MAAM,CAAE,CAAC,AACX,CAAC"}`
};
const Blob = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {color = "black"} = $$props;
  let {size = "medium"} = $$props;
  let {animate = false} = $$props;
  let {count = 8} = $$props;
  let {drift = 40} = $$props;
  let {deform = 80} = $$props;
  let {speed = 3e3} = $$props;
  let blob;
  const blobbers = new Array(count);
  const getRando = () => Math.floor(Math.random() * (drift * 2)) - drift;
  const animateBlobbers = (blobbers2) => {
    blobbers2.forEach((blobber) => {
      blobber.style.transform = `translate3d(${getRando()}%, ${getRando()}%, 0)`;
    });
    setTimeout(function() {
      animateBlobbers(blobbers2);
    }, speed);
  };
  onMount(() => {
    if (animate) {
      let blobbers2 = [...blob.querySelectorAll(".blobber")];
      blobbers2.forEach((blobber) => {
        blobber.style.height = `${deform}%`;
        blobber.style.width = `${deform}%`;
        blobber.style.top = `${(100 - deform) / 2}%`;
        blobber.style.right = `${(100 - deform) / 2}%`;
        blobber.style.transitionDuration = `${speed}ms`;
      });
      animateBlobbers(blobbers2);
    }
  });
  if ($$props.color === void 0 && $$bindings.color && color !== void 0)
    $$bindings.color(color);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0)
    $$bindings.size(size);
  if ($$props.animate === void 0 && $$bindings.animate && animate !== void 0)
    $$bindings.animate(animate);
  if ($$props.count === void 0 && $$bindings.count && count !== void 0)
    $$bindings.count(count);
  if ($$props.drift === void 0 && $$bindings.drift && drift !== void 0)
    $$bindings.drift(drift);
  if ($$props.deform === void 0 && $$bindings.deform && deform !== void 0)
    $$bindings.deform(deform);
  if ($$props.speed === void 0 && $$bindings.speed && speed !== void 0)
    $$bindings.speed(speed);
  $$result.css.add(css$5);
  return `<svg class="${"defs svelte-1tmw5hv"}" xmlns="${"http://www.w3.org/2000/svg"}" version="${"1.1"}"><defs><filter id="${"goo"}"><feGaussianBlur in="${"SourceGraphic"}" stdDeviation="${"10"}" result="${"blur"}"></feGaussianBlur><feColorMatrix in="${"blur"}" mode="${"matrix"}" values="${"1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7"}" result="${"goo"}"></feColorMatrix><feComposite in="${"SourceGraphic"}" in2="${"goo"}" operator="${"mix"}"></feComposite></filter></defs></svg>

<div class="${escape$1(null_to_empty(`
    blob
    ${color == "white" ? "white" : "black"}
    ${size == "small" ? "small" : ""}
    ${size == "large" ? "large" : ""}
    ${animate ? "animate" : ""}
  `)) + " svelte-1tmw5hv"}"${add_attribute("this", blob, 1)}>${animate ? `${each(blobbers, (blobber, index2) => `<div class="${"blobber svelte-1tmw5hv"}"></div>`)}` : ``}</div>`;
});
var Logo_svelte = "@keyframes svelte-18rm9tf-orbitBlack{0%{transform:translate3d(0%,0,0);z-index:1}50%{transform:translate3d(150%,0,0);z-index:1}51%{z-index:2}100%{transform:translate3d(0%,0,0);z-index:2}}@keyframes svelte-18rm9tf-orbitWhite{0%{transform:translate3d(0%,0,0);z-index:2}33%{z-index:1}50%{transform:translate3d(-150%,0,0);z-index:1}100%{transform:translate3d(0%,0,0);z-index:1}}.logo.svelte-18rm9tf{display:flex;width:8rem;justify-content:space-between}.black.svelte-18rm9tf{width:40%;animation:svelte-18rm9tf-orbitBlack 4.5s infinite;animation-timing-function:ease-in-out}.white.svelte-18rm9tf{width:40%;animation:svelte-18rm9tf-orbitWhite 4.5s infinite;animation-timing-function:ease-in-out}";
const css$4 = {
  code: "@keyframes svelte-18rm9tf-orbitBlack{0%{transform:translate3d(0%,0,0);z-index:1}50%{transform:translate3d(150%,0,0);z-index:1}51%{z-index:2}100%{transform:translate3d(0%,0,0);z-index:2}}@keyframes svelte-18rm9tf-orbitWhite{0%{transform:translate3d(0%,0,0);z-index:2}33%{z-index:1}50%{transform:translate3d(-150%,0,0);z-index:1}100%{transform:translate3d(0%,0,0);z-index:1}}.logo.svelte-18rm9tf{display:flex;width:8rem;justify-content:space-between}.black.svelte-18rm9tf{width:40%;animation:svelte-18rm9tf-orbitBlack 4.5s infinite;animation-timing-function:ease-in-out}.white.svelte-18rm9tf{width:40%;animation:svelte-18rm9tf-orbitWhite 4.5s infinite;animation-timing-function:ease-in-out}",
  map: `{"version":3,"file":"Logo.svelte","sources":["Logo.svelte"],"sourcesContent":["<script>\\n  import Blob from './Blob.svelte'\\n\\n  export let small = false\\n\\n  let size = small ? 'small' : 'large'\\n</script>\\n\\n<style>\\n   @keyframes orbitBlack {\\n    0% {\\n      transform: translate3d(0%,0,0);\\n      z-index: 1;\\n    }\\n    50% {\\n      transform: translate3d(150%,0,0);\\n      z-index: 1;\\n    }\\n    51% {\\n      z-index: 2;\\n    }\\n    100% {\\n      transform: translate3d(0%,0,0);\\n      z-index: 2;\\n    }\\n  }\\n   @keyframes orbitWhite {\\n    0% {\\n      transform: translate3d(0%,0,0);\\n      z-index: 2;\\n    }\\n    33% {\\n      z-index: 1;\\n    }\\n    50% {\\n      transform: translate3d(-150%,0,0);\\n      z-index: 1;\\n    }\\n    100% {\\n      transform: translate3d(0%,0,0);\\n      z-index: 1;\\n    }\\n  }\\n\\n  .logo {\\n    display: flex;\\n    width: 8rem;\\n    justify-content: space-between;\\n  }\\n  .black {\\n    width: 40%;\\n    animation: orbitBlack 4.5s infinite;\\n    animation-timing-function: ease-in-out;\\n  }\\n  .white {\\n    width: 40%;\\n    animation: orbitWhite 4.5s infinite;\\n    animation-timing-function: ease-in-out;\\n  }\\n</style>\\n\\n<div class=\\"logo\\">\\n  <div class=\\"black\\">\\n    <Blob animate={true} size={size} />\\n  </div>\\n  <div class=\\"white\\">\\n    <Blob animate={true} size={size} color=\\"white\\"/>\\n  </div>\\n</div>"],"names":[],"mappings":"AASG,WAAW,yBAAW,CAAC,AACtB,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,YAAY,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9B,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,SAAS,CAAE,YAAY,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAChC,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,YAAY,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9B,OAAO,CAAE,CAAC,AACZ,CAAC,AACH,CAAC,AACA,WAAW,yBAAW,CAAC,AACtB,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,YAAY,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9B,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,SAAS,CAAE,YAAY,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CACjC,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,YAAY,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAC9B,OAAO,CAAE,CAAC,AACZ,CAAC,AACH,CAAC,AAED,KAAK,eAAC,CAAC,AACL,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,eAAe,CAAE,aAAa,AAChC,CAAC,AACD,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,GAAG,CACV,SAAS,CAAE,yBAAU,CAAC,IAAI,CAAC,QAAQ,CACnC,yBAAyB,CAAE,WAAW,AACxC,CAAC,AACD,MAAM,eAAC,CAAC,AACN,KAAK,CAAE,GAAG,CACV,SAAS,CAAE,yBAAU,CAAC,IAAI,CAAC,QAAQ,CACnC,yBAAyB,CAAE,WAAW,AACxC,CAAC"}`
};
const Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {small = false} = $$props;
  let size = small ? "small" : "large";
  if ($$props.small === void 0 && $$bindings.small && small !== void 0)
    $$bindings.small(small);
  $$result.css.add(css$4);
  return `<div class="${"logo svelte-18rm9tf"}"><div class="${"black svelte-18rm9tf"}">${validate_component(Blob, "Blob").$$render($$result, {animate: true, size}, {}, {})}</div>
  <div class="${"white svelte-18rm9tf"}">${validate_component(Blob, "Blob").$$render($$result, {animate: true, size, color: "white"}, {}, {})}</div></div>`;
});
var Lockup_svelte = ".lockup.svelte-fphljd{display:inline-block;text-align:center;font-weight:700;margin-bottom:1rem}.small.svelte-fphljd{font-size:var(--s-12);display:flex}.large.svelte-fphljd{margin:0;padding-top:1rem;font-size:var(--s-36);line-height:0.8}";
const css$3 = {
  code: ".lockup.svelte-fphljd{display:inline-block;text-align:center;font-weight:700;margin-bottom:1rem}.small.svelte-fphljd{font-size:var(--s-12);display:flex}.large.svelte-fphljd{margin:0;padding-top:1rem;font-size:var(--s-36);line-height:0.8}",
  map: `{"version":3,"file":"Lockup.svelte","sources":["Lockup.svelte"],"sourcesContent":["<script>\\n  import Logo from './Logo.svelte'\\n  export let small\\n  export let stacked\\n</script>\\n\\n<style>\\n  .lockup {\\n    display: inline-block;\\n    text-align: center;\\n    font-weight: 700;\\n    margin-bottom: 1rem;\\n  }\\n  .small {\\n    font-size: var(--s-12);\\n    display: flex;\\n  }\\n  .large {\\n    margin: 0;\\n    padding-top: 1rem;\\n    font-size: var(--s-36);\\n    line-height: 0.8;\\n  }\\n</style>\\n\\n<div class=\\"lockup\\">\\n  {#if stacked}\\n    <Logo />\\n  {/if}\\n  <p class={small ? 'small' : 'large'}>\\n    Joseki {#if stacked}<br>{/if}Party\\n  </p>\\n</div>\\n"],"names":[],"mappings":"AAOE,OAAO,cAAC,CAAC,AACP,OAAO,CAAE,YAAY,CACrB,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,GAAG,CAChB,aAAa,CAAE,IAAI,AACrB,CAAC,AACD,MAAM,cAAC,CAAC,AACN,SAAS,CAAE,IAAI,MAAM,CAAC,CACtB,OAAO,CAAE,IAAI,AACf,CAAC,AACD,MAAM,cAAC,CAAC,AACN,MAAM,CAAE,CAAC,CACT,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,IAAI,MAAM,CAAC,CACtB,WAAW,CAAE,GAAG,AAClB,CAAC"}`
};
const Lockup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {small} = $$props;
  let {stacked} = $$props;
  if ($$props.small === void 0 && $$bindings.small && small !== void 0)
    $$bindings.small(small);
  if ($$props.stacked === void 0 && $$bindings.stacked && stacked !== void 0)
    $$bindings.stacked(stacked);
  $$result.css.add(css$3);
  return `<div class="${"lockup svelte-fphljd"}">${stacked ? `${validate_component(Logo, "Logo").$$render($$result, {}, {}, {})}` : ``}
  <p class="${escape$1(null_to_empty(small ? "small" : "large")) + " svelte-fphljd"}">Joseki ${stacked ? `<br>` : ``}Party
  </p></div>`;
});
var HomeNav_svelte = ".home.svelte-zzsx1y{display:grid;align-items:center;height:100%}nav.svelte-zzsx1y{display:flex;flex-direction:column;align-items:center;width:9rem;margin:auto;padding-bottom:4rem}";
const css$2 = {
  code: ".home.svelte-zzsx1y{display:grid;align-items:center;height:100%}nav.svelte-zzsx1y{display:flex;flex-direction:column;align-items:center;width:9rem;margin:auto;padding-bottom:4rem}",
  map: `{"version":3,"file":"HomeNav.svelte","sources":["HomeNav.svelte"],"sourcesContent":["<script>\\n  import Button from './Button.svelte'\\n  import Lockup from './Lockup.svelte'\\n</script>\\n\\n<div class=\\"home\\">\\n  <nav>\\n    <Lockup stacked={true}/>\\n    <Button\\n      href=\\"/new\\">\\n      New Game\\n    </Button>\\n  </nav>\\n</div>\\n\\n<style>\\n  .home {\\n    display: grid;\\n    align-items: center;\\n    height: 100%;\\n  }\\n  nav {\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    width: 9rem;\\n    margin: auto;\\n    padding-bottom: 4rem;\\n  }\\n\\n</style>"],"names":[],"mappings":"AAgBE,KAAK,cAAC,CAAC,AACL,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,IAAI,AACd,CAAC,AACD,GAAG,cAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,cAAc,CAAE,IAAI,AACtB,CAAC"}`
};
const HomeNav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `<div class="${"home svelte-zzsx1y"}"><nav class="${"svelte-zzsx1y"}">${validate_component(Lockup, "Lockup").$$render($$result, {stacked: true}, {}, {})}
    ${validate_component(Button, "Button").$$render($$result, {href: "/new"}, {}, {
    default: () => `New Game
    `
  })}</nav>
</div>`;
});
var Nav_svelte = "nav.svelte-1irrrgu{display:flex;align-items:center;justify-content:space-between;max-width:100%;padding-left:2rem;padding-right:2rem;margin:auto}.actions.svelte-1irrrgu{margin-bottom:1rem}";
const css$1 = {
  code: "nav.svelte-1irrrgu{display:flex;align-items:center;justify-content:space-between;max-width:100%;padding-left:2rem;padding-right:2rem;margin:auto}.actions.svelte-1irrrgu{margin-bottom:1rem}",
  map: `{"version":3,"file":"Nav.svelte","sources":["Nav.svelte"],"sourcesContent":["<script>\\n  import { page } from '$app/stores';\\n\\n  import Button from './Button.svelte'\\n  import Lockup from './Lockup.svelte'\\n</script>\\n\\n<nav>\\n  <a href=\\"/\\">\\n    <Lockup stacked={false} small={true}/>\\n  </a>\\n  <div class=\\"actions\\">\\n    {#if $page === '/'}\\n      <Button\\n        href=\\"/new\\">\\n        New Game\\n      </Button>\\n    {/if}\\n    <Button>\\n      \u25D0\\n    </Button>\\n  </div>\\n\\n</nav>\\n\\n<style>\\n  nav {\\n    display: flex;\\n    align-items: center;\\n    justify-content: space-between;\\n    max-width: 100%;\\n    padding-left: 2rem;\\n    padding-right: 2rem;\\n    margin: auto;\\n  }\\n\\n  .actions {\\n    margin-bottom: 1rem;\\n  }\\n</style>"],"names":[],"mappings":"AA0BE,GAAG,eAAC,CAAC,AACH,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,CAC9B,SAAS,CAAE,IAAI,CACf,YAAY,CAAE,IAAI,CAClB,aAAa,CAAE,IAAI,CACnB,MAAM,CAAE,IAAI,AACd,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,aAAa,CAAE,IAAI,AACrB,CAAC"}`
};
const Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe$1(page, (value) => $page = value);
  $$result.css.add(css$1);
  $$unsubscribe_page();
  return `<nav class="${"svelte-1irrrgu"}"><a href="${"/"}">${validate_component(Lockup, "Lockup").$$render($$result, {stacked: false, small: true}, {}, {})}</a>
  <div class="${"actions svelte-1irrrgu"}">${$page === "/" ? `${validate_component(Button, "Button").$$render($$result, {href: "/new"}, {}, {
    default: () => `New Game
      `
  })}` : ``}
    ${validate_component(Button, "Button").$$render($$result, {}, {}, {
    default: () => `\u25D0
    `
  })}</div>

</nav>`;
});
var app = `:root {
  /* 1rem = 1p = 12pt*/
  /* leads */
  --u-1p: 0.083rem;
  --u-2p: 0.166rem;
  --u-3p: 0.25rem;
  --u-6p: 0.5rem;

  /* type sizes*/
  --s-8:  0.666rem;
  --s-10: 0.833rem;
  --s-12: 1rem;
  --s-14: 1.166rem;
  --s-18: 1.5rem;
  --s-20: 1.666rem;
  --s-24: 2rem;
  --s-28: 2.333rem;
  --s-36: 3rem;
  --color-figure: #512f1e;
  --color-ground: #bfbebc;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
};

@font-face {
  font-family: "Rza-Trial";
  src: url("./fonts/Rza-Trial-Black.woff") format("woff");
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: "Rza-Trial";
  src: url("./fonts/Rza-Trial-Bold.woff") format("woff");
  font-weight: 600;
  font-style: normal;
}
@font-face {
  font-family: "Rza-Trial";
  src: url("./fonts/Rza-Trial-Semibold.woff") format("woff");
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: "Rza-Trial";
  src: url("./fonts/Rza-Trial-Medium.woff") format("woff");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "Rza-Trial";
  src: url("./fonts/Rza-Trial-Regular.woff") format("woff");
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: "Rza-Trial";
  src: url("./fonts/Rza-Trial-Light.woff") format("woff");
  font-weight: 200;
  font-style: normal;
}


@font-face {
  font-family:"Input";
  font-display: swap;
  src: url("./fonts/Input-Regular.woff2") format("woff2"),
       url("./fonts/Input-Regular.woff") format("woff");
  font-weight: 500;
  font-style: normal;
}

/* Themes
| name    | figure  | ground  | black   | white   | Accent  |
|:--------|:--------|:--------|:--------|:--------|:--------|
| Default | #512f1e | #bfbebc |         |         |         |
| Blue    | #001d60 | #41bcbe |         |         |         |
| Orange  | #fd6e31 | #efc7c0 |         |         |         |
| Green   | #1a1819 | #bec991 |         |         |         |
| IKB     | #181c22 | #1500fe |         |         |         |
| Classic | #dccaff | #701eff | #491363 | #ffcbd3 |         |
| Neutral | #0b0b0b | #cccccc | #333333 | #eeeeee |         |
| Night   |         |         |         |         |         |
*/

:root {

}

.theme-default {
  --color-figure: #512f1e;
  --color-ground: #bfbebc;
  --color-black:  #1a1a1b;
  --color-white:  #fefefe;
}

.theme-blue {
  --color-figure: #001d60;
  --color-ground: #41bcbe;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}

.theme-orange {
  --color-figure: #fd6e31;
  --color-ground: #efc7c0;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}
.theme-green {
  --color-figure: #1a1819;
  --color-ground: #bec991;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}
.theme-ikb {
  --color-figure: #181c22;
  --color-ground: #1500fe;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}
.theme-classic {
  --color-figure: #dccaff;
  --color-ground: #701eff;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}
.theme-neutral {
  --color-figure: #0b0b0b;
  --color-ground: #cccccc;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}
.theme-night {
  --color-figure: #512f1e;
  --color-ground: #bfbebc;
  --color-black:  #1a1a1b;
  --color-white:  #bfbebc;
}

html, body {
  position: relative;
  width: 100%;
  height: 100%;
}

body {
  background-color: var(--color-ground);
  color: var(--color-figure);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Rza-Trial';
  font-weight: 300;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Rza-Trial';
  font-weight: 700;
}

pre,
code {
  font-family: 'Input';
}

label {
  display: block;
}

input, button, select, textarea {
  font-family: inherit;
  font-size: inherit;
  -webkit-padding: 0.4em 0;
  padding: 0.4em;
  margin: 0 0 0.5em 0;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 2px;
}

input:disabled {
  color: #ccc;
}

button {
  background-color: #333;
  color: #f4f4f4;
  outline: none;
}

button:disabled {
  color: #999;
}

button:not(:disabled):active {
  background-color: #ddd;
}

button:focus {
  border-color: #666;
}
`;
const create$4 = () => new Map();
const copy = (m) => {
  const r = create$4();
  m.forEach((v, k) => {
    r.set(k, v);
  });
  return r;
};
const setIfUndefined = (map2, key, createT) => {
  let set = map2.get(key);
  if (set === void 0) {
    map2.set(key, set = createT());
  }
  return set;
};
const map = (m, f) => {
  const res = [];
  for (const [key, value] of m) {
    res.push(f(value, key));
  }
  return res;
};
const any = (m, f) => {
  for (const [key, value] of m) {
    if (f(value, key)) {
      return true;
    }
  }
  return false;
};
const create$3 = () => new Set();
const last = (arr) => arr[arr.length - 1];
const appendTo = (dest, src2) => {
  for (let i = 0; i < src2.length; i++) {
    dest.push(src2[i]);
  }
};
const from = Array.from;
class Observable {
  constructor() {
    this._observers = create$4();
  }
  on(name, f) {
    setIfUndefined(this._observers, name, create$3).add(f);
  }
  once(name, f) {
    const _f = (...args) => {
      this.off(name, _f);
      f(...args);
    };
    this.on(name, _f);
  }
  off(name, f) {
    const observers = this._observers.get(name);
    if (observers !== void 0) {
      observers.delete(f);
      if (observers.size === 0) {
        this._observers.delete(name);
      }
    }
  }
  emit(name, args) {
    return from((this._observers.get(name) || create$4()).values()).forEach((f) => f(...args));
  }
  destroy() {
    this._observers = create$4();
  }
}
const floor = Math.floor;
const abs = Math.abs;
const log10 = Math.log10;
const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;
const isNegativeZero = (n) => n !== 0 ? n < 0 : 1 / n < 0;
const fromCharCode = String.fromCharCode;
const toLowerCase = (s2) => s2.toLowerCase();
const trimLeftRegex = /^\s*/g;
const trimLeft = (s2) => s2.replace(trimLeftRegex, "");
const fromCamelCaseRegex = /([A-Z])/g;
const fromCamelCase = (s2, separator) => trimLeft(s2.replace(fromCamelCaseRegex, (match) => `${separator}${toLowerCase(match)}`));
const _encodeUtf8Polyfill = (str) => {
  const encodedString = unescape(encodeURIComponent(str));
  const len = encodedString.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = encodedString.codePointAt(i);
  }
  return buf;
};
const utf8TextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
const _encodeUtf8Native = (str) => utf8TextEncoder.encode(str);
const encodeUtf8 = utf8TextEncoder ? _encodeUtf8Native : _encodeUtf8Polyfill;
let utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8", {fatal: true, ignoreBOM: true});
if (utf8TextDecoder && utf8TextDecoder.decode(new Uint8Array()).length === 1) {
  utf8TextDecoder = null;
}
const undefinedToNull = (v) => v === void 0 ? null : v;
class VarStoragePolyfill {
  constructor() {
    this.map = new Map();
  }
  setItem(key, newValue) {
    this.map.set(key, newValue);
  }
  getItem(key) {
    return this.map.get(key);
  }
}
let _localStorage = new VarStoragePolyfill();
let usePolyfill = true;
try {
  if (typeof localStorage !== "undefined") {
    _localStorage = localStorage;
    usePolyfill = false;
  }
} catch (e) {
}
const varStorage = _localStorage;
const onChange = (eventHandler) => usePolyfill || addEventListener("storage", eventHandler);
const isNode = typeof process !== "undefined" && process.release && /node|io\.js/.test(process.release.name);
const isBrowser = typeof window !== "undefined" && !isNode;
typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
let params;
const computeParams = () => {
  if (params === void 0) {
    if (isNode) {
      params = create$4();
      const pargs = process.argv;
      let currParamName = null;
      for (let i = 0; i < pargs.length; i++) {
        const parg = pargs[i];
        if (parg[0] === "-") {
          if (currParamName !== null) {
            params.set(currParamName, "");
          }
          currParamName = parg;
        } else {
          if (currParamName !== null) {
            params.set(currParamName, parg);
            currParamName = null;
          }
        }
      }
      if (currParamName !== null) {
        params.set(currParamName, "");
      }
    } else if (typeof location === "object") {
      params = create$4();
      (location.search || "?").slice(1).split("&").forEach((kv) => {
        if (kv.length !== 0) {
          const [key, value] = kv.split("=");
          params.set(`--${fromCamelCase(key, "-")}`, value);
          params.set(`-${fromCamelCase(key, "-")}`, value);
        }
      });
    } else {
      params = create$4();
    }
  }
  return params;
};
const hasParam = (name) => computeParams().has(name);
const getVariable = (name) => isNode ? undefinedToNull(process.env[name.toUpperCase()]) : undefinedToNull(varStorage.getItem(name));
const hasConf = (name) => hasParam("--" + name) || getVariable(name) !== null;
hasConf("production");
const BIT1 = 1;
const BIT2 = 2;
const BIT3 = 4;
const BIT4 = 8;
const BIT6 = 32;
const BIT7 = 64;
const BIT8 = 128;
const BITS5 = 31;
const BITS6 = 63;
const BITS7 = 127;
const BITS31 = 2147483647;
class Decoder {
  constructor(uint8Array) {
    this.arr = uint8Array;
    this.pos = 0;
  }
}
const createDecoder = (uint8Array) => new Decoder(uint8Array);
const hasContent = (decoder) => decoder.pos !== decoder.arr.length;
const readUint8Array = (decoder, len) => {
  const view = createUint8ArrayViewFromArrayBuffer(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
  decoder.pos += len;
  return view;
};
const readVarUint8Array = (decoder) => readUint8Array(decoder, readVarUint(decoder));
const readUint8 = (decoder) => decoder.arr[decoder.pos++];
const readVarUint = (decoder) => {
  let num = 0;
  let len = 0;
  while (true) {
    const r = decoder.arr[decoder.pos++];
    num = num | (r & BITS7) << len;
    len += 7;
    if (r < BIT8) {
      return num >>> 0;
    }
    if (len > 35) {
      throw new Error("Integer out of range!");
    }
  }
};
const readVarInt = (decoder) => {
  let r = decoder.arr[decoder.pos++];
  let num = r & BITS6;
  let len = 6;
  const sign = (r & BIT7) > 0 ? -1 : 1;
  if ((r & BIT8) === 0) {
    return sign * num;
  }
  while (true) {
    r = decoder.arr[decoder.pos++];
    num = num | (r & BITS7) << len;
    len += 7;
    if (r < BIT8) {
      return sign * (num >>> 0);
    }
    if (len > 41) {
      throw new Error("Integer out of range!");
    }
  }
};
const readVarString = (decoder) => {
  let remainingLen = readVarUint(decoder);
  if (remainingLen === 0) {
    return "";
  } else {
    let encodedString = String.fromCodePoint(readUint8(decoder));
    if (--remainingLen < 100) {
      while (remainingLen--) {
        encodedString += String.fromCodePoint(readUint8(decoder));
      }
    } else {
      while (remainingLen > 0) {
        const nextLen = remainingLen < 1e4 ? remainingLen : 1e4;
        const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
        decoder.pos += nextLen;
        encodedString += String.fromCodePoint.apply(null, bytes);
        remainingLen -= nextLen;
      }
    }
    return decodeURIComponent(escape(encodedString));
  }
};
const readFromDataView = (decoder, len) => {
  const dv = new DataView(decoder.arr.buffer, decoder.arr.byteOffset + decoder.pos, len);
  decoder.pos += len;
  return dv;
};
const readFloat32 = (decoder) => readFromDataView(decoder, 4).getFloat32(0, false);
const readFloat64 = (decoder) => readFromDataView(decoder, 8).getFloat64(0, false);
const readBigInt64 = (decoder) => readFromDataView(decoder, 8).getBigInt64(0, false);
const readAnyLookupTable = [
  (decoder) => void 0,
  (decoder) => null,
  readVarInt,
  readFloat32,
  readFloat64,
  readBigInt64,
  (decoder) => false,
  (decoder) => true,
  readVarString,
  (decoder) => {
    const len = readVarUint(decoder);
    const obj = {};
    for (let i = 0; i < len; i++) {
      const key = readVarString(decoder);
      obj[key] = readAny(decoder);
    }
    return obj;
  },
  (decoder) => {
    const len = readVarUint(decoder);
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(readAny(decoder));
    }
    return arr;
  },
  readVarUint8Array
];
const readAny = (decoder) => readAnyLookupTable[127 - readUint8(decoder)](decoder);
class RleDecoder extends Decoder {
  constructor(uint8Array, reader) {
    super(uint8Array);
    this.reader = reader;
    this.s = null;
    this.count = 0;
  }
  read() {
    if (this.count === 0) {
      this.s = this.reader(this);
      if (hasContent(this)) {
        this.count = readVarUint(this) + 1;
      } else {
        this.count = -1;
      }
    }
    this.count--;
    return this.s;
  }
}
class UintOptRleDecoder extends Decoder {
  constructor(uint8Array) {
    super(uint8Array);
    this.s = 0;
    this.count = 0;
  }
  read() {
    if (this.count === 0) {
      this.s = readVarInt(this);
      const isNegative = isNegativeZero(this.s);
      this.count = 1;
      if (isNegative) {
        this.s = -this.s;
        this.count = readVarUint(this) + 2;
      }
    }
    this.count--;
    return this.s;
  }
}
class IntDiffOptRleDecoder extends Decoder {
  constructor(uint8Array) {
    super(uint8Array);
    this.s = 0;
    this.count = 0;
    this.diff = 0;
  }
  read() {
    if (this.count === 0) {
      const diff = readVarInt(this);
      const hasCount = diff & 1;
      this.diff = diff >> 1;
      this.count = 1;
      if (hasCount) {
        this.count = readVarUint(this) + 2;
      }
    }
    this.s += this.diff;
    this.count--;
    return this.s;
  }
}
class StringDecoder {
  constructor(uint8Array) {
    this.decoder = new UintOptRleDecoder(uint8Array);
    this.str = readVarString(this.decoder);
    this.spos = 0;
  }
  read() {
    const end = this.spos + this.decoder.read();
    const res = this.str.slice(this.spos, end);
    this.spos = end;
    return res;
  }
}
const createUint8ArrayFromLen = (len) => new Uint8Array(len);
const createUint8ArrayViewFromArrayBuffer = (buffer, byteOffset, length2) => new Uint8Array(buffer, byteOffset, length2);
const createUint8ArrayFromArrayBuffer = (buffer) => new Uint8Array(buffer);
const toBase64Browser = (bytes) => {
  let s2 = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    s2 += fromCharCode(bytes[i]);
  }
  return btoa(s2);
};
const toBase64Node = (bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
const fromBase64Browser = (s2) => {
  const a = atob(s2);
  const bytes = createUint8ArrayFromLen(a.length);
  for (let i = 0; i < a.length; i++) {
    bytes[i] = a.charCodeAt(i);
  }
  return bytes;
};
const fromBase64Node = (s2) => {
  const buf = Buffer.from(s2, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};
const toBase64 = isBrowser ? toBase64Browser : toBase64Node;
const fromBase64 = isBrowser ? fromBase64Browser : fromBase64Node;
const copyUint8Array = (uint8Array) => {
  const newBuf = createUint8ArrayFromLen(uint8Array.byteLength);
  newBuf.set(uint8Array);
  return newBuf;
};
const isInteger = Number.isInteger || ((num) => typeof num === "number" && isFinite(num) && floor(num) === num);
class Encoder {
  constructor() {
    this.cpos = 0;
    this.cbuf = new Uint8Array(100);
    this.bufs = [];
  }
}
const createEncoder = () => new Encoder();
const length$1 = (encoder) => {
  let len = encoder.cpos;
  for (let i = 0; i < encoder.bufs.length; i++) {
    len += encoder.bufs[i].length;
  }
  return len;
};
const toUint8Array = (encoder) => {
  const uint8arr = new Uint8Array(length$1(encoder));
  let curPos = 0;
  for (let i = 0; i < encoder.bufs.length; i++) {
    const d2 = encoder.bufs[i];
    uint8arr.set(d2, curPos);
    curPos += d2.length;
  }
  uint8arr.set(createUint8ArrayViewFromArrayBuffer(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
  return uint8arr;
};
const verifyLen = (encoder, len) => {
  const bufferLen = encoder.cbuf.length;
  if (bufferLen - encoder.cpos < len) {
    encoder.bufs.push(createUint8ArrayViewFromArrayBuffer(encoder.cbuf.buffer, 0, encoder.cpos));
    encoder.cbuf = new Uint8Array(max(bufferLen, len) * 2);
    encoder.cpos = 0;
  }
};
const write = (encoder, num) => {
  const bufferLen = encoder.cbuf.length;
  if (encoder.cpos === bufferLen) {
    encoder.bufs.push(encoder.cbuf);
    encoder.cbuf = new Uint8Array(bufferLen * 2);
    encoder.cpos = 0;
  }
  encoder.cbuf[encoder.cpos++] = num;
};
const writeUint8 = write;
const writeVarUint = (encoder, num) => {
  while (num > BITS7) {
    write(encoder, BIT8 | BITS7 & num);
    num >>>= 7;
  }
  write(encoder, BITS7 & num);
};
const writeVarInt = (encoder, num) => {
  const isNegative = isNegativeZero(num);
  if (isNegative) {
    num = -num;
  }
  write(encoder, (num > BITS6 ? BIT8 : 0) | (isNegative ? BIT7 : 0) | BITS6 & num);
  num >>>= 6;
  while (num > 0) {
    write(encoder, (num > BITS7 ? BIT8 : 0) | BITS7 & num);
    num >>>= 7;
  }
};
const writeVarString = (encoder, str) => {
  const encodedString = unescape(encodeURIComponent(str));
  const len = encodedString.length;
  writeVarUint(encoder, len);
  for (let i = 0; i < len; i++) {
    write(encoder, encodedString.codePointAt(i));
  }
};
const writeUint8Array = (encoder, uint8Array) => {
  const bufferLen = encoder.cbuf.length;
  const cpos = encoder.cpos;
  const leftCopyLen = min(bufferLen - cpos, uint8Array.length);
  const rightCopyLen = uint8Array.length - leftCopyLen;
  encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
  encoder.cpos += leftCopyLen;
  if (rightCopyLen > 0) {
    encoder.bufs.push(encoder.cbuf);
    encoder.cbuf = new Uint8Array(max(bufferLen * 2, rightCopyLen));
    encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
    encoder.cpos = rightCopyLen;
  }
};
const writeVarUint8Array = (encoder, uint8Array) => {
  writeVarUint(encoder, uint8Array.byteLength);
  writeUint8Array(encoder, uint8Array);
};
const writeOnDataView = (encoder, len) => {
  verifyLen(encoder, len);
  const dview = new DataView(encoder.cbuf.buffer, encoder.cpos, len);
  encoder.cpos += len;
  return dview;
};
const writeFloat32 = (encoder, num) => writeOnDataView(encoder, 4).setFloat32(0, num, false);
const writeFloat64 = (encoder, num) => writeOnDataView(encoder, 8).setFloat64(0, num, false);
const writeBigInt64 = (encoder, num) => writeOnDataView(encoder, 8).setBigInt64(0, num, false);
const floatTestBed = new DataView(new ArrayBuffer(4));
const isFloat32 = (num) => {
  floatTestBed.setFloat32(0, num);
  return floatTestBed.getFloat32(0) === num;
};
const writeAny = (encoder, data) => {
  switch (typeof data) {
    case "string":
      write(encoder, 119);
      writeVarString(encoder, data);
      break;
    case "number":
      if (isInteger(data) && data <= BITS31) {
        write(encoder, 125);
        writeVarInt(encoder, data);
      } else if (isFloat32(data)) {
        write(encoder, 124);
        writeFloat32(encoder, data);
      } else {
        write(encoder, 123);
        writeFloat64(encoder, data);
      }
      break;
    case "bigint":
      write(encoder, 122);
      writeBigInt64(encoder, data);
      break;
    case "object":
      if (data === null) {
        write(encoder, 126);
      } else if (data instanceof Array) {
        write(encoder, 117);
        writeVarUint(encoder, data.length);
        for (let i = 0; i < data.length; i++) {
          writeAny(encoder, data[i]);
        }
      } else if (data instanceof Uint8Array) {
        write(encoder, 116);
        writeVarUint8Array(encoder, data);
      } else {
        write(encoder, 118);
        const keys2 = Object.keys(data);
        writeVarUint(encoder, keys2.length);
        for (let i = 0; i < keys2.length; i++) {
          const key = keys2[i];
          writeVarString(encoder, key);
          writeAny(encoder, data[key]);
        }
      }
      break;
    case "boolean":
      write(encoder, data ? 120 : 121);
      break;
    default:
      write(encoder, 127);
  }
};
class RleEncoder extends Encoder {
  constructor(writer) {
    super();
    this.w = writer;
    this.s = null;
    this.count = 0;
  }
  write(v) {
    if (this.s === v) {
      this.count++;
    } else {
      if (this.count > 0) {
        writeVarUint(this, this.count - 1);
      }
      this.count = 1;
      this.w(this, v);
      this.s = v;
    }
  }
}
const flushUintOptRleEncoder = (encoder) => {
  if (encoder.count > 0) {
    writeVarInt(encoder.encoder, encoder.count === 1 ? encoder.s : -encoder.s);
    if (encoder.count > 1) {
      writeVarUint(encoder.encoder, encoder.count - 2);
    }
  }
};
class UintOptRleEncoder {
  constructor() {
    this.encoder = new Encoder();
    this.s = 0;
    this.count = 0;
  }
  write(v) {
    if (this.s === v) {
      this.count++;
    } else {
      flushUintOptRleEncoder(this);
      this.count = 1;
      this.s = v;
    }
  }
  toUint8Array() {
    flushUintOptRleEncoder(this);
    return toUint8Array(this.encoder);
  }
}
const flushIntDiffOptRleEncoder = (encoder) => {
  if (encoder.count > 0) {
    const encodedDiff = encoder.diff << 1 | (encoder.count === 1 ? 0 : 1);
    writeVarInt(encoder.encoder, encodedDiff);
    if (encoder.count > 1) {
      writeVarUint(encoder.encoder, encoder.count - 2);
    }
  }
};
class IntDiffOptRleEncoder {
  constructor() {
    this.encoder = new Encoder();
    this.s = 0;
    this.count = 0;
    this.diff = 0;
  }
  write(v) {
    if (this.diff === v - this.s) {
      this.s = v;
      this.count++;
    } else {
      flushIntDiffOptRleEncoder(this);
      this.count = 1;
      this.diff = v - this.s;
      this.s = v;
    }
  }
  toUint8Array() {
    flushIntDiffOptRleEncoder(this);
    return toUint8Array(this.encoder);
  }
}
class StringEncoder {
  constructor() {
    this.sarr = [];
    this.s = "";
    this.lensE = new UintOptRleEncoder();
  }
  write(string) {
    this.s += string;
    if (this.s.length > 19) {
      this.sarr.push(this.s);
      this.s = "";
    }
    this.lensE.write(string.length);
  }
  toUint8Array() {
    const encoder = new Encoder();
    this.sarr.push(this.s);
    this.s = "";
    writeVarString(encoder, this.sarr.join(""));
    writeUint8Array(encoder, this.lensE.toUint8Array());
    return toUint8Array(encoder);
  }
}
const isoCrypto = typeof crypto === "undefined" ? null : crypto;
const cryptoRandomBuffer = isoCrypto !== null ? (len) => {
  const buf = new ArrayBuffer(len);
  const arr = new Uint8Array(buf);
  isoCrypto.getRandomValues(arr);
  return buf;
} : (len) => {
  const buf = new ArrayBuffer(len);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < len; i++) {
    arr[i] = Math.ceil(Math.random() * 4294967295 >>> 0);
  }
  return buf;
};
const rand = Math.random;
const uint32 = () => new Uint32Array(cryptoRandomBuffer(4))[0];
const uuidv4Template = [1e7] + -1e3 + -4e3 + -8e3 + -1e11;
const uuidv4 = () => uuidv4Template.replace(/[018]/g, (c) => (c ^ uint32() & 15 >> c / 4).toString(16));
const create$2 = (s2) => new Error(s2);
const methodUnimplemented = () => {
  throw create$2("Method unimplemented");
};
const unexpectedCase = () => {
  throw create$2("Unexpected case");
};
const keys = Object.keys;
const length = (obj) => keys(obj).length;
const every = (obj, f) => {
  for (const key in obj) {
    if (!f(obj[key], key)) {
      return false;
    }
  }
  return true;
};
const hasProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const equalFlat = (a, b) => a === b || length(a) === length(b) && every(a, (val, key) => (val !== void 0 || hasProperty(b, key)) && b[key] === val);
const callAll = (fs, args, i = 0) => {
  try {
    for (; i < fs.length; i++) {
      fs[i](...args);
    }
  } finally {
    if (i < fs.length) {
      callAll(fs, args, i + 1);
    }
  }
};
const nop = () => {
};
const equalityStrict = (a, b) => a === b;
const equalityDeep = (a, b) => {
  if (a == null || b == null) {
    return equalityStrict(a, b);
  }
  if (a.constructor !== b.constructor) {
    return false;
  }
  if (a === b) {
    return true;
  }
  switch (a.constructor) {
    case ArrayBuffer:
      a = new Uint8Array(a);
      b = new Uint8Array(b);
    case Uint8Array: {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      break;
    }
    case Set: {
      if (a.size !== b.size) {
        return false;
      }
      for (const value of a) {
        if (!b.has(value)) {
          return false;
        }
      }
      break;
    }
    case Map: {
      if (a.size !== b.size) {
        return false;
      }
      for (const key of a.keys()) {
        if (!b.has(key) || !equalityDeep(a.get(key), b.get(key))) {
          return false;
        }
      }
      break;
    }
    case Object:
      if (length(a) !== length(b)) {
        return false;
      }
      for (const key in a) {
        if (!hasProperty(a, key) || !equalityDeep(a[key], b[key])) {
          return false;
        }
      }
      break;
    case Array:
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!equalityDeep(a[i], b[i])) {
          return false;
        }
      }
      break;
    default:
      return false;
  }
  return true;
};
const create$1 = Symbol;
class Pair {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
}
const create = (left, right) => new Pair(left, right);
typeof DOMParser !== "undefined" ? new DOMParser() : null;
const mapToStyleString = (m) => map(m, (value, key) => `${key}:${value};`).join("");
const getUnixTime = Date.now;
const BOLD = create$1();
const UNBOLD = create$1();
const BLUE = create$1();
const GREY = create$1();
const GREEN = create$1();
const RED = create$1();
const PURPLE = create$1();
const ORANGE = create$1();
const UNCOLOR = create$1();
const _browserStyleMap = {
  [BOLD]: create("font-weight", "bold"),
  [UNBOLD]: create("font-weight", "normal"),
  [BLUE]: create("color", "blue"),
  [GREEN]: create("color", "green"),
  [GREY]: create("color", "grey"),
  [RED]: create("color", "red"),
  [PURPLE]: create("color", "purple"),
  [ORANGE]: create("color", "orange"),
  [UNCOLOR]: create("color", "black")
};
const _nodeStyleMap = {
  [BOLD]: "[1m",
  [UNBOLD]: "[2m",
  [BLUE]: "[34m",
  [GREEN]: "[32m",
  [GREY]: "[37m",
  [RED]: "[31m",
  [PURPLE]: "[35m",
  [ORANGE]: "[38;5;208m",
  [UNCOLOR]: "[0m"
};
const computeBrowserLoggingArgs = (args) => {
  const strBuilder = [];
  const styles = [];
  const currentStyle = create$4();
  let logArgs = [];
  let i = 0;
  for (; i < args.length; i++) {
    const arg = args[i];
    const style = _browserStyleMap[arg];
    if (style !== void 0) {
      currentStyle.set(style.left, style.right);
    } else {
      if (arg.constructor === String || arg.constructor === Number) {
        const style2 = mapToStyleString(currentStyle);
        if (i > 0 || style2.length > 0) {
          strBuilder.push("%c" + arg);
          styles.push(style2);
        } else {
          strBuilder.push(arg);
        }
      } else {
        break;
      }
    }
  }
  if (i > 0) {
    logArgs = styles;
    logArgs.unshift(strBuilder.join(""));
  }
  for (; i < args.length; i++) {
    const arg = args[i];
    if (!(arg instanceof Symbol)) {
      logArgs.push(arg);
    }
  }
  return logArgs;
};
const computeNodeLoggingArgs = (args) => {
  const strBuilder = [];
  const logArgs = [];
  let i = 0;
  for (; i < args.length; i++) {
    const arg = args[i];
    const style = _nodeStyleMap[arg];
    if (style !== void 0) {
      strBuilder.push(style);
    } else {
      if (arg.constructor === String || arg.constructor === Number) {
        strBuilder.push(arg);
      } else {
        break;
      }
    }
  }
  if (i > 0) {
    strBuilder.push("[0m");
    logArgs.push(strBuilder.join(""));
  }
  for (; i < args.length; i++) {
    const arg = args[i];
    if (!(arg instanceof Symbol)) {
      logArgs.push(arg);
    }
  }
  return logArgs;
};
const computeLoggingArgs = isNode ? computeNodeLoggingArgs : computeBrowserLoggingArgs;
const print = (...args) => {
  console.log(...computeLoggingArgs(args));
  vconsoles.forEach((vc) => vc.print(args));
};
const vconsoles = new Set();
const loggingColors = [GREEN, PURPLE, ORANGE, BLUE];
let nextColor = 0;
let lastLoggingTime = getUnixTime();
const createModuleLogger = (moduleName) => {
  const color = loggingColors[nextColor];
  const debugRegexVar = getVariable("log");
  const doLogging = debugRegexVar !== null && (debugRegexVar === "*" || debugRegexVar === "true" || new RegExp(debugRegexVar, "gi").test(moduleName));
  nextColor = (nextColor + 1) % loggingColors.length;
  moduleName += ": ";
  return !doLogging ? nop : (...args) => {
    const timeNow = getUnixTime();
    const timeDiff = timeNow - lastLoggingTime;
    lastLoggingTime = timeNow;
    print(color, moduleName, UNCOLOR, ...args.map((arg) => typeof arg === "string" || typeof arg === "symbol" ? arg : JSON.stringify(arg)), color, " +" + timeDiff + "ms");
  };
};
const createIterator = (next) => ({
  [Symbol.iterator]() {
    return this;
  },
  next
});
const iteratorFilter = (iterator, filter) => createIterator(() => {
  let res;
  do {
    res = iterator.next();
  } while (!res.done && !filter(res.value));
  return res;
});
const iteratorMap = (iterator, fmap) => createIterator(() => {
  const {done, value} = iterator.next();
  return {done, value: done ? void 0 : fmap(value)};
});
class DeleteItem {
  constructor(clock, len) {
    this.clock = clock;
    this.len = len;
  }
}
class DeleteSet {
  constructor() {
    this.clients = new Map();
  }
}
const iterateDeletedStructs = (transaction, ds, f) => ds.clients.forEach((deletes, clientid) => {
  const structs = transaction.doc.store.clients.get(clientid);
  for (let i = 0; i < deletes.length; i++) {
    const del = deletes[i];
    iterateStructs(transaction, structs, del.clock, del.len, f);
  }
});
const findIndexDS = (dis, clock) => {
  let left = 0;
  let right = dis.length - 1;
  while (left <= right) {
    const midindex = floor((left + right) / 2);
    const mid = dis[midindex];
    const midclock = mid.clock;
    if (midclock <= clock) {
      if (clock < midclock + mid.len) {
        return midindex;
      }
      left = midindex + 1;
    } else {
      right = midindex - 1;
    }
  }
  return null;
};
const isDeleted = (ds, id) => {
  const dis = ds.clients.get(id.client);
  return dis !== void 0 && findIndexDS(dis, id.clock) !== null;
};
const sortAndMergeDeleteSet = (ds) => {
  ds.clients.forEach((dels) => {
    dels.sort((a, b) => a.clock - b.clock);
    let i, j;
    for (i = 1, j = 1; i < dels.length; i++) {
      const left = dels[j - 1];
      const right = dels[i];
      if (left.clock + left.len >= right.clock) {
        left.len = max(left.len, right.clock + right.len - left.clock);
      } else {
        if (j < i) {
          dels[j] = right;
        }
        j++;
      }
    }
    dels.length = j;
  });
};
const mergeDeleteSets = (dss) => {
  const merged = new DeleteSet();
  for (let dssI = 0; dssI < dss.length; dssI++) {
    dss[dssI].clients.forEach((delsLeft, client) => {
      if (!merged.clients.has(client)) {
        const dels = delsLeft.slice();
        for (let i = dssI + 1; i < dss.length; i++) {
          appendTo(dels, dss[i].clients.get(client) || []);
        }
        merged.clients.set(client, dels);
      }
    });
  }
  sortAndMergeDeleteSet(merged);
  return merged;
};
const addToDeleteSet = (ds, client, clock, length2) => {
  setIfUndefined(ds.clients, client, () => []).push(new DeleteItem(clock, length2));
};
const createDeleteSet = () => new DeleteSet();
const createDeleteSetFromStructStore = (ss) => {
  const ds = createDeleteSet();
  ss.clients.forEach((structs, client) => {
    const dsitems = [];
    for (let i = 0; i < structs.length; i++) {
      const struct = structs[i];
      if (struct.deleted) {
        const clock = struct.id.clock;
        let len = struct.length;
        if (i + 1 < structs.length) {
          for (let next = structs[i + 1]; i + 1 < structs.length && next.id.clock === clock + len && next.deleted; next = structs[++i + 1]) {
            len += next.length;
          }
        }
        dsitems.push(new DeleteItem(clock, len));
      }
    }
    if (dsitems.length > 0) {
      ds.clients.set(client, dsitems);
    }
  });
  return ds;
};
const writeDeleteSet = (encoder, ds) => {
  writeVarUint(encoder.restEncoder, ds.clients.size);
  ds.clients.forEach((dsitems, client) => {
    encoder.resetDsCurVal();
    writeVarUint(encoder.restEncoder, client);
    const len = dsitems.length;
    writeVarUint(encoder.restEncoder, len);
    for (let i = 0; i < len; i++) {
      const item = dsitems[i];
      encoder.writeDsClock(item.clock);
      encoder.writeDsLen(item.len);
    }
  });
};
const readDeleteSet = (decoder) => {
  const ds = new DeleteSet();
  const numClients = readVarUint(decoder.restDecoder);
  for (let i = 0; i < numClients; i++) {
    decoder.resetDsCurVal();
    const client = readVarUint(decoder.restDecoder);
    const numberOfDeletes = readVarUint(decoder.restDecoder);
    if (numberOfDeletes > 0) {
      const dsField = setIfUndefined(ds.clients, client, () => []);
      for (let i2 = 0; i2 < numberOfDeletes; i2++) {
        dsField.push(new DeleteItem(decoder.readDsClock(), decoder.readDsLen()));
      }
    }
  }
  return ds;
};
const readAndApplyDeleteSet = (decoder, transaction, store) => {
  const unappliedDS = new DeleteSet();
  const numClients = readVarUint(decoder.restDecoder);
  for (let i = 0; i < numClients; i++) {
    decoder.resetDsCurVal();
    const client = readVarUint(decoder.restDecoder);
    const numberOfDeletes = readVarUint(decoder.restDecoder);
    const structs = store.clients.get(client) || [];
    const state = getState(store, client);
    for (let i2 = 0; i2 < numberOfDeletes; i2++) {
      const clock = decoder.readDsClock();
      const clockEnd = clock + decoder.readDsLen();
      if (clock < state) {
        if (state < clockEnd) {
          addToDeleteSet(unappliedDS, client, state, clockEnd - state);
        }
        let index2 = findIndexSS(structs, clock);
        let struct = structs[index2];
        if (!struct.deleted && struct.id.clock < clock) {
          structs.splice(index2 + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
          index2++;
        }
        while (index2 < structs.length) {
          struct = structs[index2++];
          if (struct.id.clock < clockEnd) {
            if (!struct.deleted) {
              if (clockEnd < struct.id.clock + struct.length) {
                structs.splice(index2, 0, splitItem(transaction, struct, clockEnd - struct.id.clock));
              }
              struct.delete(transaction);
            }
          } else {
            break;
          }
        }
      } else {
        addToDeleteSet(unappliedDS, client, clock, clockEnd - clock);
      }
    }
  }
  if (unappliedDS.clients.size > 0) {
    const ds = new UpdateEncoderV2();
    writeVarUint(ds.restEncoder, 0);
    writeDeleteSet(ds, unappliedDS);
    return ds.toUint8Array();
  }
  return null;
};
const generateNewClientId = uint32;
class Doc extends Observable {
  constructor({guid = uuidv4(), gc = true, gcFilter = () => true, meta = null, autoLoad = false} = {}) {
    super();
    this.gc = gc;
    this.gcFilter = gcFilter;
    this.clientID = generateNewClientId();
    this.guid = guid;
    this.share = new Map();
    this.store = new StructStore();
    this._transaction = null;
    this._transactionCleanups = [];
    this.subdocs = new Set();
    this._item = null;
    this.shouldLoad = autoLoad;
    this.autoLoad = autoLoad;
    this.meta = meta;
  }
  load() {
    const item = this._item;
    if (item !== null && !this.shouldLoad) {
      transact(item.parent.doc, (transaction) => {
        transaction.subdocsLoaded.add(this);
      }, null, true);
    }
    this.shouldLoad = true;
  }
  getSubdocs() {
    return this.subdocs;
  }
  getSubdocGuids() {
    return new Set(Array.from(this.subdocs).map((doc) => doc.guid));
  }
  transact(f, origin = null) {
    transact(this, f, origin);
  }
  get(name, TypeConstructor = AbstractType) {
    const type = setIfUndefined(this.share, name, () => {
      const t = new TypeConstructor();
      t._integrate(this, null);
      return t;
    });
    const Constr = type.constructor;
    if (TypeConstructor !== AbstractType && Constr !== TypeConstructor) {
      if (Constr === AbstractType) {
        const t = new TypeConstructor();
        t._map = type._map;
        type._map.forEach((n) => {
          for (; n !== null; n = n.left) {
            n.parent = t;
          }
        });
        t._start = type._start;
        for (let n = t._start; n !== null; n = n.right) {
          n.parent = t;
        }
        t._length = type._length;
        this.share.set(name, t);
        t._integrate(this, null);
        return t;
      } else {
        throw new Error(`Type with the name ${name} has already been defined with a different constructor`);
      }
    }
    return type;
  }
  getArray(name = "") {
    return this.get(name, YArray);
  }
  getText(name = "") {
    return this.get(name, YText);
  }
  getMap(name = "") {
    return this.get(name, YMap);
  }
  getXmlFragment(name = "") {
    return this.get(name, YXmlFragment);
  }
  toJSON() {
    const doc = {};
    this.share.forEach((value, key) => {
      doc[key] = value.toJSON();
    });
    return doc;
  }
  destroy() {
    from(this.subdocs).forEach((subdoc) => subdoc.destroy());
    const item = this._item;
    if (item !== null) {
      this._item = null;
      const content = item.content;
      if (item.deleted) {
        content.doc = null;
      } else {
        content.doc = new Doc({guid: this.guid, ...content.opts});
        content.doc._item = item;
      }
      transact(item.parent.doc, (transaction) => {
        if (!item.deleted) {
          transaction.subdocsAdded.add(content.doc);
        }
        transaction.subdocsRemoved.add(this);
      }, null, true);
    }
    this.emit("destroyed", [true]);
    this.emit("destroy", [this]);
    super.destroy();
  }
  on(eventName, f) {
    super.on(eventName, f);
  }
  off(eventName, f) {
    super.off(eventName, f);
  }
}
class DSDecoderV1 {
  constructor(decoder) {
    this.restDecoder = decoder;
  }
  resetDsCurVal() {
  }
  readDsClock() {
    return readVarUint(this.restDecoder);
  }
  readDsLen() {
    return readVarUint(this.restDecoder);
  }
}
class UpdateDecoderV1 extends DSDecoderV1 {
  readLeftID() {
    return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder));
  }
  readRightID() {
    return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder));
  }
  readClient() {
    return readVarUint(this.restDecoder);
  }
  readInfo() {
    return readUint8(this.restDecoder);
  }
  readString() {
    return readVarString(this.restDecoder);
  }
  readParentInfo() {
    return readVarUint(this.restDecoder) === 1;
  }
  readTypeRef() {
    return readVarUint(this.restDecoder);
  }
  readLen() {
    return readVarUint(this.restDecoder);
  }
  readAny() {
    return readAny(this.restDecoder);
  }
  readBuf() {
    return copyUint8Array(readVarUint8Array(this.restDecoder));
  }
  readJSON() {
    return JSON.parse(readVarString(this.restDecoder));
  }
  readKey() {
    return readVarString(this.restDecoder);
  }
}
class DSDecoderV2 {
  constructor(decoder) {
    this.dsCurrVal = 0;
    this.restDecoder = decoder;
  }
  resetDsCurVal() {
    this.dsCurrVal = 0;
  }
  readDsClock() {
    this.dsCurrVal += readVarUint(this.restDecoder);
    return this.dsCurrVal;
  }
  readDsLen() {
    const diff = readVarUint(this.restDecoder) + 1;
    this.dsCurrVal += diff;
    return diff;
  }
}
class UpdateDecoderV2 extends DSDecoderV2 {
  constructor(decoder) {
    super(decoder);
    this.keys = [];
    readVarUint(decoder);
    this.keyClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
    this.clientDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
    this.leftClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
    this.rightClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
    this.infoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
    this.stringDecoder = new StringDecoder(readVarUint8Array(decoder));
    this.parentInfoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
    this.typeRefDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
    this.lenDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
  }
  readLeftID() {
    return new ID(this.clientDecoder.read(), this.leftClockDecoder.read());
  }
  readRightID() {
    return new ID(this.clientDecoder.read(), this.rightClockDecoder.read());
  }
  readClient() {
    return this.clientDecoder.read();
  }
  readInfo() {
    return this.infoDecoder.read();
  }
  readString() {
    return this.stringDecoder.read();
  }
  readParentInfo() {
    return this.parentInfoDecoder.read() === 1;
  }
  readTypeRef() {
    return this.typeRefDecoder.read();
  }
  readLen() {
    return this.lenDecoder.read();
  }
  readAny() {
    return readAny(this.restDecoder);
  }
  readBuf() {
    return readVarUint8Array(this.restDecoder);
  }
  readJSON() {
    return readAny(this.restDecoder);
  }
  readKey() {
    const keyClock = this.keyClockDecoder.read();
    if (keyClock < this.keys.length) {
      return this.keys[keyClock];
    } else {
      const key = this.stringDecoder.read();
      this.keys.push(key);
      return key;
    }
  }
}
class DSEncoderV1 {
  constructor() {
    this.restEncoder = createEncoder();
  }
  toUint8Array() {
    return toUint8Array(this.restEncoder);
  }
  resetDsCurVal() {
  }
  writeDsClock(clock) {
    writeVarUint(this.restEncoder, clock);
  }
  writeDsLen(len) {
    writeVarUint(this.restEncoder, len);
  }
}
class UpdateEncoderV1 extends DSEncoderV1 {
  writeLeftID(id) {
    writeVarUint(this.restEncoder, id.client);
    writeVarUint(this.restEncoder, id.clock);
  }
  writeRightID(id) {
    writeVarUint(this.restEncoder, id.client);
    writeVarUint(this.restEncoder, id.clock);
  }
  writeClient(client) {
    writeVarUint(this.restEncoder, client);
  }
  writeInfo(info) {
    writeUint8(this.restEncoder, info);
  }
  writeString(s2) {
    writeVarString(this.restEncoder, s2);
  }
  writeParentInfo(isYKey) {
    writeVarUint(this.restEncoder, isYKey ? 1 : 0);
  }
  writeTypeRef(info) {
    writeVarUint(this.restEncoder, info);
  }
  writeLen(len) {
    writeVarUint(this.restEncoder, len);
  }
  writeAny(any2) {
    writeAny(this.restEncoder, any2);
  }
  writeBuf(buf) {
    writeVarUint8Array(this.restEncoder, buf);
  }
  writeJSON(embed) {
    writeVarString(this.restEncoder, JSON.stringify(embed));
  }
  writeKey(key) {
    writeVarString(this.restEncoder, key);
  }
}
class DSEncoderV2 {
  constructor() {
    this.restEncoder = createEncoder();
    this.dsCurrVal = 0;
  }
  toUint8Array() {
    return toUint8Array(this.restEncoder);
  }
  resetDsCurVal() {
    this.dsCurrVal = 0;
  }
  writeDsClock(clock) {
    const diff = clock - this.dsCurrVal;
    this.dsCurrVal = clock;
    writeVarUint(this.restEncoder, diff);
  }
  writeDsLen(len) {
    if (len === 0) {
      unexpectedCase();
    }
    writeVarUint(this.restEncoder, len - 1);
    this.dsCurrVal += len;
  }
}
class UpdateEncoderV2 extends DSEncoderV2 {
  constructor() {
    super();
    this.keyMap = new Map();
    this.keyClock = 0;
    this.keyClockEncoder = new IntDiffOptRleEncoder();
    this.clientEncoder = new UintOptRleEncoder();
    this.leftClockEncoder = new IntDiffOptRleEncoder();
    this.rightClockEncoder = new IntDiffOptRleEncoder();
    this.infoEncoder = new RleEncoder(writeUint8);
    this.stringEncoder = new StringEncoder();
    this.parentInfoEncoder = new RleEncoder(writeUint8);
    this.typeRefEncoder = new UintOptRleEncoder();
    this.lenEncoder = new UintOptRleEncoder();
  }
  toUint8Array() {
    const encoder = createEncoder();
    writeVarUint(encoder, 0);
    writeVarUint8Array(encoder, this.keyClockEncoder.toUint8Array());
    writeVarUint8Array(encoder, this.clientEncoder.toUint8Array());
    writeVarUint8Array(encoder, this.leftClockEncoder.toUint8Array());
    writeVarUint8Array(encoder, this.rightClockEncoder.toUint8Array());
    writeVarUint8Array(encoder, toUint8Array(this.infoEncoder));
    writeVarUint8Array(encoder, this.stringEncoder.toUint8Array());
    writeVarUint8Array(encoder, toUint8Array(this.parentInfoEncoder));
    writeVarUint8Array(encoder, this.typeRefEncoder.toUint8Array());
    writeVarUint8Array(encoder, this.lenEncoder.toUint8Array());
    writeUint8Array(encoder, toUint8Array(this.restEncoder));
    return toUint8Array(encoder);
  }
  writeLeftID(id) {
    this.clientEncoder.write(id.client);
    this.leftClockEncoder.write(id.clock);
  }
  writeRightID(id) {
    this.clientEncoder.write(id.client);
    this.rightClockEncoder.write(id.clock);
  }
  writeClient(client) {
    this.clientEncoder.write(client);
  }
  writeInfo(info) {
    this.infoEncoder.write(info);
  }
  writeString(s2) {
    this.stringEncoder.write(s2);
  }
  writeParentInfo(isYKey) {
    this.parentInfoEncoder.write(isYKey ? 1 : 0);
  }
  writeTypeRef(info) {
    this.typeRefEncoder.write(info);
  }
  writeLen(len) {
    this.lenEncoder.write(len);
  }
  writeAny(any2) {
    writeAny(this.restEncoder, any2);
  }
  writeBuf(buf) {
    writeVarUint8Array(this.restEncoder, buf);
  }
  writeJSON(embed) {
    writeAny(this.restEncoder, embed);
  }
  writeKey(key) {
    const clock = this.keyMap.get(key);
    if (clock === void 0) {
      this.keyClockEncoder.write(this.keyClock++);
      this.stringEncoder.write(key);
    } else {
      this.keyClockEncoder.write(this.keyClock++);
    }
  }
}
const writeStructs = (encoder, structs, client, clock) => {
  clock = max(clock, structs[0].id.clock);
  const startNewStructs = findIndexSS(structs, clock);
  writeVarUint(encoder.restEncoder, structs.length - startNewStructs);
  encoder.writeClient(client);
  writeVarUint(encoder.restEncoder, clock);
  const firstStruct = structs[startNewStructs];
  firstStruct.write(encoder, clock - firstStruct.id.clock);
  for (let i = startNewStructs + 1; i < structs.length; i++) {
    structs[i].write(encoder, 0);
  }
};
const writeClientsStructs = (encoder, store, _sm) => {
  const sm = new Map();
  _sm.forEach((clock, client) => {
    if (getState(store, client) > clock) {
      sm.set(client, clock);
    }
  });
  getStateVector(store).forEach((clock, client) => {
    if (!_sm.has(client)) {
      sm.set(client, 0);
    }
  });
  writeVarUint(encoder.restEncoder, sm.size);
  Array.from(sm.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, clock]) => {
    writeStructs(encoder, store.clients.get(client), client, clock);
  });
};
const readClientsStructRefs = (decoder, doc) => {
  const clientRefs = create$4();
  const numOfStateUpdates = readVarUint(decoder.restDecoder);
  for (let i = 0; i < numOfStateUpdates; i++) {
    const numberOfStructs = readVarUint(decoder.restDecoder);
    const refs = new Array(numberOfStructs);
    const client = decoder.readClient();
    let clock = readVarUint(decoder.restDecoder);
    clientRefs.set(client, {i: 0, refs});
    for (let i2 = 0; i2 < numberOfStructs; i2++) {
      const info = decoder.readInfo();
      switch (BITS5 & info) {
        case 0: {
          const len = decoder.readLen();
          refs[i2] = new GC(createID(client, clock), len);
          clock += len;
          break;
        }
        case 10: {
          const len = readVarUint(decoder.restDecoder);
          refs[i2] = new Skip(createID(client, clock), len);
          clock += len;
          break;
        }
        default: {
          const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
          const struct = new Item(createID(client, clock), null, (info & BIT8) === BIT8 ? decoder.readLeftID() : null, null, (info & BIT7) === BIT7 ? decoder.readRightID() : null, cantCopyParentInfo ? decoder.readParentInfo() ? doc.get(decoder.readString()) : decoder.readLeftID() : null, cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null, readItemContent(decoder, info));
          refs[i2] = struct;
          clock += struct.length;
        }
      }
    }
  }
  return clientRefs;
};
const integrateStructs = (transaction, store, clientsStructRefs) => {
  const stack = [];
  let clientsStructRefsIds = Array.from(clientsStructRefs.keys()).sort((a, b) => a - b);
  if (clientsStructRefsIds.length === 0) {
    return null;
  }
  const getNextStructTarget = () => {
    if (clientsStructRefsIds.length === 0) {
      return null;
    }
    let nextStructsTarget = clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1]);
    while (nextStructsTarget.refs.length === nextStructsTarget.i) {
      clientsStructRefsIds.pop();
      if (clientsStructRefsIds.length > 0) {
        nextStructsTarget = clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1]);
      } else {
        return null;
      }
    }
    return nextStructsTarget;
  };
  let curStructsTarget = getNextStructTarget();
  if (curStructsTarget === null && stack.length === 0) {
    return null;
  }
  const restStructs = new StructStore();
  const missingSV = new Map();
  const updateMissingSv = (client, clock) => {
    const mclock = missingSV.get(client);
    if (mclock == null || mclock > clock) {
      missingSV.set(client, clock);
    }
  };
  let stackHead = curStructsTarget.refs[curStructsTarget.i++];
  const state = new Map();
  const addStackToRestSS = () => {
    for (const item of stack) {
      const client = item.id.client;
      const unapplicableItems = clientsStructRefs.get(client);
      if (unapplicableItems) {
        unapplicableItems.i--;
        restStructs.clients.set(client, unapplicableItems.refs.slice(unapplicableItems.i));
        clientsStructRefs.delete(client);
        unapplicableItems.i = 0;
        unapplicableItems.refs = [];
      } else {
        restStructs.clients.set(client, [item]);
      }
      clientsStructRefsIds = clientsStructRefsIds.filter((c) => c !== client);
    }
    stack.length = 0;
  };
  while (true) {
    if (stackHead.constructor !== Skip) {
      const localClock = setIfUndefined(state, stackHead.id.client, () => getState(store, stackHead.id.client));
      const offset = localClock - stackHead.id.clock;
      if (offset < 0) {
        stack.push(stackHead);
        updateMissingSv(stackHead.id.client, stackHead.id.clock - 1);
        addStackToRestSS();
      } else {
        const missing = stackHead.getMissing(transaction, store);
        if (missing !== null) {
          stack.push(stackHead);
          const structRefs = clientsStructRefs.get(missing) || {refs: [], i: 0};
          if (structRefs.refs.length === structRefs.i) {
            updateMissingSv(missing, getState(store, missing));
            addStackToRestSS();
          } else {
            stackHead = structRefs.refs[structRefs.i++];
            continue;
          }
        } else if (offset === 0 || offset < stackHead.length) {
          stackHead.integrate(transaction, offset);
          state.set(stackHead.id.client, stackHead.id.clock + stackHead.length);
        }
      }
    }
    if (stack.length > 0) {
      stackHead = stack.pop();
    } else if (curStructsTarget !== null && curStructsTarget.i < curStructsTarget.refs.length) {
      stackHead = curStructsTarget.refs[curStructsTarget.i++];
    } else {
      curStructsTarget = getNextStructTarget();
      if (curStructsTarget === null) {
        break;
      } else {
        stackHead = curStructsTarget.refs[curStructsTarget.i++];
      }
    }
  }
  if (restStructs.clients.size > 0) {
    const encoder = new UpdateEncoderV2();
    writeClientsStructs(encoder, restStructs, new Map());
    writeVarUint(encoder.restEncoder, 0);
    return {missing: missingSV, update: encoder.toUint8Array()};
  }
  return null;
};
const writeStructsFromTransaction = (encoder, transaction) => writeClientsStructs(encoder, transaction.doc.store, transaction.beforeState);
const readUpdateV2 = (decoder, ydoc, transactionOrigin, structDecoder = new UpdateDecoderV2(decoder)) => transact(ydoc, (transaction) => {
  let retry = false;
  const doc = transaction.doc;
  const store = doc.store;
  const ss = readClientsStructRefs(structDecoder, doc);
  const restStructs = integrateStructs(transaction, store, ss);
  const pending = store.pendingStructs;
  if (pending) {
    for (const [client, clock] of pending.missing) {
      if (clock < getState(store, client)) {
        retry = true;
        break;
      }
    }
    if (restStructs) {
      for (const [client, clock] of restStructs.missing) {
        const mclock = pending.missing.get(client);
        if (mclock == null || mclock > clock) {
          pending.missing.set(client, clock);
        }
      }
      pending.update = mergeUpdatesV2([pending.update, restStructs.update]);
    }
  } else {
    store.pendingStructs = restStructs;
  }
  const dsRest = readAndApplyDeleteSet(structDecoder, transaction, store);
  if (store.pendingDs) {
    const pendingDSUpdate = new UpdateDecoderV2(createDecoder(store.pendingDs));
    readVarUint(pendingDSUpdate.restDecoder);
    const dsRest2 = readAndApplyDeleteSet(pendingDSUpdate, transaction, store);
    if (dsRest && dsRest2) {
      store.pendingDs = mergeUpdatesV2([dsRest, dsRest2]);
    } else {
      store.pendingDs = dsRest || dsRest2;
    }
  } else {
    store.pendingDs = dsRest;
  }
  if (retry) {
    const update = store.pendingStructs.update;
    store.pendingStructs = null;
    applyUpdateV2(transaction.doc, update);
  }
}, transactionOrigin, false);
const applyUpdateV2 = (ydoc, update, transactionOrigin, YDecoder = UpdateDecoderV2) => {
  const decoder = createDecoder(update);
  readUpdateV2(decoder, ydoc, transactionOrigin, new YDecoder(decoder));
};
const applyUpdate = (ydoc, update, transactionOrigin) => applyUpdateV2(ydoc, update, transactionOrigin, UpdateDecoderV1);
const writeStateAsUpdate = (encoder, doc, targetStateVector = new Map()) => {
  writeClientsStructs(encoder, doc.store, targetStateVector);
  writeDeleteSet(encoder, createDeleteSetFromStructStore(doc.store));
};
const encodeStateAsUpdateV2 = (doc, encodedTargetStateVector = new Uint8Array([0]), encoder = new UpdateEncoderV2()) => {
  const targetStateVector = decodeStateVector(encodedTargetStateVector);
  writeStateAsUpdate(encoder, doc, targetStateVector);
  const updates = [encoder.toUint8Array()];
  if (encoder.constructor === UpdateEncoderV2) {
    if (doc.store.pendingDs) {
      updates.push(doc.store.pendingDs);
    }
    if (doc.store.pendingStructs) {
      updates.push(diffUpdateV2(doc.store.pendingStructs.update, encodedTargetStateVector));
    }
    if (updates.length > 1) {
      return mergeUpdatesV2(updates);
    }
  }
  return updates[0];
};
const encodeStateAsUpdate = (doc, encodedTargetStateVector) => encodeStateAsUpdateV2(doc, encodedTargetStateVector, new UpdateEncoderV1());
const readStateVector = (decoder) => {
  const ss = new Map();
  const ssLength = readVarUint(decoder.restDecoder);
  for (let i = 0; i < ssLength; i++) {
    const client = readVarUint(decoder.restDecoder);
    const clock = readVarUint(decoder.restDecoder);
    ss.set(client, clock);
  }
  return ss;
};
const decodeStateVector = (decodedState) => readStateVector(new DSDecoderV1(createDecoder(decodedState)));
const writeStateVector = (encoder, sv) => {
  writeVarUint(encoder.restEncoder, sv.size);
  sv.forEach((clock, client) => {
    writeVarUint(encoder.restEncoder, client);
    writeVarUint(encoder.restEncoder, clock);
  });
  return encoder;
};
const writeDocumentStateVector = (encoder, doc) => writeStateVector(encoder, getStateVector(doc.store));
const encodeStateVectorV2 = (doc, encoder = new DSEncoderV2()) => {
  if (doc instanceof Map) {
    writeStateVector(encoder, doc);
  } else {
    writeDocumentStateVector(encoder, doc);
  }
  return encoder.toUint8Array();
};
const encodeStateVector = (doc) => encodeStateVectorV2(doc, new DSEncoderV1());
class EventHandler {
  constructor() {
    this.l = [];
  }
}
const createEventHandler = () => new EventHandler();
const addEventHandlerListener = (eventHandler, f) => eventHandler.l.push(f);
const removeEventHandlerListener = (eventHandler, f) => {
  const l = eventHandler.l;
  const len = l.length;
  eventHandler.l = l.filter((g) => f !== g);
  if (len === eventHandler.l.length) {
    console.error("[yjs] Tried to remove event handler that doesn't exist.");
  }
};
const callEventHandlerListeners = (eventHandler, arg0, arg1) => callAll(eventHandler.l, [arg0, arg1]);
class ID {
  constructor(client, clock) {
    this.client = client;
    this.clock = clock;
  }
}
const compareIDs = (a, b) => a === b || a !== null && b !== null && a.client === b.client && a.clock === b.clock;
const createID = (client, clock) => new ID(client, clock);
const findRootTypeKey = (type) => {
  for (const [key, value] of type.doc.share.entries()) {
    if (value === type) {
      return key;
    }
  }
  throw unexpectedCase();
};
const isVisible = (item, snapshot) => snapshot === void 0 ? !item.deleted : snapshot.sv.has(item.id.client) && (snapshot.sv.get(item.id.client) || 0) > item.id.clock && !isDeleted(snapshot.ds, item.id);
const splitSnapshotAffectedStructs = (transaction, snapshot) => {
  const meta = setIfUndefined(transaction.meta, splitSnapshotAffectedStructs, create$3);
  const store = transaction.doc.store;
  if (!meta.has(snapshot)) {
    snapshot.sv.forEach((clock, client) => {
      if (clock < getState(store, client)) {
        getItemCleanStart(transaction, createID(client, clock));
      }
    });
    iterateDeletedStructs(transaction, snapshot.ds, (item) => {
    });
    meta.add(snapshot);
  }
};
class StructStore {
  constructor() {
    this.clients = new Map();
    this.pendingStructs = null;
    this.pendingDs = null;
  }
}
const getStateVector = (store) => {
  const sm = new Map();
  store.clients.forEach((structs, client) => {
    const struct = structs[structs.length - 1];
    sm.set(client, struct.id.clock + struct.length);
  });
  return sm;
};
const getState = (store, client) => {
  const structs = store.clients.get(client);
  if (structs === void 0) {
    return 0;
  }
  const lastStruct = structs[structs.length - 1];
  return lastStruct.id.clock + lastStruct.length;
};
const addStruct = (store, struct) => {
  let structs = store.clients.get(struct.id.client);
  if (structs === void 0) {
    structs = [];
    store.clients.set(struct.id.client, structs);
  } else {
    const lastStruct = structs[structs.length - 1];
    if (lastStruct.id.clock + lastStruct.length !== struct.id.clock) {
      throw unexpectedCase();
    }
  }
  structs.push(struct);
};
const findIndexSS = (structs, clock) => {
  let left = 0;
  let right = structs.length - 1;
  let mid = structs[right];
  let midclock = mid.id.clock;
  if (midclock === clock) {
    return right;
  }
  let midindex = floor(clock / (midclock + mid.length - 1) * right);
  while (left <= right) {
    mid = structs[midindex];
    midclock = mid.id.clock;
    if (midclock <= clock) {
      if (clock < midclock + mid.length) {
        return midindex;
      }
      left = midindex + 1;
    } else {
      right = midindex - 1;
    }
    midindex = floor((left + right) / 2);
  }
  throw unexpectedCase();
};
const find = (store, id) => {
  const structs = store.clients.get(id.client);
  return structs[findIndexSS(structs, id.clock)];
};
const getItem = find;
const findIndexCleanStart = (transaction, structs, clock) => {
  const index2 = findIndexSS(structs, clock);
  const struct = structs[index2];
  if (struct.id.clock < clock && struct instanceof Item) {
    structs.splice(index2 + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
    return index2 + 1;
  }
  return index2;
};
const getItemCleanStart = (transaction, id) => {
  const structs = transaction.doc.store.clients.get(id.client);
  return structs[findIndexCleanStart(transaction, structs, id.clock)];
};
const getItemCleanEnd = (transaction, store, id) => {
  const structs = store.clients.get(id.client);
  const index2 = findIndexSS(structs, id.clock);
  const struct = structs[index2];
  if (id.clock !== struct.id.clock + struct.length - 1 && struct.constructor !== GC) {
    structs.splice(index2 + 1, 0, splitItem(transaction, struct, id.clock - struct.id.clock + 1));
  }
  return struct;
};
const replaceStruct = (store, struct, newStruct) => {
  const structs = store.clients.get(struct.id.client);
  structs[findIndexSS(structs, struct.id.clock)] = newStruct;
};
const iterateStructs = (transaction, structs, clockStart, len, f) => {
  if (len === 0) {
    return;
  }
  const clockEnd = clockStart + len;
  let index2 = findIndexCleanStart(transaction, structs, clockStart);
  let struct;
  do {
    struct = structs[index2++];
    if (clockEnd < struct.id.clock + struct.length) {
      findIndexCleanStart(transaction, structs, clockEnd);
    }
    f(struct);
  } while (index2 < structs.length && structs[index2].id.clock < clockEnd);
};
class Transaction {
  constructor(doc, origin, local) {
    this.doc = doc;
    this.deleteSet = new DeleteSet();
    this.beforeState = getStateVector(doc.store);
    this.afterState = new Map();
    this.changed = new Map();
    this.changedParentTypes = new Map();
    this._mergeStructs = [];
    this.origin = origin;
    this.meta = new Map();
    this.local = local;
    this.subdocsAdded = new Set();
    this.subdocsRemoved = new Set();
    this.subdocsLoaded = new Set();
  }
}
const writeUpdateMessageFromTransaction = (encoder, transaction) => {
  if (transaction.deleteSet.clients.size === 0 && !any(transaction.afterState, (clock, client) => transaction.beforeState.get(client) !== clock)) {
    return false;
  }
  sortAndMergeDeleteSet(transaction.deleteSet);
  writeStructsFromTransaction(encoder, transaction);
  writeDeleteSet(encoder, transaction.deleteSet);
  return true;
};
const addChangedTypeToTransaction = (transaction, type, parentSub) => {
  const item = type._item;
  if (item === null || item.id.clock < (transaction.beforeState.get(item.id.client) || 0) && !item.deleted) {
    setIfUndefined(transaction.changed, type, create$3).add(parentSub);
  }
};
const tryToMergeWithLeft = (structs, pos) => {
  const left = structs[pos - 1];
  const right = structs[pos];
  if (left.deleted === right.deleted && left.constructor === right.constructor) {
    if (left.mergeWith(right)) {
      structs.splice(pos, 1);
      if (right instanceof Item && right.parentSub !== null && right.parent._map.get(right.parentSub) === right) {
        right.parent._map.set(right.parentSub, left);
      }
    }
  }
};
const tryGcDeleteSet = (ds, store, gcFilter) => {
  for (const [client, deleteItems] of ds.clients.entries()) {
    const structs = store.clients.get(client);
    for (let di = deleteItems.length - 1; di >= 0; di--) {
      const deleteItem = deleteItems[di];
      const endDeleteItemClock = deleteItem.clock + deleteItem.len;
      for (let si = findIndexSS(structs, deleteItem.clock), struct = structs[si]; si < structs.length && struct.id.clock < endDeleteItemClock; struct = structs[++si]) {
        const struct2 = structs[si];
        if (deleteItem.clock + deleteItem.len <= struct2.id.clock) {
          break;
        }
        if (struct2 instanceof Item && struct2.deleted && !struct2.keep && gcFilter(struct2)) {
          struct2.gc(store, false);
        }
      }
    }
  }
};
const tryMergeDeleteSet = (ds, store) => {
  ds.clients.forEach((deleteItems, client) => {
    const structs = store.clients.get(client);
    for (let di = deleteItems.length - 1; di >= 0; di--) {
      const deleteItem = deleteItems[di];
      const mostRightIndexToCheck = min(structs.length - 1, 1 + findIndexSS(structs, deleteItem.clock + deleteItem.len - 1));
      for (let si = mostRightIndexToCheck, struct = structs[si]; si > 0 && struct.id.clock >= deleteItem.clock; struct = structs[--si]) {
        tryToMergeWithLeft(structs, si);
      }
    }
  });
};
const cleanupTransactions = (transactionCleanups, i) => {
  if (i < transactionCleanups.length) {
    const transaction = transactionCleanups[i];
    const doc = transaction.doc;
    const store = doc.store;
    const ds = transaction.deleteSet;
    const mergeStructs = transaction._mergeStructs;
    try {
      sortAndMergeDeleteSet(ds);
      transaction.afterState = getStateVector(transaction.doc.store);
      doc._transaction = null;
      doc.emit("beforeObserverCalls", [transaction, doc]);
      const fs = [];
      transaction.changed.forEach((subs, itemtype) => fs.push(() => {
        if (itemtype._item === null || !itemtype._item.deleted) {
          itemtype._callObserver(transaction, subs);
        }
      }));
      fs.push(() => {
        transaction.changedParentTypes.forEach((events, type) => fs.push(() => {
          if (type._item === null || !type._item.deleted) {
            events = events.filter((event) => event.target._item === null || !event.target._item.deleted);
            events.forEach((event) => {
              event.currentTarget = type;
            });
            events.sort((event1, event2) => event1.path.length - event2.path.length);
            callEventHandlerListeners(type._dEH, events, transaction);
          }
        }));
        fs.push(() => doc.emit("afterTransaction", [transaction, doc]));
      });
      callAll(fs, []);
    } finally {
      if (doc.gc) {
        tryGcDeleteSet(ds, store, doc.gcFilter);
      }
      tryMergeDeleteSet(ds, store);
      transaction.afterState.forEach((clock, client) => {
        const beforeClock = transaction.beforeState.get(client) || 0;
        if (beforeClock !== clock) {
          const structs = store.clients.get(client);
          const firstChangePos = max(findIndexSS(structs, beforeClock), 1);
          for (let i2 = structs.length - 1; i2 >= firstChangePos; i2--) {
            tryToMergeWithLeft(structs, i2);
          }
        }
      });
      for (let i2 = 0; i2 < mergeStructs.length; i2++) {
        const {client, clock} = mergeStructs[i2].id;
        const structs = store.clients.get(client);
        const replacedStructPos = findIndexSS(structs, clock);
        if (replacedStructPos + 1 < structs.length) {
          tryToMergeWithLeft(structs, replacedStructPos + 1);
        }
        if (replacedStructPos > 0) {
          tryToMergeWithLeft(structs, replacedStructPos);
        }
      }
      if (!transaction.local && transaction.afterState.get(doc.clientID) !== transaction.beforeState.get(doc.clientID)) {
        doc.clientID = generateNewClientId();
        print(ORANGE, BOLD, "[yjs] ", UNBOLD, RED, "Changed the client-id because another client seems to be using it.");
      }
      doc.emit("afterTransactionCleanup", [transaction, doc]);
      if (doc._observers.has("update")) {
        const encoder = new UpdateEncoderV1();
        const hasContent2 = writeUpdateMessageFromTransaction(encoder, transaction);
        if (hasContent2) {
          doc.emit("update", [encoder.toUint8Array(), transaction.origin, doc, transaction]);
        }
      }
      if (doc._observers.has("updateV2")) {
        const encoder = new UpdateEncoderV2();
        const hasContent2 = writeUpdateMessageFromTransaction(encoder, transaction);
        if (hasContent2) {
          doc.emit("updateV2", [encoder.toUint8Array(), transaction.origin, doc, transaction]);
        }
      }
      transaction.subdocsAdded.forEach((subdoc) => doc.subdocs.add(subdoc));
      transaction.subdocsRemoved.forEach((subdoc) => doc.subdocs.delete(subdoc));
      doc.emit("subdocs", [{loaded: transaction.subdocsLoaded, added: transaction.subdocsAdded, removed: transaction.subdocsRemoved}]);
      transaction.subdocsRemoved.forEach((subdoc) => subdoc.destroy());
      if (transactionCleanups.length <= i + 1) {
        doc._transactionCleanups = [];
        doc.emit("afterAllTransactions", [doc, transactionCleanups]);
      } else {
        cleanupTransactions(transactionCleanups, i + 1);
      }
    }
  }
};
const transact = (doc, f, origin = null, local = true) => {
  const transactionCleanups = doc._transactionCleanups;
  let initialCall = false;
  if (doc._transaction === null) {
    initialCall = true;
    doc._transaction = new Transaction(doc, origin, local);
    transactionCleanups.push(doc._transaction);
    if (transactionCleanups.length === 1) {
      doc.emit("beforeAllTransactions", [doc]);
    }
    doc.emit("beforeTransaction", [doc._transaction, doc]);
  }
  try {
    f(doc._transaction);
  } finally {
    if (initialCall && transactionCleanups[0] === doc._transaction) {
      cleanupTransactions(transactionCleanups, 0);
    }
  }
};
function* lazyStructReaderGenerator(decoder) {
  const numOfStateUpdates = readVarUint(decoder.restDecoder);
  for (let i = 0; i < numOfStateUpdates; i++) {
    const numberOfStructs = readVarUint(decoder.restDecoder);
    const client = decoder.readClient();
    let clock = readVarUint(decoder.restDecoder);
    for (let i2 = 0; i2 < numberOfStructs; i2++) {
      const info = decoder.readInfo();
      if (info === 10) {
        const len = readVarUint(decoder.restDecoder);
        yield new Skip(createID(client, clock), len);
        clock += len;
      } else if ((BITS5 & info) !== 0) {
        const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
        const struct = new Item(createID(client, clock), null, (info & BIT8) === BIT8 ? decoder.readLeftID() : null, null, (info & BIT7) === BIT7 ? decoder.readRightID() : null, cantCopyParentInfo ? decoder.readParentInfo() ? decoder.readString() : decoder.readLeftID() : null, cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null, readItemContent(decoder, info));
        yield struct;
        clock += struct.length;
      } else {
        const len = decoder.readLen();
        yield new GC(createID(client, clock), len);
        clock += len;
      }
    }
  }
}
class LazyStructReader {
  constructor(decoder, filterSkips) {
    this.gen = lazyStructReaderGenerator(decoder);
    this.curr = null;
    this.done = false;
    this.filterSkips = filterSkips;
    this.next();
  }
  next() {
    do {
      this.curr = this.gen.next().value || null;
    } while (this.filterSkips && this.curr !== null && this.curr.constructor === Skip);
    return this.curr;
  }
}
class LazyStructWriter {
  constructor(encoder) {
    this.currClient = 0;
    this.startClock = 0;
    this.written = 0;
    this.encoder = encoder;
    this.clientStructs = [];
  }
}
const sliceStruct = (left, diff) => {
  if (left.constructor === GC) {
    const {client, clock} = left.id;
    return new GC(createID(client, clock + diff), left.length - diff);
  } else if (left.constructor === Skip) {
    const {client, clock} = left.id;
    return new Skip(createID(client, clock + diff), left.length - diff);
  } else {
    const leftItem = left;
    const {client, clock} = leftItem.id;
    return new Item(createID(client, clock + diff), null, createID(client, clock + diff - 1), null, leftItem.rightOrigin, leftItem.parent, leftItem.parentSub, leftItem.content.splice(diff));
  }
};
const mergeUpdatesV2 = (updates, YDecoder = UpdateDecoderV2, YEncoder = UpdateEncoderV2) => {
  const updateDecoders = updates.map((update) => new YDecoder(createDecoder(update)));
  let lazyStructDecoders = updateDecoders.map((decoder) => new LazyStructReader(decoder, true));
  let currWrite = null;
  const updateEncoder = new YEncoder();
  const lazyStructEncoder = new LazyStructWriter(updateEncoder);
  while (true) {
    lazyStructDecoders = lazyStructDecoders.filter((dec) => dec.curr !== null);
    lazyStructDecoders.sort((dec1, dec2) => {
      if (dec1.curr.id.client === dec2.curr.id.client) {
        const clockDiff = dec1.curr.id.clock - dec2.curr.id.clock;
        if (clockDiff === 0) {
          return dec1.curr.constructor === dec2.curr.constructor ? 0 : dec1.curr.constructor === Skip ? 1 : -1;
        } else {
          return clockDiff;
        }
      } else {
        return dec2.curr.id.client - dec1.curr.id.client;
      }
    });
    if (lazyStructDecoders.length === 0) {
      break;
    }
    const currDecoder = lazyStructDecoders[0];
    const firstClient = currDecoder.curr.id.client;
    if (currWrite !== null) {
      let curr = currDecoder.curr;
      while (curr !== null && curr.id.clock + curr.length <= currWrite.struct.id.clock + currWrite.struct.length && curr.id.client >= currWrite.struct.id.client) {
        curr = currDecoder.next();
      }
      if (curr === null || curr.id.client !== firstClient) {
        continue;
      }
      if (firstClient !== currWrite.struct.id.client) {
        writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
        currWrite = {struct: curr, offset: 0};
        currDecoder.next();
      } else {
        if (currWrite.struct.id.clock + currWrite.struct.length < curr.id.clock) {
          if (currWrite.struct.constructor === Skip) {
            currWrite.struct.length = curr.id.clock + curr.length - currWrite.struct.id.clock;
          } else {
            writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
            const diff = curr.id.clock - currWrite.struct.id.clock - currWrite.struct.length;
            const struct = new Skip(createID(firstClient, currWrite.struct.id.clock + currWrite.struct.length), diff);
            currWrite = {struct, offset: 0};
          }
        } else {
          const diff = currWrite.struct.id.clock + currWrite.struct.length - curr.id.clock;
          if (diff > 0) {
            if (currWrite.struct.constructor === Skip) {
              currWrite.struct.length -= diff;
            } else {
              curr = sliceStruct(curr, diff);
            }
          }
          if (!currWrite.struct.mergeWith(curr)) {
            writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
            currWrite = {struct: curr, offset: 0};
            currDecoder.next();
          }
        }
      }
    } else {
      currWrite = {struct: currDecoder.curr, offset: 0};
      currDecoder.next();
    }
    for (let next = currDecoder.curr; next !== null && next.id.client === firstClient && next.id.clock === currWrite.struct.id.clock + currWrite.struct.length && next.constructor !== Skip; next = currDecoder.next()) {
      writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
      currWrite = {struct: next, offset: 0};
    }
  }
  if (currWrite !== null) {
    writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
    currWrite = null;
  }
  finishLazyStructWriting(lazyStructEncoder);
  const dss = updateDecoders.map((decoder) => readDeleteSet(decoder));
  const ds = mergeDeleteSets(dss);
  writeDeleteSet(updateEncoder, ds);
  return updateEncoder.toUint8Array();
};
const diffUpdateV2 = (update, sv, YDecoder = UpdateDecoderV2, YEncoder = UpdateEncoderV2) => {
  const state = decodeStateVector(sv);
  const encoder = new YEncoder();
  const lazyStructWriter = new LazyStructWriter(encoder);
  const decoder = new YDecoder(createDecoder(update));
  const reader = new LazyStructReader(decoder, false);
  while (reader.curr) {
    const curr = reader.curr;
    const currClient = curr.id.client;
    const svClock = state.get(currClient) || 0;
    if (reader.curr.constructor === Skip) {
      reader.next();
      continue;
    }
    if (curr.id.clock + curr.length > svClock) {
      writeStructToLazyStructWriter(lazyStructWriter, curr, max(svClock - curr.id.clock, 0));
      reader.next();
      while (reader.curr && reader.curr.id.client === currClient) {
        writeStructToLazyStructWriter(lazyStructWriter, reader.curr, 0);
        reader.next();
      }
    } else {
      while (reader.curr && reader.curr.id.client === currClient && reader.curr.id.clock + reader.curr.length <= svClock) {
        reader.next();
      }
    }
  }
  finishLazyStructWriting(lazyStructWriter);
  const ds = readDeleteSet(decoder);
  writeDeleteSet(encoder, ds);
  return encoder.toUint8Array();
};
const flushLazyStructWriter = (lazyWriter) => {
  if (lazyWriter.written > 0) {
    lazyWriter.clientStructs.push({written: lazyWriter.written, restEncoder: toUint8Array(lazyWriter.encoder.restEncoder)});
    lazyWriter.encoder.restEncoder = createEncoder();
    lazyWriter.written = 0;
  }
};
const writeStructToLazyStructWriter = (lazyWriter, struct, offset) => {
  if (lazyWriter.written > 0 && lazyWriter.currClient !== struct.id.client) {
    flushLazyStructWriter(lazyWriter);
  }
  if (lazyWriter.written === 0) {
    lazyWriter.currClient = struct.id.client;
    lazyWriter.encoder.writeClient(struct.id.client);
    writeVarUint(lazyWriter.encoder.restEncoder, struct.id.clock + offset);
  }
  struct.write(lazyWriter.encoder, offset);
  lazyWriter.written++;
};
const finishLazyStructWriting = (lazyWriter) => {
  flushLazyStructWriter(lazyWriter);
  const restEncoder = lazyWriter.encoder.restEncoder;
  writeVarUint(restEncoder, lazyWriter.clientStructs.length);
  for (let i = 0; i < lazyWriter.clientStructs.length; i++) {
    const partStructs = lazyWriter.clientStructs[i];
    writeVarUint(restEncoder, partStructs.written);
    writeUint8Array(restEncoder, partStructs.restEncoder);
  }
};
class YEvent {
  constructor(target, transaction) {
    this.target = target;
    this.currentTarget = target;
    this.transaction = transaction;
    this._changes = null;
    this._keys = null;
    this._delta = null;
  }
  get path() {
    return getPathTo(this.currentTarget, this.target);
  }
  deletes(struct) {
    return isDeleted(this.transaction.deleteSet, struct.id);
  }
  get keys() {
    if (this._keys === null) {
      const keys2 = new Map();
      const target = this.target;
      const changed = this.transaction.changed.get(target);
      changed.forEach((key) => {
        if (key !== null) {
          const item = target._map.get(key);
          let action;
          let oldValue;
          if (this.adds(item)) {
            let prev = item.left;
            while (prev !== null && this.adds(prev)) {
              prev = prev.left;
            }
            if (this.deletes(item)) {
              if (prev !== null && this.deletes(prev)) {
                action = "delete";
                oldValue = last(prev.content.getContent());
              } else {
                return;
              }
            } else {
              if (prev !== null && this.deletes(prev)) {
                action = "update";
                oldValue = last(prev.content.getContent());
              } else {
                action = "add";
                oldValue = void 0;
              }
            }
          } else {
            if (this.deletes(item)) {
              action = "delete";
              oldValue = last(item.content.getContent());
            } else {
              return;
            }
          }
          keys2.set(key, {action, oldValue});
        }
      });
      this._keys = keys2;
    }
    return this._keys;
  }
  get delta() {
    return this.changes.delta;
  }
  adds(struct) {
    return struct.id.clock >= (this.transaction.beforeState.get(struct.id.client) || 0);
  }
  get changes() {
    let changes = this._changes;
    if (changes === null) {
      const target = this.target;
      const added = create$3();
      const deleted = create$3();
      const delta = [];
      changes = {
        added,
        deleted,
        delta,
        keys: this.keys
      };
      const changed = this.transaction.changed.get(target);
      if (changed.has(null)) {
        let lastOp = null;
        const packOp = () => {
          if (lastOp) {
            delta.push(lastOp);
          }
        };
        for (let item = target._start; item !== null; item = item.right) {
          if (item.deleted) {
            if (this.deletes(item) && !this.adds(item)) {
              if (lastOp === null || lastOp.delete === void 0) {
                packOp();
                lastOp = {delete: 0};
              }
              lastOp.delete += item.length;
              deleted.add(item);
            }
          } else {
            if (this.adds(item)) {
              if (lastOp === null || lastOp.insert === void 0) {
                packOp();
                lastOp = {insert: []};
              }
              lastOp.insert = lastOp.insert.concat(item.content.getContent());
              added.add(item);
            } else {
              if (lastOp === null || lastOp.retain === void 0) {
                packOp();
                lastOp = {retain: 0};
              }
              lastOp.retain += item.length;
            }
          }
        }
        if (lastOp !== null && lastOp.retain === void 0) {
          packOp();
        }
      }
      this._changes = changes;
    }
    return changes;
  }
}
const getPathTo = (parent, child) => {
  const path = [];
  while (child._item !== null && child !== parent) {
    if (child._item.parentSub !== null) {
      path.unshift(child._item.parentSub);
    } else {
      let i = 0;
      let c = child._item.parent._start;
      while (c !== child._item && c !== null) {
        if (!c.deleted) {
          i++;
        }
        c = c.right;
      }
      path.unshift(i);
    }
    child = child._item.parent;
  }
  return path;
};
const maxSearchMarker = 80;
let globalSearchMarkerTimestamp = 0;
class ArraySearchMarker {
  constructor(p, index2) {
    p.marker = true;
    this.p = p;
    this.index = index2;
    this.timestamp = globalSearchMarkerTimestamp++;
  }
}
const refreshMarkerTimestamp = (marker) => {
  marker.timestamp = globalSearchMarkerTimestamp++;
};
const overwriteMarker = (marker, p, index2) => {
  marker.p.marker = false;
  marker.p = p;
  p.marker = true;
  marker.index = index2;
  marker.timestamp = globalSearchMarkerTimestamp++;
};
const markPosition = (searchMarker, p, index2) => {
  if (searchMarker.length >= maxSearchMarker) {
    const marker = searchMarker.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
    overwriteMarker(marker, p, index2);
    return marker;
  } else {
    const pm = new ArraySearchMarker(p, index2);
    searchMarker.push(pm);
    return pm;
  }
};
const findMarker = (yarray, index2) => {
  if (yarray._start === null || index2 === 0 || yarray._searchMarker === null) {
    return null;
  }
  const marker = yarray._searchMarker.length === 0 ? null : yarray._searchMarker.reduce((a, b) => abs(index2 - a.index) < abs(index2 - b.index) ? a : b);
  let p = yarray._start;
  let pindex = 0;
  if (marker !== null) {
    p = marker.p;
    pindex = marker.index;
    refreshMarkerTimestamp(marker);
  }
  while (p.right !== null && pindex < index2) {
    if (!p.deleted && p.countable) {
      if (index2 < pindex + p.length) {
        break;
      }
      pindex += p.length;
    }
    p = p.right;
  }
  while (p.left !== null && pindex > index2) {
    p = p.left;
    if (!p.deleted && p.countable) {
      pindex -= p.length;
    }
  }
  while (p.left !== null && p.left.id.client === p.id.client && p.left.id.clock + p.left.length === p.id.clock) {
    p = p.left;
    if (!p.deleted && p.countable) {
      pindex -= p.length;
    }
  }
  if (marker !== null && abs(marker.index - pindex) < p.parent.length / maxSearchMarker) {
    overwriteMarker(marker, p, pindex);
    return marker;
  } else {
    return markPosition(yarray._searchMarker, p, pindex);
  }
};
const updateMarkerChanges = (searchMarker, index2, len) => {
  for (let i = searchMarker.length - 1; i >= 0; i--) {
    const m = searchMarker[i];
    if (len > 0) {
      let p = m.p;
      p.marker = false;
      while (p && (p.deleted || !p.countable)) {
        p = p.left;
        if (p && !p.deleted && p.countable) {
          m.index -= p.length;
        }
      }
      if (p === null || p.marker === true) {
        searchMarker.splice(i, 1);
        continue;
      }
      m.p = p;
      p.marker = true;
    }
    if (index2 < m.index || len > 0 && index2 === m.index) {
      m.index = max(index2, m.index + len);
    }
  }
};
const callTypeObservers = (type, transaction, event) => {
  const changedType = type;
  const changedParentTypes = transaction.changedParentTypes;
  while (true) {
    setIfUndefined(changedParentTypes, type, () => []).push(event);
    if (type._item === null) {
      break;
    }
    type = type._item.parent;
  }
  callEventHandlerListeners(changedType._eH, event, transaction);
};
class AbstractType {
  constructor() {
    this._item = null;
    this._map = new Map();
    this._start = null;
    this.doc = null;
    this._length = 0;
    this._eH = createEventHandler();
    this._dEH = createEventHandler();
    this._searchMarker = null;
  }
  get parent() {
    return this._item ? this._item.parent : null;
  }
  _integrate(y, item) {
    this.doc = y;
    this._item = item;
  }
  _copy() {
    throw methodUnimplemented();
  }
  clone() {
    throw methodUnimplemented();
  }
  _write(encoder) {
  }
  get _first() {
    let n = this._start;
    while (n !== null && n.deleted) {
      n = n.right;
    }
    return n;
  }
  _callObserver(transaction, parentSubs) {
    if (!transaction.local && this._searchMarker) {
      this._searchMarker.length = 0;
    }
  }
  observe(f) {
    addEventHandlerListener(this._eH, f);
  }
  observeDeep(f) {
    addEventHandlerListener(this._dEH, f);
  }
  unobserve(f) {
    removeEventHandlerListener(this._eH, f);
  }
  unobserveDeep(f) {
    removeEventHandlerListener(this._dEH, f);
  }
  toJSON() {
  }
}
const typeListSlice = (type, start, end) => {
  if (start < 0) {
    start = type._length + start;
  }
  if (end < 0) {
    end = type._length + end;
  }
  let len = end - start;
  const cs = [];
  let n = type._start;
  while (n !== null && len > 0) {
    if (n.countable && !n.deleted) {
      const c = n.content.getContent();
      if (c.length <= start) {
        start -= c.length;
      } else {
        for (let i = start; i < c.length && len > 0; i++) {
          cs.push(c[i]);
          len--;
        }
        start = 0;
      }
    }
    n = n.right;
  }
  return cs;
};
const typeListToArray = (type) => {
  const cs = [];
  let n = type._start;
  while (n !== null) {
    if (n.countable && !n.deleted) {
      const c = n.content.getContent();
      for (let i = 0; i < c.length; i++) {
        cs.push(c[i]);
      }
    }
    n = n.right;
  }
  return cs;
};
const typeListForEach = (type, f) => {
  let index2 = 0;
  let n = type._start;
  while (n !== null) {
    if (n.countable && !n.deleted) {
      const c = n.content.getContent();
      for (let i = 0; i < c.length; i++) {
        f(c[i], index2++, type);
      }
    }
    n = n.right;
  }
};
const typeListMap = (type, f) => {
  const result = [];
  typeListForEach(type, (c, i) => {
    result.push(f(c, i, type));
  });
  return result;
};
const typeListCreateIterator = (type) => {
  let n = type._start;
  let currentContent = null;
  let currentContentIndex = 0;
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: () => {
      if (currentContent === null) {
        while (n !== null && n.deleted) {
          n = n.right;
        }
        if (n === null) {
          return {
            done: true,
            value: void 0
          };
        }
        currentContent = n.content.getContent();
        currentContentIndex = 0;
        n = n.right;
      }
      const value = currentContent[currentContentIndex++];
      if (currentContent.length <= currentContentIndex) {
        currentContent = null;
      }
      return {
        done: false,
        value
      };
    }
  };
};
const typeListGet = (type, index2) => {
  const marker = findMarker(type, index2);
  let n = type._start;
  if (marker !== null) {
    n = marker.p;
    index2 -= marker.index;
  }
  for (; n !== null; n = n.right) {
    if (!n.deleted && n.countable) {
      if (index2 < n.length) {
        return n.content.getContent()[index2];
      }
      index2 -= n.length;
    }
  }
};
const typeListInsertGenericsAfter = (transaction, parent, referenceItem, content) => {
  let left = referenceItem;
  const doc = transaction.doc;
  const ownClientId = doc.clientID;
  const store = doc.store;
  const right = referenceItem === null ? parent._start : referenceItem.right;
  let jsonContent = [];
  const packJsonContent = () => {
    if (jsonContent.length > 0) {
      left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentAny(jsonContent));
      left.integrate(transaction, 0);
      jsonContent = [];
    }
  };
  content.forEach((c) => {
    switch (c.constructor) {
      case Number:
      case Object:
      case Boolean:
      case Array:
      case String:
        jsonContent.push(c);
        break;
      default:
        packJsonContent();
        switch (c.constructor) {
          case Uint8Array:
          case ArrayBuffer:
            left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentBinary(new Uint8Array(c)));
            left.integrate(transaction, 0);
            break;
          case Doc:
            left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentDoc(c));
            left.integrate(transaction, 0);
            break;
          default:
            if (c instanceof AbstractType) {
              left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentType(c));
              left.integrate(transaction, 0);
            } else {
              throw new Error("Unexpected content type in insert operation");
            }
        }
    }
  });
  packJsonContent();
};
const typeListInsertGenerics = (transaction, parent, index2, content) => {
  if (index2 === 0) {
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, index2, content.length);
    }
    return typeListInsertGenericsAfter(transaction, parent, null, content);
  }
  const startIndex = index2;
  const marker = findMarker(parent, index2);
  let n = parent._start;
  if (marker !== null) {
    n = marker.p;
    index2 -= marker.index;
    if (index2 === 0) {
      n = n.prev;
      index2 += n && n.countable && !n.deleted ? n.length : 0;
    }
  }
  for (; n !== null; n = n.right) {
    if (!n.deleted && n.countable) {
      if (index2 <= n.length) {
        if (index2 < n.length) {
          getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index2));
        }
        break;
      }
      index2 -= n.length;
    }
  }
  if (parent._searchMarker) {
    updateMarkerChanges(parent._searchMarker, startIndex, content.length);
  }
  return typeListInsertGenericsAfter(transaction, parent, n, content);
};
const typeListDelete = (transaction, parent, index2, length2) => {
  if (length2 === 0) {
    return;
  }
  const startIndex = index2;
  const startLength = length2;
  const marker = findMarker(parent, index2);
  let n = parent._start;
  if (marker !== null) {
    n = marker.p;
    index2 -= marker.index;
  }
  for (; n !== null && index2 > 0; n = n.right) {
    if (!n.deleted && n.countable) {
      if (index2 < n.length) {
        getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index2));
      }
      index2 -= n.length;
    }
  }
  while (length2 > 0 && n !== null) {
    if (!n.deleted) {
      if (length2 < n.length) {
        getItemCleanStart(transaction, createID(n.id.client, n.id.clock + length2));
      }
      n.delete(transaction);
      length2 -= n.length;
    }
    n = n.right;
  }
  if (length2 > 0) {
    throw create$2("array length exceeded");
  }
  if (parent._searchMarker) {
    updateMarkerChanges(parent._searchMarker, startIndex, -startLength + length2);
  }
};
const typeMapDelete = (transaction, parent, key) => {
  const c = parent._map.get(key);
  if (c !== void 0) {
    c.delete(transaction);
  }
};
const typeMapSet = (transaction, parent, key, value) => {
  const left = parent._map.get(key) || null;
  const doc = transaction.doc;
  const ownClientId = doc.clientID;
  let content;
  if (value == null) {
    content = new ContentAny([value]);
  } else {
    switch (value.constructor) {
      case Number:
      case Object:
      case Boolean:
      case Array:
      case String:
        content = new ContentAny([value]);
        break;
      case Uint8Array:
        content = new ContentBinary(value);
        break;
      case Doc:
        content = new ContentDoc(value);
        break;
      default:
        if (value instanceof AbstractType) {
          content = new ContentType(value);
        } else {
          throw new Error("Unexpected content type");
        }
    }
  }
  new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, null, null, parent, key, content).integrate(transaction, 0);
};
const typeMapGet = (parent, key) => {
  const val = parent._map.get(key);
  return val !== void 0 && !val.deleted ? val.content.getContent()[val.length - 1] : void 0;
};
const typeMapGetAll = (parent) => {
  const res = {};
  parent._map.forEach((value, key) => {
    if (!value.deleted) {
      res[key] = value.content.getContent()[value.length - 1];
    }
  });
  return res;
};
const typeMapHas = (parent, key) => {
  const val = parent._map.get(key);
  return val !== void 0 && !val.deleted;
};
const createMapIterator = (map2) => iteratorFilter(map2.entries(), (entry) => !entry[1].deleted);
class YArrayEvent extends YEvent {
  constructor(yarray, transaction) {
    super(yarray, transaction);
    this._transaction = transaction;
  }
}
class YArray extends AbstractType {
  constructor() {
    super();
    this._prelimContent = [];
    this._searchMarker = [];
  }
  static from(items) {
    const a = new YArray();
    a.push(items);
    return a;
  }
  _integrate(y, item) {
    super._integrate(y, item);
    this.insert(0, this._prelimContent);
    this._prelimContent = null;
  }
  _copy() {
    return new YArray();
  }
  clone() {
    const arr = new YArray();
    arr.insert(0, this.toArray().map((el) => el instanceof AbstractType ? el.clone() : el));
    return arr;
  }
  get length() {
    return this._prelimContent === null ? this._length : this._prelimContent.length;
  }
  _callObserver(transaction, parentSubs) {
    super._callObserver(transaction, parentSubs);
    callTypeObservers(this, transaction, new YArrayEvent(this, transaction));
  }
  insert(index2, content) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeListInsertGenerics(transaction, this, index2, content);
      });
    } else {
      this._prelimContent.splice(index2, 0, ...content);
    }
  }
  push(content) {
    this.insert(this.length, content);
  }
  unshift(content) {
    this.insert(0, content);
  }
  delete(index2, length2 = 1) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeListDelete(transaction, this, index2, length2);
      });
    } else {
      this._prelimContent.splice(index2, length2);
    }
  }
  get(index2) {
    return typeListGet(this, index2);
  }
  toArray() {
    return typeListToArray(this);
  }
  slice(start = 0, end = this.length) {
    return typeListSlice(this, start, end);
  }
  toJSON() {
    return this.map((c) => c instanceof AbstractType ? c.toJSON() : c);
  }
  map(f) {
    return typeListMap(this, f);
  }
  forEach(f) {
    typeListForEach(this, f);
  }
  [Symbol.iterator]() {
    return typeListCreateIterator(this);
  }
  _write(encoder) {
    encoder.writeTypeRef(YArrayRefID);
  }
}
const readYArray = (decoder) => new YArray();
class YMapEvent extends YEvent {
  constructor(ymap, transaction, subs) {
    super(ymap, transaction);
    this.keysChanged = subs;
  }
}
class YMap extends AbstractType {
  constructor(entries) {
    super();
    this._prelimContent = null;
    if (entries === void 0) {
      this._prelimContent = new Map();
    } else {
      this._prelimContent = new Map(entries);
    }
  }
  _integrate(y, item) {
    super._integrate(y, item);
    this._prelimContent.forEach((value, key) => {
      this.set(key, value);
    });
    this._prelimContent = null;
  }
  _copy() {
    return new YMap();
  }
  clone() {
    const map2 = new YMap();
    this.forEach((value, key) => {
      map2.set(key, value instanceof AbstractType ? value.clone() : value);
    });
    return map2;
  }
  _callObserver(transaction, parentSubs) {
    callTypeObservers(this, transaction, new YMapEvent(this, transaction, parentSubs));
  }
  toJSON() {
    const map2 = {};
    this._map.forEach((item, key) => {
      if (!item.deleted) {
        const v = item.content.getContent()[item.length - 1];
        map2[key] = v instanceof AbstractType ? v.toJSON() : v;
      }
    });
    return map2;
  }
  get size() {
    return [...createMapIterator(this._map)].length;
  }
  keys() {
    return iteratorMap(createMapIterator(this._map), (v) => v[0]);
  }
  values() {
    return iteratorMap(createMapIterator(this._map), (v) => v[1].content.getContent()[v[1].length - 1]);
  }
  entries() {
    return iteratorMap(createMapIterator(this._map), (v) => [v[0], v[1].content.getContent()[v[1].length - 1]]);
  }
  forEach(f) {
    const map2 = {};
    this._map.forEach((item, key) => {
      if (!item.deleted) {
        f(item.content.getContent()[item.length - 1], key, this);
      }
    });
    return map2;
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  delete(key) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeMapDelete(transaction, this, key);
      });
    } else {
      this._prelimContent.delete(key);
    }
  }
  set(key, value) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeMapSet(transaction, this, key, value);
      });
    } else {
      this._prelimContent.set(key, value);
    }
    return value;
  }
  get(key) {
    return typeMapGet(this, key);
  }
  has(key) {
    return typeMapHas(this, key);
  }
  _write(encoder) {
    encoder.writeTypeRef(YMapRefID);
  }
}
const readYMap = (decoder) => new YMap();
const equalAttrs = (a, b) => a === b || typeof a === "object" && typeof b === "object" && a && b && equalFlat(a, b);
class ItemTextListPosition {
  constructor(left, right, index2, currentAttributes) {
    this.left = left;
    this.right = right;
    this.index = index2;
    this.currentAttributes = currentAttributes;
  }
  forward() {
    if (this.right === null) {
      unexpectedCase();
    }
    switch (this.right.content.constructor) {
      case ContentEmbed:
      case ContentString:
        if (!this.right.deleted) {
          this.index += this.right.length;
        }
        break;
      case ContentFormat:
        if (!this.right.deleted) {
          updateCurrentAttributes(this.currentAttributes, this.right.content);
        }
        break;
    }
    this.left = this.right;
    this.right = this.right.right;
  }
}
const findNextPosition = (transaction, pos, count) => {
  while (pos.right !== null && count > 0) {
    switch (pos.right.content.constructor) {
      case ContentEmbed:
      case ContentString:
        if (!pos.right.deleted) {
          if (count < pos.right.length) {
            getItemCleanStart(transaction, createID(pos.right.id.client, pos.right.id.clock + count));
          }
          pos.index += pos.right.length;
          count -= pos.right.length;
        }
        break;
      case ContentFormat:
        if (!pos.right.deleted) {
          updateCurrentAttributes(pos.currentAttributes, pos.right.content);
        }
        break;
    }
    pos.left = pos.right;
    pos.right = pos.right.right;
  }
  return pos;
};
const findPosition = (transaction, parent, index2) => {
  const currentAttributes = new Map();
  const marker = findMarker(parent, index2);
  if (marker) {
    const pos = new ItemTextListPosition(marker.p.left, marker.p, marker.index, currentAttributes);
    return findNextPosition(transaction, pos, index2 - marker.index);
  } else {
    const pos = new ItemTextListPosition(null, parent._start, 0, currentAttributes);
    return findNextPosition(transaction, pos, index2);
  }
};
const insertNegatedAttributes = (transaction, parent, currPos, negatedAttributes) => {
  while (currPos.right !== null && (currPos.right.deleted === true || currPos.right.content.constructor === ContentFormat && equalAttrs(negatedAttributes.get(currPos.right.content.key), currPos.right.content.value))) {
    if (!currPos.right.deleted) {
      negatedAttributes.delete(currPos.right.content.key);
    }
    currPos.forward();
  }
  const doc = transaction.doc;
  const ownClientId = doc.clientID;
  let nextFormat = currPos.left;
  const right = currPos.right;
  negatedAttributes.forEach((val, key) => {
    nextFormat = new Item(createID(ownClientId, getState(doc.store, ownClientId)), nextFormat, nextFormat && nextFormat.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
    nextFormat.integrate(transaction, 0);
    currPos.right = nextFormat;
  });
};
const updateCurrentAttributes = (currentAttributes, format2) => {
  const {key, value} = format2;
  if (value === null) {
    currentAttributes.delete(key);
  } else {
    currentAttributes.set(key, value);
  }
};
const minimizeAttributeChanges = (currPos, attributes) => {
  while (true) {
    if (currPos.right === null) {
      break;
    } else if (currPos.right.deleted || currPos.right.content.constructor === ContentFormat && equalAttrs(attributes[currPos.right.content.key] || null, currPos.right.content.value))
      ;
    else {
      break;
    }
    currPos.forward();
  }
};
const insertAttributes = (transaction, parent, currPos, attributes) => {
  const doc = transaction.doc;
  const ownClientId = doc.clientID;
  const negatedAttributes = new Map();
  for (const key in attributes) {
    const val = attributes[key];
    const currentVal = currPos.currentAttributes.get(key) || null;
    if (!equalAttrs(currentVal, val)) {
      negatedAttributes.set(key, currentVal);
      const {left, right} = currPos;
      currPos.right = new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
      currPos.right.integrate(transaction, 0);
      currPos.forward();
    }
  }
  return negatedAttributes;
};
const insertText = (transaction, parent, currPos, text, attributes) => {
  currPos.currentAttributes.forEach((val, key) => {
    if (attributes[key] === void 0) {
      attributes[key] = null;
    }
  });
  const doc = transaction.doc;
  const ownClientId = doc.clientID;
  minimizeAttributeChanges(currPos, attributes);
  const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
  const content = text.constructor === String ? new ContentString(text) : new ContentEmbed(text);
  let {left, right, index: index2} = currPos;
  if (parent._searchMarker) {
    updateMarkerChanges(parent._searchMarker, currPos.index, content.getLength());
  }
  right = new Item(createID(ownClientId, getState(doc.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, content);
  right.integrate(transaction, 0);
  currPos.right = right;
  currPos.index = index2;
  currPos.forward();
  insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
};
const formatText = (transaction, parent, currPos, length2, attributes) => {
  const doc = transaction.doc;
  const ownClientId = doc.clientID;
  minimizeAttributeChanges(currPos, attributes);
  const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
  while (length2 > 0 && currPos.right !== null) {
    if (!currPos.right.deleted) {
      switch (currPos.right.content.constructor) {
        case ContentFormat: {
          const {key, value} = currPos.right.content;
          const attr = attributes[key];
          if (attr !== void 0) {
            if (equalAttrs(attr, value)) {
              negatedAttributes.delete(key);
            } else {
              negatedAttributes.set(key, value);
            }
            currPos.right.delete(transaction);
          }
          break;
        }
        case ContentEmbed:
        case ContentString:
          if (length2 < currPos.right.length) {
            getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length2));
          }
          length2 -= currPos.right.length;
          break;
      }
    }
    currPos.forward();
  }
  if (length2 > 0) {
    let newlines = "";
    for (; length2 > 0; length2--) {
      newlines += "\n";
    }
    currPos.right = new Item(createID(ownClientId, getState(doc.store, ownClientId)), currPos.left, currPos.left && currPos.left.lastId, currPos.right, currPos.right && currPos.right.id, parent, null, new ContentString(newlines));
    currPos.right.integrate(transaction, 0);
    currPos.forward();
  }
  insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
};
const cleanupFormattingGap = (transaction, start, end, startAttributes, endAttributes) => {
  while (end && end.content.constructor !== ContentString && end.content.constructor !== ContentEmbed) {
    if (!end.deleted && end.content.constructor === ContentFormat) {
      updateCurrentAttributes(endAttributes, end.content);
    }
    end = end.right;
  }
  let cleanups = 0;
  while (start !== end) {
    if (!start.deleted) {
      const content = start.content;
      switch (content.constructor) {
        case ContentFormat: {
          const {key, value} = content;
          if ((endAttributes.get(key) || null) !== value || (startAttributes.get(key) || null) === value) {
            start.delete(transaction);
            cleanups++;
          }
          break;
        }
      }
    }
    start = start.right;
  }
  return cleanups;
};
const cleanupContextlessFormattingGap = (transaction, item) => {
  while (item && item.right && (item.right.deleted || item.right.content.constructor !== ContentString && item.right.content.constructor !== ContentEmbed)) {
    item = item.right;
  }
  const attrs = new Set();
  while (item && (item.deleted || item.content.constructor !== ContentString && item.content.constructor !== ContentEmbed)) {
    if (!item.deleted && item.content.constructor === ContentFormat) {
      const key = item.content.key;
      if (attrs.has(key)) {
        item.delete(transaction);
      } else {
        attrs.add(key);
      }
    }
    item = item.left;
  }
};
const cleanupYTextFormatting = (type) => {
  let res = 0;
  transact(type.doc, (transaction) => {
    let start = type._start;
    let end = type._start;
    let startAttributes = create$4();
    const currentAttributes = copy(startAttributes);
    while (end) {
      if (end.deleted === false) {
        switch (end.content.constructor) {
          case ContentFormat:
            updateCurrentAttributes(currentAttributes, end.content);
            break;
          case ContentEmbed:
          case ContentString:
            res += cleanupFormattingGap(transaction, start, end, startAttributes, currentAttributes);
            startAttributes = copy(currentAttributes);
            start = end;
            break;
        }
      }
      end = end.right;
    }
  });
  return res;
};
const deleteText = (transaction, currPos, length2) => {
  const startLength = length2;
  const startAttrs = copy(currPos.currentAttributes);
  const start = currPos.right;
  while (length2 > 0 && currPos.right !== null) {
    if (currPos.right.deleted === false) {
      switch (currPos.right.content.constructor) {
        case ContentEmbed:
        case ContentString:
          if (length2 < currPos.right.length) {
            getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length2));
          }
          length2 -= currPos.right.length;
          currPos.right.delete(transaction);
          break;
      }
    }
    currPos.forward();
  }
  if (start) {
    cleanupFormattingGap(transaction, start, currPos.right, startAttrs, copy(currPos.currentAttributes));
  }
  const parent = (currPos.left || currPos.right).parent;
  if (parent._searchMarker) {
    updateMarkerChanges(parent._searchMarker, currPos.index, -startLength + length2);
  }
  return currPos;
};
class YTextEvent extends YEvent {
  constructor(ytext, transaction, subs) {
    super(ytext, transaction);
    this.childListChanged = false;
    this.keysChanged = new Set();
    subs.forEach((sub) => {
      if (sub === null) {
        this.childListChanged = true;
      } else {
        this.keysChanged.add(sub);
      }
    });
  }
  get changes() {
    if (this._changes === null) {
      const changes = {
        keys: this.keys,
        delta: this.delta,
        added: new Set(),
        deleted: new Set()
      };
      this._changes = changes;
    }
    return this._changes;
  }
  get delta() {
    if (this._delta === null) {
      const y = this.target.doc;
      const delta = [];
      transact(y, (transaction) => {
        const currentAttributes = new Map();
        const oldAttributes = new Map();
        let item = this.target._start;
        let action = null;
        const attributes = {};
        let insert = "";
        let retain = 0;
        let deleteLen = 0;
        const addOp = () => {
          if (action !== null) {
            let op;
            switch (action) {
              case "delete":
                op = {delete: deleteLen};
                deleteLen = 0;
                break;
              case "insert":
                op = {insert};
                if (currentAttributes.size > 0) {
                  op.attributes = {};
                  currentAttributes.forEach((value, key) => {
                    if (value !== null) {
                      op.attributes[key] = value;
                    }
                  });
                }
                insert = "";
                break;
              case "retain":
                op = {retain};
                if (Object.keys(attributes).length > 0) {
                  op.attributes = {};
                  for (const key in attributes) {
                    op.attributes[key] = attributes[key];
                  }
                }
                retain = 0;
                break;
            }
            delta.push(op);
            action = null;
          }
        };
        while (item !== null) {
          switch (item.content.constructor) {
            case ContentEmbed:
              if (this.adds(item)) {
                if (!this.deletes(item)) {
                  addOp();
                  action = "insert";
                  insert = item.content.embed;
                  addOp();
                }
              } else if (this.deletes(item)) {
                if (action !== "delete") {
                  addOp();
                  action = "delete";
                }
                deleteLen += 1;
              } else if (!item.deleted) {
                if (action !== "retain") {
                  addOp();
                  action = "retain";
                }
                retain += 1;
              }
              break;
            case ContentString:
              if (this.adds(item)) {
                if (!this.deletes(item)) {
                  if (action !== "insert") {
                    addOp();
                    action = "insert";
                  }
                  insert += item.content.str;
                }
              } else if (this.deletes(item)) {
                if (action !== "delete") {
                  addOp();
                  action = "delete";
                }
                deleteLen += item.length;
              } else if (!item.deleted) {
                if (action !== "retain") {
                  addOp();
                  action = "retain";
                }
                retain += item.length;
              }
              break;
            case ContentFormat: {
              const {key, value} = item.content;
              if (this.adds(item)) {
                if (!this.deletes(item)) {
                  const curVal = currentAttributes.get(key) || null;
                  if (!equalAttrs(curVal, value)) {
                    if (action === "retain") {
                      addOp();
                    }
                    if (equalAttrs(value, oldAttributes.get(key) || null)) {
                      delete attributes[key];
                    } else {
                      attributes[key] = value;
                    }
                  } else {
                    item.delete(transaction);
                  }
                }
              } else if (this.deletes(item)) {
                oldAttributes.set(key, value);
                const curVal = currentAttributes.get(key) || null;
                if (!equalAttrs(curVal, value)) {
                  if (action === "retain") {
                    addOp();
                  }
                  attributes[key] = curVal;
                }
              } else if (!item.deleted) {
                oldAttributes.set(key, value);
                const attr = attributes[key];
                if (attr !== void 0) {
                  if (!equalAttrs(attr, value)) {
                    if (action === "retain") {
                      addOp();
                    }
                    if (value === null) {
                      attributes[key] = value;
                    } else {
                      delete attributes[key];
                    }
                  } else {
                    item.delete(transaction);
                  }
                }
              }
              if (!item.deleted) {
                if (action === "insert") {
                  addOp();
                }
                updateCurrentAttributes(currentAttributes, item.content);
              }
              break;
            }
          }
          item = item.right;
        }
        addOp();
        while (delta.length > 0) {
          const lastOp = delta[delta.length - 1];
          if (lastOp.retain !== void 0 && lastOp.attributes === void 0) {
            delta.pop();
          } else {
            break;
          }
        }
      });
      this._delta = delta;
    }
    return this._delta;
  }
}
class YText extends AbstractType {
  constructor(string) {
    super();
    this._pending = string !== void 0 ? [() => this.insert(0, string)] : [];
    this._searchMarker = [];
  }
  get length() {
    return this._length;
  }
  _integrate(y, item) {
    super._integrate(y, item);
    try {
      this._pending.forEach((f) => f());
    } catch (e) {
      console.error(e);
    }
    this._pending = null;
  }
  _copy() {
    return new YText();
  }
  clone() {
    const text = new YText();
    text.applyDelta(this.toDelta());
    return text;
  }
  _callObserver(transaction, parentSubs) {
    super._callObserver(transaction, parentSubs);
    const event = new YTextEvent(this, transaction, parentSubs);
    const doc = transaction.doc;
    if (!transaction.local) {
      let foundFormattingItem = false;
      for (const [client, afterClock] of transaction.afterState.entries()) {
        const clock = transaction.beforeState.get(client) || 0;
        if (afterClock === clock) {
          continue;
        }
        iterateStructs(transaction, doc.store.clients.get(client), clock, afterClock, (item) => {
          if (!item.deleted && item.content.constructor === ContentFormat) {
            foundFormattingItem = true;
          }
        });
        if (foundFormattingItem) {
          break;
        }
      }
      if (!foundFormattingItem) {
        iterateDeletedStructs(transaction, transaction.deleteSet, (item) => {
          if (item instanceof GC || foundFormattingItem) {
            return;
          }
          if (item.parent === this && item.content.constructor === ContentFormat) {
            foundFormattingItem = true;
          }
        });
      }
      transact(doc, (t) => {
        if (foundFormattingItem) {
          cleanupYTextFormatting(this);
        } else {
          iterateDeletedStructs(t, t.deleteSet, (item) => {
            if (item instanceof GC) {
              return;
            }
            if (item.parent === this) {
              cleanupContextlessFormattingGap(t, item);
            }
          });
        }
      });
    }
    callTypeObservers(this, transaction, event);
  }
  toString() {
    let str = "";
    let n = this._start;
    while (n !== null) {
      if (!n.deleted && n.countable && n.content.constructor === ContentString) {
        str += n.content.str;
      }
      n = n.right;
    }
    return str;
  }
  toJSON() {
    return this.toString();
  }
  applyDelta(delta, {sanitize = true} = {}) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        const currPos = new ItemTextListPosition(null, this._start, 0, new Map());
        for (let i = 0; i < delta.length; i++) {
          const op = delta[i];
          if (op.insert !== void 0) {
            const ins = !sanitize && typeof op.insert === "string" && i === delta.length - 1 && currPos.right === null && op.insert.slice(-1) === "\n" ? op.insert.slice(0, -1) : op.insert;
            if (typeof ins !== "string" || ins.length > 0) {
              insertText(transaction, this, currPos, ins, op.attributes || {});
            }
          } else if (op.retain !== void 0) {
            formatText(transaction, this, currPos, op.retain, op.attributes || {});
          } else if (op.delete !== void 0) {
            deleteText(transaction, currPos, op.delete);
          }
        }
      });
    } else {
      this._pending.push(() => this.applyDelta(delta));
    }
  }
  toDelta(snapshot, prevSnapshot, computeYChange) {
    const ops = [];
    const currentAttributes = new Map();
    const doc = this.doc;
    let str = "";
    let n = this._start;
    function packStr() {
      if (str.length > 0) {
        const attributes = {};
        let addAttributes = false;
        currentAttributes.forEach((value, key) => {
          addAttributes = true;
          attributes[key] = value;
        });
        const op = {insert: str};
        if (addAttributes) {
          op.attributes = attributes;
        }
        ops.push(op);
        str = "";
      }
    }
    transact(doc, (transaction) => {
      if (snapshot) {
        splitSnapshotAffectedStructs(transaction, snapshot);
      }
      if (prevSnapshot) {
        splitSnapshotAffectedStructs(transaction, prevSnapshot);
      }
      while (n !== null) {
        if (isVisible(n, snapshot) || prevSnapshot !== void 0 && isVisible(n, prevSnapshot)) {
          switch (n.content.constructor) {
            case ContentString: {
              const cur = currentAttributes.get("ychange");
              if (snapshot !== void 0 && !isVisible(n, snapshot)) {
                if (cur === void 0 || cur.user !== n.id.client || cur.state !== "removed") {
                  packStr();
                  currentAttributes.set("ychange", computeYChange ? computeYChange("removed", n.id) : {type: "removed"});
                }
              } else if (prevSnapshot !== void 0 && !isVisible(n, prevSnapshot)) {
                if (cur === void 0 || cur.user !== n.id.client || cur.state !== "added") {
                  packStr();
                  currentAttributes.set("ychange", computeYChange ? computeYChange("added", n.id) : {type: "added"});
                }
              } else if (cur !== void 0) {
                packStr();
                currentAttributes.delete("ychange");
              }
              str += n.content.str;
              break;
            }
            case ContentEmbed: {
              packStr();
              const op = {
                insert: n.content.embed
              };
              if (currentAttributes.size > 0) {
                const attrs = {};
                op.attributes = attrs;
                currentAttributes.forEach((value, key) => {
                  attrs[key] = value;
                });
              }
              ops.push(op);
              break;
            }
            case ContentFormat:
              if (isVisible(n, snapshot)) {
                packStr();
                updateCurrentAttributes(currentAttributes, n.content);
              }
              break;
          }
        }
        n = n.right;
      }
      packStr();
    }, splitSnapshotAffectedStructs);
    return ops;
  }
  insert(index2, text, attributes) {
    if (text.length <= 0) {
      return;
    }
    const y = this.doc;
    if (y !== null) {
      transact(y, (transaction) => {
        const pos = findPosition(transaction, this, index2);
        if (!attributes) {
          attributes = {};
          pos.currentAttributes.forEach((v, k) => {
            attributes[k] = v;
          });
        }
        insertText(transaction, this, pos, text, attributes);
      });
    } else {
      this._pending.push(() => this.insert(index2, text, attributes));
    }
  }
  insertEmbed(index2, embed, attributes = {}) {
    if (embed.constructor !== Object) {
      throw new Error("Embed must be an Object");
    }
    const y = this.doc;
    if (y !== null) {
      transact(y, (transaction) => {
        const pos = findPosition(transaction, this, index2);
        insertText(transaction, this, pos, embed, attributes);
      });
    } else {
      this._pending.push(() => this.insertEmbed(index2, embed, attributes));
    }
  }
  delete(index2, length2) {
    if (length2 === 0) {
      return;
    }
    const y = this.doc;
    if (y !== null) {
      transact(y, (transaction) => {
        deleteText(transaction, findPosition(transaction, this, index2), length2);
      });
    } else {
      this._pending.push(() => this.delete(index2, length2));
    }
  }
  format(index2, length2, attributes) {
    if (length2 === 0) {
      return;
    }
    const y = this.doc;
    if (y !== null) {
      transact(y, (transaction) => {
        const pos = findPosition(transaction, this, index2);
        if (pos.right === null) {
          return;
        }
        formatText(transaction, this, pos, length2, attributes);
      });
    } else {
      this._pending.push(() => this.format(index2, length2, attributes));
    }
  }
  removeAttribute(attributeName) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeMapDelete(transaction, this, attributeName);
      });
    } else {
      this._pending.push(() => this.removeAttribute(attributeName));
    }
  }
  setAttribute(attributeName, attributeValue) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeMapSet(transaction, this, attributeName, attributeValue);
      });
    } else {
      this._pending.push(() => this.setAttribute(attributeName, attributeValue));
    }
  }
  getAttribute(attributeName) {
    return typeMapGet(this, attributeName);
  }
  getAttributes(snapshot) {
    return typeMapGetAll(this);
  }
  _write(encoder) {
    encoder.writeTypeRef(YTextRefID);
  }
}
const readYText = (decoder) => new YText();
class YXmlTreeWalker {
  constructor(root, f = () => true) {
    this._filter = f;
    this._root = root;
    this._currentNode = root._start;
    this._firstCall = true;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    let n = this._currentNode;
    let type = n.content.type;
    if (n !== null && (!this._firstCall || n.deleted || !this._filter(type))) {
      do {
        type = n.content.type;
        if (!n.deleted && (type.constructor === YXmlElement || type.constructor === YXmlFragment) && type._start !== null) {
          n = type._start;
        } else {
          while (n !== null) {
            if (n.right !== null) {
              n = n.right;
              break;
            } else if (n.parent === this._root) {
              n = null;
            } else {
              n = n.parent._item;
            }
          }
        }
      } while (n !== null && (n.deleted || !this._filter(n.content.type)));
    }
    this._firstCall = false;
    if (n === null) {
      return {value: void 0, done: true};
    }
    this._currentNode = n;
    return {value: n.content.type, done: false};
  }
}
class YXmlFragment extends AbstractType {
  constructor() {
    super();
    this._prelimContent = [];
  }
  get firstChild() {
    const first = this._first;
    return first ? first.content.getContent()[0] : null;
  }
  _integrate(y, item) {
    super._integrate(y, item);
    this.insert(0, this._prelimContent);
    this._prelimContent = null;
  }
  _copy() {
    return new YXmlFragment();
  }
  clone() {
    const el = new YXmlFragment();
    el.insert(0, el.toArray().map((item) => item instanceof AbstractType ? item.clone() : item));
    return el;
  }
  get length() {
    return this._prelimContent === null ? this._length : this._prelimContent.length;
  }
  createTreeWalker(filter) {
    return new YXmlTreeWalker(this, filter);
  }
  querySelector(query) {
    query = query.toUpperCase();
    const iterator = new YXmlTreeWalker(this, (element) => element.nodeName && element.nodeName.toUpperCase() === query);
    const next = iterator.next();
    if (next.done) {
      return null;
    } else {
      return next.value;
    }
  }
  querySelectorAll(query) {
    query = query.toUpperCase();
    return Array.from(new YXmlTreeWalker(this, (element) => element.nodeName && element.nodeName.toUpperCase() === query));
  }
  _callObserver(transaction, parentSubs) {
    callTypeObservers(this, transaction, new YXmlEvent(this, parentSubs, transaction));
  }
  toString() {
    return typeListMap(this, (xml) => xml.toString()).join("");
  }
  toJSON() {
    return this.toString();
  }
  toDOM(_document = document, hooks2 = {}, binding) {
    const fragment = _document.createDocumentFragment();
    if (binding !== void 0) {
      binding._createAssociation(fragment, this);
    }
    typeListForEach(this, (xmlType) => {
      fragment.insertBefore(xmlType.toDOM(_document, hooks2, binding), null);
    });
    return fragment;
  }
  insert(index2, content) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeListInsertGenerics(transaction, this, index2, content);
      });
    } else {
      this._prelimContent.splice(index2, 0, ...content);
    }
  }
  insertAfter(ref, content) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        const refItem = ref && ref instanceof AbstractType ? ref._item : ref;
        typeListInsertGenericsAfter(transaction, this, refItem, content);
      });
    } else {
      const pc = this._prelimContent;
      const index2 = ref === null ? 0 : pc.findIndex((el) => el === ref) + 1;
      if (index2 === 0 && ref !== null) {
        throw create$2("Reference item not found");
      }
      pc.splice(index2, 0, ...content);
    }
  }
  delete(index2, length2 = 1) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeListDelete(transaction, this, index2, length2);
      });
    } else {
      this._prelimContent.splice(index2, length2);
    }
  }
  toArray() {
    return typeListToArray(this);
  }
  push(content) {
    this.insert(this.length, content);
  }
  unshift(content) {
    this.insert(0, content);
  }
  get(index2) {
    return typeListGet(this, index2);
  }
  slice(start = 0, end = this.length) {
    return typeListSlice(this, start, end);
  }
  _write(encoder) {
    encoder.writeTypeRef(YXmlFragmentRefID);
  }
}
const readYXmlFragment = (decoder) => new YXmlFragment();
class YXmlElement extends YXmlFragment {
  constructor(nodeName = "UNDEFINED") {
    super();
    this.nodeName = nodeName;
    this._prelimAttrs = new Map();
  }
  get nextSibling() {
    const n = this._item ? this._item.next : null;
    return n ? n.content.type : null;
  }
  get prevSibling() {
    const n = this._item ? this._item.prev : null;
    return n ? n.content.type : null;
  }
  _integrate(y, item) {
    super._integrate(y, item);
    this._prelimAttrs.forEach((value, key) => {
      this.setAttribute(key, value);
    });
    this._prelimAttrs = null;
  }
  _copy() {
    return new YXmlElement(this.nodeName);
  }
  clone() {
    const el = new YXmlElement(this.nodeName);
    const attrs = this.getAttributes();
    for (const key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
    el.insert(0, el.toArray().map((item) => item instanceof AbstractType ? item.clone() : item));
    return el;
  }
  toString() {
    const attrs = this.getAttributes();
    const stringBuilder = [];
    const keys2 = [];
    for (const key in attrs) {
      keys2.push(key);
    }
    keys2.sort();
    const keysLen = keys2.length;
    for (let i = 0; i < keysLen; i++) {
      const key = keys2[i];
      stringBuilder.push(key + '="' + attrs[key] + '"');
    }
    const nodeName = this.nodeName.toLocaleLowerCase();
    const attrsString = stringBuilder.length > 0 ? " " + stringBuilder.join(" ") : "";
    return `<${nodeName}${attrsString}>${super.toString()}</${nodeName}>`;
  }
  removeAttribute(attributeName) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeMapDelete(transaction, this, attributeName);
      });
    } else {
      this._prelimAttrs.delete(attributeName);
    }
  }
  setAttribute(attributeName, attributeValue) {
    if (this.doc !== null) {
      transact(this.doc, (transaction) => {
        typeMapSet(transaction, this, attributeName, attributeValue);
      });
    } else {
      this._prelimAttrs.set(attributeName, attributeValue);
    }
  }
  getAttribute(attributeName) {
    return typeMapGet(this, attributeName);
  }
  getAttributes(snapshot) {
    return typeMapGetAll(this);
  }
  toDOM(_document = document, hooks2 = {}, binding) {
    const dom = _document.createElement(this.nodeName);
    const attrs = this.getAttributes();
    for (const key in attrs) {
      dom.setAttribute(key, attrs[key]);
    }
    typeListForEach(this, (yxml) => {
      dom.appendChild(yxml.toDOM(_document, hooks2, binding));
    });
    if (binding !== void 0) {
      binding._createAssociation(dom, this);
    }
    return dom;
  }
  _write(encoder) {
    encoder.writeTypeRef(YXmlElementRefID);
    encoder.writeKey(this.nodeName);
  }
}
const readYXmlElement = (decoder) => new YXmlElement(decoder.readKey());
class YXmlEvent extends YEvent {
  constructor(target, subs, transaction) {
    super(target, transaction);
    this.childListChanged = false;
    this.attributesChanged = new Set();
    subs.forEach((sub) => {
      if (sub === null) {
        this.childListChanged = true;
      } else {
        this.attributesChanged.add(sub);
      }
    });
  }
}
class YXmlHook extends YMap {
  constructor(hookName) {
    super();
    this.hookName = hookName;
  }
  _copy() {
    return new YXmlHook(this.hookName);
  }
  clone() {
    const el = new YXmlHook(this.hookName);
    this.forEach((value, key) => {
      el.set(key, value);
    });
    return el;
  }
  toDOM(_document = document, hooks2 = {}, binding) {
    const hook = hooks2[this.hookName];
    let dom;
    if (hook !== void 0) {
      dom = hook.createDom(this);
    } else {
      dom = document.createElement(this.hookName);
    }
    dom.setAttribute("data-yjs-hook", this.hookName);
    if (binding !== void 0) {
      binding._createAssociation(dom, this);
    }
    return dom;
  }
  _write(encoder) {
    encoder.writeTypeRef(YXmlHookRefID);
    encoder.writeKey(this.hookName);
  }
}
const readYXmlHook = (decoder) => new YXmlHook(decoder.readKey());
class YXmlText extends YText {
  get nextSibling() {
    const n = this._item ? this._item.next : null;
    return n ? n.content.type : null;
  }
  get prevSibling() {
    const n = this._item ? this._item.prev : null;
    return n ? n.content.type : null;
  }
  _copy() {
    return new YXmlText();
  }
  clone() {
    const text = new YXmlText();
    text.applyDelta(this.toDelta());
    return text;
  }
  toDOM(_document = document, hooks2, binding) {
    const dom = _document.createTextNode(this.toString());
    if (binding !== void 0) {
      binding._createAssociation(dom, this);
    }
    return dom;
  }
  toString() {
    return this.toDelta().map((delta) => {
      const nestedNodes = [];
      for (const nodeName in delta.attributes) {
        const attrs = [];
        for (const key in delta.attributes[nodeName]) {
          attrs.push({key, value: delta.attributes[nodeName][key]});
        }
        attrs.sort((a, b) => a.key < b.key ? -1 : 1);
        nestedNodes.push({nodeName, attrs});
      }
      nestedNodes.sort((a, b) => a.nodeName < b.nodeName ? -1 : 1);
      let str = "";
      for (let i = 0; i < nestedNodes.length; i++) {
        const node = nestedNodes[i];
        str += `<${node.nodeName}`;
        for (let j = 0; j < node.attrs.length; j++) {
          const attr = node.attrs[j];
          str += ` ${attr.key}="${attr.value}"`;
        }
        str += ">";
      }
      str += delta.insert;
      for (let i = nestedNodes.length - 1; i >= 0; i--) {
        str += `</${nestedNodes[i].nodeName}>`;
      }
      return str;
    }).join("");
  }
  toJSON() {
    return this.toString();
  }
  _write(encoder) {
    encoder.writeTypeRef(YXmlTextRefID);
  }
}
const readYXmlText = (decoder) => new YXmlText();
class AbstractStruct {
  constructor(id, length2) {
    this.id = id;
    this.length = length2;
  }
  get deleted() {
    throw methodUnimplemented();
  }
  mergeWith(right) {
    return false;
  }
  write(encoder, offset, encodingRef) {
    throw methodUnimplemented();
  }
  integrate(transaction, offset) {
    throw methodUnimplemented();
  }
}
const structGCRefNumber = 0;
class GC extends AbstractStruct {
  get deleted() {
    return true;
  }
  delete() {
  }
  mergeWith(right) {
    if (this.constructor !== right.constructor) {
      return false;
    }
    this.length += right.length;
    return true;
  }
  integrate(transaction, offset) {
    if (offset > 0) {
      this.id.clock += offset;
      this.length -= offset;
    }
    addStruct(transaction.doc.store, this);
  }
  write(encoder, offset) {
    encoder.writeInfo(structGCRefNumber);
    encoder.writeLen(this.length - offset);
  }
  getMissing(transaction, store) {
    return null;
  }
}
class ContentBinary {
  constructor(content) {
    this.content = content;
  }
  getLength() {
    return 1;
  }
  getContent() {
    return [this.content];
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentBinary(this.content);
  }
  splice(offset) {
    throw methodUnimplemented();
  }
  mergeWith(right) {
    return false;
  }
  integrate(transaction, item) {
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    encoder.writeBuf(this.content);
  }
  getRef() {
    return 3;
  }
}
const readContentBinary = (decoder) => new ContentBinary(decoder.readBuf());
class ContentDeleted {
  constructor(len) {
    this.len = len;
  }
  getLength() {
    return this.len;
  }
  getContent() {
    return [];
  }
  isCountable() {
    return false;
  }
  copy() {
    return new ContentDeleted(this.len);
  }
  splice(offset) {
    const right = new ContentDeleted(this.len - offset);
    this.len = offset;
    return right;
  }
  mergeWith(right) {
    this.len += right.len;
    return true;
  }
  integrate(transaction, item) {
    addToDeleteSet(transaction.deleteSet, item.id.client, item.id.clock, this.len);
    item.markDeleted();
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    encoder.writeLen(this.len - offset);
  }
  getRef() {
    return 1;
  }
}
const readContentDeleted = (decoder) => new ContentDeleted(decoder.readLen());
class ContentDoc {
  constructor(doc) {
    if (doc._item) {
      console.error("This document was already integrated as a sub-document. You should create a second instance instead with the same guid.");
    }
    this.doc = doc;
    const opts = {};
    this.opts = opts;
    if (!doc.gc) {
      opts.gc = false;
    }
    if (doc.autoLoad) {
      opts.autoLoad = true;
    }
    if (doc.meta !== null) {
      opts.meta = doc.meta;
    }
  }
  getLength() {
    return 1;
  }
  getContent() {
    return [this.doc];
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentDoc(this.doc);
  }
  splice(offset) {
    throw methodUnimplemented();
  }
  mergeWith(right) {
    return false;
  }
  integrate(transaction, item) {
    this.doc._item = item;
    transaction.subdocsAdded.add(this.doc);
    if (this.doc.shouldLoad) {
      transaction.subdocsLoaded.add(this.doc);
    }
  }
  delete(transaction) {
    if (transaction.subdocsAdded.has(this.doc)) {
      transaction.subdocsAdded.delete(this.doc);
    } else {
      transaction.subdocsRemoved.add(this.doc);
    }
  }
  gc(store) {
  }
  write(encoder, offset) {
    encoder.writeString(this.doc.guid);
    encoder.writeAny(this.opts);
  }
  getRef() {
    return 9;
  }
}
const readContentDoc = (decoder) => new ContentDoc(new Doc({guid: decoder.readString(), ...decoder.readAny()}));
class ContentEmbed {
  constructor(embed) {
    this.embed = embed;
  }
  getLength() {
    return 1;
  }
  getContent() {
    return [this.embed];
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentEmbed(this.embed);
  }
  splice(offset) {
    throw methodUnimplemented();
  }
  mergeWith(right) {
    return false;
  }
  integrate(transaction, item) {
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    encoder.writeJSON(this.embed);
  }
  getRef() {
    return 5;
  }
}
const readContentEmbed = (decoder) => new ContentEmbed(decoder.readJSON());
class ContentFormat {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
  getLength() {
    return 1;
  }
  getContent() {
    return [];
  }
  isCountable() {
    return false;
  }
  copy() {
    return new ContentFormat(this.key, this.value);
  }
  splice(offset) {
    throw methodUnimplemented();
  }
  mergeWith(right) {
    return false;
  }
  integrate(transaction, item) {
    item.parent._searchMarker = null;
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    encoder.writeKey(this.key);
    encoder.writeJSON(this.value);
  }
  getRef() {
    return 6;
  }
}
const readContentFormat = (decoder) => new ContentFormat(decoder.readString(), decoder.readJSON());
class ContentJSON {
  constructor(arr) {
    this.arr = arr;
  }
  getLength() {
    return this.arr.length;
  }
  getContent() {
    return this.arr;
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentJSON(this.arr);
  }
  splice(offset) {
    const right = new ContentJSON(this.arr.slice(offset));
    this.arr = this.arr.slice(0, offset);
    return right;
  }
  mergeWith(right) {
    this.arr = this.arr.concat(right.arr);
    return true;
  }
  integrate(transaction, item) {
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    const len = this.arr.length;
    encoder.writeLen(len - offset);
    for (let i = offset; i < len; i++) {
      const c = this.arr[i];
      encoder.writeString(c === void 0 ? "undefined" : JSON.stringify(c));
    }
  }
  getRef() {
    return 2;
  }
}
const readContentJSON = (decoder) => {
  const len = decoder.readLen();
  const cs = [];
  for (let i = 0; i < len; i++) {
    const c = decoder.readString();
    if (c === "undefined") {
      cs.push(void 0);
    } else {
      cs.push(JSON.parse(c));
    }
  }
  return new ContentJSON(cs);
};
class ContentAny {
  constructor(arr) {
    this.arr = arr;
  }
  getLength() {
    return this.arr.length;
  }
  getContent() {
    return this.arr;
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentAny(this.arr);
  }
  splice(offset) {
    const right = new ContentAny(this.arr.slice(offset));
    this.arr = this.arr.slice(0, offset);
    return right;
  }
  mergeWith(right) {
    this.arr = this.arr.concat(right.arr);
    return true;
  }
  integrate(transaction, item) {
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    const len = this.arr.length;
    encoder.writeLen(len - offset);
    for (let i = offset; i < len; i++) {
      const c = this.arr[i];
      encoder.writeAny(c);
    }
  }
  getRef() {
    return 8;
  }
}
const readContentAny = (decoder) => {
  const len = decoder.readLen();
  const cs = [];
  for (let i = 0; i < len; i++) {
    cs.push(decoder.readAny());
  }
  return new ContentAny(cs);
};
class ContentString {
  constructor(str) {
    this.str = str;
  }
  getLength() {
    return this.str.length;
  }
  getContent() {
    return this.str.split("");
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentString(this.str);
  }
  splice(offset) {
    const right = new ContentString(this.str.slice(offset));
    this.str = this.str.slice(0, offset);
    const firstCharCode = this.str.charCodeAt(offset - 1);
    if (firstCharCode >= 55296 && firstCharCode <= 56319) {
      this.str = this.str.slice(0, offset - 1) + "\uFFFD";
      right.str = "\uFFFD" + right.str.slice(1);
    }
    return right;
  }
  mergeWith(right) {
    this.str += right.str;
    return true;
  }
  integrate(transaction, item) {
  }
  delete(transaction) {
  }
  gc(store) {
  }
  write(encoder, offset) {
    encoder.writeString(offset === 0 ? this.str : this.str.slice(offset));
  }
  getRef() {
    return 4;
  }
}
const readContentString = (decoder) => new ContentString(decoder.readString());
const typeRefs = [
  readYArray,
  readYMap,
  readYText,
  readYXmlElement,
  readYXmlFragment,
  readYXmlHook,
  readYXmlText
];
const YArrayRefID = 0;
const YMapRefID = 1;
const YTextRefID = 2;
const YXmlElementRefID = 3;
const YXmlFragmentRefID = 4;
const YXmlHookRefID = 5;
const YXmlTextRefID = 6;
class ContentType {
  constructor(type) {
    this.type = type;
  }
  getLength() {
    return 1;
  }
  getContent() {
    return [this.type];
  }
  isCountable() {
    return true;
  }
  copy() {
    return new ContentType(this.type._copy());
  }
  splice(offset) {
    throw methodUnimplemented();
  }
  mergeWith(right) {
    return false;
  }
  integrate(transaction, item) {
    this.type._integrate(transaction.doc, item);
  }
  delete(transaction) {
    let item = this.type._start;
    while (item !== null) {
      if (!item.deleted) {
        item.delete(transaction);
      } else {
        transaction._mergeStructs.push(item);
      }
      item = item.right;
    }
    this.type._map.forEach((item2) => {
      if (!item2.deleted) {
        item2.delete(transaction);
      } else {
        transaction._mergeStructs.push(item2);
      }
    });
    transaction.changed.delete(this.type);
  }
  gc(store) {
    let item = this.type._start;
    while (item !== null) {
      item.gc(store, true);
      item = item.right;
    }
    this.type._start = null;
    this.type._map.forEach((item2) => {
      while (item2 !== null) {
        item2.gc(store, true);
        item2 = item2.left;
      }
    });
    this.type._map = new Map();
  }
  write(encoder, offset) {
    this.type._write(encoder);
  }
  getRef() {
    return 7;
  }
}
const readContentType = (decoder) => new ContentType(typeRefs[decoder.readTypeRef()](decoder));
const splitItem = (transaction, leftItem, diff) => {
  const {client, clock} = leftItem.id;
  const rightItem = new Item(createID(client, clock + diff), leftItem, createID(client, clock + diff - 1), leftItem.right, leftItem.rightOrigin, leftItem.parent, leftItem.parentSub, leftItem.content.splice(diff));
  if (leftItem.deleted) {
    rightItem.markDeleted();
  }
  if (leftItem.keep) {
    rightItem.keep = true;
  }
  if (leftItem.redone !== null) {
    rightItem.redone = createID(leftItem.redone.client, leftItem.redone.clock + diff);
  }
  leftItem.right = rightItem;
  if (rightItem.right !== null) {
    rightItem.right.left = rightItem;
  }
  transaction._mergeStructs.push(rightItem);
  if (rightItem.parentSub !== null && rightItem.right === null) {
    rightItem.parent._map.set(rightItem.parentSub, rightItem);
  }
  leftItem.length = diff;
  return rightItem;
};
class Item extends AbstractStruct {
  constructor(id, left, origin, right, rightOrigin, parent, parentSub, content) {
    super(id, content.getLength());
    this.origin = origin;
    this.left = left;
    this.right = right;
    this.rightOrigin = rightOrigin;
    this.parent = parent;
    this.parentSub = parentSub;
    this.redone = null;
    this.content = content;
    this.info = this.content.isCountable() ? BIT2 : 0;
  }
  set marker(isMarked) {
    if ((this.info & BIT4) > 0 !== isMarked) {
      this.info ^= BIT4;
    }
  }
  get marker() {
    return (this.info & BIT4) > 0;
  }
  get keep() {
    return (this.info & BIT1) > 0;
  }
  set keep(doKeep) {
    if (this.keep !== doKeep) {
      this.info ^= BIT1;
    }
  }
  get countable() {
    return (this.info & BIT2) > 0;
  }
  get deleted() {
    return (this.info & BIT3) > 0;
  }
  set deleted(doDelete) {
    if (this.deleted !== doDelete) {
      this.info ^= BIT3;
    }
  }
  markDeleted() {
    this.info |= BIT3;
  }
  getMissing(transaction, store) {
    if (this.origin && this.origin.client !== this.id.client && this.origin.clock >= getState(store, this.origin.client)) {
      return this.origin.client;
    }
    if (this.rightOrigin && this.rightOrigin.client !== this.id.client && this.rightOrigin.clock >= getState(store, this.rightOrigin.client)) {
      return this.rightOrigin.client;
    }
    if (this.parent && this.parent.constructor === ID && this.id.client !== this.parent.client && this.parent.clock >= getState(store, this.parent.client)) {
      return this.parent.client;
    }
    if (this.origin) {
      this.left = getItemCleanEnd(transaction, store, this.origin);
      this.origin = this.left.lastId;
    }
    if (this.rightOrigin) {
      this.right = getItemCleanStart(transaction, this.rightOrigin);
      this.rightOrigin = this.right.id;
    }
    if (this.left && this.left.constructor === GC || this.right && this.right.constructor === GC) {
      this.parent = null;
    }
    if (!this.parent) {
      if (this.left && this.left.constructor === Item) {
        this.parent = this.left.parent;
        this.parentSub = this.left.parentSub;
      }
      if (this.right && this.right.constructor === Item) {
        this.parent = this.right.parent;
        this.parentSub = this.right.parentSub;
      }
    } else if (this.parent.constructor === ID) {
      const parentItem = getItem(store, this.parent);
      if (parentItem.constructor === GC) {
        this.parent = null;
      } else {
        this.parent = parentItem.content.type;
      }
    }
    return null;
  }
  integrate(transaction, offset) {
    if (offset > 0) {
      this.id.clock += offset;
      this.left = getItemCleanEnd(transaction, transaction.doc.store, createID(this.id.client, this.id.clock - 1));
      this.origin = this.left.lastId;
      this.content = this.content.splice(offset);
      this.length -= offset;
    }
    if (this.parent) {
      if (!this.left && (!this.right || this.right.left !== null) || this.left && this.left.right !== this.right) {
        let left = this.left;
        let o;
        if (left !== null) {
          o = left.right;
        } else if (this.parentSub !== null) {
          o = this.parent._map.get(this.parentSub) || null;
          while (o !== null && o.left !== null) {
            o = o.left;
          }
        } else {
          o = this.parent._start;
        }
        const conflictingItems = new Set();
        const itemsBeforeOrigin = new Set();
        while (o !== null && o !== this.right) {
          itemsBeforeOrigin.add(o);
          conflictingItems.add(o);
          if (compareIDs(this.origin, o.origin)) {
            if (o.id.client < this.id.client) {
              left = o;
              conflictingItems.clear();
            } else if (compareIDs(this.rightOrigin, o.rightOrigin)) {
              break;
            }
          } else if (o.origin !== null && itemsBeforeOrigin.has(getItem(transaction.doc.store, o.origin))) {
            if (!conflictingItems.has(getItem(transaction.doc.store, o.origin))) {
              left = o;
              conflictingItems.clear();
            }
          } else {
            break;
          }
          o = o.right;
        }
        this.left = left;
      }
      if (this.left !== null) {
        const right = this.left.right;
        this.right = right;
        this.left.right = this;
      } else {
        let r;
        if (this.parentSub !== null) {
          r = this.parent._map.get(this.parentSub) || null;
          while (r !== null && r.left !== null) {
            r = r.left;
          }
        } else {
          r = this.parent._start;
          this.parent._start = this;
        }
        this.right = r;
      }
      if (this.right !== null) {
        this.right.left = this;
      } else if (this.parentSub !== null) {
        this.parent._map.set(this.parentSub, this);
        if (this.left !== null) {
          this.left.delete(transaction);
        }
      }
      if (this.parentSub === null && this.countable && !this.deleted) {
        this.parent._length += this.length;
      }
      addStruct(transaction.doc.store, this);
      this.content.integrate(transaction, this);
      addChangedTypeToTransaction(transaction, this.parent, this.parentSub);
      if (this.parent._item !== null && this.parent._item.deleted || this.parentSub !== null && this.right !== null) {
        this.delete(transaction);
      }
    } else {
      new GC(this.id, this.length).integrate(transaction, 0);
    }
  }
  get next() {
    let n = this.right;
    while (n !== null && n.deleted) {
      n = n.right;
    }
    return n;
  }
  get prev() {
    let n = this.left;
    while (n !== null && n.deleted) {
      n = n.left;
    }
    return n;
  }
  get lastId() {
    return this.length === 1 ? this.id : createID(this.id.client, this.id.clock + this.length - 1);
  }
  mergeWith(right) {
    if (this.constructor === right.constructor && compareIDs(right.origin, this.lastId) && this.right === right && compareIDs(this.rightOrigin, right.rightOrigin) && this.id.client === right.id.client && this.id.clock + this.length === right.id.clock && this.deleted === right.deleted && this.redone === null && right.redone === null && this.content.constructor === right.content.constructor && this.content.mergeWith(right.content)) {
      if (right.keep) {
        this.keep = true;
      }
      this.right = right.right;
      if (this.right !== null) {
        this.right.left = this;
      }
      this.length += right.length;
      return true;
    }
    return false;
  }
  delete(transaction) {
    if (!this.deleted) {
      const parent = this.parent;
      if (this.countable && this.parentSub === null) {
        parent._length -= this.length;
      }
      this.markDeleted();
      addToDeleteSet(transaction.deleteSet, this.id.client, this.id.clock, this.length);
      addChangedTypeToTransaction(transaction, parent, this.parentSub);
      this.content.delete(transaction);
    }
  }
  gc(store, parentGCd) {
    if (!this.deleted) {
      throw unexpectedCase();
    }
    this.content.gc(store);
    if (parentGCd) {
      replaceStruct(store, this, new GC(this.id, this.length));
    } else {
      this.content = new ContentDeleted(this.length);
    }
  }
  write(encoder, offset) {
    const origin = offset > 0 ? createID(this.id.client, this.id.clock + offset - 1) : this.origin;
    const rightOrigin = this.rightOrigin;
    const parentSub = this.parentSub;
    const info = this.content.getRef() & BITS5 | (origin === null ? 0 : BIT8) | (rightOrigin === null ? 0 : BIT7) | (parentSub === null ? 0 : BIT6);
    encoder.writeInfo(info);
    if (origin !== null) {
      encoder.writeLeftID(origin);
    }
    if (rightOrigin !== null) {
      encoder.writeRightID(rightOrigin);
    }
    if (origin === null && rightOrigin === null) {
      const parent = this.parent;
      if (parent._item !== void 0) {
        const parentItem = parent._item;
        if (parentItem === null) {
          const ykey = findRootTypeKey(parent);
          encoder.writeParentInfo(true);
          encoder.writeString(ykey);
        } else {
          encoder.writeParentInfo(false);
          encoder.writeLeftID(parentItem.id);
        }
      } else if (parent.constructor === String) {
        encoder.writeParentInfo(true);
        encoder.writeString(parent);
      } else if (parent.constructor === ID) {
        encoder.writeParentInfo(false);
        encoder.writeLeftID(parent);
      } else {
        unexpectedCase();
      }
      if (parentSub !== null) {
        encoder.writeString(parentSub);
      }
    }
    this.content.write(encoder, offset);
  }
}
const readItemContent = (decoder, info) => contentRefs[info & BITS5](decoder);
const contentRefs = [
  () => {
    unexpectedCase();
  },
  readContentDeleted,
  readContentJSON,
  readContentBinary,
  readContentString,
  readContentEmbed,
  readContentFormat,
  readContentType,
  readContentAny,
  readContentDoc,
  () => {
    unexpectedCase();
  }
];
const structSkipRefNumber = 10;
class Skip extends AbstractStruct {
  get deleted() {
    return true;
  }
  delete() {
  }
  mergeWith(right) {
    if (this.constructor !== right.constructor) {
      return false;
    }
    this.length += right.length;
    return true;
  }
  integrate(transaction, offset) {
    unexpectedCase();
  }
  write(encoder, offset) {
    encoder.writeInfo(structSkipRefNumber);
    writeVarUint(encoder.restEncoder, this.length - offset);
  }
  getMissing(transaction, store) {
    return null;
  }
}
const reconnectTimeoutBase = 1200;
const maxReconnectTimeout = 2500;
const messageReconnectTimeout = 3e4;
const setupWS = (wsclient) => {
  if (wsclient.shouldConnect && wsclient.ws === null) {
    const websocket = new WebSocket(wsclient.url);
    const binaryType = wsclient.binaryType;
    let pingTimeout = null;
    if (binaryType) {
      websocket.binaryType = binaryType;
    }
    wsclient.ws = websocket;
    wsclient.connecting = true;
    wsclient.connected = false;
    websocket.onmessage = (event) => {
      wsclient.lastMessageReceived = getUnixTime();
      const data = event.data;
      const message = typeof data === "string" ? JSON.parse(data) : data;
      if (message && message.type === "pong") {
        clearTimeout(pingTimeout);
        pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2);
      }
      wsclient.emit("message", [message, wsclient]);
    };
    const onclose = (error2) => {
      if (wsclient.ws !== null) {
        wsclient.ws = null;
        wsclient.connecting = false;
        if (wsclient.connected) {
          wsclient.connected = false;
          wsclient.emit("disconnect", [{type: "disconnect", error: error2}, wsclient]);
        } else {
          wsclient.unsuccessfulReconnects++;
        }
        setTimeout(setupWS, min(log10(wsclient.unsuccessfulReconnects + 1) * reconnectTimeoutBase, maxReconnectTimeout), wsclient);
      }
      clearTimeout(pingTimeout);
    };
    const sendPing = () => {
      if (wsclient.ws === websocket) {
        wsclient.send({
          type: "ping"
        });
      }
    };
    websocket.onclose = () => onclose(null);
    websocket.onerror = (error2) => onclose(error2);
    websocket.onopen = () => {
      wsclient.lastMessageReceived = getUnixTime();
      wsclient.connecting = false;
      wsclient.connected = true;
      wsclient.unsuccessfulReconnects = 0;
      wsclient.emit("connect", [{type: "connect"}, wsclient]);
      pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2);
    };
  }
};
class WebsocketClient extends Observable {
  constructor(url, {binaryType} = {}) {
    super();
    this.url = url;
    this.ws = null;
    this.binaryType = binaryType || null;
    this.connected = false;
    this.connecting = false;
    this.unsuccessfulReconnects = 0;
    this.lastMessageReceived = 0;
    this.shouldConnect = true;
    this._checkInterval = setInterval(() => {
      if (this.connected && messageReconnectTimeout < getUnixTime() - this.lastMessageReceived) {
        this.ws.close();
      }
    }, messageReconnectTimeout / 2);
    setupWS(this);
  }
  send(message) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }
  destroy() {
    clearInterval(this._checkInterval);
    this.disconnect();
    super.destroy();
  }
  disconnect() {
    this.shouldConnect = false;
    if (this.ws !== null) {
      this.ws.close();
    }
  }
  connect() {
    this.shouldConnect = true;
    if (!this.connected && this.ws === null) {
      setupWS(this);
    }
  }
}
const reject = (reason) => Promise.reject(reason);
const resolve = (res) => Promise.resolve(res);
const channels = new Map();
class LocalStoragePolyfill {
  constructor(room) {
    this.room = room;
    this.onmessage = null;
    onChange((e) => e.key === room && this.onmessage !== null && this.onmessage({data: fromBase64(e.newValue || "")}));
  }
  postMessage(buf) {
    varStorage.setItem(this.room, toBase64(createUint8ArrayFromArrayBuffer(buf)));
  }
}
const BC = typeof BroadcastChannel === "undefined" ? LocalStoragePolyfill : BroadcastChannel;
const getChannel = (room) => setIfUndefined(channels, room, () => {
  const subs = new Set();
  const bc = new BC(room);
  bc.onmessage = (e) => subs.forEach((sub) => sub(e.data));
  return {
    bc,
    subs
  };
});
const subscribe = (room, f) => getChannel(room).subs.add(f);
const unsubscribe = (room, f) => getChannel(room).subs.delete(f);
const publish = (room, data) => {
  const c = getChannel(room);
  c.bc.postMessage(data);
  c.subs.forEach((sub) => sub(data));
};
const createMutex = () => {
  let token = true;
  return (f, g) => {
    if (token) {
      token = false;
      try {
        f();
      } finally {
        token = true;
      }
    } else if (g !== void 0) {
      g();
    }
  };
};
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function createCommonjsModule(fn) {
  var module = {exports: {}};
  return fn(module, module.exports), module.exports;
}
function commonjsRequire(target) {
  throw new Error('Could not dynamically require "' + target + '". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.');
}
var simplepeer_min = createCommonjsModule(function(module, exports) {
  (function(e) {
    module.exports = e();
  })(function() {
    var t = Math.floor, n = Math.abs, r = Math.pow;
    return function() {
      function d2(s2, e, n2) {
        function t2(o, i) {
          if (!e[o]) {
            if (!s2[o]) {
              var l = typeof commonjsRequire == "function" && commonjsRequire;
              if (!i && l)
                return l(o, true);
              if (r2)
                return r2(o, true);
              var c = new Error("Cannot find module '" + o + "'");
              throw c.code = "MODULE_NOT_FOUND", c;
            }
            var a2 = e[o] = {exports: {}};
            s2[o][0].call(a2.exports, function(e2) {
              var r3 = s2[o][1][e2];
              return t2(r3 || e2);
            }, a2, a2.exports, d2, s2, e, n2);
          }
          return e[o].exports;
        }
        for (var r2 = typeof commonjsRequire == "function" && commonjsRequire, a = 0; a < n2.length; a++)
          t2(n2[a]);
        return t2;
      }
      return d2;
    }()({1: [function(e, t2, n2) {
      function r2(e2) {
        var t3 = e2.length;
        if (0 < t3 % 4)
          throw new Error("Invalid string. Length must be a multiple of 4");
        var n3 = e2.indexOf("=");
        n3 === -1 && (n3 = t3);
        var r3 = n3 === t3 ? 0 : 4 - n3 % 4;
        return [n3, r3];
      }
      function a(e2, t3, n3) {
        return 3 * (t3 + n3) / 4 - n3;
      }
      function o(e2) {
        var t3, n3, o2 = r2(e2), d3 = o2[0], s3 = o2[1], l2 = new p(a(e2, d3, s3)), c2 = 0, f2 = 0 < s3 ? d3 - 4 : d3;
        for (n3 = 0; n3 < f2; n3 += 4)
          t3 = u[e2.charCodeAt(n3)] << 18 | u[e2.charCodeAt(n3 + 1)] << 12 | u[e2.charCodeAt(n3 + 2)] << 6 | u[e2.charCodeAt(n3 + 3)], l2[c2++] = 255 & t3 >> 16, l2[c2++] = 255 & t3 >> 8, l2[c2++] = 255 & t3;
        return s3 === 2 && (t3 = u[e2.charCodeAt(n3)] << 2 | u[e2.charCodeAt(n3 + 1)] >> 4, l2[c2++] = 255 & t3), s3 === 1 && (t3 = u[e2.charCodeAt(n3)] << 10 | u[e2.charCodeAt(n3 + 1)] << 4 | u[e2.charCodeAt(n3 + 2)] >> 2, l2[c2++] = 255 & t3 >> 8, l2[c2++] = 255 & t3), l2;
      }
      function d2(e2) {
        return c[63 & e2 >> 18] + c[63 & e2 >> 12] + c[63 & e2 >> 6] + c[63 & e2];
      }
      function s2(e2, t3, n3) {
        for (var r3, a2 = [], o2 = t3; o2 < n3; o2 += 3)
          r3 = (16711680 & e2[o2] << 16) + (65280 & e2[o2 + 1] << 8) + (255 & e2[o2 + 2]), a2.push(d2(r3));
        return a2.join("");
      }
      function l(e2) {
        for (var t3, n3 = e2.length, r3 = n3 % 3, a2 = [], o2 = 16383, d3 = 0, l2 = n3 - r3; d3 < l2; d3 += o2)
          a2.push(s2(e2, d3, d3 + o2 > l2 ? l2 : d3 + o2));
        return r3 === 1 ? (t3 = e2[n3 - 1], a2.push(c[t3 >> 2] + c[63 & t3 << 4] + "==")) : r3 === 2 && (t3 = (e2[n3 - 2] << 8) + e2[n3 - 1], a2.push(c[t3 >> 10] + c[63 & t3 >> 4] + c[63 & t3 << 2] + "=")), a2.join("");
      }
      n2.byteLength = function(e2) {
        var t3 = r2(e2), n3 = t3[0], a2 = t3[1];
        return 3 * (n3 + a2) / 4 - a2;
      }, n2.toByteArray = o, n2.fromByteArray = l;
      for (var c = [], u = [], p = typeof Uint8Array == "undefined" ? Array : Uint8Array, f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", g = 0, _ = f.length; g < _; ++g)
        c[g] = f[g], u[f.charCodeAt(g)] = g;
      u[45] = 62, u[95] = 63;
    }, {}], 2: [function() {
    }, {}], 3: [function(e, t2, n2) {
      (function() {
        (function() {
          var t3 = String.fromCharCode, o = Math.min;
          function d2(e2) {
            if (2147483647 < e2)
              throw new RangeError('The value "' + e2 + '" is invalid for option "size"');
            var t4 = new Uint8Array(e2);
            return t4.__proto__ = s2.prototype, t4;
          }
          function s2(e2, t4, n3) {
            if (typeof e2 == "number") {
              if (typeof t4 == "string")
                throw new TypeError('The "string" argument must be of type string. Received type number');
              return p(e2);
            }
            return l(e2, t4, n3);
          }
          function l(e2, t4, n3) {
            if (typeof e2 == "string")
              return f(e2, t4);
            if (ArrayBuffer.isView(e2))
              return g(e2);
            if (e2 == null)
              throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e2);
            if (K(e2, ArrayBuffer) || e2 && K(e2.buffer, ArrayBuffer))
              return _(e2, t4, n3);
            if (typeof e2 == "number")
              throw new TypeError('The "value" argument must not be of type number. Received type number');
            var r2 = e2.valueOf && e2.valueOf();
            if (r2 != null && r2 !== e2)
              return s2.from(r2, t4, n3);
            var a = h(e2);
            if (a)
              return a;
            if (typeof Symbol != "undefined" && Symbol.toPrimitive != null && typeof e2[Symbol.toPrimitive] == "function")
              return s2.from(e2[Symbol.toPrimitive]("string"), t4, n3);
            throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e2);
          }
          function c(e2) {
            if (typeof e2 != "number")
              throw new TypeError('"size" argument must be of type number');
            else if (0 > e2)
              throw new RangeError('The value "' + e2 + '" is invalid for option "size"');
          }
          function u(e2, t4, n3) {
            return c(e2), 0 >= e2 ? d2(e2) : t4 === void 0 ? d2(e2) : typeof n3 == "string" ? d2(e2).fill(t4, n3) : d2(e2).fill(t4);
          }
          function p(e2) {
            return c(e2), d2(0 > e2 ? 0 : 0 | m(e2));
          }
          function f(e2, t4) {
            if ((typeof t4 != "string" || t4 === "") && (t4 = "utf8"), !s2.isEncoding(t4))
              throw new TypeError("Unknown encoding: " + t4);
            var n3 = 0 | b(e2, t4), r2 = d2(n3), a = r2.write(e2, t4);
            return a !== n3 && (r2 = r2.slice(0, a)), r2;
          }
          function g(e2) {
            for (var t4 = 0 > e2.length ? 0 : 0 | m(e2.length), n3 = d2(t4), r2 = 0; r2 < t4; r2 += 1)
              n3[r2] = 255 & e2[r2];
            return n3;
          }
          function _(e2, t4, n3) {
            if (0 > t4 || e2.byteLength < t4)
              throw new RangeError('"offset" is outside of buffer bounds');
            if (e2.byteLength < t4 + (n3 || 0))
              throw new RangeError('"length" is outside of buffer bounds');
            var r2;
            return r2 = t4 === void 0 && n3 === void 0 ? new Uint8Array(e2) : n3 === void 0 ? new Uint8Array(e2, t4) : new Uint8Array(e2, t4, n3), r2.__proto__ = s2.prototype, r2;
          }
          function h(e2) {
            if (s2.isBuffer(e2)) {
              var t4 = 0 | m(e2.length), n3 = d2(t4);
              return n3.length === 0 ? n3 : (e2.copy(n3, 0, 0, t4), n3);
            }
            return e2.length === void 0 ? e2.type === "Buffer" && Array.isArray(e2.data) ? g(e2.data) : void 0 : typeof e2.length != "number" || X(e2.length) ? d2(0) : g(e2);
          }
          function m(e2) {
            if (e2 >= 2147483647)
              throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + 2147483647 .toString(16) + " bytes");
            return 0 | e2;
          }
          function b(e2, t4) {
            if (s2.isBuffer(e2))
              return e2.length;
            if (ArrayBuffer.isView(e2) || K(e2, ArrayBuffer))
              return e2.byteLength;
            if (typeof e2 != "string")
              throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof e2);
            var n3 = e2.length, r2 = 2 < arguments.length && arguments[2] === true;
            if (!r2 && n3 === 0)
              return 0;
            for (var a = false; ; )
              switch (t4) {
                case "ascii":
                case "latin1":
                case "binary":
                  return n3;
                case "utf8":
                case "utf-8":
                  return H(e2).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return 2 * n3;
                case "hex":
                  return n3 >>> 1;
                case "base64":
                  return z(e2).length;
                default:
                  if (a)
                    return r2 ? -1 : H(e2).length;
                  t4 = ("" + t4).toLowerCase(), a = true;
              }
          }
          function y(e2, t4, n3) {
            var r2 = false;
            if ((t4 === void 0 || 0 > t4) && (t4 = 0), t4 > this.length)
              return "";
            if ((n3 === void 0 || n3 > this.length) && (n3 = this.length), 0 >= n3)
              return "";
            if (n3 >>>= 0, t4 >>>= 0, n3 <= t4)
              return "";
            for (e2 || (e2 = "utf8"); ; )
              switch (e2) {
                case "hex":
                  return P(this, t4, n3);
                case "utf8":
                case "utf-8":
                  return x(this, t4, n3);
                case "ascii":
                  return D(this, t4, n3);
                case "latin1":
                case "binary":
                  return I(this, t4, n3);
                case "base64":
                  return A(this, t4, n3);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return M(this, t4, n3);
                default:
                  if (r2)
                    throw new TypeError("Unknown encoding: " + e2);
                  e2 = (e2 + "").toLowerCase(), r2 = true;
              }
          }
          function C(e2, t4, n3) {
            var r2 = e2[t4];
            e2[t4] = e2[n3], e2[n3] = r2;
          }
          function R(e2, t4, n3, r2, a) {
            if (e2.length === 0)
              return -1;
            if (typeof n3 == "string" ? (r2 = n3, n3 = 0) : 2147483647 < n3 ? n3 = 2147483647 : -2147483648 > n3 && (n3 = -2147483648), n3 = +n3, X(n3) && (n3 = a ? 0 : e2.length - 1), 0 > n3 && (n3 = e2.length + n3), n3 >= e2.length) {
              if (a)
                return -1;
              n3 = e2.length - 1;
            } else if (0 > n3)
              if (a)
                n3 = 0;
              else
                return -1;
            if (typeof t4 == "string" && (t4 = s2.from(t4, r2)), s2.isBuffer(t4))
              return t4.length === 0 ? -1 : E(e2, t4, n3, r2, a);
            if (typeof t4 == "number")
              return t4 &= 255, typeof Uint8Array.prototype.indexOf == "function" ? a ? Uint8Array.prototype.indexOf.call(e2, t4, n3) : Uint8Array.prototype.lastIndexOf.call(e2, t4, n3) : E(e2, [t4], n3, r2, a);
            throw new TypeError("val must be string, number or Buffer");
          }
          function E(e2, t4, n3, r2, a) {
            function o2(e3, t5) {
              return d3 === 1 ? e3[t5] : e3.readUInt16BE(t5 * d3);
            }
            var d3 = 1, s3 = e2.length, l2 = t4.length;
            if (r2 !== void 0 && (r2 = (r2 + "").toLowerCase(), r2 === "ucs2" || r2 === "ucs-2" || r2 === "utf16le" || r2 === "utf-16le")) {
              if (2 > e2.length || 2 > t4.length)
                return -1;
              d3 = 2, s3 /= 2, l2 /= 2, n3 /= 2;
            }
            var c2;
            if (a) {
              var u2 = -1;
              for (c2 = n3; c2 < s3; c2++)
                if (o2(e2, c2) !== o2(t4, u2 === -1 ? 0 : c2 - u2))
                  u2 !== -1 && (c2 -= c2 - u2), u2 = -1;
                else if (u2 === -1 && (u2 = c2), c2 - u2 + 1 === l2)
                  return u2 * d3;
            } else
              for (n3 + l2 > s3 && (n3 = s3 - l2), c2 = n3; 0 <= c2; c2--) {
                for (var p2 = true, f2 = 0; f2 < l2; f2++)
                  if (o2(e2, c2 + f2) !== o2(t4, f2)) {
                    p2 = false;
                    break;
                  }
                if (p2)
                  return c2;
              }
            return -1;
          }
          function w(e2, t4, n3, r2) {
            n3 = +n3 || 0;
            var a = e2.length - n3;
            r2 ? (r2 = +r2, r2 > a && (r2 = a)) : r2 = a;
            var o2 = t4.length;
            r2 > o2 / 2 && (r2 = o2 / 2);
            for (var d3, s3 = 0; s3 < r2; ++s3) {
              if (d3 = parseInt(t4.substr(2 * s3, 2), 16), X(d3))
                return s3;
              e2[n3 + s3] = d3;
            }
            return s3;
          }
          function S(e2, t4, n3, r2) {
            return G(H(t4, e2.length - n3), e2, n3, r2);
          }
          function T(e2, t4, n3, r2) {
            return G(Y(t4), e2, n3, r2);
          }
          function v(e2, t4, n3, r2) {
            return T(e2, t4, n3, r2);
          }
          function k(e2, t4, n3, r2) {
            return G(z(t4), e2, n3, r2);
          }
          function L(e2, t4, n3, r2) {
            return G(V(t4, e2.length - n3), e2, n3, r2);
          }
          function A(e2, t4, n3) {
            return t4 === 0 && n3 === e2.length ? $.fromByteArray(e2) : $.fromByteArray(e2.slice(t4, n3));
          }
          function x(e2, t4, n3) {
            n3 = o(e2.length, n3);
            for (var r2 = [], a = t4; a < n3; ) {
              var d3 = e2[a], s3 = null, l2 = 239 < d3 ? 4 : 223 < d3 ? 3 : 191 < d3 ? 2 : 1;
              if (a + l2 <= n3) {
                var c2, u2, p2, f2;
                l2 === 1 ? 128 > d3 && (s3 = d3) : l2 === 2 ? (c2 = e2[a + 1], (192 & c2) == 128 && (f2 = (31 & d3) << 6 | 63 & c2, 127 < f2 && (s3 = f2))) : l2 === 3 ? (c2 = e2[a + 1], u2 = e2[a + 2], (192 & c2) == 128 && (192 & u2) == 128 && (f2 = (15 & d3) << 12 | (63 & c2) << 6 | 63 & u2, 2047 < f2 && (55296 > f2 || 57343 < f2) && (s3 = f2))) : l2 === 4 ? (c2 = e2[a + 1], u2 = e2[a + 2], p2 = e2[a + 3], (192 & c2) == 128 && (192 & u2) == 128 && (192 & p2) == 128 && (f2 = (15 & d3) << 18 | (63 & c2) << 12 | (63 & u2) << 6 | 63 & p2, 65535 < f2 && 1114112 > f2 && (s3 = f2))) : void 0;
              }
              s3 === null ? (s3 = 65533, l2 = 1) : 65535 < s3 && (s3 -= 65536, r2.push(55296 | 1023 & s3 >>> 10), s3 = 56320 | 1023 & s3), r2.push(s3), a += l2;
            }
            return N(r2);
          }
          function N(e2) {
            var n3 = e2.length;
            if (n3 <= 4096)
              return t3.apply(String, e2);
            for (var r2 = "", a = 0; a < n3; )
              r2 += t3.apply(String, e2.slice(a, a += 4096));
            return r2;
          }
          function D(e2, n3, r2) {
            var a = "";
            r2 = o(e2.length, r2);
            for (var d3 = n3; d3 < r2; ++d3)
              a += t3(127 & e2[d3]);
            return a;
          }
          function I(e2, n3, r2) {
            var a = "";
            r2 = o(e2.length, r2);
            for (var d3 = n3; d3 < r2; ++d3)
              a += t3(e2[d3]);
            return a;
          }
          function P(e2, t4, n3) {
            var r2 = e2.length;
            (!t4 || 0 > t4) && (t4 = 0), (!n3 || 0 > n3 || n3 > r2) && (n3 = r2);
            for (var a = "", o2 = t4; o2 < n3; ++o2)
              a += W(e2[o2]);
            return a;
          }
          function M(e2, n3, r2) {
            for (var a = e2.slice(n3, r2), o2 = "", d3 = 0; d3 < a.length; d3 += 2)
              o2 += t3(a[d3] + 256 * a[d3 + 1]);
            return o2;
          }
          function O(e2, t4, n3) {
            if (e2 % 1 != 0 || 0 > e2)
              throw new RangeError("offset is not uint");
            if (e2 + t4 > n3)
              throw new RangeError("Trying to access beyond buffer length");
          }
          function F(e2, t4, n3, r2, a, o2) {
            if (!s2.isBuffer(e2))
              throw new TypeError('"buffer" argument must be a Buffer instance');
            if (t4 > a || t4 < o2)
              throw new RangeError('"value" argument is out of bounds');
            if (n3 + r2 > e2.length)
              throw new RangeError("Index out of range");
          }
          function B(e2, t4, n3, r2) {
            if (n3 + r2 > e2.length)
              throw new RangeError("Index out of range");
            if (0 > n3)
              throw new RangeError("Index out of range");
          }
          function U(e2, t4, n3, r2, a) {
            return t4 = +t4, n3 >>>= 0, a || B(e2, t4, n3, 4), J.write(e2, t4, n3, r2, 23, 4), n3 + 4;
          }
          function j(e2, t4, n3, r2, a) {
            return t4 = +t4, n3 >>>= 0, a || B(e2, t4, n3, 8), J.write(e2, t4, n3, r2, 52, 8), n3 + 8;
          }
          function q(e2) {
            if (e2 = e2.split("=")[0], e2 = e2.trim().replace(Q, ""), 2 > e2.length)
              return "";
            for (; e2.length % 4 != 0; )
              e2 += "=";
            return e2;
          }
          function W(e2) {
            return 16 > e2 ? "0" + e2.toString(16) : e2.toString(16);
          }
          function H(e2, t4) {
            t4 = t4 || 1 / 0;
            for (var n3, r2 = e2.length, a = null, o2 = [], d3 = 0; d3 < r2; ++d3) {
              if (n3 = e2.charCodeAt(d3), 55295 < n3 && 57344 > n3) {
                if (!a) {
                  if (56319 < n3) {
                    -1 < (t4 -= 3) && o2.push(239, 191, 189);
                    continue;
                  } else if (d3 + 1 === r2) {
                    -1 < (t4 -= 3) && o2.push(239, 191, 189);
                    continue;
                  }
                  a = n3;
                  continue;
                }
                if (56320 > n3) {
                  -1 < (t4 -= 3) && o2.push(239, 191, 189), a = n3;
                  continue;
                }
                n3 = (a - 55296 << 10 | n3 - 56320) + 65536;
              } else
                a && -1 < (t4 -= 3) && o2.push(239, 191, 189);
              if (a = null, 128 > n3) {
                if (0 > (t4 -= 1))
                  break;
                o2.push(n3);
              } else if (2048 > n3) {
                if (0 > (t4 -= 2))
                  break;
                o2.push(192 | n3 >> 6, 128 | 63 & n3);
              } else if (65536 > n3) {
                if (0 > (t4 -= 3))
                  break;
                o2.push(224 | n3 >> 12, 128 | 63 & n3 >> 6, 128 | 63 & n3);
              } else if (1114112 > n3) {
                if (0 > (t4 -= 4))
                  break;
                o2.push(240 | n3 >> 18, 128 | 63 & n3 >> 12, 128 | 63 & n3 >> 6, 128 | 63 & n3);
              } else
                throw new Error("Invalid code point");
            }
            return o2;
          }
          function Y(e2) {
            for (var t4 = [], n3 = 0; n3 < e2.length; ++n3)
              t4.push(255 & e2.charCodeAt(n3));
            return t4;
          }
          function V(e2, t4) {
            for (var n3, r2, a, o2 = [], d3 = 0; d3 < e2.length && !(0 > (t4 -= 2)); ++d3)
              n3 = e2.charCodeAt(d3), r2 = n3 >> 8, a = n3 % 256, o2.push(a), o2.push(r2);
            return o2;
          }
          function z(e2) {
            return $.toByteArray(q(e2));
          }
          function G(e2, t4, n3, r2) {
            for (var a = 0; a < r2 && !(a + n3 >= t4.length || a >= e2.length); ++a)
              t4[a + n3] = e2[a];
            return a;
          }
          function K(e2, t4) {
            return e2 instanceof t4 || e2 != null && e2.constructor != null && e2.constructor.name != null && e2.constructor.name === t4.name;
          }
          function X(e2) {
            return e2 !== e2;
          }
          var $ = e("base64-js"), J = e("ieee754");
          n2.Buffer = s2, n2.SlowBuffer = function(e2) {
            return +e2 != e2 && (e2 = 0), s2.alloc(+e2);
          }, n2.INSPECT_MAX_BYTES = 50;
          n2.kMaxLength = 2147483647, s2.TYPED_ARRAY_SUPPORT = function() {
            try {
              var e2 = new Uint8Array(1);
              return e2.__proto__ = {__proto__: Uint8Array.prototype, foo: function() {
                return 42;
              }}, e2.foo() === 42;
            } catch (t4) {
              return false;
            }
          }(), s2.TYPED_ARRAY_SUPPORT || typeof console == "undefined" || typeof console.error != "function" || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."), Object.defineProperty(s2.prototype, "parent", {enumerable: true, get: function() {
            return s2.isBuffer(this) ? this.buffer : void 0;
          }}), Object.defineProperty(s2.prototype, "offset", {enumerable: true, get: function() {
            return s2.isBuffer(this) ? this.byteOffset : void 0;
          }}), typeof Symbol != "undefined" && Symbol.species != null && s2[Symbol.species] === s2 && Object.defineProperty(s2, Symbol.species, {value: null, configurable: true, enumerable: false, writable: false}), s2.poolSize = 8192, s2.from = function(e2, t4, n3) {
            return l(e2, t4, n3);
          }, s2.prototype.__proto__ = Uint8Array.prototype, s2.__proto__ = Uint8Array, s2.alloc = function(e2, t4, n3) {
            return u(e2, t4, n3);
          }, s2.allocUnsafe = function(e2) {
            return p(e2);
          }, s2.allocUnsafeSlow = function(e2) {
            return p(e2);
          }, s2.isBuffer = function(e2) {
            return e2 != null && e2._isBuffer === true && e2 !== s2.prototype;
          }, s2.compare = function(e2, t4) {
            if (K(e2, Uint8Array) && (e2 = s2.from(e2, e2.offset, e2.byteLength)), K(t4, Uint8Array) && (t4 = s2.from(t4, t4.offset, t4.byteLength)), !s2.isBuffer(e2) || !s2.isBuffer(t4))
              throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
            if (e2 === t4)
              return 0;
            for (var n3 = e2.length, r2 = t4.length, d3 = 0, l2 = o(n3, r2); d3 < l2; ++d3)
              if (e2[d3] !== t4[d3]) {
                n3 = e2[d3], r2 = t4[d3];
                break;
              }
            return n3 < r2 ? -1 : r2 < n3 ? 1 : 0;
          }, s2.isEncoding = function(e2) {
            switch ((e2 + "").toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "latin1":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return true;
              default:
                return false;
            }
          }, s2.concat = function(e2, t4) {
            if (!Array.isArray(e2))
              throw new TypeError('"list" argument must be an Array of Buffers');
            if (e2.length === 0)
              return s2.alloc(0);
            var n3;
            if (t4 === void 0)
              for (t4 = 0, n3 = 0; n3 < e2.length; ++n3)
                t4 += e2[n3].length;
            var r2 = s2.allocUnsafe(t4), a = 0;
            for (n3 = 0; n3 < e2.length; ++n3) {
              var o2 = e2[n3];
              if (K(o2, Uint8Array) && (o2 = s2.from(o2)), !s2.isBuffer(o2))
                throw new TypeError('"list" argument must be an Array of Buffers');
              o2.copy(r2, a), a += o2.length;
            }
            return r2;
          }, s2.byteLength = b, s2.prototype._isBuffer = true, s2.prototype.swap16 = function() {
            var e2 = this.length;
            if (e2 % 2 != 0)
              throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var t4 = 0; t4 < e2; t4 += 2)
              C(this, t4, t4 + 1);
            return this;
          }, s2.prototype.swap32 = function() {
            var e2 = this.length;
            if (e2 % 4 != 0)
              throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var t4 = 0; t4 < e2; t4 += 4)
              C(this, t4, t4 + 3), C(this, t4 + 1, t4 + 2);
            return this;
          }, s2.prototype.swap64 = function() {
            var e2 = this.length;
            if (e2 % 8 != 0)
              throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var t4 = 0; t4 < e2; t4 += 8)
              C(this, t4, t4 + 7), C(this, t4 + 1, t4 + 6), C(this, t4 + 2, t4 + 5), C(this, t4 + 3, t4 + 4);
            return this;
          }, s2.prototype.toString = function() {
            var e2 = this.length;
            return e2 === 0 ? "" : arguments.length === 0 ? x(this, 0, e2) : y.apply(this, arguments);
          }, s2.prototype.toLocaleString = s2.prototype.toString, s2.prototype.equals = function(e2) {
            if (!s2.isBuffer(e2))
              throw new TypeError("Argument must be a Buffer");
            return this === e2 || s2.compare(this, e2) === 0;
          }, s2.prototype.inspect = function() {
            var e2 = "", t4 = n2.INSPECT_MAX_BYTES;
            return e2 = this.toString("hex", 0, t4).replace(/(.{2})/g, "$1 ").trim(), this.length > t4 && (e2 += " ... "), "<Buffer " + e2 + ">";
          }, s2.prototype.compare = function(e2, t4, n3, r2, a) {
            if (K(e2, Uint8Array) && (e2 = s2.from(e2, e2.offset, e2.byteLength)), !s2.isBuffer(e2))
              throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e2);
            if (t4 === void 0 && (t4 = 0), n3 === void 0 && (n3 = e2 ? e2.length : 0), r2 === void 0 && (r2 = 0), a === void 0 && (a = this.length), 0 > t4 || n3 > e2.length || 0 > r2 || a > this.length)
              throw new RangeError("out of range index");
            if (r2 >= a && t4 >= n3)
              return 0;
            if (r2 >= a)
              return -1;
            if (t4 >= n3)
              return 1;
            if (t4 >>>= 0, n3 >>>= 0, r2 >>>= 0, a >>>= 0, this === e2)
              return 0;
            for (var d3 = a - r2, l2 = n3 - t4, c2 = o(d3, l2), u2 = this.slice(r2, a), p2 = e2.slice(t4, n3), f2 = 0; f2 < c2; ++f2)
              if (u2[f2] !== p2[f2]) {
                d3 = u2[f2], l2 = p2[f2];
                break;
              }
            return d3 < l2 ? -1 : l2 < d3 ? 1 : 0;
          }, s2.prototype.includes = function(e2, t4, n3) {
            return this.indexOf(e2, t4, n3) !== -1;
          }, s2.prototype.indexOf = function(e2, t4, n3) {
            return R(this, e2, t4, n3, true);
          }, s2.prototype.lastIndexOf = function(e2, t4, n3) {
            return R(this, e2, t4, n3, false);
          }, s2.prototype.write = function(e2, t4, n3, r2) {
            if (t4 === void 0)
              r2 = "utf8", n3 = this.length, t4 = 0;
            else if (n3 === void 0 && typeof t4 == "string")
              r2 = t4, n3 = this.length, t4 = 0;
            else if (isFinite(t4))
              t4 >>>= 0, isFinite(n3) ? (n3 >>>= 0, r2 === void 0 && (r2 = "utf8")) : (r2 = n3, n3 = void 0);
            else
              throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            var a = this.length - t4;
            if ((n3 === void 0 || n3 > a) && (n3 = a), 0 < e2.length && (0 > n3 || 0 > t4) || t4 > this.length)
              throw new RangeError("Attempt to write outside buffer bounds");
            r2 || (r2 = "utf8");
            for (var o2 = false; ; )
              switch (r2) {
                case "hex":
                  return w(this, e2, t4, n3);
                case "utf8":
                case "utf-8":
                  return S(this, e2, t4, n3);
                case "ascii":
                  return T(this, e2, t4, n3);
                case "latin1":
                case "binary":
                  return v(this, e2, t4, n3);
                case "base64":
                  return k(this, e2, t4, n3);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return L(this, e2, t4, n3);
                default:
                  if (o2)
                    throw new TypeError("Unknown encoding: " + r2);
                  r2 = ("" + r2).toLowerCase(), o2 = true;
              }
          }, s2.prototype.toJSON = function() {
            return {type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0)};
          };
          s2.prototype.slice = function(e2, t4) {
            var n3 = this.length;
            e2 = ~~e2, t4 = t4 === void 0 ? n3 : ~~t4, 0 > e2 ? (e2 += n3, 0 > e2 && (e2 = 0)) : e2 > n3 && (e2 = n3), 0 > t4 ? (t4 += n3, 0 > t4 && (t4 = 0)) : t4 > n3 && (t4 = n3), t4 < e2 && (t4 = e2);
            var r2 = this.subarray(e2, t4);
            return r2.__proto__ = s2.prototype, r2;
          }, s2.prototype.readUIntLE = function(e2, t4, n3) {
            e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
            for (var r2 = this[e2], a = 1, o2 = 0; ++o2 < t4 && (a *= 256); )
              r2 += this[e2 + o2] * a;
            return r2;
          }, s2.prototype.readUIntBE = function(e2, t4, n3) {
            e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
            for (var r2 = this[e2 + --t4], a = 1; 0 < t4 && (a *= 256); )
              r2 += this[e2 + --t4] * a;
            return r2;
          }, s2.prototype.readUInt8 = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 1, this.length), this[e2];
          }, s2.prototype.readUInt16LE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 2, this.length), this[e2] | this[e2 + 1] << 8;
          }, s2.prototype.readUInt16BE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 2, this.length), this[e2] << 8 | this[e2 + 1];
          }, s2.prototype.readUInt32LE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 4, this.length), (this[e2] | this[e2 + 1] << 8 | this[e2 + 2] << 16) + 16777216 * this[e2 + 3];
          }, s2.prototype.readUInt32BE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 4, this.length), 16777216 * this[e2] + (this[e2 + 1] << 16 | this[e2 + 2] << 8 | this[e2 + 3]);
          }, s2.prototype.readIntLE = function(e2, t4, n3) {
            e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
            for (var a = this[e2], o2 = 1, d3 = 0; ++d3 < t4 && (o2 *= 256); )
              a += this[e2 + d3] * o2;
            return o2 *= 128, a >= o2 && (a -= r(2, 8 * t4)), a;
          }, s2.prototype.readIntBE = function(e2, t4, n3) {
            e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
            for (var a = t4, o2 = 1, d3 = this[e2 + --a]; 0 < a && (o2 *= 256); )
              d3 += this[e2 + --a] * o2;
            return o2 *= 128, d3 >= o2 && (d3 -= r(2, 8 * t4)), d3;
          }, s2.prototype.readInt8 = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 1, this.length), 128 & this[e2] ? -1 * (255 - this[e2] + 1) : this[e2];
          }, s2.prototype.readInt16LE = function(e2, t4) {
            e2 >>>= 0, t4 || O(e2, 2, this.length);
            var n3 = this[e2] | this[e2 + 1] << 8;
            return 32768 & n3 ? 4294901760 | n3 : n3;
          }, s2.prototype.readInt16BE = function(e2, t4) {
            e2 >>>= 0, t4 || O(e2, 2, this.length);
            var n3 = this[e2 + 1] | this[e2] << 8;
            return 32768 & n3 ? 4294901760 | n3 : n3;
          }, s2.prototype.readInt32LE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 4, this.length), this[e2] | this[e2 + 1] << 8 | this[e2 + 2] << 16 | this[e2 + 3] << 24;
          }, s2.prototype.readInt32BE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 4, this.length), this[e2] << 24 | this[e2 + 1] << 16 | this[e2 + 2] << 8 | this[e2 + 3];
          }, s2.prototype.readFloatLE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 4, this.length), J.read(this, e2, true, 23, 4);
          }, s2.prototype.readFloatBE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 4, this.length), J.read(this, e2, false, 23, 4);
          }, s2.prototype.readDoubleLE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 8, this.length), J.read(this, e2, true, 52, 8);
          }, s2.prototype.readDoubleBE = function(e2, t4) {
            return e2 >>>= 0, t4 || O(e2, 8, this.length), J.read(this, e2, false, 52, 8);
          }, s2.prototype.writeUIntLE = function(e2, t4, n3, a) {
            if (e2 = +e2, t4 >>>= 0, n3 >>>= 0, !a) {
              var o2 = r(2, 8 * n3) - 1;
              F(this, e2, t4, n3, o2, 0);
            }
            var d3 = 1, s3 = 0;
            for (this[t4] = 255 & e2; ++s3 < n3 && (d3 *= 256); )
              this[t4 + s3] = 255 & e2 / d3;
            return t4 + n3;
          }, s2.prototype.writeUIntBE = function(e2, t4, n3, a) {
            if (e2 = +e2, t4 >>>= 0, n3 >>>= 0, !a) {
              var o2 = r(2, 8 * n3) - 1;
              F(this, e2, t4, n3, o2, 0);
            }
            var d3 = n3 - 1, s3 = 1;
            for (this[t4 + d3] = 255 & e2; 0 <= --d3 && (s3 *= 256); )
              this[t4 + d3] = 255 & e2 / s3;
            return t4 + n3;
          }, s2.prototype.writeUInt8 = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 1, 255, 0), this[t4] = 255 & e2, t4 + 1;
          }, s2.prototype.writeUInt16LE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 65535, 0), this[t4] = 255 & e2, this[t4 + 1] = e2 >>> 8, t4 + 2;
          }, s2.prototype.writeUInt16BE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 65535, 0), this[t4] = e2 >>> 8, this[t4 + 1] = 255 & e2, t4 + 2;
          }, s2.prototype.writeUInt32LE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 4294967295, 0), this[t4 + 3] = e2 >>> 24, this[t4 + 2] = e2 >>> 16, this[t4 + 1] = e2 >>> 8, this[t4] = 255 & e2, t4 + 4;
          }, s2.prototype.writeUInt32BE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 4294967295, 0), this[t4] = e2 >>> 24, this[t4 + 1] = e2 >>> 16, this[t4 + 2] = e2 >>> 8, this[t4 + 3] = 255 & e2, t4 + 4;
          }, s2.prototype.writeIntLE = function(e2, t4, n3, a) {
            if (e2 = +e2, t4 >>>= 0, !a) {
              var o2 = r(2, 8 * n3 - 1);
              F(this, e2, t4, n3, o2 - 1, -o2);
            }
            var d3 = 0, s3 = 1, l2 = 0;
            for (this[t4] = 255 & e2; ++d3 < n3 && (s3 *= 256); )
              0 > e2 && l2 === 0 && this[t4 + d3 - 1] !== 0 && (l2 = 1), this[t4 + d3] = 255 & (e2 / s3 >> 0) - l2;
            return t4 + n3;
          }, s2.prototype.writeIntBE = function(e2, t4, n3, a) {
            if (e2 = +e2, t4 >>>= 0, !a) {
              var o2 = r(2, 8 * n3 - 1);
              F(this, e2, t4, n3, o2 - 1, -o2);
            }
            var d3 = n3 - 1, s3 = 1, l2 = 0;
            for (this[t4 + d3] = 255 & e2; 0 <= --d3 && (s3 *= 256); )
              0 > e2 && l2 === 0 && this[t4 + d3 + 1] !== 0 && (l2 = 1), this[t4 + d3] = 255 & (e2 / s3 >> 0) - l2;
            return t4 + n3;
          }, s2.prototype.writeInt8 = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 1, 127, -128), 0 > e2 && (e2 = 255 + e2 + 1), this[t4] = 255 & e2, t4 + 1;
          }, s2.prototype.writeInt16LE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 32767, -32768), this[t4] = 255 & e2, this[t4 + 1] = e2 >>> 8, t4 + 2;
          }, s2.prototype.writeInt16BE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 32767, -32768), this[t4] = e2 >>> 8, this[t4 + 1] = 255 & e2, t4 + 2;
          }, s2.prototype.writeInt32LE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 2147483647, -2147483648), this[t4] = 255 & e2, this[t4 + 1] = e2 >>> 8, this[t4 + 2] = e2 >>> 16, this[t4 + 3] = e2 >>> 24, t4 + 4;
          }, s2.prototype.writeInt32BE = function(e2, t4, n3) {
            return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 2147483647, -2147483648), 0 > e2 && (e2 = 4294967295 + e2 + 1), this[t4] = e2 >>> 24, this[t4 + 1] = e2 >>> 16, this[t4 + 2] = e2 >>> 8, this[t4 + 3] = 255 & e2, t4 + 4;
          }, s2.prototype.writeFloatLE = function(e2, t4, n3) {
            return U(this, e2, t4, true, n3);
          }, s2.prototype.writeFloatBE = function(e2, t4, n3) {
            return U(this, e2, t4, false, n3);
          }, s2.prototype.writeDoubleLE = function(e2, t4, n3) {
            return j(this, e2, t4, true, n3);
          }, s2.prototype.writeDoubleBE = function(e2, t4, n3) {
            return j(this, e2, t4, false, n3);
          }, s2.prototype.copy = function(e2, t4, n3, r2) {
            if (!s2.isBuffer(e2))
              throw new TypeError("argument should be a Buffer");
            if (n3 || (n3 = 0), r2 || r2 === 0 || (r2 = this.length), t4 >= e2.length && (t4 = e2.length), t4 || (t4 = 0), 0 < r2 && r2 < n3 && (r2 = n3), r2 === n3)
              return 0;
            if (e2.length === 0 || this.length === 0)
              return 0;
            if (0 > t4)
              throw new RangeError("targetStart out of bounds");
            if (0 > n3 || n3 >= this.length)
              throw new RangeError("Index out of range");
            if (0 > r2)
              throw new RangeError("sourceEnd out of bounds");
            r2 > this.length && (r2 = this.length), e2.length - t4 < r2 - n3 && (r2 = e2.length - t4 + n3);
            var a = r2 - n3;
            if (this === e2 && typeof Uint8Array.prototype.copyWithin == "function")
              this.copyWithin(t4, n3, r2);
            else if (this === e2 && n3 < t4 && t4 < r2)
              for (var o2 = a - 1; 0 <= o2; --o2)
                e2[o2 + t4] = this[o2 + n3];
            else
              Uint8Array.prototype.set.call(e2, this.subarray(n3, r2), t4);
            return a;
          }, s2.prototype.fill = function(e2, t4, n3, r2) {
            if (typeof e2 == "string") {
              if (typeof t4 == "string" ? (r2 = t4, t4 = 0, n3 = this.length) : typeof n3 == "string" && (r2 = n3, n3 = this.length), r2 !== void 0 && typeof r2 != "string")
                throw new TypeError("encoding must be a string");
              if (typeof r2 == "string" && !s2.isEncoding(r2))
                throw new TypeError("Unknown encoding: " + r2);
              if (e2.length === 1) {
                var a = e2.charCodeAt(0);
                (r2 === "utf8" && 128 > a || r2 === "latin1") && (e2 = a);
              }
            } else
              typeof e2 == "number" && (e2 &= 255);
            if (0 > t4 || this.length < t4 || this.length < n3)
              throw new RangeError("Out of range index");
            if (n3 <= t4)
              return this;
            t4 >>>= 0, n3 = n3 === void 0 ? this.length : n3 >>> 0, e2 || (e2 = 0);
            var o2;
            if (typeof e2 == "number")
              for (o2 = t4; o2 < n3; ++o2)
                this[o2] = e2;
            else {
              var d3 = s2.isBuffer(e2) ? e2 : s2.from(e2, r2), l2 = d3.length;
              if (l2 === 0)
                throw new TypeError('The value "' + e2 + '" is invalid for argument "value"');
              for (o2 = 0; o2 < n3 - t4; ++o2)
                this[o2 + t4] = d3[o2 % l2];
            }
            return this;
          };
          var Q = /[^+/0-9A-Za-z-_]/g;
        }).call(this);
      }).call(this, e("buffer").Buffer);
    }, {"base64-js": 1, buffer: 3, ieee754: 9}], 4: [function(e, t2, n2) {
      (function(a) {
        (function() {
          function r2() {
            let e2;
            try {
              e2 = n2.storage.getItem("debug");
            } catch (e3) {
            }
            return !e2 && typeof a != "undefined" && "env" in a && (e2 = a.env.DEBUG), e2;
          }
          n2.formatArgs = function(e2) {
            if (e2[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e2[0] + (this.useColors ? "%c " : " ") + "+" + t2.exports.humanize(this.diff), !this.useColors)
              return;
            const n3 = "color: " + this.color;
            e2.splice(1, 0, n3, "color: inherit");
            let r3 = 0, a2 = 0;
            e2[0].replace(/%[a-zA-Z%]/g, (e3) => {
              e3 === "%%" || (r3++, e3 === "%c" && (a2 = r3));
            }), e2.splice(a2, 0, n3);
          }, n2.save = function(e2) {
            try {
              e2 ? n2.storage.setItem("debug", e2) : n2.storage.removeItem("debug");
            } catch (e3) {
            }
          }, n2.load = r2, n2.useColors = function() {
            return !!(typeof window != "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) || !(typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) && (typeof document != "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window != "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && 31 <= parseInt(RegExp.$1, 10) || typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
          }, n2.storage = function() {
            try {
              return localStorage;
            } catch (e2) {
            }
          }(), n2.destroy = (() => {
            let e2 = false;
            return () => {
              e2 || (e2 = true, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
            };
          })(), n2.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"], n2.log = console.debug || console.log || (() => {
          }), t2.exports = e("./common")(n2);
          const {formatters: o} = t2.exports;
          o.j = function(e2) {
            try {
              return JSON.stringify(e2);
            } catch (e3) {
              return "[UnexpectedJSONParseError]: " + e3.message;
            }
          };
        }).call(this);
      }).call(this, e("_process"));
    }, {"./common": 5, _process: 12}], 5: [function(e, t2) {
      t2.exports = function(t3) {
        function r2(e2) {
          function t4(...e3) {
            if (!t4.enabled)
              return;
            const a2 = t4, o3 = +new Date(), i = o3 - (n2 || o3);
            a2.diff = i, a2.prev = n2, a2.curr = o3, n2 = o3, e3[0] = r2.coerce(e3[0]), typeof e3[0] != "string" && e3.unshift("%O");
            let d2 = 0;
            e3[0] = e3[0].replace(/%([a-zA-Z%])/g, (t5, n3) => {
              if (t5 === "%%")
                return "%";
              d2++;
              const o4 = r2.formatters[n3];
              if (typeof o4 == "function") {
                const n4 = e3[d2];
                t5 = o4.call(a2, n4), e3.splice(d2, 1), d2--;
              }
              return t5;
            }), r2.formatArgs.call(a2, e3);
            const s2 = a2.log || r2.log;
            s2.apply(a2, e3);
          }
          let n2, o2 = null;
          return t4.namespace = e2, t4.useColors = r2.useColors(), t4.color = r2.selectColor(e2), t4.extend = a, t4.destroy = r2.destroy, Object.defineProperty(t4, "enabled", {enumerable: true, configurable: false, get: () => o2 === null ? r2.enabled(e2) : o2, set: (e3) => {
            o2 = e3;
          }}), typeof r2.init == "function" && r2.init(t4), t4;
        }
        function a(e2, t4) {
          const n2 = r2(this.namespace + (typeof t4 == "undefined" ? ":" : t4) + e2);
          return n2.log = this.log, n2;
        }
        function o(e2) {
          return e2.toString().substring(2, e2.toString().length - 2).replace(/\.\*\?$/, "*");
        }
        return r2.debug = r2, r2.default = r2, r2.coerce = function(e2) {
          return e2 instanceof Error ? e2.stack || e2.message : e2;
        }, r2.disable = function() {
          const e2 = [...r2.names.map(o), ...r2.skips.map(o).map((e3) => "-" + e3)].join(",");
          return r2.enable(""), e2;
        }, r2.enable = function(e2) {
          r2.save(e2), r2.names = [], r2.skips = [];
          let t4;
          const n2 = (typeof e2 == "string" ? e2 : "").split(/[\s,]+/), a2 = n2.length;
          for (t4 = 0; t4 < a2; t4++)
            n2[t4] && (e2 = n2[t4].replace(/\*/g, ".*?"), e2[0] === "-" ? r2.skips.push(new RegExp("^" + e2.substr(1) + "$")) : r2.names.push(new RegExp("^" + e2 + "$")));
        }, r2.enabled = function(e2) {
          if (e2[e2.length - 1] === "*")
            return true;
          let t4, n2;
          for (t4 = 0, n2 = r2.skips.length; t4 < n2; t4++)
            if (r2.skips[t4].test(e2))
              return false;
          for (t4 = 0, n2 = r2.names.length; t4 < n2; t4++)
            if (r2.names[t4].test(e2))
              return true;
          return false;
        }, r2.humanize = e("ms"), r2.destroy = function() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }, Object.keys(t3).forEach((e2) => {
          r2[e2] = t3[e2];
        }), r2.names = [], r2.skips = [], r2.formatters = {}, r2.selectColor = function(e2) {
          let t4 = 0;
          for (let n2 = 0; n2 < e2.length; n2++)
            t4 = (t4 << 5) - t4 + e2.charCodeAt(n2), t4 |= 0;
          return r2.colors[n(t4) % r2.colors.length];
        }, r2.enable(r2.load()), r2;
      };
    }, {ms: 11}], 6: [function(e, t2) {
      function n2(e2, t3) {
        for (const n3 in t3)
          Object.defineProperty(e2, n3, {value: t3[n3], enumerable: true, configurable: true});
        return e2;
      }
      t2.exports = function(e2, t3, r2) {
        if (!e2 || typeof e2 == "string")
          throw new TypeError("Please pass an Error to err-code");
        r2 || (r2 = {}), typeof t3 == "object" && (r2 = t3, t3 = void 0), t3 != null && (r2.code = t3);
        try {
          return n2(e2, r2);
        } catch (t4) {
          r2.message = e2.message, r2.stack = e2.stack;
          const a = function() {
          };
          return a.prototype = Object.create(Object.getPrototypeOf(e2)), n2(new a(), r2);
        }
      };
    }, {}], 7: [function(e, t2) {
      function n2(e2) {
        console && console.warn && console.warn(e2);
      }
      function r2() {
        r2.init.call(this);
      }
      function a(e2) {
        if (typeof e2 != "function")
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e2);
      }
      function o(e2) {
        return e2._maxListeners === void 0 ? r2.defaultMaxListeners : e2._maxListeners;
      }
      function i(e2, t3, r3, i2) {
        var d3, s3, l2;
        if (a(r3), s3 = e2._events, s3 === void 0 ? (s3 = e2._events = Object.create(null), e2._eventsCount = 0) : (s3.newListener !== void 0 && (e2.emit("newListener", t3, r3.listener ? r3.listener : r3), s3 = e2._events), l2 = s3[t3]), l2 === void 0)
          l2 = s3[t3] = r3, ++e2._eventsCount;
        else if (typeof l2 == "function" ? l2 = s3[t3] = i2 ? [r3, l2] : [l2, r3] : i2 ? l2.unshift(r3) : l2.push(r3), d3 = o(e2), 0 < d3 && l2.length > d3 && !l2.warned) {
          l2.warned = true;
          var c2 = new Error("Possible EventEmitter memory leak detected. " + l2.length + " " + (t3 + " listeners added. Use emitter.setMaxListeners() to increase limit"));
          c2.name = "MaxListenersExceededWarning", c2.emitter = e2, c2.type = t3, c2.count = l2.length, n2(c2);
        }
        return e2;
      }
      function d2() {
        if (!this.fired)
          return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
      }
      function s2(e2, t3, n3) {
        var r3 = {fired: false, wrapFn: void 0, target: e2, type: t3, listener: n3}, a2 = d2.bind(r3);
        return a2.listener = n3, r3.wrapFn = a2, a2;
      }
      function l(e2, t3, n3) {
        var r3 = e2._events;
        if (r3 === void 0)
          return [];
        var a2 = r3[t3];
        return a2 === void 0 ? [] : typeof a2 == "function" ? n3 ? [a2.listener || a2] : [a2] : n3 ? f(a2) : u(a2, a2.length);
      }
      function c(e2) {
        var t3 = this._events;
        if (t3 !== void 0) {
          var n3 = t3[e2];
          if (typeof n3 == "function")
            return 1;
          if (n3 !== void 0)
            return n3.length;
        }
        return 0;
      }
      function u(e2, t3) {
        for (var n3 = Array(t3), r3 = 0; r3 < t3; ++r3)
          n3[r3] = e2[r3];
        return n3;
      }
      function p(e2, t3) {
        for (; t3 + 1 < e2.length; t3++)
          e2[t3] = e2[t3 + 1];
        e2.pop();
      }
      function f(e2) {
        for (var t3 = Array(e2.length), n3 = 0; n3 < t3.length; ++n3)
          t3[n3] = e2[n3].listener || e2[n3];
        return t3;
      }
      function g(e2, t3, n3) {
        typeof e2.on == "function" && _(e2, "error", t3, n3);
      }
      function _(e2, t3, n3, r3) {
        if (typeof e2.on == "function")
          r3.once ? e2.once(t3, n3) : e2.on(t3, n3);
        else if (typeof e2.addEventListener == "function")
          e2.addEventListener(t3, function a2(o2) {
            r3.once && e2.removeEventListener(t3, a2), n3(o2);
          });
        else
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof e2);
      }
      var h, m = typeof Reflect == "object" ? Reflect : null, b = m && typeof m.apply == "function" ? m.apply : function(e2, t3, n3) {
        return Function.prototype.apply.call(e2, t3, n3);
      };
      h = m && typeof m.ownKeys == "function" ? m.ownKeys : Object.getOwnPropertySymbols ? function(e2) {
        return Object.getOwnPropertyNames(e2).concat(Object.getOwnPropertySymbols(e2));
      } : function(e2) {
        return Object.getOwnPropertyNames(e2);
      };
      var y = Number.isNaN || function(e2) {
        return e2 !== e2;
      };
      t2.exports = r2, t2.exports.once = function(e2, t3) {
        return new Promise(function(n3, r3) {
          function a2(n4) {
            e2.removeListener(t3, o2), r3(n4);
          }
          function o2() {
            typeof e2.removeListener == "function" && e2.removeListener("error", a2), n3([].slice.call(arguments));
          }
          _(e2, t3, o2, {once: true}), t3 !== "error" && g(e2, a2, {once: true});
        });
      }, r2.EventEmitter = r2, r2.prototype._events = void 0, r2.prototype._eventsCount = 0, r2.prototype._maxListeners = void 0;
      var C = 10;
      Object.defineProperty(r2, "defaultMaxListeners", {enumerable: true, get: function() {
        return C;
      }, set: function(e2) {
        if (typeof e2 != "number" || 0 > e2 || y(e2))
          throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + e2 + ".");
        C = e2;
      }}), r2.init = function() {
        (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
      }, r2.prototype.setMaxListeners = function(e2) {
        if (typeof e2 != "number" || 0 > e2 || y(e2))
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e2 + ".");
        return this._maxListeners = e2, this;
      }, r2.prototype.getMaxListeners = function() {
        return o(this);
      }, r2.prototype.emit = function(e2) {
        for (var t3 = [], n3 = 1; n3 < arguments.length; n3++)
          t3.push(arguments[n3]);
        var r3 = e2 === "error", a2 = this._events;
        if (a2 !== void 0)
          r3 = r3 && a2.error === void 0;
        else if (!r3)
          return false;
        if (r3) {
          var o2;
          if (0 < t3.length && (o2 = t3[0]), o2 instanceof Error)
            throw o2;
          var d3 = new Error("Unhandled error." + (o2 ? " (" + o2.message + ")" : ""));
          throw d3.context = o2, d3;
        }
        var s3 = a2[e2];
        if (s3 === void 0)
          return false;
        if (typeof s3 == "function")
          b(s3, this, t3);
        else
          for (var l2 = s3.length, c2 = u(s3, l2), n3 = 0; n3 < l2; ++n3)
            b(c2[n3], this, t3);
        return true;
      }, r2.prototype.addListener = function(e2, t3) {
        return i(this, e2, t3, false);
      }, r2.prototype.on = r2.prototype.addListener, r2.prototype.prependListener = function(e2, t3) {
        return i(this, e2, t3, true);
      }, r2.prototype.once = function(e2, t3) {
        return a(t3), this.on(e2, s2(this, e2, t3)), this;
      }, r2.prototype.prependOnceListener = function(e2, t3) {
        return a(t3), this.prependListener(e2, s2(this, e2, t3)), this;
      }, r2.prototype.removeListener = function(e2, t3) {
        var n3, r3, o2, d3, s3;
        if (a(t3), r3 = this._events, r3 === void 0)
          return this;
        if (n3 = r3[e2], n3 === void 0)
          return this;
        if (n3 === t3 || n3.listener === t3)
          --this._eventsCount == 0 ? this._events = Object.create(null) : (delete r3[e2], r3.removeListener && this.emit("removeListener", e2, n3.listener || t3));
        else if (typeof n3 != "function") {
          for (o2 = -1, d3 = n3.length - 1; 0 <= d3; d3--)
            if (n3[d3] === t3 || n3[d3].listener === t3) {
              s3 = n3[d3].listener, o2 = d3;
              break;
            }
          if (0 > o2)
            return this;
          o2 === 0 ? n3.shift() : p(n3, o2), n3.length === 1 && (r3[e2] = n3[0]), r3.removeListener !== void 0 && this.emit("removeListener", e2, s3 || t3);
        }
        return this;
      }, r2.prototype.off = r2.prototype.removeListener, r2.prototype.removeAllListeners = function(e2) {
        var t3, n3, r3;
        if (n3 = this._events, n3 === void 0)
          return this;
        if (n3.removeListener === void 0)
          return arguments.length === 0 ? (this._events = Object.create(null), this._eventsCount = 0) : n3[e2] !== void 0 && (--this._eventsCount == 0 ? this._events = Object.create(null) : delete n3[e2]), this;
        if (arguments.length === 0) {
          var a2, o2 = Object.keys(n3);
          for (r3 = 0; r3 < o2.length; ++r3)
            a2 = o2[r3], a2 !== "removeListener" && this.removeAllListeners(a2);
          return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this;
        }
        if (t3 = n3[e2], typeof t3 == "function")
          this.removeListener(e2, t3);
        else if (t3 !== void 0)
          for (r3 = t3.length - 1; 0 <= r3; r3--)
            this.removeListener(e2, t3[r3]);
        return this;
      }, r2.prototype.listeners = function(e2) {
        return l(this, e2, true);
      }, r2.prototype.rawListeners = function(e2) {
        return l(this, e2, false);
      }, r2.listenerCount = function(e2, t3) {
        return typeof e2.listenerCount == "function" ? e2.listenerCount(t3) : c.call(e2, t3);
      }, r2.prototype.listenerCount = c, r2.prototype.eventNames = function() {
        return 0 < this._eventsCount ? h(this._events) : [];
      };
    }, {}], 8: [function(e, t2) {
      t2.exports = function() {
        if (typeof globalThis == "undefined")
          return null;
        var e2 = {RTCPeerConnection: globalThis.RTCPeerConnection || globalThis.mozRTCPeerConnection || globalThis.webkitRTCPeerConnection, RTCSessionDescription: globalThis.RTCSessionDescription || globalThis.mozRTCSessionDescription || globalThis.webkitRTCSessionDescription, RTCIceCandidate: globalThis.RTCIceCandidate || globalThis.mozRTCIceCandidate || globalThis.webkitRTCIceCandidate};
        return e2.RTCPeerConnection ? e2 : null;
      };
    }, {}], 9: [function(e, a, o) {
      /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
      o.read = function(t2, n2, a2, o2, l) {
        var c, u, p = 8 * l - o2 - 1, f = (1 << p) - 1, g = f >> 1, _ = -7, h = a2 ? l - 1 : 0, b = a2 ? -1 : 1, d2 = t2[n2 + h];
        for (h += b, c = d2 & (1 << -_) - 1, d2 >>= -_, _ += p; 0 < _; c = 256 * c + t2[n2 + h], h += b, _ -= 8)
          ;
        for (u = c & (1 << -_) - 1, c >>= -_, _ += o2; 0 < _; u = 256 * u + t2[n2 + h], h += b, _ -= 8)
          ;
        if (c === 0)
          c = 1 - g;
        else {
          if (c === f)
            return u ? NaN : (d2 ? -1 : 1) * (1 / 0);
          u += r(2, o2), c -= g;
        }
        return (d2 ? -1 : 1) * u * r(2, c - o2);
      }, o.write = function(a2, o2, l, u, p, f) {
        var h, b, y, g = Math.LN2, _ = Math.log, C = 8 * f - p - 1, R = (1 << C) - 1, E = R >> 1, w = p === 23 ? r(2, -24) - r(2, -77) : 0, S = u ? 0 : f - 1, T = u ? 1 : -1, d2 = 0 > o2 || o2 === 0 && 0 > 1 / o2 ? 1 : 0;
        for (o2 = n(o2), isNaN(o2) || o2 === 1 / 0 ? (b = isNaN(o2) ? 1 : 0, h = R) : (h = t(_(o2) / g), 1 > o2 * (y = r(2, -h)) && (h--, y *= 2), o2 += 1 <= h + E ? w / y : w * r(2, 1 - E), 2 <= o2 * y && (h++, y /= 2), h + E >= R ? (b = 0, h = R) : 1 <= h + E ? (b = (o2 * y - 1) * r(2, p), h += E) : (b = o2 * r(2, E - 1) * r(2, p), h = 0)); 8 <= p; a2[l + S] = 255 & b, S += T, b /= 256, p -= 8)
          ;
        for (h = h << p | b, C += p; 0 < C; a2[l + S] = 255 & h, S += T, h /= 256, C -= 8)
          ;
        a2[l + S - T] |= 128 * d2;
      };
    }, {}], 10: [function(e, t2) {
      t2.exports = typeof Object.create == "function" ? function(e2, t3) {
        t3 && (e2.super_ = t3, e2.prototype = Object.create(t3.prototype, {constructor: {value: e2, enumerable: false, writable: true, configurable: true}}));
      } : function(e2, t3) {
        if (t3) {
          e2.super_ = t3;
          var n2 = function() {
          };
          n2.prototype = t3.prototype, e2.prototype = new n2(), e2.prototype.constructor = e2;
        }
      };
    }, {}], 11: [function(e, t2) {
      var r2 = Math.round;
      function a(e2) {
        if (e2 += "", !(100 < e2.length)) {
          var t3 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e2);
          if (t3) {
            var r3 = parseFloat(t3[1]), n2 = (t3[2] || "ms").toLowerCase();
            return n2 === "years" || n2 === "year" || n2 === "yrs" || n2 === "yr" || n2 === "y" ? 315576e5 * r3 : n2 === "weeks" || n2 === "week" || n2 === "w" ? 6048e5 * r3 : n2 === "days" || n2 === "day" || n2 === "d" ? 864e5 * r3 : n2 === "hours" || n2 === "hour" || n2 === "hrs" || n2 === "hr" || n2 === "h" ? 36e5 * r3 : n2 === "minutes" || n2 === "minute" || n2 === "mins" || n2 === "min" || n2 === "m" ? 6e4 * r3 : n2 === "seconds" || n2 === "second" || n2 === "secs" || n2 === "sec" || n2 === "s" ? 1e3 * r3 : n2 === "milliseconds" || n2 === "millisecond" || n2 === "msecs" || n2 === "msec" || n2 === "ms" ? r3 : void 0;
          }
        }
      }
      function o(e2) {
        var t3 = n(e2);
        return 864e5 <= t3 ? r2(e2 / 864e5) + "d" : 36e5 <= t3 ? r2(e2 / 36e5) + "h" : 6e4 <= t3 ? r2(e2 / 6e4) + "m" : 1e3 <= t3 ? r2(e2 / 1e3) + "s" : e2 + "ms";
      }
      function i(e2) {
        var t3 = n(e2);
        return 864e5 <= t3 ? s2(e2, t3, 864e5, "day") : 36e5 <= t3 ? s2(e2, t3, 36e5, "hour") : 6e4 <= t3 ? s2(e2, t3, 6e4, "minute") : 1e3 <= t3 ? s2(e2, t3, 1e3, "second") : e2 + " ms";
      }
      function s2(e2, t3, a2, n2) {
        return r2(e2 / a2) + " " + n2 + (t3 >= 1.5 * a2 ? "s" : "");
      }
      t2.exports = function(e2, t3) {
        t3 = t3 || {};
        var n2 = typeof e2;
        if (n2 == "string" && 0 < e2.length)
          return a(e2);
        if (n2 === "number" && isFinite(e2))
          return t3.long ? i(e2) : o(e2);
        throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e2));
      };
    }, {}], 12: [function(e, t2) {
      function n2() {
        throw new Error("setTimeout has not been defined");
      }
      function r2() {
        throw new Error("clearTimeout has not been defined");
      }
      function a(t3) {
        if (c === setTimeout)
          return setTimeout(t3, 0);
        if ((c === n2 || !c) && setTimeout)
          return c = setTimeout, setTimeout(t3, 0);
        try {
          return c(t3, 0);
        } catch (n3) {
          try {
            return c.call(null, t3, 0);
          } catch (n4) {
            return c.call(this, t3, 0);
          }
        }
      }
      function o(t3) {
        if (u === clearTimeout)
          return clearTimeout(t3);
        if ((u === r2 || !u) && clearTimeout)
          return u = clearTimeout, clearTimeout(t3);
        try {
          return u(t3);
        } catch (n3) {
          try {
            return u.call(null, t3);
          } catch (n4) {
            return u.call(this, t3);
          }
        }
      }
      function i() {
        _ && f && (_ = false, f.length ? g = f.concat(g) : h = -1, g.length && d2());
      }
      function d2() {
        if (!_) {
          var e2 = a(i);
          _ = true;
          for (var t3 = g.length; t3; ) {
            for (f = g, g = []; ++h < t3; )
              f && f[h].run();
            h = -1, t3 = g.length;
          }
          f = null, _ = false, o(e2);
        }
      }
      function s2(e2, t3) {
        this.fun = e2, this.array = t3;
      }
      function l() {
      }
      var c, u, p = t2.exports = {};
      (function() {
        try {
          c = typeof setTimeout == "function" ? setTimeout : n2;
        } catch (t3) {
          c = n2;
        }
        try {
          u = typeof clearTimeout == "function" ? clearTimeout : r2;
        } catch (t3) {
          u = r2;
        }
      })();
      var f, g = [], _ = false, h = -1;
      p.nextTick = function(e2) {
        var t3 = Array(arguments.length - 1);
        if (1 < arguments.length)
          for (var n3 = 1; n3 < arguments.length; n3++)
            t3[n3 - 1] = arguments[n3];
        g.push(new s2(e2, t3)), g.length !== 1 || _ || a(d2);
      }, s2.prototype.run = function() {
        this.fun.apply(null, this.array);
      }, p.title = "browser", p.browser = true, p.env = {}, p.argv = [], p.version = "", p.versions = {}, p.on = l, p.addListener = l, p.once = l, p.off = l, p.removeListener = l, p.removeAllListeners = l, p.emit = l, p.prependListener = l, p.prependOnceListener = l, p.listeners = function() {
        return [];
      }, p.binding = function() {
        throw new Error("process.binding is not supported");
      }, p.cwd = function() {
        return "/";
      }, p.chdir = function() {
        throw new Error("process.chdir is not supported");
      }, p.umask = function() {
        return 0;
      };
    }, {}], 13: [function(e, t2) {
      /*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
      let n2;
      t2.exports = typeof queueMicrotask == "function" ? queueMicrotask.bind(globalThis) : (e2) => (n2 || (n2 = Promise.resolve())).then(e2).catch((e3) => setTimeout(() => {
        throw e3;
      }, 0));
    }, {}], 14: [function(e, t2) {
      (function(n2, r2) {
        (function() {
          var a = e("safe-buffer").Buffer, o = r2.crypto || r2.msCrypto;
          t2.exports = o && o.getRandomValues ? function(e2, t3) {
            if (e2 > 4294967295)
              throw new RangeError("requested too many random bytes");
            var r3 = a.allocUnsafe(e2);
            if (0 < e2)
              if (65536 < e2)
                for (var i = 0; i < e2; i += 65536)
                  o.getRandomValues(r3.slice(i, i + 65536));
              else
                o.getRandomValues(r3);
            return typeof t3 == "function" ? n2.nextTick(function() {
              t3(null, r3);
            }) : r3;
          } : function() {
            throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11");
          };
        }).call(this);
      }).call(this, e("_process"), typeof commonjsGlobal == "undefined" ? typeof self == "undefined" ? typeof window == "undefined" ? {} : window : self : commonjsGlobal);
    }, {_process: 12, "safe-buffer": 30}], 15: [function(e, t2) {
      function n2(e2, t3) {
        e2.prototype = Object.create(t3.prototype), e2.prototype.constructor = e2, e2.__proto__ = t3;
      }
      function r2(e2, t3, r3) {
        function a2(e3, n3, r4) {
          return typeof t3 == "string" ? t3 : t3(e3, n3, r4);
        }
        r3 || (r3 = Error);
        var o2 = function(e3) {
          function t4(t5, n3, r4) {
            return e3.call(this, a2(t5, n3, r4)) || this;
          }
          return n2(t4, e3), t4;
        }(r3);
        o2.prototype.name = r3.name, o2.prototype.code = e2, s2[e2] = o2;
      }
      function a(e2, t3) {
        if (Array.isArray(e2)) {
          var n3 = e2.length;
          return e2 = e2.map(function(e3) {
            return e3 + "";
          }), 2 < n3 ? "one of ".concat(t3, " ").concat(e2.slice(0, n3 - 1).join(", "), ", or ") + e2[n3 - 1] : n3 === 2 ? "one of ".concat(t3, " ").concat(e2[0], " or ").concat(e2[1]) : "of ".concat(t3, " ").concat(e2[0]);
        }
        return "of ".concat(t3, " ").concat(e2 + "");
      }
      function o(e2, t3, n3) {
        return e2.substr(!n3 || 0 > n3 ? 0 : +n3, t3.length) === t3;
      }
      function i(e2, t3, n3) {
        return (n3 === void 0 || n3 > e2.length) && (n3 = e2.length), e2.substring(n3 - t3.length, n3) === t3;
      }
      function d2(e2, t3, n3) {
        return typeof n3 != "number" && (n3 = 0), !(n3 + t3.length > e2.length) && e2.indexOf(t3, n3) !== -1;
      }
      var s2 = {};
      r2("ERR_INVALID_OPT_VALUE", function(e2, t3) {
        return 'The value "' + t3 + '" is invalid for option "' + e2 + '"';
      }, TypeError), r2("ERR_INVALID_ARG_TYPE", function(e2, t3, n3) {
        var r3;
        typeof t3 == "string" && o(t3, "not ") ? (r3 = "must not be", t3 = t3.replace(/^not /, "")) : r3 = "must be";
        var s3;
        if (i(e2, " argument"))
          s3 = "The ".concat(e2, " ").concat(r3, " ").concat(a(t3, "type"));
        else {
          var l = d2(e2, ".") ? "property" : "argument";
          s3 = 'The "'.concat(e2, '" ').concat(l, " ").concat(r3, " ").concat(a(t3, "type"));
        }
        return s3 += ". Received type ".concat(typeof n3), s3;
      }, TypeError), r2("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"), r2("ERR_METHOD_NOT_IMPLEMENTED", function(e2) {
        return "The " + e2 + " method is not implemented";
      }), r2("ERR_STREAM_PREMATURE_CLOSE", "Premature close"), r2("ERR_STREAM_DESTROYED", function(e2) {
        return "Cannot call " + e2 + " after a stream was destroyed";
      }), r2("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"), r2("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"), r2("ERR_STREAM_WRITE_AFTER_END", "write after end"), r2("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), r2("ERR_UNKNOWN_ENCODING", function(e2) {
        return "Unknown encoding: " + e2;
      }, TypeError), r2("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"), t2.exports.codes = s2;
    }, {}], 16: [function(e, t2) {
      (function(n2) {
        (function() {
          function r2(e2) {
            return this instanceof r2 ? void (d2.call(this, e2), s2.call(this, e2), this.allowHalfOpen = true, e2 && (e2.readable === false && (this.readable = false), e2.writable === false && (this.writable = false), e2.allowHalfOpen === false && (this.allowHalfOpen = false, this.once("end", a)))) : new r2(e2);
          }
          function a() {
            this._writableState.ended || n2.nextTick(o, this);
          }
          function o(e2) {
            e2.end();
          }
          var i = Object.keys || function(e2) {
            var t3 = [];
            for (var n3 in e2)
              t3.push(n3);
            return t3;
          };
          t2.exports = r2;
          var d2 = e("./_stream_readable"), s2 = e("./_stream_writable");
          e("inherits")(r2, d2);
          for (var l, c = i(s2.prototype), u = 0; u < c.length; u++)
            l = c[u], r2.prototype[l] || (r2.prototype[l] = s2.prototype[l]);
          Object.defineProperty(r2.prototype, "writableHighWaterMark", {enumerable: false, get: function() {
            return this._writableState.highWaterMark;
          }}), Object.defineProperty(r2.prototype, "writableBuffer", {enumerable: false, get: function() {
            return this._writableState && this._writableState.getBuffer();
          }}), Object.defineProperty(r2.prototype, "writableLength", {enumerable: false, get: function() {
            return this._writableState.length;
          }}), Object.defineProperty(r2.prototype, "destroyed", {enumerable: false, get: function() {
            return this._readableState !== void 0 && this._writableState !== void 0 && this._readableState.destroyed && this._writableState.destroyed;
          }, set: function(e2) {
            this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = e2, this._writableState.destroyed = e2);
          }});
        }).call(this);
      }).call(this, e("_process"));
    }, {"./_stream_readable": 18, "./_stream_writable": 20, _process: 12, inherits: 10}], 17: [function(e, t2) {
      function n2(e2) {
        return this instanceof n2 ? void r2.call(this, e2) : new n2(e2);
      }
      t2.exports = n2;
      var r2 = e("./_stream_transform");
      e("inherits")(n2, r2), n2.prototype._transform = function(e2, t3, n3) {
        n3(null, e2);
      };
    }, {"./_stream_transform": 19, inherits: 10}], 18: [function(e, t2) {
      (function(n2, r2) {
        (function() {
          function a(e2) {
            return P.from(e2);
          }
          function o(e2) {
            return P.isBuffer(e2) || e2 instanceof M;
          }
          function i(e2, t3, n3) {
            return typeof e2.prependListener == "function" ? e2.prependListener(t3, n3) : void (e2._events && e2._events[t3] ? Array.isArray(e2._events[t3]) ? e2._events[t3].unshift(n3) : e2._events[t3] = [n3, e2._events[t3]] : e2.on(t3, n3));
          }
          function d2(t3, n3, r3) {
            A = A || e("./_stream_duplex"), t3 = t3 || {}, typeof r3 != "boolean" && (r3 = n3 instanceof A), this.objectMode = !!t3.objectMode, r3 && (this.objectMode = this.objectMode || !!t3.readableObjectMode), this.highWaterMark = H(this, t3, "readableHighWaterMark", r3), this.buffer = new j(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = false, this.endEmitted = false, this.reading = false, this.sync = true, this.needReadable = false, this.emittedReadable = false, this.readableListening = false, this.resumeScheduled = false, this.paused = true, this.emitClose = t3.emitClose !== false, this.autoDestroy = !!t3.autoDestroy, this.destroyed = false, this.defaultEncoding = t3.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = false, this.decoder = null, this.encoding = null, t3.encoding && (!F && (F = e("string_decoder/").StringDecoder), this.decoder = new F(t3.encoding), this.encoding = t3.encoding);
          }
          function s2(t3) {
            if (A = A || e("./_stream_duplex"), !(this instanceof s2))
              return new s2(t3);
            var n3 = this instanceof A;
            this._readableState = new d2(t3, this, n3), this.readable = true, t3 && (typeof t3.read == "function" && (this._read = t3.read), typeof t3.destroy == "function" && (this._destroy = t3.destroy)), I.call(this);
          }
          function l(e2, t3, n3, r3, o2) {
            x("readableAddChunk", t3);
            var i2 = e2._readableState;
            if (t3 === null)
              i2.reading = false, g(e2, i2);
            else {
              var d3;
              if (o2 || (d3 = u(i2, t3)), d3)
                X(e2, d3);
              else if (!(i2.objectMode || t3 && 0 < t3.length))
                r3 || (i2.reading = false, m(e2, i2));
              else if (typeof t3 == "string" || i2.objectMode || Object.getPrototypeOf(t3) === P.prototype || (t3 = a(t3)), r3)
                i2.endEmitted ? X(e2, new K()) : c(e2, i2, t3, true);
              else if (i2.ended)
                X(e2, new z());
              else {
                if (i2.destroyed)
                  return false;
                i2.reading = false, i2.decoder && !n3 ? (t3 = i2.decoder.write(t3), i2.objectMode || t3.length !== 0 ? c(e2, i2, t3, false) : m(e2, i2)) : c(e2, i2, t3, false);
              }
            }
            return !i2.ended && (i2.length < i2.highWaterMark || i2.length === 0);
          }
          function c(e2, t3, n3, r3) {
            t3.flowing && t3.length === 0 && !t3.sync ? (t3.awaitDrain = 0, e2.emit("data", n3)) : (t3.length += t3.objectMode ? 1 : n3.length, r3 ? t3.buffer.unshift(n3) : t3.buffer.push(n3), t3.needReadable && _(e2)), m(e2, t3);
          }
          function u(e2, t3) {
            var n3;
            return o(t3) || typeof t3 == "string" || t3 === void 0 || e2.objectMode || (n3 = new V("chunk", ["string", "Buffer", "Uint8Array"], t3)), n3;
          }
          function p(e2) {
            return 1073741824 <= e2 ? e2 = 1073741824 : (e2--, e2 |= e2 >>> 1, e2 |= e2 >>> 2, e2 |= e2 >>> 4, e2 |= e2 >>> 8, e2 |= e2 >>> 16, e2++), e2;
          }
          function f(e2, t3) {
            return 0 >= e2 || t3.length === 0 && t3.ended ? 0 : t3.objectMode ? 1 : e2 === e2 ? (e2 > t3.highWaterMark && (t3.highWaterMark = p(e2)), e2 <= t3.length ? e2 : t3.ended ? t3.length : (t3.needReadable = true, 0)) : t3.flowing && t3.length ? t3.buffer.head.data.length : t3.length;
          }
          function g(e2, t3) {
            if (x("onEofChunk"), !t3.ended) {
              if (t3.decoder) {
                var n3 = t3.decoder.end();
                n3 && n3.length && (t3.buffer.push(n3), t3.length += t3.objectMode ? 1 : n3.length);
              }
              t3.ended = true, t3.sync ? _(e2) : (t3.needReadable = false, !t3.emittedReadable && (t3.emittedReadable = true, h(e2)));
            }
          }
          function _(e2) {
            var t3 = e2._readableState;
            x("emitReadable", t3.needReadable, t3.emittedReadable), t3.needReadable = false, t3.emittedReadable || (x("emitReadable", t3.flowing), t3.emittedReadable = true, n2.nextTick(h, e2));
          }
          function h(e2) {
            var t3 = e2._readableState;
            x("emitReadable_", t3.destroyed, t3.length, t3.ended), !t3.destroyed && (t3.length || t3.ended) && (e2.emit("readable"), t3.emittedReadable = false), t3.needReadable = !t3.flowing && !t3.ended && t3.length <= t3.highWaterMark, S(e2);
          }
          function m(e2, t3) {
            t3.readingMore || (t3.readingMore = true, n2.nextTick(b, e2, t3));
          }
          function b(e2, t3) {
            for (; !t3.reading && !t3.ended && (t3.length < t3.highWaterMark || t3.flowing && t3.length === 0); ) {
              var n3 = t3.length;
              if (x("maybeReadMore read 0"), e2.read(0), n3 === t3.length)
                break;
            }
            t3.readingMore = false;
          }
          function y(e2) {
            return function() {
              var t3 = e2._readableState;
              x("pipeOnDrain", t3.awaitDrain), t3.awaitDrain && t3.awaitDrain--, t3.awaitDrain === 0 && D(e2, "data") && (t3.flowing = true, S(e2));
            };
          }
          function C(e2) {
            var t3 = e2._readableState;
            t3.readableListening = 0 < e2.listenerCount("readable"), t3.resumeScheduled && !t3.paused ? t3.flowing = true : 0 < e2.listenerCount("data") && e2.resume();
          }
          function R(e2) {
            x("readable nexttick read 0"), e2.read(0);
          }
          function E(e2, t3) {
            t3.resumeScheduled || (t3.resumeScheduled = true, n2.nextTick(w, e2, t3));
          }
          function w(e2, t3) {
            x("resume", t3.reading), t3.reading || e2.read(0), t3.resumeScheduled = false, e2.emit("resume"), S(e2), t3.flowing && !t3.reading && e2.read(0);
          }
          function S(e2) {
            var t3 = e2._readableState;
            for (x("flow", t3.flowing); t3.flowing && e2.read() !== null; )
              ;
          }
          function T(e2, t3) {
            if (t3.length === 0)
              return null;
            var n3;
            return t3.objectMode ? n3 = t3.buffer.shift() : !e2 || e2 >= t3.length ? (n3 = t3.decoder ? t3.buffer.join("") : t3.buffer.length === 1 ? t3.buffer.first() : t3.buffer.concat(t3.length), t3.buffer.clear()) : n3 = t3.buffer.consume(e2, t3.decoder), n3;
          }
          function v(e2) {
            var t3 = e2._readableState;
            x("endReadable", t3.endEmitted), t3.endEmitted || (t3.ended = true, n2.nextTick(k, t3, e2));
          }
          function k(e2, t3) {
            if (x("endReadableNT", e2.endEmitted, e2.length), !e2.endEmitted && e2.length === 0 && (e2.endEmitted = true, t3.readable = false, t3.emit("end"), e2.autoDestroy)) {
              var n3 = t3._writableState;
              (!n3 || n3.autoDestroy && n3.finished) && t3.destroy();
            }
          }
          function L(e2, t3) {
            for (var n3 = 0, r3 = e2.length; n3 < r3; n3++)
              if (e2[n3] === t3)
                return n3;
            return -1;
          }
          t2.exports = s2;
          var A;
          s2.ReadableState = d2;
          var x;
          e("events").EventEmitter;
          var D = function(e2, t3) {
            return e2.listeners(t3).length;
          }, I = e("./internal/streams/stream"), P = e("buffer").Buffer, M = r2.Uint8Array || function() {
          }, O = e("util");
          x = O && O.debuglog ? O.debuglog("stream") : function() {
          };
          var F, B, U, j = e("./internal/streams/buffer_list"), q = e("./internal/streams/destroy"), W = e("./internal/streams/state"), H = W.getHighWaterMark, Y = e("../errors").codes, V = Y.ERR_INVALID_ARG_TYPE, z = Y.ERR_STREAM_PUSH_AFTER_EOF, G = Y.ERR_METHOD_NOT_IMPLEMENTED, K = Y.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
          e("inherits")(s2, I);
          var X = q.errorOrDestroy, $ = ["error", "close", "destroy", "pause", "resume"];
          Object.defineProperty(s2.prototype, "destroyed", {enumerable: false, get: function() {
            return this._readableState !== void 0 && this._readableState.destroyed;
          }, set: function(e2) {
            this._readableState && (this._readableState.destroyed = e2);
          }}), s2.prototype.destroy = q.destroy, s2.prototype._undestroy = q.undestroy, s2.prototype._destroy = function(e2, t3) {
            t3(e2);
          }, s2.prototype.push = function(e2, t3) {
            var n3, r3 = this._readableState;
            return r3.objectMode ? n3 = true : typeof e2 == "string" && (t3 = t3 || r3.defaultEncoding, t3 !== r3.encoding && (e2 = P.from(e2, t3), t3 = ""), n3 = true), l(this, e2, t3, false, n3);
          }, s2.prototype.unshift = function(e2) {
            return l(this, e2, null, true, false);
          }, s2.prototype.isPaused = function() {
            return this._readableState.flowing === false;
          }, s2.prototype.setEncoding = function(t3) {
            F || (F = e("string_decoder/").StringDecoder);
            var n3 = new F(t3);
            this._readableState.decoder = n3, this._readableState.encoding = this._readableState.decoder.encoding;
            for (var r3 = this._readableState.buffer.head, a2 = ""; r3 !== null; )
              a2 += n3.write(r3.data), r3 = r3.next;
            return this._readableState.buffer.clear(), a2 !== "" && this._readableState.buffer.push(a2), this._readableState.length = a2.length, this;
          };
          s2.prototype.read = function(e2) {
            x("read", e2), e2 = parseInt(e2, 10);
            var t3 = this._readableState, r3 = e2;
            if (e2 !== 0 && (t3.emittedReadable = false), e2 === 0 && t3.needReadable && ((t3.highWaterMark === 0 ? 0 < t3.length : t3.length >= t3.highWaterMark) || t3.ended))
              return x("read: emitReadable", t3.length, t3.ended), t3.length === 0 && t3.ended ? v(this) : _(this), null;
            if (e2 = f(e2, t3), e2 === 0 && t3.ended)
              return t3.length === 0 && v(this), null;
            var a2 = t3.needReadable;
            x("need readable", a2), (t3.length === 0 || t3.length - e2 < t3.highWaterMark) && (a2 = true, x("length less than watermark", a2)), t3.ended || t3.reading ? (a2 = false, x("reading or ended", a2)) : a2 && (x("do read"), t3.reading = true, t3.sync = true, t3.length === 0 && (t3.needReadable = true), this._read(t3.highWaterMark), t3.sync = false, !t3.reading && (e2 = f(r3, t3)));
            var o2;
            return o2 = 0 < e2 ? T(e2, t3) : null, o2 === null ? (t3.needReadable = t3.length <= t3.highWaterMark, e2 = 0) : (t3.length -= e2, t3.awaitDrain = 0), t3.length === 0 && (!t3.ended && (t3.needReadable = true), r3 !== e2 && t3.ended && v(this)), o2 !== null && this.emit("data", o2), o2;
          }, s2.prototype._read = function() {
            X(this, new G("_read()"));
          }, s2.prototype.pipe = function(e2, t3) {
            function r3(e3, t4) {
              x("onunpipe"), e3 === p2 && t4 && t4.hasUnpiped === false && (t4.hasUnpiped = true, o2());
            }
            function a2() {
              x("onend"), e2.end();
            }
            function o2() {
              x("cleanup"), e2.removeListener("close", l2), e2.removeListener("finish", c2), e2.removeListener("drain", h2), e2.removeListener("error", s3), e2.removeListener("unpipe", r3), p2.removeListener("end", a2), p2.removeListener("end", u2), p2.removeListener("data", d3), m2 = true, f2.awaitDrain && (!e2._writableState || e2._writableState.needDrain) && h2();
            }
            function d3(t4) {
              x("ondata");
              var n3 = e2.write(t4);
              x("dest.write", n3), n3 === false && ((f2.pipesCount === 1 && f2.pipes === e2 || 1 < f2.pipesCount && L(f2.pipes, e2) !== -1) && !m2 && (x("false write response, pause", f2.awaitDrain), f2.awaitDrain++), p2.pause());
            }
            function s3(t4) {
              x("onerror", t4), u2(), e2.removeListener("error", s3), D(e2, "error") === 0 && X(e2, t4);
            }
            function l2() {
              e2.removeListener("finish", c2), u2();
            }
            function c2() {
              x("onfinish"), e2.removeListener("close", l2), u2();
            }
            function u2() {
              x("unpipe"), p2.unpipe(e2);
            }
            var p2 = this, f2 = this._readableState;
            switch (f2.pipesCount) {
              case 0:
                f2.pipes = e2;
                break;
              case 1:
                f2.pipes = [f2.pipes, e2];
                break;
              default:
                f2.pipes.push(e2);
            }
            f2.pipesCount += 1, x("pipe count=%d opts=%j", f2.pipesCount, t3);
            var g2 = (!t3 || t3.end !== false) && e2 !== n2.stdout && e2 !== n2.stderr, _2 = g2 ? a2 : u2;
            f2.endEmitted ? n2.nextTick(_2) : p2.once("end", _2), e2.on("unpipe", r3);
            var h2 = y(p2);
            e2.on("drain", h2);
            var m2 = false;
            return p2.on("data", d3), i(e2, "error", s3), e2.once("close", l2), e2.once("finish", c2), e2.emit("pipe", p2), f2.flowing || (x("pipe resume"), p2.resume()), e2;
          }, s2.prototype.unpipe = function(e2) {
            var t3 = this._readableState, n3 = {hasUnpiped: false};
            if (t3.pipesCount === 0)
              return this;
            if (t3.pipesCount === 1)
              return e2 && e2 !== t3.pipes ? this : (e2 || (e2 = t3.pipes), t3.pipes = null, t3.pipesCount = 0, t3.flowing = false, e2 && e2.emit("unpipe", this, n3), this);
            if (!e2) {
              var r3 = t3.pipes, a2 = t3.pipesCount;
              t3.pipes = null, t3.pipesCount = 0, t3.flowing = false;
              for (var o2 = 0; o2 < a2; o2++)
                r3[o2].emit("unpipe", this, {hasUnpiped: false});
              return this;
            }
            var d3 = L(t3.pipes, e2);
            return d3 === -1 ? this : (t3.pipes.splice(d3, 1), t3.pipesCount -= 1, t3.pipesCount === 1 && (t3.pipes = t3.pipes[0]), e2.emit("unpipe", this, n3), this);
          }, s2.prototype.on = function(e2, t3) {
            var r3 = I.prototype.on.call(this, e2, t3), a2 = this._readableState;
            return e2 === "data" ? (a2.readableListening = 0 < this.listenerCount("readable"), a2.flowing !== false && this.resume()) : e2 == "readable" && !a2.endEmitted && !a2.readableListening && (a2.readableListening = a2.needReadable = true, a2.flowing = false, a2.emittedReadable = false, x("on readable", a2.length, a2.reading), a2.length ? _(this) : !a2.reading && n2.nextTick(R, this)), r3;
          }, s2.prototype.addListener = s2.prototype.on, s2.prototype.removeListener = function(e2, t3) {
            var r3 = I.prototype.removeListener.call(this, e2, t3);
            return e2 === "readable" && n2.nextTick(C, this), r3;
          }, s2.prototype.removeAllListeners = function(e2) {
            var t3 = I.prototype.removeAllListeners.apply(this, arguments);
            return (e2 === "readable" || e2 === void 0) && n2.nextTick(C, this), t3;
          }, s2.prototype.resume = function() {
            var e2 = this._readableState;
            return e2.flowing || (x("resume"), e2.flowing = !e2.readableListening, E(this, e2)), e2.paused = false, this;
          }, s2.prototype.pause = function() {
            return x("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== false && (x("pause"), this._readableState.flowing = false, this.emit("pause")), this._readableState.paused = true, this;
          }, s2.prototype.wrap = function(e2) {
            var t3 = this, r3 = this._readableState, a2 = false;
            for (var o2 in e2.on("end", function() {
              if (x("wrapped end"), r3.decoder && !r3.ended) {
                var e3 = r3.decoder.end();
                e3 && e3.length && t3.push(e3);
              }
              t3.push(null);
            }), e2.on("data", function(n3) {
              if ((x("wrapped data"), r3.decoder && (n3 = r3.decoder.write(n3)), !(r3.objectMode && (n3 === null || n3 === void 0))) && (r3.objectMode || n3 && n3.length)) {
                var o3 = t3.push(n3);
                o3 || (a2 = true, e2.pause());
              }
            }), e2)
              this[o2] === void 0 && typeof e2[o2] == "function" && (this[o2] = function(t4) {
                return function() {
                  return e2[t4].apply(e2, arguments);
                };
              }(o2));
            for (var i2 = 0; i2 < $.length; i2++)
              e2.on($[i2], this.emit.bind(this, $[i2]));
            return this._read = function(t4) {
              x("wrapped _read", t4), a2 && (a2 = false, e2.resume());
            }, this;
          }, typeof Symbol == "function" && (s2.prototype[Symbol.asyncIterator] = function() {
            return B === void 0 && (B = e("./internal/streams/async_iterator")), B(this);
          }), Object.defineProperty(s2.prototype, "readableHighWaterMark", {enumerable: false, get: function() {
            return this._readableState.highWaterMark;
          }}), Object.defineProperty(s2.prototype, "readableBuffer", {enumerable: false, get: function() {
            return this._readableState && this._readableState.buffer;
          }}), Object.defineProperty(s2.prototype, "readableFlowing", {enumerable: false, get: function() {
            return this._readableState.flowing;
          }, set: function(e2) {
            this._readableState && (this._readableState.flowing = e2);
          }}), s2._fromList = T, Object.defineProperty(s2.prototype, "readableLength", {enumerable: false, get: function() {
            return this._readableState.length;
          }}), typeof Symbol == "function" && (s2.from = function(t3, n3) {
            return U === void 0 && (U = e("./internal/streams/from")), U(s2, t3, n3);
          });
        }).call(this);
      }).call(this, e("_process"), typeof commonjsGlobal == "undefined" ? typeof self == "undefined" ? typeof window == "undefined" ? {} : window : self : commonjsGlobal);
    }, {"../errors": 15, "./_stream_duplex": 16, "./internal/streams/async_iterator": 21, "./internal/streams/buffer_list": 22, "./internal/streams/destroy": 23, "./internal/streams/from": 25, "./internal/streams/state": 27, "./internal/streams/stream": 28, _process: 12, buffer: 3, events: 7, inherits: 10, "string_decoder/": 31, util: 2}], 19: [function(e, t2) {
      function n2(e2, t3) {
        var n3 = this._transformState;
        n3.transforming = false;
        var r3 = n3.writecb;
        if (r3 === null)
          return this.emit("error", new s2());
        n3.writechunk = null, n3.writecb = null, t3 != null && this.push(t3), r3(e2);
        var a2 = this._readableState;
        a2.reading = false, (a2.needReadable || a2.length < a2.highWaterMark) && this._read(a2.highWaterMark);
      }
      function r2(e2) {
        return this instanceof r2 ? void (u.call(this, e2), this._transformState = {afterTransform: n2.bind(this), needTransform: false, transforming: false, writecb: null, writechunk: null, writeencoding: null}, this._readableState.needReadable = true, this._readableState.sync = false, e2 && (typeof e2.transform == "function" && (this._transform = e2.transform), typeof e2.flush == "function" && (this._flush = e2.flush)), this.on("prefinish", a)) : new r2(e2);
      }
      function a() {
        var e2 = this;
        typeof this._flush != "function" || this._readableState.destroyed ? o(this, null, null) : this._flush(function(t3, n3) {
          o(e2, t3, n3);
        });
      }
      function o(e2, t3, n3) {
        if (t3)
          return e2.emit("error", t3);
        if (n3 != null && e2.push(n3), e2._writableState.length)
          throw new c();
        if (e2._transformState.transforming)
          throw new l();
        return e2.push(null);
      }
      t2.exports = r2;
      var i = e("../errors").codes, d2 = i.ERR_METHOD_NOT_IMPLEMENTED, s2 = i.ERR_MULTIPLE_CALLBACK, l = i.ERR_TRANSFORM_ALREADY_TRANSFORMING, c = i.ERR_TRANSFORM_WITH_LENGTH_0, u = e("./_stream_duplex");
      e("inherits")(r2, u), r2.prototype.push = function(e2, t3) {
        return this._transformState.needTransform = false, u.prototype.push.call(this, e2, t3);
      }, r2.prototype._transform = function(e2, t3, n3) {
        n3(new d2("_transform()"));
      }, r2.prototype._write = function(e2, t3, n3) {
        var r3 = this._transformState;
        if (r3.writecb = n3, r3.writechunk = e2, r3.writeencoding = t3, !r3.transforming) {
          var a2 = this._readableState;
          (r3.needTransform || a2.needReadable || a2.length < a2.highWaterMark) && this._read(a2.highWaterMark);
        }
      }, r2.prototype._read = function() {
        var e2 = this._transformState;
        e2.writechunk === null || e2.transforming ? e2.needTransform = true : (e2.transforming = true, this._transform(e2.writechunk, e2.writeencoding, e2.afterTransform));
      }, r2.prototype._destroy = function(e2, t3) {
        u.prototype._destroy.call(this, e2, function(e3) {
          t3(e3);
        });
      };
    }, {"../errors": 15, "./_stream_duplex": 16, inherits: 10}], 20: [function(e, t2) {
      (function(n2, r2) {
        (function() {
          function a(e2) {
            var t3 = this;
            this.next = null, this.entry = null, this.finish = function() {
              v(t3, e2);
            };
          }
          function o(e2) {
            return x.from(e2);
          }
          function i(e2) {
            return x.isBuffer(e2) || e2 instanceof N;
          }
          function d2() {
          }
          function s2(t3, n3, r3) {
            k = k || e("./_stream_duplex"), t3 = t3 || {}, typeof r3 != "boolean" && (r3 = n3 instanceof k), this.objectMode = !!t3.objectMode, r3 && (this.objectMode = this.objectMode || !!t3.writableObjectMode), this.highWaterMark = P(this, t3, "writableHighWaterMark", r3), this.finalCalled = false, this.needDrain = false, this.ending = false, this.ended = false, this.finished = false, this.destroyed = false;
            var o2 = t3.decodeStrings === false;
            this.decodeStrings = !o2, this.defaultEncoding = t3.defaultEncoding || "utf8", this.length = 0, this.writing = false, this.corked = 0, this.sync = true, this.bufferProcessing = false, this.onwrite = function(e2) {
              m(n3, e2);
            }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = false, this.errorEmitted = false, this.emitClose = t3.emitClose !== false, this.autoDestroy = !!t3.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new a(this);
          }
          function l(t3) {
            k = k || e("./_stream_duplex");
            var n3 = this instanceof k;
            return n3 || V.call(l, this) ? void (this._writableState = new s2(t3, this, n3), this.writable = true, t3 && (typeof t3.write == "function" && (this._write = t3.write), typeof t3.writev == "function" && (this._writev = t3.writev), typeof t3.destroy == "function" && (this._destroy = t3.destroy), typeof t3.final == "function" && (this._final = t3.final)), A.call(this)) : new l(t3);
          }
          function c(e2, t3) {
            var r3 = new W();
            Y(e2, r3), n2.nextTick(t3, r3);
          }
          function u(e2, t3, r3, a2) {
            var o2;
            return r3 === null ? o2 = new q() : typeof r3 != "string" && !t3.objectMode && (o2 = new O("chunk", ["string", "Buffer"], r3)), !o2 || (Y(e2, o2), n2.nextTick(a2, o2), false);
          }
          function p(e2, t3, n3) {
            return e2.objectMode || e2.decodeStrings === false || typeof t3 != "string" || (t3 = x.from(t3, n3)), t3;
          }
          function f(e2, t3, n3, r3, a2, o2) {
            if (!n3) {
              var i2 = p(t3, r3, a2);
              r3 !== i2 && (n3 = true, a2 = "buffer", r3 = i2);
            }
            var d3 = t3.objectMode ? 1 : r3.length;
            t3.length += d3;
            var s3 = t3.length < t3.highWaterMark;
            if (s3 || (t3.needDrain = true), t3.writing || t3.corked) {
              var l2 = t3.lastBufferedRequest;
              t3.lastBufferedRequest = {chunk: r3, encoding: a2, isBuf: n3, callback: o2, next: null}, l2 ? l2.next = t3.lastBufferedRequest : t3.bufferedRequest = t3.lastBufferedRequest, t3.bufferedRequestCount += 1;
            } else
              g(e2, t3, false, d3, r3, a2, o2);
            return s3;
          }
          function g(e2, t3, n3, r3, a2, o2, i2) {
            t3.writelen = r3, t3.writecb = i2, t3.writing = true, t3.sync = true, t3.destroyed ? t3.onwrite(new j("write")) : n3 ? e2._writev(a2, t3.onwrite) : e2._write(a2, o2, t3.onwrite), t3.sync = false;
          }
          function _(e2, t3, r3, a2, o2) {
            --t3.pendingcb, r3 ? (n2.nextTick(o2, a2), n2.nextTick(S, e2, t3), e2._writableState.errorEmitted = true, Y(e2, a2)) : (o2(a2), e2._writableState.errorEmitted = true, Y(e2, a2), S(e2, t3));
          }
          function h(e2) {
            e2.writing = false, e2.writecb = null, e2.length -= e2.writelen, e2.writelen = 0;
          }
          function m(e2, t3) {
            var r3 = e2._writableState, a2 = r3.sync, o2 = r3.writecb;
            if (typeof o2 != "function")
              throw new B();
            if (h(r3), t3)
              _(e2, r3, a2, t3, o2);
            else {
              var i2 = R(r3) || e2.destroyed;
              i2 || r3.corked || r3.bufferProcessing || !r3.bufferedRequest || C(e2, r3), a2 ? n2.nextTick(b, e2, r3, i2, o2) : b(e2, r3, i2, o2);
            }
          }
          function b(e2, t3, n3, r3) {
            n3 || y(e2, t3), t3.pendingcb--, r3(), S(e2, t3);
          }
          function y(e2, t3) {
            t3.length === 0 && t3.needDrain && (t3.needDrain = false, e2.emit("drain"));
          }
          function C(e2, t3) {
            t3.bufferProcessing = true;
            var n3 = t3.bufferedRequest;
            if (e2._writev && n3 && n3.next) {
              var r3 = t3.bufferedRequestCount, o2 = Array(r3), i2 = t3.corkedRequestsFree;
              i2.entry = n3;
              for (var d3 = 0, s3 = true; n3; )
                o2[d3] = n3, n3.isBuf || (s3 = false), n3 = n3.next, d3 += 1;
              o2.allBuffers = s3, g(e2, t3, true, t3.length, o2, "", i2.finish), t3.pendingcb++, t3.lastBufferedRequest = null, i2.next ? (t3.corkedRequestsFree = i2.next, i2.next = null) : t3.corkedRequestsFree = new a(t3), t3.bufferedRequestCount = 0;
            } else {
              for (; n3; ) {
                var l2 = n3.chunk, c2 = n3.encoding, u2 = n3.callback, p2 = t3.objectMode ? 1 : l2.length;
                if (g(e2, t3, false, p2, l2, c2, u2), n3 = n3.next, t3.bufferedRequestCount--, t3.writing)
                  break;
              }
              n3 === null && (t3.lastBufferedRequest = null);
            }
            t3.bufferedRequest = n3, t3.bufferProcessing = false;
          }
          function R(e2) {
            return e2.ending && e2.length === 0 && e2.bufferedRequest === null && !e2.finished && !e2.writing;
          }
          function E(e2, t3) {
            e2._final(function(n3) {
              t3.pendingcb--, n3 && Y(e2, n3), t3.prefinished = true, e2.emit("prefinish"), S(e2, t3);
            });
          }
          function w(e2, t3) {
            t3.prefinished || t3.finalCalled || (typeof e2._final != "function" || t3.destroyed ? (t3.prefinished = true, e2.emit("prefinish")) : (t3.pendingcb++, t3.finalCalled = true, n2.nextTick(E, e2, t3)));
          }
          function S(e2, t3) {
            var n3 = R(t3);
            if (n3 && (w(e2, t3), t3.pendingcb === 0 && (t3.finished = true, e2.emit("finish"), t3.autoDestroy))) {
              var r3 = e2._readableState;
              (!r3 || r3.autoDestroy && r3.endEmitted) && e2.destroy();
            }
            return n3;
          }
          function T(e2, t3, r3) {
            t3.ending = true, S(e2, t3), r3 && (t3.finished ? n2.nextTick(r3) : e2.once("finish", r3)), t3.ended = true, e2.writable = false;
          }
          function v(e2, t3, n3) {
            var r3 = e2.entry;
            for (e2.entry = null; r3; ) {
              var a2 = r3.callback;
              t3.pendingcb--, a2(n3), r3 = r3.next;
            }
            t3.corkedRequestsFree.next = e2;
          }
          t2.exports = l;
          var k;
          l.WritableState = s2;
          var L = {deprecate: e("util-deprecate")}, A = e("./internal/streams/stream"), x = e("buffer").Buffer, N = r2.Uint8Array || function() {
          }, D = e("./internal/streams/destroy"), I = e("./internal/streams/state"), P = I.getHighWaterMark, M = e("../errors").codes, O = M.ERR_INVALID_ARG_TYPE, F = M.ERR_METHOD_NOT_IMPLEMENTED, B = M.ERR_MULTIPLE_CALLBACK, U = M.ERR_STREAM_CANNOT_PIPE, j = M.ERR_STREAM_DESTROYED, q = M.ERR_STREAM_NULL_VALUES, W = M.ERR_STREAM_WRITE_AFTER_END, H = M.ERR_UNKNOWN_ENCODING, Y = D.errorOrDestroy;
          e("inherits")(l, A), s2.prototype.getBuffer = function() {
            for (var e2 = this.bufferedRequest, t3 = []; e2; )
              t3.push(e2), e2 = e2.next;
            return t3;
          }, function() {
            try {
              Object.defineProperty(s2.prototype, "buffer", {get: L.deprecate(function() {
                return this.getBuffer();
              }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")});
            } catch (e2) {
            }
          }();
          var V;
          typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (V = Function.prototype[Symbol.hasInstance], Object.defineProperty(l, Symbol.hasInstance, {value: function(e2) {
            return !!V.call(this, e2) || !(this !== l) && e2 && e2._writableState instanceof s2;
          }})) : V = function(e2) {
            return e2 instanceof this;
          }, l.prototype.pipe = function() {
            Y(this, new U());
          }, l.prototype.write = function(e2, t3, n3) {
            var r3 = this._writableState, a2 = false, s3 = !r3.objectMode && i(e2);
            return s3 && !x.isBuffer(e2) && (e2 = o(e2)), typeof t3 == "function" && (n3 = t3, t3 = null), s3 ? t3 = "buffer" : !t3 && (t3 = r3.defaultEncoding), typeof n3 != "function" && (n3 = d2), r3.ending ? c(this, n3) : (s3 || u(this, r3, e2, n3)) && (r3.pendingcb++, a2 = f(this, r3, s3, e2, t3, n3)), a2;
          }, l.prototype.cork = function() {
            this._writableState.corked++;
          }, l.prototype.uncork = function() {
            var e2 = this._writableState;
            e2.corked && (e2.corked--, !e2.writing && !e2.corked && !e2.bufferProcessing && e2.bufferedRequest && C(this, e2));
          }, l.prototype.setDefaultEncoding = function(e2) {
            if (typeof e2 == "string" && (e2 = e2.toLowerCase()), !(-1 < ["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((e2 + "").toLowerCase())))
              throw new H(e2);
            return this._writableState.defaultEncoding = e2, this;
          }, Object.defineProperty(l.prototype, "writableBuffer", {enumerable: false, get: function() {
            return this._writableState && this._writableState.getBuffer();
          }}), Object.defineProperty(l.prototype, "writableHighWaterMark", {enumerable: false, get: function() {
            return this._writableState.highWaterMark;
          }}), l.prototype._write = function(e2, t3, n3) {
            n3(new F("_write()"));
          }, l.prototype._writev = null, l.prototype.end = function(e2, t3, n3) {
            var r3 = this._writableState;
            return typeof e2 == "function" ? (n3 = e2, e2 = null, t3 = null) : typeof t3 == "function" && (n3 = t3, t3 = null), e2 !== null && e2 !== void 0 && this.write(e2, t3), r3.corked && (r3.corked = 1, this.uncork()), r3.ending || T(this, r3, n3), this;
          }, Object.defineProperty(l.prototype, "writableLength", {enumerable: false, get: function() {
            return this._writableState.length;
          }}), Object.defineProperty(l.prototype, "destroyed", {enumerable: false, get: function() {
            return this._writableState !== void 0 && this._writableState.destroyed;
          }, set: function(e2) {
            this._writableState && (this._writableState.destroyed = e2);
          }}), l.prototype.destroy = D.destroy, l.prototype._undestroy = D.undestroy, l.prototype._destroy = function(e2, t3) {
            t3(e2);
          };
        }).call(this);
      }).call(this, e("_process"), typeof commonjsGlobal == "undefined" ? typeof self == "undefined" ? typeof window == "undefined" ? {} : window : self : commonjsGlobal);
    }, {"../errors": 15, "./_stream_duplex": 16, "./internal/streams/destroy": 23, "./internal/streams/state": 27, "./internal/streams/stream": 28, _process: 12, buffer: 3, inherits: 10, "util-deprecate": 32}], 21: [function(e, t2) {
      (function(n2) {
        (function() {
          function r2(e2, t3, n3) {
            return t3 in e2 ? Object.defineProperty(e2, t3, {value: n3, enumerable: true, configurable: true, writable: true}) : e2[t3] = n3, e2;
          }
          function a(e2, t3) {
            return {value: e2, done: t3};
          }
          function o(e2) {
            var t3 = e2[c];
            if (t3 !== null) {
              var n3 = e2[h].read();
              n3 !== null && (e2[g] = null, e2[c] = null, e2[u] = null, t3(a(n3, false)));
            }
          }
          function i(e2) {
            n2.nextTick(o, e2);
          }
          function d2(e2, t3) {
            return function(n3, r3) {
              e2.then(function() {
                return t3[f] ? void n3(a(void 0, true)) : void t3[_](n3, r3);
              }, r3);
            };
          }
          var s2, l = e("./end-of-stream"), c = Symbol("lastResolve"), u = Symbol("lastReject"), p = Symbol("error"), f = Symbol("ended"), g = Symbol("lastPromise"), _ = Symbol("handlePromise"), h = Symbol("stream"), m = Object.getPrototypeOf(function() {
          }), b = Object.setPrototypeOf((s2 = {get stream() {
            return this[h];
          }, next: function() {
            var e2 = this, t3 = this[p];
            if (t3 !== null)
              return Promise.reject(t3);
            if (this[f])
              return Promise.resolve(a(void 0, true));
            if (this[h].destroyed)
              return new Promise(function(t4, r4) {
                n2.nextTick(function() {
                  e2[p] ? r4(e2[p]) : t4(a(void 0, true));
                });
              });
            var r3, o2 = this[g];
            if (o2)
              r3 = new Promise(d2(o2, this));
            else {
              var i2 = this[h].read();
              if (i2 !== null)
                return Promise.resolve(a(i2, false));
              r3 = new Promise(this[_]);
            }
            return this[g] = r3, r3;
          }}, r2(s2, Symbol.asyncIterator, function() {
            return this;
          }), r2(s2, "return", function() {
            var e2 = this;
            return new Promise(function(t3, n3) {
              e2[h].destroy(null, function(e3) {
                return e3 ? void n3(e3) : void t3(a(void 0, true));
              });
            });
          }), s2), m);
          t2.exports = function(e2) {
            var t3, n3 = Object.create(b, (t3 = {}, r2(t3, h, {value: e2, writable: true}), r2(t3, c, {value: null, writable: true}), r2(t3, u, {value: null, writable: true}), r2(t3, p, {value: null, writable: true}), r2(t3, f, {value: e2._readableState.endEmitted, writable: true}), r2(t3, _, {value: function(e3, t4) {
              var r3 = n3[h].read();
              r3 ? (n3[g] = null, n3[c] = null, n3[u] = null, e3(a(r3, false))) : (n3[c] = e3, n3[u] = t4);
            }, writable: true}), t3));
            return n3[g] = null, l(e2, function(e3) {
              if (e3 && e3.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                var t4 = n3[u];
                return t4 !== null && (n3[g] = null, n3[c] = null, n3[u] = null, t4(e3)), void (n3[p] = e3);
              }
              var r3 = n3[c];
              r3 !== null && (n3[g] = null, n3[c] = null, n3[u] = null, r3(a(void 0, true))), n3[f] = true;
            }), e2.on("readable", i.bind(null, n3)), n3;
          };
        }).call(this);
      }).call(this, e("_process"));
    }, {"./end-of-stream": 24, _process: 12}], 22: [function(e, t2) {
      function n2(e2, t3) {
        var n3 = Object.keys(e2);
        if (Object.getOwnPropertySymbols) {
          var r3 = Object.getOwnPropertySymbols(e2);
          t3 && (r3 = r3.filter(function(t4) {
            return Object.getOwnPropertyDescriptor(e2, t4).enumerable;
          })), n3.push.apply(n3, r3);
        }
        return n3;
      }
      function r2(e2) {
        for (var t3, r3 = 1; r3 < arguments.length; r3++)
          t3 = arguments[r3] == null ? {} : arguments[r3], r3 % 2 ? n2(Object(t3), true).forEach(function(n3) {
            a(e2, n3, t3[n3]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(t3)) : n2(Object(t3)).forEach(function(n3) {
            Object.defineProperty(e2, n3, Object.getOwnPropertyDescriptor(t3, n3));
          });
        return e2;
      }
      function a(e2, t3, n3) {
        return t3 in e2 ? Object.defineProperty(e2, t3, {value: n3, enumerable: true, configurable: true, writable: true}) : e2[t3] = n3, e2;
      }
      function o(e2, t3) {
        if (!(e2 instanceof t3))
          throw new TypeError("Cannot call a class as a function");
      }
      function i(e2, t3) {
        for (var n3, r3 = 0; r3 < t3.length; r3++)
          n3 = t3[r3], n3.enumerable = n3.enumerable || false, n3.configurable = true, "value" in n3 && (n3.writable = true), Object.defineProperty(e2, n3.key, n3);
      }
      function d2(e2, t3, n3) {
        return t3 && i(e2.prototype, t3), n3 && i(e2, n3), e2;
      }
      function s2(e2, t3, n3) {
        u.prototype.copy.call(e2, t3, n3);
      }
      var l = e("buffer"), u = l.Buffer, p = e("util"), f = p.inspect, g = f && f.custom || "inspect";
      t2.exports = function() {
        function e2() {
          o(this, e2), this.head = null, this.tail = null, this.length = 0;
        }
        return d2(e2, [{key: "push", value: function(e3) {
          var t3 = {data: e3, next: null};
          0 < this.length ? this.tail.next = t3 : this.head = t3, this.tail = t3, ++this.length;
        }}, {key: "unshift", value: function(e3) {
          var t3 = {data: e3, next: this.head};
          this.length === 0 && (this.tail = t3), this.head = t3, ++this.length;
        }}, {key: "shift", value: function() {
          if (this.length !== 0) {
            var e3 = this.head.data;
            return this.head = this.length === 1 ? this.tail = null : this.head.next, --this.length, e3;
          }
        }}, {key: "clear", value: function() {
          this.head = this.tail = null, this.length = 0;
        }}, {key: "join", value: function(e3) {
          if (this.length === 0)
            return "";
          for (var t3 = this.head, n3 = "" + t3.data; t3 = t3.next; )
            n3 += e3 + t3.data;
          return n3;
        }}, {key: "concat", value: function(e3) {
          if (this.length === 0)
            return u.alloc(0);
          for (var t3 = u.allocUnsafe(e3 >>> 0), n3 = this.head, r3 = 0; n3; )
            s2(n3.data, t3, r3), r3 += n3.data.length, n3 = n3.next;
          return t3;
        }}, {key: "consume", value: function(e3, t3) {
          var n3;
          return e3 < this.head.data.length ? (n3 = this.head.data.slice(0, e3), this.head.data = this.head.data.slice(e3)) : e3 === this.head.data.length ? n3 = this.shift() : n3 = t3 ? this._getString(e3) : this._getBuffer(e3), n3;
        }}, {key: "first", value: function() {
          return this.head.data;
        }}, {key: "_getString", value: function(e3) {
          var t3 = this.head, r3 = 1, a2 = t3.data;
          for (e3 -= a2.length; t3 = t3.next; ) {
            var o2 = t3.data, i2 = e3 > o2.length ? o2.length : e3;
            if (a2 += i2 === o2.length ? o2 : o2.slice(0, e3), e3 -= i2, e3 === 0) {
              i2 === o2.length ? (++r3, this.head = t3.next ? t3.next : this.tail = null) : (this.head = t3, t3.data = o2.slice(i2));
              break;
            }
            ++r3;
          }
          return this.length -= r3, a2;
        }}, {key: "_getBuffer", value: function(e3) {
          var t3 = u.allocUnsafe(e3), r3 = this.head, a2 = 1;
          for (r3.data.copy(t3), e3 -= r3.data.length; r3 = r3.next; ) {
            var o2 = r3.data, i2 = e3 > o2.length ? o2.length : e3;
            if (o2.copy(t3, t3.length - e3, 0, i2), e3 -= i2, e3 === 0) {
              i2 === o2.length ? (++a2, this.head = r3.next ? r3.next : this.tail = null) : (this.head = r3, r3.data = o2.slice(i2));
              break;
            }
            ++a2;
          }
          return this.length -= a2, t3;
        }}, {key: g, value: function(e3, t3) {
          return f(this, r2({}, t3, {depth: 0, customInspect: false}));
        }}]), e2;
      }();
    }, {buffer: 3, util: 2}], 23: [function(e, t2) {
      (function(e2) {
        (function() {
          function n2(e3, t3) {
            a(e3, t3), r2(e3);
          }
          function r2(e3) {
            e3._writableState && !e3._writableState.emitClose || e3._readableState && !e3._readableState.emitClose || e3.emit("close");
          }
          function a(e3, t3) {
            e3.emit("error", t3);
          }
          t2.exports = {destroy: function(t3, o) {
            var i = this, d2 = this._readableState && this._readableState.destroyed, s2 = this._writableState && this._writableState.destroyed;
            return d2 || s2 ? (o ? o(t3) : t3 && (this._writableState ? !this._writableState.errorEmitted && (this._writableState.errorEmitted = true, e2.nextTick(a, this, t3)) : e2.nextTick(a, this, t3)), this) : (this._readableState && (this._readableState.destroyed = true), this._writableState && (this._writableState.destroyed = true), this._destroy(t3 || null, function(t4) {
              !o && t4 ? i._writableState ? i._writableState.errorEmitted ? e2.nextTick(r2, i) : (i._writableState.errorEmitted = true, e2.nextTick(n2, i, t4)) : e2.nextTick(n2, i, t4) : o ? (e2.nextTick(r2, i), o(t4)) : e2.nextTick(r2, i);
            }), this);
          }, undestroy: function() {
            this._readableState && (this._readableState.destroyed = false, this._readableState.reading = false, this._readableState.ended = false, this._readableState.endEmitted = false), this._writableState && (this._writableState.destroyed = false, this._writableState.ended = false, this._writableState.ending = false, this._writableState.finalCalled = false, this._writableState.prefinished = false, this._writableState.finished = false, this._writableState.errorEmitted = false);
          }, errorOrDestroy: function(e3, t3) {
            var n3 = e3._readableState, r3 = e3._writableState;
            n3 && n3.autoDestroy || r3 && r3.autoDestroy ? e3.destroy(t3) : e3.emit("error", t3);
          }};
        }).call(this);
      }).call(this, e("_process"));
    }, {_process: 12}], 24: [function(e, t2) {
      function n2(e2) {
        var t3 = false;
        return function() {
          if (!t3) {
            t3 = true;
            for (var n3 = arguments.length, r3 = Array(n3), a2 = 0; a2 < n3; a2++)
              r3[a2] = arguments[a2];
            e2.apply(this, r3);
          }
        };
      }
      function r2() {
      }
      function a(e2) {
        return e2.setHeader && typeof e2.abort == "function";
      }
      function o(e2, t3, d2) {
        if (typeof t3 == "function")
          return o(e2, null, t3);
        t3 || (t3 = {}), d2 = n2(d2 || r2);
        var s2 = t3.readable || t3.readable !== false && e2.readable, l = t3.writable || t3.writable !== false && e2.writable, c = function() {
          e2.writable || p();
        }, u = e2._writableState && e2._writableState.finished, p = function() {
          l = false, u = true, s2 || d2.call(e2);
        }, f = e2._readableState && e2._readableState.endEmitted, g = function() {
          s2 = false, f = true, l || d2.call(e2);
        }, _ = function(t4) {
          d2.call(e2, t4);
        }, h = function() {
          var t4;
          return s2 && !f ? (e2._readableState && e2._readableState.ended || (t4 = new i()), d2.call(e2, t4)) : l && !u ? (e2._writableState && e2._writableState.ended || (t4 = new i()), d2.call(e2, t4)) : void 0;
        }, m = function() {
          e2.req.on("finish", p);
        };
        return a(e2) ? (e2.on("complete", p), e2.on("abort", h), e2.req ? m() : e2.on("request", m)) : l && !e2._writableState && (e2.on("end", c), e2.on("close", c)), e2.on("end", g), e2.on("finish", p), t3.error !== false && e2.on("error", _), e2.on("close", h), function() {
          e2.removeListener("complete", p), e2.removeListener("abort", h), e2.removeListener("request", m), e2.req && e2.req.removeListener("finish", p), e2.removeListener("end", c), e2.removeListener("close", c), e2.removeListener("finish", p), e2.removeListener("end", g), e2.removeListener("error", _), e2.removeListener("close", h);
        };
      }
      var i = e("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;
      t2.exports = o;
    }, {"../../../errors": 15}], 25: [function(e, t2) {
      t2.exports = function() {
        throw new Error("Readable.from is not available in the browser");
      };
    }, {}], 26: [function(e, t2) {
      function n2(e2) {
        var t3 = false;
        return function() {
          t3 || (t3 = true, e2.apply(void 0, arguments));
        };
      }
      function r2(e2) {
        if (e2)
          throw e2;
      }
      function a(e2) {
        return e2.setHeader && typeof e2.abort == "function";
      }
      function o(t3, r3, o2, i2) {
        i2 = n2(i2);
        var d3 = false;
        t3.on("close", function() {
          d3 = true;
        }), l === void 0 && (l = e("./end-of-stream")), l(t3, {readable: r3, writable: o2}, function(e2) {
          return e2 ? i2(e2) : void (d3 = true, i2());
        });
        var s3 = false;
        return function(e2) {
          if (!d3)
            return s3 ? void 0 : (s3 = true, a(t3) ? t3.abort() : typeof t3.destroy == "function" ? t3.destroy() : void i2(e2 || new p("pipe")));
        };
      }
      function i(e2) {
        e2();
      }
      function d2(e2, t3) {
        return e2.pipe(t3);
      }
      function s2(e2) {
        return e2.length ? typeof e2[e2.length - 1] == "function" ? e2.pop() : r2 : r2;
      }
      var l, c = e("../../../errors").codes, u = c.ERR_MISSING_ARGS, p = c.ERR_STREAM_DESTROYED;
      t2.exports = function() {
        for (var e2 = arguments.length, t3 = Array(e2), n3 = 0; n3 < e2; n3++)
          t3[n3] = arguments[n3];
        var r3 = s2(t3);
        if (Array.isArray(t3[0]) && (t3 = t3[0]), 2 > t3.length)
          throw new u("streams");
        var a2, l2 = t3.map(function(e3, n4) {
          var d3 = n4 < t3.length - 1;
          return o(e3, d3, 0 < n4, function(e4) {
            a2 || (a2 = e4), e4 && l2.forEach(i), d3 || (l2.forEach(i), r3(a2));
          });
        });
        return t3.reduce(d2);
      };
    }, {"../../../errors": 15, "./end-of-stream": 24}], 27: [function(e, n2) {
      function r2(e2, t2, n3) {
        return e2.highWaterMark == null ? t2 ? e2[n3] : null : e2.highWaterMark;
      }
      var a = e("../../../errors").codes.ERR_INVALID_OPT_VALUE;
      n2.exports = {getHighWaterMark: function(e2, n3, o, i) {
        var d2 = r2(n3, i, o);
        if (d2 != null) {
          if (!(isFinite(d2) && t(d2) === d2) || 0 > d2) {
            var s2 = i ? o : "highWaterMark";
            throw new a(s2, d2);
          }
          return t(d2);
        }
        return e2.objectMode ? 16 : 16384;
      }};
    }, {"../../../errors": 15}], 28: [function(e, t2) {
      t2.exports = e("events").EventEmitter;
    }, {events: 7}], 29: [function(e, t2, n2) {
      n2 = t2.exports = e("./lib/_stream_readable.js"), n2.Stream = n2, n2.Readable = n2, n2.Writable = e("./lib/_stream_writable.js"), n2.Duplex = e("./lib/_stream_duplex.js"), n2.Transform = e("./lib/_stream_transform.js"), n2.PassThrough = e("./lib/_stream_passthrough.js"), n2.finished = e("./lib/internal/streams/end-of-stream.js"), n2.pipeline = e("./lib/internal/streams/pipeline.js");
    }, {"./lib/_stream_duplex.js": 16, "./lib/_stream_passthrough.js": 17, "./lib/_stream_readable.js": 18, "./lib/_stream_transform.js": 19, "./lib/_stream_writable.js": 20, "./lib/internal/streams/end-of-stream.js": 24, "./lib/internal/streams/pipeline.js": 26}], 30: [function(e, t2, n2) {
      function r2(e2, t3) {
        for (var n3 in e2)
          t3[n3] = e2[n3];
      }
      function a(e2, t3, n3) {
        return i(e2, t3, n3);
      }
      /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
      var o = e("buffer"), i = o.Buffer;
      i.from && i.alloc && i.allocUnsafe && i.allocUnsafeSlow ? t2.exports = o : (r2(o, n2), n2.Buffer = a), a.prototype = Object.create(i.prototype), r2(i, a), a.from = function(e2, t3, n3) {
        if (typeof e2 == "number")
          throw new TypeError("Argument must not be a number");
        return i(e2, t3, n3);
      }, a.alloc = function(e2, t3, n3) {
        if (typeof e2 != "number")
          throw new TypeError("Argument must be a number");
        var r3 = i(e2);
        return t3 === void 0 ? r3.fill(0) : typeof n3 == "string" ? r3.fill(t3, n3) : r3.fill(t3), r3;
      }, a.allocUnsafe = function(e2) {
        if (typeof e2 != "number")
          throw new TypeError("Argument must be a number");
        return i(e2);
      }, a.allocUnsafeSlow = function(e2) {
        if (typeof e2 != "number")
          throw new TypeError("Argument must be a number");
        return o.SlowBuffer(e2);
      };
    }, {buffer: 3}], 31: [function(e, t2, n2) {
      function r2(e2) {
        if (!e2)
          return "utf8";
        for (var t3; ; )
          switch (e2) {
            case "utf8":
            case "utf-8":
              return "utf8";
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return "utf16le";
            case "latin1":
            case "binary":
              return "latin1";
            case "base64":
            case "ascii":
            case "hex":
              return e2;
            default:
              if (t3)
                return;
              e2 = ("" + e2).toLowerCase(), t3 = true;
          }
      }
      function a(e2) {
        var t3 = r2(e2);
        if (typeof t3 != "string" && (m.isEncoding === b || !b(e2)))
          throw new Error("Unknown encoding: " + e2);
        return t3 || e2;
      }
      function o(e2) {
        this.encoding = a(e2);
        var t3;
        switch (this.encoding) {
          case "utf16le":
            this.text = u, this.end = p, t3 = 4;
            break;
          case "utf8":
            this.fillLast = c, t3 = 4;
            break;
          case "base64":
            this.text = f, this.end = g, t3 = 3;
            break;
          default:
            return this.write = _, void (this.end = h);
        }
        this.lastNeed = 0, this.lastTotal = 0, this.lastChar = m.allocUnsafe(t3);
      }
      function d2(e2) {
        if (127 >= e2)
          return 0;
        return e2 >> 5 == 6 ? 2 : e2 >> 4 == 14 ? 3 : e2 >> 3 == 30 ? 4 : e2 >> 6 == 2 ? -1 : -2;
      }
      function s2(e2, t3, n3) {
        var r3 = t3.length - 1;
        if (r3 < n3)
          return 0;
        var a2 = d2(t3[r3]);
        return 0 <= a2 ? (0 < a2 && (e2.lastNeed = a2 - 1), a2) : --r3 < n3 || a2 === -2 ? 0 : (a2 = d2(t3[r3]), 0 <= a2) ? (0 < a2 && (e2.lastNeed = a2 - 2), a2) : --r3 < n3 || a2 === -2 ? 0 : (a2 = d2(t3[r3]), 0 <= a2 ? (0 < a2 && (a2 === 2 ? a2 = 0 : e2.lastNeed = a2 - 3), a2) : 0);
      }
      function l(e2, t3) {
        if ((192 & t3[0]) != 128)
          return e2.lastNeed = 0, "\uFFFD";
        if (1 < e2.lastNeed && 1 < t3.length) {
          if ((192 & t3[1]) != 128)
            return e2.lastNeed = 1, "\uFFFD";
          if (2 < e2.lastNeed && 2 < t3.length && (192 & t3[2]) != 128)
            return e2.lastNeed = 2, "\uFFFD";
        }
      }
      function c(e2) {
        var t3 = this.lastTotal - this.lastNeed, n3 = l(this, e2);
        return n3 === void 0 ? this.lastNeed <= e2.length ? (e2.copy(this.lastChar, t3, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : void (e2.copy(this.lastChar, t3, 0, e2.length), this.lastNeed -= e2.length) : n3;
      }
      function u(e2, t3) {
        if ((e2.length - t3) % 2 == 0) {
          var n3 = e2.toString("utf16le", t3);
          if (n3) {
            var r3 = n3.charCodeAt(n3.length - 1);
            if (55296 <= r3 && 56319 >= r3)
              return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = e2[e2.length - 2], this.lastChar[1] = e2[e2.length - 1], n3.slice(0, -1);
          }
          return n3;
        }
        return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = e2[e2.length - 1], e2.toString("utf16le", t3, e2.length - 1);
      }
      function p(e2) {
        var t3 = e2 && e2.length ? this.write(e2) : "";
        if (this.lastNeed) {
          var n3 = this.lastTotal - this.lastNeed;
          return t3 + this.lastChar.toString("utf16le", 0, n3);
        }
        return t3;
      }
      function f(e2, t3) {
        var r3 = (e2.length - t3) % 3;
        return r3 == 0 ? e2.toString("base64", t3) : (this.lastNeed = 3 - r3, this.lastTotal = 3, r3 == 1 ? this.lastChar[0] = e2[e2.length - 1] : (this.lastChar[0] = e2[e2.length - 2], this.lastChar[1] = e2[e2.length - 1]), e2.toString("base64", t3, e2.length - r3));
      }
      function g(e2) {
        var t3 = e2 && e2.length ? this.write(e2) : "";
        return this.lastNeed ? t3 + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : t3;
      }
      function _(e2) {
        return e2.toString(this.encoding);
      }
      function h(e2) {
        return e2 && e2.length ? this.write(e2) : "";
      }
      var m = e("safe-buffer").Buffer, b = m.isEncoding || function(e2) {
        switch (e2 = "" + e2, e2 && e2.toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
          case "raw":
            return true;
          default:
            return false;
        }
      };
      n2.StringDecoder = o, o.prototype.write = function(e2) {
        if (e2.length === 0)
          return "";
        var t3, n3;
        if (this.lastNeed) {
          if (t3 = this.fillLast(e2), t3 === void 0)
            return "";
          n3 = this.lastNeed, this.lastNeed = 0;
        } else
          n3 = 0;
        return n3 < e2.length ? t3 ? t3 + this.text(e2, n3) : this.text(e2, n3) : t3 || "";
      }, o.prototype.end = function(e2) {
        var t3 = e2 && e2.length ? this.write(e2) : "";
        return this.lastNeed ? t3 + "\uFFFD" : t3;
      }, o.prototype.text = function(e2, t3) {
        var n3 = s2(this, e2, t3);
        if (!this.lastNeed)
          return e2.toString("utf8", t3);
        this.lastTotal = n3;
        var r3 = e2.length - (n3 - this.lastNeed);
        return e2.copy(this.lastChar, 0, r3), e2.toString("utf8", t3, r3);
      }, o.prototype.fillLast = function(e2) {
        return this.lastNeed <= e2.length ? (e2.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : void (e2.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, e2.length), this.lastNeed -= e2.length);
      };
    }, {"safe-buffer": 30}], 32: [function(e, t2) {
      (function(e2) {
        (function() {
          function n2(t3) {
            try {
              if (!e2.localStorage)
                return false;
            } catch (e3) {
              return false;
            }
            var n3 = e2.localStorage[t3];
            return n3 != null && (n3 + "").toLowerCase() === "true";
          }
          t2.exports = function(e3, t3) {
            function r2() {
              if (!a) {
                if (n2("throwDeprecation"))
                  throw new Error(t3);
                else
                  n2("traceDeprecation") ? console.trace(t3) : console.warn(t3);
                a = true;
              }
              return e3.apply(this, arguments);
            }
            if (n2("noDeprecation"))
              return e3;
            var a = false;
            return r2;
          };
        }).call(this);
      }).call(this, typeof commonjsGlobal == "undefined" ? typeof self == "undefined" ? typeof window == "undefined" ? {} : window : self : commonjsGlobal);
    }, {}], "/": [function(e, t2) {
      function n2(e2) {
        return e2.replace(/a=ice-options:trickle\s\n/g, "");
      }
      function r2(e2) {
        console.warn(e2);
      }
      /*! simple-peer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
      const a = e("debug")("simple-peer"), o = e("get-browser-rtc"), i = e("randombytes"), d2 = e("readable-stream"), s2 = e("queue-microtask"), l = e("err-code"), {Buffer: c} = e("buffer"), u = 65536;
      class p extends d2.Duplex {
        constructor(e2) {
          if (e2 = Object.assign({allowHalfOpen: false}, e2), super(e2), this._id = i(4).toString("hex").slice(0, 7), this._debug("new peer %o", e2), this.channelName = e2.initiator ? e2.channelName || i(20).toString("hex") : null, this.initiator = e2.initiator || false, this.channelConfig = e2.channelConfig || p.channelConfig, this.channelNegotiated = this.channelConfig.negotiated, this.config = Object.assign({}, p.config, e2.config), this.offerOptions = e2.offerOptions || {}, this.answerOptions = e2.answerOptions || {}, this.sdpTransform = e2.sdpTransform || ((e3) => e3), this.streams = e2.streams || (e2.stream ? [e2.stream] : []), this.trickle = e2.trickle === void 0 || e2.trickle, this.allowHalfTrickle = e2.allowHalfTrickle !== void 0 && e2.allowHalfTrickle, this.iceCompleteTimeout = e2.iceCompleteTimeout || 5e3, this.destroyed = false, this.destroying = false, this._connected = false, this.remoteAddress = void 0, this.remoteFamily = void 0, this.remotePort = void 0, this.localAddress = void 0, this.localFamily = void 0, this.localPort = void 0, this._wrtc = e2.wrtc && typeof e2.wrtc == "object" ? e2.wrtc : o(), !this._wrtc)
            if (typeof window == "undefined")
              throw l(new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"), "ERR_WEBRTC_SUPPORT");
            else
              throw l(new Error("No WebRTC support: Not a supported browser"), "ERR_WEBRTC_SUPPORT");
          this._pcReady = false, this._channelReady = false, this._iceComplete = false, this._iceCompleteTimer = null, this._channel = null, this._pendingCandidates = [], this._isNegotiating = false, this._firstNegotiation = true, this._batchedNegotiation = false, this._queuedNegotiation = false, this._sendersAwaitingStable = [], this._senderMap = new Map(), this._closingInterval = null, this._remoteTracks = [], this._remoteStreams = [], this._chunk = null, this._cb = null, this._interval = null;
          try {
            this._pc = new this._wrtc.RTCPeerConnection(this.config);
          } catch (e3) {
            return void this.destroy(l(e3, "ERR_PC_CONSTRUCTOR"));
          }
          this._isReactNativeWebrtc = typeof this._pc._peerConnectionId == "number", this._pc.oniceconnectionstatechange = () => {
            this._onIceStateChange();
          }, this._pc.onicegatheringstatechange = () => {
            this._onIceStateChange();
          }, this._pc.onconnectionstatechange = () => {
            this._onConnectionStateChange();
          }, this._pc.onsignalingstatechange = () => {
            this._onSignalingStateChange();
          }, this._pc.onicecandidate = (e3) => {
            this._onIceCandidate(e3);
          }, typeof this._pc.peerIdentity == "object" && this._pc.peerIdentity.catch((e3) => {
            this.destroy(l(e3, "ERR_PC_PEER_IDENTITY"));
          }), this.initiator || this.channelNegotiated ? this._setupData({channel: this._pc.createDataChannel(this.channelName, this.channelConfig)}) : this._pc.ondatachannel = (e3) => {
            this._setupData(e3);
          }, this.streams && this.streams.forEach((e3) => {
            this.addStream(e3);
          }), this._pc.ontrack = (e3) => {
            this._onTrack(e3);
          }, this._debug("initial negotiation"), this._needsNegotiation(), this._onFinishBound = () => {
            this._onFinish();
          }, this.once("finish", this._onFinishBound);
        }
        get bufferSize() {
          return this._channel && this._channel.bufferedAmount || 0;
        }
        get connected() {
          return this._connected && this._channel.readyState === "open";
        }
        address() {
          return {port: this.localPort, family: this.localFamily, address: this.localAddress};
        }
        signal(e2) {
          if (!this.destroying) {
            if (this.destroyed)
              throw l(new Error("cannot signal after peer is destroyed"), "ERR_DESTROYED");
            if (typeof e2 == "string")
              try {
                e2 = JSON.parse(e2);
              } catch (t3) {
                e2 = {};
              }
            this._debug("signal()"), e2.renegotiate && this.initiator && (this._debug("got request to renegotiate"), this._needsNegotiation()), e2.transceiverRequest && this.initiator && (this._debug("got request for transceiver"), this.addTransceiver(e2.transceiverRequest.kind, e2.transceiverRequest.init)), e2.candidate && (this._pc.remoteDescription && this._pc.remoteDescription.type ? this._addIceCandidate(e2.candidate) : this._pendingCandidates.push(e2.candidate)), e2.sdp && this._pc.setRemoteDescription(new this._wrtc.RTCSessionDescription(e2)).then(() => {
              this.destroyed || (this._pendingCandidates.forEach((e3) => {
                this._addIceCandidate(e3);
              }), this._pendingCandidates = [], this._pc.remoteDescription.type === "offer" && this._createAnswer());
            }).catch((e3) => {
              this.destroy(l(e3, "ERR_SET_REMOTE_DESCRIPTION"));
            }), e2.sdp || e2.candidate || e2.renegotiate || e2.transceiverRequest || this.destroy(l(new Error("signal() called with invalid signal data"), "ERR_SIGNALING"));
          }
        }
        _addIceCandidate(e2) {
          const t3 = new this._wrtc.RTCIceCandidate(e2);
          this._pc.addIceCandidate(t3).catch((e3) => {
            !t3.address || t3.address.endsWith(".local") ? r2("Ignoring unsupported ICE candidate.") : this.destroy(l(e3, "ERR_ADD_ICE_CANDIDATE"));
          });
        }
        send(e2) {
          if (!this.destroying) {
            if (this.destroyed)
              throw l(new Error("cannot send after peer is destroyed"), "ERR_DESTROYED");
            this._channel.send(e2);
          }
        }
        addTransceiver(e2, t3) {
          if (!this.destroying) {
            if (this.destroyed)
              throw l(new Error("cannot addTransceiver after peer is destroyed"), "ERR_DESTROYED");
            if (this._debug("addTransceiver()"), this.initiator)
              try {
                this._pc.addTransceiver(e2, t3), this._needsNegotiation();
              } catch (e3) {
                this.destroy(l(e3, "ERR_ADD_TRANSCEIVER"));
              }
            else
              this.emit("signal", {type: "transceiverRequest", transceiverRequest: {kind: e2, init: t3}});
          }
        }
        addStream(e2) {
          if (!this.destroying) {
            if (this.destroyed)
              throw l(new Error("cannot addStream after peer is destroyed"), "ERR_DESTROYED");
            this._debug("addStream()"), e2.getTracks().forEach((t3) => {
              this.addTrack(t3, e2);
            });
          }
        }
        addTrack(e2, t3) {
          if (this.destroying)
            return;
          if (this.destroyed)
            throw l(new Error("cannot addTrack after peer is destroyed"), "ERR_DESTROYED");
          this._debug("addTrack()");
          const n3 = this._senderMap.get(e2) || new Map();
          let r3 = n3.get(t3);
          if (!r3)
            r3 = this._pc.addTrack(e2, t3), n3.set(t3, r3), this._senderMap.set(e2, n3), this._needsNegotiation();
          else if (r3.removed)
            throw l(new Error("Track has been removed. You should enable/disable tracks that you want to re-add."), "ERR_SENDER_REMOVED");
          else
            throw l(new Error("Track has already been added to that stream."), "ERR_SENDER_ALREADY_ADDED");
        }
        replaceTrack(e2, t3, n3) {
          if (this.destroying)
            return;
          if (this.destroyed)
            throw l(new Error("cannot replaceTrack after peer is destroyed"), "ERR_DESTROYED");
          this._debug("replaceTrack()");
          const r3 = this._senderMap.get(e2), a2 = r3 ? r3.get(n3) : null;
          if (!a2)
            throw l(new Error("Cannot replace track that was never added."), "ERR_TRACK_NOT_ADDED");
          t3 && this._senderMap.set(t3, r3), a2.replaceTrack == null ? this.destroy(l(new Error("replaceTrack is not supported in this browser"), "ERR_UNSUPPORTED_REPLACETRACK")) : a2.replaceTrack(t3);
        }
        removeTrack(e2, t3) {
          if (this.destroying)
            return;
          if (this.destroyed)
            throw l(new Error("cannot removeTrack after peer is destroyed"), "ERR_DESTROYED");
          this._debug("removeSender()");
          const n3 = this._senderMap.get(e2), r3 = n3 ? n3.get(t3) : null;
          if (!r3)
            throw l(new Error("Cannot remove track that was never added."), "ERR_TRACK_NOT_ADDED");
          try {
            r3.removed = true, this._pc.removeTrack(r3);
          } catch (e3) {
            e3.name === "NS_ERROR_UNEXPECTED" ? this._sendersAwaitingStable.push(r3) : this.destroy(l(e3, "ERR_REMOVE_TRACK"));
          }
          this._needsNegotiation();
        }
        removeStream(e2) {
          if (!this.destroying) {
            if (this.destroyed)
              throw l(new Error("cannot removeStream after peer is destroyed"), "ERR_DESTROYED");
            this._debug("removeSenders()"), e2.getTracks().forEach((t3) => {
              this.removeTrack(t3, e2);
            });
          }
        }
        _needsNegotiation() {
          this._debug("_needsNegotiation"), this._batchedNegotiation || (this._batchedNegotiation = true, s2(() => {
            this._batchedNegotiation = false, this.initiator || !this._firstNegotiation ? (this._debug("starting batched negotiation"), this.negotiate()) : this._debug("non-initiator initial negotiation request discarded"), this._firstNegotiation = false;
          }));
        }
        negotiate() {
          if (!this.destroying) {
            if (this.destroyed)
              throw l(new Error("cannot negotiate after peer is destroyed"), "ERR_DESTROYED");
            this.initiator ? this._isNegotiating ? (this._queuedNegotiation = true, this._debug("already negotiating, queueing")) : (this._debug("start negotiation"), setTimeout(() => {
              this._createOffer();
            }, 0)) : this._isNegotiating ? (this._queuedNegotiation = true, this._debug("already negotiating, queueing")) : (this._debug("requesting negotiation from initiator"), this.emit("signal", {type: "renegotiate", renegotiate: true})), this._isNegotiating = true;
          }
        }
        destroy(e2) {
          this._destroy(e2, () => {
          });
        }
        _destroy(e2, t3) {
          this.destroyed || this.destroying || (this.destroying = true, this._debug("destroying (error: %s)", e2 && (e2.message || e2)), s2(() => {
            if (this.destroyed = true, this.destroying = false, this._debug("destroy (error: %s)", e2 && (e2.message || e2)), this.readable = this.writable = false, this._readableState.ended || this.push(null), this._writableState.finished || this.end(), this._connected = false, this._pcReady = false, this._channelReady = false, this._remoteTracks = null, this._remoteStreams = null, this._senderMap = null, clearInterval(this._closingInterval), this._closingInterval = null, clearInterval(this._interval), this._interval = null, this._chunk = null, this._cb = null, this._onFinishBound && this.removeListener("finish", this._onFinishBound), this._onFinishBound = null, this._channel) {
              try {
                this._channel.close();
              } catch (e3) {
              }
              this._channel.onmessage = null, this._channel.onopen = null, this._channel.onclose = null, this._channel.onerror = null;
            }
            if (this._pc) {
              try {
                this._pc.close();
              } catch (e3) {
              }
              this._pc.oniceconnectionstatechange = null, this._pc.onicegatheringstatechange = null, this._pc.onsignalingstatechange = null, this._pc.onicecandidate = null, this._pc.ontrack = null, this._pc.ondatachannel = null;
            }
            this._pc = null, this._channel = null, e2 && this.emit("error", e2), this.emit("close"), t3();
          }));
        }
        _setupData(e2) {
          if (!e2.channel)
            return this.destroy(l(new Error("Data channel event is missing `channel` property"), "ERR_DATA_CHANNEL"));
          this._channel = e2.channel, this._channel.binaryType = "arraybuffer", typeof this._channel.bufferedAmountLowThreshold == "number" && (this._channel.bufferedAmountLowThreshold = u), this.channelName = this._channel.label, this._channel.onmessage = (e3) => {
            this._onChannelMessage(e3);
          }, this._channel.onbufferedamountlow = () => {
            this._onChannelBufferedAmountLow();
          }, this._channel.onopen = () => {
            this._onChannelOpen();
          }, this._channel.onclose = () => {
            this._onChannelClose();
          }, this._channel.onerror = (e3) => {
            this.destroy(l(e3, "ERR_DATA_CHANNEL"));
          };
          let t3 = false;
          this._closingInterval = setInterval(() => {
            this._channel && this._channel.readyState === "closing" ? (t3 && this._onChannelClose(), t3 = true) : t3 = false;
          }, 5e3);
        }
        _read() {
        }
        _write(e2, t3, n3) {
          if (this.destroyed)
            return n3(l(new Error("cannot write after peer is destroyed"), "ERR_DATA_CHANNEL"));
          if (this._connected) {
            try {
              this.send(e2);
            } catch (e3) {
              return this.destroy(l(e3, "ERR_DATA_CHANNEL"));
            }
            this._channel.bufferedAmount > u ? (this._debug("start backpressure: bufferedAmount %d", this._channel.bufferedAmount), this._cb = n3) : n3(null);
          } else
            this._debug("write before connect"), this._chunk = e2, this._cb = n3;
        }
        _onFinish() {
          if (!this.destroyed) {
            const e2 = () => {
              setTimeout(() => this.destroy(), 1e3);
            };
            this._connected ? e2() : this.once("connect", e2);
          }
        }
        _startIceCompleteTimeout() {
          this.destroyed || this._iceCompleteTimer || (this._debug("started iceComplete timeout"), this._iceCompleteTimer = setTimeout(() => {
            this._iceComplete || (this._iceComplete = true, this._debug("iceComplete timeout completed"), this.emit("iceTimeout"), this.emit("_iceComplete"));
          }, this.iceCompleteTimeout));
        }
        _createOffer() {
          this.destroyed || this._pc.createOffer(this.offerOptions).then((e2) => {
            if (this.destroyed)
              return;
            this.trickle || this.allowHalfTrickle || (e2.sdp = n2(e2.sdp)), e2.sdp = this.sdpTransform(e2.sdp);
            const t3 = () => {
              if (!this.destroyed) {
                const t4 = this._pc.localDescription || e2;
                this._debug("signal"), this.emit("signal", {type: t4.type, sdp: t4.sdp});
              }
            };
            this._pc.setLocalDescription(e2).then(() => {
              this._debug("createOffer success"), this.destroyed || (this.trickle || this._iceComplete ? t3() : this.once("_iceComplete", t3));
            }).catch((e3) => {
              this.destroy(l(e3, "ERR_SET_LOCAL_DESCRIPTION"));
            });
          }).catch((e2) => {
            this.destroy(l(e2, "ERR_CREATE_OFFER"));
          });
        }
        _requestMissingTransceivers() {
          this._pc.getTransceivers && this._pc.getTransceivers().forEach((e2) => {
            e2.mid || !e2.sender.track || e2.requested || (e2.requested = true, this.addTransceiver(e2.sender.track.kind));
          });
        }
        _createAnswer() {
          this.destroyed || this._pc.createAnswer(this.answerOptions).then((e2) => {
            if (this.destroyed)
              return;
            this.trickle || this.allowHalfTrickle || (e2.sdp = n2(e2.sdp)), e2.sdp = this.sdpTransform(e2.sdp);
            const t3 = () => {
              if (!this.destroyed) {
                const t4 = this._pc.localDescription || e2;
                this._debug("signal"), this.emit("signal", {type: t4.type, sdp: t4.sdp}), this.initiator || this._requestMissingTransceivers();
              }
            };
            this._pc.setLocalDescription(e2).then(() => {
              this.destroyed || (this.trickle || this._iceComplete ? t3() : this.once("_iceComplete", t3));
            }).catch((e3) => {
              this.destroy(l(e3, "ERR_SET_LOCAL_DESCRIPTION"));
            });
          }).catch((e2) => {
            this.destroy(l(e2, "ERR_CREATE_ANSWER"));
          });
        }
        _onConnectionStateChange() {
          this.destroyed || this._pc.connectionState === "failed" && this.destroy(l(new Error("Connection failed."), "ERR_CONNECTION_FAILURE"));
        }
        _onIceStateChange() {
          if (this.destroyed)
            return;
          const e2 = this._pc.iceConnectionState, t3 = this._pc.iceGatheringState;
          this._debug("iceStateChange (connection: %s) (gathering: %s)", e2, t3), this.emit("iceStateChange", e2, t3), (e2 === "connected" || e2 === "completed") && (this._pcReady = true, this._maybeReady()), e2 === "failed" && this.destroy(l(new Error("Ice connection failed."), "ERR_ICE_CONNECTION_FAILURE")), e2 === "closed" && this.destroy(l(new Error("Ice connection closed."), "ERR_ICE_CONNECTION_CLOSED"));
        }
        getStats(e2) {
          const t3 = (e3) => (Object.prototype.toString.call(e3.values) === "[object Array]" && e3.values.forEach((t4) => {
            Object.assign(e3, t4);
          }), e3);
          this._pc.getStats.length === 0 || this._isReactNativeWebrtc ? this._pc.getStats().then((n3) => {
            const r3 = [];
            n3.forEach((e3) => {
              r3.push(t3(e3));
            }), e2(null, r3);
          }, (t4) => e2(t4)) : 0 < this._pc.getStats.length ? this._pc.getStats((n3) => {
            if (this.destroyed)
              return;
            const r3 = [];
            n3.result().forEach((e3) => {
              const n4 = {};
              e3.names().forEach((t4) => {
                n4[t4] = e3.stat(t4);
              }), n4.id = e3.id, n4.type = e3.type, n4.timestamp = e3.timestamp, r3.push(t3(n4));
            }), e2(null, r3);
          }, (t4) => e2(t4)) : e2(null, []);
        }
        _maybeReady() {
          if (this._debug("maybeReady pc %s channel %s", this._pcReady, this._channelReady), this._connected || this._connecting || !this._pcReady || !this._channelReady)
            return;
          this._connecting = true;
          const e2 = () => {
            this.destroyed || this.getStats((t3, n3) => {
              if (this.destroyed)
                return;
              t3 && (n3 = []);
              const r3 = {}, a2 = {}, o2 = {};
              let i2 = false;
              n3.forEach((e3) => {
                (e3.type === "remotecandidate" || e3.type === "remote-candidate") && (r3[e3.id] = e3), (e3.type === "localcandidate" || e3.type === "local-candidate") && (a2[e3.id] = e3), (e3.type === "candidatepair" || e3.type === "candidate-pair") && (o2[e3.id] = e3);
              });
              const d3 = (e3) => {
                i2 = true;
                let t4 = a2[e3.localCandidateId];
                t4 && (t4.ip || t4.address) ? (this.localAddress = t4.ip || t4.address, this.localPort = +t4.port) : t4 && t4.ipAddress ? (this.localAddress = t4.ipAddress, this.localPort = +t4.portNumber) : typeof e3.googLocalAddress == "string" && (t4 = e3.googLocalAddress.split(":"), this.localAddress = t4[0], this.localPort = +t4[1]), this.localAddress && (this.localFamily = this.localAddress.includes(":") ? "IPv6" : "IPv4");
                let n4 = r3[e3.remoteCandidateId];
                n4 && (n4.ip || n4.address) ? (this.remoteAddress = n4.ip || n4.address, this.remotePort = +n4.port) : n4 && n4.ipAddress ? (this.remoteAddress = n4.ipAddress, this.remotePort = +n4.portNumber) : typeof e3.googRemoteAddress == "string" && (n4 = e3.googRemoteAddress.split(":"), this.remoteAddress = n4[0], this.remotePort = +n4[1]), this.remoteAddress && (this.remoteFamily = this.remoteAddress.includes(":") ? "IPv6" : "IPv4"), this._debug("connect local: %s:%s remote: %s:%s", this.localAddress, this.localPort, this.remoteAddress, this.remotePort);
              };
              if (n3.forEach((e3) => {
                e3.type === "transport" && e3.selectedCandidatePairId && d3(o2[e3.selectedCandidatePairId]), (e3.type === "googCandidatePair" && e3.googActiveConnection === "true" || (e3.type === "candidatepair" || e3.type === "candidate-pair") && e3.selected) && d3(e3);
              }), !i2 && (!Object.keys(o2).length || Object.keys(a2).length))
                return void setTimeout(e2, 100);
              if (this._connecting = false, this._connected = true, this._chunk) {
                try {
                  this.send(this._chunk);
                } catch (e4) {
                  return this.destroy(l(e4, "ERR_DATA_CHANNEL"));
                }
                this._chunk = null, this._debug('sent chunk from "write before connect"');
                const e3 = this._cb;
                this._cb = null, e3(null);
              }
              typeof this._channel.bufferedAmountLowThreshold != "number" && (this._interval = setInterval(() => this._onInterval(), 150), this._interval.unref && this._interval.unref()), this._debug("connect"), this.emit("connect");
            });
          };
          e2();
        }
        _onInterval() {
          this._cb && this._channel && !(this._channel.bufferedAmount > u) && this._onChannelBufferedAmountLow();
        }
        _onSignalingStateChange() {
          this.destroyed || (this._pc.signalingState === "stable" && (this._isNegotiating = false, this._debug("flushing sender queue", this._sendersAwaitingStable), this._sendersAwaitingStable.forEach((e2) => {
            this._pc.removeTrack(e2), this._queuedNegotiation = true;
          }), this._sendersAwaitingStable = [], this._queuedNegotiation ? (this._debug("flushing negotiation queue"), this._queuedNegotiation = false, this._needsNegotiation()) : (this._debug("negotiated"), this.emit("negotiated"))), this._debug("signalingStateChange %s", this._pc.signalingState), this.emit("signalingStateChange", this._pc.signalingState));
        }
        _onIceCandidate(e2) {
          this.destroyed || (e2.candidate && this.trickle ? this.emit("signal", {type: "candidate", candidate: {candidate: e2.candidate.candidate, sdpMLineIndex: e2.candidate.sdpMLineIndex, sdpMid: e2.candidate.sdpMid}}) : !e2.candidate && !this._iceComplete && (this._iceComplete = true, this.emit("_iceComplete")), e2.candidate && this._startIceCompleteTimeout());
        }
        _onChannelMessage(e2) {
          if (this.destroyed)
            return;
          let t3 = e2.data;
          t3 instanceof ArrayBuffer && (t3 = c.from(t3)), this.push(t3);
        }
        _onChannelBufferedAmountLow() {
          if (!this.destroyed && this._cb) {
            this._debug("ending backpressure: bufferedAmount %d", this._channel.bufferedAmount);
            const e2 = this._cb;
            this._cb = null, e2(null);
          }
        }
        _onChannelOpen() {
          this._connected || this.destroyed || (this._debug("on channel open"), this._channelReady = true, this._maybeReady());
        }
        _onChannelClose() {
          this.destroyed || (this._debug("on channel close"), this.destroy());
        }
        _onTrack(e2) {
          this.destroyed || e2.streams.forEach((t3) => {
            this._debug("on track"), this.emit("track", e2.track, t3), this._remoteTracks.push({track: e2.track, stream: t3}), this._remoteStreams.some((e3) => e3.id === t3.id) || (this._remoteStreams.push(t3), s2(() => {
              this._debug("on stream"), this.emit("stream", t3);
            }));
          });
        }
        _debug() {
          const e2 = [].slice.call(arguments);
          e2[0] = "[" + this._id + "] " + e2[0], a.apply(null, e2);
        }
      }
      p.WEBRTC_SUPPORT = !!o(), p.config = {iceServers: [{urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"]}], sdpSemantics: "unified-plan"}, p.channelConfig = {}, t2.exports = p;
    }, {buffer: 3, debug: 4, "err-code": 6, "get-browser-rtc": 8, "queue-microtask": 13, randombytes: 14, "readable-stream": 29}]}, {}, [])("/");
  });
});
const messageYjsSyncStep1 = 0;
const messageYjsSyncStep2 = 1;
const messageYjsUpdate = 2;
const writeSyncStep1 = (encoder, doc) => {
  writeVarUint(encoder, messageYjsSyncStep1);
  const sv = encodeStateVector(doc);
  writeVarUint8Array(encoder, sv);
};
const writeSyncStep2 = (encoder, doc, encodedStateVector) => {
  writeVarUint(encoder, messageYjsSyncStep2);
  writeVarUint8Array(encoder, encodeStateAsUpdate(doc, encodedStateVector));
};
const readSyncStep1 = (decoder, encoder, doc) => writeSyncStep2(encoder, doc, readVarUint8Array(decoder));
const readSyncStep2 = (decoder, doc, transactionOrigin) => {
  try {
    applyUpdate(doc, readVarUint8Array(decoder), transactionOrigin);
  } catch (error2) {
    console.error("Caught error while handling a Yjs update", error2);
  }
};
const writeUpdate = (encoder, update) => {
  writeVarUint(encoder, messageYjsUpdate);
  writeVarUint8Array(encoder, update);
};
const readUpdate = readSyncStep2;
const readSyncMessage = (decoder, encoder, doc, transactionOrigin) => {
  const messageType = readVarUint(decoder);
  switch (messageType) {
    case messageYjsSyncStep1:
      readSyncStep1(decoder, encoder, doc);
      break;
    case messageYjsSyncStep2:
      readSyncStep2(decoder, doc, transactionOrigin);
      break;
    case messageYjsUpdate:
      readUpdate(decoder, doc, transactionOrigin);
      break;
    default:
      throw new Error("Unknown message type");
  }
  return messageType;
};
const outdatedTimeout = 3e4;
class Awareness extends Observable {
  constructor(doc) {
    super();
    this.doc = doc;
    this.clientID = doc.clientID;
    this.states = new Map();
    this.meta = new Map();
    this._checkInterval = setInterval(() => {
      const now = getUnixTime();
      if (this.getLocalState() !== null && outdatedTimeout / 2 <= now - this.meta.get(this.clientID).lastUpdated) {
        this.setLocalState(this.getLocalState());
      }
      const remove = [];
      this.meta.forEach((meta, clientid) => {
        if (clientid !== this.clientID && outdatedTimeout <= now - meta.lastUpdated && this.states.has(clientid)) {
          remove.push(clientid);
        }
      });
      if (remove.length > 0) {
        removeAwarenessStates(this, remove, "timeout");
      }
    }, floor(outdatedTimeout / 10));
    doc.on("destroy", () => {
      this.destroy();
    });
    this.setLocalState({});
  }
  destroy() {
    this.emit("destroy", [this]);
    this.setLocalState(null);
    super.destroy();
    clearInterval(this._checkInterval);
  }
  getLocalState() {
    return this.states.get(this.clientID) || null;
  }
  setLocalState(state) {
    const clientID = this.clientID;
    const currLocalMeta = this.meta.get(clientID);
    const clock = currLocalMeta === void 0 ? 0 : currLocalMeta.clock + 1;
    const prevState = this.states.get(clientID);
    if (state === null) {
      this.states.delete(clientID);
    } else {
      this.states.set(clientID, state);
    }
    this.meta.set(clientID, {
      clock,
      lastUpdated: getUnixTime()
    });
    const added = [];
    const updated = [];
    const filteredUpdated = [];
    const removed = [];
    if (state === null) {
      removed.push(clientID);
    } else if (prevState == null) {
      if (state != null) {
        added.push(clientID);
      }
    } else {
      updated.push(clientID);
      if (!equalityDeep(prevState, state)) {
        filteredUpdated.push(clientID);
      }
    }
    if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
      this.emit("change", [{added, updated: filteredUpdated, removed}, "local"]);
    }
    this.emit("update", [{added, updated, removed}, "local"]);
  }
  setLocalStateField(field, value) {
    const state = this.getLocalState();
    if (state !== null) {
      state[field] = value;
      this.setLocalState(state);
    }
  }
  getStates() {
    return this.states;
  }
}
const removeAwarenessStates = (awareness, clients, origin) => {
  const removed = [];
  for (let i = 0; i < clients.length; i++) {
    const clientID = clients[i];
    if (awareness.states.has(clientID)) {
      awareness.states.delete(clientID);
      if (clientID === awareness.clientID) {
        const curMeta = awareness.meta.get(clientID);
        awareness.meta.set(clientID, {
          clock: curMeta.clock + 1,
          lastUpdated: getUnixTime()
        });
      }
      removed.push(clientID);
    }
  }
  if (removed.length > 0) {
    awareness.emit("change", [{added: [], updated: [], removed}, origin]);
    awareness.emit("update", [{added: [], updated: [], removed}, origin]);
  }
};
const encodeAwarenessUpdate = (awareness, clients, states = awareness.states) => {
  const len = clients.length;
  const encoder = createEncoder();
  writeVarUint(encoder, len);
  for (let i = 0; i < len; i++) {
    const clientID = clients[i];
    const state = states.get(clientID) || null;
    const clock = awareness.meta.get(clientID).clock;
    writeVarUint(encoder, clientID);
    writeVarUint(encoder, clock);
    writeVarString(encoder, JSON.stringify(state));
  }
  return toUint8Array(encoder);
};
const applyAwarenessUpdate = (awareness, update, origin) => {
  const decoder = createDecoder(update);
  const timestamp = getUnixTime();
  const added = [];
  const updated = [];
  const filteredUpdated = [];
  const removed = [];
  const len = readVarUint(decoder);
  for (let i = 0; i < len; i++) {
    const clientID = readVarUint(decoder);
    let clock = readVarUint(decoder);
    const state = JSON.parse(readVarString(decoder));
    const clientMeta = awareness.meta.get(clientID);
    const prevState = awareness.states.get(clientID);
    const currClock = clientMeta === void 0 ? 0 : clientMeta.clock;
    if (currClock < clock || currClock === clock && state === null && awareness.states.has(clientID)) {
      if (state === null) {
        if (clientID === awareness.clientID && awareness.getLocalState() != null) {
          clock++;
        } else {
          awareness.states.delete(clientID);
        }
      } else {
        awareness.states.set(clientID, state);
      }
      awareness.meta.set(clientID, {
        clock,
        lastUpdated: timestamp
      });
      if (clientMeta === void 0 && state !== null) {
        added.push(clientID);
      } else if (clientMeta !== void 0 && state === null) {
        removed.push(clientID);
      } else if (state !== null) {
        if (!equalityDeep(state, prevState)) {
          filteredUpdated.push(clientID);
        }
        updated.push(clientID);
      }
    }
  }
  if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
    awareness.emit("change", [{
      added,
      updated: filteredUpdated,
      removed
    }, origin]);
  }
  if (added.length > 0 || updated.length > 0 || removed.length > 0) {
    awareness.emit("update", [{
      added,
      updated,
      removed
    }, origin]);
  }
};
const deriveKey = (secret, roomName) => {
  const secretBuffer = encodeUtf8(secret).buffer;
  const salt = encodeUtf8(roomName).buffer;
  return crypto.subtle.importKey("raw", secretBuffer, "PBKDF2", false, ["deriveKey"]).then((keyMaterial) => crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt,
    iterations: 1e5,
    hash: "SHA-256"
  }, keyMaterial, {
    name: "AES-GCM",
    length: 256
  }, true, ["encrypt", "decrypt"]));
};
const encrypt = (data, key) => {
  if (!key) {
    return resolve(data);
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({
    name: "AES-GCM",
    iv
  }, key, data).then((cipher) => {
    const encryptedDataEncoder = createEncoder();
    writeVarString(encryptedDataEncoder, "AES-GCM");
    writeVarUint8Array(encryptedDataEncoder, iv);
    writeVarUint8Array(encryptedDataEncoder, new Uint8Array(cipher));
    return toUint8Array(encryptedDataEncoder);
  });
};
const encryptJson = (data, key) => {
  const dataEncoder = createEncoder();
  writeAny(dataEncoder, data);
  return encrypt(toUint8Array(dataEncoder), key);
};
const decrypt = (data, key) => {
  if (!key) {
    return resolve(data);
  }
  const dataDecoder = createDecoder(data);
  const algorithm = readVarString(dataDecoder);
  if (algorithm !== "AES-GCM") {
    reject(create$2("Unknown encryption algorithm"));
  }
  const iv = readVarUint8Array(dataDecoder);
  const cipher = readVarUint8Array(dataDecoder);
  return crypto.subtle.decrypt({
    name: "AES-GCM",
    iv
  }, key, cipher).then((data2) => new Uint8Array(data2));
};
const decryptJson = (data, key) => decrypt(data, key).then((decryptedValue) => readAny(createDecoder(new Uint8Array(decryptedValue))));
const log = createModuleLogger("y-webrtc");
const messageSync = 0;
const messageQueryAwareness = 3;
const messageAwareness = 1;
const messageBcPeerId = 4;
const signalingConns = new Map();
const rooms = new Map();
const checkIsSynced = (room) => {
  let synced = true;
  room.webrtcConns.forEach((peer) => {
    if (!peer.synced) {
      synced = false;
    }
  });
  if (!synced && room.synced || synced && !room.synced) {
    room.synced = synced;
    room.provider.emit("synced", [{synced}]);
    log("synced ", BOLD, room.name, UNBOLD, " with all peers");
  }
};
const readMessage = (room, buf, syncedCallback) => {
  const decoder = createDecoder(buf);
  const encoder = createEncoder();
  const messageType = readVarUint(decoder);
  if (room === void 0) {
    return null;
  }
  const awareness = room.awareness;
  const doc = room.doc;
  let sendReply = false;
  switch (messageType) {
    case messageSync: {
      writeVarUint(encoder, messageSync);
      const syncMessageType = readSyncMessage(decoder, encoder, doc, room);
      if (syncMessageType === messageYjsSyncStep2 && !room.synced) {
        syncedCallback();
      }
      if (syncMessageType === messageYjsSyncStep1) {
        sendReply = true;
      }
      break;
    }
    case messageQueryAwareness:
      writeVarUint(encoder, messageAwareness);
      writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())));
      sendReply = true;
      break;
    case messageAwareness:
      applyAwarenessUpdate(awareness, readVarUint8Array(decoder), room);
      break;
    case messageBcPeerId: {
      const add = readUint8(decoder) === 1;
      const peerName = readVarString(decoder);
      if (peerName !== room.peerId && (room.bcConns.has(peerName) && !add || !room.bcConns.has(peerName) && add)) {
        const removed = [];
        const added = [];
        if (add) {
          room.bcConns.add(peerName);
          added.push(peerName);
        } else {
          room.bcConns.delete(peerName);
          removed.push(peerName);
        }
        room.provider.emit("peers", [{
          added,
          removed,
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }]);
        broadcastBcPeerId(room);
      }
      break;
    }
    default:
      console.error("Unable to compute message");
      return encoder;
  }
  if (!sendReply) {
    return null;
  }
  return encoder;
};
const readPeerMessage = (peerConn, buf) => {
  const room = peerConn.room;
  log("received message from ", BOLD, peerConn.remotePeerId, GREY, " (", room.name, ")", UNBOLD, UNCOLOR);
  return readMessage(room, buf, () => {
    peerConn.synced = true;
    log("synced ", BOLD, room.name, UNBOLD, " with ", BOLD, peerConn.remotePeerId);
    checkIsSynced(room);
  });
};
const sendWebrtcConn = (webrtcConn, encoder) => {
  log("send message to ", BOLD, webrtcConn.remotePeerId, UNBOLD, GREY, " (", webrtcConn.room.name, ")", UNCOLOR);
  try {
    webrtcConn.peer.send(toUint8Array(encoder));
  } catch (e) {
  }
};
const broadcastWebrtcConn = (room, m) => {
  log("broadcast message in ", BOLD, room.name, UNBOLD);
  room.webrtcConns.forEach((conn) => {
    try {
      conn.peer.send(m);
    } catch (e) {
    }
  });
};
class WebrtcConn {
  constructor(signalingConn, initiator, remotePeerId, room) {
    log("establishing connection to ", BOLD, remotePeerId);
    this.room = room;
    this.remotePeerId = remotePeerId;
    this.closed = false;
    this.connected = false;
    this.synced = false;
    this.peer = new simplepeer_min({initiator, ...room.provider.peerOpts});
    this.peer.on("signal", (signal) => {
      publishSignalingMessage(signalingConn, room, {to: remotePeerId, from: room.peerId, type: "signal", signal});
    });
    this.peer.on("connect", () => {
      log("connected to ", BOLD, remotePeerId);
      this.connected = true;
      const provider = room.provider;
      const doc = provider.doc;
      const awareness = room.awareness;
      const encoder = createEncoder();
      writeVarUint(encoder, messageSync);
      writeSyncStep1(encoder, doc);
      sendWebrtcConn(this, encoder);
      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder2 = createEncoder();
        writeVarUint(encoder2, messageAwareness);
        writeVarUint8Array(encoder2, encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())));
        sendWebrtcConn(this, encoder2);
      }
    });
    this.peer.on("close", () => {
      this.connected = false;
      this.closed = true;
      if (room.webrtcConns.has(this.remotePeerId)) {
        room.webrtcConns.delete(this.remotePeerId);
        room.provider.emit("peers", [{
          removed: [this.remotePeerId],
          added: [],
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }]);
      }
      checkIsSynced(room);
      this.peer.destroy();
      log("closed connection to ", BOLD, remotePeerId);
      announceSignalingInfo(room);
    });
    this.peer.on("error", (err) => {
      log("Error in connection to ", BOLD, remotePeerId, ": ", err);
      announceSignalingInfo(room);
    });
    this.peer.on("data", (data) => {
      const answer = readPeerMessage(this, data);
      if (answer !== null) {
        sendWebrtcConn(this, answer);
      }
    });
  }
  destroy() {
    this.peer.destroy();
  }
}
const broadcastBcMessage = (room, m) => encrypt(m, room.key).then((data) => room.mux(() => publish(room.name, data)));
const broadcastRoomMessage = (room, m) => {
  if (room.bcconnected) {
    broadcastBcMessage(room, m);
  }
  broadcastWebrtcConn(room, m);
};
const announceSignalingInfo = (room) => {
  signalingConns.forEach((conn) => {
    if (conn.connected) {
      conn.send({type: "subscribe", topics: [room.name]});
      if (room.webrtcConns.size < room.provider.maxConns) {
        publishSignalingMessage(conn, room, {type: "announce", from: room.peerId});
      }
    }
  });
};
const broadcastBcPeerId = (room) => {
  if (room.provider.filterBcConns) {
    const encoderPeerIdBc = createEncoder();
    writeVarUint(encoderPeerIdBc, messageBcPeerId);
    writeUint8(encoderPeerIdBc, 1);
    writeVarString(encoderPeerIdBc, room.peerId);
    broadcastBcMessage(room, toUint8Array(encoderPeerIdBc));
  }
};
class Room {
  constructor(doc, provider, name, key) {
    this.peerId = uuidv4();
    this.doc = doc;
    this.awareness = provider.awareness;
    this.provider = provider;
    this.synced = false;
    this.name = name;
    this.key = key;
    this.webrtcConns = new Map();
    this.bcConns = new Set();
    this.mux = createMutex();
    this.bcconnected = false;
    this._bcSubscriber = (data) => decrypt(new Uint8Array(data), key).then((m) => this.mux(() => {
      const reply = readMessage(this, m, () => {
      });
      if (reply) {
        broadcastBcMessage(this, toUint8Array(reply));
      }
    }));
    this._docUpdateHandler = (update, origin) => {
      const encoder = createEncoder();
      writeVarUint(encoder, messageSync);
      writeUpdate(encoder, update);
      broadcastRoomMessage(this, toUint8Array(encoder));
    };
    this._awarenessUpdateHandler = ({added, updated, removed}, origin) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoderAwareness = createEncoder();
      writeVarUint(encoderAwareness, messageAwareness);
      writeVarUint8Array(encoderAwareness, encodeAwarenessUpdate(this.awareness, changedClients));
      broadcastRoomMessage(this, toUint8Array(encoderAwareness));
    };
    this.doc.on("update", this._docUpdateHandler);
    this.awareness.on("update", this._awarenessUpdateHandler);
    window.addEventListener("beforeunload", () => {
      removeAwarenessStates(this.awareness, [doc.clientID], "window unload");
      rooms.forEach((room) => {
        room.disconnect();
      });
    });
  }
  connect() {
    announceSignalingInfo(this);
    const roomName = this.name;
    subscribe(roomName, this._bcSubscriber);
    this.bcconnected = true;
    broadcastBcPeerId(this);
    const encoderSync = createEncoder();
    writeVarUint(encoderSync, messageSync);
    writeSyncStep1(encoderSync, this.doc);
    broadcastBcMessage(this, toUint8Array(encoderSync));
    const encoderState = createEncoder();
    writeVarUint(encoderState, messageSync);
    writeSyncStep2(encoderState, this.doc);
    broadcastBcMessage(this, toUint8Array(encoderState));
    const encoderAwarenessQuery = createEncoder();
    writeVarUint(encoderAwarenessQuery, messageQueryAwareness);
    broadcastBcMessage(this, toUint8Array(encoderAwarenessQuery));
    const encoderAwarenessState = createEncoder();
    writeVarUint(encoderAwarenessState, messageAwareness);
    writeVarUint8Array(encoderAwarenessState, encodeAwarenessUpdate(this.awareness, [this.doc.clientID]));
    broadcastBcMessage(this, toUint8Array(encoderAwarenessState));
  }
  disconnect() {
    signalingConns.forEach((conn) => {
      if (conn.connected) {
        conn.send({type: "unsubscribe", topics: [this.name]});
      }
    });
    removeAwarenessStates(this.awareness, [this.doc.clientID], "disconnect");
    const encoderPeerIdBc = createEncoder();
    writeVarUint(encoderPeerIdBc, messageBcPeerId);
    writeUint8(encoderPeerIdBc, 0);
    writeVarString(encoderPeerIdBc, this.peerId);
    broadcastBcMessage(this, toUint8Array(encoderPeerIdBc));
    unsubscribe(this.name, this._bcSubscriber);
    this.bcconnected = false;
    this.doc.off("update", this._docUpdateHandler);
    this.awareness.off("update", this._awarenessUpdateHandler);
    this.webrtcConns.forEach((conn) => conn.destroy());
  }
  destroy() {
    this.disconnect();
  }
}
const openRoom = (doc, provider, name, key) => {
  if (rooms.has(name)) {
    throw create$2(`A Yjs Doc connected to room "${name}" already exists!`);
  }
  const room = new Room(doc, provider, name, key);
  rooms.set(name, room);
  return room;
};
const publishSignalingMessage = (conn, room, data) => {
  if (room.key) {
    encryptJson(data, room.key).then((data2) => {
      conn.send({type: "publish", topic: room.name, data: toBase64(data2)});
    });
  } else {
    conn.send({type: "publish", topic: room.name, data});
  }
};
class SignalingConn extends WebsocketClient {
  constructor(url) {
    super(url);
    this.providers = new Set();
    this.on("connect", () => {
      log(`connected (${url})`);
      const topics = Array.from(rooms.keys());
      this.send({type: "subscribe", topics});
      rooms.forEach((room) => publishSignalingMessage(this, room, {type: "announce", from: room.peerId}));
    });
    this.on("message", (m) => {
      switch (m.type) {
        case "publish": {
          const roomName = m.topic;
          const room = rooms.get(roomName);
          if (room == null || typeof roomName !== "string") {
            return;
          }
          const execMessage = (data) => {
            const webrtcConns = room.webrtcConns;
            const peerId = room.peerId;
            if (data == null || data.from === peerId || data.to !== void 0 && data.to !== peerId || room.bcConns.has(data.from)) {
              return;
            }
            const emitPeerChange = webrtcConns.has(data.from) ? () => {
            } : () => room.provider.emit("peers", [{
              removed: [],
              added: [data.from],
              webrtcPeers: Array.from(room.webrtcConns.keys()),
              bcPeers: Array.from(room.bcConns)
            }]);
            switch (data.type) {
              case "announce":
                if (webrtcConns.size < room.provider.maxConns) {
                  setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, true, data.from, room));
                  emitPeerChange();
                }
                break;
              case "signal":
                if (data.to === peerId) {
                  setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, false, data.from, room)).peer.signal(data.signal);
                  emitPeerChange();
                }
                break;
            }
          };
          if (room.key) {
            if (typeof m.data === "string") {
              decryptJson(fromBase64(m.data), room.key).then(execMessage);
            }
          } else {
            execMessage(m.data);
          }
        }
      }
    });
    this.on("disconnect", () => log(`disconnect (${url})`));
  }
}
class WebrtcProvider extends Observable {
  constructor(roomName, doc, {
    signaling = ["wss://signaling.yjs.dev", "wss://y-webrtc-signaling-eu.herokuapp.com", "wss://y-webrtc-signaling-us.herokuapp.com"],
    password = null,
    awareness = new Awareness(doc),
    maxConns = 20 + floor(rand() * 15),
    filterBcConns = true,
    peerOpts = {}
  } = {}) {
    super();
    this.roomName = roomName;
    this.doc = doc;
    this.filterBcConns = filterBcConns;
    this.awareness = awareness;
    this.shouldConnect = false;
    this.signalingUrls = signaling;
    this.signalingConns = [];
    this.maxConns = maxConns;
    this.peerOpts = peerOpts;
    this.key = password ? deriveKey(password, roomName) : resolve(null);
    this.room = null;
    this.key.then((key) => {
      this.room = openRoom(doc, this, roomName, key);
      if (this.shouldConnect) {
        this.room.connect();
      } else {
        this.room.disconnect();
      }
    });
    this.connect();
    this.destroy = this.destroy.bind(this);
    doc.on("destroy", this.destroy);
  }
  get connected() {
    return this.room !== null && this.shouldConnect;
  }
  connect() {
    this.shouldConnect = true;
    this.signalingUrls.forEach((url) => {
      const signalingConn = setIfUndefined(signalingConns, url, () => new SignalingConn(url));
      this.signalingConns.push(signalingConn);
      signalingConn.providers.add(this);
    });
    if (this.room) {
      this.room.connect();
    }
  }
  disconnect() {
    this.shouldConnect = false;
    this.signalingConns.forEach((conn) => {
      conn.providers.delete(this);
      if (conn.providers.size === 0) {
        conn.destroy();
        signalingConns.delete(conn.url);
      }
    });
    if (this.room) {
      this.room.disconnect();
    }
  }
  destroy() {
    this.doc.off("destroy", this.destroy);
    this.key.then(() => {
      this.room.destroy();
      rooms.delete(this.roomName);
    });
    super.destroy();
  }
}
function readableMap(map2) {
  let value = new Map(Object.entries(map2.toJSON()));
  let subs = [];
  const setValue = (newValue) => {
    if (value === newValue) {
      return;
    }
    value = newValue;
    subs.forEach((sub) => sub(value));
  };
  const observer = (event, _transaction) => {
    const target = event.target;
    setValue(new Map(Object.entries(target.toJSON())));
  };
  const subscribe2 = (handler) => {
    subs = [...subs, handler];
    if (subs.length === 1) {
      value = new Map(Object.entries(map2.toJSON()));
      map2.observe(observer);
    }
    handler(value);
    return () => {
      subs = subs.filter((sub) => sub !== handler);
      if (subs.length === 0) {
        map2.unobserve(observer);
      }
    };
  };
  return {subscribe: subscribe2, map: map2};
}
var $layout_svelte = ".theme.svelte-62pnlt{min-height:100vh;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;padding-top:1rem}footer.svelte-62pnlt{text-align:center}";
const css = {
  code: ".theme.svelte-62pnlt{min-height:100vh;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;padding-top:1rem}footer.svelte-62pnlt{text-align:center}",
  map: `{"version":3,"file":"$layout.svelte","sources":["$layout.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte';\\n  import { page } from '$app/stores';\\n  import HomeNav from '$lib/HomeNav.svelte'\\n  import Nav from '$lib/Nav.svelte'\\n\\timport '../app.css';\\n\\n  // a component?\\n  import * as Y from 'yjs';\\n  import { WebrtcProvider } from 'y-webrtc'\\n  import readableMap from '$lib/ymap.js';\\n\\n  // console.log('load?')\\n  onMount(async () => {\\n    const ydoc = new Y.Doc();\\n    const provider = new WebrtcProvider('joseki-party', ydoc)\\n    const ymap = ydoc.getMap('dict');\\n    const dict = readableMap(ymap);\\n\\n    console.log(ydoc)\\n    console.log(provider)\\n  });\\n\\n\\n  $: {\\n    console.log($page)\\n  }\\n</script>\\n\\n<div class=\\"theme theme-default\\">\\n  <div class=\\"content\\">\\n    {#if $page.path === '/'}\\n      <HomeNav />\\n    {:else}\\n      <Nav />\\n    {/if}\\n    <slot />\\n  </div>\\n\\n  <footer>\\n    <p>Play Go online with friends, party time \u{1F389}</p>\\n    {#if $page.path === '/'}\\n      <p>Built by <a href=\\"https://nikolas.ws/\\">nikolas.ws</a></p>\\n    {/if}\\n  </footer>\\n</div>\\n\\n<style>\\n  .theme {\\n    min-height: 100vh;\\n    box-sizing: border-box;\\n    display: grid;\\n    grid-template-rows: 1fr auto;\\n    padding-top: 1rem;\\n  }\\n\\n  footer {\\n    text-align: center;\\n  }\\n</style>"],"names":[],"mappings":"AAgDE,MAAM,cAAC,CAAC,AACN,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,UAAU,CACtB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,GAAG,CAAC,IAAI,CAC5B,WAAW,CAAE,IAAI,AACnB,CAAC,AAED,MAAM,cAAC,CAAC,AACN,UAAU,CAAE,MAAM,AACpB,CAAC"}`
};
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe$1(page, (value) => $page = value);
  onMount(async () => {
    const ydoc = new Doc();
    const provider = new WebrtcProvider("joseki-party", ydoc);
    const ymap = ydoc.getMap("dict");
    readableMap(ymap);
    console.log(ydoc);
    console.log(provider);
  });
  $$result.css.add(css);
  {
    {
      console.log($page);
    }
  }
  $$unsubscribe_page();
  return `<div class="${"theme theme-default svelte-62pnlt"}"><div class="${"content"}">${$page.path === "/" ? `${validate_component(HomeNav, "HomeNav").$$render($$result, {}, {}, {})}` : `${validate_component(Nav, "Nav").$$render($$result, {}, {}, {})}`}
    ${slots.default ? slots.default({}) : ``}</div>

  <footer class="${"svelte-62pnlt"}"><p>Play Go online with friends, party time \u{1F389}</p>
    ${$page.path === "/" ? `<p>Built by <a href="${"https://nikolas.ws/"}">nikolas.ws</a></p>` : ``}</footer>
</div>`;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout
});
export {init, render};
