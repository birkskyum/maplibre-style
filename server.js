import 'events';
import 'stream';
import { Headers as Headers$1, Request as Request$1, FormData, File, Response as Response$1, fetch as fetch$1 } from 'undici';
import crypto from 'crypto';
import Streams from 'stream/web';
import require$$8 from 'punycode';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var multipart$1 = {};

var hasRequiredMultipart;

function requireMultipart () {
	if (hasRequiredMultipart) return multipart$1;
	hasRequiredMultipart = 1;
	/**
	 * Multipart Parser (Finite State Machine)
	 * usage:
	 * const multipart = require('./multipart.js');
	 * const body = multipart.DemoData(); 							   // raw body
	 * const body = Buffer.from(event['body-json'].toString(),'base64'); // AWS case
	 * const boundary = multipart.getBoundary(event.params.header['content-type']);
	 * const parts = multipart.Parse(body,boundary);
	 * each part is:
	 * { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
	 *  or { name: 'key', data: <Buffer 41 41 41 41 42 42 42 42> }
	 */
	Object.defineProperty(multipart$1, "__esModule", { value: true });
	multipart$1.DemoData = multipart$1.getBoundary = multipart$1.parse = void 0;
	var ParsingState;
	(function (ParsingState) {
	    ParsingState[ParsingState["INIT"] = 0] = "INIT";
	    ParsingState[ParsingState["READING_HEADERS"] = 1] = "READING_HEADERS";
	    ParsingState[ParsingState["READING_DATA"] = 2] = "READING_DATA";
	    ParsingState[ParsingState["READING_PART_SEPARATOR"] = 3] = "READING_PART_SEPARATOR";
	})(ParsingState || (ParsingState = {}));
	function parse(multipartBodyBuffer, boundary) {
	    var lastline = '';
	    var contentDispositionHeader = '';
	    var contentTypeHeader = '';
	    var state = ParsingState.INIT;
	    var buffer = [];
	    var allParts = [];
	    var currentPartHeaders = [];
	    for (var i = 0; i < multipartBodyBuffer.length; i++) {
	        var oneByte = multipartBodyBuffer[i];
	        var prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
	        // 0x0a => \n
	        // 0x0d => \r
	        var newLineDetected = oneByte === 0x0a && prevByte === 0x0d;
	        var newLineChar = oneByte === 0x0a || oneByte === 0x0d;
	        if (!newLineChar)
	            lastline += String.fromCharCode(oneByte);
	        if (ParsingState.INIT === state && newLineDetected) {
	            // searching for boundary
	            if ('--' + boundary === lastline) {
	                state = ParsingState.READING_HEADERS; // found boundary. start reading headers
	            }
	            lastline = '';
	        }
	        else if (ParsingState.READING_HEADERS === state && newLineDetected) {
	            // parsing headers. Headers are separated by an empty line from the content. Stop reading headers when the line is empty
	            if (lastline.length) {
	                currentPartHeaders.push(lastline);
	            }
	            else {
	                // found empty line. search for the headers we want and set the values
	                for (var _i = 0, currentPartHeaders_1 = currentPartHeaders; _i < currentPartHeaders_1.length; _i++) {
	                    var h = currentPartHeaders_1[_i];
	                    if (h.toLowerCase().startsWith('content-disposition:')) {
	                        contentDispositionHeader = h;
	                    }
	                    else if (h.toLowerCase().startsWith('content-type:')) {
	                        contentTypeHeader = h;
	                    }
	                }
	                state = ParsingState.READING_DATA;
	                buffer = [];
	            }
	            lastline = '';
	        }
	        else if (ParsingState.READING_DATA === state) {
	            // parsing data
	            if (lastline.length > boundary.length + 4) {
	                lastline = ''; // mem save
	            }
	            if ('--' + boundary === lastline) {
	                var j = buffer.length - lastline.length;
	                var part = buffer.slice(0, j - 1);
	                allParts.push(process({ contentDispositionHeader: contentDispositionHeader, contentTypeHeader: contentTypeHeader, part: part }));
	                buffer = [];
	                currentPartHeaders = [];
	                lastline = '';
	                state = ParsingState.READING_PART_SEPARATOR;
	                contentDispositionHeader = '';
	                contentTypeHeader = '';
	            }
	            else {
	                buffer.push(oneByte);
	            }
	            if (newLineDetected) {
	                lastline = '';
	            }
	        }
	        else if (ParsingState.READING_PART_SEPARATOR === state) {
	            if (newLineDetected) {
	                state = ParsingState.READING_HEADERS;
	            }
	        }
	    }
	    return allParts;
	}
	multipart$1.parse = parse;
	//  read the boundary from the content-type header sent by the http client
	//  this value may be similar to:
	//  'multipart/form-data; boundary=----WebKitFormBoundaryvm5A9tzU1ONaGP5B',
	function getBoundary(header) {
	    var items = header.split(';');
	    if (items) {
	        for (var i = 0; i < items.length; i++) {
	            var item = new String(items[i]).trim();
	            if (item.indexOf('boundary') >= 0) {
	                var k = item.split('=');
	                return new String(k[1]).trim().replace(/^["']|["']$/g, '');
	            }
	        }
	    }
	    return '';
	}
	multipart$1.getBoundary = getBoundary;
	function DemoData() {
	    var body = 'trash1\r\n';
	    body += '------WebKitFormBoundaryvef1fLxmoUdYZWXp\r\n';
	    body += 'Content-Type: text/plain\r\n';
	    body +=
	        'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"\r\n';
	    body += '\r\n';
	    body += '@11X';
	    body += '111Y\r\n';
	    body += '111Z\rCCCC\nCCCC\r\nCCCCC@\r\n\r\n';
	    body += '------WebKitFormBoundaryvef1fLxmoUdYZWXp\r\n';
	    body += 'Content-Type: text/plain\r\n';
	    body +=
	        'Content-Disposition: form-data; name="uploads[]"; filename="B.txt"\r\n';
	    body += '\r\n';
	    body += '@22X';
	    body += '222Y\r\n';
	    body += '222Z\r222W\n2220\r\n666@\r\n';
	    body += '------WebKitFormBoundaryvef1fLxmoUdYZWXp\r\n';
	    body += 'Content-Disposition: form-data; name="input1"\r\n';
	    body += '\r\n';
	    body += 'value1\r\n';
	    body += '------WebKitFormBoundaryvef1fLxmoUdYZWXp--\r\n';
	    return {
	        body: Buffer.from(body),
	        boundary: '----WebKitFormBoundaryvef1fLxmoUdYZWXp'
	    };
	}
	multipart$1.DemoData = DemoData;
	function process(part) {
	    // will transform this object:
	    // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
	    // info: 'Content-Type: text/plain',
	    // part: 'AAAABBBB' }
	    // into this one:
	    // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
	    var obj = function (str) {
	        var k = str.split('=');
	        var a = k[0].trim();
	        var b = JSON.parse(k[1].trim());
	        var o = {};
	        Object.defineProperty(o, a, {
	            value: b,
	            writable: true,
	            enumerable: true,
	            configurable: true
	        });
	        return o;
	    };
	    var header = part.contentDispositionHeader.split(';');
	    var filenameData = header[2];
	    var input = {};
	    if (filenameData) {
	        input = obj(filenameData);
	        var contentType = part.contentTypeHeader.split(':')[1].trim();
	        Object.defineProperty(input, 'type', {
	            value: contentType,
	            writable: true,
	            enumerable: true,
	            configurable: true
	        });
	    }
	    // always process the name field
	    Object.defineProperty(input, 'name', {
	        value: header[1].split('=')[1].replace(/"/g, ''),
	        writable: true,
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(input, 'data', {
	        value: Buffer.from(part.part),
	        writable: true,
	        enumerable: true,
	        configurable: true
	    });
	    return input;
	}
	
	return multipart$1;
}

var multipartExports = requireMultipart();
var multipart = /*@__PURE__*/getDefaultExportFromCjs(multipartExports);

var setCookieExports = {};
var setCookie = {
  get exports(){ return setCookieExports; },
  set exports(v){ setCookieExports = v; },
};

var hasRequiredSetCookie;

function requireSetCookie () {
	if (hasRequiredSetCookie) return setCookieExports;
	hasRequiredSetCookie = 1;

	var defaultParseOptions = {
	  decodeValues: true,
	  map: false,
	  silent: false,
	};

	function isNonEmptyString(str) {
	  return typeof str === "string" && !!str.trim();
	}

	function parseString(setCookieValue, options) {
	  var parts = setCookieValue.split(";").filter(isNonEmptyString);

	  var nameValuePairStr = parts.shift();
	  var parsed = parseNameValuePair(nameValuePairStr);
	  var name = parsed.name;
	  var value = parsed.value;

	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  try {
	    value = options.decodeValues ? decodeURIComponent(value) : value; // decode cookie value
	  } catch (e) {
	    console.error(
	      "set-cookie-parser encountered an error while decoding a cookie with value '" +
	        value +
	        "'. Set options.decodeValues to false to disable this feature.",
	      e
	    );
	  }

	  var cookie = {
	    name: name,
	    value: value,
	  };

	  parts.forEach(function (part) {
	    var sides = part.split("=");
	    var key = sides.shift().trimLeft().toLowerCase();
	    var value = sides.join("=");
	    if (key === "expires") {
	      cookie.expires = new Date(value);
	    } else if (key === "max-age") {
	      cookie.maxAge = parseInt(value, 10);
	    } else if (key === "secure") {
	      cookie.secure = true;
	    } else if (key === "httponly") {
	      cookie.httpOnly = true;
	    } else if (key === "samesite") {
	      cookie.sameSite = value;
	    } else {
	      cookie[key] = value;
	    }
	  });

	  return cookie;
	}

	function parseNameValuePair(nameValuePairStr) {
	  // Parses name-value-pair according to rfc6265bis draft

	  var name = "";
	  var value = "";
	  var nameValueArr = nameValuePairStr.split("=");
	  if (nameValueArr.length > 1) {
	    name = nameValueArr.shift();
	    value = nameValueArr.join("="); // everything after the first =, joined by a "=" if there was more than one part
	  } else {
	    value = nameValuePairStr;
	  }

	  return { name: name, value: value };
	}

	function parse(input, options) {
	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  if (!input) {
	    if (!options.map) {
	      return [];
	    } else {
	      return {};
	    }
	  }

	  if (input.headers) {
	    if (typeof input.headers.getSetCookie === "function") {
	      // for fetch responses - they combine headers of the same type in the headers array,
	      // but getSetCookie returns an uncombined array
	      input = input.headers.getSetCookie();
	    } else if (input.headers["set-cookie"]) {
	      // fast-path for node.js (which automatically normalizes header names to lower-case
	      input = input.headers["set-cookie"];
	    } else {
	      // slow-path for other environments - see #25
	      var sch =
	        input.headers[
	          Object.keys(input.headers).find(function (key) {
	            return key.toLowerCase() === "set-cookie";
	          })
	        ];
	      // warn if called on a request-like object with a cookie header rather than a set-cookie header - see #34, 36
	      if (!sch && input.headers.cookie && !options.silent) {
	        console.warn(
	          "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
	        );
	      }
	      input = sch;
	    }
	  }
	  if (!Array.isArray(input)) {
	    input = [input];
	  }

	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  if (!options.map) {
	    return input.filter(isNonEmptyString).map(function (str) {
	      return parseString(str, options);
	    });
	  } else {
	    var cookies = {};
	    return input.filter(isNonEmptyString).reduce(function (cookies, str) {
	      var cookie = parseString(str, options);
	      cookies[cookie.name] = cookie;
	      return cookies;
	    }, cookies);
	  }
	}

	/*
	  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
	  that are within a single set-cookie field-value, such as in the Expires portion.

	  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
	  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
	  React Native's fetch does this for *every* header, including set-cookie.

	  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
	  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
	*/
	function splitCookiesString(cookiesString) {
	  if (Array.isArray(cookiesString)) {
	    return cookiesString;
	  }
	  if (typeof cookiesString !== "string") {
	    return [];
	  }

	  var cookiesStrings = [];
	  var pos = 0;
	  var start;
	  var ch;
	  var lastComma;
	  var nextStart;
	  var cookiesSeparatorFound;

	  function skipWhitespace() {
	    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
	      pos += 1;
	    }
	    return pos < cookiesString.length;
	  }

	  function notSpecialChar() {
	    ch = cookiesString.charAt(pos);

	    return ch !== "=" && ch !== ";" && ch !== ",";
	  }

	  while (pos < cookiesString.length) {
	    start = pos;
	    cookiesSeparatorFound = false;

	    while (skipWhitespace()) {
	      ch = cookiesString.charAt(pos);
	      if (ch === ",") {
	        // ',' is a cookie separator if we have later first '=', not ';' or ','
	        lastComma = pos;
	        pos += 1;

	        skipWhitespace();
	        nextStart = pos;

	        while (pos < cookiesString.length && notSpecialChar()) {
	          pos += 1;
	        }

	        // currently special character
	        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
	          // we found cookies separator
	          cookiesSeparatorFound = true;
	          // pos is inside the next cookie, so back up and return it.
	          pos = nextStart;
	          cookiesStrings.push(cookiesString.substring(start, lastComma));
	          start = pos;
	        } else {
	          // in param ',' or param separator ';',
	          // we continue from that comma
	          pos = lastComma + 1;
	        }
	      } else {
	        pos += 1;
	      }
	    }

	    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
	      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
	    }
	  }

	  return cookiesStrings;
	}

	setCookie.exports = parse;
	setCookieExports.parse = parse;
	setCookieExports.parseString = parseString;
	setCookieExports.splitCookiesString = splitCookiesString;
	return setCookieExports;
}

requireSetCookie();

function nodeToWeb(nodeStream) {
  var destroyed = false;
  var listeners = {};

  function start(controller) {
    listeners["data"] = onData;
    listeners["end"] = onData;
    listeners["end"] = onDestroy;
    listeners["close"] = onDestroy;
    listeners["error"] = onDestroy;
    for (var name in listeners) nodeStream.on(name, listeners[name]);

    nodeStream.pause();

    function onData(chunk) {
      if (destroyed) return;
      controller.enqueue(chunk);
      nodeStream.pause();
    }

    function onDestroy(err) {
      if (destroyed) return;
      destroyed = true;

      for (var name in listeners) nodeStream.removeListener(name, listeners[name]);

      if (err) controller.error(err);
      else controller.close();
    }
  }

  function pull() {
    if (destroyed) return;
    nodeStream.resume();
  }

  function cancel() {
    destroyed = true;

    for (var name in listeners) nodeStream.removeListener(name, listeners[name]);

    nodeStream.push(null);
    nodeStream.pause();
    if (nodeStream.destroy) nodeStream.destroy();
    else if (nodeStream.close) nodeStream.close();
  }

  return new ReadableStream({ start: start, pull: pull, cancel: cancel });
}

function createHeaders(requestHeaders) {
  let headers = new Headers$1();

  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

class NodeRequest extends Request$1 {
  constructor(input, init) {
    if (init && init.data && init.data.on) {
      init = {
        duplex: "half",
        ...init,
        body: init.data.headers["content-type"]?.includes("x-www")
          ? init.data
          : nodeToWeb(init.data)
      };
    }

    super(input, init);
  }

  // async json() {
  //   return JSON.parse(await this.text());
  // }

  async buffer() {
    return Buffer.from(await super.arrayBuffer());
  }

  // async text() {
  //   return (await this.buffer()).toString();
  // }

  // @ts-ignore
  async formData() {
    if (this.headers.get("content-type") === "application/x-www-form-urlencoded") {
      return await super.formData();
    } else {
      const data = await this.buffer();
      const input = multipart.parse(
        data,
        this.headers.get("content-type").replace("multipart/form-data; boundary=", "")
      );
      const form = new FormData();
      input.forEach(({ name, data, filename, type }) => {
        // file fields have Content-Type set,
        // whereas non-file fields must not
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
        const isFile = type !== undefined;
        if (isFile) {
          const value = new File([data], filename, { type });
          form.append(name, value, filename);
        } else {
          const value = data.toString("utf-8");
          form.append(name, value);
        }
      });
      return form;
    }
  }

  // @ts-ignore
  clone() {
    /** @type {BaseNodeRequest & { buffer?: () => Promise<Buffer>; formData?: () => Promise<FormData> }}  */
    let el = super.clone();
    el.buffer = this.buffer.bind(el);
    el.formData = this.formData.bind(el);
    return el;
  }
}

function createRequest(req) {
  let origin = req.headers.origin || `http://${req.headers.host}`;
  let url = new URL(req.url, origin);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers),
    // POST, PUT, & PATCH will be read as body by NodeRequest
    data: req.method.indexOf("P") === 0 ? req : null
  };

  return new NodeRequest(url.href, init);
}

Object.assign(globalThis, Streams, {
  Request: Request$1,
  Response: Response$1,
  fetch: fetch$1,
  Headers: Headers$1
});

if (globalThis.crypto != crypto.webcrypto) {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}

var manifest = {
	"/*404": [
	{
		type: "script",
		href: "/github-repo-name/assets/_...404_-f1e817b2.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	}
],
	"/deprecations": [
	{
		type: "script",
		href: "/github-repo-name/assets/deprecations-3c9f0236.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/caption-4b8b0fd6.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/subtitle-e7688640.js"
	}
],
	"/expressions": [
	{
		type: "script",
		href: "/github-repo-name/assets/expressions-27952dc0.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	}
],
	"/glyphs": [
	{
		type: "script",
		href: "/github-repo-name/assets/glyphs-58141e12.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	}
],
	"/": [
	{
		type: "script",
		href: "/github-repo-name/assets/index-6ed0ef09.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	}
],
	"/layers": [
	{
		type: "script",
		href: "/github-repo-name/assets/layers-fd590cde.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/items-70992cad.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/subtitle-e7688640.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/caption-4b8b0fd6.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/layers-c0520030.css"
	}
],
	"/light": [
	{
		type: "script",
		href: "/github-repo-name/assets/light-9cfefc5c.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/items-70992cad.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/subtitle-e7688640.js"
	}
],
	"/root": [
	{
		type: "script",
		href: "/github-repo-name/assets/root-76009f37.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/items-70992cad.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/subtitle-e7688640.js"
	}
],
	"/sources": [
	{
		type: "script",
		href: "/github-repo-name/assets/sources-e1e35240.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/items-70992cad.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/subtitle-e7688640.js"
	}
],
	"/sprite": [
	{
		type: "script",
		href: "/github-repo-name/assets/sprite-ec012a85.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	}
],
	"/transition": [
	{
		type: "script",
		href: "/github-repo-name/assets/transition-5d863e17.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/v8-31fa6040.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/items-70992cad.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/property-c54d3cb9.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/property-53fcac70.css"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/subtitle-e7688640.js"
	}
],
	"/types": [
	{
		type: "script",
		href: "/github-repo-name/assets/types-c27554a6.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/markdown-e5577b03.js"
	},
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/markdown-285a7e65.css"
	}
],
	"entry-client": [
	{
		type: "script",
		href: "/github-repo-name/assets/entry-client-9d25f4a5.js"
	},
	{
		type: "style",
		href: "/github-repo-name/assets/entry-client-2a0af10c.css"
	}
],
	"index.html": [
]
};

const $PROXY = Symbol("solid-proxy");
const ERROR = Symbol("error");
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function handleError(err) {
  const error = castError(err);
  const fns = lookup(Owner, ERROR);
  if (!fns) throw error;
  for (const f of fns) f(error);
}
const UNOWNED = {
  context: null,
  owner: null,
  owned: null,
  cleanups: null
};
let Owner = null;
function createOwner() {
  const o = {
    owner: Owner,
    context: null,
    owned: null,
    cleanups: null
  };
  if (Owner) {
    if (!Owner.owned) Owner.owned = [o];else Owner.owned.push(o);
  }
  return o;
}
function createRoot(fn, detachedOwner) {
  const owner = Owner,
    root = fn.length === 0 ? UNOWNED : {
      context: null,
      owner: detachedOwner === undefined ? owner : detachedOwner,
      owned: null,
      cleanups: null
    };
  Owner = root;
  let result;
  try {
    result = fn(fn.length === 0 ? () => {} : () => cleanNode(root));
  } catch (err) {
    handleError(err);
  } finally {
    Owner = owner;
  }
  return result;
}
function createSignal(value, options) {
  return [() => value, v => {
    return value = typeof v === "function" ? v(value) : v;
  }];
}
function createComputed(fn, value) {
  Owner = createOwner();
  try {
    fn(value);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
}
const createRenderEffect = createComputed;
function createEffect(fn, value) {}
function createMemo(fn, value) {
  Owner = createOwner();
  let v;
  try {
    v = fn(value);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
  return () => v;
}
function batch(fn) {
  return fn();
}
const untrack = batch;
function on(deps, fn, options = {}) {
  const isArray = Array.isArray(deps);
  const defer = options.defer;
  return () => {
    if (defer) return undefined;
    let value;
    if (isArray) {
      value = [];
      for (let i = 0; i < deps.length; i++) value.push(deps[i]());
    } else value = deps();
    return fn(value);
  };
}
function onCleanup(fn) {
  if (Owner) {
    if (!Owner.cleanups) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
  }
  return fn;
}
function cleanNode(node) {
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (let i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
    node.cleanups = null;
  }
}
function catchError(fn, handler) {
  Owner = {
    owner: Owner,
    context: {
      [ERROR]: [handler]
    },
    owned: null,
    cleanups: null
  };
  try {
    return fn();
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
}
function createContext(defaultValue) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
function useContext(context) {
  let ctx;
  return (ctx = lookup(Owner, context.id)) !== undefined ? ctx : context.defaultValue;
}
function getOwner() {
  return Owner;
}
function children(fn) {
  const memo = createMemo(() => resolveChildren(fn()));
  memo.toArray = () => {
    const c = memo();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo;
}
function runWithOwner(o, fn) {
  const prev = Owner;
  Owner = o;
  try {
    return fn();
  } catch (err) {
    handleError(err);
  } finally {
    Owner = prev;
  }
}
function lookup(owner, key) {
  return owner ? owner.context && owner.context[key] !== undefined ? owner.context[key] : lookup(owner.owner, key) : undefined;
}
function resolveChildren(children) {
  if (typeof children === "function" && !children.length) return resolveChildren(children());
  if (Array.isArray(children)) {
    const results = [];
    for (let i = 0; i < children.length; i++) {
      const result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children;
}
function createProvider(id) {
  return function provider(props) {
    return createMemo(() => {
      Owner.context = {
        [id]: props.value
      };
      return children(() => props.children);
    });
  };
}

function resolveSSRNode$1(node) {
  const t = typeof node;
  if (t === "string") return node;
  if (node == null || t === "boolean") return "";
  if (Array.isArray(node)) {
    let mapped = "";
    for (let i = 0, len = node.length; i < len; i++) mapped += resolveSSRNode$1(node[i]);
    return mapped;
  }
  if (t === "object") return node.t;
  if (t === "function") return resolveSSRNode$1(node());
  return String(node);
}
const sharedConfig = {};
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return sharedConfig.context ? {
    ...sharedConfig.context,
    id: `${sharedConfig.context.id}${sharedConfig.context.count++}-`,
    count: 0
  } : undefined;
}
function createUniqueId() {
  const ctx = sharedConfig.context;
  if (!ctx) throw new Error(`createUniqueId cannot be used under non-hydrating context`);
  return `${ctx.id}${ctx.count++}`;
}
function createComponent(Comp, props) {
  if (sharedConfig.context && !sharedConfig.context.noHydrate) {
    const c = sharedConfig.context;
    setHydrateContext(nextHydrateContext());
    const r = Comp(props || {});
    setHydrateContext(c);
    return r;
  }
  return Comp(props || {});
}
function mergeProps(...sources) {
  const target = {};
  for (let i = 0; i < sources.length; i++) {
    let source = sources[i];
    if (typeof source === "function") source = source();
    if (source) {
      const descriptors = Object.getOwnPropertyDescriptors(source);
      for (const key in descriptors) {
        if (key in target) continue;
        Object.defineProperty(target, key, {
          enumerable: true,
          get() {
            for (let i = sources.length - 1; i >= 0; i--) {
              let s = sources[i] || {};
              if (typeof s === "function") s = s();
              const v = s[key];
              if (v !== undefined) return v;
            }
          }
        });
      }
    }
  }
  return target;
}
function splitProps(props, ...keys) {
  const descriptors = Object.getOwnPropertyDescriptors(props),
    split = k => {
      const clone = {};
      for (let i = 0; i < k.length; i++) {
        const key = k[i];
        if (descriptors[key]) {
          Object.defineProperty(clone, key, descriptors[key]);
          delete descriptors[key];
        }
      }
      return clone;
    };
  return keys.map(split).concat(split(Object.keys(descriptors)));
}
function simpleMap(props, wrap) {
  const list = props.each || [],
    len = list.length,
    fn = props.children;
  if (len) {
    let mapped = Array(len);
    for (let i = 0; i < len; i++) mapped[i] = wrap(fn, list[i], i);
    return mapped;
  }
  return props.fallback;
}
function For(props) {
  return simpleMap(props, (fn, item, i) => fn(item, () => i));
}
function Show(props) {
  let c;
  return props.when ? typeof (c = props.children) === "function" ? c(props.keyed ? props.when : () => props.when) : c : props.fallback || "";
}
function ErrorBoundary$1(props) {
  let error,
    res,
    clean,
    sync = true;
  const ctx = sharedConfig.context;
  const id = ctx.id + ctx.count;
  function displayFallback() {
    cleanNode(clean);
    ctx.writeResource(id, error, true);
    setHydrateContext({
      ...ctx,
      count: 0
    });
    const f = props.fallback;
    return typeof f === "function" && f.length ? f(error, () => {}) : f;
  }
  createMemo(() => {
    clean = Owner;
    return catchError(() => res = props.children, err => {
      error = err;
      !sync && ctx.replace("e" + id, displayFallback);
      sync = true;
    });
  });
  if (error) return displayFallback();
  sync = false;
  return {
    t: `<!!$e${id}>${resolveSSRNode$1(res)}<!!$/e${id}>`
  };
}
const SuspenseContext = createContext();
function suspenseComplete(c) {
  for (const r of c.resources.values()) {
    if (r.loading) return false;
  }
  return true;
}
function startTransition(fn) {
  fn();
}
function Suspense(props) {
  let done;
  const ctx = sharedConfig.context;
  const id = ctx.id + ctx.count;
  const o = createOwner();
  const value = ctx.suspense[id] || (ctx.suspense[id] = {
    resources: new Map(),
    completed: () => {
      const res = runSuspense();
      if (suspenseComplete(value)) {
        done(resolveSSRNode$1(res));
      }
    }
  });
  function suspenseError(err) {
    if (!done || !done(undefined, err)) {
      runWithOwner(o.owner, () => {
        throw err;
      });
    }
  }
  function runSuspense() {
    setHydrateContext({
      ...ctx,
      count: 0
    });
    cleanNode(o);
    return runWithOwner(o, () => createComponent(SuspenseContext.Provider, {
      value,
      get children() {
        return catchError(() => props.children, suspenseError);
      }
    }));
  }
  const res = runSuspense();
  if (suspenseComplete(value)) return res;
  done = ctx.async ? ctx.registerFragment(id) : undefined;
  return catchError(() => {
    if (ctx.async) {
      setHydrateContext({
        ...ctx,
        count: 0,
        id: ctx.id + "0-f",
        noHydrate: true
      });
      const res = {
        t: `<template id="pl-${id}"></template>${resolveSSRNode$1(props.fallback)}<!pl-${id}>`
      };
      setHydrateContext(ctx);
      return res;
    }
    setHydrateContext({
      ...ctx,
      count: 0,
      id: ctx.id + "0-f"
    });
    ctx.writeResource(id, "$$f");
    return props.fallback;
  }, suspenseError);
}

var I=(c=>(c[c.AggregateError=1]="AggregateError",c[c.ArrayPrototypeValues=2]="ArrayPrototypeValues",c[c.ArrowFunction=4]="ArrowFunction",c[c.BigInt=8]="BigInt",c[c.ErrorPrototypeStack=16]="ErrorPrototypeStack",c[c.Map=32]="Map",c[c.MethodShorthand=64]="MethodShorthand",c[c.ObjectAssign=128]="ObjectAssign",c[c.Promise=256]="Promise",c[c.Set=512]="Set",c[c.Symbol=1024]="Symbol",c[c.TypedArray=2048]="TypedArray",c[c.BigIntTypedArray=4096]="BigIntTypedArray",c))(I||{});var be="hjkmoquxzABCDEFGHIJKLNPQRTUVWXYZ$_",ve=be.length,Ae="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_",ge$1=Ae.length;function se(e){let r=e%ve,n=be[r];for(e=(e-r)/ve;e>0;)r=e%ge$1,n+=Ae[r],e=(e-r)/ge$1;return n}var Le={disabledFeatures:0};function h(e={}){let r=Object.assign({},Le,e||{});return {markedRefs:new Set,refs:new Map,features:8191^r.disabledFeatures}}function V(e){return {stack:[],vars:[],assignments:[],validRefs:[],refSize:0,features:e.features,markedRefs:new Set(e.markedRefs),valueMap:new Map}}function R(e,r){e.markedRefs.add(r);}function m(e,r){let n=e.validRefs[r];n==null&&(n=e.refSize++,e.validRefs[r]=n);let t=e.vars[n];return t==null&&(t=se(n),e.vars[n]=t),t}function P(e,r){let n=e.refs.get(r);return n==null?e.refs.size:n}function z(e,r){let n=e.refs.get(r);if(n==null){let t=e.refs.size;return e.refs.set(r,t),t}return R(e,n),n}function S(e,r){if(!e)throw new Error(r)}function A$2(e){let r="",n=0;for(let t=0,a=e.length;t<a;t++){let o;switch(e[t]){case'"':o='\\"';break;case"\\":o="\\\\";break;case"<":o="\\x3C";break;case`
`:o="\\n";break;case"\r":o="\\r";break;case"\u2028":o="\\u2028";break;case"\u2029":o="\\u2029";break;default:continue}r+=e.slice(n,t)+o,n=t+1;}return n===0?r=e:r+=e.slice(n),r}var Ie={[0]:"Symbol.asyncIterator",[1]:"Symbol.hasInstance",[2]:"Symbol.isConcatSpreadable",[3]:"Symbol.iterator",[4]:"Symbol.match",[5]:"Symbol.matchAll",[6]:"Symbol.replace",[7]:"Symbol.search",[8]:"Symbol.species",[9]:"Symbol.split",[10]:"Symbol.toPrimitive",[11]:"Symbol.toStringTag",[12]:"Symbol.unscopables"},O={[Symbol.asyncIterator]:0,[Symbol.hasInstance]:1,[Symbol.isConcatSpreadable]:2,[Symbol.iterator]:3,[Symbol.match]:4,[Symbol.matchAll]:5,[Symbol.replace]:6,[Symbol.search]:7,[Symbol.species]:8,[Symbol.split]:9,[Symbol.toPrimitive]:10,[Symbol.toStringTag]:11,[Symbol.unscopables]:12};var T={t:2,i:void 0,s:!0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},U={t:2,i:void 0,s:!1,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},j={t:4,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},M={t:3,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},D={t:5,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},_={t:6,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},L={t:7,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0},x={t:8,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0};function F(e){return {t:0,i:void 0,s:e,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0}}function K(e){return {t:1,i:void 0,s:A$2(e),l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0}}function W(e,r){return S(e.features&8,'Unsupported type "BigInt"'),{t:9,i:void 0,s:""+r,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0}}function Y(e){return {t:10,i:e,s:void 0,l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0}}function Z(e,r){return {t:11,i:e,s:r.toISOString(),l:void 0,c:void 0,m:void 0,d:void 0,f:void 0,a:void 0}}function G(e,r){return {t:12,i:e,s:void 0,l:void 0,c:r.source,m:r.flags,d:void 0,a:void 0,f:void 0}}function H(e,r,n){let t=n.constructor.name;S(e.features&2048,`Unsupported value type "${t}"`);let a=n.length,o=new Array(a);for(let i=0;i<a;i++)o[i]=""+n[i];return {t:22,i:r,s:o,l:n.byteOffset,c:t,m:void 0,d:void 0,a:void 0,f:void 0}}var ke=4104;function J(e,r,n){let t=n.constructor.name;S((e.features&ke)===ke,`Unsupported value type "${t}"`);let a=n.length,o=new Array(a);for(let i=0;i<a;i++)o[i]=""+n[i];return {t:23,i:r,s:o,l:n.byteOffset,c:t,m:void 0,d:void 0,a:void 0,f:void 0}}function $(e){return {t:24,i:void 0,s:O[e],l:void 0,c:void 0,m:void 0,d:void 0,a:void 0,f:void 0}}function w(e){return e instanceof EvalError?"EvalError":e instanceof RangeError?"RangeError":e instanceof ReferenceError?"ReferenceError":e instanceof SyntaxError?"SyntaxError":e instanceof TypeError?"TypeError":e instanceof URIError?"URIError":"Error"}function C(e,r){let n,t=w(r);r.name!==t?n={name:r.name}:r.constructor.name!==t&&(n={name:r.constructor.name});let a=Object.getOwnPropertyNames(r);for(let o of a)o!=="name"&&o!=="message"&&(o==="stack"?e.features&16&&(n=n||{},n[o]=r[o]):(n=n||{},n[o]=r[o]));return n}function q(e){let r=Object.getOwnPropertyNames(e);if(r.length){let n={};for(let t of r)n[t]=e[t];return n}}function N(e){if(!e||typeof e!="object"||Array.isArray(e))return !1;switch(e.constructor){case Map:case Set:case Int8Array:case Int16Array:case Int32Array:case Uint8Array:case Uint16Array:case Uint32Array:case Uint8ClampedArray:case Float32Array:case Float64Array:case BigInt64Array:case BigUint64Array:return !1;}return Symbol.iterator in e}var xe=/^[$A-Z_][0-9A-Z_$]*$/i;function le$1(e){let r=e[0];return (r==="$"||r==="_"||r>="A"&&r<="Z"||r>="a"&&r<="z")&&xe.test(e)}function ne$1(e){switch(e.t){case"index":return e.s+"="+e.v;case"map":return e.s+".set("+e.k+","+e.v+")";case"set":return e.s+".add("+e.v+")";default:return ""}}function nr(e){let r=[],n=e[0],t=n,a;for(let o=1,i=e.length;o<i;o++){if(a=e[o],a.t===t.t)switch(a.t){case"index":a.v===t.v?n={t:"index",s:a.s,k:void 0,v:ne$1(n)}:(r.push(n),n=a);break;case"map":a.s===t.s?n={t:"map",s:ne$1(n),k:a.k,v:a.v}:(r.push(n),n=a);break;case"set":a.s===t.s?n={t:"set",s:ne$1(n),k:void 0,v:a.v}:(r.push(n),n=a);break;}else r.push(n),n=a;t=a;}return r.push(n),r}function Pe(e){if(e.length){let r="",n=nr(e);for(let t=0,a=n.length;t<a;t++)r+=ne$1(n[t])+",";return r}}function ze(e){return Pe(e.assignments)}function Be(e,r,n){e.assignments.push({t:"index",s:r,k:void 0,v:n});}function tr(e,r,n){R(e,r),e.assignments.push({t:"set",s:m(e,r),k:void 0,v:n});}function Se(e,r,n,t){R(e,r),e.assignments.push({t:"map",s:m(e,r),k:n,v:t});}function me(e,r,n,t){R(e,r),Be(e,m(e,r)+"["+n+"]",t);}function Te(e,r,n,t){R(e,r),Be(e,m(e,r)+"."+n,t);}function b(e,r,n){return e.markedRefs.has(r)?m(e,r)+"="+n:n}function k(e,r){return r.t===10&&e.stack.includes(r.i)}function ye(e,r){let n=r.l,t="",a,o=!1;for(let i=0;i<n;i++)i!==0&&(t+=","),a=r.a[i],a?k(e,a)?(me(e,r.i,i,m(e,a.i)),o=!0):(t+=y(e,a),o=!1):o=!0;return "["+t+(o?",]":"]")}function ar(e,r){e.stack.push(r.i);let n=ye(e,r);return e.stack.pop(),b(e,r.i,n)}function Ue(e,r,n){if(n.s===0)return "{}";let t="";e.stack.push(r);let a,o,i,d,s,u=!1;for(let l=0;l<n.s;l++)a=n.k[l],o=n.v[l],i=Number(a),d=i>=0||le$1(a),k(e,o)?(s=m(e,o.i),d&&Number.isNaN(i)?Te(e,r,a,s):me(e,r,d?a:'"'+A$2(a)+'"',s)):(t+=(u?",":"")+(d?a:'"'+A$2(a)+'"')+":"+y(e,o),u=!0);return e.stack.pop(),"{"+t+"}"}function or$1(e,r,n,t){let a=Ue(e,n,r);return a!=="{}"?"Object.assign("+t+","+a+")":t}function ir(e,r,n){e.stack.push(r);let t=[],a,o,i,d,s,u;for(let l=0;l<n.s;l++)a=e.stack,e.stack=[],o=y(e,n.v[l]),e.stack=a,i=n.k[l],d=Number(i),s=e.assignments,e.assignments=t,u=d>=0||le$1(i),u&&Number.isNaN(d)?Te(e,r,i,o):me(e,r,u?i:'"'+A$2(i)+'"',o),e.assignments=s;return e.stack.pop(),Pe(t)}function te(e,r,n,t){if(n)if(e.features&128)t=or$1(e,n,r,t);else {R(e,r);let a=ir(e,r,n);if(a)return "("+b(e,r,t)+","+a+m(e,r)+")"}return b(e,r,t)}function sr(e,r){return te(e,r.i,r.d,"Object.create(null)")}function lr(e,r){return b(e,r.i,Ue(e,r.i,r.d))}function dr(e,r){let n="new Set",t=r.l;if(t){let a="";e.stack.push(r.i);let o,i=!1;for(let d=0;d<t;d++)o=r.a[d],k(e,o)?tr(e,r.i,m(e,o.i)):(a+=(i?",":"")+y(e,o),i=!0);e.stack.pop(),a&&(n+="(["+a+"])");}return b(e,r.i,n)}function ur(e,r){let n="new Map";if(r.d.s){let t="";e.stack.push(r.i);let a,o,i,d,s,u=!1;for(let l=0;l<r.d.s;l++)a=r.d.k[l],o=r.d.v[l],k(e,a)?(i=m(e,a.i),k(e,o)?(d=m(e,o.i),Se(e,r.i,i,d)):(s=e.stack,e.stack=[],Se(e,r.i,i,y(e,o)),e.stack=s)):k(e,o)?(d=m(e,o.i),s=e.stack,e.stack=[],Se(e,r.i,y(e,a),d),e.stack=s):(t+=(u?",[":"[")+y(e,a)+","+y(e,o)+"]",u=!0);e.stack.pop(),t&&(n+="(["+t+"])");}return b(e,r.i,n)}function fr(e,r){e.stack.push(r.i);let n="new AggregateError("+ye(e,r)+',"'+A$2(r.m)+'")';return e.stack.pop(),te(e,r.i,r.d,n)}function cr(e,r){let n="new "+r.c+'("'+A$2(r.m)+'")';return te(e,r.i,r.d,n)}function Sr(e,r){let n;if(k(e,r.f)){let t=m(e,r.f.i);e.features&4?n="Promise.resolve().then(()=>"+t+")":n="Promise.resolve().then(function(){return "+t+"})";}else {e.stack.push(r.i);let t=y(e,r.f);e.stack.pop(),n="Promise.resolve("+t+")";}return b(e,r.i,n)}function mr(e,r){let n="",t=r.t===23;for(let o=0,i=r.s.length;o<i;o++)n+=(o!==0?",":"")+r.s[o]+(t?"n":"");let a="["+n+"]"+(r.l!==0?","+r.l:"");return b(e,r.i,"new "+r.c+"("+a+")")}function yr(e,r){let n=e.stack;e.stack=[];let t=ye(e,r);e.stack=n;let a=t;return e.features&2?a+=".values()":a+="[Symbol.iterator]()",e.features&4?a="{[Symbol.iterator]:()=>"+a+"}":e.features&64?a="{[Symbol.iterator](){return "+a+"}}":a="{[Symbol.iterator]:function(){return "+a+"}}",te(e,r.i,r.d,a)}function y(e,r){switch(r.t){case 0:return ""+r.s;case 1:return '"'+r.s+'"';case 2:return r.s?"!0":"!1";case 4:return "void 0";case 3:return "null";case 5:return "-0";case 6:return "1/0";case 7:return "-1/0";case 8:return "NaN";case 9:return r.s+"n";case 10:return m(e,r.i);case 15:return ar(e,r);case 16:return lr(e,r);case 17:return sr(e,r);case 11:return b(e,r.i,'new Date("'+r.s+'")');case 12:return b(e,r.i,"/"+r.c+"/"+r.m);case 13:return dr(e,r);case 14:return ur(e,r);case 23:case 22:return mr(e,r);case 20:return fr(e,r);case 19:return cr(e,r);case 21:return yr(e,r);case 18:return Sr(e,r);case 24:return Ie[r.s];default:throw new Error("Unsupported type")}}function Ne(e,r){let n=r.length,t=new Array(n),a=new Array(n),o;for(let i=0;i<n;i++)i in r&&(o=r[i],N(o)?a[i]=o:t[i]=g(e,o));for(let i=0;i<n;i++)i in a&&(t[i]=g(e,a[i]));return t}function Nr(e,r,n){return {t:15,i:r,s:void 0,l:n.length,c:void 0,m:void 0,d:void 0,a:Ne(e,n),f:void 0}}function pr$1(e,r,n){S(e.features&32,'Unsupported type "Map"');let t=n.size,a=new Array(t),o=new Array(t),i=new Array(t),d=new Array(t),s=0,u=0;for(let[l,f]of n.entries())N(l)||N(f)?(i[s]=l,d[s]=f,s++):(a[u]=g(e,l),o[u]=g(e,f),u++);for(let l=0;l<s;l++)a[u+l]=g(e,i[l]),o[u+l]=g(e,d[l]);return {t:14,i:r,s:void 0,l:void 0,c:void 0,m:void 0,d:{k:a,v:o,s:t},a:void 0,f:void 0}}function vr(e,r,n){S(e.features&512,'Unsupported type "Set"');let t=n.size,a=new Array(t),o=new Array(t),i=0,d=0;for(let s of n.keys())N(s)?o[i++]=s:a[d++]=g(e,s);for(let s=0;s<i;s++)a[d+s]=g(e,o[s]);return {t:13,i:r,s:void 0,l:t,c:void 0,m:void 0,d:void 0,a,f:void 0}}function oe(e,r){let n=Object.keys(r),t=n.length,a=new Array(t),o=new Array(t),i=new Array(t),d=new Array(t),s=0,u=0,l;for(let f of n)l=r[f],N(l)?(i[s]=f,d[s]=l,s++):(a[u]=f,o[u]=g(e,l),u++);for(let f=0;f<s;f++)a[u+f]=i[f],o[u+f]=g(e,d[f]);return {k:a,v:o,s:t}}function De(e,r,n){S(e.features&1024,'Unsupported type "Iterable"');let t=q(n),a=Array.from(n);return {t:21,i:r,s:void 0,l:a.length,c:void 0,m:void 0,d:t?oe(e,t):void 0,a:Ne(e,a),f:void 0}}function je(e,r,n,t){return Symbol.iterator in n?De(e,r,n):{t:t?17:16,i:r,s:void 0,l:void 0,c:void 0,m:void 0,d:oe(e,n),a:void 0,f:void 0}}function Me(e,r,n){let t=C(e,n),a=t?oe(e,t):void 0;return {t:20,i:r,s:void 0,l:n.errors.length,c:void 0,m:n.message,d:a,a:Ne(e,n.errors),f:void 0}}function ae(e,r,n){let t=C(e,n),a=t?oe(e,t):void 0;return {t:19,i:r,s:void 0,l:void 0,c:w(n),m:n.message,d:a,a:void 0,f:void 0}}function g(e,r){switch(typeof r){case"boolean":return r?T:U;case"undefined":return j;case"string":return K(r);case"number":switch(r){case 1/0:return _;case-1/0:return L;}return r!==r?x:Object.is(r,-0)?D:F(r);case"bigint":return W(e,r);case"object":{if(!r)return M;let n=z(e,r);if(e.markedRefs.has(n))return Y(n);if(Array.isArray(r))return Nr(e,n,r);switch(r.constructor){case Date:return Z(n,r);case RegExp:return G(n,r);case Int8Array:case Int16Array:case Int32Array:case Uint8Array:case Uint16Array:case Uint32Array:case Uint8ClampedArray:case Float32Array:case Float64Array:return H(e,n,r);case BigInt64Array:case BigUint64Array:return J(e,n,r);case Map:return pr$1(e,n,r);case Set:return vr(e,n,r);case Object:return je(e,n,r,!1);case void 0:return je(e,n,r,!0);case AggregateError:return e.features&1?Me(e,n,r):ae(e,n,r);case Error:case EvalError:case RangeError:case ReferenceError:case SyntaxError:case TypeError:case URIError:return ae(e,n,r);}if(r instanceof AggregateError)return e.features&1?Me(e,n,r):ae(e,n,r);if(r instanceof Error)return ae(e,n,r);if(Symbol.iterator in r)return De(e,n,r);throw new Error("Unsupported type")}case"symbol":return S(e.features&1024,'Unsupported type "symbol"'),S(r in O,"seroval only supports well-known symbols"),$(r);default:throw new Error("Unsupported type")}}function ie(e,r){let n=g(e,r),t=n.t===16||n.t===21;return [n,P(e,r),t]}function pe(e,r,n,t){if(e.vars.length){let a=ze(e),o=t;if(a){let d=m(e,r);o=t+","+a+d,t.startsWith(d+"=")||(o=d+"="+o);}let i=e.vars.length>1?e.vars.join(","):e.vars[0];return e.features&4?(i=e.vars.length>1||e.vars.length===0?"("+i+")":i,"("+i+"=>("+o+"))()"):"(function("+i+"){return "+o+"})()"}return n?"("+t+")":t}function gr(e,r){let n=h(r),[t,a,o]=ie(n,e),i=V(n),d=y(i,t);return pe(i,a,o,d)}

const booleans = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden", "indeterminate", "ismap", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless", "selected"];
const BooleanAttributes = /*#__PURE__*/new Set(booleans);
const ChildProperties = /*#__PURE__*/new Set(["innerHTML", "textContent", "innerText", "children"]);
const Aliases = /*#__PURE__*/Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});

const ES2017FLAG = I.AggregateError
| I.BigInt
| I.BigIntTypedArray;
function stringify(data) {
  return gr(data, {
    disabledFeatures: ES2017FLAG
  });
}

const VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
const REPLACE_SCRIPT = `function $df(e,n,t,o,d){if(t=document.getElementById(e),o=document.getElementById("pl-"+e)){for(;o&&8!==o.nodeType&&o.nodeValue!=="pl-"+e;)d=o.nextSibling,o.remove(),o=d;_$HY.done?o.remove():o.replaceWith(t.content)}t.remove(),_$HY.set(e,n),_$HY.fe(e)}`;
function renderToStringAsync(code, options = {}) {
  const {
    timeoutMs = 30000
  } = options;
  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject("renderToString timed out"), timeoutMs);
  });
  return Promise.race([renderToStream(code, options), timeout]).then(html => {
    clearTimeout(timeoutHandle);
    return html;
  });
}
function renderToStream(code, options = {}) {
  let {
    nonce,
    onCompleteShell,
    onCompleteAll,
    renderId
  } = options;
  let dispose;
  const blockingResources = [];
  const registry = new Map();
  const dedupe = new WeakMap();
  const checkEnd = () => {
    if (!registry.size && !completed) {
      writeTasks();
      onCompleteAll && onCompleteAll({
        write(v) {
          !completed && buffer.write(v);
        }
      });
      writable && writable.end();
      completed = true;
      setTimeout(dispose);
    }
  };
  const pushTask = task => {
    tasks += task + ";";
    if (!scheduled && firstFlushed) {
      Promise.resolve().then(writeTasks);
      scheduled = true;
    }
  };
  const writeTasks = () => {
    if (tasks.length && !completed && firstFlushed) {
      buffer.write(`<script${nonce ? ` nonce="${nonce}"` : ""}>${tasks}</script>`);
      tasks = "";
    }
    scheduled = false;
  };
  let context;
  let writable;
  let tmp = "";
  let tasks = "";
  let firstFlushed = false;
  let completed = false;
  let scriptFlushed = false;
  let scheduled = true;
  let buffer = {
    write(payload) {
      tmp += payload;
    }
  };
  sharedConfig.context = context = {
    id: renderId || "",
    count: 0,
    async: true,
    resources: {},
    lazy: {},
    suspense: {},
    assets: [],
    nonce,
    block(p) {
      if (!firstFlushed) blockingResources.push(p);
    },
    replace(id, payloadFn) {
      if (firstFlushed) return;
      const placeholder = `<!!$${id}>`;
      const first = html.indexOf(placeholder);
      if (first === -1) return;
      const last = html.indexOf(`<!!$/${id}>`, first + placeholder.length);
      html = html.replace(html.slice(first, last + placeholder.length + 1), resolveSSRNode(payloadFn()));
    },
    writeResource(id, p, error, wait) {
      const serverOnly = sharedConfig.context.noHydrate;
      if (error) return !serverOnly && pushTask(serializeSet(dedupe, id, p));
      if (!p || typeof p !== "object" || !("then" in p)) return !serverOnly && pushTask(serializeSet(dedupe, id, p));
      if (!firstFlushed) wait && blockingResources.push(p);else !serverOnly && pushTask(`_$HY.init("${id}")`);
      if (serverOnly) return;
      p.then(d => {
        !completed && pushTask(serializeSet(dedupe, id, d));
      }).catch(() => {
        !completed && pushTask(`_$HY.set("${id}", {})`);
      });
    },
    registerFragment(key) {
      if (!registry.has(key)) {
        registry.set(key, []);
        firstFlushed && pushTask(`_$HY.init("${key}")`);
      }
      return (value, error) => {
        if (registry.has(key)) {
          const keys = registry.get(key);
          registry.delete(key);
          if (waitForFragments(registry, key)) return;
          if ((value !== undefined || error) && !completed) {
            if (!firstFlushed) {
              Promise.resolve().then(() => html = replacePlaceholder(html, key, value !== undefined ? value : ""));
              error && pushTask(serializeSet(dedupe, key, error));
            } else {
              buffer.write(`<template id="${key}">${value !== undefined ? value : " "}</template>`);
              pushTask(`${keys.length ? keys.map(k => `_$HY.unset("${k}")`).join(";") + ";" : ""}$df("${key}"${error ? "," + stringify(error) : ""})${!scriptFlushed ? ";" + REPLACE_SCRIPT : ""}`);
              scriptFlushed = true;
            }
          }
        }
        if (!registry.size) Promise.resolve().then(checkEnd);
        return firstFlushed;
      };
    }
  };
  let html = createRoot(d => {
    dispose = d;
    return resolveSSRNode(escape(code()));
  });
  function doShell() {
    sharedConfig.context = context;
    context.noHydrate = true;
    html = injectAssets(context.assets, html);
    for (const key in context.resources) {
      if (!("data" in context.resources[key] || context.resources[key].ref[0].error)) pushTask(`_$HY.init("${key}")`);
    }
    for (const key of registry.keys()) pushTask(`_$HY.init("${key}")`);
    if (tasks.length) html = injectScripts(html, tasks, nonce);
    buffer.write(html);
    tasks = "";
    scheduled = false;
    onCompleteShell && onCompleteShell({
      write(v) {
        !completed && buffer.write(v);
      }
    });
  }
  return {
    then(fn) {
      function complete() {
        doShell();
        fn(tmp);
      }
      if (onCompleteAll) {
        ogComplete = onCompleteAll;
        onCompleteAll = options => {
          ogComplete(options);
          complete();
        };
      } else onCompleteAll = complete;
      if (!registry.size) Promise.resolve().then(checkEnd);
    },
    pipe(w) {
      Promise.allSettled(blockingResources).then(() => {
        doShell();
        buffer = writable = w;
        buffer.write(tmp);
        firstFlushed = true;
        if (completed) writable.end();else setTimeout(checkEnd);
      });
    },
    pipeTo(w) {
      Promise.allSettled(blockingResources).then(() => {
        doShell();
        const encoder = new TextEncoder();
        const writer = w.getWriter();
        writable = {
          end() {
            writer.releaseLock();
            w.close();
          }
        };
        buffer = {
          write(payload) {
            writer.write(encoder.encode(payload));
          }
        };
        buffer.write(tmp);
        firstFlushed = true;
        if (completed) writable.end();else setTimeout(checkEnd);
      });
    }
  };
}
function HydrationScript(props) {
  const {
    nonce
  } = sharedConfig.context;
  return ssr(generateHydrationScript({
    nonce,
    ...props
  }));
}
function ssr(t, ...nodes) {
  if (nodes.length) {
    let result = "";
    for (let i = 0; i < nodes.length; i++) {
      result += t[i];
      const node = nodes[i];
      if (node !== undefined) result += resolveSSRNode(node);
    }
    t = result + t[nodes.length];
  }
  return {
    t
  };
}
function ssrClassList(value) {
  if (!value) return "";
  let classKeys = Object.keys(value),
    result = "";
  for (let i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key];
    if (!key || key === "undefined" || !classValue) continue;
    i && (result += " ");
    result += escape(key);
  }
  return result;
}
function ssrStyle(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  let result = "";
  const k = Object.keys(value);
  for (let i = 0; i < k.length; i++) {
    const s = k[i];
    const v = value[s];
    if (v != undefined) {
      if (i) result += ";";
      result += `${s}:${escape(v, true)}`;
    }
  }
  return result;
}
function ssrElement(tag, props, children, needsId) {
  let result = `<${tag}${needsId ? ssrHydrationKey() : ""} `;
  const skipChildren = VOID_ELEMENTS.test(tag);
  if (props == null) props = {};else if (typeof props === "function") props = props();
  const keys = Object.keys(props);
  let classResolved;
  for (let i = 0; i < keys.length; i++) {
    const prop = keys[i];
    if (ChildProperties.has(prop)) {
      if (children === undefined && !skipChildren) children = prop === "innerHTML" ? props[prop] : escape(props[prop]);
      continue;
    }
    const value = props[prop];
    if (prop === "style") {
      result += `style="${ssrStyle(value)}"`;
    } else if (prop === "class" || prop === "className" || prop === "classList") {
      if (classResolved) continue;
      let n;
      result += `class="${escape(((n = props.class) ? n + " " : "") + ((n = props.className) ? n + " " : ""), true) + ssrClassList(props.classList)}"`;
      classResolved = true;
    } else if (BooleanAttributes.has(prop)) {
      if (value) result += prop;else continue;
    } else if (value == undefined || prop === "ref" || prop.slice(0, 2) === "on") {
      continue;
    } else {
      result += `${Aliases[prop] || prop}="${escape(value, true)}"`;
    }
    if (i !== keys.length - 1) result += " ";
  }
  if (skipChildren) {
    return {
      t: result + "/>"
    };
  }
  return {
    t: result + `>${resolveSSRNode(children)}</${tag}>`
  };
}
function ssrAttribute(key, value, isBoolean) {
  return isBoolean ? value ? " " + key : "" : value != null ? ` ${key}="${value}"` : "";
}
function ssrHydrationKey() {
  const hk = getHydrationKey();
  return hk ? ` data-hk="${hk}"` : "";
}
function escape(s, attr) {
  const t = typeof s;
  if (t !== "string") {
    if (!attr && t === "function") return escape(s());
    if (!attr && Array.isArray(s)) {
      for (let i = 0; i < s.length; i++) s[i] = escape(s[i]);
      return s;
    }
    if (attr && t === "boolean") return String(s);
    return s;
  }
  const delim = attr ? '"' : "<";
  const escDelim = attr ? "&quot;" : "&lt;";
  let iDelim = s.indexOf(delim);
  let iAmp = s.indexOf("&");
  if (iDelim < 0 && iAmp < 0) return s;
  let left = 0,
    out = "";
  while (iDelim >= 0 && iAmp >= 0) {
    if (iDelim < iAmp) {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } else {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += "&amp;";
      left = iAmp + 1;
      iAmp = s.indexOf("&", left);
    }
  }
  if (iDelim >= 0) {
    do {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } while (iDelim >= 0);
  } else while (iAmp >= 0) {
    if (left < iAmp) out += s.substring(left, iAmp);
    out += "&amp;";
    left = iAmp + 1;
    iAmp = s.indexOf("&", left);
  }
  return left < s.length ? out + s.substring(left) : out;
}
function resolveSSRNode(node) {
  const t = typeof node;
  if (t === "string") return node;
  if (node == null || t === "boolean") return "";
  if (Array.isArray(node)) {
    let prev = {};
    let mapped = "";
    for (let i = 0, len = node.length; i < len; i++) {
      if (typeof prev !== "object" && typeof node[i] !== "object") mapped += `<!--!$-->`;
      mapped += resolveSSRNode(prev = node[i]);
    }
    return mapped;
  }
  if (t === "object") return node.t;
  if (t === "function") return resolveSSRNode(node());
  return String(node);
}
function getHydrationKey() {
  const hydrate = sharedConfig.context;
  return hydrate && !hydrate.noHydrate && `${hydrate.id}${hydrate.count++}`;
}
function useAssets(fn) {
  sharedConfig.context.assets.push(() => resolveSSRNode(fn()));
}
function generateHydrationScript({
  eventNames = ["click", "input"],
  nonce
} = {}) {
  return `<script${nonce ? ` nonce="${nonce}"` : ""}>(e=>{let t=e=>e&&e.hasAttribute&&(e.hasAttribute("data-hk")?e:t(e.host&&e.host instanceof Node?e.host:e.parentNode));["${eventNames.join('", "')}"].forEach((o=>document.addEventListener(o,(o=>{let s=o.composedPath&&o.composedPath()[0]||o.target,a=t(s);a&&!e.completed.has(a)&&e.events.push([a,o])}))))})(window._$HY||(_$HY={events:[],completed:new WeakSet,r:{},fe(){},init(e,t){_$HY.r[e]=[new Promise((e=>t=e)),t]},set(e,t,o){(o=_$HY.r[e])&&o[1](t),_$HY.r[e]=[t]},unset(e){delete _$HY.r[e]},load:e=>_$HY.r[e]}));</script><!--xs-->`;
}
function NoHydration(props) {
  sharedConfig.context.noHydrate = true;
  return props.children;
}
function injectAssets(assets, html) {
  if (!assets || !assets.length) return html;
  let out = "";
  for (let i = 0, len = assets.length; i < len; i++) out += assets[i]();
  return html.replace(`</head>`, out + `</head>`);
}
function injectScripts(html, scripts, nonce) {
  const tag = `<script${nonce ? ` nonce="${nonce}"` : ""}>${scripts}</script>`;
  const index = html.indexOf("<!--xs-->");
  if (index > -1) {
    return html.slice(0, index) + tag + html.slice(index);
  }
  return html + tag;
}
function waitForFragments(registry, key) {
  for (const k of [...registry.keys()].reverse()) {
    if (key.startsWith(k)) {
      registry.get(k).push(key);
      return true;
    }
  }
  return false;
}
function serializeSet(registry, key, value) {
  const exist = registry.get(value);
  if (exist) return `_$HY.set("${key}", _$HY.r["${exist}"][0])`;
  value !== null && typeof value === "object" && registry.set(value, key);
  return `_$HY.set("${key}", ${stringify(value)})`;
}
function replacePlaceholder(html, key, value) {
  const marker = `<template id="pl-${key}">`;
  const close = `<!pl-${key}>`;
  const first = html.indexOf(marker);
  if (first === -1) return html;
  const last = html.indexOf(close, first + marker.length);
  return html.slice(0, first) + value + html.slice(last + close.length);
}

const isServer = true;
function Dynamic(props) {
  const [p, others] = splitProps(props, ["component"]);
  const comp = p.component,
    t = typeof comp;
  if (comp) {
    if (t === "function") return comp(others);else if (t === "string") {
      return ssrElement(comp, others, undefined, true);
    }
  }
}

var markdownItExports$1 = {};
var markdownIt = {
  get exports(){ return markdownItExports$1; },
  set exports(v){ markdownItExports$1 = v; },
};

var utils = {};

var entitiesExports = {};
var entities = {
  get exports(){ return entitiesExports; },
  set exports(v){ entitiesExports = v; },
};

var Aacute = "Á";
var aacute = "á";
var Abreve = "Ă";
var abreve = "ă";
var ac = "∾";
var acd = "∿";
var acE = "∾̳";
var Acirc = "Â";
var acirc = "â";
var acute = "´";
var Acy = "А";
var acy = "а";
var AElig = "Æ";
var aelig = "æ";
var af = "⁡";
var Afr = "𝔄";
var afr = "𝔞";
var Agrave = "À";
var agrave = "à";
var alefsym = "ℵ";
var aleph = "ℵ";
var Alpha = "Α";
var alpha = "α";
var Amacr = "Ā";
var amacr = "ā";
var amalg = "⨿";
var amp = "&";
var AMP = "&";
var andand = "⩕";
var And = "⩓";
var and = "∧";
var andd = "⩜";
var andslope = "⩘";
var andv = "⩚";
var ang = "∠";
var ange = "⦤";
var angle = "∠";
var angmsdaa = "⦨";
var angmsdab = "⦩";
var angmsdac = "⦪";
var angmsdad = "⦫";
var angmsdae = "⦬";
var angmsdaf = "⦭";
var angmsdag = "⦮";
var angmsdah = "⦯";
var angmsd = "∡";
var angrt = "∟";
var angrtvb = "⊾";
var angrtvbd = "⦝";
var angsph = "∢";
var angst = "Å";
var angzarr = "⍼";
var Aogon = "Ą";
var aogon = "ą";
var Aopf = "𝔸";
var aopf = "𝕒";
var apacir = "⩯";
var ap = "≈";
var apE = "⩰";
var ape = "≊";
var apid = "≋";
var apos = "'";
var ApplyFunction = "⁡";
var approx = "≈";
var approxeq = "≊";
var Aring = "Å";
var aring = "å";
var Ascr = "𝒜";
var ascr = "𝒶";
var Assign = "≔";
var ast = "*";
var asymp = "≈";
var asympeq = "≍";
var Atilde = "Ã";
var atilde = "ã";
var Auml = "Ä";
var auml = "ä";
var awconint = "∳";
var awint = "⨑";
var backcong = "≌";
var backepsilon = "϶";
var backprime = "‵";
var backsim = "∽";
var backsimeq = "⋍";
var Backslash = "∖";
var Barv = "⫧";
var barvee = "⊽";
var barwed = "⌅";
var Barwed = "⌆";
var barwedge = "⌅";
var bbrk = "⎵";
var bbrktbrk = "⎶";
var bcong = "≌";
var Bcy = "Б";
var bcy = "б";
var bdquo = "„";
var becaus = "∵";
var because = "∵";
var Because = "∵";
var bemptyv = "⦰";
var bepsi = "϶";
var bernou = "ℬ";
var Bernoullis = "ℬ";
var Beta = "Β";
var beta = "β";
var beth = "ℶ";
var between = "≬";
var Bfr = "𝔅";
var bfr = "𝔟";
var bigcap = "⋂";
var bigcirc = "◯";
var bigcup = "⋃";
var bigodot = "⨀";
var bigoplus = "⨁";
var bigotimes = "⨂";
var bigsqcup = "⨆";
var bigstar = "★";
var bigtriangledown = "▽";
var bigtriangleup = "△";
var biguplus = "⨄";
var bigvee = "⋁";
var bigwedge = "⋀";
var bkarow = "⤍";
var blacklozenge = "⧫";
var blacksquare = "▪";
var blacktriangle = "▴";
var blacktriangledown = "▾";
var blacktriangleleft = "◂";
var blacktriangleright = "▸";
var blank = "␣";
var blk12 = "▒";
var blk14 = "░";
var blk34 = "▓";
var block$1 = "█";
var bne = "=⃥";
var bnequiv = "≡⃥";
var bNot = "⫭";
var bnot = "⌐";
var Bopf = "𝔹";
var bopf = "𝕓";
var bot = "⊥";
var bottom = "⊥";
var bowtie = "⋈";
var boxbox = "⧉";
var boxdl = "┐";
var boxdL = "╕";
var boxDl = "╖";
var boxDL = "╗";
var boxdr = "┌";
var boxdR = "╒";
var boxDr = "╓";
var boxDR = "╔";
var boxh = "─";
var boxH = "═";
var boxhd = "┬";
var boxHd = "╤";
var boxhD = "╥";
var boxHD = "╦";
var boxhu = "┴";
var boxHu = "╧";
var boxhU = "╨";
var boxHU = "╩";
var boxminus = "⊟";
var boxplus = "⊞";
var boxtimes = "⊠";
var boxul = "┘";
var boxuL = "╛";
var boxUl = "╜";
var boxUL = "╝";
var boxur = "└";
var boxuR = "╘";
var boxUr = "╙";
var boxUR = "╚";
var boxv = "│";
var boxV = "║";
var boxvh = "┼";
var boxvH = "╪";
var boxVh = "╫";
var boxVH = "╬";
var boxvl = "┤";
var boxvL = "╡";
var boxVl = "╢";
var boxVL = "╣";
var boxvr = "├";
var boxvR = "╞";
var boxVr = "╟";
var boxVR = "╠";
var bprime = "‵";
var breve = "˘";
var Breve = "˘";
var brvbar = "¦";
var bscr = "𝒷";
var Bscr = "ℬ";
var bsemi = "⁏";
var bsim = "∽";
var bsime = "⋍";
var bsolb = "⧅";
var bsol = "\\";
var bsolhsub = "⟈";
var bull = "•";
var bullet = "•";
var bump = "≎";
var bumpE = "⪮";
var bumpe = "≏";
var Bumpeq = "≎";
var bumpeq = "≏";
var Cacute = "Ć";
var cacute = "ć";
var capand = "⩄";
var capbrcup = "⩉";
var capcap = "⩋";
var cap = "∩";
var Cap = "⋒";
var capcup = "⩇";
var capdot = "⩀";
var CapitalDifferentialD = "ⅅ";
var caps = "∩︀";
var caret = "⁁";
var caron = "ˇ";
var Cayleys = "ℭ";
var ccaps = "⩍";
var Ccaron = "Č";
var ccaron = "č";
var Ccedil = "Ç";
var ccedil = "ç";
var Ccirc = "Ĉ";
var ccirc = "ĉ";
var Cconint = "∰";
var ccups = "⩌";
var ccupssm = "⩐";
var Cdot = "Ċ";
var cdot = "ċ";
var cedil = "¸";
var Cedilla = "¸";
var cemptyv = "⦲";
var cent = "¢";
var centerdot = "·";
var CenterDot = "·";
var cfr = "𝔠";
var Cfr = "ℭ";
var CHcy = "Ч";
var chcy = "ч";
var check = "✓";
var checkmark = "✓";
var Chi = "Χ";
var chi = "χ";
var circ = "ˆ";
var circeq = "≗";
var circlearrowleft = "↺";
var circlearrowright = "↻";
var circledast = "⊛";
var circledcirc = "⊚";
var circleddash = "⊝";
var CircleDot = "⊙";
var circledR = "®";
var circledS = "Ⓢ";
var CircleMinus = "⊖";
var CirclePlus = "⊕";
var CircleTimes = "⊗";
var cir = "○";
var cirE = "⧃";
var cire = "≗";
var cirfnint = "⨐";
var cirmid = "⫯";
var cirscir = "⧂";
var ClockwiseContourIntegral = "∲";
var CloseCurlyDoubleQuote = "”";
var CloseCurlyQuote = "’";
var clubs = "♣";
var clubsuit = "♣";
var colon = ":";
var Colon = "∷";
var Colone = "⩴";
var colone = "≔";
var coloneq = "≔";
var comma = ",";
var commat = "@";
var comp = "∁";
var compfn = "∘";
var complement = "∁";
var complexes = "ℂ";
var cong = "≅";
var congdot = "⩭";
var Congruent = "≡";
var conint = "∮";
var Conint = "∯";
var ContourIntegral = "∮";
var copf = "𝕔";
var Copf = "ℂ";
var coprod = "∐";
var Coproduct = "∐";
var copy = "©";
var COPY = "©";
var copysr = "℗";
var CounterClockwiseContourIntegral = "∳";
var crarr = "↵";
var cross = "✗";
var Cross = "⨯";
var Cscr = "𝒞";
var cscr = "𝒸";
var csub = "⫏";
var csube = "⫑";
var csup = "⫐";
var csupe = "⫒";
var ctdot = "⋯";
var cudarrl = "⤸";
var cudarrr = "⤵";
var cuepr = "⋞";
var cuesc = "⋟";
var cularr = "↶";
var cularrp = "⤽";
var cupbrcap = "⩈";
var cupcap = "⩆";
var CupCap = "≍";
var cup = "∪";
var Cup = "⋓";
var cupcup = "⩊";
var cupdot = "⊍";
var cupor = "⩅";
var cups = "∪︀";
var curarr = "↷";
var curarrm = "⤼";
var curlyeqprec = "⋞";
var curlyeqsucc = "⋟";
var curlyvee = "⋎";
var curlywedge = "⋏";
var curren = "¤";
var curvearrowleft = "↶";
var curvearrowright = "↷";
var cuvee = "⋎";
var cuwed = "⋏";
var cwconint = "∲";
var cwint = "∱";
var cylcty = "⌭";
var dagger = "†";
var Dagger = "‡";
var daleth = "ℸ";
var darr = "↓";
var Darr = "↡";
var dArr = "⇓";
var dash = "‐";
var Dashv = "⫤";
var dashv = "⊣";
var dbkarow = "⤏";
var dblac = "˝";
var Dcaron = "Ď";
var dcaron = "ď";
var Dcy = "Д";
var dcy = "д";
var ddagger = "‡";
var ddarr = "⇊";
var DD = "ⅅ";
var dd = "ⅆ";
var DDotrahd = "⤑";
var ddotseq = "⩷";
var deg = "°";
var Del = "∇";
var Delta = "Δ";
var delta = "δ";
var demptyv = "⦱";
var dfisht = "⥿";
var Dfr = "𝔇";
var dfr = "𝔡";
var dHar = "⥥";
var dharl = "⇃";
var dharr = "⇂";
var DiacriticalAcute = "´";
var DiacriticalDot = "˙";
var DiacriticalDoubleAcute = "˝";
var DiacriticalGrave = "`";
var DiacriticalTilde = "˜";
var diam = "⋄";
var diamond = "⋄";
var Diamond = "⋄";
var diamondsuit = "♦";
var diams = "♦";
var die = "¨";
var DifferentialD = "ⅆ";
var digamma = "ϝ";
var disin = "⋲";
var div = "÷";
var divide = "÷";
var divideontimes = "⋇";
var divonx = "⋇";
var DJcy = "Ђ";
var djcy = "ђ";
var dlcorn = "⌞";
var dlcrop = "⌍";
var dollar = "$";
var Dopf = "𝔻";
var dopf = "𝕕";
var Dot = "¨";
var dot = "˙";
var DotDot = "⃜";
var doteq = "≐";
var doteqdot = "≑";
var DotEqual = "≐";
var dotminus = "∸";
var dotplus = "∔";
var dotsquare = "⊡";
var doublebarwedge = "⌆";
var DoubleContourIntegral = "∯";
var DoubleDot = "¨";
var DoubleDownArrow = "⇓";
var DoubleLeftArrow = "⇐";
var DoubleLeftRightArrow = "⇔";
var DoubleLeftTee = "⫤";
var DoubleLongLeftArrow = "⟸";
var DoubleLongLeftRightArrow = "⟺";
var DoubleLongRightArrow = "⟹";
var DoubleRightArrow = "⇒";
var DoubleRightTee = "⊨";
var DoubleUpArrow = "⇑";
var DoubleUpDownArrow = "⇕";
var DoubleVerticalBar = "∥";
var DownArrowBar = "⤓";
var downarrow = "↓";
var DownArrow = "↓";
var Downarrow = "⇓";
var DownArrowUpArrow = "⇵";
var DownBreve = "̑";
var downdownarrows = "⇊";
var downharpoonleft = "⇃";
var downharpoonright = "⇂";
var DownLeftRightVector = "⥐";
var DownLeftTeeVector = "⥞";
var DownLeftVectorBar = "⥖";
var DownLeftVector = "↽";
var DownRightTeeVector = "⥟";
var DownRightVectorBar = "⥗";
var DownRightVector = "⇁";
var DownTeeArrow = "↧";
var DownTee = "⊤";
var drbkarow = "⤐";
var drcorn = "⌟";
var drcrop = "⌌";
var Dscr = "𝒟";
var dscr = "𝒹";
var DScy = "Ѕ";
var dscy = "ѕ";
var dsol = "⧶";
var Dstrok = "Đ";
var dstrok = "đ";
var dtdot = "⋱";
var dtri = "▿";
var dtrif = "▾";
var duarr = "⇵";
var duhar = "⥯";
var dwangle = "⦦";
var DZcy = "Џ";
var dzcy = "џ";
var dzigrarr = "⟿";
var Eacute = "É";
var eacute = "é";
var easter = "⩮";
var Ecaron = "Ě";
var ecaron = "ě";
var Ecirc = "Ê";
var ecirc = "ê";
var ecir = "≖";
var ecolon = "≕";
var Ecy = "Э";
var ecy = "э";
var eDDot = "⩷";
var Edot = "Ė";
var edot = "ė";
var eDot = "≑";
var ee = "ⅇ";
var efDot = "≒";
var Efr = "𝔈";
var efr = "𝔢";
var eg = "⪚";
var Egrave = "È";
var egrave = "è";
var egs = "⪖";
var egsdot = "⪘";
var el = "⪙";
var Element$1 = "∈";
var elinters = "⏧";
var ell = "ℓ";
var els = "⪕";
var elsdot = "⪗";
var Emacr = "Ē";
var emacr = "ē";
var empty = "∅";
var emptyset = "∅";
var EmptySmallSquare = "◻";
var emptyv = "∅";
var EmptyVerySmallSquare = "▫";
var emsp13 = " ";
var emsp14 = " ";
var emsp = " ";
var ENG = "Ŋ";
var eng = "ŋ";
var ensp = " ";
var Eogon = "Ę";
var eogon = "ę";
var Eopf = "𝔼";
var eopf = "𝕖";
var epar = "⋕";
var eparsl = "⧣";
var eplus = "⩱";
var epsi = "ε";
var Epsilon = "Ε";
var epsilon = "ε";
var epsiv = "ϵ";
var eqcirc = "≖";
var eqcolon = "≕";
var eqsim = "≂";
var eqslantgtr = "⪖";
var eqslantless = "⪕";
var Equal = "⩵";
var equals = "=";
var EqualTilde = "≂";
var equest = "≟";
var Equilibrium = "⇌";
var equiv = "≡";
var equivDD = "⩸";
var eqvparsl = "⧥";
var erarr = "⥱";
var erDot = "≓";
var escr = "ℯ";
var Escr = "ℰ";
var esdot = "≐";
var Esim = "⩳";
var esim = "≂";
var Eta = "Η";
var eta = "η";
var ETH = "Ð";
var eth = "ð";
var Euml = "Ë";
var euml = "ë";
var euro = "€";
var excl = "!";
var exist = "∃";
var Exists = "∃";
var expectation = "ℰ";
var exponentiale = "ⅇ";
var ExponentialE = "ⅇ";
var fallingdotseq = "≒";
var Fcy = "Ф";
var fcy = "ф";
var female = "♀";
var ffilig = "ﬃ";
var fflig = "ﬀ";
var ffllig = "ﬄ";
var Ffr = "𝔉";
var ffr = "𝔣";
var filig = "ﬁ";
var FilledSmallSquare = "◼";
var FilledVerySmallSquare = "▪";
var fjlig = "fj";
var flat = "♭";
var fllig = "ﬂ";
var fltns = "▱";
var fnof = "ƒ";
var Fopf = "𝔽";
var fopf = "𝕗";
var forall = "∀";
var ForAll = "∀";
var fork = "⋔";
var forkv = "⫙";
var Fouriertrf = "ℱ";
var fpartint = "⨍";
var frac12 = "½";
var frac13 = "⅓";
var frac14 = "¼";
var frac15 = "⅕";
var frac16 = "⅙";
var frac18 = "⅛";
var frac23 = "⅔";
var frac25 = "⅖";
var frac34 = "¾";
var frac35 = "⅗";
var frac38 = "⅜";
var frac45 = "⅘";
var frac56 = "⅚";
var frac58 = "⅝";
var frac78 = "⅞";
var frasl = "⁄";
var frown = "⌢";
var fscr = "𝒻";
var Fscr = "ℱ";
var gacute = "ǵ";
var Gamma = "Γ";
var gamma = "γ";
var Gammad = "Ϝ";
var gammad = "ϝ";
var gap = "⪆";
var Gbreve = "Ğ";
var gbreve = "ğ";
var Gcedil = "Ģ";
var Gcirc = "Ĝ";
var gcirc = "ĝ";
var Gcy = "Г";
var gcy = "г";
var Gdot = "Ġ";
var gdot = "ġ";
var ge = "≥";
var gE = "≧";
var gEl = "⪌";
var gel = "⋛";
var geq = "≥";
var geqq = "≧";
var geqslant = "⩾";
var gescc = "⪩";
var ges = "⩾";
var gesdot = "⪀";
var gesdoto = "⪂";
var gesdotol = "⪄";
var gesl = "⋛︀";
var gesles = "⪔";
var Gfr = "𝔊";
var gfr = "𝔤";
var gg = "≫";
var Gg = "⋙";
var ggg = "⋙";
var gimel = "ℷ";
var GJcy = "Ѓ";
var gjcy = "ѓ";
var gla = "⪥";
var gl = "≷";
var glE = "⪒";
var glj = "⪤";
var gnap = "⪊";
var gnapprox = "⪊";
var gne = "⪈";
var gnE = "≩";
var gneq = "⪈";
var gneqq = "≩";
var gnsim = "⋧";
var Gopf = "𝔾";
var gopf = "𝕘";
var grave = "`";
var GreaterEqual = "≥";
var GreaterEqualLess = "⋛";
var GreaterFullEqual = "≧";
var GreaterGreater = "⪢";
var GreaterLess = "≷";
var GreaterSlantEqual = "⩾";
var GreaterTilde = "≳";
var Gscr = "𝒢";
var gscr = "ℊ";
var gsim = "≳";
var gsime = "⪎";
var gsiml = "⪐";
var gtcc = "⪧";
var gtcir = "⩺";
var gt$1 = ">";
var GT = ">";
var Gt = "≫";
var gtdot = "⋗";
var gtlPar = "⦕";
var gtquest = "⩼";
var gtrapprox = "⪆";
var gtrarr = "⥸";
var gtrdot = "⋗";
var gtreqless = "⋛";
var gtreqqless = "⪌";
var gtrless = "≷";
var gtrsim = "≳";
var gvertneqq = "≩︀";
var gvnE = "≩︀";
var Hacek = "ˇ";
var hairsp = " ";
var half = "½";
var hamilt = "ℋ";
var HARDcy = "Ъ";
var hardcy = "ъ";
var harrcir = "⥈";
var harr = "↔";
var hArr = "⇔";
var harrw = "↭";
var Hat = "^";
var hbar = "ℏ";
var Hcirc = "Ĥ";
var hcirc = "ĥ";
var hearts = "♥";
var heartsuit = "♥";
var hellip = "…";
var hercon = "⊹";
var hfr = "𝔥";
var Hfr = "ℌ";
var HilbertSpace = "ℋ";
var hksearow = "⤥";
var hkswarow = "⤦";
var hoarr = "⇿";
var homtht = "∻";
var hookleftarrow = "↩";
var hookrightarrow = "↪";
var hopf = "𝕙";
var Hopf = "ℍ";
var horbar = "―";
var HorizontalLine = "─";
var hscr = "𝒽";
var Hscr = "ℋ";
var hslash = "ℏ";
var Hstrok = "Ħ";
var hstrok = "ħ";
var HumpDownHump = "≎";
var HumpEqual = "≏";
var hybull = "⁃";
var hyphen = "‐";
var Iacute = "Í";
var iacute = "í";
var ic = "⁣";
var Icirc = "Î";
var icirc = "î";
var Icy = "И";
var icy = "и";
var Idot = "İ";
var IEcy = "Е";
var iecy = "е";
var iexcl = "¡";
var iff = "⇔";
var ifr = "𝔦";
var Ifr = "ℑ";
var Igrave = "Ì";
var igrave = "ì";
var ii = "ⅈ";
var iiiint = "⨌";
var iiint = "∭";
var iinfin = "⧜";
var iiota = "℩";
var IJlig = "Ĳ";
var ijlig = "ĳ";
var Imacr = "Ī";
var imacr = "ī";
var image$3 = "ℑ";
var ImaginaryI = "ⅈ";
var imagline = "ℐ";
var imagpart = "ℑ";
var imath = "ı";
var Im = "ℑ";
var imof = "⊷";
var imped = "Ƶ";
var Implies = "⇒";
var incare = "℅";
var infin = "∞";
var infintie = "⧝";
var inodot = "ı";
var intcal = "⊺";
var int = "∫";
var Int = "∬";
var integers = "ℤ";
var Integral = "∫";
var intercal = "⊺";
var Intersection = "⋂";
var intlarhk = "⨗";
var intprod = "⨼";
var InvisibleComma = "⁣";
var InvisibleTimes = "⁢";
var IOcy = "Ё";
var iocy = "ё";
var Iogon = "Į";
var iogon = "į";
var Iopf = "𝕀";
var iopf = "𝕚";
var Iota = "Ι";
var iota = "ι";
var iprod = "⨼";
var iquest = "¿";
var iscr = "𝒾";
var Iscr = "ℐ";
var isin = "∈";
var isindot = "⋵";
var isinE = "⋹";
var isins = "⋴";
var isinsv = "⋳";
var isinv = "∈";
var it = "⁢";
var Itilde = "Ĩ";
var itilde = "ĩ";
var Iukcy = "І";
var iukcy = "і";
var Iuml = "Ï";
var iuml = "ï";
var Jcirc = "Ĵ";
var jcirc = "ĵ";
var Jcy = "Й";
var jcy = "й";
var Jfr = "𝔍";
var jfr = "𝔧";
var jmath = "ȷ";
var Jopf = "𝕁";
var jopf = "𝕛";
var Jscr = "𝒥";
var jscr = "𝒿";
var Jsercy = "Ј";
var jsercy = "ј";
var Jukcy = "Є";
var jukcy = "є";
var Kappa = "Κ";
var kappa = "κ";
var kappav = "ϰ";
var Kcedil = "Ķ";
var kcedil = "ķ";
var Kcy = "К";
var kcy = "к";
var Kfr = "𝔎";
var kfr = "𝔨";
var kgreen = "ĸ";
var KHcy = "Х";
var khcy = "х";
var KJcy = "Ќ";
var kjcy = "ќ";
var Kopf = "𝕂";
var kopf = "𝕜";
var Kscr = "𝒦";
var kscr = "𝓀";
var lAarr = "⇚";
var Lacute = "Ĺ";
var lacute = "ĺ";
var laemptyv = "⦴";
var lagran = "ℒ";
var Lambda = "Λ";
var lambda = "λ";
var lang = "⟨";
var Lang = "⟪";
var langd = "⦑";
var langle = "⟨";
var lap = "⪅";
var Laplacetrf = "ℒ";
var laquo = "«";
var larrb = "⇤";
var larrbfs = "⤟";
var larr = "←";
var Larr = "↞";
var lArr = "⇐";
var larrfs = "⤝";
var larrhk = "↩";
var larrlp = "↫";
var larrpl = "⤹";
var larrsim = "⥳";
var larrtl = "↢";
var latail = "⤙";
var lAtail = "⤛";
var lat = "⪫";
var late = "⪭";
var lates = "⪭︀";
var lbarr = "⤌";
var lBarr = "⤎";
var lbbrk = "❲";
var lbrace = "{";
var lbrack = "[";
var lbrke = "⦋";
var lbrksld = "⦏";
var lbrkslu = "⦍";
var Lcaron = "Ľ";
var lcaron = "ľ";
var Lcedil = "Ļ";
var lcedil = "ļ";
var lceil = "⌈";
var lcub = "{";
var Lcy = "Л";
var lcy = "л";
var ldca = "⤶";
var ldquo = "“";
var ldquor = "„";
var ldrdhar = "⥧";
var ldrushar = "⥋";
var ldsh = "↲";
var le = "≤";
var lE = "≦";
var LeftAngleBracket = "⟨";
var LeftArrowBar = "⇤";
var leftarrow = "←";
var LeftArrow = "←";
var Leftarrow = "⇐";
var LeftArrowRightArrow = "⇆";
var leftarrowtail = "↢";
var LeftCeiling = "⌈";
var LeftDoubleBracket = "⟦";
var LeftDownTeeVector = "⥡";
var LeftDownVectorBar = "⥙";
var LeftDownVector = "⇃";
var LeftFloor = "⌊";
var leftharpoondown = "↽";
var leftharpoonup = "↼";
var leftleftarrows = "⇇";
var leftrightarrow = "↔";
var LeftRightArrow = "↔";
var Leftrightarrow = "⇔";
var leftrightarrows = "⇆";
var leftrightharpoons = "⇋";
var leftrightsquigarrow = "↭";
var LeftRightVector = "⥎";
var LeftTeeArrow = "↤";
var LeftTee = "⊣";
var LeftTeeVector = "⥚";
var leftthreetimes = "⋋";
var LeftTriangleBar = "⧏";
var LeftTriangle = "⊲";
var LeftTriangleEqual = "⊴";
var LeftUpDownVector = "⥑";
var LeftUpTeeVector = "⥠";
var LeftUpVectorBar = "⥘";
var LeftUpVector = "↿";
var LeftVectorBar = "⥒";
var LeftVector = "↼";
var lEg = "⪋";
var leg = "⋚";
var leq = "≤";
var leqq = "≦";
var leqslant = "⩽";
var lescc = "⪨";
var les = "⩽";
var lesdot = "⩿";
var lesdoto = "⪁";
var lesdotor = "⪃";
var lesg = "⋚︀";
var lesges = "⪓";
var lessapprox = "⪅";
var lessdot = "⋖";
var lesseqgtr = "⋚";
var lesseqqgtr = "⪋";
var LessEqualGreater = "⋚";
var LessFullEqual = "≦";
var LessGreater = "≶";
var lessgtr = "≶";
var LessLess = "⪡";
var lesssim = "≲";
var LessSlantEqual = "⩽";
var LessTilde = "≲";
var lfisht = "⥼";
var lfloor = "⌊";
var Lfr = "𝔏";
var lfr = "𝔩";
var lg = "≶";
var lgE = "⪑";
var lHar = "⥢";
var lhard = "↽";
var lharu = "↼";
var lharul = "⥪";
var lhblk = "▄";
var LJcy = "Љ";
var ljcy = "љ";
var llarr = "⇇";
var ll = "≪";
var Ll = "⋘";
var llcorner = "⌞";
var Lleftarrow = "⇚";
var llhard = "⥫";
var lltri = "◺";
var Lmidot = "Ŀ";
var lmidot = "ŀ";
var lmoustache = "⎰";
var lmoust = "⎰";
var lnap = "⪉";
var lnapprox = "⪉";
var lne = "⪇";
var lnE = "≨";
var lneq = "⪇";
var lneqq = "≨";
var lnsim = "⋦";
var loang = "⟬";
var loarr = "⇽";
var lobrk = "⟦";
var longleftarrow = "⟵";
var LongLeftArrow = "⟵";
var Longleftarrow = "⟸";
var longleftrightarrow = "⟷";
var LongLeftRightArrow = "⟷";
var Longleftrightarrow = "⟺";
var longmapsto = "⟼";
var longrightarrow = "⟶";
var LongRightArrow = "⟶";
var Longrightarrow = "⟹";
var looparrowleft = "↫";
var looparrowright = "↬";
var lopar = "⦅";
var Lopf = "𝕃";
var lopf = "𝕝";
var loplus = "⨭";
var lotimes = "⨴";
var lowast = "∗";
var lowbar = "_";
var LowerLeftArrow = "↙";
var LowerRightArrow = "↘";
var loz = "◊";
var lozenge = "◊";
var lozf = "⧫";
var lpar = "(";
var lparlt = "⦓";
var lrarr = "⇆";
var lrcorner = "⌟";
var lrhar = "⇋";
var lrhard = "⥭";
var lrm = "‎";
var lrtri = "⊿";
var lsaquo = "‹";
var lscr = "𝓁";
var Lscr = "ℒ";
var lsh = "↰";
var Lsh = "↰";
var lsim = "≲";
var lsime = "⪍";
var lsimg = "⪏";
var lsqb = "[";
var lsquo = "‘";
var lsquor = "‚";
var Lstrok = "Ł";
var lstrok = "ł";
var ltcc = "⪦";
var ltcir = "⩹";
var lt$1 = "<";
var LT = "<";
var Lt = "≪";
var ltdot = "⋖";
var lthree = "⋋";
var ltimes = "⋉";
var ltlarr = "⥶";
var ltquest = "⩻";
var ltri = "◃";
var ltrie = "⊴";
var ltrif = "◂";
var ltrPar = "⦖";
var lurdshar = "⥊";
var luruhar = "⥦";
var lvertneqq = "≨︀";
var lvnE = "≨︀";
var macr = "¯";
var male = "♂";
var malt = "✠";
var maltese = "✠";
var map = "↦";
var mapsto = "↦";
var mapstodown = "↧";
var mapstoleft = "↤";
var mapstoup = "↥";
var marker = "▮";
var mcomma = "⨩";
var Mcy = "М";
var mcy = "м";
var mdash = "—";
var mDDot = "∺";
var measuredangle = "∡";
var MediumSpace = " ";
var Mellintrf = "ℳ";
var Mfr = "𝔐";
var mfr = "𝔪";
var mho = "℧";
var micro = "µ";
var midast = "*";
var midcir = "⫰";
var mid = "∣";
var middot = "·";
var minusb = "⊟";
var minus = "−";
var minusd = "∸";
var minusdu = "⨪";
var MinusPlus = "∓";
var mlcp = "⫛";
var mldr = "…";
var mnplus = "∓";
var models = "⊧";
var Mopf = "𝕄";
var mopf = "𝕞";
var mp = "∓";
var mscr = "𝓂";
var Mscr = "ℳ";
var mstpos = "∾";
var Mu = "Μ";
var mu = "μ";
var multimap = "⊸";
var mumap = "⊸";
var nabla = "∇";
var Nacute = "Ń";
var nacute = "ń";
var nang = "∠⃒";
var nap = "≉";
var napE = "⩰̸";
var napid = "≋̸";
var napos = "ŉ";
var napprox = "≉";
var natural = "♮";
var naturals = "ℕ";
var natur = "♮";
var nbsp = " ";
var nbump = "≎̸";
var nbumpe = "≏̸";
var ncap = "⩃";
var Ncaron = "Ň";
var ncaron = "ň";
var Ncedil = "Ņ";
var ncedil = "ņ";
var ncong = "≇";
var ncongdot = "⩭̸";
var ncup = "⩂";
var Ncy = "Н";
var ncy = "н";
var ndash = "–";
var nearhk = "⤤";
var nearr = "↗";
var neArr = "⇗";
var nearrow = "↗";
var ne = "≠";
var nedot = "≐̸";
var NegativeMediumSpace = "​";
var NegativeThickSpace = "​";
var NegativeThinSpace = "​";
var NegativeVeryThinSpace = "​";
var nequiv = "≢";
var nesear = "⤨";
var nesim = "≂̸";
var NestedGreaterGreater = "≫";
var NestedLessLess = "≪";
var NewLine = "\n";
var nexist = "∄";
var nexists = "∄";
var Nfr = "𝔑";
var nfr = "𝔫";
var ngE = "≧̸";
var nge = "≱";
var ngeq = "≱";
var ngeqq = "≧̸";
var ngeqslant = "⩾̸";
var nges = "⩾̸";
var nGg = "⋙̸";
var ngsim = "≵";
var nGt = "≫⃒";
var ngt = "≯";
var ngtr = "≯";
var nGtv = "≫̸";
var nharr = "↮";
var nhArr = "⇎";
var nhpar = "⫲";
var ni = "∋";
var nis = "⋼";
var nisd = "⋺";
var niv = "∋";
var NJcy = "Њ";
var njcy = "њ";
var nlarr = "↚";
var nlArr = "⇍";
var nldr = "‥";
var nlE = "≦̸";
var nle = "≰";
var nleftarrow = "↚";
var nLeftarrow = "⇍";
var nleftrightarrow = "↮";
var nLeftrightarrow = "⇎";
var nleq = "≰";
var nleqq = "≦̸";
var nleqslant = "⩽̸";
var nles = "⩽̸";
var nless = "≮";
var nLl = "⋘̸";
var nlsim = "≴";
var nLt = "≪⃒";
var nlt = "≮";
var nltri = "⋪";
var nltrie = "⋬";
var nLtv = "≪̸";
var nmid = "∤";
var NoBreak = "⁠";
var NonBreakingSpace = " ";
var nopf = "𝕟";
var Nopf = "ℕ";
var Not = "⫬";
var not = "¬";
var NotCongruent = "≢";
var NotCupCap = "≭";
var NotDoubleVerticalBar = "∦";
var NotElement = "∉";
var NotEqual = "≠";
var NotEqualTilde = "≂̸";
var NotExists = "∄";
var NotGreater = "≯";
var NotGreaterEqual = "≱";
var NotGreaterFullEqual = "≧̸";
var NotGreaterGreater = "≫̸";
var NotGreaterLess = "≹";
var NotGreaterSlantEqual = "⩾̸";
var NotGreaterTilde = "≵";
var NotHumpDownHump = "≎̸";
var NotHumpEqual = "≏̸";
var notin = "∉";
var notindot = "⋵̸";
var notinE = "⋹̸";
var notinva = "∉";
var notinvb = "⋷";
var notinvc = "⋶";
var NotLeftTriangleBar = "⧏̸";
var NotLeftTriangle = "⋪";
var NotLeftTriangleEqual = "⋬";
var NotLess = "≮";
var NotLessEqual = "≰";
var NotLessGreater = "≸";
var NotLessLess = "≪̸";
var NotLessSlantEqual = "⩽̸";
var NotLessTilde = "≴";
var NotNestedGreaterGreater = "⪢̸";
var NotNestedLessLess = "⪡̸";
var notni = "∌";
var notniva = "∌";
var notnivb = "⋾";
var notnivc = "⋽";
var NotPrecedes = "⊀";
var NotPrecedesEqual = "⪯̸";
var NotPrecedesSlantEqual = "⋠";
var NotReverseElement = "∌";
var NotRightTriangleBar = "⧐̸";
var NotRightTriangle = "⋫";
var NotRightTriangleEqual = "⋭";
var NotSquareSubset = "⊏̸";
var NotSquareSubsetEqual = "⋢";
var NotSquareSuperset = "⊐̸";
var NotSquareSupersetEqual = "⋣";
var NotSubset = "⊂⃒";
var NotSubsetEqual = "⊈";
var NotSucceeds = "⊁";
var NotSucceedsEqual = "⪰̸";
var NotSucceedsSlantEqual = "⋡";
var NotSucceedsTilde = "≿̸";
var NotSuperset = "⊃⃒";
var NotSupersetEqual = "⊉";
var NotTilde = "≁";
var NotTildeEqual = "≄";
var NotTildeFullEqual = "≇";
var NotTildeTilde = "≉";
var NotVerticalBar = "∤";
var nparallel = "∦";
var npar = "∦";
var nparsl = "⫽⃥";
var npart = "∂̸";
var npolint = "⨔";
var npr = "⊀";
var nprcue = "⋠";
var nprec = "⊀";
var npreceq = "⪯̸";
var npre = "⪯̸";
var nrarrc = "⤳̸";
var nrarr = "↛";
var nrArr = "⇏";
var nrarrw = "↝̸";
var nrightarrow = "↛";
var nRightarrow = "⇏";
var nrtri = "⋫";
var nrtrie = "⋭";
var nsc = "⊁";
var nsccue = "⋡";
var nsce = "⪰̸";
var Nscr = "𝒩";
var nscr = "𝓃";
var nshortmid = "∤";
var nshortparallel = "∦";
var nsim = "≁";
var nsime = "≄";
var nsimeq = "≄";
var nsmid = "∤";
var nspar = "∦";
var nsqsube = "⋢";
var nsqsupe = "⋣";
var nsub = "⊄";
var nsubE = "⫅̸";
var nsube = "⊈";
var nsubset = "⊂⃒";
var nsubseteq = "⊈";
var nsubseteqq = "⫅̸";
var nsucc = "⊁";
var nsucceq = "⪰̸";
var nsup = "⊅";
var nsupE = "⫆̸";
var nsupe = "⊉";
var nsupset = "⊃⃒";
var nsupseteq = "⊉";
var nsupseteqq = "⫆̸";
var ntgl = "≹";
var Ntilde = "Ñ";
var ntilde = "ñ";
var ntlg = "≸";
var ntriangleleft = "⋪";
var ntrianglelefteq = "⋬";
var ntriangleright = "⋫";
var ntrianglerighteq = "⋭";
var Nu = "Ν";
var nu = "ν";
var num = "#";
var numero = "№";
var numsp = " ";
var nvap = "≍⃒";
var nvdash = "⊬";
var nvDash = "⊭";
var nVdash = "⊮";
var nVDash = "⊯";
var nvge = "≥⃒";
var nvgt = ">⃒";
var nvHarr = "⤄";
var nvinfin = "⧞";
var nvlArr = "⤂";
var nvle = "≤⃒";
var nvlt = "<⃒";
var nvltrie = "⊴⃒";
var nvrArr = "⤃";
var nvrtrie = "⊵⃒";
var nvsim = "∼⃒";
var nwarhk = "⤣";
var nwarr = "↖";
var nwArr = "⇖";
var nwarrow = "↖";
var nwnear = "⤧";
var Oacute = "Ó";
var oacute = "ó";
var oast = "⊛";
var Ocirc = "Ô";
var ocirc = "ô";
var ocir = "⊚";
var Ocy = "О";
var ocy = "о";
var odash = "⊝";
var Odblac = "Ő";
var odblac = "ő";
var odiv = "⨸";
var odot = "⊙";
var odsold = "⦼";
var OElig = "Œ";
var oelig = "œ";
var ofcir = "⦿";
var Ofr = "𝔒";
var ofr = "𝔬";
var ogon = "˛";
var Ograve = "Ò";
var ograve = "ò";
var ogt = "⧁";
var ohbar = "⦵";
var ohm = "Ω";
var oint = "∮";
var olarr = "↺";
var olcir = "⦾";
var olcross = "⦻";
var oline = "‾";
var olt = "⧀";
var Omacr = "Ō";
var omacr = "ō";
var Omega = "Ω";
var omega = "ω";
var Omicron = "Ο";
var omicron = "ο";
var omid = "⦶";
var ominus = "⊖";
var Oopf = "𝕆";
var oopf = "𝕠";
var opar = "⦷";
var OpenCurlyDoubleQuote = "“";
var OpenCurlyQuote = "‘";
var operp = "⦹";
var oplus = "⊕";
var orarr = "↻";
var Or = "⩔";
var or = "∨";
var ord = "⩝";
var order = "ℴ";
var orderof = "ℴ";
var ordf = "ª";
var ordm = "º";
var origof = "⊶";
var oror = "⩖";
var orslope = "⩗";
var orv = "⩛";
var oS = "Ⓢ";
var Oscr = "𝒪";
var oscr = "ℴ";
var Oslash = "Ø";
var oslash = "ø";
var osol = "⊘";
var Otilde = "Õ";
var otilde = "õ";
var otimesas = "⨶";
var Otimes = "⨷";
var otimes = "⊗";
var Ouml = "Ö";
var ouml = "ö";
var ovbar = "⌽";
var OverBar = "‾";
var OverBrace = "⏞";
var OverBracket = "⎴";
var OverParenthesis = "⏜";
var para = "¶";
var parallel = "∥";
var par = "∥";
var parsim = "⫳";
var parsl = "⫽";
var part = "∂";
var PartialD = "∂";
var Pcy = "П";
var pcy = "п";
var percnt = "%";
var period = ".";
var permil = "‰";
var perp$1 = "⊥";
var pertenk = "‱";
var Pfr = "𝔓";
var pfr = "𝔭";
var Phi = "Φ";
var phi = "φ";
var phiv = "ϕ";
var phmmat = "ℳ";
var phone = "☎";
var Pi = "Π";
var pi = "π";
var pitchfork = "⋔";
var piv = "ϖ";
var planck = "ℏ";
var planckh = "ℎ";
var plankv = "ℏ";
var plusacir = "⨣";
var plusb = "⊞";
var pluscir = "⨢";
var plus = "+";
var plusdo = "∔";
var plusdu = "⨥";
var pluse = "⩲";
var PlusMinus = "±";
var plusmn = "±";
var plussim = "⨦";
var plustwo = "⨧";
var pm = "±";
var Poincareplane = "ℌ";
var pointint = "⨕";
var popf = "𝕡";
var Popf = "ℙ";
var pound = "£";
var prap = "⪷";
var Pr = "⪻";
var pr = "≺";
var prcue = "≼";
var precapprox = "⪷";
var prec = "≺";
var preccurlyeq = "≼";
var Precedes = "≺";
var PrecedesEqual = "⪯";
var PrecedesSlantEqual = "≼";
var PrecedesTilde = "≾";
var preceq = "⪯";
var precnapprox = "⪹";
var precneqq = "⪵";
var precnsim = "⋨";
var pre = "⪯";
var prE = "⪳";
var precsim = "≾";
var prime = "′";
var Prime = "″";
var primes = "ℙ";
var prnap = "⪹";
var prnE = "⪵";
var prnsim = "⋨";
var prod = "∏";
var Product = "∏";
var profalar = "⌮";
var profline = "⌒";
var profsurf = "⌓";
var prop = "∝";
var Proportional = "∝";
var Proportion = "∷";
var propto = "∝";
var prsim = "≾";
var prurel = "⊰";
var Pscr = "𝒫";
var pscr = "𝓅";
var Psi = "Ψ";
var psi = "ψ";
var puncsp = " ";
var Qfr = "𝔔";
var qfr = "𝔮";
var qint = "⨌";
var qopf = "𝕢";
var Qopf = "ℚ";
var qprime = "⁗";
var Qscr = "𝒬";
var qscr = "𝓆";
var quaternions = "ℍ";
var quatint = "⨖";
var quest = "?";
var questeq = "≟";
var quot = "\"";
var QUOT = "\"";
var rAarr = "⇛";
var race = "∽̱";
var Racute = "Ŕ";
var racute = "ŕ";
var radic = "√";
var raemptyv = "⦳";
var rang = "⟩";
var Rang = "⟫";
var rangd = "⦒";
var range = "⦥";
var rangle = "⟩";
var raquo = "»";
var rarrap = "⥵";
var rarrb = "⇥";
var rarrbfs = "⤠";
var rarrc = "⤳";
var rarr = "→";
var Rarr = "↠";
var rArr = "⇒";
var rarrfs = "⤞";
var rarrhk = "↪";
var rarrlp = "↬";
var rarrpl = "⥅";
var rarrsim = "⥴";
var Rarrtl = "⤖";
var rarrtl = "↣";
var rarrw = "↝";
var ratail = "⤚";
var rAtail = "⤜";
var ratio = "∶";
var rationals = "ℚ";
var rbarr = "⤍";
var rBarr = "⤏";
var RBarr = "⤐";
var rbbrk = "❳";
var rbrace = "}";
var rbrack = "]";
var rbrke = "⦌";
var rbrksld = "⦎";
var rbrkslu = "⦐";
var Rcaron = "Ř";
var rcaron = "ř";
var Rcedil = "Ŗ";
var rcedil = "ŗ";
var rceil = "⌉";
var rcub = "}";
var Rcy = "Р";
var rcy = "р";
var rdca = "⤷";
var rdldhar = "⥩";
var rdquo = "”";
var rdquor = "”";
var rdsh = "↳";
var real = "ℜ";
var realine = "ℛ";
var realpart = "ℜ";
var reals = "ℝ";
var Re = "ℜ";
var rect = "▭";
var reg = "®";
var REG = "®";
var ReverseElement = "∋";
var ReverseEquilibrium = "⇋";
var ReverseUpEquilibrium = "⥯";
var rfisht = "⥽";
var rfloor = "⌋";
var rfr = "𝔯";
var Rfr = "ℜ";
var rHar = "⥤";
var rhard = "⇁";
var rharu = "⇀";
var rharul = "⥬";
var Rho = "Ρ";
var rho = "ρ";
var rhov = "ϱ";
var RightAngleBracket = "⟩";
var RightArrowBar = "⇥";
var rightarrow = "→";
var RightArrow = "→";
var Rightarrow = "⇒";
var RightArrowLeftArrow = "⇄";
var rightarrowtail = "↣";
var RightCeiling = "⌉";
var RightDoubleBracket = "⟧";
var RightDownTeeVector = "⥝";
var RightDownVectorBar = "⥕";
var RightDownVector = "⇂";
var RightFloor = "⌋";
var rightharpoondown = "⇁";
var rightharpoonup = "⇀";
var rightleftarrows = "⇄";
var rightleftharpoons = "⇌";
var rightrightarrows = "⇉";
var rightsquigarrow = "↝";
var RightTeeArrow = "↦";
var RightTee = "⊢";
var RightTeeVector = "⥛";
var rightthreetimes = "⋌";
var RightTriangleBar = "⧐";
var RightTriangle = "⊳";
var RightTriangleEqual = "⊵";
var RightUpDownVector = "⥏";
var RightUpTeeVector = "⥜";
var RightUpVectorBar = "⥔";
var RightUpVector = "↾";
var RightVectorBar = "⥓";
var RightVector = "⇀";
var ring = "˚";
var risingdotseq = "≓";
var rlarr = "⇄";
var rlhar = "⇌";
var rlm = "‏";
var rmoustache = "⎱";
var rmoust = "⎱";
var rnmid = "⫮";
var roang = "⟭";
var roarr = "⇾";
var robrk = "⟧";
var ropar = "⦆";
var ropf = "𝕣";
var Ropf = "ℝ";
var roplus = "⨮";
var rotimes = "⨵";
var RoundImplies = "⥰";
var rpar = ")";
var rpargt = "⦔";
var rppolint = "⨒";
var rrarr = "⇉";
var Rrightarrow = "⇛";
var rsaquo = "›";
var rscr = "𝓇";
var Rscr = "ℛ";
var rsh = "↱";
var Rsh = "↱";
var rsqb = "]";
var rsquo = "’";
var rsquor = "’";
var rthree = "⋌";
var rtimes = "⋊";
var rtri = "▹";
var rtrie = "⊵";
var rtrif = "▸";
var rtriltri = "⧎";
var RuleDelayed = "⧴";
var ruluhar = "⥨";
var rx = "℞";
var Sacute = "Ś";
var sacute = "ś";
var sbquo = "‚";
var scap = "⪸";
var Scaron = "Š";
var scaron = "š";
var Sc = "⪼";
var sc = "≻";
var sccue = "≽";
var sce = "⪰";
var scE = "⪴";
var Scedil = "Ş";
var scedil = "ş";
var Scirc = "Ŝ";
var scirc = "ŝ";
var scnap = "⪺";
var scnE = "⪶";
var scnsim = "⋩";
var scpolint = "⨓";
var scsim = "≿";
var Scy = "С";
var scy = "с";
var sdotb = "⊡";
var sdot = "⋅";
var sdote = "⩦";
var searhk = "⤥";
var searr = "↘";
var seArr = "⇘";
var searrow = "↘";
var sect = "§";
var semi = ";";
var seswar = "⤩";
var setminus = "∖";
var setmn = "∖";
var sext = "✶";
var Sfr = "𝔖";
var sfr = "𝔰";
var sfrown = "⌢";
var sharp = "♯";
var SHCHcy = "Щ";
var shchcy = "щ";
var SHcy = "Ш";
var shcy = "ш";
var ShortDownArrow = "↓";
var ShortLeftArrow = "←";
var shortmid = "∣";
var shortparallel = "∥";
var ShortRightArrow = "→";
var ShortUpArrow = "↑";
var shy = "­";
var Sigma = "Σ";
var sigma = "σ";
var sigmaf = "ς";
var sigmav = "ς";
var sim = "∼";
var simdot = "⩪";
var sime = "≃";
var simeq = "≃";
var simg = "⪞";
var simgE = "⪠";
var siml = "⪝";
var simlE = "⪟";
var simne = "≆";
var simplus = "⨤";
var simrarr = "⥲";
var slarr = "←";
var SmallCircle = "∘";
var smallsetminus = "∖";
var smashp = "⨳";
var smeparsl = "⧤";
var smid = "∣";
var smile = "⌣";
var smt = "⪪";
var smte = "⪬";
var smtes = "⪬︀";
var SOFTcy = "Ь";
var softcy = "ь";
var solbar = "⌿";
var solb = "⧄";
var sol = "/";
var Sopf = "𝕊";
var sopf = "𝕤";
var spades = "♠";
var spadesuit = "♠";
var spar = "∥";
var sqcap = "⊓";
var sqcaps = "⊓︀";
var sqcup = "⊔";
var sqcups = "⊔︀";
var Sqrt = "√";
var sqsub = "⊏";
var sqsube = "⊑";
var sqsubset = "⊏";
var sqsubseteq = "⊑";
var sqsup = "⊐";
var sqsupe = "⊒";
var sqsupset = "⊐";
var sqsupseteq = "⊒";
var square = "□";
var Square = "□";
var SquareIntersection = "⊓";
var SquareSubset = "⊏";
var SquareSubsetEqual = "⊑";
var SquareSuperset = "⊐";
var SquareSupersetEqual = "⊒";
var SquareUnion = "⊔";
var squarf = "▪";
var squ = "□";
var squf = "▪";
var srarr = "→";
var Sscr = "𝒮";
var sscr = "𝓈";
var ssetmn = "∖";
var ssmile = "⌣";
var sstarf = "⋆";
var Star = "⋆";
var star = "☆";
var starf = "★";
var straightepsilon = "ϵ";
var straightphi = "ϕ";
var strns = "¯";
var sub = "⊂";
var Sub = "⋐";
var subdot = "⪽";
var subE = "⫅";
var sube = "⊆";
var subedot = "⫃";
var submult = "⫁";
var subnE = "⫋";
var subne = "⊊";
var subplus = "⪿";
var subrarr = "⥹";
var subset = "⊂";
var Subset = "⋐";
var subseteq = "⊆";
var subseteqq = "⫅";
var SubsetEqual = "⊆";
var subsetneq = "⊊";
var subsetneqq = "⫋";
var subsim = "⫇";
var subsub = "⫕";
var subsup = "⫓";
var succapprox = "⪸";
var succ = "≻";
var succcurlyeq = "≽";
var Succeeds = "≻";
var SucceedsEqual = "⪰";
var SucceedsSlantEqual = "≽";
var SucceedsTilde = "≿";
var succeq = "⪰";
var succnapprox = "⪺";
var succneqq = "⪶";
var succnsim = "⋩";
var succsim = "≿";
var SuchThat = "∋";
var sum = "∑";
var Sum = "∑";
var sung = "♪";
var sup1 = "¹";
var sup2 = "²";
var sup3 = "³";
var sup = "⊃";
var Sup = "⋑";
var supdot = "⪾";
var supdsub = "⫘";
var supE = "⫆";
var supe = "⊇";
var supedot = "⫄";
var Superset = "⊃";
var SupersetEqual = "⊇";
var suphsol = "⟉";
var suphsub = "⫗";
var suplarr = "⥻";
var supmult = "⫂";
var supnE = "⫌";
var supne = "⊋";
var supplus = "⫀";
var supset = "⊃";
var Supset = "⋑";
var supseteq = "⊇";
var supseteqq = "⫆";
var supsetneq = "⊋";
var supsetneqq = "⫌";
var supsim = "⫈";
var supsub = "⫔";
var supsup = "⫖";
var swarhk = "⤦";
var swarr = "↙";
var swArr = "⇙";
var swarrow = "↙";
var swnwar = "⤪";
var szlig = "ß";
var Tab = "\t";
var target = "⌖";
var Tau = "Τ";
var tau = "τ";
var tbrk = "⎴";
var Tcaron = "Ť";
var tcaron = "ť";
var Tcedil = "Ţ";
var tcedil = "ţ";
var Tcy = "Т";
var tcy = "т";
var tdot = "⃛";
var telrec = "⌕";
var Tfr = "𝔗";
var tfr = "𝔱";
var there4 = "∴";
var therefore = "∴";
var Therefore = "∴";
var Theta = "Θ";
var theta = "θ";
var thetasym = "ϑ";
var thetav = "ϑ";
var thickapprox = "≈";
var thicksim = "∼";
var ThickSpace = "  ";
var ThinSpace = " ";
var thinsp = " ";
var thkap = "≈";
var thksim = "∼";
var THORN = "Þ";
var thorn = "þ";
var tilde = "˜";
var Tilde = "∼";
var TildeEqual = "≃";
var TildeFullEqual = "≅";
var TildeTilde = "≈";
var timesbar = "⨱";
var timesb = "⊠";
var times = "×";
var timesd = "⨰";
var tint = "∭";
var toea = "⤨";
var topbot = "⌶";
var topcir = "⫱";
var top = "⊤";
var Topf = "𝕋";
var topf = "𝕥";
var topfork = "⫚";
var tosa = "⤩";
var tprime = "‴";
var trade = "™";
var TRADE = "™";
var triangle = "▵";
var triangledown = "▿";
var triangleleft = "◃";
var trianglelefteq = "⊴";
var triangleq = "≜";
var triangleright = "▹";
var trianglerighteq = "⊵";
var tridot = "◬";
var trie = "≜";
var triminus = "⨺";
var TripleDot = "⃛";
var triplus = "⨹";
var trisb = "⧍";
var tritime = "⨻";
var trpezium = "⏢";
var Tscr = "𝒯";
var tscr = "𝓉";
var TScy = "Ц";
var tscy = "ц";
var TSHcy = "Ћ";
var tshcy = "ћ";
var Tstrok = "Ŧ";
var tstrok = "ŧ";
var twixt = "≬";
var twoheadleftarrow = "↞";
var twoheadrightarrow = "↠";
var Uacute = "Ú";
var uacute = "ú";
var uarr = "↑";
var Uarr = "↟";
var uArr = "⇑";
var Uarrocir = "⥉";
var Ubrcy = "Ў";
var ubrcy = "ў";
var Ubreve = "Ŭ";
var ubreve = "ŭ";
var Ucirc = "Û";
var ucirc = "û";
var Ucy = "У";
var ucy = "у";
var udarr = "⇅";
var Udblac = "Ű";
var udblac = "ű";
var udhar = "⥮";
var ufisht = "⥾";
var Ufr = "𝔘";
var ufr = "𝔲";
var Ugrave = "Ù";
var ugrave = "ù";
var uHar = "⥣";
var uharl = "↿";
var uharr = "↾";
var uhblk = "▀";
var ulcorn = "⌜";
var ulcorner = "⌜";
var ulcrop = "⌏";
var ultri = "◸";
var Umacr = "Ū";
var umacr = "ū";
var uml = "¨";
var UnderBar = "_";
var UnderBrace = "⏟";
var UnderBracket = "⎵";
var UnderParenthesis = "⏝";
var Union = "⋃";
var UnionPlus = "⊎";
var Uogon = "Ų";
var uogon = "ų";
var Uopf = "𝕌";
var uopf = "𝕦";
var UpArrowBar = "⤒";
var uparrow = "↑";
var UpArrow = "↑";
var Uparrow = "⇑";
var UpArrowDownArrow = "⇅";
var updownarrow = "↕";
var UpDownArrow = "↕";
var Updownarrow = "⇕";
var UpEquilibrium = "⥮";
var upharpoonleft = "↿";
var upharpoonright = "↾";
var uplus = "⊎";
var UpperLeftArrow = "↖";
var UpperRightArrow = "↗";
var upsi = "υ";
var Upsi = "ϒ";
var upsih = "ϒ";
var Upsilon = "Υ";
var upsilon = "υ";
var UpTeeArrow = "↥";
var UpTee = "⊥";
var upuparrows = "⇈";
var urcorn = "⌝";
var urcorner = "⌝";
var urcrop = "⌎";
var Uring = "Ů";
var uring = "ů";
var urtri = "◹";
var Uscr = "𝒰";
var uscr = "𝓊";
var utdot = "⋰";
var Utilde = "Ũ";
var utilde = "ũ";
var utri = "▵";
var utrif = "▴";
var uuarr = "⇈";
var Uuml = "Ü";
var uuml = "ü";
var uwangle = "⦧";
var vangrt = "⦜";
var varepsilon = "ϵ";
var varkappa = "ϰ";
var varnothing = "∅";
var varphi = "ϕ";
var varpi = "ϖ";
var varpropto = "∝";
var varr = "↕";
var vArr = "⇕";
var varrho = "ϱ";
var varsigma = "ς";
var varsubsetneq = "⊊︀";
var varsubsetneqq = "⫋︀";
var varsupsetneq = "⊋︀";
var varsupsetneqq = "⫌︀";
var vartheta = "ϑ";
var vartriangleleft = "⊲";
var vartriangleright = "⊳";
var vBar = "⫨";
var Vbar = "⫫";
var vBarv = "⫩";
var Vcy = "В";
var vcy = "в";
var vdash = "⊢";
var vDash = "⊨";
var Vdash = "⊩";
var VDash = "⊫";
var Vdashl = "⫦";
var veebar = "⊻";
var vee = "∨";
var Vee = "⋁";
var veeeq = "≚";
var vellip = "⋮";
var verbar = "|";
var Verbar = "‖";
var vert = "|";
var Vert = "‖";
var VerticalBar = "∣";
var VerticalLine = "|";
var VerticalSeparator = "❘";
var VerticalTilde = "≀";
var VeryThinSpace = " ";
var Vfr = "𝔙";
var vfr = "𝔳";
var vltri = "⊲";
var vnsub = "⊂⃒";
var vnsup = "⊃⃒";
var Vopf = "𝕍";
var vopf = "𝕧";
var vprop = "∝";
var vrtri = "⊳";
var Vscr = "𝒱";
var vscr = "𝓋";
var vsubnE = "⫋︀";
var vsubne = "⊊︀";
var vsupnE = "⫌︀";
var vsupne = "⊋︀";
var Vvdash = "⊪";
var vzigzag = "⦚";
var Wcirc = "Ŵ";
var wcirc = "ŵ";
var wedbar = "⩟";
var wedge = "∧";
var Wedge = "⋀";
var wedgeq = "≙";
var weierp = "℘";
var Wfr = "𝔚";
var wfr = "𝔴";
var Wopf = "𝕎";
var wopf = "𝕨";
var wp = "℘";
var wr = "≀";
var wreath = "≀";
var Wscr = "𝒲";
var wscr = "𝓌";
var xcap = "⋂";
var xcirc = "◯";
var xcup = "⋃";
var xdtri = "▽";
var Xfr = "𝔛";
var xfr = "𝔵";
var xharr = "⟷";
var xhArr = "⟺";
var Xi = "Ξ";
var xi = "ξ";
var xlarr = "⟵";
var xlArr = "⟸";
var xmap = "⟼";
var xnis = "⋻";
var xodot = "⨀";
var Xopf = "𝕏";
var xopf = "𝕩";
var xoplus = "⨁";
var xotime = "⨂";
var xrarr = "⟶";
var xrArr = "⟹";
var Xscr = "𝒳";
var xscr = "𝓍";
var xsqcup = "⨆";
var xuplus = "⨄";
var xutri = "△";
var xvee = "⋁";
var xwedge = "⋀";
var Yacute = "Ý";
var yacute = "ý";
var YAcy = "Я";
var yacy = "я";
var Ycirc = "Ŷ";
var ycirc = "ŷ";
var Ycy = "Ы";
var ycy = "ы";
var yen = "¥";
var Yfr = "𝔜";
var yfr = "𝔶";
var YIcy = "Ї";
var yicy = "ї";
var Yopf = "𝕐";
var yopf = "𝕪";
var Yscr = "𝒴";
var yscr = "𝓎";
var YUcy = "Ю";
var yucy = "ю";
var yuml = "ÿ";
var Yuml = "Ÿ";
var Zacute = "Ź";
var zacute = "ź";
var Zcaron = "Ž";
var zcaron = "ž";
var Zcy = "З";
var zcy = "з";
var Zdot = "Ż";
var zdot = "ż";
var zeetrf = "ℨ";
var ZeroWidthSpace = "​";
var Zeta = "Ζ";
var zeta = "ζ";
var zfr = "𝔷";
var Zfr = "ℨ";
var ZHcy = "Ж";
var zhcy = "ж";
var zigrarr = "⇝";
var zopf = "𝕫";
var Zopf = "ℤ";
var Zscr = "𝒵";
var zscr = "𝓏";
var zwj = "‍";
var zwnj = "‌";
var require$$0 = {
	Aacute: Aacute,
	aacute: aacute,
	Abreve: Abreve,
	abreve: abreve,
	ac: ac,
	acd: acd,
	acE: acE,
	Acirc: Acirc,
	acirc: acirc,
	acute: acute,
	Acy: Acy,
	acy: acy,
	AElig: AElig,
	aelig: aelig,
	af: af,
	Afr: Afr,
	afr: afr,
	Agrave: Agrave,
	agrave: agrave,
	alefsym: alefsym,
	aleph: aleph,
	Alpha: Alpha,
	alpha: alpha,
	Amacr: Amacr,
	amacr: amacr,
	amalg: amalg,
	amp: amp,
	AMP: AMP,
	andand: andand,
	And: And,
	and: and,
	andd: andd,
	andslope: andslope,
	andv: andv,
	ang: ang,
	ange: ange,
	angle: angle,
	angmsdaa: angmsdaa,
	angmsdab: angmsdab,
	angmsdac: angmsdac,
	angmsdad: angmsdad,
	angmsdae: angmsdae,
	angmsdaf: angmsdaf,
	angmsdag: angmsdag,
	angmsdah: angmsdah,
	angmsd: angmsd,
	angrt: angrt,
	angrtvb: angrtvb,
	angrtvbd: angrtvbd,
	angsph: angsph,
	angst: angst,
	angzarr: angzarr,
	Aogon: Aogon,
	aogon: aogon,
	Aopf: Aopf,
	aopf: aopf,
	apacir: apacir,
	ap: ap,
	apE: apE,
	ape: ape,
	apid: apid,
	apos: apos,
	ApplyFunction: ApplyFunction,
	approx: approx,
	approxeq: approxeq,
	Aring: Aring,
	aring: aring,
	Ascr: Ascr,
	ascr: ascr,
	Assign: Assign,
	ast: ast,
	asymp: asymp,
	asympeq: asympeq,
	Atilde: Atilde,
	atilde: atilde,
	Auml: Auml,
	auml: auml,
	awconint: awconint,
	awint: awint,
	backcong: backcong,
	backepsilon: backepsilon,
	backprime: backprime,
	backsim: backsim,
	backsimeq: backsimeq,
	Backslash: Backslash,
	Barv: Barv,
	barvee: barvee,
	barwed: barwed,
	Barwed: Barwed,
	barwedge: barwedge,
	bbrk: bbrk,
	bbrktbrk: bbrktbrk,
	bcong: bcong,
	Bcy: Bcy,
	bcy: bcy,
	bdquo: bdquo,
	becaus: becaus,
	because: because,
	Because: Because,
	bemptyv: bemptyv,
	bepsi: bepsi,
	bernou: bernou,
	Bernoullis: Bernoullis,
	Beta: Beta,
	beta: beta,
	beth: beth,
	between: between,
	Bfr: Bfr,
	bfr: bfr,
	bigcap: bigcap,
	bigcirc: bigcirc,
	bigcup: bigcup,
	bigodot: bigodot,
	bigoplus: bigoplus,
	bigotimes: bigotimes,
	bigsqcup: bigsqcup,
	bigstar: bigstar,
	bigtriangledown: bigtriangledown,
	bigtriangleup: bigtriangleup,
	biguplus: biguplus,
	bigvee: bigvee,
	bigwedge: bigwedge,
	bkarow: bkarow,
	blacklozenge: blacklozenge,
	blacksquare: blacksquare,
	blacktriangle: blacktriangle,
	blacktriangledown: blacktriangledown,
	blacktriangleleft: blacktriangleleft,
	blacktriangleright: blacktriangleright,
	blank: blank,
	blk12: blk12,
	blk14: blk14,
	blk34: blk34,
	block: block$1,
	bne: bne,
	bnequiv: bnequiv,
	bNot: bNot,
	bnot: bnot,
	Bopf: Bopf,
	bopf: bopf,
	bot: bot,
	bottom: bottom,
	bowtie: bowtie,
	boxbox: boxbox,
	boxdl: boxdl,
	boxdL: boxdL,
	boxDl: boxDl,
	boxDL: boxDL,
	boxdr: boxdr,
	boxdR: boxdR,
	boxDr: boxDr,
	boxDR: boxDR,
	boxh: boxh,
	boxH: boxH,
	boxhd: boxhd,
	boxHd: boxHd,
	boxhD: boxhD,
	boxHD: boxHD,
	boxhu: boxhu,
	boxHu: boxHu,
	boxhU: boxhU,
	boxHU: boxHU,
	boxminus: boxminus,
	boxplus: boxplus,
	boxtimes: boxtimes,
	boxul: boxul,
	boxuL: boxuL,
	boxUl: boxUl,
	boxUL: boxUL,
	boxur: boxur,
	boxuR: boxuR,
	boxUr: boxUr,
	boxUR: boxUR,
	boxv: boxv,
	boxV: boxV,
	boxvh: boxvh,
	boxvH: boxvH,
	boxVh: boxVh,
	boxVH: boxVH,
	boxvl: boxvl,
	boxvL: boxvL,
	boxVl: boxVl,
	boxVL: boxVL,
	boxvr: boxvr,
	boxvR: boxvR,
	boxVr: boxVr,
	boxVR: boxVR,
	bprime: bprime,
	breve: breve,
	Breve: Breve,
	brvbar: brvbar,
	bscr: bscr,
	Bscr: Bscr,
	bsemi: bsemi,
	bsim: bsim,
	bsime: bsime,
	bsolb: bsolb,
	bsol: bsol,
	bsolhsub: bsolhsub,
	bull: bull,
	bullet: bullet,
	bump: bump,
	bumpE: bumpE,
	bumpe: bumpe,
	Bumpeq: Bumpeq,
	bumpeq: bumpeq,
	Cacute: Cacute,
	cacute: cacute,
	capand: capand,
	capbrcup: capbrcup,
	capcap: capcap,
	cap: cap,
	Cap: Cap,
	capcup: capcup,
	capdot: capdot,
	CapitalDifferentialD: CapitalDifferentialD,
	caps: caps,
	caret: caret,
	caron: caron,
	Cayleys: Cayleys,
	ccaps: ccaps,
	Ccaron: Ccaron,
	ccaron: ccaron,
	Ccedil: Ccedil,
	ccedil: ccedil,
	Ccirc: Ccirc,
	ccirc: ccirc,
	Cconint: Cconint,
	ccups: ccups,
	ccupssm: ccupssm,
	Cdot: Cdot,
	cdot: cdot,
	cedil: cedil,
	Cedilla: Cedilla,
	cemptyv: cemptyv,
	cent: cent,
	centerdot: centerdot,
	CenterDot: CenterDot,
	cfr: cfr,
	Cfr: Cfr,
	CHcy: CHcy,
	chcy: chcy,
	check: check,
	checkmark: checkmark,
	Chi: Chi,
	chi: chi,
	circ: circ,
	circeq: circeq,
	circlearrowleft: circlearrowleft,
	circlearrowright: circlearrowright,
	circledast: circledast,
	circledcirc: circledcirc,
	circleddash: circleddash,
	CircleDot: CircleDot,
	circledR: circledR,
	circledS: circledS,
	CircleMinus: CircleMinus,
	CirclePlus: CirclePlus,
	CircleTimes: CircleTimes,
	cir: cir,
	cirE: cirE,
	cire: cire,
	cirfnint: cirfnint,
	cirmid: cirmid,
	cirscir: cirscir,
	ClockwiseContourIntegral: ClockwiseContourIntegral,
	CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
	CloseCurlyQuote: CloseCurlyQuote,
	clubs: clubs,
	clubsuit: clubsuit,
	colon: colon,
	Colon: Colon,
	Colone: Colone,
	colone: colone,
	coloneq: coloneq,
	comma: comma,
	commat: commat,
	comp: comp,
	compfn: compfn,
	complement: complement,
	complexes: complexes,
	cong: cong,
	congdot: congdot,
	Congruent: Congruent,
	conint: conint,
	Conint: Conint,
	ContourIntegral: ContourIntegral,
	copf: copf,
	Copf: Copf,
	coprod: coprod,
	Coproduct: Coproduct,
	copy: copy,
	COPY: COPY,
	copysr: copysr,
	CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
	crarr: crarr,
	cross: cross,
	Cross: Cross,
	Cscr: Cscr,
	cscr: cscr,
	csub: csub,
	csube: csube,
	csup: csup,
	csupe: csupe,
	ctdot: ctdot,
	cudarrl: cudarrl,
	cudarrr: cudarrr,
	cuepr: cuepr,
	cuesc: cuesc,
	cularr: cularr,
	cularrp: cularrp,
	cupbrcap: cupbrcap,
	cupcap: cupcap,
	CupCap: CupCap,
	cup: cup,
	Cup: Cup,
	cupcup: cupcup,
	cupdot: cupdot,
	cupor: cupor,
	cups: cups,
	curarr: curarr,
	curarrm: curarrm,
	curlyeqprec: curlyeqprec,
	curlyeqsucc: curlyeqsucc,
	curlyvee: curlyvee,
	curlywedge: curlywedge,
	curren: curren,
	curvearrowleft: curvearrowleft,
	curvearrowright: curvearrowright,
	cuvee: cuvee,
	cuwed: cuwed,
	cwconint: cwconint,
	cwint: cwint,
	cylcty: cylcty,
	dagger: dagger,
	Dagger: Dagger,
	daleth: daleth,
	darr: darr,
	Darr: Darr,
	dArr: dArr,
	dash: dash,
	Dashv: Dashv,
	dashv: dashv,
	dbkarow: dbkarow,
	dblac: dblac,
	Dcaron: Dcaron,
	dcaron: dcaron,
	Dcy: Dcy,
	dcy: dcy,
	ddagger: ddagger,
	ddarr: ddarr,
	DD: DD,
	dd: dd,
	DDotrahd: DDotrahd,
	ddotseq: ddotseq,
	deg: deg,
	Del: Del,
	Delta: Delta,
	delta: delta,
	demptyv: demptyv,
	dfisht: dfisht,
	Dfr: Dfr,
	dfr: dfr,
	dHar: dHar,
	dharl: dharl,
	dharr: dharr,
	DiacriticalAcute: DiacriticalAcute,
	DiacriticalDot: DiacriticalDot,
	DiacriticalDoubleAcute: DiacriticalDoubleAcute,
	DiacriticalGrave: DiacriticalGrave,
	DiacriticalTilde: DiacriticalTilde,
	diam: diam,
	diamond: diamond,
	Diamond: Diamond,
	diamondsuit: diamondsuit,
	diams: diams,
	die: die,
	DifferentialD: DifferentialD,
	digamma: digamma,
	disin: disin,
	div: div,
	divide: divide,
	divideontimes: divideontimes,
	divonx: divonx,
	DJcy: DJcy,
	djcy: djcy,
	dlcorn: dlcorn,
	dlcrop: dlcrop,
	dollar: dollar,
	Dopf: Dopf,
	dopf: dopf,
	Dot: Dot,
	dot: dot,
	DotDot: DotDot,
	doteq: doteq,
	doteqdot: doteqdot,
	DotEqual: DotEqual,
	dotminus: dotminus,
	dotplus: dotplus,
	dotsquare: dotsquare,
	doublebarwedge: doublebarwedge,
	DoubleContourIntegral: DoubleContourIntegral,
	DoubleDot: DoubleDot,
	DoubleDownArrow: DoubleDownArrow,
	DoubleLeftArrow: DoubleLeftArrow,
	DoubleLeftRightArrow: DoubleLeftRightArrow,
	DoubleLeftTee: DoubleLeftTee,
	DoubleLongLeftArrow: DoubleLongLeftArrow,
	DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
	DoubleLongRightArrow: DoubleLongRightArrow,
	DoubleRightArrow: DoubleRightArrow,
	DoubleRightTee: DoubleRightTee,
	DoubleUpArrow: DoubleUpArrow,
	DoubleUpDownArrow: DoubleUpDownArrow,
	DoubleVerticalBar: DoubleVerticalBar,
	DownArrowBar: DownArrowBar,
	downarrow: downarrow,
	DownArrow: DownArrow,
	Downarrow: Downarrow,
	DownArrowUpArrow: DownArrowUpArrow,
	DownBreve: DownBreve,
	downdownarrows: downdownarrows,
	downharpoonleft: downharpoonleft,
	downharpoonright: downharpoonright,
	DownLeftRightVector: DownLeftRightVector,
	DownLeftTeeVector: DownLeftTeeVector,
	DownLeftVectorBar: DownLeftVectorBar,
	DownLeftVector: DownLeftVector,
	DownRightTeeVector: DownRightTeeVector,
	DownRightVectorBar: DownRightVectorBar,
	DownRightVector: DownRightVector,
	DownTeeArrow: DownTeeArrow,
	DownTee: DownTee,
	drbkarow: drbkarow,
	drcorn: drcorn,
	drcrop: drcrop,
	Dscr: Dscr,
	dscr: dscr,
	DScy: DScy,
	dscy: dscy,
	dsol: dsol,
	Dstrok: Dstrok,
	dstrok: dstrok,
	dtdot: dtdot,
	dtri: dtri,
	dtrif: dtrif,
	duarr: duarr,
	duhar: duhar,
	dwangle: dwangle,
	DZcy: DZcy,
	dzcy: dzcy,
	dzigrarr: dzigrarr,
	Eacute: Eacute,
	eacute: eacute,
	easter: easter,
	Ecaron: Ecaron,
	ecaron: ecaron,
	Ecirc: Ecirc,
	ecirc: ecirc,
	ecir: ecir,
	ecolon: ecolon,
	Ecy: Ecy,
	ecy: ecy,
	eDDot: eDDot,
	Edot: Edot,
	edot: edot,
	eDot: eDot,
	ee: ee,
	efDot: efDot,
	Efr: Efr,
	efr: efr,
	eg: eg,
	Egrave: Egrave,
	egrave: egrave,
	egs: egs,
	egsdot: egsdot,
	el: el,
	Element: Element$1,
	elinters: elinters,
	ell: ell,
	els: els,
	elsdot: elsdot,
	Emacr: Emacr,
	emacr: emacr,
	empty: empty,
	emptyset: emptyset,
	EmptySmallSquare: EmptySmallSquare,
	emptyv: emptyv,
	EmptyVerySmallSquare: EmptyVerySmallSquare,
	emsp13: emsp13,
	emsp14: emsp14,
	emsp: emsp,
	ENG: ENG,
	eng: eng,
	ensp: ensp,
	Eogon: Eogon,
	eogon: eogon,
	Eopf: Eopf,
	eopf: eopf,
	epar: epar,
	eparsl: eparsl,
	eplus: eplus,
	epsi: epsi,
	Epsilon: Epsilon,
	epsilon: epsilon,
	epsiv: epsiv,
	eqcirc: eqcirc,
	eqcolon: eqcolon,
	eqsim: eqsim,
	eqslantgtr: eqslantgtr,
	eqslantless: eqslantless,
	Equal: Equal,
	equals: equals,
	EqualTilde: EqualTilde,
	equest: equest,
	Equilibrium: Equilibrium,
	equiv: equiv,
	equivDD: equivDD,
	eqvparsl: eqvparsl,
	erarr: erarr,
	erDot: erDot,
	escr: escr,
	Escr: Escr,
	esdot: esdot,
	Esim: Esim,
	esim: esim,
	Eta: Eta,
	eta: eta,
	ETH: ETH,
	eth: eth,
	Euml: Euml,
	euml: euml,
	euro: euro,
	excl: excl,
	exist: exist,
	Exists: Exists,
	expectation: expectation,
	exponentiale: exponentiale,
	ExponentialE: ExponentialE,
	fallingdotseq: fallingdotseq,
	Fcy: Fcy,
	fcy: fcy,
	female: female,
	ffilig: ffilig,
	fflig: fflig,
	ffllig: ffllig,
	Ffr: Ffr,
	ffr: ffr,
	filig: filig,
	FilledSmallSquare: FilledSmallSquare,
	FilledVerySmallSquare: FilledVerySmallSquare,
	fjlig: fjlig,
	flat: flat,
	fllig: fllig,
	fltns: fltns,
	fnof: fnof,
	Fopf: Fopf,
	fopf: fopf,
	forall: forall,
	ForAll: ForAll,
	fork: fork,
	forkv: forkv,
	Fouriertrf: Fouriertrf,
	fpartint: fpartint,
	frac12: frac12,
	frac13: frac13,
	frac14: frac14,
	frac15: frac15,
	frac16: frac16,
	frac18: frac18,
	frac23: frac23,
	frac25: frac25,
	frac34: frac34,
	frac35: frac35,
	frac38: frac38,
	frac45: frac45,
	frac56: frac56,
	frac58: frac58,
	frac78: frac78,
	frasl: frasl,
	frown: frown,
	fscr: fscr,
	Fscr: Fscr,
	gacute: gacute,
	Gamma: Gamma,
	gamma: gamma,
	Gammad: Gammad,
	gammad: gammad,
	gap: gap,
	Gbreve: Gbreve,
	gbreve: gbreve,
	Gcedil: Gcedil,
	Gcirc: Gcirc,
	gcirc: gcirc,
	Gcy: Gcy,
	gcy: gcy,
	Gdot: Gdot,
	gdot: gdot,
	ge: ge,
	gE: gE,
	gEl: gEl,
	gel: gel,
	geq: geq,
	geqq: geqq,
	geqslant: geqslant,
	gescc: gescc,
	ges: ges,
	gesdot: gesdot,
	gesdoto: gesdoto,
	gesdotol: gesdotol,
	gesl: gesl,
	gesles: gesles,
	Gfr: Gfr,
	gfr: gfr,
	gg: gg,
	Gg: Gg,
	ggg: ggg,
	gimel: gimel,
	GJcy: GJcy,
	gjcy: gjcy,
	gla: gla,
	gl: gl,
	glE: glE,
	glj: glj,
	gnap: gnap,
	gnapprox: gnapprox,
	gne: gne,
	gnE: gnE,
	gneq: gneq,
	gneqq: gneqq,
	gnsim: gnsim,
	Gopf: Gopf,
	gopf: gopf,
	grave: grave,
	GreaterEqual: GreaterEqual,
	GreaterEqualLess: GreaterEqualLess,
	GreaterFullEqual: GreaterFullEqual,
	GreaterGreater: GreaterGreater,
	GreaterLess: GreaterLess,
	GreaterSlantEqual: GreaterSlantEqual,
	GreaterTilde: GreaterTilde,
	Gscr: Gscr,
	gscr: gscr,
	gsim: gsim,
	gsime: gsime,
	gsiml: gsiml,
	gtcc: gtcc,
	gtcir: gtcir,
	gt: gt$1,
	GT: GT,
	Gt: Gt,
	gtdot: gtdot,
	gtlPar: gtlPar,
	gtquest: gtquest,
	gtrapprox: gtrapprox,
	gtrarr: gtrarr,
	gtrdot: gtrdot,
	gtreqless: gtreqless,
	gtreqqless: gtreqqless,
	gtrless: gtrless,
	gtrsim: gtrsim,
	gvertneqq: gvertneqq,
	gvnE: gvnE,
	Hacek: Hacek,
	hairsp: hairsp,
	half: half,
	hamilt: hamilt,
	HARDcy: HARDcy,
	hardcy: hardcy,
	harrcir: harrcir,
	harr: harr,
	hArr: hArr,
	harrw: harrw,
	Hat: Hat,
	hbar: hbar,
	Hcirc: Hcirc,
	hcirc: hcirc,
	hearts: hearts,
	heartsuit: heartsuit,
	hellip: hellip,
	hercon: hercon,
	hfr: hfr,
	Hfr: Hfr,
	HilbertSpace: HilbertSpace,
	hksearow: hksearow,
	hkswarow: hkswarow,
	hoarr: hoarr,
	homtht: homtht,
	hookleftarrow: hookleftarrow,
	hookrightarrow: hookrightarrow,
	hopf: hopf,
	Hopf: Hopf,
	horbar: horbar,
	HorizontalLine: HorizontalLine,
	hscr: hscr,
	Hscr: Hscr,
	hslash: hslash,
	Hstrok: Hstrok,
	hstrok: hstrok,
	HumpDownHump: HumpDownHump,
	HumpEqual: HumpEqual,
	hybull: hybull,
	hyphen: hyphen,
	Iacute: Iacute,
	iacute: iacute,
	ic: ic,
	Icirc: Icirc,
	icirc: icirc,
	Icy: Icy,
	icy: icy,
	Idot: Idot,
	IEcy: IEcy,
	iecy: iecy,
	iexcl: iexcl,
	iff: iff,
	ifr: ifr,
	Ifr: Ifr,
	Igrave: Igrave,
	igrave: igrave,
	ii: ii,
	iiiint: iiiint,
	iiint: iiint,
	iinfin: iinfin,
	iiota: iiota,
	IJlig: IJlig,
	ijlig: ijlig,
	Imacr: Imacr,
	imacr: imacr,
	image: image$3,
	ImaginaryI: ImaginaryI,
	imagline: imagline,
	imagpart: imagpart,
	imath: imath,
	Im: Im,
	imof: imof,
	imped: imped,
	Implies: Implies,
	incare: incare,
	"in": "∈",
	infin: infin,
	infintie: infintie,
	inodot: inodot,
	intcal: intcal,
	int: int,
	Int: Int,
	integers: integers,
	Integral: Integral,
	intercal: intercal,
	Intersection: Intersection,
	intlarhk: intlarhk,
	intprod: intprod,
	InvisibleComma: InvisibleComma,
	InvisibleTimes: InvisibleTimes,
	IOcy: IOcy,
	iocy: iocy,
	Iogon: Iogon,
	iogon: iogon,
	Iopf: Iopf,
	iopf: iopf,
	Iota: Iota,
	iota: iota,
	iprod: iprod,
	iquest: iquest,
	iscr: iscr,
	Iscr: Iscr,
	isin: isin,
	isindot: isindot,
	isinE: isinE,
	isins: isins,
	isinsv: isinsv,
	isinv: isinv,
	it: it,
	Itilde: Itilde,
	itilde: itilde,
	Iukcy: Iukcy,
	iukcy: iukcy,
	Iuml: Iuml,
	iuml: iuml,
	Jcirc: Jcirc,
	jcirc: jcirc,
	Jcy: Jcy,
	jcy: jcy,
	Jfr: Jfr,
	jfr: jfr,
	jmath: jmath,
	Jopf: Jopf,
	jopf: jopf,
	Jscr: Jscr,
	jscr: jscr,
	Jsercy: Jsercy,
	jsercy: jsercy,
	Jukcy: Jukcy,
	jukcy: jukcy,
	Kappa: Kappa,
	kappa: kappa,
	kappav: kappav,
	Kcedil: Kcedil,
	kcedil: kcedil,
	Kcy: Kcy,
	kcy: kcy,
	Kfr: Kfr,
	kfr: kfr,
	kgreen: kgreen,
	KHcy: KHcy,
	khcy: khcy,
	KJcy: KJcy,
	kjcy: kjcy,
	Kopf: Kopf,
	kopf: kopf,
	Kscr: Kscr,
	kscr: kscr,
	lAarr: lAarr,
	Lacute: Lacute,
	lacute: lacute,
	laemptyv: laemptyv,
	lagran: lagran,
	Lambda: Lambda,
	lambda: lambda,
	lang: lang,
	Lang: Lang,
	langd: langd,
	langle: langle,
	lap: lap,
	Laplacetrf: Laplacetrf,
	laquo: laquo,
	larrb: larrb,
	larrbfs: larrbfs,
	larr: larr,
	Larr: Larr,
	lArr: lArr,
	larrfs: larrfs,
	larrhk: larrhk,
	larrlp: larrlp,
	larrpl: larrpl,
	larrsim: larrsim,
	larrtl: larrtl,
	latail: latail,
	lAtail: lAtail,
	lat: lat,
	late: late,
	lates: lates,
	lbarr: lbarr,
	lBarr: lBarr,
	lbbrk: lbbrk,
	lbrace: lbrace,
	lbrack: lbrack,
	lbrke: lbrke,
	lbrksld: lbrksld,
	lbrkslu: lbrkslu,
	Lcaron: Lcaron,
	lcaron: lcaron,
	Lcedil: Lcedil,
	lcedil: lcedil,
	lceil: lceil,
	lcub: lcub,
	Lcy: Lcy,
	lcy: lcy,
	ldca: ldca,
	ldquo: ldquo,
	ldquor: ldquor,
	ldrdhar: ldrdhar,
	ldrushar: ldrushar,
	ldsh: ldsh,
	le: le,
	lE: lE,
	LeftAngleBracket: LeftAngleBracket,
	LeftArrowBar: LeftArrowBar,
	leftarrow: leftarrow,
	LeftArrow: LeftArrow,
	Leftarrow: Leftarrow,
	LeftArrowRightArrow: LeftArrowRightArrow,
	leftarrowtail: leftarrowtail,
	LeftCeiling: LeftCeiling,
	LeftDoubleBracket: LeftDoubleBracket,
	LeftDownTeeVector: LeftDownTeeVector,
	LeftDownVectorBar: LeftDownVectorBar,
	LeftDownVector: LeftDownVector,
	LeftFloor: LeftFloor,
	leftharpoondown: leftharpoondown,
	leftharpoonup: leftharpoonup,
	leftleftarrows: leftleftarrows,
	leftrightarrow: leftrightarrow,
	LeftRightArrow: LeftRightArrow,
	Leftrightarrow: Leftrightarrow,
	leftrightarrows: leftrightarrows,
	leftrightharpoons: leftrightharpoons,
	leftrightsquigarrow: leftrightsquigarrow,
	LeftRightVector: LeftRightVector,
	LeftTeeArrow: LeftTeeArrow,
	LeftTee: LeftTee,
	LeftTeeVector: LeftTeeVector,
	leftthreetimes: leftthreetimes,
	LeftTriangleBar: LeftTriangleBar,
	LeftTriangle: LeftTriangle,
	LeftTriangleEqual: LeftTriangleEqual,
	LeftUpDownVector: LeftUpDownVector,
	LeftUpTeeVector: LeftUpTeeVector,
	LeftUpVectorBar: LeftUpVectorBar,
	LeftUpVector: LeftUpVector,
	LeftVectorBar: LeftVectorBar,
	LeftVector: LeftVector,
	lEg: lEg,
	leg: leg,
	leq: leq,
	leqq: leqq,
	leqslant: leqslant,
	lescc: lescc,
	les: les,
	lesdot: lesdot,
	lesdoto: lesdoto,
	lesdotor: lesdotor,
	lesg: lesg,
	lesges: lesges,
	lessapprox: lessapprox,
	lessdot: lessdot,
	lesseqgtr: lesseqgtr,
	lesseqqgtr: lesseqqgtr,
	LessEqualGreater: LessEqualGreater,
	LessFullEqual: LessFullEqual,
	LessGreater: LessGreater,
	lessgtr: lessgtr,
	LessLess: LessLess,
	lesssim: lesssim,
	LessSlantEqual: LessSlantEqual,
	LessTilde: LessTilde,
	lfisht: lfisht,
	lfloor: lfloor,
	Lfr: Lfr,
	lfr: lfr,
	lg: lg,
	lgE: lgE,
	lHar: lHar,
	lhard: lhard,
	lharu: lharu,
	lharul: lharul,
	lhblk: lhblk,
	LJcy: LJcy,
	ljcy: ljcy,
	llarr: llarr,
	ll: ll,
	Ll: Ll,
	llcorner: llcorner,
	Lleftarrow: Lleftarrow,
	llhard: llhard,
	lltri: lltri,
	Lmidot: Lmidot,
	lmidot: lmidot,
	lmoustache: lmoustache,
	lmoust: lmoust,
	lnap: lnap,
	lnapprox: lnapprox,
	lne: lne,
	lnE: lnE,
	lneq: lneq,
	lneqq: lneqq,
	lnsim: lnsim,
	loang: loang,
	loarr: loarr,
	lobrk: lobrk,
	longleftarrow: longleftarrow,
	LongLeftArrow: LongLeftArrow,
	Longleftarrow: Longleftarrow,
	longleftrightarrow: longleftrightarrow,
	LongLeftRightArrow: LongLeftRightArrow,
	Longleftrightarrow: Longleftrightarrow,
	longmapsto: longmapsto,
	longrightarrow: longrightarrow,
	LongRightArrow: LongRightArrow,
	Longrightarrow: Longrightarrow,
	looparrowleft: looparrowleft,
	looparrowright: looparrowright,
	lopar: lopar,
	Lopf: Lopf,
	lopf: lopf,
	loplus: loplus,
	lotimes: lotimes,
	lowast: lowast,
	lowbar: lowbar,
	LowerLeftArrow: LowerLeftArrow,
	LowerRightArrow: LowerRightArrow,
	loz: loz,
	lozenge: lozenge,
	lozf: lozf,
	lpar: lpar,
	lparlt: lparlt,
	lrarr: lrarr,
	lrcorner: lrcorner,
	lrhar: lrhar,
	lrhard: lrhard,
	lrm: lrm,
	lrtri: lrtri,
	lsaquo: lsaquo,
	lscr: lscr,
	Lscr: Lscr,
	lsh: lsh,
	Lsh: Lsh,
	lsim: lsim,
	lsime: lsime,
	lsimg: lsimg,
	lsqb: lsqb,
	lsquo: lsquo,
	lsquor: lsquor,
	Lstrok: Lstrok,
	lstrok: lstrok,
	ltcc: ltcc,
	ltcir: ltcir,
	lt: lt$1,
	LT: LT,
	Lt: Lt,
	ltdot: ltdot,
	lthree: lthree,
	ltimes: ltimes,
	ltlarr: ltlarr,
	ltquest: ltquest,
	ltri: ltri,
	ltrie: ltrie,
	ltrif: ltrif,
	ltrPar: ltrPar,
	lurdshar: lurdshar,
	luruhar: luruhar,
	lvertneqq: lvertneqq,
	lvnE: lvnE,
	macr: macr,
	male: male,
	malt: malt,
	maltese: maltese,
	"Map": "⤅",
	map: map,
	mapsto: mapsto,
	mapstodown: mapstodown,
	mapstoleft: mapstoleft,
	mapstoup: mapstoup,
	marker: marker,
	mcomma: mcomma,
	Mcy: Mcy,
	mcy: mcy,
	mdash: mdash,
	mDDot: mDDot,
	measuredangle: measuredangle,
	MediumSpace: MediumSpace,
	Mellintrf: Mellintrf,
	Mfr: Mfr,
	mfr: mfr,
	mho: mho,
	micro: micro,
	midast: midast,
	midcir: midcir,
	mid: mid,
	middot: middot,
	minusb: minusb,
	minus: minus,
	minusd: minusd,
	minusdu: minusdu,
	MinusPlus: MinusPlus,
	mlcp: mlcp,
	mldr: mldr,
	mnplus: mnplus,
	models: models,
	Mopf: Mopf,
	mopf: mopf,
	mp: mp,
	mscr: mscr,
	Mscr: Mscr,
	mstpos: mstpos,
	Mu: Mu,
	mu: mu,
	multimap: multimap,
	mumap: mumap,
	nabla: nabla,
	Nacute: Nacute,
	nacute: nacute,
	nang: nang,
	nap: nap,
	napE: napE,
	napid: napid,
	napos: napos,
	napprox: napprox,
	natural: natural,
	naturals: naturals,
	natur: natur,
	nbsp: nbsp,
	nbump: nbump,
	nbumpe: nbumpe,
	ncap: ncap,
	Ncaron: Ncaron,
	ncaron: ncaron,
	Ncedil: Ncedil,
	ncedil: ncedil,
	ncong: ncong,
	ncongdot: ncongdot,
	ncup: ncup,
	Ncy: Ncy,
	ncy: ncy,
	ndash: ndash,
	nearhk: nearhk,
	nearr: nearr,
	neArr: neArr,
	nearrow: nearrow,
	ne: ne,
	nedot: nedot,
	NegativeMediumSpace: NegativeMediumSpace,
	NegativeThickSpace: NegativeThickSpace,
	NegativeThinSpace: NegativeThinSpace,
	NegativeVeryThinSpace: NegativeVeryThinSpace,
	nequiv: nequiv,
	nesear: nesear,
	nesim: nesim,
	NestedGreaterGreater: NestedGreaterGreater,
	NestedLessLess: NestedLessLess,
	NewLine: NewLine,
	nexist: nexist,
	nexists: nexists,
	Nfr: Nfr,
	nfr: nfr,
	ngE: ngE,
	nge: nge,
	ngeq: ngeq,
	ngeqq: ngeqq,
	ngeqslant: ngeqslant,
	nges: nges,
	nGg: nGg,
	ngsim: ngsim,
	nGt: nGt,
	ngt: ngt,
	ngtr: ngtr,
	nGtv: nGtv,
	nharr: nharr,
	nhArr: nhArr,
	nhpar: nhpar,
	ni: ni,
	nis: nis,
	nisd: nisd,
	niv: niv,
	NJcy: NJcy,
	njcy: njcy,
	nlarr: nlarr,
	nlArr: nlArr,
	nldr: nldr,
	nlE: nlE,
	nle: nle,
	nleftarrow: nleftarrow,
	nLeftarrow: nLeftarrow,
	nleftrightarrow: nleftrightarrow,
	nLeftrightarrow: nLeftrightarrow,
	nleq: nleq,
	nleqq: nleqq,
	nleqslant: nleqslant,
	nles: nles,
	nless: nless,
	nLl: nLl,
	nlsim: nlsim,
	nLt: nLt,
	nlt: nlt,
	nltri: nltri,
	nltrie: nltrie,
	nLtv: nLtv,
	nmid: nmid,
	NoBreak: NoBreak,
	NonBreakingSpace: NonBreakingSpace,
	nopf: nopf,
	Nopf: Nopf,
	Not: Not,
	not: not,
	NotCongruent: NotCongruent,
	NotCupCap: NotCupCap,
	NotDoubleVerticalBar: NotDoubleVerticalBar,
	NotElement: NotElement,
	NotEqual: NotEqual,
	NotEqualTilde: NotEqualTilde,
	NotExists: NotExists,
	NotGreater: NotGreater,
	NotGreaterEqual: NotGreaterEqual,
	NotGreaterFullEqual: NotGreaterFullEqual,
	NotGreaterGreater: NotGreaterGreater,
	NotGreaterLess: NotGreaterLess,
	NotGreaterSlantEqual: NotGreaterSlantEqual,
	NotGreaterTilde: NotGreaterTilde,
	NotHumpDownHump: NotHumpDownHump,
	NotHumpEqual: NotHumpEqual,
	notin: notin,
	notindot: notindot,
	notinE: notinE,
	notinva: notinva,
	notinvb: notinvb,
	notinvc: notinvc,
	NotLeftTriangleBar: NotLeftTriangleBar,
	NotLeftTriangle: NotLeftTriangle,
	NotLeftTriangleEqual: NotLeftTriangleEqual,
	NotLess: NotLess,
	NotLessEqual: NotLessEqual,
	NotLessGreater: NotLessGreater,
	NotLessLess: NotLessLess,
	NotLessSlantEqual: NotLessSlantEqual,
	NotLessTilde: NotLessTilde,
	NotNestedGreaterGreater: NotNestedGreaterGreater,
	NotNestedLessLess: NotNestedLessLess,
	notni: notni,
	notniva: notniva,
	notnivb: notnivb,
	notnivc: notnivc,
	NotPrecedes: NotPrecedes,
	NotPrecedesEqual: NotPrecedesEqual,
	NotPrecedesSlantEqual: NotPrecedesSlantEqual,
	NotReverseElement: NotReverseElement,
	NotRightTriangleBar: NotRightTriangleBar,
	NotRightTriangle: NotRightTriangle,
	NotRightTriangleEqual: NotRightTriangleEqual,
	NotSquareSubset: NotSquareSubset,
	NotSquareSubsetEqual: NotSquareSubsetEqual,
	NotSquareSuperset: NotSquareSuperset,
	NotSquareSupersetEqual: NotSquareSupersetEqual,
	NotSubset: NotSubset,
	NotSubsetEqual: NotSubsetEqual,
	NotSucceeds: NotSucceeds,
	NotSucceedsEqual: NotSucceedsEqual,
	NotSucceedsSlantEqual: NotSucceedsSlantEqual,
	NotSucceedsTilde: NotSucceedsTilde,
	NotSuperset: NotSuperset,
	NotSupersetEqual: NotSupersetEqual,
	NotTilde: NotTilde,
	NotTildeEqual: NotTildeEqual,
	NotTildeFullEqual: NotTildeFullEqual,
	NotTildeTilde: NotTildeTilde,
	NotVerticalBar: NotVerticalBar,
	nparallel: nparallel,
	npar: npar,
	nparsl: nparsl,
	npart: npart,
	npolint: npolint,
	npr: npr,
	nprcue: nprcue,
	nprec: nprec,
	npreceq: npreceq,
	npre: npre,
	nrarrc: nrarrc,
	nrarr: nrarr,
	nrArr: nrArr,
	nrarrw: nrarrw,
	nrightarrow: nrightarrow,
	nRightarrow: nRightarrow,
	nrtri: nrtri,
	nrtrie: nrtrie,
	nsc: nsc,
	nsccue: nsccue,
	nsce: nsce,
	Nscr: Nscr,
	nscr: nscr,
	nshortmid: nshortmid,
	nshortparallel: nshortparallel,
	nsim: nsim,
	nsime: nsime,
	nsimeq: nsimeq,
	nsmid: nsmid,
	nspar: nspar,
	nsqsube: nsqsube,
	nsqsupe: nsqsupe,
	nsub: nsub,
	nsubE: nsubE,
	nsube: nsube,
	nsubset: nsubset,
	nsubseteq: nsubseteq,
	nsubseteqq: nsubseteqq,
	nsucc: nsucc,
	nsucceq: nsucceq,
	nsup: nsup,
	nsupE: nsupE,
	nsupe: nsupe,
	nsupset: nsupset,
	nsupseteq: nsupseteq,
	nsupseteqq: nsupseteqq,
	ntgl: ntgl,
	Ntilde: Ntilde,
	ntilde: ntilde,
	ntlg: ntlg,
	ntriangleleft: ntriangleleft,
	ntrianglelefteq: ntrianglelefteq,
	ntriangleright: ntriangleright,
	ntrianglerighteq: ntrianglerighteq,
	Nu: Nu,
	nu: nu,
	num: num,
	numero: numero,
	numsp: numsp,
	nvap: nvap,
	nvdash: nvdash,
	nvDash: nvDash,
	nVdash: nVdash,
	nVDash: nVDash,
	nvge: nvge,
	nvgt: nvgt,
	nvHarr: nvHarr,
	nvinfin: nvinfin,
	nvlArr: nvlArr,
	nvle: nvle,
	nvlt: nvlt,
	nvltrie: nvltrie,
	nvrArr: nvrArr,
	nvrtrie: nvrtrie,
	nvsim: nvsim,
	nwarhk: nwarhk,
	nwarr: nwarr,
	nwArr: nwArr,
	nwarrow: nwarrow,
	nwnear: nwnear,
	Oacute: Oacute,
	oacute: oacute,
	oast: oast,
	Ocirc: Ocirc,
	ocirc: ocirc,
	ocir: ocir,
	Ocy: Ocy,
	ocy: ocy,
	odash: odash,
	Odblac: Odblac,
	odblac: odblac,
	odiv: odiv,
	odot: odot,
	odsold: odsold,
	OElig: OElig,
	oelig: oelig,
	ofcir: ofcir,
	Ofr: Ofr,
	ofr: ofr,
	ogon: ogon,
	Ograve: Ograve,
	ograve: ograve,
	ogt: ogt,
	ohbar: ohbar,
	ohm: ohm,
	oint: oint,
	olarr: olarr,
	olcir: olcir,
	olcross: olcross,
	oline: oline,
	olt: olt,
	Omacr: Omacr,
	omacr: omacr,
	Omega: Omega,
	omega: omega,
	Omicron: Omicron,
	omicron: omicron,
	omid: omid,
	ominus: ominus,
	Oopf: Oopf,
	oopf: oopf,
	opar: opar,
	OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
	OpenCurlyQuote: OpenCurlyQuote,
	operp: operp,
	oplus: oplus,
	orarr: orarr,
	Or: Or,
	or: or,
	ord: ord,
	order: order,
	orderof: orderof,
	ordf: ordf,
	ordm: ordm,
	origof: origof,
	oror: oror,
	orslope: orslope,
	orv: orv,
	oS: oS,
	Oscr: Oscr,
	oscr: oscr,
	Oslash: Oslash,
	oslash: oslash,
	osol: osol,
	Otilde: Otilde,
	otilde: otilde,
	otimesas: otimesas,
	Otimes: Otimes,
	otimes: otimes,
	Ouml: Ouml,
	ouml: ouml,
	ovbar: ovbar,
	OverBar: OverBar,
	OverBrace: OverBrace,
	OverBracket: OverBracket,
	OverParenthesis: OverParenthesis,
	para: para,
	parallel: parallel,
	par: par,
	parsim: parsim,
	parsl: parsl,
	part: part,
	PartialD: PartialD,
	Pcy: Pcy,
	pcy: pcy,
	percnt: percnt,
	period: period,
	permil: permil,
	perp: perp$1,
	pertenk: pertenk,
	Pfr: Pfr,
	pfr: pfr,
	Phi: Phi,
	phi: phi,
	phiv: phiv,
	phmmat: phmmat,
	phone: phone,
	Pi: Pi,
	pi: pi,
	pitchfork: pitchfork,
	piv: piv,
	planck: planck,
	planckh: planckh,
	plankv: plankv,
	plusacir: plusacir,
	plusb: plusb,
	pluscir: pluscir,
	plus: plus,
	plusdo: plusdo,
	plusdu: plusdu,
	pluse: pluse,
	PlusMinus: PlusMinus,
	plusmn: plusmn,
	plussim: plussim,
	plustwo: plustwo,
	pm: pm,
	Poincareplane: Poincareplane,
	pointint: pointint,
	popf: popf,
	Popf: Popf,
	pound: pound,
	prap: prap,
	Pr: Pr,
	pr: pr,
	prcue: prcue,
	precapprox: precapprox,
	prec: prec,
	preccurlyeq: preccurlyeq,
	Precedes: Precedes,
	PrecedesEqual: PrecedesEqual,
	PrecedesSlantEqual: PrecedesSlantEqual,
	PrecedesTilde: PrecedesTilde,
	preceq: preceq,
	precnapprox: precnapprox,
	precneqq: precneqq,
	precnsim: precnsim,
	pre: pre,
	prE: prE,
	precsim: precsim,
	prime: prime,
	Prime: Prime,
	primes: primes,
	prnap: prnap,
	prnE: prnE,
	prnsim: prnsim,
	prod: prod,
	Product: Product,
	profalar: profalar,
	profline: profline,
	profsurf: profsurf,
	prop: prop,
	Proportional: Proportional,
	Proportion: Proportion,
	propto: propto,
	prsim: prsim,
	prurel: prurel,
	Pscr: Pscr,
	pscr: pscr,
	Psi: Psi,
	psi: psi,
	puncsp: puncsp,
	Qfr: Qfr,
	qfr: qfr,
	qint: qint,
	qopf: qopf,
	Qopf: Qopf,
	qprime: qprime,
	Qscr: Qscr,
	qscr: qscr,
	quaternions: quaternions,
	quatint: quatint,
	quest: quest,
	questeq: questeq,
	quot: quot,
	QUOT: QUOT,
	rAarr: rAarr,
	race: race,
	Racute: Racute,
	racute: racute,
	radic: radic,
	raemptyv: raemptyv,
	rang: rang,
	Rang: Rang,
	rangd: rangd,
	range: range,
	rangle: rangle,
	raquo: raquo,
	rarrap: rarrap,
	rarrb: rarrb,
	rarrbfs: rarrbfs,
	rarrc: rarrc,
	rarr: rarr,
	Rarr: Rarr,
	rArr: rArr,
	rarrfs: rarrfs,
	rarrhk: rarrhk,
	rarrlp: rarrlp,
	rarrpl: rarrpl,
	rarrsim: rarrsim,
	Rarrtl: Rarrtl,
	rarrtl: rarrtl,
	rarrw: rarrw,
	ratail: ratail,
	rAtail: rAtail,
	ratio: ratio,
	rationals: rationals,
	rbarr: rbarr,
	rBarr: rBarr,
	RBarr: RBarr,
	rbbrk: rbbrk,
	rbrace: rbrace,
	rbrack: rbrack,
	rbrke: rbrke,
	rbrksld: rbrksld,
	rbrkslu: rbrkslu,
	Rcaron: Rcaron,
	rcaron: rcaron,
	Rcedil: Rcedil,
	rcedil: rcedil,
	rceil: rceil,
	rcub: rcub,
	Rcy: Rcy,
	rcy: rcy,
	rdca: rdca,
	rdldhar: rdldhar,
	rdquo: rdquo,
	rdquor: rdquor,
	rdsh: rdsh,
	real: real,
	realine: realine,
	realpart: realpart,
	reals: reals,
	Re: Re,
	rect: rect,
	reg: reg,
	REG: REG,
	ReverseElement: ReverseElement,
	ReverseEquilibrium: ReverseEquilibrium,
	ReverseUpEquilibrium: ReverseUpEquilibrium,
	rfisht: rfisht,
	rfloor: rfloor,
	rfr: rfr,
	Rfr: Rfr,
	rHar: rHar,
	rhard: rhard,
	rharu: rharu,
	rharul: rharul,
	Rho: Rho,
	rho: rho,
	rhov: rhov,
	RightAngleBracket: RightAngleBracket,
	RightArrowBar: RightArrowBar,
	rightarrow: rightarrow,
	RightArrow: RightArrow,
	Rightarrow: Rightarrow,
	RightArrowLeftArrow: RightArrowLeftArrow,
	rightarrowtail: rightarrowtail,
	RightCeiling: RightCeiling,
	RightDoubleBracket: RightDoubleBracket,
	RightDownTeeVector: RightDownTeeVector,
	RightDownVectorBar: RightDownVectorBar,
	RightDownVector: RightDownVector,
	RightFloor: RightFloor,
	rightharpoondown: rightharpoondown,
	rightharpoonup: rightharpoonup,
	rightleftarrows: rightleftarrows,
	rightleftharpoons: rightleftharpoons,
	rightrightarrows: rightrightarrows,
	rightsquigarrow: rightsquigarrow,
	RightTeeArrow: RightTeeArrow,
	RightTee: RightTee,
	RightTeeVector: RightTeeVector,
	rightthreetimes: rightthreetimes,
	RightTriangleBar: RightTriangleBar,
	RightTriangle: RightTriangle,
	RightTriangleEqual: RightTriangleEqual,
	RightUpDownVector: RightUpDownVector,
	RightUpTeeVector: RightUpTeeVector,
	RightUpVectorBar: RightUpVectorBar,
	RightUpVector: RightUpVector,
	RightVectorBar: RightVectorBar,
	RightVector: RightVector,
	ring: ring,
	risingdotseq: risingdotseq,
	rlarr: rlarr,
	rlhar: rlhar,
	rlm: rlm,
	rmoustache: rmoustache,
	rmoust: rmoust,
	rnmid: rnmid,
	roang: roang,
	roarr: roarr,
	robrk: robrk,
	ropar: ropar,
	ropf: ropf,
	Ropf: Ropf,
	roplus: roplus,
	rotimes: rotimes,
	RoundImplies: RoundImplies,
	rpar: rpar,
	rpargt: rpargt,
	rppolint: rppolint,
	rrarr: rrarr,
	Rrightarrow: Rrightarrow,
	rsaquo: rsaquo,
	rscr: rscr,
	Rscr: Rscr,
	rsh: rsh,
	Rsh: Rsh,
	rsqb: rsqb,
	rsquo: rsquo,
	rsquor: rsquor,
	rthree: rthree,
	rtimes: rtimes,
	rtri: rtri,
	rtrie: rtrie,
	rtrif: rtrif,
	rtriltri: rtriltri,
	RuleDelayed: RuleDelayed,
	ruluhar: ruluhar,
	rx: rx,
	Sacute: Sacute,
	sacute: sacute,
	sbquo: sbquo,
	scap: scap,
	Scaron: Scaron,
	scaron: scaron,
	Sc: Sc,
	sc: sc,
	sccue: sccue,
	sce: sce,
	scE: scE,
	Scedil: Scedil,
	scedil: scedil,
	Scirc: Scirc,
	scirc: scirc,
	scnap: scnap,
	scnE: scnE,
	scnsim: scnsim,
	scpolint: scpolint,
	scsim: scsim,
	Scy: Scy,
	scy: scy,
	sdotb: sdotb,
	sdot: sdot,
	sdote: sdote,
	searhk: searhk,
	searr: searr,
	seArr: seArr,
	searrow: searrow,
	sect: sect,
	semi: semi,
	seswar: seswar,
	setminus: setminus,
	setmn: setmn,
	sext: sext,
	Sfr: Sfr,
	sfr: sfr,
	sfrown: sfrown,
	sharp: sharp,
	SHCHcy: SHCHcy,
	shchcy: shchcy,
	SHcy: SHcy,
	shcy: shcy,
	ShortDownArrow: ShortDownArrow,
	ShortLeftArrow: ShortLeftArrow,
	shortmid: shortmid,
	shortparallel: shortparallel,
	ShortRightArrow: ShortRightArrow,
	ShortUpArrow: ShortUpArrow,
	shy: shy,
	Sigma: Sigma,
	sigma: sigma,
	sigmaf: sigmaf,
	sigmav: sigmav,
	sim: sim,
	simdot: simdot,
	sime: sime,
	simeq: simeq,
	simg: simg,
	simgE: simgE,
	siml: siml,
	simlE: simlE,
	simne: simne,
	simplus: simplus,
	simrarr: simrarr,
	slarr: slarr,
	SmallCircle: SmallCircle,
	smallsetminus: smallsetminus,
	smashp: smashp,
	smeparsl: smeparsl,
	smid: smid,
	smile: smile,
	smt: smt,
	smte: smte,
	smtes: smtes,
	SOFTcy: SOFTcy,
	softcy: softcy,
	solbar: solbar,
	solb: solb,
	sol: sol,
	Sopf: Sopf,
	sopf: sopf,
	spades: spades,
	spadesuit: spadesuit,
	spar: spar,
	sqcap: sqcap,
	sqcaps: sqcaps,
	sqcup: sqcup,
	sqcups: sqcups,
	Sqrt: Sqrt,
	sqsub: sqsub,
	sqsube: sqsube,
	sqsubset: sqsubset,
	sqsubseteq: sqsubseteq,
	sqsup: sqsup,
	sqsupe: sqsupe,
	sqsupset: sqsupset,
	sqsupseteq: sqsupseteq,
	square: square,
	Square: Square,
	SquareIntersection: SquareIntersection,
	SquareSubset: SquareSubset,
	SquareSubsetEqual: SquareSubsetEqual,
	SquareSuperset: SquareSuperset,
	SquareSupersetEqual: SquareSupersetEqual,
	SquareUnion: SquareUnion,
	squarf: squarf,
	squ: squ,
	squf: squf,
	srarr: srarr,
	Sscr: Sscr,
	sscr: sscr,
	ssetmn: ssetmn,
	ssmile: ssmile,
	sstarf: sstarf,
	Star: Star,
	star: star,
	starf: starf,
	straightepsilon: straightepsilon,
	straightphi: straightphi,
	strns: strns,
	sub: sub,
	Sub: Sub,
	subdot: subdot,
	subE: subE,
	sube: sube,
	subedot: subedot,
	submult: submult,
	subnE: subnE,
	subne: subne,
	subplus: subplus,
	subrarr: subrarr,
	subset: subset,
	Subset: Subset,
	subseteq: subseteq,
	subseteqq: subseteqq,
	SubsetEqual: SubsetEqual,
	subsetneq: subsetneq,
	subsetneqq: subsetneqq,
	subsim: subsim,
	subsub: subsub,
	subsup: subsup,
	succapprox: succapprox,
	succ: succ,
	succcurlyeq: succcurlyeq,
	Succeeds: Succeeds,
	SucceedsEqual: SucceedsEqual,
	SucceedsSlantEqual: SucceedsSlantEqual,
	SucceedsTilde: SucceedsTilde,
	succeq: succeq,
	succnapprox: succnapprox,
	succneqq: succneqq,
	succnsim: succnsim,
	succsim: succsim,
	SuchThat: SuchThat,
	sum: sum,
	Sum: Sum,
	sung: sung,
	sup1: sup1,
	sup2: sup2,
	sup3: sup3,
	sup: sup,
	Sup: Sup,
	supdot: supdot,
	supdsub: supdsub,
	supE: supE,
	supe: supe,
	supedot: supedot,
	Superset: Superset,
	SupersetEqual: SupersetEqual,
	suphsol: suphsol,
	suphsub: suphsub,
	suplarr: suplarr,
	supmult: supmult,
	supnE: supnE,
	supne: supne,
	supplus: supplus,
	supset: supset,
	Supset: Supset,
	supseteq: supseteq,
	supseteqq: supseteqq,
	supsetneq: supsetneq,
	supsetneqq: supsetneqq,
	supsim: supsim,
	supsub: supsub,
	supsup: supsup,
	swarhk: swarhk,
	swarr: swarr,
	swArr: swArr,
	swarrow: swarrow,
	swnwar: swnwar,
	szlig: szlig,
	Tab: Tab,
	target: target,
	Tau: Tau,
	tau: tau,
	tbrk: tbrk,
	Tcaron: Tcaron,
	tcaron: tcaron,
	Tcedil: Tcedil,
	tcedil: tcedil,
	Tcy: Tcy,
	tcy: tcy,
	tdot: tdot,
	telrec: telrec,
	Tfr: Tfr,
	tfr: tfr,
	there4: there4,
	therefore: therefore,
	Therefore: Therefore,
	Theta: Theta,
	theta: theta,
	thetasym: thetasym,
	thetav: thetav,
	thickapprox: thickapprox,
	thicksim: thicksim,
	ThickSpace: ThickSpace,
	ThinSpace: ThinSpace,
	thinsp: thinsp,
	thkap: thkap,
	thksim: thksim,
	THORN: THORN,
	thorn: thorn,
	tilde: tilde,
	Tilde: Tilde,
	TildeEqual: TildeEqual,
	TildeFullEqual: TildeFullEqual,
	TildeTilde: TildeTilde,
	timesbar: timesbar,
	timesb: timesb,
	times: times,
	timesd: timesd,
	tint: tint,
	toea: toea,
	topbot: topbot,
	topcir: topcir,
	top: top,
	Topf: Topf,
	topf: topf,
	topfork: topfork,
	tosa: tosa,
	tprime: tprime,
	trade: trade,
	TRADE: TRADE,
	triangle: triangle,
	triangledown: triangledown,
	triangleleft: triangleleft,
	trianglelefteq: trianglelefteq,
	triangleq: triangleq,
	triangleright: triangleright,
	trianglerighteq: trianglerighteq,
	tridot: tridot,
	trie: trie,
	triminus: triminus,
	TripleDot: TripleDot,
	triplus: triplus,
	trisb: trisb,
	tritime: tritime,
	trpezium: trpezium,
	Tscr: Tscr,
	tscr: tscr,
	TScy: TScy,
	tscy: tscy,
	TSHcy: TSHcy,
	tshcy: tshcy,
	Tstrok: Tstrok,
	tstrok: tstrok,
	twixt: twixt,
	twoheadleftarrow: twoheadleftarrow,
	twoheadrightarrow: twoheadrightarrow,
	Uacute: Uacute,
	uacute: uacute,
	uarr: uarr,
	Uarr: Uarr,
	uArr: uArr,
	Uarrocir: Uarrocir,
	Ubrcy: Ubrcy,
	ubrcy: ubrcy,
	Ubreve: Ubreve,
	ubreve: ubreve,
	Ucirc: Ucirc,
	ucirc: ucirc,
	Ucy: Ucy,
	ucy: ucy,
	udarr: udarr,
	Udblac: Udblac,
	udblac: udblac,
	udhar: udhar,
	ufisht: ufisht,
	Ufr: Ufr,
	ufr: ufr,
	Ugrave: Ugrave,
	ugrave: ugrave,
	uHar: uHar,
	uharl: uharl,
	uharr: uharr,
	uhblk: uhblk,
	ulcorn: ulcorn,
	ulcorner: ulcorner,
	ulcrop: ulcrop,
	ultri: ultri,
	Umacr: Umacr,
	umacr: umacr,
	uml: uml,
	UnderBar: UnderBar,
	UnderBrace: UnderBrace,
	UnderBracket: UnderBracket,
	UnderParenthesis: UnderParenthesis,
	Union: Union,
	UnionPlus: UnionPlus,
	Uogon: Uogon,
	uogon: uogon,
	Uopf: Uopf,
	uopf: uopf,
	UpArrowBar: UpArrowBar,
	uparrow: uparrow,
	UpArrow: UpArrow,
	Uparrow: Uparrow,
	UpArrowDownArrow: UpArrowDownArrow,
	updownarrow: updownarrow,
	UpDownArrow: UpDownArrow,
	Updownarrow: Updownarrow,
	UpEquilibrium: UpEquilibrium,
	upharpoonleft: upharpoonleft,
	upharpoonright: upharpoonright,
	uplus: uplus,
	UpperLeftArrow: UpperLeftArrow,
	UpperRightArrow: UpperRightArrow,
	upsi: upsi,
	Upsi: Upsi,
	upsih: upsih,
	Upsilon: Upsilon,
	upsilon: upsilon,
	UpTeeArrow: UpTeeArrow,
	UpTee: UpTee,
	upuparrows: upuparrows,
	urcorn: urcorn,
	urcorner: urcorner,
	urcrop: urcrop,
	Uring: Uring,
	uring: uring,
	urtri: urtri,
	Uscr: Uscr,
	uscr: uscr,
	utdot: utdot,
	Utilde: Utilde,
	utilde: utilde,
	utri: utri,
	utrif: utrif,
	uuarr: uuarr,
	Uuml: Uuml,
	uuml: uuml,
	uwangle: uwangle,
	vangrt: vangrt,
	varepsilon: varepsilon,
	varkappa: varkappa,
	varnothing: varnothing,
	varphi: varphi,
	varpi: varpi,
	varpropto: varpropto,
	varr: varr,
	vArr: vArr,
	varrho: varrho,
	varsigma: varsigma,
	varsubsetneq: varsubsetneq,
	varsubsetneqq: varsubsetneqq,
	varsupsetneq: varsupsetneq,
	varsupsetneqq: varsupsetneqq,
	vartheta: vartheta,
	vartriangleleft: vartriangleleft,
	vartriangleright: vartriangleright,
	vBar: vBar,
	Vbar: Vbar,
	vBarv: vBarv,
	Vcy: Vcy,
	vcy: vcy,
	vdash: vdash,
	vDash: vDash,
	Vdash: Vdash,
	VDash: VDash,
	Vdashl: Vdashl,
	veebar: veebar,
	vee: vee,
	Vee: Vee,
	veeeq: veeeq,
	vellip: vellip,
	verbar: verbar,
	Verbar: Verbar,
	vert: vert,
	Vert: Vert,
	VerticalBar: VerticalBar,
	VerticalLine: VerticalLine,
	VerticalSeparator: VerticalSeparator,
	VerticalTilde: VerticalTilde,
	VeryThinSpace: VeryThinSpace,
	Vfr: Vfr,
	vfr: vfr,
	vltri: vltri,
	vnsub: vnsub,
	vnsup: vnsup,
	Vopf: Vopf,
	vopf: vopf,
	vprop: vprop,
	vrtri: vrtri,
	Vscr: Vscr,
	vscr: vscr,
	vsubnE: vsubnE,
	vsubne: vsubne,
	vsupnE: vsupnE,
	vsupne: vsupne,
	Vvdash: Vvdash,
	vzigzag: vzigzag,
	Wcirc: Wcirc,
	wcirc: wcirc,
	wedbar: wedbar,
	wedge: wedge,
	Wedge: Wedge,
	wedgeq: wedgeq,
	weierp: weierp,
	Wfr: Wfr,
	wfr: wfr,
	Wopf: Wopf,
	wopf: wopf,
	wp: wp,
	wr: wr,
	wreath: wreath,
	Wscr: Wscr,
	wscr: wscr,
	xcap: xcap,
	xcirc: xcirc,
	xcup: xcup,
	xdtri: xdtri,
	Xfr: Xfr,
	xfr: xfr,
	xharr: xharr,
	xhArr: xhArr,
	Xi: Xi,
	xi: xi,
	xlarr: xlarr,
	xlArr: xlArr,
	xmap: xmap,
	xnis: xnis,
	xodot: xodot,
	Xopf: Xopf,
	xopf: xopf,
	xoplus: xoplus,
	xotime: xotime,
	xrarr: xrarr,
	xrArr: xrArr,
	Xscr: Xscr,
	xscr: xscr,
	xsqcup: xsqcup,
	xuplus: xuplus,
	xutri: xutri,
	xvee: xvee,
	xwedge: xwedge,
	Yacute: Yacute,
	yacute: yacute,
	YAcy: YAcy,
	yacy: yacy,
	Ycirc: Ycirc,
	ycirc: ycirc,
	Ycy: Ycy,
	ycy: ycy,
	yen: yen,
	Yfr: Yfr,
	yfr: yfr,
	YIcy: YIcy,
	yicy: yicy,
	Yopf: Yopf,
	yopf: yopf,
	Yscr: Yscr,
	yscr: yscr,
	YUcy: YUcy,
	yucy: yucy,
	yuml: yuml,
	Yuml: Yuml,
	Zacute: Zacute,
	zacute: zacute,
	Zcaron: Zcaron,
	zcaron: zcaron,
	Zcy: Zcy,
	zcy: zcy,
	Zdot: Zdot,
	zdot: zdot,
	zeetrf: zeetrf,
	ZeroWidthSpace: ZeroWidthSpace,
	Zeta: Zeta,
	zeta: zeta,
	zfr: zfr,
	Zfr: Zfr,
	ZHcy: ZHcy,
	zhcy: zhcy,
	zigrarr: zigrarr,
	zopf: zopf,
	Zopf: Zopf,
	Zscr: Zscr,
	zscr: zscr,
	zwj: zwj,
	zwnj: zwnj
};

var hasRequiredEntities;

function requireEntities () {
	if (hasRequiredEntities) return entitiesExports;
	hasRequiredEntities = 1;
	(function (module) {

		/*eslint quotes:0*/
		module.exports = require$$0;
} (entities));
	return entitiesExports;
}

var regex$4;
var hasRequiredRegex$4;

function requireRegex$4 () {
	if (hasRequiredRegex$4) return regex$4;
	hasRequiredRegex$4 = 1;
	regex$4=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;
	return regex$4;
}

var mdurl = {};

var encode_1;
var hasRequiredEncode;

function requireEncode () {
	if (hasRequiredEncode) return encode_1;
	hasRequiredEncode = 1;


	var encodeCache = {};


	// Create a lookup array where anything but characters in `chars` string
	// and alphanumeric chars is percent-encoded.
	//
	function getEncodeCache(exclude) {
	  var i, ch, cache = encodeCache[exclude];
	  if (cache) { return cache; }

	  cache = encodeCache[exclude] = [];

	  for (i = 0; i < 128; i++) {
	    ch = String.fromCharCode(i);

	    if (/^[0-9a-z]$/i.test(ch)) {
	      // always allow unencoded alphanumeric characters
	      cache.push(ch);
	    } else {
	      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
	    }
	  }

	  for (i = 0; i < exclude.length; i++) {
	    cache[exclude.charCodeAt(i)] = exclude[i];
	  }

	  return cache;
	}


	// Encode unsafe characters with percent-encoding, skipping already
	// encoded sequences.
	//
	//  - string       - string to encode
	//  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
	//  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
	//
	function encode(string, exclude, keepEscaped) {
	  var i, l, code, nextCode, cache,
	      result = '';

	  if (typeof exclude !== 'string') {
	    // encode(string, keepEscaped)
	    keepEscaped  = exclude;
	    exclude = encode.defaultChars;
	  }

	  if (typeof keepEscaped === 'undefined') {
	    keepEscaped = true;
	  }

	  cache = getEncodeCache(exclude);

	  for (i = 0, l = string.length; i < l; i++) {
	    code = string.charCodeAt(i);

	    if (keepEscaped && code === 0x25 /* % */ && i + 2 < l) {
	      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
	        result += string.slice(i, i + 3);
	        i += 2;
	        continue;
	      }
	    }

	    if (code < 128) {
	      result += cache[code];
	      continue;
	    }

	    if (code >= 0xD800 && code <= 0xDFFF) {
	      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
	        nextCode = string.charCodeAt(i + 1);
	        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
	          result += encodeURIComponent(string[i] + string[i + 1]);
	          i++;
	          continue;
	        }
	      }
	      result += '%EF%BF%BD';
	      continue;
	    }

	    result += encodeURIComponent(string[i]);
	  }

	  return result;
	}

	encode.defaultChars   = ";/?:@&=+$,-_.!~*'()#";
	encode.componentChars = "-_.!~*'()";


	encode_1 = encode;
	return encode_1;
}

var decode_1;
var hasRequiredDecode;

function requireDecode () {
	if (hasRequiredDecode) return decode_1;
	hasRequiredDecode = 1;


	/* eslint-disable no-bitwise */

	var decodeCache = {};

	function getDecodeCache(exclude) {
	  var i, ch, cache = decodeCache[exclude];
	  if (cache) { return cache; }

	  cache = decodeCache[exclude] = [];

	  for (i = 0; i < 128; i++) {
	    ch = String.fromCharCode(i);
	    cache.push(ch);
	  }

	  for (i = 0; i < exclude.length; i++) {
	    ch = exclude.charCodeAt(i);
	    cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
	  }

	  return cache;
	}


	// Decode percent-encoded string.
	//
	function decode(string, exclude) {
	  var cache;

	  if (typeof exclude !== 'string') {
	    exclude = decode.defaultChars;
	  }

	  cache = getDecodeCache(exclude);

	  return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
	    var i, l, b1, b2, b3, b4, chr,
	        result = '';

	    for (i = 0, l = seq.length; i < l; i += 3) {
	      b1 = parseInt(seq.slice(i + 1, i + 3), 16);

	      if (b1 < 0x80) {
	        result += cache[b1];
	        continue;
	      }

	      if ((b1 & 0xE0) === 0xC0 && (i + 3 < l)) {
	        // 110xxxxx 10xxxxxx
	        b2 = parseInt(seq.slice(i + 4, i + 6), 16);

	        if ((b2 & 0xC0) === 0x80) {
	          chr = ((b1 << 6) & 0x7C0) | (b2 & 0x3F);

	          if (chr < 0x80) {
	            result += '\ufffd\ufffd';
	          } else {
	            result += String.fromCharCode(chr);
	          }

	          i += 3;
	          continue;
	        }
	      }

	      if ((b1 & 0xF0) === 0xE0 && (i + 6 < l)) {
	        // 1110xxxx 10xxxxxx 10xxxxxx
	        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
	        b3 = parseInt(seq.slice(i + 7, i + 9), 16);

	        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
	          chr = ((b1 << 12) & 0xF000) | ((b2 << 6) & 0xFC0) | (b3 & 0x3F);

	          if (chr < 0x800 || (chr >= 0xD800 && chr <= 0xDFFF)) {
	            result += '\ufffd\ufffd\ufffd';
	          } else {
	            result += String.fromCharCode(chr);
	          }

	          i += 6;
	          continue;
	        }
	      }

	      if ((b1 & 0xF8) === 0xF0 && (i + 9 < l)) {
	        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
	        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
	        b3 = parseInt(seq.slice(i + 7, i + 9), 16);
	        b4 = parseInt(seq.slice(i + 10, i + 12), 16);

	        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
	          chr = ((b1 << 18) & 0x1C0000) | ((b2 << 12) & 0x3F000) | ((b3 << 6) & 0xFC0) | (b4 & 0x3F);

	          if (chr < 0x10000 || chr > 0x10FFFF) {
	            result += '\ufffd\ufffd\ufffd\ufffd';
	          } else {
	            chr -= 0x10000;
	            result += String.fromCharCode(0xD800 + (chr >> 10), 0xDC00 + (chr & 0x3FF));
	          }

	          i += 9;
	          continue;
	        }
	      }

	      result += '\ufffd';
	    }

	    return result;
	  });
	}


	decode.defaultChars   = ';/?:@&=+$,#';
	decode.componentChars = '';


	decode_1 = decode;
	return decode_1;
}

var format$1;
var hasRequiredFormat;

function requireFormat () {
	if (hasRequiredFormat) return format$1;
	hasRequiredFormat = 1;


	format$1 = function format(url) {
	  var result = '';

	  result += url.protocol || '';
	  result += url.slashes ? '//' : '';
	  result += url.auth ? url.auth + '@' : '';

	  if (url.hostname && url.hostname.indexOf(':') !== -1) {
	    // ipv6 address
	    result += '[' + url.hostname + ']';
	  } else {
	    result += url.hostname || '';
	  }

	  result += url.port ? ':' + url.port : '';
	  result += url.pathname || '';
	  result += url.search || '';
	  result += url.hash || '';

	  return result;
	};
	return format$1;
}

var parse;
var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse;
	hasRequiredParse = 1;

	//
	// Changes from joyent/node:
	//
	// 1. No leading slash in paths,
	//    e.g. in `url.parse('http://foo?bar')` pathname is ``, not `/`
	//
	// 2. Backslashes are not replaced with slashes,
	//    so `http:\\example.org\` is treated like a relative path
	//
	// 3. Trailing colon is treated like a part of the path,
	//    i.e. in `http://example.org:foo` pathname is `:foo`
	//
	// 4. Nothing is URL-encoded in the resulting object,
	//    (in joyent/node some chars in auth and paths are encoded)
	//
	// 5. `url.parse()` does not have `parseQueryString` argument
	//
	// 6. Removed extraneous result properties: `host`, `path`, `query`, etc.,
	//    which can be constructed using other parts of the url.
	//


	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.pathname = null;
	}

	// Reference: RFC 3986, RFC 1808, RFC 2396

	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,

	    // Special case for a simple path URL
	    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = [ '<', '>', '"', '`', ' ', '\r', '\n', '\t' ],

	    // RFC 2396: characters not allowed for various reasons.
	    unwise = [ '{', '}', '|', '\\', '^', '`' ].concat(delims),

	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = [ '\'' ].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = [ '%', '/', '?', ';', '#' ].concat(autoEscape),
	    hostEndingChars = [ '/', '?', '#' ],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    /* eslint-disable no-script-url */
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    };
	    /* eslint-enable no-script-url */

	function urlParse(url, slashesDenoteHost) {
	  if (url && url instanceof Url) { return url; }

	  var u = new Url();
	  u.parse(url, slashesDenoteHost);
	  return u;
	}

	Url.prototype.parse = function(url, slashesDenoteHost) {
	  var i, l, lowerProto, hec, slashes,
	      rest = url;

	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();

	  if (!slashesDenoteHost && url.split('#').length === 1) {
	    // Try fast path regexp
	    var simplePath = simplePathPattern.exec(rest);
	    if (simplePath) {
	      this.pathname = simplePath[1];
	      if (simplePath[2]) {
	        this.search = simplePath[2];
	      }
	      return this;
	    }
	  }

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    lowerProto = proto.toLowerCase();
	    this.protocol = proto;
	    rest = rest.substr(proto.length);
	  }

	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }

	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {

	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c

	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.

	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (i = 0; i < hostEndingChars.length; i++) {
	      hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
	        hostEnd = hec;
	      }
	    }

	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = auth;
	    }

	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (i = 0; i < nonHostChars.length; i++) {
	      hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
	        hostEnd = hec;
	      }
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1) {
	      hostEnd = rest.length;
	    }

	    if (rest[hostEnd - 1] === ':') { hostEnd--; }
	    var host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    // pull out port.
	    this.parseHost(host);

	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';

	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';

	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) { continue; }
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    }

	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	    }
	  }

	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    rest = rest.slice(0, qm);
	  }
	  if (rest) { this.pathname = rest; }
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '';
	  }

	  return this;
	};

	Url.prototype.parseHost = function(host) {
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) { this.hostname = host; }
	};

	parse = urlParse;
	return parse;
}

var hasRequiredMdurl;

function requireMdurl () {
	if (hasRequiredMdurl) return mdurl;
	hasRequiredMdurl = 1;


	mdurl.encode = requireEncode();
	mdurl.decode = requireDecode();
	mdurl.format = requireFormat();
	mdurl.parse  = requireParse();
	return mdurl;
}

var uc_micro = {};

var regex$3;
var hasRequiredRegex$3;

function requireRegex$3 () {
	if (hasRequiredRegex$3) return regex$3;
	hasRequiredRegex$3 = 1;
	regex$3=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	return regex$3;
}

var regex$2;
var hasRequiredRegex$2;

function requireRegex$2 () {
	if (hasRequiredRegex$2) return regex$2;
	hasRequiredRegex$2 = 1;
	regex$2=/[\0-\x1F\x7F-\x9F]/;
	return regex$2;
}

var regex$1;
var hasRequiredRegex$1;

function requireRegex$1 () {
	if (hasRequiredRegex$1) return regex$1;
	hasRequiredRegex$1 = 1;
	regex$1=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
	return regex$1;
}

var regex;
var hasRequiredRegex;

function requireRegex () {
	if (hasRequiredRegex) return regex;
	hasRequiredRegex = 1;
	regex=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
	return regex;
}

var hasRequiredUc_micro;

function requireUc_micro () {
	if (hasRequiredUc_micro) return uc_micro;
	hasRequiredUc_micro = 1;

	uc_micro.Any = requireRegex$3();
	uc_micro.Cc  = requireRegex$2();
	uc_micro.Cf  = requireRegex$1();
	uc_micro.P   = requireRegex$4();
	uc_micro.Z   = requireRegex();
	return uc_micro;
}

var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	(function (exports) {


		function _class(obj) { return Object.prototype.toString.call(obj); }

		function isString(obj) { return _class(obj) === '[object String]'; }

		var _hasOwnProperty = Object.prototype.hasOwnProperty;

		function has(object, key) {
		  return _hasOwnProperty.call(object, key);
		}

		// Merge objects
		//
		function assign(obj /*from1, from2, from3, ...*/) {
		  var sources = Array.prototype.slice.call(arguments, 1);

		  sources.forEach(function (source) {
		    if (!source) { return; }

		    if (typeof source !== 'object') {
		      throw new TypeError(source + 'must be object');
		    }

		    Object.keys(source).forEach(function (key) {
		      obj[key] = source[key];
		    });
		  });

		  return obj;
		}

		// Remove element from array and put another array at those position.
		// Useful for some operations with tokens
		function arrayReplaceAt(src, pos, newElements) {
		  return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
		}

		////////////////////////////////////////////////////////////////////////////////

		function isValidEntityCode(c) {
		  /*eslint no-bitwise:0*/
		  // broken sequence
		  if (c >= 0xD800 && c <= 0xDFFF) { return false; }
		  // never used
		  if (c >= 0xFDD0 && c <= 0xFDEF) { return false; }
		  if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) { return false; }
		  // control codes
		  if (c >= 0x00 && c <= 0x08) { return false; }
		  if (c === 0x0B) { return false; }
		  if (c >= 0x0E && c <= 0x1F) { return false; }
		  if (c >= 0x7F && c <= 0x9F) { return false; }
		  // out of range
		  if (c > 0x10FFFF) { return false; }
		  return true;
		}

		function fromCodePoint(c) {
		  /*eslint no-bitwise:0*/
		  if (c > 0xffff) {
		    c -= 0x10000;
		    var surrogate1 = 0xd800 + (c >> 10),
		        surrogate2 = 0xdc00 + (c & 0x3ff);

		    return String.fromCharCode(surrogate1, surrogate2);
		  }
		  return String.fromCharCode(c);
		}


		var UNESCAPE_MD_RE  = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
		var ENTITY_RE       = /&([a-z#][a-z0-9]{1,31});/gi;
		var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');

		var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;

		var entities = requireEntities();

		function replaceEntityPattern(match, name) {
		  var code = 0;

		  if (has(entities, name)) {
		    return entities[name];
		  }

		  if (name.charCodeAt(0) === 0x23/* # */ && DIGITAL_ENTITY_TEST_RE.test(name)) {
		    code = name[1].toLowerCase() === 'x' ?
		      parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);

		    if (isValidEntityCode(code)) {
		      return fromCodePoint(code);
		    }
		  }

		  return match;
		}

		/*function replaceEntities(str) {
		  if (str.indexOf('&') < 0) { return str; }

		  return str.replace(ENTITY_RE, replaceEntityPattern);
		}*/

		function unescapeMd(str) {
		  if (str.indexOf('\\') < 0) { return str; }
		  return str.replace(UNESCAPE_MD_RE, '$1');
		}

		function unescapeAll(str) {
		  if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) { return str; }

		  return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
		    if (escaped) { return escaped; }
		    return replaceEntityPattern(match, entity);
		  });
		}

		////////////////////////////////////////////////////////////////////////////////

		var HTML_ESCAPE_TEST_RE = /[&<>"]/;
		var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
		var HTML_REPLACEMENTS = {
		  '&': '&amp;',
		  '<': '&lt;',
		  '>': '&gt;',
		  '"': '&quot;'
		};

		function replaceUnsafeChar(ch) {
		  return HTML_REPLACEMENTS[ch];
		}

		function escapeHtml(str) {
		  if (HTML_ESCAPE_TEST_RE.test(str)) {
		    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
		  }
		  return str;
		}

		////////////////////////////////////////////////////////////////////////////////

		var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

		function escapeRE(str) {
		  return str.replace(REGEXP_ESCAPE_RE, '\\$&');
		}

		////////////////////////////////////////////////////////////////////////////////

		function isSpace(code) {
		  switch (code) {
		    case 0x09:
		    case 0x20:
		      return true;
		  }
		  return false;
		}

		// Zs (unicode class) || [\t\f\v\r\n]
		function isWhiteSpace(code) {
		  if (code >= 0x2000 && code <= 0x200A) { return true; }
		  switch (code) {
		    case 0x09: // \t
		    case 0x0A: // \n
		    case 0x0B: // \v
		    case 0x0C: // \f
		    case 0x0D: // \r
		    case 0x20:
		    case 0xA0:
		    case 0x1680:
		    case 0x202F:
		    case 0x205F:
		    case 0x3000:
		      return true;
		  }
		  return false;
		}

		////////////////////////////////////////////////////////////////////////////////

		/*eslint-disable max-len*/
		var UNICODE_PUNCT_RE = requireRegex$4();

		// Currently without astral characters support.
		function isPunctChar(ch) {
		  return UNICODE_PUNCT_RE.test(ch);
		}


		// Markdown ASCII punctuation characters.
		//
		// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
		// http://spec.commonmark.org/0.15/#ascii-punctuation-character
		//
		// Don't confuse with unicode punctuation !!! It lacks some chars in ascii range.
		//
		function isMdAsciiPunct(ch) {
		  switch (ch) {
		    case 0x21/* ! */:
		    case 0x22/* " */:
		    case 0x23/* # */:
		    case 0x24/* $ */:
		    case 0x25/* % */:
		    case 0x26/* & */:
		    case 0x27/* ' */:
		    case 0x28/* ( */:
		    case 0x29/* ) */:
		    case 0x2A/* * */:
		    case 0x2B/* + */:
		    case 0x2C/* , */:
		    case 0x2D/* - */:
		    case 0x2E/* . */:
		    case 0x2F/* / */:
		    case 0x3A/* : */:
		    case 0x3B/* ; */:
		    case 0x3C/* < */:
		    case 0x3D/* = */:
		    case 0x3E/* > */:
		    case 0x3F/* ? */:
		    case 0x40/* @ */:
		    case 0x5B/* [ */:
		    case 0x5C/* \ */:
		    case 0x5D/* ] */:
		    case 0x5E/* ^ */:
		    case 0x5F/* _ */:
		    case 0x60/* ` */:
		    case 0x7B/* { */:
		    case 0x7C/* | */:
		    case 0x7D/* } */:
		    case 0x7E/* ~ */:
		      return true;
		    default:
		      return false;
		  }
		}

		// Hepler to unify [reference labels].
		//
		function normalizeReference(str) {
		  // Trim and collapse whitespace
		  //
		  str = str.trim().replace(/\s+/g, ' ');

		  // In node v10 'ẞ'.toLowerCase() === 'Ṿ', which is presumed to be a bug
		  // fixed in v12 (couldn't find any details).
		  //
		  // So treat this one as a special case
		  // (remove this when node v10 is no longer supported).
		  //
		  if ('ẞ'.toLowerCase() === 'Ṿ') {
		    str = str.replace(/ẞ/g, 'ß');
		  }

		  // .toLowerCase().toUpperCase() should get rid of all differences
		  // between letter variants.
		  //
		  // Simple .toLowerCase() doesn't normalize 125 code points correctly,
		  // and .toUpperCase doesn't normalize 6 of them (list of exceptions:
		  // İ, ϴ, ẞ, Ω, K, Å - those are already uppercased, but have differently
		  // uppercased versions).
		  //
		  // Here's an example showing how it happens. Lets take greek letter omega:
		  // uppercase U+0398 (Θ), U+03f4 (ϴ) and lowercase U+03b8 (θ), U+03d1 (ϑ)
		  //
		  // Unicode entries:
		  // 0398;GREEK CAPITAL LETTER THETA;Lu;0;L;;;;;N;;;;03B8;
		  // 03B8;GREEK SMALL LETTER THETA;Ll;0;L;;;;;N;;;0398;;0398
		  // 03D1;GREEK THETA SYMBOL;Ll;0;L;<compat> 03B8;;;;N;GREEK SMALL LETTER SCRIPT THETA;;0398;;0398
		  // 03F4;GREEK CAPITAL THETA SYMBOL;Lu;0;L;<compat> 0398;;;;N;;;;03B8;
		  //
		  // Case-insensitive comparison should treat all of them as equivalent.
		  //
		  // But .toLowerCase() doesn't change ϑ (it's already lowercase),
		  // and .toUpperCase() doesn't change ϴ (already uppercase).
		  //
		  // Applying first lower then upper case normalizes any character:
		  // '\u0398\u03f4\u03b8\u03d1'.toLowerCase().toUpperCase() === '\u0398\u0398\u0398\u0398'
		  //
		  // Note: this is equivalent to unicode case folding; unicode normalization
		  // is a different step that is not required here.
		  //
		  // Final result should be uppercased, because it's later stored in an object
		  // (this avoid a conflict with Object.prototype members,
		  // most notably, `__proto__`)
		  //
		  return str.toLowerCase().toUpperCase();
		}

		////////////////////////////////////////////////////////////////////////////////

		// Re-export libraries commonly used in both markdown-it and its plugins,
		// so plugins won't have to depend on them explicitly, which reduces their
		// bundled size (e.g. a browser build).
		//
		exports.lib                 = {};
		exports.lib.mdurl           = requireMdurl();
		exports.lib.ucmicro         = requireUc_micro();

		exports.assign              = assign;
		exports.isString            = isString;
		exports.has                 = has;
		exports.unescapeMd          = unescapeMd;
		exports.unescapeAll         = unescapeAll;
		exports.isValidEntityCode   = isValidEntityCode;
		exports.fromCodePoint       = fromCodePoint;
		// exports.replaceEntities     = replaceEntities;
		exports.escapeHtml          = escapeHtml;
		exports.arrayReplaceAt      = arrayReplaceAt;
		exports.isSpace             = isSpace;
		exports.isWhiteSpace        = isWhiteSpace;
		exports.isMdAsciiPunct      = isMdAsciiPunct;
		exports.isPunctChar         = isPunctChar;
		exports.escapeRE            = escapeRE;
		exports.normalizeReference  = normalizeReference;
} (utils));
	return utils;
}

var helpers = {};

var parse_link_label;
var hasRequiredParse_link_label;

function requireParse_link_label () {
	if (hasRequiredParse_link_label) return parse_link_label;
	hasRequiredParse_link_label = 1;

	parse_link_label = function parseLinkLabel(state, start, disableNested) {
	  var level, found, marker, prevPos,
	      labelEnd = -1,
	      max = state.posMax,
	      oldPos = state.pos;

	  state.pos = start + 1;
	  level = 1;

	  while (state.pos < max) {
	    marker = state.src.charCodeAt(state.pos);
	    if (marker === 0x5D /* ] */) {
	      level--;
	      if (level === 0) {
	        found = true;
	        break;
	      }
	    }

	    prevPos = state.pos;
	    state.md.inline.skipToken(state);
	    if (marker === 0x5B /* [ */) {
	      if (prevPos === state.pos - 1) {
	        // increase level if we find text `[`, which is not a part of any token
	        level++;
	      } else if (disableNested) {
	        state.pos = oldPos;
	        return -1;
	      }
	    }
	  }

	  if (found) {
	    labelEnd = state.pos;
	  }

	  // restore old state
	  state.pos = oldPos;

	  return labelEnd;
	};
	return parse_link_label;
}

var parse_link_destination;
var hasRequiredParse_link_destination;

function requireParse_link_destination () {
	if (hasRequiredParse_link_destination) return parse_link_destination;
	hasRequiredParse_link_destination = 1;


	var unescapeAll = requireUtils().unescapeAll;


	parse_link_destination = function parseLinkDestination(str, pos, max) {
	  var code, level,
	      lines = 0,
	      start = pos,
	      result = {
	        ok: false,
	        pos: 0,
	        lines: 0,
	        str: ''
	      };

	  if (str.charCodeAt(pos) === 0x3C /* < */) {
	    pos++;
	    while (pos < max) {
	      code = str.charCodeAt(pos);
	      if (code === 0x0A /* \n */) { return result; }
	      if (code === 0x3C /* < */) { return result; }
	      if (code === 0x3E /* > */) {
	        result.pos = pos + 1;
	        result.str = unescapeAll(str.slice(start + 1, pos));
	        result.ok = true;
	        return result;
	      }
	      if (code === 0x5C /* \ */ && pos + 1 < max) {
	        pos += 2;
	        continue;
	      }

	      pos++;
	    }

	    // no closing '>'
	    return result;
	  }

	  // this should be ... } else { ... branch

	  level = 0;
	  while (pos < max) {
	    code = str.charCodeAt(pos);

	    if (code === 0x20) { break; }

	    // ascii control characters
	    if (code < 0x20 || code === 0x7F) { break; }

	    if (code === 0x5C /* \ */ && pos + 1 < max) {
	      if (str.charCodeAt(pos + 1) === 0x20) { break; }
	      pos += 2;
	      continue;
	    }

	    if (code === 0x28 /* ( */) {
	      level++;
	      if (level > 32) { return result; }
	    }

	    if (code === 0x29 /* ) */) {
	      if (level === 0) { break; }
	      level--;
	    }

	    pos++;
	  }

	  if (start === pos) { return result; }
	  if (level !== 0) { return result; }

	  result.str = unescapeAll(str.slice(start, pos));
	  result.lines = lines;
	  result.pos = pos;
	  result.ok = true;
	  return result;
	};
	return parse_link_destination;
}

var parse_link_title;
var hasRequiredParse_link_title;

function requireParse_link_title () {
	if (hasRequiredParse_link_title) return parse_link_title;
	hasRequiredParse_link_title = 1;


	var unescapeAll = requireUtils().unescapeAll;


	parse_link_title = function parseLinkTitle(str, pos, max) {
	  var code,
	      marker,
	      lines = 0,
	      start = pos,
	      result = {
	        ok: false,
	        pos: 0,
	        lines: 0,
	        str: ''
	      };

	  if (pos >= max) { return result; }

	  marker = str.charCodeAt(pos);

	  if (marker !== 0x22 /* " */ && marker !== 0x27 /* ' */ && marker !== 0x28 /* ( */) { return result; }

	  pos++;

	  // if opening marker is "(", switch it to closing marker ")"
	  if (marker === 0x28) { marker = 0x29; }

	  while (pos < max) {
	    code = str.charCodeAt(pos);
	    if (code === marker) {
	      result.pos = pos + 1;
	      result.lines = lines;
	      result.str = unescapeAll(str.slice(start + 1, pos));
	      result.ok = true;
	      return result;
	    } else if (code === 0x28 /* ( */ && marker === 0x29 /* ) */) {
	      return result;
	    } else if (code === 0x0A) {
	      lines++;
	    } else if (code === 0x5C /* \ */ && pos + 1 < max) {
	      pos++;
	      if (str.charCodeAt(pos) === 0x0A) {
	        lines++;
	      }
	    }

	    pos++;
	  }

	  return result;
	};
	return parse_link_title;
}

var hasRequiredHelpers;

function requireHelpers () {
	if (hasRequiredHelpers) return helpers;
	hasRequiredHelpers = 1;


	helpers.parseLinkLabel       = requireParse_link_label();
	helpers.parseLinkDestination = requireParse_link_destination();
	helpers.parseLinkTitle       = requireParse_link_title();
	return helpers;
}

/**
 * class Renderer
 *
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 **/

var renderer;
var hasRequiredRenderer;

function requireRenderer () {
	if (hasRequiredRenderer) return renderer;
	hasRequiredRenderer = 1;


	var assign          = requireUtils().assign;
	var unescapeAll     = requireUtils().unescapeAll;
	var escapeHtml      = requireUtils().escapeHtml;


	////////////////////////////////////////////////////////////////////////////////

	var default_rules = {};


	default_rules.code_inline = function (tokens, idx, options, env, slf) {
	  var token = tokens[idx];

	  return  '<code' + slf.renderAttrs(token) + '>' +
	          escapeHtml(tokens[idx].content) +
	          '</code>';
	};


	default_rules.code_block = function (tokens, idx, options, env, slf) {
	  var token = tokens[idx];

	  return  '<pre' + slf.renderAttrs(token) + '><code>' +
	          escapeHtml(tokens[idx].content) +
	          '</code></pre>\n';
	};


	default_rules.fence = function (tokens, idx, options, env, slf) {
	  var token = tokens[idx],
	      info = token.info ? unescapeAll(token.info).trim() : '',
	      langName = '',
	      langAttrs = '',
	      highlighted, i, arr, tmpAttrs, tmpToken;

	  if (info) {
	    arr = info.split(/(\s+)/g);
	    langName = arr[0];
	    langAttrs = arr.slice(2).join('');
	  }

	  if (options.highlight) {
	    highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
	  } else {
	    highlighted = escapeHtml(token.content);
	  }

	  if (highlighted.indexOf('<pre') === 0) {
	    return highlighted + '\n';
	  }

	  // If language exists, inject class gently, without modifying original token.
	  // May be, one day we will add .deepClone() for token and simplify this part, but
	  // now we prefer to keep things local.
	  if (info) {
	    i        = token.attrIndex('class');
	    tmpAttrs = token.attrs ? token.attrs.slice() : [];

	    if (i < 0) {
	      tmpAttrs.push([ 'class', options.langPrefix + langName ]);
	    } else {
	      tmpAttrs[i] = tmpAttrs[i].slice();
	      tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
	    }

	    // Fake token just to render attributes
	    tmpToken = {
	      attrs: tmpAttrs
	    };

	    return  '<pre><code' + slf.renderAttrs(tmpToken) + '>'
	          + highlighted
	          + '</code></pre>\n';
	  }


	  return  '<pre><code' + slf.renderAttrs(token) + '>'
	        + highlighted
	        + '</code></pre>\n';
	};


	default_rules.image = function (tokens, idx, options, env, slf) {
	  var token = tokens[idx];

	  // "alt" attr MUST be set, even if empty. Because it's mandatory and
	  // should be placed on proper position for tests.
	  //
	  // Replace content with actual value

	  token.attrs[token.attrIndex('alt')][1] =
	    slf.renderInlineAsText(token.children, options, env);

	  return slf.renderToken(tokens, idx, options);
	};


	default_rules.hardbreak = function (tokens, idx, options /*, env */) {
	  return options.xhtmlOut ? '<br />\n' : '<br>\n';
	};
	default_rules.softbreak = function (tokens, idx, options /*, env */) {
	  return options.breaks ? (options.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
	};


	default_rules.text = function (tokens, idx /*, options, env */) {
	  return escapeHtml(tokens[idx].content);
	};


	default_rules.html_block = function (tokens, idx /*, options, env */) {
	  return tokens[idx].content;
	};
	default_rules.html_inline = function (tokens, idx /*, options, env */) {
	  return tokens[idx].content;
	};


	/**
	 * new Renderer()
	 *
	 * Creates new [[Renderer]] instance and fill [[Renderer#rules]] with defaults.
	 **/
	function Renderer() {

	  /**
	   * Renderer#rules -> Object
	   *
	   * Contains render rules for tokens. Can be updated and extended.
	   *
	   * ##### Example
	   *
	   * ```javascript
	   * var md = require('markdown-it')();
	   *
	   * md.renderer.rules.strong_open  = function () { return '<b>'; };
	   * md.renderer.rules.strong_close = function () { return '</b>'; };
	   *
	   * var result = md.renderInline(...);
	   * ```
	   *
	   * Each rule is called as independent static function with fixed signature:
	   *
	   * ```javascript
	   * function my_token_render(tokens, idx, options, env, renderer) {
	   *   // ...
	   *   return renderedHTML;
	   * }
	   * ```
	   *
	   * See [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js)
	   * for more details and examples.
	   **/
	  this.rules = assign({}, default_rules);
	}


	/**
	 * Renderer.renderAttrs(token) -> String
	 *
	 * Render token attributes to string.
	 **/
	Renderer.prototype.renderAttrs = function renderAttrs(token) {
	  var i, l, result;

	  if (!token.attrs) { return ''; }

	  result = '';

	  for (i = 0, l = token.attrs.length; i < l; i++) {
	    result += ' ' + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
	  }

	  return result;
	};


	/**
	 * Renderer.renderToken(tokens, idx, options) -> String
	 * - tokens (Array): list of tokens
	 * - idx (Numbed): token index to render
	 * - options (Object): params of parser instance
	 *
	 * Default token renderer. Can be overriden by custom function
	 * in [[Renderer#rules]].
	 **/
	Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
	  var nextToken,
	      result = '',
	      needLf = false,
	      token = tokens[idx];

	  // Tight list paragraphs
	  if (token.hidden) {
	    return '';
	  }

	  // Insert a newline between hidden paragraph and subsequent opening
	  // block-level tag.
	  //
	  // For example, here we should insert a newline before blockquote:
	  //  - a
	  //    >
	  //
	  if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
	    result += '\n';
	  }

	  // Add token name, e.g. `<img`
	  result += (token.nesting === -1 ? '</' : '<') + token.tag;

	  // Encode attributes, e.g. `<img src="foo"`
	  result += this.renderAttrs(token);

	  // Add a slash for self-closing tags, e.g. `<img src="foo" /`
	  if (token.nesting === 0 && options.xhtmlOut) {
	    result += ' /';
	  }

	  // Check if we need to add a newline after this tag
	  if (token.block) {
	    needLf = true;

	    if (token.nesting === 1) {
	      if (idx + 1 < tokens.length) {
	        nextToken = tokens[idx + 1];

	        if (nextToken.type === 'inline' || nextToken.hidden) {
	          // Block-level tag containing an inline tag.
	          //
	          needLf = false;

	        } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
	          // Opening tag + closing tag of the same type. E.g. `<li></li>`.
	          //
	          needLf = false;
	        }
	      }
	    }
	  }

	  result += needLf ? '>\n' : '>';

	  return result;
	};


	/**
	 * Renderer.renderInline(tokens, options, env) -> String
	 * - tokens (Array): list on block tokens to render
	 * - options (Object): params of parser instance
	 * - env (Object): additional data from parsed input (references, for example)
	 *
	 * The same as [[Renderer.render]], but for single token of `inline` type.
	 **/
	Renderer.prototype.renderInline = function (tokens, options, env) {
	  var type,
	      result = '',
	      rules = this.rules;

	  for (var i = 0, len = tokens.length; i < len; i++) {
	    type = tokens[i].type;

	    if (typeof rules[type] !== 'undefined') {
	      result += rules[type](tokens, i, options, env, this);
	    } else {
	      result += this.renderToken(tokens, i, options);
	    }
	  }

	  return result;
	};


	/** internal
	 * Renderer.renderInlineAsText(tokens, options, env) -> String
	 * - tokens (Array): list on block tokens to render
	 * - options (Object): params of parser instance
	 * - env (Object): additional data from parsed input (references, for example)
	 *
	 * Special kludge for image `alt` attributes to conform CommonMark spec.
	 * Don't try to use it! Spec requires to show `alt` content with stripped markup,
	 * instead of simple escaping.
	 **/
	Renderer.prototype.renderInlineAsText = function (tokens, options, env) {
	  var result = '';

	  for (var i = 0, len = tokens.length; i < len; i++) {
	    if (tokens[i].type === 'text') {
	      result += tokens[i].content;
	    } else if (tokens[i].type === 'image') {
	      result += this.renderInlineAsText(tokens[i].children, options, env);
	    } else if (tokens[i].type === 'softbreak') {
	      result += '\n';
	    }
	  }

	  return result;
	};


	/**
	 * Renderer.render(tokens, options, env) -> String
	 * - tokens (Array): list on block tokens to render
	 * - options (Object): params of parser instance
	 * - env (Object): additional data from parsed input (references, for example)
	 *
	 * Takes token stream and generates HTML. Probably, you will never need to call
	 * this method directly.
	 **/
	Renderer.prototype.render = function (tokens, options, env) {
	  var i, len, type,
	      result = '',
	      rules = this.rules;

	  for (i = 0, len = tokens.length; i < len; i++) {
	    type = tokens[i].type;

	    if (type === 'inline') {
	      result += this.renderInline(tokens[i].children, options, env);
	    } else if (typeof rules[type] !== 'undefined') {
	      result += rules[tokens[i].type](tokens, i, options, env, this);
	    } else {
	      result += this.renderToken(tokens, i, options, env);
	    }
	  }

	  return result;
	};

	renderer = Renderer;
	return renderer;
}

/**
 * class Ruler
 *
 * Helper class, used by [[MarkdownIt#core]], [[MarkdownIt#block]] and
 * [[MarkdownIt#inline]] to manage sequences of functions (rules):
 *
 * - keep rules in defined order
 * - assign the name to each rule
 * - enable/disable rules
 * - add/replace rules
 * - allow assign rules to additional named chains (in the same)
 * - cacheing lists of active rules
 *
 * You will not need use this class directly until write plugins. For simple
 * rules control use [[MarkdownIt.disable]], [[MarkdownIt.enable]] and
 * [[MarkdownIt.use]].
 **/

var ruler;
var hasRequiredRuler;

function requireRuler () {
	if (hasRequiredRuler) return ruler;
	hasRequiredRuler = 1;


	/**
	 * new Ruler()
	 **/
	function Ruler() {
	  // List of added rules. Each element is:
	  //
	  // {
	  //   name: XXX,
	  //   enabled: Boolean,
	  //   fn: Function(),
	  //   alt: [ name2, name3 ]
	  // }
	  //
	  this.__rules__ = [];

	  // Cached rule chains.
	  //
	  // First level - chain name, '' for default.
	  // Second level - diginal anchor for fast filtering by charcodes.
	  //
	  this.__cache__ = null;
	}

	////////////////////////////////////////////////////////////////////////////////
	// Helper methods, should not be used directly


	// Find rule index by name
	//
	Ruler.prototype.__find__ = function (name) {
	  for (var i = 0; i < this.__rules__.length; i++) {
	    if (this.__rules__[i].name === name) {
	      return i;
	    }
	  }
	  return -1;
	};


	// Build rules lookup cache
	//
	Ruler.prototype.__compile__ = function () {
	  var self = this;
	  var chains = [ '' ];

	  // collect unique names
	  self.__rules__.forEach(function (rule) {
	    if (!rule.enabled) { return; }

	    rule.alt.forEach(function (altName) {
	      if (chains.indexOf(altName) < 0) {
	        chains.push(altName);
	      }
	    });
	  });

	  self.__cache__ = {};

	  chains.forEach(function (chain) {
	    self.__cache__[chain] = [];
	    self.__rules__.forEach(function (rule) {
	      if (!rule.enabled) { return; }

	      if (chain && rule.alt.indexOf(chain) < 0) { return; }

	      self.__cache__[chain].push(rule.fn);
	    });
	  });
	};


	/**
	 * Ruler.at(name, fn [, options])
	 * - name (String): rule name to replace.
	 * - fn (Function): new rule function.
	 * - options (Object): new rule options (not mandatory).
	 *
	 * Replace rule by name with new function & options. Throws error if name not
	 * found.
	 *
	 * ##### Options:
	 *
	 * - __alt__ - array with names of "alternate" chains.
	 *
	 * ##### Example
	 *
	 * Replace existing typographer replacement rule with new one:
	 *
	 * ```javascript
	 * var md = require('markdown-it')();
	 *
	 * md.core.ruler.at('replacements', function replace(state) {
	 *   //...
	 * });
	 * ```
	 **/
	Ruler.prototype.at = function (name, fn, options) {
	  var index = this.__find__(name);
	  var opt = options || {};

	  if (index === -1) { throw new Error('Parser rule not found: ' + name); }

	  this.__rules__[index].fn = fn;
	  this.__rules__[index].alt = opt.alt || [];
	  this.__cache__ = null;
	};


	/**
	 * Ruler.before(beforeName, ruleName, fn [, options])
	 * - beforeName (String): new rule will be added before this one.
	 * - ruleName (String): name of added rule.
	 * - fn (Function): rule function.
	 * - options (Object): rule options (not mandatory).
	 *
	 * Add new rule to chain before one with given name. See also
	 * [[Ruler.after]], [[Ruler.push]].
	 *
	 * ##### Options:
	 *
	 * - __alt__ - array with names of "alternate" chains.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * var md = require('markdown-it')();
	 *
	 * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
	 *   //...
	 * });
	 * ```
	 **/
	Ruler.prototype.before = function (beforeName, ruleName, fn, options) {
	  var index = this.__find__(beforeName);
	  var opt = options || {};

	  if (index === -1) { throw new Error('Parser rule not found: ' + beforeName); }

	  this.__rules__.splice(index, 0, {
	    name: ruleName,
	    enabled: true,
	    fn: fn,
	    alt: opt.alt || []
	  });

	  this.__cache__ = null;
	};


	/**
	 * Ruler.after(afterName, ruleName, fn [, options])
	 * - afterName (String): new rule will be added after this one.
	 * - ruleName (String): name of added rule.
	 * - fn (Function): rule function.
	 * - options (Object): rule options (not mandatory).
	 *
	 * Add new rule to chain after one with given name. See also
	 * [[Ruler.before]], [[Ruler.push]].
	 *
	 * ##### Options:
	 *
	 * - __alt__ - array with names of "alternate" chains.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * var md = require('markdown-it')();
	 *
	 * md.inline.ruler.after('text', 'my_rule', function replace(state) {
	 *   //...
	 * });
	 * ```
	 **/
	Ruler.prototype.after = function (afterName, ruleName, fn, options) {
	  var index = this.__find__(afterName);
	  var opt = options || {};

	  if (index === -1) { throw new Error('Parser rule not found: ' + afterName); }

	  this.__rules__.splice(index + 1, 0, {
	    name: ruleName,
	    enabled: true,
	    fn: fn,
	    alt: opt.alt || []
	  });

	  this.__cache__ = null;
	};

	/**
	 * Ruler.push(ruleName, fn [, options])
	 * - ruleName (String): name of added rule.
	 * - fn (Function): rule function.
	 * - options (Object): rule options (not mandatory).
	 *
	 * Push new rule to the end of chain. See also
	 * [[Ruler.before]], [[Ruler.after]].
	 *
	 * ##### Options:
	 *
	 * - __alt__ - array with names of "alternate" chains.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * var md = require('markdown-it')();
	 *
	 * md.core.ruler.push('my_rule', function replace(state) {
	 *   //...
	 * });
	 * ```
	 **/
	Ruler.prototype.push = function (ruleName, fn, options) {
	  var opt = options || {};

	  this.__rules__.push({
	    name: ruleName,
	    enabled: true,
	    fn: fn,
	    alt: opt.alt || []
	  });

	  this.__cache__ = null;
	};


	/**
	 * Ruler.enable(list [, ignoreInvalid]) -> Array
	 * - list (String|Array): list of rule names to enable.
	 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
	 *
	 * Enable rules with given names. If any rule name not found - throw Error.
	 * Errors can be disabled by second param.
	 *
	 * Returns list of found rule names (if no exception happened).
	 *
	 * See also [[Ruler.disable]], [[Ruler.enableOnly]].
	 **/
	Ruler.prototype.enable = function (list, ignoreInvalid) {
	  if (!Array.isArray(list)) { list = [ list ]; }

	  var result = [];

	  // Search by name and enable
	  list.forEach(function (name) {
	    var idx = this.__find__(name);

	    if (idx < 0) {
	      if (ignoreInvalid) { return; }
	      throw new Error('Rules manager: invalid rule name ' + name);
	    }
	    this.__rules__[idx].enabled = true;
	    result.push(name);
	  }, this);

	  this.__cache__ = null;
	  return result;
	};


	/**
	 * Ruler.enableOnly(list [, ignoreInvalid])
	 * - list (String|Array): list of rule names to enable (whitelist).
	 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
	 *
	 * Enable rules with given names, and disable everything else. If any rule name
	 * not found - throw Error. Errors can be disabled by second param.
	 *
	 * See also [[Ruler.disable]], [[Ruler.enable]].
	 **/
	Ruler.prototype.enableOnly = function (list, ignoreInvalid) {
	  if (!Array.isArray(list)) { list = [ list ]; }

	  this.__rules__.forEach(function (rule) { rule.enabled = false; });

	  this.enable(list, ignoreInvalid);
	};


	/**
	 * Ruler.disable(list [, ignoreInvalid]) -> Array
	 * - list (String|Array): list of rule names to disable.
	 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
	 *
	 * Disable rules with given names. If any rule name not found - throw Error.
	 * Errors can be disabled by second param.
	 *
	 * Returns list of found rule names (if no exception happened).
	 *
	 * See also [[Ruler.enable]], [[Ruler.enableOnly]].
	 **/
	Ruler.prototype.disable = function (list, ignoreInvalid) {
	  if (!Array.isArray(list)) { list = [ list ]; }

	  var result = [];

	  // Search by name and disable
	  list.forEach(function (name) {
	    var idx = this.__find__(name);

	    if (idx < 0) {
	      if (ignoreInvalid) { return; }
	      throw new Error('Rules manager: invalid rule name ' + name);
	    }
	    this.__rules__[idx].enabled = false;
	    result.push(name);
	  }, this);

	  this.__cache__ = null;
	  return result;
	};


	/**
	 * Ruler.getRules(chainName) -> Array
	 *
	 * Return array of active functions (rules) for given chain name. It analyzes
	 * rules configuration, compiles caches if not exists and returns result.
	 *
	 * Default chain name is `''` (empty string). It can't be skipped. That's
	 * done intentionally, to keep signature monomorphic for high speed.
	 **/
	Ruler.prototype.getRules = function (chainName) {
	  if (this.__cache__ === null) {
	    this.__compile__();
	  }

	  // Chain can be empty, if rules disabled. But we still have to return Array.
	  return this.__cache__[chainName] || [];
	};

	ruler = Ruler;
	return ruler;
}

var normalize;
var hasRequiredNormalize;

function requireNormalize () {
	if (hasRequiredNormalize) return normalize;
	hasRequiredNormalize = 1;


	// https://spec.commonmark.org/0.29/#line-ending
	var NEWLINES_RE  = /\r\n?|\n/g;
	var NULL_RE      = /\0/g;


	normalize = function normalize(state) {
	  var str;

	  // Normalize newlines
	  str = state.src.replace(NEWLINES_RE, '\n');

	  // Replace NULL characters
	  str = str.replace(NULL_RE, '\uFFFD');

	  state.src = str;
	};
	return normalize;
}

var block;
var hasRequiredBlock;

function requireBlock () {
	if (hasRequiredBlock) return block;
	hasRequiredBlock = 1;


	block = function block(state) {
	  var token;

	  if (state.inlineMode) {
	    token          = new state.Token('inline', '', 0);
	    token.content  = state.src;
	    token.map      = [ 0, 1 ];
	    token.children = [];
	    state.tokens.push(token);
	  } else {
	    state.md.block.parse(state.src, state.md, state.env, state.tokens);
	  }
	};
	return block;
}

var inline;
var hasRequiredInline;

function requireInline () {
	if (hasRequiredInline) return inline;
	hasRequiredInline = 1;

	inline = function inline(state) {
	  var tokens = state.tokens, tok, i, l;

	  // Parse inlines
	  for (i = 0, l = tokens.length; i < l; i++) {
	    tok = tokens[i];
	    if (tok.type === 'inline') {
	      state.md.inline.parse(tok.content, state.md, state.env, tok.children);
	    }
	  }
	};
	return inline;
}

var linkify$1;
var hasRequiredLinkify$1;

function requireLinkify$1 () {
	if (hasRequiredLinkify$1) return linkify$1;
	hasRequiredLinkify$1 = 1;


	var arrayReplaceAt = requireUtils().arrayReplaceAt;


	function isLinkOpen(str) {
	  return /^<a[>\s]/i.test(str);
	}
	function isLinkClose(str) {
	  return /^<\/a\s*>/i.test(str);
	}


	linkify$1 = function linkify(state) {
	  var i, j, l, tokens, token, currentToken, nodes, ln, text, pos, lastPos,
	      level, htmlLinkLevel, url, fullUrl, urlText,
	      blockTokens = state.tokens,
	      links;

	  if (!state.md.options.linkify) { return; }

	  for (j = 0, l = blockTokens.length; j < l; j++) {
	    if (blockTokens[j].type !== 'inline' ||
	        !state.md.linkify.pretest(blockTokens[j].content)) {
	      continue;
	    }

	    tokens = blockTokens[j].children;

	    htmlLinkLevel = 0;

	    // We scan from the end, to keep position when new tags added.
	    // Use reversed logic in links start/end match
	    for (i = tokens.length - 1; i >= 0; i--) {
	      currentToken = tokens[i];

	      // Skip content of markdown links
	      if (currentToken.type === 'link_close') {
	        i--;
	        while (tokens[i].level !== currentToken.level && tokens[i].type !== 'link_open') {
	          i--;
	        }
	        continue;
	      }

	      // Skip content of html tag links
	      if (currentToken.type === 'html_inline') {
	        if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
	          htmlLinkLevel--;
	        }
	        if (isLinkClose(currentToken.content)) {
	          htmlLinkLevel++;
	        }
	      }
	      if (htmlLinkLevel > 0) { continue; }

	      if (currentToken.type === 'text' && state.md.linkify.test(currentToken.content)) {

	        text = currentToken.content;
	        links = state.md.linkify.match(text);

	        // Now split string to nodes
	        nodes = [];
	        level = currentToken.level;
	        lastPos = 0;

	        // forbid escape sequence at the start of the string,
	        // this avoids http\://example.com/ from being linkified as
	        // http:<a href="//example.com/">//example.com/</a>
	        if (links.length > 0 &&
	            links[0].index === 0 &&
	            i > 0 &&
	            tokens[i - 1].type === 'text_special') {
	          links = links.slice(1);
	        }

	        for (ln = 0; ln < links.length; ln++) {
	          url = links[ln].url;
	          fullUrl = state.md.normalizeLink(url);
	          if (!state.md.validateLink(fullUrl)) { continue; }

	          urlText = links[ln].text;

	          // Linkifier might send raw hostnames like "example.com", where url
	          // starts with domain name. So we prepend http:// in those cases,
	          // and remove it afterwards.
	          //
	          if (!links[ln].schema) {
	            urlText = state.md.normalizeLinkText('http://' + urlText).replace(/^http:\/\//, '');
	          } else if (links[ln].schema === 'mailto:' && !/^mailto:/i.test(urlText)) {
	            urlText = state.md.normalizeLinkText('mailto:' + urlText).replace(/^mailto:/, '');
	          } else {
	            urlText = state.md.normalizeLinkText(urlText);
	          }

	          pos = links[ln].index;

	          if (pos > lastPos) {
	            token         = new state.Token('text', '', 0);
	            token.content = text.slice(lastPos, pos);
	            token.level   = level;
	            nodes.push(token);
	          }

	          token         = new state.Token('link_open', 'a', 1);
	          token.attrs   = [ [ 'href', fullUrl ] ];
	          token.level   = level++;
	          token.markup  = 'linkify';
	          token.info    = 'auto';
	          nodes.push(token);

	          token         = new state.Token('text', '', 0);
	          token.content = urlText;
	          token.level   = level;
	          nodes.push(token);

	          token         = new state.Token('link_close', 'a', -1);
	          token.level   = --level;
	          token.markup  = 'linkify';
	          token.info    = 'auto';
	          nodes.push(token);

	          lastPos = links[ln].lastIndex;
	        }
	        if (lastPos < text.length) {
	          token         = new state.Token('text', '', 0);
	          token.content = text.slice(lastPos);
	          token.level   = level;
	          nodes.push(token);
	        }

	        // replace current node
	        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
	      }
	    }
	  }
	};
	return linkify$1;
}

var replacements;
var hasRequiredReplacements;

function requireReplacements () {
	if (hasRequiredReplacements) return replacements;
	hasRequiredReplacements = 1;

	// TODO:
	// - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
	// - multiplications 2 x 4 -> 2 × 4

	var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;

	// Workaround for phantomjs - need regex without /g flag,
	// or root check will fail every second time
	var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;

	var SCOPED_ABBR_RE = /\((c|tm|r)\)/ig;
	var SCOPED_ABBR = {
	  c: '©',
	  r: '®',
	  tm: '™'
	};

	function replaceFn(match, name) {
	  return SCOPED_ABBR[name.toLowerCase()];
	}

	function replace_scoped(inlineTokens) {
	  var i, token, inside_autolink = 0;

	  for (i = inlineTokens.length - 1; i >= 0; i--) {
	    token = inlineTokens[i];

	    if (token.type === 'text' && !inside_autolink) {
	      token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
	    }

	    if (token.type === 'link_open' && token.info === 'auto') {
	      inside_autolink--;
	    }

	    if (token.type === 'link_close' && token.info === 'auto') {
	      inside_autolink++;
	    }
	  }
	}

	function replace_rare(inlineTokens) {
	  var i, token, inside_autolink = 0;

	  for (i = inlineTokens.length - 1; i >= 0; i--) {
	    token = inlineTokens[i];

	    if (token.type === 'text' && !inside_autolink) {
	      if (RARE_RE.test(token.content)) {
	        token.content = token.content
	          .replace(/\+-/g, '±')
	          // .., ..., ....... -> …
	          // but ?..... & !..... -> ?.. & !..
	          .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..')
	          .replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',')
	          // em-dash
	          .replace(/(^|[^-])---(?=[^-]|$)/mg, '$1\u2014')
	          // en-dash
	          .replace(/(^|\s)--(?=\s|$)/mg, '$1\u2013')
	          .replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, '$1\u2013');
	      }
	    }

	    if (token.type === 'link_open' && token.info === 'auto') {
	      inside_autolink--;
	    }

	    if (token.type === 'link_close' && token.info === 'auto') {
	      inside_autolink++;
	    }
	  }
	}


	replacements = function replace(state) {
	  var blkIdx;

	  if (!state.md.options.typographer) { return; }

	  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

	    if (state.tokens[blkIdx].type !== 'inline') { continue; }

	    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
	      replace_scoped(state.tokens[blkIdx].children);
	    }

	    if (RARE_RE.test(state.tokens[blkIdx].content)) {
	      replace_rare(state.tokens[blkIdx].children);
	    }

	  }
	};
	return replacements;
}

var smartquotes;
var hasRequiredSmartquotes;

function requireSmartquotes () {
	if (hasRequiredSmartquotes) return smartquotes;
	hasRequiredSmartquotes = 1;


	var isWhiteSpace   = requireUtils().isWhiteSpace;
	var isPunctChar    = requireUtils().isPunctChar;
	var isMdAsciiPunct = requireUtils().isMdAsciiPunct;

	var QUOTE_TEST_RE = /['"]/;
	var QUOTE_RE = /['"]/g;
	var APOSTROPHE = '\u2019'; /* ’ */


	function replaceAt(str, index, ch) {
	  return str.slice(0, index) + ch + str.slice(index + 1);
	}

	function process_inlines(tokens, state) {
	  var i, token, text, t, pos, max, thisLevel, item, lastChar, nextChar,
	      isLastPunctChar, isNextPunctChar, isLastWhiteSpace, isNextWhiteSpace,
	      canOpen, canClose, j, isSingle, stack, openQuote, closeQuote;

	  stack = [];

	  for (i = 0; i < tokens.length; i++) {
	    token = tokens[i];

	    thisLevel = tokens[i].level;

	    for (j = stack.length - 1; j >= 0; j--) {
	      if (stack[j].level <= thisLevel) { break; }
	    }
	    stack.length = j + 1;

	    if (token.type !== 'text') { continue; }

	    text = token.content;
	    pos = 0;
	    max = text.length;

	    /*eslint no-labels:0,block-scoped-var:0*/
	    OUTER:
	    while (pos < max) {
	      QUOTE_RE.lastIndex = pos;
	      t = QUOTE_RE.exec(text);
	      if (!t) { break; }

	      canOpen = canClose = true;
	      pos = t.index + 1;
	      isSingle = (t[0] === "'");

	      // Find previous character,
	      // default to space if it's the beginning of the line
	      //
	      lastChar = 0x20;

	      if (t.index - 1 >= 0) {
	        lastChar = text.charCodeAt(t.index - 1);
	      } else {
	        for (j = i - 1; j >= 0; j--) {
	          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // lastChar defaults to 0x20
	          if (!tokens[j].content) continue; // should skip all tokens except 'text', 'html_inline' or 'code_inline'

	          lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
	          break;
	        }
	      }

	      // Find next character,
	      // default to space if it's the end of the line
	      //
	      nextChar = 0x20;

	      if (pos < max) {
	        nextChar = text.charCodeAt(pos);
	      } else {
	        for (j = i + 1; j < tokens.length; j++) {
	          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // nextChar defaults to 0x20
	          if (!tokens[j].content) continue; // should skip all tokens except 'text', 'html_inline' or 'code_inline'

	          nextChar = tokens[j].content.charCodeAt(0);
	          break;
	        }
	      }

	      isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
	      isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

	      isLastWhiteSpace = isWhiteSpace(lastChar);
	      isNextWhiteSpace = isWhiteSpace(nextChar);

	      if (isNextWhiteSpace) {
	        canOpen = false;
	      } else if (isNextPunctChar) {
	        if (!(isLastWhiteSpace || isLastPunctChar)) {
	          canOpen = false;
	        }
	      }

	      if (isLastWhiteSpace) {
	        canClose = false;
	      } else if (isLastPunctChar) {
	        if (!(isNextWhiteSpace || isNextPunctChar)) {
	          canClose = false;
	        }
	      }

	      if (nextChar === 0x22 /* " */ && t[0] === '"') {
	        if (lastChar >= 0x30 /* 0 */ && lastChar <= 0x39 /* 9 */) {
	          // special case: 1"" - count first quote as an inch
	          canClose = canOpen = false;
	        }
	      }

	      if (canOpen && canClose) {
	        // Replace quotes in the middle of punctuation sequence, but not
	        // in the middle of the words, i.e.:
	        //
	        // 1. foo " bar " baz - not replaced
	        // 2. foo-"-bar-"-baz - replaced
	        // 3. foo"bar"baz     - not replaced
	        //
	        canOpen = isLastPunctChar;
	        canClose = isNextPunctChar;
	      }

	      if (!canOpen && !canClose) {
	        // middle of word
	        if (isSingle) {
	          token.content = replaceAt(token.content, t.index, APOSTROPHE);
	        }
	        continue;
	      }

	      if (canClose) {
	        // this could be a closing quote, rewind the stack to get a match
	        for (j = stack.length - 1; j >= 0; j--) {
	          item = stack[j];
	          if (stack[j].level < thisLevel) { break; }
	          if (item.single === isSingle && stack[j].level === thisLevel) {
	            item = stack[j];

	            if (isSingle) {
	              openQuote = state.md.options.quotes[2];
	              closeQuote = state.md.options.quotes[3];
	            } else {
	              openQuote = state.md.options.quotes[0];
	              closeQuote = state.md.options.quotes[1];
	            }

	            // replace token.content *before* tokens[item.token].content,
	            // because, if they are pointing at the same token, replaceAt
	            // could mess up indices when quote length != 1
	            token.content = replaceAt(token.content, t.index, closeQuote);
	            tokens[item.token].content = replaceAt(
	              tokens[item.token].content, item.pos, openQuote);

	            pos += closeQuote.length - 1;
	            if (item.token === i) { pos += openQuote.length - 1; }

	            text = token.content;
	            max = text.length;

	            stack.length = j;
	            continue OUTER;
	          }
	        }
	      }

	      if (canOpen) {
	        stack.push({
	          token: i,
	          pos: t.index,
	          single: isSingle,
	          level: thisLevel
	        });
	      } else if (canClose && isSingle) {
	        token.content = replaceAt(token.content, t.index, APOSTROPHE);
	      }
	    }
	  }
	}


	smartquotes = function smartquotes(state) {
	  /*eslint max-depth:0*/
	  var blkIdx;

	  if (!state.md.options.typographer) { return; }

	  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

	    if (state.tokens[blkIdx].type !== 'inline' ||
	        !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
	      continue;
	    }

	    process_inlines(state.tokens[blkIdx].children, state);
	  }
	};
	return smartquotes;
}

var text_join;
var hasRequiredText_join;

function requireText_join () {
	if (hasRequiredText_join) return text_join;
	hasRequiredText_join = 1;


	text_join = function text_join(state) {
	  var j, l, tokens, curr, max, last,
	      blockTokens = state.tokens;

	  for (j = 0, l = blockTokens.length; j < l; j++) {
	    if (blockTokens[j].type !== 'inline') continue;

	    tokens = blockTokens[j].children;
	    max = tokens.length;

	    for (curr = 0; curr < max; curr++) {
	      if (tokens[curr].type === 'text_special') {
	        tokens[curr].type = 'text';
	      }
	    }

	    for (curr = last = 0; curr < max; curr++) {
	      if (tokens[curr].type === 'text' &&
	          curr + 1 < max &&
	          tokens[curr + 1].type === 'text') {

	        // collapse two adjacent text nodes
	        tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
	      } else {
	        if (curr !== last) { tokens[last] = tokens[curr]; }

	        last++;
	      }
	    }

	    if (curr !== last) {
	      tokens.length = last;
	    }
	  }
	};
	return text_join;
}

var token;
var hasRequiredToken;

function requireToken () {
	if (hasRequiredToken) return token;
	hasRequiredToken = 1;


	/**
	 * class Token
	 **/

	/**
	 * new Token(type, tag, nesting)
	 *
	 * Create new token and fill passed properties.
	 **/
	function Token(type, tag, nesting) {
	  /**
	   * Token#type -> String
	   *
	   * Type of the token (string, e.g. "paragraph_open")
	   **/
	  this.type     = type;

	  /**
	   * Token#tag -> String
	   *
	   * html tag name, e.g. "p"
	   **/
	  this.tag      = tag;

	  /**
	   * Token#attrs -> Array
	   *
	   * Html attributes. Format: `[ [ name1, value1 ], [ name2, value2 ] ]`
	   **/
	  this.attrs    = null;

	  /**
	   * Token#map -> Array
	   *
	   * Source map info. Format: `[ line_begin, line_end ]`
	   **/
	  this.map      = null;

	  /**
	   * Token#nesting -> Number
	   *
	   * Level change (number in {-1, 0, 1} set), where:
	   *
	   * -  `1` means the tag is opening
	   * -  `0` means the tag is self-closing
	   * - `-1` means the tag is closing
	   **/
	  this.nesting  = nesting;

	  /**
	   * Token#level -> Number
	   *
	   * nesting level, the same as `state.level`
	   **/
	  this.level    = 0;

	  /**
	   * Token#children -> Array
	   *
	   * An array of child nodes (inline and img tokens)
	   **/
	  this.children = null;

	  /**
	   * Token#content -> String
	   *
	   * In a case of self-closing tag (code, html, fence, etc.),
	   * it has contents of this tag.
	   **/
	  this.content  = '';

	  /**
	   * Token#markup -> String
	   *
	   * '*' or '_' for emphasis, fence string for fence, etc.
	   **/
	  this.markup   = '';

	  /**
	   * Token#info -> String
	   *
	   * Additional information:
	   *
	   * - Info string for "fence" tokens
	   * - The value "auto" for autolink "link_open" and "link_close" tokens
	   * - The string value of the item marker for ordered-list "list_item_open" tokens
	   **/
	  this.info     = '';

	  /**
	   * Token#meta -> Object
	   *
	   * A place for plugins to store an arbitrary data
	   **/
	  this.meta     = null;

	  /**
	   * Token#block -> Boolean
	   *
	   * True for block-level tokens, false for inline tokens.
	   * Used in renderer to calculate line breaks
	   **/
	  this.block    = false;

	  /**
	   * Token#hidden -> Boolean
	   *
	   * If it's true, ignore this element when rendering. Used for tight lists
	   * to hide paragraphs.
	   **/
	  this.hidden   = false;
	}


	/**
	 * Token.attrIndex(name) -> Number
	 *
	 * Search attribute index by name.
	 **/
	Token.prototype.attrIndex = function attrIndex(name) {
	  var attrs, i, len;

	  if (!this.attrs) { return -1; }

	  attrs = this.attrs;

	  for (i = 0, len = attrs.length; i < len; i++) {
	    if (attrs[i][0] === name) { return i; }
	  }
	  return -1;
	};


	/**
	 * Token.attrPush(attrData)
	 *
	 * Add `[ name, value ]` attribute to list. Init attrs if necessary
	 **/
	Token.prototype.attrPush = function attrPush(attrData) {
	  if (this.attrs) {
	    this.attrs.push(attrData);
	  } else {
	    this.attrs = [ attrData ];
	  }
	};


	/**
	 * Token.attrSet(name, value)
	 *
	 * Set `name` attribute to `value`. Override old value if exists.
	 **/
	Token.prototype.attrSet = function attrSet(name, value) {
	  var idx = this.attrIndex(name),
	      attrData = [ name, value ];

	  if (idx < 0) {
	    this.attrPush(attrData);
	  } else {
	    this.attrs[idx] = attrData;
	  }
	};


	/**
	 * Token.attrGet(name)
	 *
	 * Get the value of attribute `name`, or null if it does not exist.
	 **/
	Token.prototype.attrGet = function attrGet(name) {
	  var idx = this.attrIndex(name), value = null;
	  if (idx >= 0) {
	    value = this.attrs[idx][1];
	  }
	  return value;
	};


	/**
	 * Token.attrJoin(name, value)
	 *
	 * Join value to existing attribute via space. Or create new attribute if not
	 * exists. Useful to operate with token classes.
	 **/
	Token.prototype.attrJoin = function attrJoin(name, value) {
	  var idx = this.attrIndex(name);

	  if (idx < 0) {
	    this.attrPush([ name, value ]);
	  } else {
	    this.attrs[idx][1] = this.attrs[idx][1] + ' ' + value;
	  }
	};


	token = Token;
	return token;
}

var state_core;
var hasRequiredState_core;

function requireState_core () {
	if (hasRequiredState_core) return state_core;
	hasRequiredState_core = 1;

	var Token = requireToken();


	function StateCore(src, md, env) {
	  this.src = src;
	  this.env = env;
	  this.tokens = [];
	  this.inlineMode = false;
	  this.md = md; // link to parser instance
	}

	// re-export Token class to use in core rules
	StateCore.prototype.Token = Token;


	state_core = StateCore;
	return state_core;
}

/** internal
 * class Core
 *
 * Top-level rules executor. Glues block/inline parsers and does intermediate
 * transformations.
 **/

var parser_core;
var hasRequiredParser_core;

function requireParser_core () {
	if (hasRequiredParser_core) return parser_core;
	hasRequiredParser_core = 1;


	var Ruler  = requireRuler();


	var _rules = [
	  [ 'normalize',      requireNormalize()      ],
	  [ 'block',          requireBlock()          ],
	  [ 'inline',         requireInline()         ],
	  [ 'linkify',        requireLinkify$1()        ],
	  [ 'replacements',   requireReplacements()   ],
	  [ 'smartquotes',    requireSmartquotes()    ],
	  // `text_join` finds `text_special` tokens (for escape sequences)
	  // and joins them with the rest of the text
	  [ 'text_join',      requireText_join()      ]
	];


	/**
	 * new Core()
	 **/
	function Core() {
	  /**
	   * Core#ruler -> Ruler
	   *
	   * [[Ruler]] instance. Keep configuration of core rules.
	   **/
	  this.ruler = new Ruler();

	  for (var i = 0; i < _rules.length; i++) {
	    this.ruler.push(_rules[i][0], _rules[i][1]);
	  }
	}


	/**
	 * Core.process(state)
	 *
	 * Executes core chain rules.
	 **/
	Core.prototype.process = function (state) {
	  var i, l, rules;

	  rules = this.ruler.getRules('');

	  for (i = 0, l = rules.length; i < l; i++) {
	    rules[i](state);
	  }
	};

	Core.prototype.State = requireState_core();


	parser_core = Core;
	return parser_core;
}

var table;
var hasRequiredTable;

function requireTable () {
	if (hasRequiredTable) return table;
	hasRequiredTable = 1;

	var isSpace = requireUtils().isSpace;


	function getLine(state, line) {
	  var pos = state.bMarks[line] + state.tShift[line],
	      max = state.eMarks[line];

	  return state.src.slice(pos, max);
	}

	function escapedSplit(str) {
	  var result = [],
	      pos = 0,
	      max = str.length,
	      ch,
	      isEscaped = false,
	      lastPos = 0,
	      current = '';

	  ch  = str.charCodeAt(pos);

	  while (pos < max) {
	    if (ch === 0x7c/* | */) {
	      if (!isEscaped) {
	        // pipe separating cells, '|'
	        result.push(current + str.substring(lastPos, pos));
	        current = '';
	        lastPos = pos + 1;
	      } else {
	        // escaped pipe, '\|'
	        current += str.substring(lastPos, pos - 1);
	        lastPos = pos;
	      }
	    }

	    isEscaped = (ch === 0x5c/* \ */);
	    pos++;

	    ch = str.charCodeAt(pos);
	  }

	  result.push(current + str.substring(lastPos));

	  return result;
	}


	table = function table(state, startLine, endLine, silent) {
	  var ch, lineText, pos, i, l, nextLine, columns, columnCount, token,
	      aligns, t, tableLines, tbodyLines, oldParentType, terminate,
	      terminatorRules, firstCh, secondCh;

	  // should have at least two lines
	  if (startLine + 2 > endLine) { return false; }

	  nextLine = startLine + 1;

	  if (state.sCount[nextLine] < state.blkIndent) { return false; }

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[nextLine] - state.blkIndent >= 4) { return false; }

	  // first character of the second line should be '|', '-', ':',
	  // and no other characters are allowed but spaces;
	  // basically, this is the equivalent of /^[-:|][-:|\s]*$/ regexp

	  pos = state.bMarks[nextLine] + state.tShift[nextLine];
	  if (pos >= state.eMarks[nextLine]) { return false; }

	  firstCh = state.src.charCodeAt(pos++);
	  if (firstCh !== 0x7C/* | */ && firstCh !== 0x2D/* - */ && firstCh !== 0x3A/* : */) { return false; }

	  if (pos >= state.eMarks[nextLine]) { return false; }

	  secondCh = state.src.charCodeAt(pos++);
	  if (secondCh !== 0x7C/* | */ && secondCh !== 0x2D/* - */ && secondCh !== 0x3A/* : */ && !isSpace(secondCh)) {
	    return false;
	  }

	  // if first character is '-', then second character must not be a space
	  // (due to parsing ambiguity with list)
	  if (firstCh === 0x2D/* - */ && isSpace(secondCh)) { return false; }

	  while (pos < state.eMarks[nextLine]) {
	    ch = state.src.charCodeAt(pos);

	    if (ch !== 0x7C/* | */ && ch !== 0x2D/* - */ && ch !== 0x3A/* : */ && !isSpace(ch)) { return false; }

	    pos++;
	  }

	  lineText = getLine(state, startLine + 1);

	  columns = lineText.split('|');
	  aligns = [];
	  for (i = 0; i < columns.length; i++) {
	    t = columns[i].trim();
	    if (!t) {
	      // allow empty columns before and after table, but not in between columns;
	      // e.g. allow ` |---| `, disallow ` ---||--- `
	      if (i === 0 || i === columns.length - 1) {
	        continue;
	      } else {
	        return false;
	      }
	    }

	    if (!/^:?-+:?$/.test(t)) { return false; }
	    if (t.charCodeAt(t.length - 1) === 0x3A/* : */) {
	      aligns.push(t.charCodeAt(0) === 0x3A/* : */ ? 'center' : 'right');
	    } else if (t.charCodeAt(0) === 0x3A/* : */) {
	      aligns.push('left');
	    } else {
	      aligns.push('');
	    }
	  }

	  lineText = getLine(state, startLine).trim();
	  if (lineText.indexOf('|') === -1) { return false; }
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }
	  columns = escapedSplit(lineText);
	  if (columns.length && columns[0] === '') columns.shift();
	  if (columns.length && columns[columns.length - 1] === '') columns.pop();

	  // header row will define an amount of columns in the entire table,
	  // and align row should be exactly the same (the rest of the rows can differ)
	  columnCount = columns.length;
	  if (columnCount === 0 || columnCount !== aligns.length) { return false; }

	  if (silent) { return true; }

	  oldParentType = state.parentType;
	  state.parentType = 'table';

	  // use 'blockquote' lists for termination because it's
	  // the most similar to tables
	  terminatorRules = state.md.block.ruler.getRules('blockquote');

	  token     = state.push('table_open', 'table', 1);
	  token.map = tableLines = [ startLine, 0 ];

	  token     = state.push('thead_open', 'thead', 1);
	  token.map = [ startLine, startLine + 1 ];

	  token     = state.push('tr_open', 'tr', 1);
	  token.map = [ startLine, startLine + 1 ];

	  for (i = 0; i < columns.length; i++) {
	    token          = state.push('th_open', 'th', 1);
	    if (aligns[i]) {
	      token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
	    }

	    token          = state.push('inline', '', 0);
	    token.content  = columns[i].trim();
	    token.children = [];

	    token          = state.push('th_close', 'th', -1);
	  }

	  token     = state.push('tr_close', 'tr', -1);
	  token     = state.push('thead_close', 'thead', -1);

	  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
	    if (state.sCount[nextLine] < state.blkIndent) { break; }

	    terminate = false;
	    for (i = 0, l = terminatorRules.length; i < l; i++) {
	      if (terminatorRules[i](state, nextLine, endLine, true)) {
	        terminate = true;
	        break;
	      }
	    }

	    if (terminate) { break; }
	    lineText = getLine(state, nextLine).trim();
	    if (!lineText) { break; }
	    if (state.sCount[nextLine] - state.blkIndent >= 4) { break; }
	    columns = escapedSplit(lineText);
	    if (columns.length && columns[0] === '') columns.shift();
	    if (columns.length && columns[columns.length - 1] === '') columns.pop();

	    if (nextLine === startLine + 2) {
	      token     = state.push('tbody_open', 'tbody', 1);
	      token.map = tbodyLines = [ startLine + 2, 0 ];
	    }

	    token     = state.push('tr_open', 'tr', 1);
	    token.map = [ nextLine, nextLine + 1 ];

	    for (i = 0; i < columnCount; i++) {
	      token          = state.push('td_open', 'td', 1);
	      if (aligns[i]) {
	        token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
	      }

	      token          = state.push('inline', '', 0);
	      token.content  = columns[i] ? columns[i].trim() : '';
	      token.children = [];

	      token          = state.push('td_close', 'td', -1);
	    }
	    token = state.push('tr_close', 'tr', -1);
	  }

	  if (tbodyLines) {
	    token = state.push('tbody_close', 'tbody', -1);
	    tbodyLines[1] = nextLine;
	  }

	  token = state.push('table_close', 'table', -1);
	  tableLines[1] = nextLine;

	  state.parentType = oldParentType;
	  state.line = nextLine;
	  return true;
	};
	return table;
}

var code;
var hasRequiredCode;

function requireCode () {
	if (hasRequiredCode) return code;
	hasRequiredCode = 1;


	code = function code(state, startLine, endLine/*, silent*/) {
	  var nextLine, last, token;

	  if (state.sCount[startLine] - state.blkIndent < 4) { return false; }

	  last = nextLine = startLine + 1;

	  while (nextLine < endLine) {
	    if (state.isEmpty(nextLine)) {
	      nextLine++;
	      continue;
	    }

	    if (state.sCount[nextLine] - state.blkIndent >= 4) {
	      nextLine++;
	      last = nextLine;
	      continue;
	    }
	    break;
	  }

	  state.line = last;

	  token         = state.push('code_block', 'code', 0);
	  token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + '\n';
	  token.map     = [ startLine, state.line ];

	  return true;
	};
	return code;
}

var fence;
var hasRequiredFence;

function requireFence () {
	if (hasRequiredFence) return fence;
	hasRequiredFence = 1;


	fence = function fence(state, startLine, endLine, silent) {
	  var marker, len, params, nextLine, mem, token, markup,
	      haveEndMarker = false,
	      pos = state.bMarks[startLine] + state.tShift[startLine],
	      max = state.eMarks[startLine];

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  if (pos + 3 > max) { return false; }

	  marker = state.src.charCodeAt(pos);

	  if (marker !== 0x7E/* ~ */ && marker !== 0x60 /* ` */) {
	    return false;
	  }

	  // scan marker length
	  mem = pos;
	  pos = state.skipChars(pos, marker);

	  len = pos - mem;

	  if (len < 3) { return false; }

	  markup = state.src.slice(mem, pos);
	  params = state.src.slice(pos, max);

	  if (marker === 0x60 /* ` */) {
	    if (params.indexOf(String.fromCharCode(marker)) >= 0) {
	      return false;
	    }
	  }

	  // Since start is found, we can report success here in validation mode
	  if (silent) { return true; }

	  // search end of block
	  nextLine = startLine;

	  for (;;) {
	    nextLine++;
	    if (nextLine >= endLine) {
	      // unclosed block should be autoclosed by end of document.
	      // also block seems to be autoclosed by end of parent
	      break;
	    }

	    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
	    max = state.eMarks[nextLine];

	    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
	      // non-empty line with negative indent should stop the list:
	      // - ```
	      //  test
	      break;
	    }

	    if (state.src.charCodeAt(pos) !== marker) { continue; }

	    if (state.sCount[nextLine] - state.blkIndent >= 4) {
	      // closing fence should be indented less than 4 spaces
	      continue;
	    }

	    pos = state.skipChars(pos, marker);

	    // closing code fence must be at least as long as the opening one
	    if (pos - mem < len) { continue; }

	    // make sure tail has spaces only
	    pos = state.skipSpaces(pos);

	    if (pos < max) { continue; }

	    haveEndMarker = true;
	    // found!
	    break;
	  }

	  // If a fence has heading spaces, they should be removed from its inner block
	  len = state.sCount[startLine];

	  state.line = nextLine + (haveEndMarker ? 1 : 0);

	  token         = state.push('fence', 'code', 0);
	  token.info    = params;
	  token.content = state.getLines(startLine + 1, nextLine, len, true);
	  token.markup  = markup;
	  token.map     = [ startLine, state.line ];

	  return true;
	};
	return fence;
}

var blockquote;
var hasRequiredBlockquote;

function requireBlockquote () {
	if (hasRequiredBlockquote) return blockquote;
	hasRequiredBlockquote = 1;

	var isSpace = requireUtils().isSpace;


	blockquote = function blockquote(state, startLine, endLine, silent) {
	  var adjustTab,
	      ch,
	      i,
	      initial,
	      l,
	      lastLineEmpty,
	      lines,
	      nextLine,
	      offset,
	      oldBMarks,
	      oldBSCount,
	      oldIndent,
	      oldParentType,
	      oldSCount,
	      oldTShift,
	      spaceAfterMarker,
	      terminate,
	      terminatorRules,
	      token,
	      isOutdented,
	      oldLineMax = state.lineMax,
	      pos = state.bMarks[startLine] + state.tShift[startLine],
	      max = state.eMarks[startLine];

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  // check the block quote marker
	  if (state.src.charCodeAt(pos++) !== 0x3E/* > */) { return false; }

	  // we know that it's going to be a valid blockquote,
	  // so no point trying to find the end of it in silent mode
	  if (silent) { return true; }

	  // set offset past spaces and ">"
	  initial = offset = state.sCount[startLine] + 1;

	  // skip one optional space after '>'
	  if (state.src.charCodeAt(pos) === 0x20 /* space */) {
	    // ' >   test '
	    //     ^ -- position start of line here:
	    pos++;
	    initial++;
	    offset++;
	    adjustTab = false;
	    spaceAfterMarker = true;
	  } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
	    spaceAfterMarker = true;

	    if ((state.bsCount[startLine] + offset) % 4 === 3) {
	      // '  >\t  test '
	      //       ^ -- position start of line here (tab has width===1)
	      pos++;
	      initial++;
	      offset++;
	      adjustTab = false;
	    } else {
	      // ' >\t  test '
	      //    ^ -- position start of line here + shift bsCount slightly
	      //         to make extra space appear
	      adjustTab = true;
	    }
	  } else {
	    spaceAfterMarker = false;
	  }

	  oldBMarks = [ state.bMarks[startLine] ];
	  state.bMarks[startLine] = pos;

	  while (pos < max) {
	    ch = state.src.charCodeAt(pos);

	    if (isSpace(ch)) {
	      if (ch === 0x09) {
	        offset += 4 - (offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4;
	      } else {
	        offset++;
	      }
	    } else {
	      break;
	    }

	    pos++;
	  }

	  oldBSCount = [ state.bsCount[startLine] ];
	  state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);

	  lastLineEmpty = pos >= max;

	  oldSCount = [ state.sCount[startLine] ];
	  state.sCount[startLine] = offset - initial;

	  oldTShift = [ state.tShift[startLine] ];
	  state.tShift[startLine] = pos - state.bMarks[startLine];

	  terminatorRules = state.md.block.ruler.getRules('blockquote');

	  oldParentType = state.parentType;
	  state.parentType = 'blockquote';

	  // Search the end of the block
	  //
	  // Block ends with either:
	  //  1. an empty line outside:
	  //     ```
	  //     > test
	  //
	  //     ```
	  //  2. an empty line inside:
	  //     ```
	  //     >
	  //     test
	  //     ```
	  //  3. another tag:
	  //     ```
	  //     > test
	  //      - - -
	  //     ```
	  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
	    // check if it's outdented, i.e. it's inside list item and indented
	    // less than said list item:
	    //
	    // ```
	    // 1. anything
	    //    > current blockquote
	    // 2. checking this line
	    // ```
	    isOutdented = state.sCount[nextLine] < state.blkIndent;

	    pos = state.bMarks[nextLine] + state.tShift[nextLine];
	    max = state.eMarks[nextLine];

	    if (pos >= max) {
	      // Case 1: line is not inside the blockquote, and this line is empty.
	      break;
	    }

	    if (state.src.charCodeAt(pos++) === 0x3E/* > */ && !isOutdented) {
	      // This line is inside the blockquote.

	      // set offset past spaces and ">"
	      initial = offset = state.sCount[nextLine] + 1;

	      // skip one optional space after '>'
	      if (state.src.charCodeAt(pos) === 0x20 /* space */) {
	        // ' >   test '
	        //     ^ -- position start of line here:
	        pos++;
	        initial++;
	        offset++;
	        adjustTab = false;
	        spaceAfterMarker = true;
	      } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
	        spaceAfterMarker = true;

	        if ((state.bsCount[nextLine] + offset) % 4 === 3) {
	          // '  >\t  test '
	          //       ^ -- position start of line here (tab has width===1)
	          pos++;
	          initial++;
	          offset++;
	          adjustTab = false;
	        } else {
	          // ' >\t  test '
	          //    ^ -- position start of line here + shift bsCount slightly
	          //         to make extra space appear
	          adjustTab = true;
	        }
	      } else {
	        spaceAfterMarker = false;
	      }

	      oldBMarks.push(state.bMarks[nextLine]);
	      state.bMarks[nextLine] = pos;

	      while (pos < max) {
	        ch = state.src.charCodeAt(pos);

	        if (isSpace(ch)) {
	          if (ch === 0x09) {
	            offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
	          } else {
	            offset++;
	          }
	        } else {
	          break;
	        }

	        pos++;
	      }

	      lastLineEmpty = pos >= max;

	      oldBSCount.push(state.bsCount[nextLine]);
	      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);

	      oldSCount.push(state.sCount[nextLine]);
	      state.sCount[nextLine] = offset - initial;

	      oldTShift.push(state.tShift[nextLine]);
	      state.tShift[nextLine] = pos - state.bMarks[nextLine];
	      continue;
	    }

	    // Case 2: line is not inside the blockquote, and the last line was empty.
	    if (lastLineEmpty) { break; }

	    // Case 3: another tag found.
	    terminate = false;
	    for (i = 0, l = terminatorRules.length; i < l; i++) {
	      if (terminatorRules[i](state, nextLine, endLine, true)) {
	        terminate = true;
	        break;
	      }
	    }

	    if (terminate) {
	      // Quirk to enforce "hard termination mode" for paragraphs;
	      // normally if you call `tokenize(state, startLine, nextLine)`,
	      // paragraphs will look below nextLine for paragraph continuation,
	      // but if blockquote is terminated by another tag, they shouldn't
	      state.lineMax = nextLine;

	      if (state.blkIndent !== 0) {
	        // state.blkIndent was non-zero, we now set it to zero,
	        // so we need to re-calculate all offsets to appear as
	        // if indent wasn't changed
	        oldBMarks.push(state.bMarks[nextLine]);
	        oldBSCount.push(state.bsCount[nextLine]);
	        oldTShift.push(state.tShift[nextLine]);
	        oldSCount.push(state.sCount[nextLine]);
	        state.sCount[nextLine] -= state.blkIndent;
	      }

	      break;
	    }

	    oldBMarks.push(state.bMarks[nextLine]);
	    oldBSCount.push(state.bsCount[nextLine]);
	    oldTShift.push(state.tShift[nextLine]);
	    oldSCount.push(state.sCount[nextLine]);

	    // A negative indentation means that this is a paragraph continuation
	    //
	    state.sCount[nextLine] = -1;
	  }

	  oldIndent = state.blkIndent;
	  state.blkIndent = 0;

	  token        = state.push('blockquote_open', 'blockquote', 1);
	  token.markup = '>';
	  token.map    = lines = [ startLine, 0 ];

	  state.md.block.tokenize(state, startLine, nextLine);

	  token        = state.push('blockquote_close', 'blockquote', -1);
	  token.markup = '>';

	  state.lineMax = oldLineMax;
	  state.parentType = oldParentType;
	  lines[1] = state.line;

	  // Restore original tShift; this might not be necessary since the parser
	  // has already been here, but just to make sure we can do that.
	  for (i = 0; i < oldTShift.length; i++) {
	    state.bMarks[i + startLine] = oldBMarks[i];
	    state.tShift[i + startLine] = oldTShift[i];
	    state.sCount[i + startLine] = oldSCount[i];
	    state.bsCount[i + startLine] = oldBSCount[i];
	  }
	  state.blkIndent = oldIndent;

	  return true;
	};
	return blockquote;
}

var hr;
var hasRequiredHr;

function requireHr () {
	if (hasRequiredHr) return hr;
	hasRequiredHr = 1;

	var isSpace = requireUtils().isSpace;


	hr = function hr(state, startLine, endLine, silent) {
	  var marker, cnt, ch, token,
	      pos = state.bMarks[startLine] + state.tShift[startLine],
	      max = state.eMarks[startLine];

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  marker = state.src.charCodeAt(pos++);

	  // Check hr marker
	  if (marker !== 0x2A/* * */ &&
	      marker !== 0x2D/* - */ &&
	      marker !== 0x5F/* _ */) {
	    return false;
	  }

	  // markers can be mixed with spaces, but there should be at least 3 of them

	  cnt = 1;
	  while (pos < max) {
	    ch = state.src.charCodeAt(pos++);
	    if (ch !== marker && !isSpace(ch)) { return false; }
	    if (ch === marker) { cnt++; }
	  }

	  if (cnt < 3) { return false; }

	  if (silent) { return true; }

	  state.line = startLine + 1;

	  token        = state.push('hr', 'hr', 0);
	  token.map    = [ startLine, state.line ];
	  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));

	  return true;
	};
	return hr;
}

var list;
var hasRequiredList;

function requireList () {
	if (hasRequiredList) return list;
	hasRequiredList = 1;

	var isSpace = requireUtils().isSpace;


	// Search `[-+*][\n ]`, returns next pos after marker on success
	// or -1 on fail.
	function skipBulletListMarker(state, startLine) {
	  var marker, pos, max, ch;

	  pos = state.bMarks[startLine] + state.tShift[startLine];
	  max = state.eMarks[startLine];

	  marker = state.src.charCodeAt(pos++);
	  // Check bullet
	  if (marker !== 0x2A/* * */ &&
	      marker !== 0x2D/* - */ &&
	      marker !== 0x2B/* + */) {
	    return -1;
	  }

	  if (pos < max) {
	    ch = state.src.charCodeAt(pos);

	    if (!isSpace(ch)) {
	      // " -test " - is not a list item
	      return -1;
	    }
	  }

	  return pos;
	}

	// Search `\d+[.)][\n ]`, returns next pos after marker on success
	// or -1 on fail.
	function skipOrderedListMarker(state, startLine) {
	  var ch,
	      start = state.bMarks[startLine] + state.tShift[startLine],
	      pos = start,
	      max = state.eMarks[startLine];

	  // List marker should have at least 2 chars (digit + dot)
	  if (pos + 1 >= max) { return -1; }

	  ch = state.src.charCodeAt(pos++);

	  if (ch < 0x30/* 0 */ || ch > 0x39/* 9 */) { return -1; }

	  for (;;) {
	    // EOL -> fail
	    if (pos >= max) { return -1; }

	    ch = state.src.charCodeAt(pos++);

	    if (ch >= 0x30/* 0 */ && ch <= 0x39/* 9 */) {

	      // List marker should have no more than 9 digits
	      // (prevents integer overflow in browsers)
	      if (pos - start >= 10) { return -1; }

	      continue;
	    }

	    // found valid marker
	    if (ch === 0x29/* ) */ || ch === 0x2e/* . */) {
	      break;
	    }

	    return -1;
	  }


	  if (pos < max) {
	    ch = state.src.charCodeAt(pos);

	    if (!isSpace(ch)) {
	      // " 1.test " - is not a list item
	      return -1;
	    }
	  }
	  return pos;
	}

	function markTightParagraphs(state, idx) {
	  var i, l,
	      level = state.level + 2;

	  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
	    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
	      state.tokens[i + 2].hidden = true;
	      state.tokens[i].hidden = true;
	      i += 2;
	    }
	  }
	}


	list = function list(state, startLine, endLine, silent) {
	  var ch,
	      contentStart,
	      i,
	      indent,
	      indentAfterMarker,
	      initial,
	      isOrdered,
	      itemLines,
	      l,
	      listLines,
	      listTokIdx,
	      markerCharCode,
	      markerValue,
	      max,
	      nextLine,
	      offset,
	      oldListIndent,
	      oldParentType,
	      oldSCount,
	      oldTShift,
	      oldTight,
	      pos,
	      posAfterMarker,
	      prevEmptyEnd,
	      start,
	      terminate,
	      terminatorRules,
	      token,
	      isTerminatingParagraph = false,
	      tight = true;

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  // Special case:
	  //  - item 1
	  //   - item 2
	  //    - item 3
	  //     - item 4
	  //      - this one is a paragraph continuation
	  if (state.listIndent >= 0 &&
	      state.sCount[startLine] - state.listIndent >= 4 &&
	      state.sCount[startLine] < state.blkIndent) {
	    return false;
	  }

	  // limit conditions when list can interrupt
	  // a paragraph (validation mode only)
	  if (silent && state.parentType === 'paragraph') {
	    // Next list item should still terminate previous list item;
	    //
	    // This code can fail if plugins use blkIndent as well as lists,
	    // but I hope the spec gets fixed long before that happens.
	    //
	    if (state.sCount[startLine] >= state.blkIndent) {
	      isTerminatingParagraph = true;
	    }
	  }

	  // Detect list type and position after marker
	  if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
	    isOrdered = true;
	    start = state.bMarks[startLine] + state.tShift[startLine];
	    markerValue = Number(state.src.slice(start, posAfterMarker - 1));

	    // If we're starting a new ordered list right after
	    // a paragraph, it should start with 1.
	    if (isTerminatingParagraph && markerValue !== 1) return false;

	  } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
	    isOrdered = false;

	  } else {
	    return false;
	  }

	  // If we're starting a new unordered list right after
	  // a paragraph, first line should not be empty.
	  if (isTerminatingParagraph) {
	    if (state.skipSpaces(posAfterMarker) >= state.eMarks[startLine]) return false;
	  }

	  // We should terminate list on style change. Remember first one to compare.
	  markerCharCode = state.src.charCodeAt(posAfterMarker - 1);

	  // For validation mode we can terminate immediately
	  if (silent) { return true; }

	  // Start list
	  listTokIdx = state.tokens.length;

	  if (isOrdered) {
	    token       = state.push('ordered_list_open', 'ol', 1);
	    if (markerValue !== 1) {
	      token.attrs = [ [ 'start', markerValue ] ];
	    }

	  } else {
	    token       = state.push('bullet_list_open', 'ul', 1);
	  }

	  token.map    = listLines = [ startLine, 0 ];
	  token.markup = String.fromCharCode(markerCharCode);

	  //
	  // Iterate list items
	  //

	  nextLine = startLine;
	  prevEmptyEnd = false;
	  terminatorRules = state.md.block.ruler.getRules('list');

	  oldParentType = state.parentType;
	  state.parentType = 'list';

	  while (nextLine < endLine) {
	    pos = posAfterMarker;
	    max = state.eMarks[nextLine];

	    initial = offset = state.sCount[nextLine] + posAfterMarker - (state.bMarks[startLine] + state.tShift[startLine]);

	    while (pos < max) {
	      ch = state.src.charCodeAt(pos);

	      if (ch === 0x09) {
	        offset += 4 - (offset + state.bsCount[nextLine]) % 4;
	      } else if (ch === 0x20) {
	        offset++;
	      } else {
	        break;
	      }

	      pos++;
	    }

	    contentStart = pos;

	    if (contentStart >= max) {
	      // trimming space in "-    \n  3" case, indent is 1 here
	      indentAfterMarker = 1;
	    } else {
	      indentAfterMarker = offset - initial;
	    }

	    // If we have more than 4 spaces, the indent is 1
	    // (the rest is just indented code block)
	    if (indentAfterMarker > 4) { indentAfterMarker = 1; }

	    // "  -  test"
	    //  ^^^^^ - calculating total length of this thing
	    indent = initial + indentAfterMarker;

	    // Run subparser & write tokens
	    token        = state.push('list_item_open', 'li', 1);
	    token.markup = String.fromCharCode(markerCharCode);
	    token.map    = itemLines = [ startLine, 0 ];
	    if (isOrdered) {
	      token.info = state.src.slice(start, posAfterMarker - 1);
	    }

	    // change current state, then restore it after parser subcall
	    oldTight = state.tight;
	    oldTShift = state.tShift[startLine];
	    oldSCount = state.sCount[startLine];

	    //  - example list
	    // ^ listIndent position will be here
	    //   ^ blkIndent position will be here
	    //
	    oldListIndent = state.listIndent;
	    state.listIndent = state.blkIndent;
	    state.blkIndent = indent;

	    state.tight = true;
	    state.tShift[startLine] = contentStart - state.bMarks[startLine];
	    state.sCount[startLine] = offset;

	    if (contentStart >= max && state.isEmpty(startLine + 1)) {
	      // workaround for this case
	      // (list item is empty, list terminates before "foo"):
	      // ~~~~~~~~
	      //   -
	      //
	      //     foo
	      // ~~~~~~~~
	      state.line = Math.min(state.line + 2, endLine);
	    } else {
	      state.md.block.tokenize(state, startLine, endLine, true);
	    }

	    // If any of list item is tight, mark list as tight
	    if (!state.tight || prevEmptyEnd) {
	      tight = false;
	    }
	    // Item become loose if finish with empty line,
	    // but we should filter last element, because it means list finish
	    prevEmptyEnd = (state.line - startLine) > 1 && state.isEmpty(state.line - 1);

	    state.blkIndent = state.listIndent;
	    state.listIndent = oldListIndent;
	    state.tShift[startLine] = oldTShift;
	    state.sCount[startLine] = oldSCount;
	    state.tight = oldTight;

	    token        = state.push('list_item_close', 'li', -1);
	    token.markup = String.fromCharCode(markerCharCode);

	    nextLine = startLine = state.line;
	    itemLines[1] = nextLine;
	    contentStart = state.bMarks[startLine];

	    if (nextLine >= endLine) { break; }

	    //
	    // Try to check if list is terminated or continued.
	    //
	    if (state.sCount[nextLine] < state.blkIndent) { break; }

	    // if it's indented more than 3 spaces, it should be a code block
	    if (state.sCount[startLine] - state.blkIndent >= 4) { break; }

	    // fail if terminating block found
	    terminate = false;
	    for (i = 0, l = terminatorRules.length; i < l; i++) {
	      if (terminatorRules[i](state, nextLine, endLine, true)) {
	        terminate = true;
	        break;
	      }
	    }
	    if (terminate) { break; }

	    // fail if list has another type
	    if (isOrdered) {
	      posAfterMarker = skipOrderedListMarker(state, nextLine);
	      if (posAfterMarker < 0) { break; }
	      start = state.bMarks[nextLine] + state.tShift[nextLine];
	    } else {
	      posAfterMarker = skipBulletListMarker(state, nextLine);
	      if (posAfterMarker < 0) { break; }
	    }

	    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) { break; }
	  }

	  // Finalize list
	  if (isOrdered) {
	    token = state.push('ordered_list_close', 'ol', -1);
	  } else {
	    token = state.push('bullet_list_close', 'ul', -1);
	  }
	  token.markup = String.fromCharCode(markerCharCode);

	  listLines[1] = nextLine;
	  state.line = nextLine;

	  state.parentType = oldParentType;

	  // mark paragraphs tight if needed
	  if (tight) {
	    markTightParagraphs(state, listTokIdx);
	  }

	  return true;
	};
	return list;
}

var reference;
var hasRequiredReference;

function requireReference () {
	if (hasRequiredReference) return reference;
	hasRequiredReference = 1;


	var normalizeReference   = requireUtils().normalizeReference;
	var isSpace              = requireUtils().isSpace;


	reference = function reference(state, startLine, _endLine, silent) {
	  var ch,
	      destEndPos,
	      destEndLineNo,
	      endLine,
	      href,
	      i,
	      l,
	      label,
	      labelEnd,
	      oldParentType,
	      res,
	      start,
	      str,
	      terminate,
	      terminatorRules,
	      title,
	      lines = 0,
	      pos = state.bMarks[startLine] + state.tShift[startLine],
	      max = state.eMarks[startLine],
	      nextLine = startLine + 1;

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  if (state.src.charCodeAt(pos) !== 0x5B/* [ */) { return false; }

	  // Simple check to quickly interrupt scan on [link](url) at the start of line.
	  // Can be useful on practice: https://github.com/markdown-it/markdown-it/issues/54
	  while (++pos < max) {
	    if (state.src.charCodeAt(pos) === 0x5D /* ] */ &&
	        state.src.charCodeAt(pos - 1) !== 0x5C/* \ */) {
	      if (pos + 1 === max) { return false; }
	      if (state.src.charCodeAt(pos + 1) !== 0x3A/* : */) { return false; }
	      break;
	    }
	  }

	  endLine = state.lineMax;

	  // jump line-by-line until empty one or EOF
	  terminatorRules = state.md.block.ruler.getRules('reference');

	  oldParentType = state.parentType;
	  state.parentType = 'reference';

	  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
	    // this would be a code block normally, but after paragraph
	    // it's considered a lazy continuation regardless of what's there
	    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

	    // quirk for blockquotes, this line should already be checked by that rule
	    if (state.sCount[nextLine] < 0) { continue; }

	    // Some tags can terminate paragraph without empty line.
	    terminate = false;
	    for (i = 0, l = terminatorRules.length; i < l; i++) {
	      if (terminatorRules[i](state, nextLine, endLine, true)) {
	        terminate = true;
	        break;
	      }
	    }
	    if (terminate) { break; }
	  }

	  str = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
	  max = str.length;

	  for (pos = 1; pos < max; pos++) {
	    ch = str.charCodeAt(pos);
	    if (ch === 0x5B /* [ */) {
	      return false;
	    } else if (ch === 0x5D /* ] */) {
	      labelEnd = pos;
	      break;
	    } else if (ch === 0x0A /* \n */) {
	      lines++;
	    } else if (ch === 0x5C /* \ */) {
	      pos++;
	      if (pos < max && str.charCodeAt(pos) === 0x0A) {
	        lines++;
	      }
	    }
	  }

	  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A/* : */) { return false; }

	  // [label]:   destination   'title'
	  //         ^^^ skip optional whitespace here
	  for (pos = labelEnd + 2; pos < max; pos++) {
	    ch = str.charCodeAt(pos);
	    if (ch === 0x0A) {
	      lines++;
	    } else if (isSpace(ch)) ; else {
	      break;
	    }
	  }

	  // [label]:   destination   'title'
	  //            ^^^^^^^^^^^ parse this
	  res = state.md.helpers.parseLinkDestination(str, pos, max);
	  if (!res.ok) { return false; }

	  href = state.md.normalizeLink(res.str);
	  if (!state.md.validateLink(href)) { return false; }

	  pos = res.pos;
	  lines += res.lines;

	  // save cursor state, we could require to rollback later
	  destEndPos = pos;
	  destEndLineNo = lines;

	  // [label]:   destination   'title'
	  //                       ^^^ skipping those spaces
	  start = pos;
	  for (; pos < max; pos++) {
	    ch = str.charCodeAt(pos);
	    if (ch === 0x0A) {
	      lines++;
	    } else if (isSpace(ch)) ; else {
	      break;
	    }
	  }

	  // [label]:   destination   'title'
	  //                          ^^^^^^^ parse this
	  res = state.md.helpers.parseLinkTitle(str, pos, max);
	  if (pos < max && start !== pos && res.ok) {
	    title = res.str;
	    pos = res.pos;
	    lines += res.lines;
	  } else {
	    title = '';
	    pos = destEndPos;
	    lines = destEndLineNo;
	  }

	  // skip trailing spaces until the rest of the line
	  while (pos < max) {
	    ch = str.charCodeAt(pos);
	    if (!isSpace(ch)) { break; }
	    pos++;
	  }

	  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
	    if (title) {
	      // garbage at the end of the line after title,
	      // but it could still be a valid reference if we roll back
	      title = '';
	      pos = destEndPos;
	      lines = destEndLineNo;
	      while (pos < max) {
	        ch = str.charCodeAt(pos);
	        if (!isSpace(ch)) { break; }
	        pos++;
	      }
	    }
	  }

	  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
	    // garbage at the end of the line
	    return false;
	  }

	  label = normalizeReference(str.slice(1, labelEnd));
	  if (!label) {
	    // CommonMark 0.20 disallows empty labels
	    return false;
	  }

	  // Reference can not terminate anything. This check is for safety only.
	  /*istanbul ignore if*/
	  if (silent) { return true; }

	  if (typeof state.env.references === 'undefined') {
	    state.env.references = {};
	  }
	  if (typeof state.env.references[label] === 'undefined') {
	    state.env.references[label] = { title: title, href: href };
	  }

	  state.parentType = oldParentType;

	  state.line = startLine + lines + 1;
	  return true;
	};
	return reference;
}

var html_blocks;
var hasRequiredHtml_blocks;

function requireHtml_blocks () {
	if (hasRequiredHtml_blocks) return html_blocks;
	hasRequiredHtml_blocks = 1;


	html_blocks = [
	  'address',
	  'article',
	  'aside',
	  'base',
	  'basefont',
	  'blockquote',
	  'body',
	  'caption',
	  'center',
	  'col',
	  'colgroup',
	  'dd',
	  'details',
	  'dialog',
	  'dir',
	  'div',
	  'dl',
	  'dt',
	  'fieldset',
	  'figcaption',
	  'figure',
	  'footer',
	  'form',
	  'frame',
	  'frameset',
	  'h1',
	  'h2',
	  'h3',
	  'h4',
	  'h5',
	  'h6',
	  'head',
	  'header',
	  'hr',
	  'html',
	  'iframe',
	  'legend',
	  'li',
	  'link',
	  'main',
	  'menu',
	  'menuitem',
	  'nav',
	  'noframes',
	  'ol',
	  'optgroup',
	  'option',
	  'p',
	  'param',
	  'section',
	  'source',
	  'summary',
	  'table',
	  'tbody',
	  'td',
	  'tfoot',
	  'th',
	  'thead',
	  'title',
	  'tr',
	  'track',
	  'ul'
	];
	return html_blocks;
}

var html_re = {};

var hasRequiredHtml_re;

function requireHtml_re () {
	if (hasRequiredHtml_re) return html_re;
	hasRequiredHtml_re = 1;

	var attr_name     = '[a-zA-Z_:][a-zA-Z0-9:._-]*';

	var unquoted      = '[^"\'=<>`\\x00-\\x20]+';
	var single_quoted = "'[^']*'";
	var double_quoted = '"[^"]*"';

	var attr_value  = '(?:' + unquoted + '|' + single_quoted + '|' + double_quoted + ')';

	var attribute   = '(?:\\s+' + attr_name + '(?:\\s*=\\s*' + attr_value + ')?)';

	var open_tag    = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';

	var close_tag   = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
	var comment     = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
	var processing  = '<[?][\\s\\S]*?[?]>';
	var declaration = '<![A-Z]+\\s+[^>]*>';
	var cdata       = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';

	var HTML_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + '|' + comment +
	                        '|' + processing + '|' + declaration + '|' + cdata + ')');
	var HTML_OPEN_CLOSE_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + ')');

	html_re.HTML_TAG_RE = HTML_TAG_RE;
	html_re.HTML_OPEN_CLOSE_TAG_RE = HTML_OPEN_CLOSE_TAG_RE;
	return html_re;
}

var html_block;
var hasRequiredHtml_block;

function requireHtml_block () {
	if (hasRequiredHtml_block) return html_block;
	hasRequiredHtml_block = 1;


	var block_names = requireHtml_blocks();
	var HTML_OPEN_CLOSE_TAG_RE = requireHtml_re().HTML_OPEN_CLOSE_TAG_RE;

	// An array of opening and corresponding closing sequences for html tags,
	// last argument defines whether it can terminate a paragraph or not
	//
	var HTML_SEQUENCES = [
	  [ /^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true ],
	  [ /^<!--/,        /-->/,   true ],
	  [ /^<\?/,         /\?>/,   true ],
	  [ /^<![A-Z]/,     />/,     true ],
	  [ /^<!\[CDATA\[/, /\]\]>/, true ],
	  [ new RegExp('^</?(' + block_names.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true ],
	  [ new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + '\\s*$'),  /^$/, false ]
	];


	html_block = function html_block(state, startLine, endLine, silent) {
	  var i, nextLine, token, lineText,
	      pos = state.bMarks[startLine] + state.tShift[startLine],
	      max = state.eMarks[startLine];

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  if (!state.md.options.html) { return false; }

	  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

	  lineText = state.src.slice(pos, max);

	  for (i = 0; i < HTML_SEQUENCES.length; i++) {
	    if (HTML_SEQUENCES[i][0].test(lineText)) { break; }
	  }

	  if (i === HTML_SEQUENCES.length) { return false; }

	  if (silent) {
	    // true if this sequence can be a terminator, false otherwise
	    return HTML_SEQUENCES[i][2];
	  }

	  nextLine = startLine + 1;

	  // If we are here - we detected HTML block.
	  // Let's roll down till block end.
	  if (!HTML_SEQUENCES[i][1].test(lineText)) {
	    for (; nextLine < endLine; nextLine++) {
	      if (state.sCount[nextLine] < state.blkIndent) { break; }

	      pos = state.bMarks[nextLine] + state.tShift[nextLine];
	      max = state.eMarks[nextLine];
	      lineText = state.src.slice(pos, max);

	      if (HTML_SEQUENCES[i][1].test(lineText)) {
	        if (lineText.length !== 0) { nextLine++; }
	        break;
	      }
	    }
	  }

	  state.line = nextLine;

	  token         = state.push('html_block', '', 0);
	  token.map     = [ startLine, nextLine ];
	  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);

	  return true;
	};
	return html_block;
}

var heading;
var hasRequiredHeading;

function requireHeading () {
	if (hasRequiredHeading) return heading;
	hasRequiredHeading = 1;

	var isSpace = requireUtils().isSpace;


	heading = function heading(state, startLine, endLine, silent) {
	  var ch, level, tmp, token,
	      pos = state.bMarks[startLine] + state.tShift[startLine],
	      max = state.eMarks[startLine];

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  ch  = state.src.charCodeAt(pos);

	  if (ch !== 0x23/* # */ || pos >= max) { return false; }

	  // count heading level
	  level = 1;
	  ch = state.src.charCodeAt(++pos);
	  while (ch === 0x23/* # */ && pos < max && level <= 6) {
	    level++;
	    ch = state.src.charCodeAt(++pos);
	  }

	  if (level > 6 || (pos < max && !isSpace(ch))) { return false; }

	  if (silent) { return true; }

	  // Let's cut tails like '    ###  ' from the end of string

	  max = state.skipSpacesBack(max, pos);
	  tmp = state.skipCharsBack(max, 0x23, pos); // #
	  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
	    max = tmp;
	  }

	  state.line = startLine + 1;

	  token        = state.push('heading_open', 'h' + String(level), 1);
	  token.markup = '########'.slice(0, level);
	  token.map    = [ startLine, state.line ];

	  token          = state.push('inline', '', 0);
	  token.content  = state.src.slice(pos, max).trim();
	  token.map      = [ startLine, state.line ];
	  token.children = [];

	  token        = state.push('heading_close', 'h' + String(level), -1);
	  token.markup = '########'.slice(0, level);

	  return true;
	};
	return heading;
}

var lheading;
var hasRequiredLheading;

function requireLheading () {
	if (hasRequiredLheading) return lheading;
	hasRequiredLheading = 1;


	lheading = function lheading(state, startLine, endLine/*, silent*/) {
	  var content, terminate, i, l, token, pos, max, level, marker,
	      nextLine = startLine + 1, oldParentType,
	      terminatorRules = state.md.block.ruler.getRules('paragraph');

	  // if it's indented more than 3 spaces, it should be a code block
	  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

	  oldParentType = state.parentType;
	  state.parentType = 'paragraph'; // use paragraph to match terminatorRules

	  // jump line-by-line until empty one or EOF
	  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
	    // this would be a code block normally, but after paragraph
	    // it's considered a lazy continuation regardless of what's there
	    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

	    //
	    // Check for underline in setext header
	    //
	    if (state.sCount[nextLine] >= state.blkIndent) {
	      pos = state.bMarks[nextLine] + state.tShift[nextLine];
	      max = state.eMarks[nextLine];

	      if (pos < max) {
	        marker = state.src.charCodeAt(pos);

	        if (marker === 0x2D/* - */ || marker === 0x3D/* = */) {
	          pos = state.skipChars(pos, marker);
	          pos = state.skipSpaces(pos);

	          if (pos >= max) {
	            level = (marker === 0x3D/* = */ ? 1 : 2);
	            break;
	          }
	        }
	      }
	    }

	    // quirk for blockquotes, this line should already be checked by that rule
	    if (state.sCount[nextLine] < 0) { continue; }

	    // Some tags can terminate paragraph without empty line.
	    terminate = false;
	    for (i = 0, l = terminatorRules.length; i < l; i++) {
	      if (terminatorRules[i](state, nextLine, endLine, true)) {
	        terminate = true;
	        break;
	      }
	    }
	    if (terminate) { break; }
	  }

	  if (!level) {
	    // Didn't find valid underline
	    return false;
	  }

	  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

	  state.line = nextLine + 1;

	  token          = state.push('heading_open', 'h' + String(level), 1);
	  token.markup   = String.fromCharCode(marker);
	  token.map      = [ startLine, state.line ];

	  token          = state.push('inline', '', 0);
	  token.content  = content;
	  token.map      = [ startLine, state.line - 1 ];
	  token.children = [];

	  token          = state.push('heading_close', 'h' + String(level), -1);
	  token.markup   = String.fromCharCode(marker);

	  state.parentType = oldParentType;

	  return true;
	};
	return lheading;
}

var paragraph;
var hasRequiredParagraph;

function requireParagraph () {
	if (hasRequiredParagraph) return paragraph;
	hasRequiredParagraph = 1;


	paragraph = function paragraph(state, startLine/*, endLine*/) {
	  var content, terminate, i, l, token, oldParentType,
	      nextLine = startLine + 1,
	      terminatorRules = state.md.block.ruler.getRules('paragraph'),
	      endLine = state.lineMax;

	  oldParentType = state.parentType;
	  state.parentType = 'paragraph';

	  // jump line-by-line until empty one or EOF
	  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
	    // this would be a code block normally, but after paragraph
	    // it's considered a lazy continuation regardless of what's there
	    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

	    // quirk for blockquotes, this line should already be checked by that rule
	    if (state.sCount[nextLine] < 0) { continue; }

	    // Some tags can terminate paragraph without empty line.
	    terminate = false;
	    for (i = 0, l = terminatorRules.length; i < l; i++) {
	      if (terminatorRules[i](state, nextLine, endLine, true)) {
	        terminate = true;
	        break;
	      }
	    }
	    if (terminate) { break; }
	  }

	  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

	  state.line = nextLine;

	  token          = state.push('paragraph_open', 'p', 1);
	  token.map      = [ startLine, state.line ];

	  token          = state.push('inline', '', 0);
	  token.content  = content;
	  token.map      = [ startLine, state.line ];
	  token.children = [];

	  token          = state.push('paragraph_close', 'p', -1);

	  state.parentType = oldParentType;

	  return true;
	};
	return paragraph;
}

var state_block;
var hasRequiredState_block;

function requireState_block () {
	if (hasRequiredState_block) return state_block;
	hasRequiredState_block = 1;

	var Token = requireToken();
	var isSpace = requireUtils().isSpace;


	function StateBlock(src, md, env, tokens) {
	  var ch, s, start, pos, len, indent, offset, indent_found;

	  this.src = src;

	  // link to parser instance
	  this.md     = md;

	  this.env = env;

	  //
	  // Internal state vartiables
	  //

	  this.tokens = tokens;

	  this.bMarks = [];  // line begin offsets for fast jumps
	  this.eMarks = [];  // line end offsets for fast jumps
	  this.tShift = [];  // offsets of the first non-space characters (tabs not expanded)
	  this.sCount = [];  // indents for each line (tabs expanded)

	  // An amount of virtual spaces (tabs expanded) between beginning
	  // of each line (bMarks) and real beginning of that line.
	  //
	  // It exists only as a hack because blockquotes override bMarks
	  // losing information in the process.
	  //
	  // It's used only when expanding tabs, you can think about it as
	  // an initial tab length, e.g. bsCount=21 applied to string `\t123`
	  // means first tab should be expanded to 4-21%4 === 3 spaces.
	  //
	  this.bsCount = [];

	  // block parser variables
	  this.blkIndent  = 0; // required block content indent (for example, if we are
	                       // inside a list, it would be positioned after list marker)
	  this.line       = 0; // line index in src
	  this.lineMax    = 0; // lines count
	  this.tight      = false;  // loose/tight mode for lists
	  this.ddIndent   = -1; // indent of the current dd block (-1 if there isn't any)
	  this.listIndent = -1; // indent of the current list block (-1 if there isn't any)

	  // can be 'blockquote', 'list', 'root', 'paragraph' or 'reference'
	  // used in lists to determine if they interrupt a paragraph
	  this.parentType = 'root';

	  this.level = 0;

	  // renderer
	  this.result = '';

	  // Create caches
	  // Generate markers.
	  s = this.src;
	  indent_found = false;

	  for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
	    ch = s.charCodeAt(pos);

	    if (!indent_found) {
	      if (isSpace(ch)) {
	        indent++;

	        if (ch === 0x09) {
	          offset += 4 - offset % 4;
	        } else {
	          offset++;
	        }
	        continue;
	      } else {
	        indent_found = true;
	      }
	    }

	    if (ch === 0x0A || pos === len - 1) {
	      if (ch !== 0x0A) { pos++; }
	      this.bMarks.push(start);
	      this.eMarks.push(pos);
	      this.tShift.push(indent);
	      this.sCount.push(offset);
	      this.bsCount.push(0);

	      indent_found = false;
	      indent = 0;
	      offset = 0;
	      start = pos + 1;
	    }
	  }

	  // Push fake entry to simplify cache bounds checks
	  this.bMarks.push(s.length);
	  this.eMarks.push(s.length);
	  this.tShift.push(0);
	  this.sCount.push(0);
	  this.bsCount.push(0);

	  this.lineMax = this.bMarks.length - 1; // don't count last fake line
	}

	// Push new token to "stream".
	//
	StateBlock.prototype.push = function (type, tag, nesting) {
	  var token = new Token(type, tag, nesting);
	  token.block = true;

	  if (nesting < 0) this.level--; // closing tag
	  token.level = this.level;
	  if (nesting > 0) this.level++; // opening tag

	  this.tokens.push(token);
	  return token;
	};

	StateBlock.prototype.isEmpty = function isEmpty(line) {
	  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
	};

	StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
	  for (var max = this.lineMax; from < max; from++) {
	    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
	      break;
	    }
	  }
	  return from;
	};

	// Skip spaces from given position.
	StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
	  var ch;

	  for (var max = this.src.length; pos < max; pos++) {
	    ch = this.src.charCodeAt(pos);
	    if (!isSpace(ch)) { break; }
	  }
	  return pos;
	};

	// Skip spaces from given position in reverse.
	StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
	  if (pos <= min) { return pos; }

	  while (pos > min) {
	    if (!isSpace(this.src.charCodeAt(--pos))) { return pos + 1; }
	  }
	  return pos;
	};

	// Skip char codes from given position
	StateBlock.prototype.skipChars = function skipChars(pos, code) {
	  for (var max = this.src.length; pos < max; pos++) {
	    if (this.src.charCodeAt(pos) !== code) { break; }
	  }
	  return pos;
	};

	// Skip char codes reverse from given position - 1
	StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
	  if (pos <= min) { return pos; }

	  while (pos > min) {
	    if (code !== this.src.charCodeAt(--pos)) { return pos + 1; }
	  }
	  return pos;
	};

	// cut lines range from source.
	StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
	  var i, lineIndent, ch, first, last, queue, lineStart,
	      line = begin;

	  if (begin >= end) {
	    return '';
	  }

	  queue = new Array(end - begin);

	  for (i = 0; line < end; line++, i++) {
	    lineIndent = 0;
	    lineStart = first = this.bMarks[line];

	    if (line + 1 < end || keepLastLF) {
	      // No need for bounds check because we have fake entry on tail.
	      last = this.eMarks[line] + 1;
	    } else {
	      last = this.eMarks[line];
	    }

	    while (first < last && lineIndent < indent) {
	      ch = this.src.charCodeAt(first);

	      if (isSpace(ch)) {
	        if (ch === 0x09) {
	          lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
	        } else {
	          lineIndent++;
	        }
	      } else if (first - lineStart < this.tShift[line]) {
	        // patched tShift masked characters to look like spaces (blockquotes, list markers)
	        lineIndent++;
	      } else {
	        break;
	      }

	      first++;
	    }

	    if (lineIndent > indent) {
	      // partially expanding tabs in code blocks, e.g '\t\tfoobar'
	      // with indent=2 becomes '  \tfoobar'
	      queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
	    } else {
	      queue[i] = this.src.slice(first, last);
	    }
	  }

	  return queue.join('');
	};

	// re-export Token class to use in block rules
	StateBlock.prototype.Token = Token;


	state_block = StateBlock;
	return state_block;
}

/** internal
 * class ParserBlock
 *
 * Block-level tokenizer.
 **/

var parser_block;
var hasRequiredParser_block;

function requireParser_block () {
	if (hasRequiredParser_block) return parser_block;
	hasRequiredParser_block = 1;


	var Ruler           = requireRuler();


	var _rules = [
	  // First 2 params - rule name & source. Secondary array - list of rules,
	  // which can be terminated by this one.
	  [ 'table',      requireTable(),      [ 'paragraph', 'reference' ] ],
	  [ 'code',       requireCode() ],
	  [ 'fence',      requireFence(),      [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
	  [ 'blockquote', requireBlockquote(), [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
	  [ 'hr',         requireHr(),         [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
	  [ 'list',       requireList(),       [ 'paragraph', 'reference', 'blockquote' ] ],
	  [ 'reference',  requireReference() ],
	  [ 'html_block', requireHtml_block(), [ 'paragraph', 'reference', 'blockquote' ] ],
	  [ 'heading',    requireHeading(),    [ 'paragraph', 'reference', 'blockquote' ] ],
	  [ 'lheading',   requireLheading() ],
	  [ 'paragraph',  requireParagraph() ]
	];


	/**
	 * new ParserBlock()
	 **/
	function ParserBlock() {
	  /**
	   * ParserBlock#ruler -> Ruler
	   *
	   * [[Ruler]] instance. Keep configuration of block rules.
	   **/
	  this.ruler = new Ruler();

	  for (var i = 0; i < _rules.length; i++) {
	    this.ruler.push(_rules[i][0], _rules[i][1], { alt: (_rules[i][2] || []).slice() });
	  }
	}


	// Generate tokens for input range
	//
	ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
	  var ok, i,
	      rules = this.ruler.getRules(''),
	      len = rules.length,
	      line = startLine,
	      hasEmptyLines = false,
	      maxNesting = state.md.options.maxNesting;

	  while (line < endLine) {
	    state.line = line = state.skipEmptyLines(line);
	    if (line >= endLine) { break; }

	    // Termination condition for nested calls.
	    // Nested calls currently used for blockquotes & lists
	    if (state.sCount[line] < state.blkIndent) { break; }

	    // If nesting level exceeded - skip tail to the end. That's not ordinary
	    // situation and we should not care about content.
	    if (state.level >= maxNesting) {
	      state.line = endLine;
	      break;
	    }

	    // Try all possible rules.
	    // On success, rule should:
	    //
	    // - update `state.line`
	    // - update `state.tokens`
	    // - return true

	    for (i = 0; i < len; i++) {
	      ok = rules[i](state, line, endLine, false);
	      if (ok) { break; }
	    }

	    // set state.tight if we had an empty line before current tag
	    // i.e. latest empty line should not count
	    state.tight = !hasEmptyLines;

	    // paragraph might "eat" one newline after it in nested lists
	    if (state.isEmpty(state.line - 1)) {
	      hasEmptyLines = true;
	    }

	    line = state.line;

	    if (line < endLine && state.isEmpty(line)) {
	      hasEmptyLines = true;
	      line++;
	      state.line = line;
	    }
	  }
	};


	/**
	 * ParserBlock.parse(str, md, env, outTokens)
	 *
	 * Process input string and push block tokens into `outTokens`
	 **/
	ParserBlock.prototype.parse = function (src, md, env, outTokens) {
	  var state;

	  if (!src) { return; }

	  state = new this.State(src, md, env, outTokens);

	  this.tokenize(state, state.line, state.lineMax);
	};


	ParserBlock.prototype.State = requireState_block();


	parser_block = ParserBlock;
	return parser_block;
}

var text;
var hasRequiredText;

function requireText () {
	if (hasRequiredText) return text;
	hasRequiredText = 1;


	// Rule to skip pure text
	// '{}$%@~+=:' reserved for extentions

	// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~

	// !!!! Don't confuse with "Markdown ASCII Punctuation" chars
	// http://spec.commonmark.org/0.15/#ascii-punctuation-character
	function isTerminatorChar(ch) {
	  switch (ch) {
	    case 0x0A/* \n */:
	    case 0x21/* ! */:
	    case 0x23/* # */:
	    case 0x24/* $ */:
	    case 0x25/* % */:
	    case 0x26/* & */:
	    case 0x2A/* * */:
	    case 0x2B/* + */:
	    case 0x2D/* - */:
	    case 0x3A/* : */:
	    case 0x3C/* < */:
	    case 0x3D/* = */:
	    case 0x3E/* > */:
	    case 0x40/* @ */:
	    case 0x5B/* [ */:
	    case 0x5C/* \ */:
	    case 0x5D/* ] */:
	    case 0x5E/* ^ */:
	    case 0x5F/* _ */:
	    case 0x60/* ` */:
	    case 0x7B/* { */:
	    case 0x7D/* } */:
	    case 0x7E/* ~ */:
	      return true;
	    default:
	      return false;
	  }
	}

	text = function text(state, silent) {
	  var pos = state.pos;

	  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
	    pos++;
	  }

	  if (pos === state.pos) { return false; }

	  if (!silent) { state.pending += state.src.slice(state.pos, pos); }

	  state.pos = pos;

	  return true;
	};

	// Alternative implementation, for memory.
	//
	// It costs 10% of performance, but allows extend terminators list, if place it
	// to `ParcerInline` property. Probably, will switch to it sometime, such
	// flexibility required.

	/*
	var TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~]/;

	module.exports = function text(state, silent) {
	  var pos = state.pos,
	      idx = state.src.slice(pos).search(TERMINATOR_RE);

	  // first char is terminator -> empty text
	  if (idx === 0) { return false; }

	  // no terminator -> text till end of string
	  if (idx < 0) {
	    if (!silent) { state.pending += state.src.slice(pos); }
	    state.pos = state.src.length;
	    return true;
	  }

	  if (!silent) { state.pending += state.src.slice(pos, pos + idx); }

	  state.pos += idx;

	  return true;
	};*/
	return text;
}

var linkify;
var hasRequiredLinkify;

function requireLinkify () {
	if (hasRequiredLinkify) return linkify;
	hasRequiredLinkify = 1;


	// RFC3986: scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
	var SCHEME_RE = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;


	linkify = function linkify(state, silent) {
	  var pos, max, match, proto, link, url, fullUrl, token;

	  if (!state.md.options.linkify) return false;
	  if (state.linkLevel > 0) return false;

	  pos = state.pos;
	  max = state.posMax;

	  if (pos + 3 > max) return false;
	  if (state.src.charCodeAt(pos) !== 0x3A/* : */) return false;
	  if (state.src.charCodeAt(pos + 1) !== 0x2F/* / */) return false;
	  if (state.src.charCodeAt(pos + 2) !== 0x2F/* / */) return false;

	  match = state.pending.match(SCHEME_RE);
	  if (!match) return false;

	  proto = match[1];

	  link = state.md.linkify.matchAtStart(state.src.slice(pos - proto.length));
	  if (!link) return false;

	  url = link.url;

	  // disallow '*' at the end of the link (conflicts with emphasis)
	  url = url.replace(/\*+$/, '');

	  fullUrl = state.md.normalizeLink(url);
	  if (!state.md.validateLink(fullUrl)) return false;

	  if (!silent) {
	    state.pending = state.pending.slice(0, -proto.length);

	    token         = state.push('link_open', 'a', 1);
	    token.attrs   = [ [ 'href', fullUrl ] ];
	    token.markup  = 'linkify';
	    token.info    = 'auto';

	    token         = state.push('text', '', 0);
	    token.content = state.md.normalizeLinkText(url);

	    token         = state.push('link_close', 'a', -1);
	    token.markup  = 'linkify';
	    token.info    = 'auto';
	  }

	  state.pos += url.length - proto.length;
	  return true;
	};
	return linkify;
}

var newline;
var hasRequiredNewline;

function requireNewline () {
	if (hasRequiredNewline) return newline;
	hasRequiredNewline = 1;

	var isSpace = requireUtils().isSpace;


	newline = function newline(state, silent) {
	  var pmax, max, ws, pos = state.pos;

	  if (state.src.charCodeAt(pos) !== 0x0A/* \n */) { return false; }

	  pmax = state.pending.length - 1;
	  max = state.posMax;

	  // '  \n' -> hardbreak
	  // Lookup in pending chars is bad practice! Don't copy to other rules!
	  // Pending string is stored in concat mode, indexed lookups will cause
	  // convertion to flat mode.
	  if (!silent) {
	    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
	      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
	        // Find whitespaces tail of pending chars.
	        ws = pmax - 1;
	        while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 0x20) ws--;

	        state.pending = state.pending.slice(0, ws);
	        state.push('hardbreak', 'br', 0);
	      } else {
	        state.pending = state.pending.slice(0, -1);
	        state.push('softbreak', 'br', 0);
	      }

	    } else {
	      state.push('softbreak', 'br', 0);
	    }
	  }

	  pos++;

	  // skip heading spaces for next line
	  while (pos < max && isSpace(state.src.charCodeAt(pos))) { pos++; }

	  state.pos = pos;
	  return true;
	};
	return newline;
}

var _escape;
var hasRequired_escape;

function require_escape () {
	if (hasRequired_escape) return _escape;
	hasRequired_escape = 1;

	var isSpace = requireUtils().isSpace;

	var ESCAPED = [];

	for (var i = 0; i < 256; i++) { ESCAPED.push(0); }

	'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'
	  .split('').forEach(function (ch) { ESCAPED[ch.charCodeAt(0)] = 1; });


	_escape = function escape(state, silent) {
	  var ch1, ch2, origStr, escapedStr, token, pos = state.pos, max = state.posMax;

	  if (state.src.charCodeAt(pos) !== 0x5C/* \ */) return false;
	  pos++;

	  // '\' at the end of the inline block
	  if (pos >= max) return false;

	  ch1 = state.src.charCodeAt(pos);

	  if (ch1 === 0x0A) {
	    if (!silent) {
	      state.push('hardbreak', 'br', 0);
	    }

	    pos++;
	    // skip leading whitespaces from next line
	    while (pos < max) {
	      ch1 = state.src.charCodeAt(pos);
	      if (!isSpace(ch1)) break;
	      pos++;
	    }

	    state.pos = pos;
	    return true;
	  }

	  escapedStr = state.src[pos];

	  if (ch1 >= 0xD800 && ch1 <= 0xDBFF && pos + 1 < max) {
	    ch2 = state.src.charCodeAt(pos + 1);

	    if (ch2 >= 0xDC00 && ch2 <= 0xDFFF) {
	      escapedStr += state.src[pos + 1];
	      pos++;
	    }
	  }

	  origStr = '\\' + escapedStr;

	  if (!silent) {
	    token = state.push('text_special', '', 0);

	    if (ch1 < 256 && ESCAPED[ch1] !== 0) {
	      token.content = escapedStr;
	    } else {
	      token.content = origStr;
	    }

	    token.markup = origStr;
	    token.info   = 'escape';
	  }

	  state.pos = pos + 1;
	  return true;
	};
	return _escape;
}

var backticks;
var hasRequiredBackticks;

function requireBackticks () {
	if (hasRequiredBackticks) return backticks;
	hasRequiredBackticks = 1;


	backticks = function backtick(state, silent) {
	  var start, max, marker, token, matchStart, matchEnd, openerLength, closerLength,
	      pos = state.pos,
	      ch = state.src.charCodeAt(pos);

	  if (ch !== 0x60/* ` */) { return false; }

	  start = pos;
	  pos++;
	  max = state.posMax;

	  // scan marker length
	  while (pos < max && state.src.charCodeAt(pos) === 0x60/* ` */) { pos++; }

	  marker = state.src.slice(start, pos);
	  openerLength = marker.length;

	  if (state.backticksScanned && (state.backticks[openerLength] || 0) <= start) {
	    if (!silent) state.pending += marker;
	    state.pos += openerLength;
	    return true;
	  }

	  matchStart = matchEnd = pos;

	  // Nothing found in the cache, scan until the end of the line (or until marker is found)
	  while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
	    matchEnd = matchStart + 1;

	    // scan marker length
	    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) { matchEnd++; }

	    closerLength = matchEnd - matchStart;

	    if (closerLength === openerLength) {
	      // Found matching closer length.
	      if (!silent) {
	        token     = state.push('code_inline', 'code', 0);
	        token.markup  = marker;
	        token.content = state.src.slice(pos, matchStart)
	          .replace(/\n/g, ' ')
	          .replace(/^ (.+) $/, '$1');
	      }
	      state.pos = matchEnd;
	      return true;
	    }

	    // Some different length found, put it in cache as upper limit of where closer can be found
	    state.backticks[closerLength] = matchStart;
	  }

	  // Scanned through the end, didn't find anything
	  state.backticksScanned = true;

	  if (!silent) state.pending += marker;
	  state.pos += openerLength;
	  return true;
	};
	return backticks;
}

var strikethrough = {};

var hasRequiredStrikethrough;

function requireStrikethrough () {
	if (hasRequiredStrikethrough) return strikethrough;
	hasRequiredStrikethrough = 1;


	// Insert each marker as a separate text token, and add it to delimiter list
	//
	strikethrough.tokenize = function strikethrough(state, silent) {
	  var i, scanned, token, len, ch,
	      start = state.pos,
	      marker = state.src.charCodeAt(start);

	  if (silent) { return false; }

	  if (marker !== 0x7E/* ~ */) { return false; }

	  scanned = state.scanDelims(state.pos, true);
	  len = scanned.length;
	  ch = String.fromCharCode(marker);

	  if (len < 2) { return false; }

	  if (len % 2) {
	    token         = state.push('text', '', 0);
	    token.content = ch;
	    len--;
	  }

	  for (i = 0; i < len; i += 2) {
	    token         = state.push('text', '', 0);
	    token.content = ch + ch;

	    state.delimiters.push({
	      marker: marker,
	      length: 0,     // disable "rule of 3" length checks meant for emphasis
	      token:  state.tokens.length - 1,
	      end:    -1,
	      open:   scanned.can_open,
	      close:  scanned.can_close
	    });
	  }

	  state.pos += scanned.length;

	  return true;
	};


	function postProcess(state, delimiters) {
	  var i, j,
	      startDelim,
	      endDelim,
	      token,
	      loneMarkers = [],
	      max = delimiters.length;

	  for (i = 0; i < max; i++) {
	    startDelim = delimiters[i];

	    if (startDelim.marker !== 0x7E/* ~ */) {
	      continue;
	    }

	    if (startDelim.end === -1) {
	      continue;
	    }

	    endDelim = delimiters[startDelim.end];

	    token         = state.tokens[startDelim.token];
	    token.type    = 's_open';
	    token.tag     = 's';
	    token.nesting = 1;
	    token.markup  = '~~';
	    token.content = '';

	    token         = state.tokens[endDelim.token];
	    token.type    = 's_close';
	    token.tag     = 's';
	    token.nesting = -1;
	    token.markup  = '~~';
	    token.content = '';

	    if (state.tokens[endDelim.token - 1].type === 'text' &&
	        state.tokens[endDelim.token - 1].content === '~') {

	      loneMarkers.push(endDelim.token - 1);
	    }
	  }

	  // If a marker sequence has an odd number of characters, it's splitted
	  // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
	  // start of the sequence.
	  //
	  // So, we have to move all those markers after subsequent s_close tags.
	  //
	  while (loneMarkers.length) {
	    i = loneMarkers.pop();
	    j = i + 1;

	    while (j < state.tokens.length && state.tokens[j].type === 's_close') {
	      j++;
	    }

	    j--;

	    if (i !== j) {
	      token = state.tokens[j];
	      state.tokens[j] = state.tokens[i];
	      state.tokens[i] = token;
	    }
	  }
	}


	// Walk through delimiter list and replace text tokens with tags
	//
	strikethrough.postProcess = function strikethrough(state) {
	  var curr,
	      tokens_meta = state.tokens_meta,
	      max = state.tokens_meta.length;

	  postProcess(state, state.delimiters);

	  for (curr = 0; curr < max; curr++) {
	    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
	      postProcess(state, tokens_meta[curr].delimiters);
	    }
	  }
	};
	return strikethrough;
}

var emphasis = {};

var hasRequiredEmphasis;

function requireEmphasis () {
	if (hasRequiredEmphasis) return emphasis;
	hasRequiredEmphasis = 1;


	// Insert each marker as a separate text token, and add it to delimiter list
	//
	emphasis.tokenize = function emphasis(state, silent) {
	  var i, scanned, token,
	      start = state.pos,
	      marker = state.src.charCodeAt(start);

	  if (silent) { return false; }

	  if (marker !== 0x5F /* _ */ && marker !== 0x2A /* * */) { return false; }

	  scanned = state.scanDelims(state.pos, marker === 0x2A);

	  for (i = 0; i < scanned.length; i++) {
	    token         = state.push('text', '', 0);
	    token.content = String.fromCharCode(marker);

	    state.delimiters.push({
	      // Char code of the starting marker (number).
	      //
	      marker: marker,

	      // Total length of these series of delimiters.
	      //
	      length: scanned.length,

	      // A position of the token this delimiter corresponds to.
	      //
	      token:  state.tokens.length - 1,

	      // If this delimiter is matched as a valid opener, `end` will be
	      // equal to its position, otherwise it's `-1`.
	      //
	      end:    -1,

	      // Boolean flags that determine if this delimiter could open or close
	      // an emphasis.
	      //
	      open:   scanned.can_open,
	      close:  scanned.can_close
	    });
	  }

	  state.pos += scanned.length;

	  return true;
	};


	function postProcess(state, delimiters) {
	  var i,
	      startDelim,
	      endDelim,
	      token,
	      ch,
	      isStrong,
	      max = delimiters.length;

	  for (i = max - 1; i >= 0; i--) {
	    startDelim = delimiters[i];

	    if (startDelim.marker !== 0x5F/* _ */ && startDelim.marker !== 0x2A/* * */) {
	      continue;
	    }

	    // Process only opening markers
	    if (startDelim.end === -1) {
	      continue;
	    }

	    endDelim = delimiters[startDelim.end];

	    // If the previous delimiter has the same marker and is adjacent to this one,
	    // merge those into one strong delimiter.
	    //
	    // `<em><em>whatever</em></em>` -> `<strong>whatever</strong>`
	    //
	    isStrong = i > 0 &&
	               delimiters[i - 1].end === startDelim.end + 1 &&
	               // check that first two markers match and adjacent
	               delimiters[i - 1].marker === startDelim.marker &&
	               delimiters[i - 1].token === startDelim.token - 1 &&
	               // check that last two markers are adjacent (we can safely assume they match)
	               delimiters[startDelim.end + 1].token === endDelim.token + 1;

	    ch = String.fromCharCode(startDelim.marker);

	    token         = state.tokens[startDelim.token];
	    token.type    = isStrong ? 'strong_open' : 'em_open';
	    token.tag     = isStrong ? 'strong' : 'em';
	    token.nesting = 1;
	    token.markup  = isStrong ? ch + ch : ch;
	    token.content = '';

	    token         = state.tokens[endDelim.token];
	    token.type    = isStrong ? 'strong_close' : 'em_close';
	    token.tag     = isStrong ? 'strong' : 'em';
	    token.nesting = -1;
	    token.markup  = isStrong ? ch + ch : ch;
	    token.content = '';

	    if (isStrong) {
	      state.tokens[delimiters[i - 1].token].content = '';
	      state.tokens[delimiters[startDelim.end + 1].token].content = '';
	      i--;
	    }
	  }
	}


	// Walk through delimiter list and replace text tokens with tags
	//
	emphasis.postProcess = function emphasis(state) {
	  var curr,
	      tokens_meta = state.tokens_meta,
	      max = state.tokens_meta.length;

	  postProcess(state, state.delimiters);

	  for (curr = 0; curr < max; curr++) {
	    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
	      postProcess(state, tokens_meta[curr].delimiters);
	    }
	  }
	};
	return emphasis;
}

var link;
var hasRequiredLink;

function requireLink () {
	if (hasRequiredLink) return link;
	hasRequiredLink = 1;

	var normalizeReference   = requireUtils().normalizeReference;
	var isSpace              = requireUtils().isSpace;


	link = function link(state, silent) {
	  var attrs,
	      code,
	      label,
	      labelEnd,
	      labelStart,
	      pos,
	      res,
	      ref,
	      token,
	      href = '',
	      title = '',
	      oldPos = state.pos,
	      max = state.posMax,
	      start = state.pos,
	      parseReference = true;

	  if (state.src.charCodeAt(state.pos) !== 0x5B/* [ */) { return false; }

	  labelStart = state.pos + 1;
	  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);

	  // parser failed to find ']', so it's not a valid link
	  if (labelEnd < 0) { return false; }

	  pos = labelEnd + 1;
	  if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
	    //
	    // Inline link
	    //

	    // might have found a valid shortcut link, disable reference parsing
	    parseReference = false;

	    // [link](  <href>  "title"  )
	    //        ^^ skipping these spaces
	    pos++;
	    for (; pos < max; pos++) {
	      code = state.src.charCodeAt(pos);
	      if (!isSpace(code) && code !== 0x0A) { break; }
	    }
	    if (pos >= max) { return false; }

	    // [link](  <href>  "title"  )
	    //          ^^^^^^ parsing link destination
	    start = pos;
	    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
	    if (res.ok) {
	      href = state.md.normalizeLink(res.str);
	      if (state.md.validateLink(href)) {
	        pos = res.pos;
	      } else {
	        href = '';
	      }

	      // [link](  <href>  "title"  )
	      //                ^^ skipping these spaces
	      start = pos;
	      for (; pos < max; pos++) {
	        code = state.src.charCodeAt(pos);
	        if (!isSpace(code) && code !== 0x0A) { break; }
	      }

	      // [link](  <href>  "title"  )
	      //                  ^^^^^^^ parsing link title
	      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
	      if (pos < max && start !== pos && res.ok) {
	        title = res.str;
	        pos = res.pos;

	        // [link](  <href>  "title"  )
	        //                         ^^ skipping these spaces
	        for (; pos < max; pos++) {
	          code = state.src.charCodeAt(pos);
	          if (!isSpace(code) && code !== 0x0A) { break; }
	        }
	      }
	    }

	    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
	      // parsing a valid shortcut link failed, fallback to reference
	      parseReference = true;
	    }
	    pos++;
	  }

	  if (parseReference) {
	    //
	    // Link reference
	    //
	    if (typeof state.env.references === 'undefined') { return false; }

	    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
	      start = pos + 1;
	      pos = state.md.helpers.parseLinkLabel(state, pos);
	      if (pos >= 0) {
	        label = state.src.slice(start, pos++);
	      } else {
	        pos = labelEnd + 1;
	      }
	    } else {
	      pos = labelEnd + 1;
	    }

	    // covers label === '' and label === undefined
	    // (collapsed reference link and shortcut reference link respectively)
	    if (!label) { label = state.src.slice(labelStart, labelEnd); }

	    ref = state.env.references[normalizeReference(label)];
	    if (!ref) {
	      state.pos = oldPos;
	      return false;
	    }
	    href = ref.href;
	    title = ref.title;
	  }

	  //
	  // We found the end of the link, and know for a fact it's a valid link;
	  // so all that's left to do is to call tokenizer.
	  //
	  if (!silent) {
	    state.pos = labelStart;
	    state.posMax = labelEnd;

	    token        = state.push('link_open', 'a', 1);
	    token.attrs  = attrs = [ [ 'href', href ] ];
	    if (title) {
	      attrs.push([ 'title', title ]);
	    }

	    state.linkLevel++;
	    state.md.inline.tokenize(state);
	    state.linkLevel--;

	    token        = state.push('link_close', 'a', -1);
	  }

	  state.pos = pos;
	  state.posMax = max;
	  return true;
	};
	return link;
}

var image$2;
var hasRequiredImage;

function requireImage () {
	if (hasRequiredImage) return image$2;
	hasRequiredImage = 1;

	var normalizeReference   = requireUtils().normalizeReference;
	var isSpace              = requireUtils().isSpace;


	image$2 = function image(state, silent) {
	  var attrs,
	      code,
	      content,
	      label,
	      labelEnd,
	      labelStart,
	      pos,
	      ref,
	      res,
	      title,
	      token,
	      tokens,
	      start,
	      href = '',
	      oldPos = state.pos,
	      max = state.posMax;

	  if (state.src.charCodeAt(state.pos) !== 0x21/* ! */) { return false; }
	  if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) { return false; }

	  labelStart = state.pos + 2;
	  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);

	  // parser failed to find ']', so it's not a valid link
	  if (labelEnd < 0) { return false; }

	  pos = labelEnd + 1;
	  if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
	    //
	    // Inline link
	    //

	    // [link](  <href>  "title"  )
	    //        ^^ skipping these spaces
	    pos++;
	    for (; pos < max; pos++) {
	      code = state.src.charCodeAt(pos);
	      if (!isSpace(code) && code !== 0x0A) { break; }
	    }
	    if (pos >= max) { return false; }

	    // [link](  <href>  "title"  )
	    //          ^^^^^^ parsing link destination
	    start = pos;
	    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
	    if (res.ok) {
	      href = state.md.normalizeLink(res.str);
	      if (state.md.validateLink(href)) {
	        pos = res.pos;
	      } else {
	        href = '';
	      }
	    }

	    // [link](  <href>  "title"  )
	    //                ^^ skipping these spaces
	    start = pos;
	    for (; pos < max; pos++) {
	      code = state.src.charCodeAt(pos);
	      if (!isSpace(code) && code !== 0x0A) { break; }
	    }

	    // [link](  <href>  "title"  )
	    //                  ^^^^^^^ parsing link title
	    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
	    if (pos < max && start !== pos && res.ok) {
	      title = res.str;
	      pos = res.pos;

	      // [link](  <href>  "title"  )
	      //                         ^^ skipping these spaces
	      for (; pos < max; pos++) {
	        code = state.src.charCodeAt(pos);
	        if (!isSpace(code) && code !== 0x0A) { break; }
	      }
	    } else {
	      title = '';
	    }

	    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
	      state.pos = oldPos;
	      return false;
	    }
	    pos++;
	  } else {
	    //
	    // Link reference
	    //
	    if (typeof state.env.references === 'undefined') { return false; }

	    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
	      start = pos + 1;
	      pos = state.md.helpers.parseLinkLabel(state, pos);
	      if (pos >= 0) {
	        label = state.src.slice(start, pos++);
	      } else {
	        pos = labelEnd + 1;
	      }
	    } else {
	      pos = labelEnd + 1;
	    }

	    // covers label === '' and label === undefined
	    // (collapsed reference link and shortcut reference link respectively)
	    if (!label) { label = state.src.slice(labelStart, labelEnd); }

	    ref = state.env.references[normalizeReference(label)];
	    if (!ref) {
	      state.pos = oldPos;
	      return false;
	    }
	    href = ref.href;
	    title = ref.title;
	  }

	  //
	  // We found the end of the link, and know for a fact it's a valid link;
	  // so all that's left to do is to call tokenizer.
	  //
	  if (!silent) {
	    content = state.src.slice(labelStart, labelEnd);

	    state.md.inline.parse(
	      content,
	      state.md,
	      state.env,
	      tokens = []
	    );

	    token          = state.push('image', 'img', 0);
	    token.attrs    = attrs = [ [ 'src', href ], [ 'alt', '' ] ];
	    token.children = tokens;
	    token.content  = content;

	    if (title) {
	      attrs.push([ 'title', title ]);
	    }
	  }

	  state.pos = pos;
	  state.posMax = max;
	  return true;
	};
	return image$2;
}

var autolink;
var hasRequiredAutolink;

function requireAutolink () {
	if (hasRequiredAutolink) return autolink;
	hasRequiredAutolink = 1;


	/*eslint max-len:0*/
	var EMAIL_RE    = /^([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
	var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)$/;


	autolink = function autolink(state, silent) {
	  var url, fullUrl, token, ch, start, max,
	      pos = state.pos;

	  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

	  start = state.pos;
	  max = state.posMax;

	  for (;;) {
	    if (++pos >= max) return false;

	    ch = state.src.charCodeAt(pos);

	    if (ch === 0x3C /* < */) return false;
	    if (ch === 0x3E /* > */) break;
	  }

	  url = state.src.slice(start + 1, pos);

	  if (AUTOLINK_RE.test(url)) {
	    fullUrl = state.md.normalizeLink(url);
	    if (!state.md.validateLink(fullUrl)) { return false; }

	    if (!silent) {
	      token         = state.push('link_open', 'a', 1);
	      token.attrs   = [ [ 'href', fullUrl ] ];
	      token.markup  = 'autolink';
	      token.info    = 'auto';

	      token         = state.push('text', '', 0);
	      token.content = state.md.normalizeLinkText(url);

	      token         = state.push('link_close', 'a', -1);
	      token.markup  = 'autolink';
	      token.info    = 'auto';
	    }

	    state.pos += url.length + 2;
	    return true;
	  }

	  if (EMAIL_RE.test(url)) {
	    fullUrl = state.md.normalizeLink('mailto:' + url);
	    if (!state.md.validateLink(fullUrl)) { return false; }

	    if (!silent) {
	      token         = state.push('link_open', 'a', 1);
	      token.attrs   = [ [ 'href', fullUrl ] ];
	      token.markup  = 'autolink';
	      token.info    = 'auto';

	      token         = state.push('text', '', 0);
	      token.content = state.md.normalizeLinkText(url);

	      token         = state.push('link_close', 'a', -1);
	      token.markup  = 'autolink';
	      token.info    = 'auto';
	    }

	    state.pos += url.length + 2;
	    return true;
	  }

	  return false;
	};
	return autolink;
}

var html_inline;
var hasRequiredHtml_inline;

function requireHtml_inline () {
	if (hasRequiredHtml_inline) return html_inline;
	hasRequiredHtml_inline = 1;


	var HTML_TAG_RE = requireHtml_re().HTML_TAG_RE;


	function isLinkOpen(str) {
	  return /^<a[>\s]/i.test(str);
	}
	function isLinkClose(str) {
	  return /^<\/a\s*>/i.test(str);
	}


	function isLetter(ch) {
	  /*eslint no-bitwise:0*/
	  var lc = ch | 0x20; // to lower case
	  return (lc >= 0x61/* a */) && (lc <= 0x7a/* z */);
	}


	html_inline = function html_inline(state, silent) {
	  var ch, match, max, token,
	      pos = state.pos;

	  if (!state.md.options.html) { return false; }

	  // Check start
	  max = state.posMax;
	  if (state.src.charCodeAt(pos) !== 0x3C/* < */ ||
	      pos + 2 >= max) {
	    return false;
	  }

	  // Quick fail on second char
	  ch = state.src.charCodeAt(pos + 1);
	  if (ch !== 0x21/* ! */ &&
	      ch !== 0x3F/* ? */ &&
	      ch !== 0x2F/* / */ &&
	      !isLetter(ch)) {
	    return false;
	  }

	  match = state.src.slice(pos).match(HTML_TAG_RE);
	  if (!match) { return false; }

	  if (!silent) {
	    token         = state.push('html_inline', '', 0);
	    token.content = state.src.slice(pos, pos + match[0].length);

	    if (isLinkOpen(token.content))  state.linkLevel++;
	    if (isLinkClose(token.content)) state.linkLevel--;
	  }
	  state.pos += match[0].length;
	  return true;
	};
	return html_inline;
}

var entity;
var hasRequiredEntity;

function requireEntity () {
	if (hasRequiredEntity) return entity;
	hasRequiredEntity = 1;

	var entities          = requireEntities();
	var has               = requireUtils().has;
	var isValidEntityCode = requireUtils().isValidEntityCode;
	var fromCodePoint     = requireUtils().fromCodePoint;


	var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
	var NAMED_RE   = /^&([a-z][a-z0-9]{1,31});/i;


	entity = function entity(state, silent) {
	  var ch, code, match, token, pos = state.pos, max = state.posMax;

	  if (state.src.charCodeAt(pos) !== 0x26/* & */) return false;

	  if (pos + 1 >= max) return false;

	  ch = state.src.charCodeAt(pos + 1);

	  if (ch === 0x23 /* # */) {
	    match = state.src.slice(pos).match(DIGITAL_RE);
	    if (match) {
	      if (!silent) {
	        code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);

	        token         = state.push('text_special', '', 0);
	        token.content = isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
	        token.markup  = match[0];
	        token.info    = 'entity';
	      }
	      state.pos += match[0].length;
	      return true;
	    }
	  } else {
	    match = state.src.slice(pos).match(NAMED_RE);
	    if (match) {
	      if (has(entities, match[1])) {
	        if (!silent) {
	          token         = state.push('text_special', '', 0);
	          token.content = entities[match[1]];
	          token.markup  = match[0];
	          token.info    = 'entity';
	        }
	        state.pos += match[0].length;
	        return true;
	      }
	    }
	  }

	  return false;
	};
	return entity;
}

var balance_pairs;
var hasRequiredBalance_pairs;

function requireBalance_pairs () {
	if (hasRequiredBalance_pairs) return balance_pairs;
	hasRequiredBalance_pairs = 1;


	function processDelimiters(state, delimiters) {
	  var closerIdx, openerIdx, closer, opener, minOpenerIdx, newMinOpenerIdx,
	      isOddMatch, lastJump,
	      openersBottom = {},
	      max = delimiters.length;

	  if (!max) return;

	  // headerIdx is the first delimiter of the current (where closer is) delimiter run
	  var headerIdx = 0;
	  var lastTokenIdx = -2; // needs any value lower than -1
	  var jumps = [];

	  for (closerIdx = 0; closerIdx < max; closerIdx++) {
	    closer = delimiters[closerIdx];

	    jumps.push(0);

	    // markers belong to same delimiter run if:
	    //  - they have adjacent tokens
	    //  - AND markers are the same
	    //
	    if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) {
	      headerIdx = closerIdx;
	    }

	    lastTokenIdx = closer.token;

	    // Length is only used for emphasis-specific "rule of 3",
	    // if it's not defined (in strikethrough or 3rd party plugins),
	    // we can default it to 0 to disable those checks.
	    //
	    closer.length = closer.length || 0;

	    if (!closer.close) continue;

	    // Previously calculated lower bounds (previous fails)
	    // for each marker, each delimiter length modulo 3,
	    // and for whether this closer can be an opener;
	    // https://github.com/commonmark/cmark/commit/34250e12ccebdc6372b8b49c44fab57c72443460
	    if (!openersBottom.hasOwnProperty(closer.marker)) {
	      openersBottom[closer.marker] = [ -1, -1, -1, -1, -1, -1 ];
	    }

	    minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length % 3)];

	    openerIdx = headerIdx - jumps[headerIdx] - 1;

	    newMinOpenerIdx = openerIdx;

	    for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
	      opener = delimiters[openerIdx];

	      if (opener.marker !== closer.marker) continue;

	      if (opener.open && opener.end < 0) {

	        isOddMatch = false;

	        // from spec:
	        //
	        // If one of the delimiters can both open and close emphasis, then the
	        // sum of the lengths of the delimiter runs containing the opening and
	        // closing delimiters must not be a multiple of 3 unless both lengths
	        // are multiples of 3.
	        //
	        if (opener.close || closer.open) {
	          if ((opener.length + closer.length) % 3 === 0) {
	            if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
	              isOddMatch = true;
	            }
	          }
	        }

	        if (!isOddMatch) {
	          // If previous delimiter cannot be an opener, we can safely skip
	          // the entire sequence in future checks. This is required to make
	          // sure algorithm has linear complexity (see *_*_*_*_*_... case).
	          //
	          lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ?
	            jumps[openerIdx - 1] + 1 :
	            0;

	          jumps[closerIdx] = closerIdx - openerIdx + lastJump;
	          jumps[openerIdx] = lastJump;

	          closer.open  = false;
	          opener.end   = closerIdx;
	          opener.close = false;
	          newMinOpenerIdx = -1;
	          // treat next token as start of run,
	          // it optimizes skips in **<...>**a**<...>** pathological case
	          lastTokenIdx = -2;
	          break;
	        }
	      }
	    }

	    if (newMinOpenerIdx !== -1) {
	      // If match for this delimiter run failed, we want to set lower bound for
	      // future lookups. This is required to make sure algorithm has linear
	      // complexity.
	      //
	      // See details here:
	      // https://github.com/commonmark/cmark/issues/178#issuecomment-270417442
	      //
	      openersBottom[closer.marker][(closer.open ? 3 : 0) + ((closer.length || 0) % 3)] = newMinOpenerIdx;
	    }
	  }
	}


	balance_pairs = function link_pairs(state) {
	  var curr,
	      tokens_meta = state.tokens_meta,
	      max = state.tokens_meta.length;

	  processDelimiters(state, state.delimiters);

	  for (curr = 0; curr < max; curr++) {
	    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
	      processDelimiters(state, tokens_meta[curr].delimiters);
	    }
	  }
	};
	return balance_pairs;
}

var fragments_join;
var hasRequiredFragments_join;

function requireFragments_join () {
	if (hasRequiredFragments_join) return fragments_join;
	hasRequiredFragments_join = 1;


	fragments_join = function fragments_join(state) {
	  var curr, last,
	      level = 0,
	      tokens = state.tokens,
	      max = state.tokens.length;

	  for (curr = last = 0; curr < max; curr++) {
	    // re-calculate levels after emphasis/strikethrough turns some text nodes
	    // into opening/closing tags
	    if (tokens[curr].nesting < 0) level--; // closing tag
	    tokens[curr].level = level;
	    if (tokens[curr].nesting > 0) level++; // opening tag

	    if (tokens[curr].type === 'text' &&
	        curr + 1 < max &&
	        tokens[curr + 1].type === 'text') {

	      // collapse two adjacent text nodes
	      tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
	    } else {
	      if (curr !== last) { tokens[last] = tokens[curr]; }

	      last++;
	    }
	  }

	  if (curr !== last) {
	    tokens.length = last;
	  }
	};
	return fragments_join;
}

var state_inline;
var hasRequiredState_inline;

function requireState_inline () {
	if (hasRequiredState_inline) return state_inline;
	hasRequiredState_inline = 1;


	var Token          = requireToken();
	var isWhiteSpace   = requireUtils().isWhiteSpace;
	var isPunctChar    = requireUtils().isPunctChar;
	var isMdAsciiPunct = requireUtils().isMdAsciiPunct;


	function StateInline(src, md, env, outTokens) {
	  this.src = src;
	  this.env = env;
	  this.md = md;
	  this.tokens = outTokens;
	  this.tokens_meta = Array(outTokens.length);

	  this.pos = 0;
	  this.posMax = this.src.length;
	  this.level = 0;
	  this.pending = '';
	  this.pendingLevel = 0;

	  // Stores { start: end } pairs. Useful for backtrack
	  // optimization of pairs parse (emphasis, strikes).
	  this.cache = {};

	  // List of emphasis-like delimiters for current tag
	  this.delimiters = [];

	  // Stack of delimiter lists for upper level tags
	  this._prev_delimiters = [];

	  // backtick length => last seen position
	  this.backticks = {};
	  this.backticksScanned = false;

	  // Counter used to disable inline linkify-it execution
	  // inside <a> and markdown links
	  this.linkLevel = 0;
	}


	// Flush pending text
	//
	StateInline.prototype.pushPending = function () {
	  var token = new Token('text', '', 0);
	  token.content = this.pending;
	  token.level = this.pendingLevel;
	  this.tokens.push(token);
	  this.pending = '';
	  return token;
	};


	// Push new token to "stream".
	// If pending text exists - flush it as text token
	//
	StateInline.prototype.push = function (type, tag, nesting) {
	  if (this.pending) {
	    this.pushPending();
	  }

	  var token = new Token(type, tag, nesting);
	  var token_meta = null;

	  if (nesting < 0) {
	    // closing tag
	    this.level--;
	    this.delimiters = this._prev_delimiters.pop();
	  }

	  token.level = this.level;

	  if (nesting > 0) {
	    // opening tag
	    this.level++;
	    this._prev_delimiters.push(this.delimiters);
	    this.delimiters = [];
	    token_meta = { delimiters: this.delimiters };
	  }

	  this.pendingLevel = this.level;
	  this.tokens.push(token);
	  this.tokens_meta.push(token_meta);
	  return token;
	};


	// Scan a sequence of emphasis-like markers, and determine whether
	// it can start an emphasis sequence or end an emphasis sequence.
	//
	//  - start - position to scan from (it should point at a valid marker);
	//  - canSplitWord - determine if these markers can be found inside a word
	//
	StateInline.prototype.scanDelims = function (start, canSplitWord) {
	  var pos = start, lastChar, nextChar, count, can_open, can_close,
	      isLastWhiteSpace, isLastPunctChar,
	      isNextWhiteSpace, isNextPunctChar,
	      left_flanking = true,
	      right_flanking = true,
	      max = this.posMax,
	      marker = this.src.charCodeAt(start);

	  // treat beginning of the line as a whitespace
	  lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

	  while (pos < max && this.src.charCodeAt(pos) === marker) { pos++; }

	  count = pos - start;

	  // treat end of the line as a whitespace
	  nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;

	  isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
	  isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

	  isLastWhiteSpace = isWhiteSpace(lastChar);
	  isNextWhiteSpace = isWhiteSpace(nextChar);

	  if (isNextWhiteSpace) {
	    left_flanking = false;
	  } else if (isNextPunctChar) {
	    if (!(isLastWhiteSpace || isLastPunctChar)) {
	      left_flanking = false;
	    }
	  }

	  if (isLastWhiteSpace) {
	    right_flanking = false;
	  } else if (isLastPunctChar) {
	    if (!(isNextWhiteSpace || isNextPunctChar)) {
	      right_flanking = false;
	    }
	  }

	  if (!canSplitWord) {
	    can_open  = left_flanking  && (!right_flanking || isLastPunctChar);
	    can_close = right_flanking && (!left_flanking  || isNextPunctChar);
	  } else {
	    can_open  = left_flanking;
	    can_close = right_flanking;
	  }

	  return {
	    can_open:  can_open,
	    can_close: can_close,
	    length:    count
	  };
	};


	// re-export Token class to use in block rules
	StateInline.prototype.Token = Token;


	state_inline = StateInline;
	return state_inline;
}

/** internal
 * class ParserInline
 *
 * Tokenizes paragraph content.
 **/

var parser_inline;
var hasRequiredParser_inline;

function requireParser_inline () {
	if (hasRequiredParser_inline) return parser_inline;
	hasRequiredParser_inline = 1;


	var Ruler           = requireRuler();


	////////////////////////////////////////////////////////////////////////////////
	// Parser rules

	var _rules = [
	  [ 'text',            requireText() ],
	  [ 'linkify',         requireLinkify() ],
	  [ 'newline',         requireNewline() ],
	  [ 'escape',          require_escape() ],
	  [ 'backticks',       requireBackticks() ],
	  [ 'strikethrough',   requireStrikethrough().tokenize ],
	  [ 'emphasis',        requireEmphasis().tokenize ],
	  [ 'link',            requireLink() ],
	  [ 'image',           requireImage() ],
	  [ 'autolink',        requireAutolink() ],
	  [ 'html_inline',     requireHtml_inline() ],
	  [ 'entity',          requireEntity() ]
	];

	// `rule2` ruleset was created specifically for emphasis/strikethrough
	// post-processing and may be changed in the future.
	//
	// Don't use this for anything except pairs (plugins working with `balance_pairs`).
	//
	var _rules2 = [
	  [ 'balance_pairs',   requireBalance_pairs() ],
	  [ 'strikethrough',   requireStrikethrough().postProcess ],
	  [ 'emphasis',        requireEmphasis().postProcess ],
	  // rules for pairs separate '**' into its own text tokens, which may be left unused,
	  // rule below merges unused segments back with the rest of the text
	  [ 'fragments_join',  requireFragments_join() ]
	];


	/**
	 * new ParserInline()
	 **/
	function ParserInline() {
	  var i;

	  /**
	   * ParserInline#ruler -> Ruler
	   *
	   * [[Ruler]] instance. Keep configuration of inline rules.
	   **/
	  this.ruler = new Ruler();

	  for (i = 0; i < _rules.length; i++) {
	    this.ruler.push(_rules[i][0], _rules[i][1]);
	  }

	  /**
	   * ParserInline#ruler2 -> Ruler
	   *
	   * [[Ruler]] instance. Second ruler used for post-processing
	   * (e.g. in emphasis-like rules).
	   **/
	  this.ruler2 = new Ruler();

	  for (i = 0; i < _rules2.length; i++) {
	    this.ruler2.push(_rules2[i][0], _rules2[i][1]);
	  }
	}


	// Skip single token by running all rules in validation mode;
	// returns `true` if any rule reported success
	//
	ParserInline.prototype.skipToken = function (state) {
	  var ok, i, pos = state.pos,
	      rules = this.ruler.getRules(''),
	      len = rules.length,
	      maxNesting = state.md.options.maxNesting,
	      cache = state.cache;


	  if (typeof cache[pos] !== 'undefined') {
	    state.pos = cache[pos];
	    return;
	  }

	  if (state.level < maxNesting) {
	    for (i = 0; i < len; i++) {
	      // Increment state.level and decrement it later to limit recursion.
	      // It's harmless to do here, because no tokens are created. But ideally,
	      // we'd need a separate private state variable for this purpose.
	      //
	      state.level++;
	      ok = rules[i](state, true);
	      state.level--;

	      if (ok) { break; }
	    }
	  } else {
	    // Too much nesting, just skip until the end of the paragraph.
	    //
	    // NOTE: this will cause links to behave incorrectly in the following case,
	    //       when an amount of `[` is exactly equal to `maxNesting + 1`:
	    //
	    //       [[[[[[[[[[[[[[[[[[[[[foo]()
	    //
	    // TODO: remove this workaround when CM standard will allow nested links
	    //       (we can replace it by preventing links from being parsed in
	    //       validation mode)
	    //
	    state.pos = state.posMax;
	  }

	  if (!ok) { state.pos++; }
	  cache[pos] = state.pos;
	};


	// Generate tokens for input range
	//
	ParserInline.prototype.tokenize = function (state) {
	  var ok, i,
	      rules = this.ruler.getRules(''),
	      len = rules.length,
	      end = state.posMax,
	      maxNesting = state.md.options.maxNesting;

	  while (state.pos < end) {
	    // Try all possible rules.
	    // On success, rule should:
	    //
	    // - update `state.pos`
	    // - update `state.tokens`
	    // - return true

	    if (state.level < maxNesting) {
	      for (i = 0; i < len; i++) {
	        ok = rules[i](state, false);
	        if (ok) { break; }
	      }
	    }

	    if (ok) {
	      if (state.pos >= end) { break; }
	      continue;
	    }

	    state.pending += state.src[state.pos++];
	  }

	  if (state.pending) {
	    state.pushPending();
	  }
	};


	/**
	 * ParserInline.parse(str, md, env, outTokens)
	 *
	 * Process input string and push inline tokens into `outTokens`
	 **/
	ParserInline.prototype.parse = function (str, md, env, outTokens) {
	  var i, rules, len;
	  var state = new this.State(str, md, env, outTokens);

	  this.tokenize(state);

	  rules = this.ruler2.getRules('');
	  len = rules.length;

	  for (i = 0; i < len; i++) {
	    rules[i](state);
	  }
	};


	ParserInline.prototype.State = requireState_inline();


	parser_inline = ParserInline;
	return parser_inline;
}

var re;
var hasRequiredRe;

function requireRe () {
	if (hasRequiredRe) return re;
	hasRequiredRe = 1;


	re = function (opts) {
	  var re = {};
	  opts = opts || {};

	  // Use direct extract instead of `regenerate` to reduse browserified size
	  re.src_Any = requireRegex$3().source;
	  re.src_Cc  = requireRegex$2().source;
	  re.src_Z   = requireRegex().source;
	  re.src_P   = requireRegex$4().source;

	  // \p{\Z\P\Cc\CF} (white spaces + control + format + punctuation)
	  re.src_ZPCc = [ re.src_Z, re.src_P, re.src_Cc ].join('|');

	  // \p{\Z\Cc} (white spaces + control)
	  re.src_ZCc = [ re.src_Z, re.src_Cc ].join('|');

	  // Experimental. List of chars, completely prohibited in links
	  // because can separate it from other part of text
	  var text_separators = '[><\uff5c]';

	  // All possible word characters (everything without punctuation, spaces & controls)
	  // Defined via punctuation & spaces to save space
	  // Should be something like \p{\L\N\S\M} (\w but without `_`)
	  re.src_pseudo_letter       = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')';
	  // The same as abothe but without [0-9]
	  // var src_pseudo_letter_non_d = '(?:(?![0-9]|' + src_ZPCc + ')' + src_Any + ')';

	  ////////////////////////////////////////////////////////////////////////////////

	  re.src_ip4 =

	    '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';

	  // Prohibit any of "@/[]()" in user/pass to avoid wrong domain fetch.
	  re.src_auth    = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';

	  re.src_port =

	    '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';

	  re.src_host_terminator =

	    '(?=$|' + text_separators + '|' + re.src_ZPCc + ')' +
	    '(?!' + (opts['---'] ? '-(?!--)|' : '-|') + '_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';

	  re.src_path =

	    '(?:' +
	      '[/?#]' +
	        '(?:' +
	          '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-;]).|' +
	          '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' +
	          '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' +
	          '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' +
	          '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' +
	          "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" +
	          "\\'(?=" + re.src_pseudo_letter + '|[-])|' +  // allow `I'm_king` if no pair found
	          '\\.{2,}[a-zA-Z0-9%/&]|' + // google has many dots in "google search" links (#66, #81).
	                                     // github has ... in commit range links,
	                                     // Restrict to
	                                     // - english
	                                     // - percent-encoded
	                                     // - parts of file path
	                                     // - params separator
	                                     // until more examples found.
	          '\\.(?!' + re.src_ZCc + '|[.]|$)|' +
	          (opts['---'] ?
	            '\\-(?!--(?:[^-]|$))(?:-*)|' // `---` => long dash, terminate
	            :
	            '\\-+|'
	          ) +
	          ',(?!' + re.src_ZCc + '|$)|' +       // allow `,,,` in paths
	          ';(?!' + re.src_ZCc + '|$)|' +       // allow `;` if not followed by space-like char
	          '\\!+(?!' + re.src_ZCc + '|[!]|$)|' +  // allow `!!!` in paths, but not at the end
	          '\\?(?!' + re.src_ZCc + '|[?]|$)' +
	        ')+' +
	      '|\\/' +
	    ')?';

	  // Allow anything in markdown spec, forbid quote (") at the first position
	  // because emails enclosed in quotes are far more common
	  re.src_email_name =

	    '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';

	  re.src_xn =

	    'xn--[a-z0-9\\-]{1,59}';

	  // More to read about domain names
	  // http://serverfault.com/questions/638260/

	  re.src_domain_root =

	    // Allow letters & digits (http://test1)
	    '(?:' +
	      re.src_xn +
	      '|' +
	      re.src_pseudo_letter + '{1,63}' +
	    ')';

	  re.src_domain =

	    '(?:' +
	      re.src_xn +
	      '|' +
	      '(?:' + re.src_pseudo_letter + ')' +
	      '|' +
	      '(?:' + re.src_pseudo_letter + '(?:-|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' +
	    ')';

	  re.src_host =

	    '(?:' +
	    // Don't need IP check, because digits are already allowed in normal domain names
	    //   src_ip4 +
	    // '|' +
	      '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain/*_root*/ + ')' +
	    ')';

	  re.tpl_host_fuzzy =

	    '(?:' +
	      re.src_ip4 +
	    '|' +
	      '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' +
	    ')';

	  re.tpl_host_no_ip_fuzzy =

	    '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';

	  re.src_host_strict =

	    re.src_host + re.src_host_terminator;

	  re.tpl_host_fuzzy_strict =

	    re.tpl_host_fuzzy + re.src_host_terminator;

	  re.src_host_port_strict =

	    re.src_host + re.src_port + re.src_host_terminator;

	  re.tpl_host_port_fuzzy_strict =

	    re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;

	  re.tpl_host_port_no_ip_fuzzy_strict =

	    re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;


	  ////////////////////////////////////////////////////////////////////////////////
	  // Main rules

	  // Rude test fuzzy links by host, for quick deny
	  re.tpl_host_fuzzy_test =

	    'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';

	  re.tpl_email_fuzzy =

	      '(^|' + text_separators + '|"|\\(|' + re.src_ZCc + ')' +
	      '(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';

	  re.tpl_link_fuzzy =
	      // Fuzzy link can't be prepended with .:/\- and non punctuation.
	      // but can start with > (markdown blockquote)
	      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
	      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';

	  re.tpl_link_no_ip_fuzzy =
	      // Fuzzy link can't be prepended with .:/\- and non punctuation.
	      // but can start with > (markdown blockquote)
	      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
	      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';

	  return re;
	};
	return re;
}

var linkifyIt;
var hasRequiredLinkifyIt;

function requireLinkifyIt () {
	if (hasRequiredLinkifyIt) return linkifyIt;
	hasRequiredLinkifyIt = 1;


	////////////////////////////////////////////////////////////////////////////////
	// Helpers

	// Merge objects
	//
	function assign(obj /*from1, from2, from3, ...*/) {
	  var sources = Array.prototype.slice.call(arguments, 1);

	  sources.forEach(function (source) {
	    if (!source) { return; }

	    Object.keys(source).forEach(function (key) {
	      obj[key] = source[key];
	    });
	  });

	  return obj;
	}

	function _class(obj) { return Object.prototype.toString.call(obj); }
	function isString(obj) { return _class(obj) === '[object String]'; }
	function isObject(obj) { return _class(obj) === '[object Object]'; }
	function isRegExp(obj) { return _class(obj) === '[object RegExp]'; }
	function isFunction(obj) { return _class(obj) === '[object Function]'; }


	function escapeRE(str) { return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); }

	////////////////////////////////////////////////////////////////////////////////


	var defaultOptions = {
	  fuzzyLink: true,
	  fuzzyEmail: true,
	  fuzzyIP: false
	};


	function isOptionsObj(obj) {
	  return Object.keys(obj || {}).reduce(function (acc, k) {
	    return acc || defaultOptions.hasOwnProperty(k);
	  }, false);
	}


	var defaultSchemas = {
	  'http:': {
	    validate: function (text, pos, self) {
	      var tail = text.slice(pos);

	      if (!self.re.http) {
	        // compile lazily, because "host"-containing variables can change on tlds update.
	        self.re.http =  new RegExp(
	          '^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i'
	        );
	      }
	      if (self.re.http.test(tail)) {
	        return tail.match(self.re.http)[0].length;
	      }
	      return 0;
	    }
	  },
	  'https:':  'http:',
	  'ftp:':    'http:',
	  '//':      {
	    validate: function (text, pos, self) {
	      var tail = text.slice(pos);

	      if (!self.re.no_http) {
	      // compile lazily, because "host"-containing variables can change on tlds update.
	        self.re.no_http =  new RegExp(
	          '^' +
	          self.re.src_auth +
	          // Don't allow single-level domains, because of false positives like '//test'
	          // with code comments
	          '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' +
	          self.re.src_port +
	          self.re.src_host_terminator +
	          self.re.src_path,

	          'i'
	        );
	      }

	      if (self.re.no_http.test(tail)) {
	        // should not be `://` & `///`, that protects from errors in protocol name
	        if (pos >= 3 && text[pos - 3] === ':') { return 0; }
	        if (pos >= 3 && text[pos - 3] === '/') { return 0; }
	        return tail.match(self.re.no_http)[0].length;
	      }
	      return 0;
	    }
	  },
	  'mailto:': {
	    validate: function (text, pos, self) {
	      var tail = text.slice(pos);

	      if (!self.re.mailto) {
	        self.re.mailto =  new RegExp(
	          '^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i'
	        );
	      }
	      if (self.re.mailto.test(tail)) {
	        return tail.match(self.re.mailto)[0].length;
	      }
	      return 0;
	    }
	  }
	};

	/*eslint-disable max-len*/

	// RE pattern for 2-character tlds (autogenerated by ./support/tlds_2char_gen.js)
	var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]';

	// DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead
	var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');

	/*eslint-enable max-len*/

	////////////////////////////////////////////////////////////////////////////////

	function resetScanCache(self) {
	  self.__index__ = -1;
	  self.__text_cache__   = '';
	}

	function createValidator(re) {
	  return function (text, pos) {
	    var tail = text.slice(pos);

	    if (re.test(tail)) {
	      return tail.match(re)[0].length;
	    }
	    return 0;
	  };
	}

	function createNormalizer() {
	  return function (match, self) {
	    self.normalize(match);
	  };
	}

	// Schemas compiler. Build regexps.
	//
	function compile(self) {

	  // Load & clone RE patterns.
	  var re = self.re = requireRe()(self.__opts__);

	  // Define dynamic patterns
	  var tlds = self.__tlds__.slice();

	  self.onCompile();

	  if (!self.__tlds_replaced__) {
	    tlds.push(tlds_2ch_src_re);
	  }
	  tlds.push(re.src_xn);

	  re.src_tlds = tlds.join('|');

	  function untpl(tpl) { return tpl.replace('%TLDS%', re.src_tlds); }

	  re.email_fuzzy      = RegExp(untpl(re.tpl_email_fuzzy), 'i');
	  re.link_fuzzy       = RegExp(untpl(re.tpl_link_fuzzy), 'i');
	  re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), 'i');
	  re.host_fuzzy_test  = RegExp(untpl(re.tpl_host_fuzzy_test), 'i');

	  //
	  // Compile each schema
	  //

	  var aliases = [];

	  self.__compiled__ = {}; // Reset compiled data

	  function schemaError(name, val) {
	    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
	  }

	  Object.keys(self.__schemas__).forEach(function (name) {
	    var val = self.__schemas__[name];

	    // skip disabled methods
	    if (val === null) { return; }

	    var compiled = { validate: null, link: null };

	    self.__compiled__[name] = compiled;

	    if (isObject(val)) {
	      if (isRegExp(val.validate)) {
	        compiled.validate = createValidator(val.validate);
	      } else if (isFunction(val.validate)) {
	        compiled.validate = val.validate;
	      } else {
	        schemaError(name, val);
	      }

	      if (isFunction(val.normalize)) {
	        compiled.normalize = val.normalize;
	      } else if (!val.normalize) {
	        compiled.normalize = createNormalizer();
	      } else {
	        schemaError(name, val);
	      }

	      return;
	    }

	    if (isString(val)) {
	      aliases.push(name);
	      return;
	    }

	    schemaError(name, val);
	  });

	  //
	  // Compile postponed aliases
	  //

	  aliases.forEach(function (alias) {
	    if (!self.__compiled__[self.__schemas__[alias]]) {
	      // Silently fail on missed schemas to avoid errons on disable.
	      // schemaError(alias, self.__schemas__[alias]);
	      return;
	    }

	    self.__compiled__[alias].validate =
	      self.__compiled__[self.__schemas__[alias]].validate;
	    self.__compiled__[alias].normalize =
	      self.__compiled__[self.__schemas__[alias]].normalize;
	  });

	  //
	  // Fake record for guessed links
	  //
	  self.__compiled__[''] = { validate: null, normalize: createNormalizer() };

	  //
	  // Build schema condition
	  //
	  var slist = Object.keys(self.__compiled__)
	                      .filter(function (name) {
	                        // Filter disabled & fake schemas
	                        return name.length > 0 && self.__compiled__[name];
	                      })
	                      .map(escapeRE)
	                      .join('|');
	  // (?!_) cause 1.5x slowdown
	  self.re.schema_test     = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'i');
	  self.re.schema_search   = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'ig');
	  self.re.schema_at_start = RegExp('^' + self.re.schema_search.source, 'i');

	  self.re.pretest = RegExp(
	    '(' + self.re.schema_test.source + ')|(' + self.re.host_fuzzy_test.source + ')|@',
	    'i'
	  );

	  //
	  // Cleanup
	  //

	  resetScanCache(self);
	}

	/**
	 * class Match
	 *
	 * Match result. Single element of array, returned by [[LinkifyIt#match]]
	 **/
	function Match(self, shift) {
	  var start = self.__index__,
	      end   = self.__last_index__,
	      text  = self.__text_cache__.slice(start, end);

	  /**
	   * Match#schema -> String
	   *
	   * Prefix (protocol) for matched string.
	   **/
	  this.schema    = self.__schema__.toLowerCase();
	  /**
	   * Match#index -> Number
	   *
	   * First position of matched string.
	   **/
	  this.index     = start + shift;
	  /**
	   * Match#lastIndex -> Number
	   *
	   * Next position after matched string.
	   **/
	  this.lastIndex = end + shift;
	  /**
	   * Match#raw -> String
	   *
	   * Matched string.
	   **/
	  this.raw       = text;
	  /**
	   * Match#text -> String
	   *
	   * Notmalized text of matched string.
	   **/
	  this.text      = text;
	  /**
	   * Match#url -> String
	   *
	   * Normalized url of matched string.
	   **/
	  this.url       = text;
	}

	function createMatch(self, shift) {
	  var match = new Match(self, shift);

	  self.__compiled__[match.schema].normalize(match, self);

	  return match;
	}


	/**
	 * class LinkifyIt
	 **/

	/**
	 * new LinkifyIt(schemas, options)
	 * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
	 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
	 *
	 * Creates new linkifier instance with optional additional schemas.
	 * Can be called without `new` keyword for convenience.
	 *
	 * By default understands:
	 *
	 * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
	 * - "fuzzy" links and emails (example.com, foo@bar.com).
	 *
	 * `schemas` is an object, where each key/value describes protocol/rule:
	 *
	 * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
	 *   for example). `linkify-it` makes shure that prefix is not preceeded with
	 *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
	 * - __value__ - rule to check tail after link prefix
	 *   - _String_ - just alias to existing rule
	 *   - _Object_
	 *     - _validate_ - validator function (should return matched length on success),
	 *       or `RegExp`.
	 *     - _normalize_ - optional function to normalize text & url of matched result
	 *       (for example, for @twitter mentions).
	 *
	 * `options`:
	 *
	 * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
	 * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
	 *   like version numbers. Default `false`.
	 * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
	 *
	 **/
	function LinkifyIt(schemas, options) {
	  if (!(this instanceof LinkifyIt)) {
	    return new LinkifyIt(schemas, options);
	  }

	  if (!options) {
	    if (isOptionsObj(schemas)) {
	      options = schemas;
	      schemas = {};
	    }
	  }

	  this.__opts__           = assign({}, defaultOptions, options);

	  // Cache last tested result. Used to skip repeating steps on next `match` call.
	  this.__index__          = -1;
	  this.__last_index__     = -1; // Next scan position
	  this.__schema__         = '';
	  this.__text_cache__     = '';

	  this.__schemas__        = assign({}, defaultSchemas, schemas);
	  this.__compiled__       = {};

	  this.__tlds__           = tlds_default;
	  this.__tlds_replaced__  = false;

	  this.re = {};

	  compile(this);
	}


	/** chainable
	 * LinkifyIt#add(schema, definition)
	 * - schema (String): rule name (fixed pattern prefix)
	 * - definition (String|RegExp|Object): schema definition
	 *
	 * Add new rule definition. See constructor description for details.
	 **/
	LinkifyIt.prototype.add = function add(schema, definition) {
	  this.__schemas__[schema] = definition;
	  compile(this);
	  return this;
	};


	/** chainable
	 * LinkifyIt#set(options)
	 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
	 *
	 * Set recognition options for links without schema.
	 **/
	LinkifyIt.prototype.set = function set(options) {
	  this.__opts__ = assign(this.__opts__, options);
	  return this;
	};


	/**
	 * LinkifyIt#test(text) -> Boolean
	 *
	 * Searches linkifiable pattern and returns `true` on success or `false` on fail.
	 **/
	LinkifyIt.prototype.test = function test(text) {
	  // Reset scan cache
	  this.__text_cache__ = text;
	  this.__index__      = -1;

	  if (!text.length) { return false; }

	  var m, ml, me, len, shift, next, re, tld_pos, at_pos;

	  // try to scan for link with schema - that's the most simple rule
	  if (this.re.schema_test.test(text)) {
	    re = this.re.schema_search;
	    re.lastIndex = 0;
	    while ((m = re.exec(text)) !== null) {
	      len = this.testSchemaAt(text, m[2], re.lastIndex);
	      if (len) {
	        this.__schema__     = m[2];
	        this.__index__      = m.index + m[1].length;
	        this.__last_index__ = m.index + m[0].length + len;
	        break;
	      }
	    }
	  }

	  if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
	    // guess schemaless links
	    tld_pos = text.search(this.re.host_fuzzy_test);
	    if (tld_pos >= 0) {
	      // if tld is located after found link - no need to check fuzzy pattern
	      if (this.__index__ < 0 || tld_pos < this.__index__) {
	        if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {

	          shift = ml.index + ml[1].length;

	          if (this.__index__ < 0 || shift < this.__index__) {
	            this.__schema__     = '';
	            this.__index__      = shift;
	            this.__last_index__ = ml.index + ml[0].length;
	          }
	        }
	      }
	    }
	  }

	  if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
	    // guess schemaless emails
	    at_pos = text.indexOf('@');
	    if (at_pos >= 0) {
	      // We can't skip this check, because this cases are possible:
	      // 192.168.1.1@gmail.com, my.in@example.com
	      if ((me = text.match(this.re.email_fuzzy)) !== null) {

	        shift = me.index + me[1].length;
	        next  = me.index + me[0].length;

	        if (this.__index__ < 0 || shift < this.__index__ ||
	            (shift === this.__index__ && next > this.__last_index__)) {
	          this.__schema__     = 'mailto:';
	          this.__index__      = shift;
	          this.__last_index__ = next;
	        }
	      }
	    }
	  }

	  return this.__index__ >= 0;
	};


	/**
	 * LinkifyIt#pretest(text) -> Boolean
	 *
	 * Very quick check, that can give false positives. Returns true if link MAY BE
	 * can exists. Can be used for speed optimization, when you need to check that
	 * link NOT exists.
	 **/
	LinkifyIt.prototype.pretest = function pretest(text) {
	  return this.re.pretest.test(text);
	};


	/**
	 * LinkifyIt#testSchemaAt(text, name, position) -> Number
	 * - text (String): text to scan
	 * - name (String): rule (schema) name
	 * - position (Number): text offset to check from
	 *
	 * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
	 * at given position. Returns length of found pattern (0 on fail).
	 **/
	LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
	  // If not supported schema check requested - terminate
	  if (!this.__compiled__[schema.toLowerCase()]) {
	    return 0;
	  }
	  return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
	};


	/**
	 * LinkifyIt#match(text) -> Array|null
	 *
	 * Returns array of found link descriptions or `null` on fail. We strongly
	 * recommend to use [[LinkifyIt#test]] first, for best speed.
	 *
	 * ##### Result match description
	 *
	 * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
	 *   protocol-neutral  links.
	 * - __index__ - offset of matched text
	 * - __lastIndex__ - index of next char after mathch end
	 * - __raw__ - matched text
	 * - __text__ - normalized text
	 * - __url__ - link, generated from matched text
	 **/
	LinkifyIt.prototype.match = function match(text) {
	  var shift = 0, result = [];

	  // Try to take previous element from cache, if .test() called before
	  if (this.__index__ >= 0 && this.__text_cache__ === text) {
	    result.push(createMatch(this, shift));
	    shift = this.__last_index__;
	  }

	  // Cut head if cache was used
	  var tail = shift ? text.slice(shift) : text;

	  // Scan string until end reached
	  while (this.test(tail)) {
	    result.push(createMatch(this, shift));

	    tail = tail.slice(this.__last_index__);
	    shift += this.__last_index__;
	  }

	  if (result.length) {
	    return result;
	  }

	  return null;
	};


	/**
	 * LinkifyIt#matchAtStart(text) -> Match|null
	 *
	 * Returns fully-formed (not fuzzy) link if it starts at the beginning
	 * of the string, and null otherwise.
	 **/
	LinkifyIt.prototype.matchAtStart = function matchAtStart(text) {
	  // Reset scan cache
	  this.__text_cache__ = text;
	  this.__index__      = -1;

	  if (!text.length) return null;

	  var m = this.re.schema_at_start.exec(text);
	  if (!m) return null;

	  var len = this.testSchemaAt(text, m[2], m[0].length);
	  if (!len) return null;

	  this.__schema__     = m[2];
	  this.__index__      = m.index + m[1].length;
	  this.__last_index__ = m.index + m[0].length + len;

	  return createMatch(this, 0);
	};


	/** chainable
	 * LinkifyIt#tlds(list [, keepOld]) -> this
	 * - list (Array): list of tlds
	 * - keepOld (Boolean): merge with current list if `true` (`false` by default)
	 *
	 * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
	 * to avoid false positives. By default this algorythm used:
	 *
	 * - hostname with any 2-letter root zones are ok.
	 * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
	 *   are ok.
	 * - encoded (`xn--...`) root zones are ok.
	 *
	 * If list is replaced, then exact match for 2-chars root zones will be checked.
	 **/
	LinkifyIt.prototype.tlds = function tlds(list, keepOld) {
	  list = Array.isArray(list) ? list : [ list ];

	  if (!keepOld) {
	    this.__tlds__ = list.slice();
	    this.__tlds_replaced__ = true;
	    compile(this);
	    return this;
	  }

	  this.__tlds__ = this.__tlds__.concat(list)
	                                  .sort()
	                                  .filter(function (el, idx, arr) {
	                                    return el !== arr[idx - 1];
	                                  })
	                                  .reverse();

	  compile(this);
	  return this;
	};

	/**
	 * LinkifyIt#normalize(match)
	 *
	 * Default normalizer (if schema does not define it's own).
	 **/
	LinkifyIt.prototype.normalize = function normalize(match) {

	  // Do minimal possible changes by default. Need to collect feedback prior
	  // to move forward https://github.com/markdown-it/linkify-it/issues/1

	  if (!match.schema) { match.url = 'http://' + match.url; }

	  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
	    match.url = 'mailto:' + match.url;
	  }
	};


	/**
	 * LinkifyIt#onCompile()
	 *
	 * Override to modify basic RegExp-s.
	 **/
	LinkifyIt.prototype.onCompile = function onCompile() {
	};


	linkifyIt = LinkifyIt;
	return linkifyIt;
}

var _default;
var hasRequired_default;

function require_default () {
	if (hasRequired_default) return _default;
	hasRequired_default = 1;


	_default = {
	  options: {
	    html:         false,        // Enable HTML tags in source
	    xhtmlOut:     false,        // Use '/' to close single tags (<br />)
	    breaks:       false,        // Convert '\n' in paragraphs into <br>
	    langPrefix:   'language-',  // CSS language prefix for fenced blocks
	    linkify:      false,        // autoconvert URL-like texts to links

	    // Enable some language-neutral replacements + quotes beautification
	    typographer:  false,

	    // Double + single quotes replacement pairs, when typographer enabled,
	    // and smartquotes on. Could be either a String or an Array.
	    //
	    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
	    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
	    quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

	    // Highlighter function. Should return escaped HTML,
	    // or '' if the source string is not changed and should be escaped externaly.
	    // If result starts with <pre... internal wrapper is skipped.
	    //
	    // function (/*str, lang*/) { return ''; }
	    //
	    highlight: null,

	    maxNesting:   100            // Internal protection, recursion limit
	  },

	  components: {

	    core: {},
	    block: {},
	    inline: {}
	  }
	};
	return _default;
}

var zero;
var hasRequiredZero;

function requireZero () {
	if (hasRequiredZero) return zero;
	hasRequiredZero = 1;


	zero = {
	  options: {
	    html:         false,        // Enable HTML tags in source
	    xhtmlOut:     false,        // Use '/' to close single tags (<br />)
	    breaks:       false,        // Convert '\n' in paragraphs into <br>
	    langPrefix:   'language-',  // CSS language prefix for fenced blocks
	    linkify:      false,        // autoconvert URL-like texts to links

	    // Enable some language-neutral replacements + quotes beautification
	    typographer:  false,

	    // Double + single quotes replacement pairs, when typographer enabled,
	    // and smartquotes on. Could be either a String or an Array.
	    //
	    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
	    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
	    quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

	    // Highlighter function. Should return escaped HTML,
	    // or '' if the source string is not changed and should be escaped externaly.
	    // If result starts with <pre... internal wrapper is skipped.
	    //
	    // function (/*str, lang*/) { return ''; }
	    //
	    highlight: null,

	    maxNesting:   20            // Internal protection, recursion limit
	  },

	  components: {

	    core: {
	      rules: [
	        'normalize',
	        'block',
	        'inline',
	        'text_join'
	      ]
	    },

	    block: {
	      rules: [
	        'paragraph'
	      ]
	    },

	    inline: {
	      rules: [
	        'text'
	      ],
	      rules2: [
	        'balance_pairs',
	        'fragments_join'
	      ]
	    }
	  }
	};
	return zero;
}

var commonmark;
var hasRequiredCommonmark;

function requireCommonmark () {
	if (hasRequiredCommonmark) return commonmark;
	hasRequiredCommonmark = 1;


	commonmark = {
	  options: {
	    html:         true,         // Enable HTML tags in source
	    xhtmlOut:     true,         // Use '/' to close single tags (<br />)
	    breaks:       false,        // Convert '\n' in paragraphs into <br>
	    langPrefix:   'language-',  // CSS language prefix for fenced blocks
	    linkify:      false,        // autoconvert URL-like texts to links

	    // Enable some language-neutral replacements + quotes beautification
	    typographer:  false,

	    // Double + single quotes replacement pairs, when typographer enabled,
	    // and smartquotes on. Could be either a String or an Array.
	    //
	    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
	    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
	    quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

	    // Highlighter function. Should return escaped HTML,
	    // or '' if the source string is not changed and should be escaped externaly.
	    // If result starts with <pre... internal wrapper is skipped.
	    //
	    // function (/*str, lang*/) { return ''; }
	    //
	    highlight: null,

	    maxNesting:   20            // Internal protection, recursion limit
	  },

	  components: {

	    core: {
	      rules: [
	        'normalize',
	        'block',
	        'inline',
	        'text_join'
	      ]
	    },

	    block: {
	      rules: [
	        'blockquote',
	        'code',
	        'fence',
	        'heading',
	        'hr',
	        'html_block',
	        'lheading',
	        'list',
	        'reference',
	        'paragraph'
	      ]
	    },

	    inline: {
	      rules: [
	        'autolink',
	        'backticks',
	        'emphasis',
	        'entity',
	        'escape',
	        'html_inline',
	        'image',
	        'link',
	        'newline',
	        'text'
	      ],
	      rules2: [
	        'balance_pairs',
	        'emphasis',
	        'fragments_join'
	      ]
	    }
	  }
	};
	return commonmark;
}

var lib;
var hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib;
	hasRequiredLib = 1;


	var utils        = requireUtils();
	var helpers      = requireHelpers();
	var Renderer     = requireRenderer();
	var ParserCore   = requireParser_core();
	var ParserBlock  = requireParser_block();
	var ParserInline = requireParser_inline();
	var LinkifyIt    = requireLinkifyIt();
	var mdurl        = requireMdurl();
	var punycode     = require$$8;


	var config = {
	  default: require_default(),
	  zero: requireZero(),
	  commonmark: requireCommonmark()
	};

	////////////////////////////////////////////////////////////////////////////////
	//
	// This validator can prohibit more than really needed to prevent XSS. It's a
	// tradeoff to keep code simple and to be secure by default.
	//
	// If you need different setup - override validator method as you wish. Or
	// replace it with dummy function and use external sanitizer.
	//

	var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
	var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

	function validateLink(url) {
	  // url should be normalized at this point, and existing entities are decoded
	  var str = url.trim().toLowerCase();

	  return BAD_PROTO_RE.test(str) ? (GOOD_DATA_RE.test(str) ? true : false) : true;
	}

	////////////////////////////////////////////////////////////////////////////////


	var RECODE_HOSTNAME_FOR = [ 'http:', 'https:', 'mailto:' ];

	function normalizeLink(url) {
	  var parsed = mdurl.parse(url, true);

	  if (parsed.hostname) {
	    // Encode hostnames in urls like:
	    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
	    //
	    // We don't encode unknown schemas, because it's likely that we encode
	    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
	    //
	    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
	      try {
	        parsed.hostname = punycode.toASCII(parsed.hostname);
	      } catch (er) { /**/ }
	    }
	  }

	  return mdurl.encode(mdurl.format(parsed));
	}

	function normalizeLinkText(url) {
	  var parsed = mdurl.parse(url, true);

	  if (parsed.hostname) {
	    // Encode hostnames in urls like:
	    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
	    //
	    // We don't encode unknown schemas, because it's likely that we encode
	    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
	    //
	    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
	      try {
	        parsed.hostname = punycode.toUnicode(parsed.hostname);
	      } catch (er) { /**/ }
	    }
	  }

	  // add '%' to exclude list because of https://github.com/markdown-it/markdown-it/issues/720
	  return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + '%');
	}


	/**
	 * class MarkdownIt
	 *
	 * Main parser/renderer class.
	 *
	 * ##### Usage
	 *
	 * ```javascript
	 * // node.js, "classic" way:
	 * var MarkdownIt = require('markdown-it'),
	 *     md = new MarkdownIt();
	 * var result = md.render('# markdown-it rulezz!');
	 *
	 * // node.js, the same, but with sugar:
	 * var md = require('markdown-it')();
	 * var result = md.render('# markdown-it rulezz!');
	 *
	 * // browser without AMD, added to "window" on script load
	 * // Note, there are no dash.
	 * var md = window.markdownit();
	 * var result = md.render('# markdown-it rulezz!');
	 * ```
	 *
	 * Single line rendering, without paragraph wrap:
	 *
	 * ```javascript
	 * var md = require('markdown-it')();
	 * var result = md.renderInline('__markdown-it__ rulezz!');
	 * ```
	 **/

	/**
	 * new MarkdownIt([presetName, options])
	 * - presetName (String): optional, `commonmark` / `zero`
	 * - options (Object)
	 *
	 * Creates parser instanse with given config. Can be called without `new`.
	 *
	 * ##### presetName
	 *
	 * MarkdownIt provides named presets as a convenience to quickly
	 * enable/disable active syntax rules and options for common use cases.
	 *
	 * - ["commonmark"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.js) -
	 *   configures parser to strict [CommonMark](http://commonmark.org/) mode.
	 * - [default](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/default.js) -
	 *   similar to GFM, used when no preset name given. Enables all available rules,
	 *   but still without html, typographer & autolinker.
	 * - ["zero"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/zero.js) -
	 *   all rules disabled. Useful to quickly setup your config via `.enable()`.
	 *   For example, when you need only `bold` and `italic` markup and nothing else.
	 *
	 * ##### options:
	 *
	 * - __html__ - `false`. Set `true` to enable HTML tags in source. Be careful!
	 *   That's not safe! You may need external sanitizer to protect output from XSS.
	 *   It's better to extend features via plugins, instead of enabling HTML.
	 * - __xhtmlOut__ - `false`. Set `true` to add '/' when closing single tags
	 *   (`<br />`). This is needed only for full CommonMark compatibility. In real
	 *   world you will need HTML output.
	 * - __breaks__ - `false`. Set `true` to convert `\n` in paragraphs into `<br>`.
	 * - __langPrefix__ - `language-`. CSS language class prefix for fenced blocks.
	 *   Can be useful for external highlighters.
	 * - __linkify__ - `false`. Set `true` to autoconvert URL-like text to links.
	 * - __typographer__  - `false`. Set `true` to enable [some language-neutral
	 *   replacement](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js) +
	 *   quotes beautification (smartquotes).
	 * - __quotes__ - `“”‘’`, String or Array. Double + single quotes replacement
	 *   pairs, when typographer enabled and smartquotes on. For example, you can
	 *   use `'«»„“'` for Russian, `'„“‚‘'` for German, and
	 *   `['«\xA0', '\xA0»', '‹\xA0', '\xA0›']` for French (including nbsp).
	 * - __highlight__ - `null`. Highlighter function for fenced code blocks.
	 *   Highlighter `function (str, lang)` should return escaped HTML. It can also
	 *   return empty string if the source was not changed and should be escaped
	 *   externaly. If result starts with <pre... internal wrapper is skipped.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * // commonmark mode
	 * var md = require('markdown-it')('commonmark');
	 *
	 * // default mode
	 * var md = require('markdown-it')();
	 *
	 * // enable everything
	 * var md = require('markdown-it')({
	 *   html: true,
	 *   linkify: true,
	 *   typographer: true
	 * });
	 * ```
	 *
	 * ##### Syntax highlighting
	 *
	 * ```js
	 * var hljs = require('highlight.js') // https://highlightjs.org/
	 *
	 * var md = require('markdown-it')({
	 *   highlight: function (str, lang) {
	 *     if (lang && hljs.getLanguage(lang)) {
	 *       try {
	 *         return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
	 *       } catch (__) {}
	 *     }
	 *
	 *     return ''; // use external default escaping
	 *   }
	 * });
	 * ```
	 *
	 * Or with full wrapper override (if you need assign class to `<pre>`):
	 *
	 * ```javascript
	 * var hljs = require('highlight.js') // https://highlightjs.org/
	 *
	 * // Actual default values
	 * var md = require('markdown-it')({
	 *   highlight: function (str, lang) {
	 *     if (lang && hljs.getLanguage(lang)) {
	 *       try {
	 *         return '<pre class="hljs"><code>' +
	 *                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
	 *                '</code></pre>';
	 *       } catch (__) {}
	 *     }
	 *
	 *     return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
	 *   }
	 * });
	 * ```
	 *
	 **/
	function MarkdownIt(presetName, options) {
	  if (!(this instanceof MarkdownIt)) {
	    return new MarkdownIt(presetName, options);
	  }

	  if (!options) {
	    if (!utils.isString(presetName)) {
	      options = presetName || {};
	      presetName = 'default';
	    }
	  }

	  /**
	   * MarkdownIt#inline -> ParserInline
	   *
	   * Instance of [[ParserInline]]. You may need it to add new rules when
	   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
	   * [[MarkdownIt.enable]].
	   **/
	  this.inline = new ParserInline();

	  /**
	   * MarkdownIt#block -> ParserBlock
	   *
	   * Instance of [[ParserBlock]]. You may need it to add new rules when
	   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
	   * [[MarkdownIt.enable]].
	   **/
	  this.block = new ParserBlock();

	  /**
	   * MarkdownIt#core -> Core
	   *
	   * Instance of [[Core]] chain executor. You may need it to add new rules when
	   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
	   * [[MarkdownIt.enable]].
	   **/
	  this.core = new ParserCore();

	  /**
	   * MarkdownIt#renderer -> Renderer
	   *
	   * Instance of [[Renderer]]. Use it to modify output look. Or to add rendering
	   * rules for new token types, generated by plugins.
	   *
	   * ##### Example
	   *
	   * ```javascript
	   * var md = require('markdown-it')();
	   *
	   * function myToken(tokens, idx, options, env, self) {
	   *   //...
	   *   return result;
	   * };
	   *
	   * md.renderer.rules['my_token'] = myToken
	   * ```
	   *
	   * See [[Renderer]] docs and [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js).
	   **/
	  this.renderer = new Renderer();

	  /**
	   * MarkdownIt#linkify -> LinkifyIt
	   *
	   * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
	   * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/linkify.js)
	   * rule.
	   **/
	  this.linkify = new LinkifyIt();

	  /**
	   * MarkdownIt#validateLink(url) -> Boolean
	   *
	   * Link validation function. CommonMark allows too much in links. By default
	   * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
	   * except some embedded image types.
	   *
	   * You can change this behaviour:
	   *
	   * ```javascript
	   * var md = require('markdown-it')();
	   * // enable everything
	   * md.validateLink = function () { return true; }
	   * ```
	   **/
	  this.validateLink = validateLink;

	  /**
	   * MarkdownIt#normalizeLink(url) -> String
	   *
	   * Function used to encode link url to a machine-readable format,
	   * which includes url-encoding, punycode, etc.
	   **/
	  this.normalizeLink = normalizeLink;

	  /**
	   * MarkdownIt#normalizeLinkText(url) -> String
	   *
	   * Function used to decode link url to a human-readable format`
	   **/
	  this.normalizeLinkText = normalizeLinkText;


	  // Expose utils & helpers for easy acces from plugins

	  /**
	   * MarkdownIt#utils -> utils
	   *
	   * Assorted utility functions, useful to write plugins. See details
	   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js).
	   **/
	  this.utils = utils;

	  /**
	   * MarkdownIt#helpers -> helpers
	   *
	   * Link components parser functions, useful to write plugins. See details
	   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/helpers).
	   **/
	  this.helpers = utils.assign({}, helpers);


	  this.options = {};
	  this.configure(presetName);

	  if (options) { this.set(options); }
	}


	/** chainable
	 * MarkdownIt.set(options)
	 *
	 * Set parser options (in the same format as in constructor). Probably, you
	 * will never need it, but you can change options after constructor call.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * var md = require('markdown-it')()
	 *             .set({ html: true, breaks: true })
	 *             .set({ typographer, true });
	 * ```
	 *
	 * __Note:__ To achieve the best possible performance, don't modify a
	 * `markdown-it` instance options on the fly. If you need multiple configurations
	 * it's best to create multiple instances and initialize each with separate
	 * config.
	 **/
	MarkdownIt.prototype.set = function (options) {
	  utils.assign(this.options, options);
	  return this;
	};


	/** chainable, internal
	 * MarkdownIt.configure(presets)
	 *
	 * Batch load of all options and compenent settings. This is internal method,
	 * and you probably will not need it. But if you will - see available presets
	 * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/lib/presets)
	 *
	 * We strongly recommend to use presets instead of direct config loads. That
	 * will give better compatibility with next versions.
	 **/
	MarkdownIt.prototype.configure = function (presets) {
	  var self = this, presetName;

	  if (utils.isString(presets)) {
	    presetName = presets;
	    presets = config[presetName];
	    if (!presets) { throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name'); }
	  }

	  if (!presets) { throw new Error('Wrong `markdown-it` preset, can\'t be empty'); }

	  if (presets.options) { self.set(presets.options); }

	  if (presets.components) {
	    Object.keys(presets.components).forEach(function (name) {
	      if (presets.components[name].rules) {
	        self[name].ruler.enableOnly(presets.components[name].rules);
	      }
	      if (presets.components[name].rules2) {
	        self[name].ruler2.enableOnly(presets.components[name].rules2);
	      }
	    });
	  }
	  return this;
	};


	/** chainable
	 * MarkdownIt.enable(list, ignoreInvalid)
	 * - list (String|Array): rule name or list of rule names to enable
	 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
	 *
	 * Enable list or rules. It will automatically find appropriate components,
	 * containing rules with given names. If rule not found, and `ignoreInvalid`
	 * not set - throws exception.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * var md = require('markdown-it')()
	 *             .enable(['sub', 'sup'])
	 *             .disable('smartquotes');
	 * ```
	 **/
	MarkdownIt.prototype.enable = function (list, ignoreInvalid) {
	  var result = [];

	  if (!Array.isArray(list)) { list = [ list ]; }

	  [ 'core', 'block', 'inline' ].forEach(function (chain) {
	    result = result.concat(this[chain].ruler.enable(list, true));
	  }, this);

	  result = result.concat(this.inline.ruler2.enable(list, true));

	  var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

	  if (missed.length && !ignoreInvalid) {
	    throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + missed);
	  }

	  return this;
	};


	/** chainable
	 * MarkdownIt.disable(list, ignoreInvalid)
	 * - list (String|Array): rule name or list of rule names to disable.
	 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
	 *
	 * The same as [[MarkdownIt.enable]], but turn specified rules off.
	 **/
	MarkdownIt.prototype.disable = function (list, ignoreInvalid) {
	  var result = [];

	  if (!Array.isArray(list)) { list = [ list ]; }

	  [ 'core', 'block', 'inline' ].forEach(function (chain) {
	    result = result.concat(this[chain].ruler.disable(list, true));
	  }, this);

	  result = result.concat(this.inline.ruler2.disable(list, true));

	  var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

	  if (missed.length && !ignoreInvalid) {
	    throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + missed);
	  }
	  return this;
	};


	/** chainable
	 * MarkdownIt.use(plugin, params)
	 *
	 * Load specified plugin with given params into current parser instance.
	 * It's just a sugar to call `plugin(md, params)` with curring.
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * var iterator = require('markdown-it-for-inline');
	 * var md = require('markdown-it')()
	 *             .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
	 *               tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar');
	 *             });
	 * ```
	 **/
	MarkdownIt.prototype.use = function (plugin /*, params, ... */) {
	  var args = [ this ].concat(Array.prototype.slice.call(arguments, 1));
	  plugin.apply(plugin, args);
	  return this;
	};


	/** internal
	 * MarkdownIt.parse(src, env) -> Array
	 * - src (String): source string
	 * - env (Object): environment sandbox
	 *
	 * Parse input string and return list of block tokens (special token type
	 * "inline" will contain list of inline tokens). You should not call this
	 * method directly, until you write custom renderer (for example, to produce
	 * AST).
	 *
	 * `env` is used to pass data between "distributed" rules and return additional
	 * metadata like reference info, needed for the renderer. It also can be used to
	 * inject data in specific cases. Usually, you will be ok to pass `{}`,
	 * and then pass updated object to renderer.
	 **/
	MarkdownIt.prototype.parse = function (src, env) {
	  if (typeof src !== 'string') {
	    throw new Error('Input data should be a String');
	  }

	  var state = new this.core.State(src, this, env);

	  this.core.process(state);

	  return state.tokens;
	};


	/**
	 * MarkdownIt.render(src [, env]) -> String
	 * - src (String): source string
	 * - env (Object): environment sandbox
	 *
	 * Render markdown string into html. It does all magic for you :).
	 *
	 * `env` can be used to inject additional metadata (`{}` by default).
	 * But you will not need it with high probability. See also comment
	 * in [[MarkdownIt.parse]].
	 **/
	MarkdownIt.prototype.render = function (src, env) {
	  env = env || {};

	  return this.renderer.render(this.parse(src, env), this.options, env);
	};


	/** internal
	 * MarkdownIt.parseInline(src, env) -> Array
	 * - src (String): source string
	 * - env (Object): environment sandbox
	 *
	 * The same as [[MarkdownIt.parse]] but skip all block rules. It returns the
	 * block tokens list with the single `inline` element, containing parsed inline
	 * tokens in `children` property. Also updates `env` object.
	 **/
	MarkdownIt.prototype.parseInline = function (src, env) {
	  var state = new this.core.State(src, this, env);

	  state.inlineMode = true;
	  this.core.process(state);

	  return state.tokens;
	};


	/**
	 * MarkdownIt.renderInline(src [, env]) -> String
	 * - src (String): source string
	 * - env (Object): environment sandbox
	 *
	 * Similar to [[MarkdownIt.render]] but for single paragraph content. Result
	 * will NOT be wrapped into `<p>` tags.
	 **/
	MarkdownIt.prototype.renderInline = function (src, env) {
	  env = env || {};

	  return this.renderer.render(this.parseInline(src, env), this.options, env);
	};


	lib = MarkdownIt;
	return lib;
}

var hasRequiredMarkdownIt;

function requireMarkdownIt () {
	if (hasRequiredMarkdownIt) return markdownItExports$1;
	hasRequiredMarkdownIt = 1;
	(function (module) {


		module.exports = requireLib();
} (markdownIt));
	return markdownItExports$1;
}

var markdownItExports = requireMarkdownIt();
var MarkdownIt = /*@__PURE__*/getDefaultExportFromCjs(markdownItExports);

var markdownItDeflist;
var hasRequiredMarkdownItDeflist;

function requireMarkdownItDeflist () {
	if (hasRequiredMarkdownItDeflist) return markdownItDeflist;
	hasRequiredMarkdownItDeflist = 1;


	markdownItDeflist = function deflist_plugin(md) {
	  var isSpace = md.utils.isSpace;

	  // Search `[:~][\n ]`, returns next pos after marker on success
	  // or -1 on fail.
	  function skipMarker(state, line) {
	    var pos, marker,
	        start = state.bMarks[line] + state.tShift[line],
	        max = state.eMarks[line];

	    if (start >= max) { return -1; }

	    // Check bullet
	    marker = state.src.charCodeAt(start++);
	    if (marker !== 0x7E/* ~ */ && marker !== 0x3A/* : */) { return -1; }

	    pos = state.skipSpaces(start);

	    // require space after ":"
	    if (start === pos) { return -1; }

	    // no empty definitions, e.g. "  : "
	    if (pos >= max) { return -1; }

	    return start;
	  }

	  function markTightParagraphs(state, idx) {
	    var i, l,
	        level = state.level + 2;

	    for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
	      if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
	        state.tokens[i + 2].hidden = true;
	        state.tokens[i].hidden = true;
	        i += 2;
	      }
	    }
	  }

	  function deflist(state, startLine, endLine, silent) {
	    var ch,
	        contentStart,
	        ddLine,
	        dtLine,
	        itemLines,
	        listLines,
	        listTokIdx,
	        max,
	        nextLine,
	        offset,
	        oldDDIndent,
	        oldIndent,
	        oldParentType,
	        oldSCount,
	        oldTShift,
	        oldTight,
	        pos,
	        prevEmptyEnd,
	        tight,
	        token;

	    if (silent) {
	      // quirk: validation mode validates a dd block only, not a whole deflist
	      if (state.ddIndent < 0) { return false; }
	      return skipMarker(state, startLine) >= 0;
	    }

	    nextLine = startLine + 1;
	    if (nextLine >= endLine) { return false; }

	    if (state.isEmpty(nextLine)) {
	      nextLine++;
	      if (nextLine >= endLine) { return false; }
	    }

	    if (state.sCount[nextLine] < state.blkIndent) { return false; }
	    contentStart = skipMarker(state, nextLine);
	    if (contentStart < 0) { return false; }

	    // Start list
	    listTokIdx = state.tokens.length;
	    tight = true;

	    token     = state.push('dl_open', 'dl', 1);
	    token.map = listLines = [ startLine, 0 ];

	    //
	    // Iterate list items
	    //

	    dtLine = startLine;
	    ddLine = nextLine;

	    // One definition list can contain multiple DTs,
	    // and one DT can be followed by multiple DDs.
	    //
	    // Thus, there is two loops here, and label is
	    // needed to break out of the second one
	    //
	    /*eslint no-labels:0,block-scoped-var:0*/
	    OUTER:
	    for (;;) {
	      prevEmptyEnd = false;

	      token          = state.push('dt_open', 'dt', 1);
	      token.map      = [ dtLine, dtLine ];

	      token          = state.push('inline', '', 0);
	      token.map      = [ dtLine, dtLine ];
	      token.content  = state.getLines(dtLine, dtLine + 1, state.blkIndent, false).trim();
	      token.children = [];

	      token          = state.push('dt_close', 'dt', -1);

	      for (;;) {
	        token     = state.push('dd_open', 'dd', 1);
	        token.map = itemLines = [ nextLine, 0 ];

	        pos = contentStart;
	        max = state.eMarks[ddLine];
	        offset = state.sCount[ddLine] + contentStart - (state.bMarks[ddLine] + state.tShift[ddLine]);

	        while (pos < max) {
	          ch = state.src.charCodeAt(pos);

	          if (isSpace(ch)) {
	            if (ch === 0x09) {
	              offset += 4 - offset % 4;
	            } else {
	              offset++;
	            }
	          } else {
	            break;
	          }

	          pos++;
	        }

	        contentStart = pos;

	        oldTight = state.tight;
	        oldDDIndent = state.ddIndent;
	        oldIndent = state.blkIndent;
	        oldTShift = state.tShift[ddLine];
	        oldSCount = state.sCount[ddLine];
	        oldParentType = state.parentType;
	        state.blkIndent = state.ddIndent = state.sCount[ddLine] + 2;
	        state.tShift[ddLine] = contentStart - state.bMarks[ddLine];
	        state.sCount[ddLine] = offset;
	        state.tight = true;
	        state.parentType = 'deflist';

	        state.md.block.tokenize(state, ddLine, endLine, true);

	        // If any of list item is tight, mark list as tight
	        if (!state.tight || prevEmptyEnd) {
	          tight = false;
	        }
	        // Item become loose if finish with empty line,
	        // but we should filter last element, because it means list finish
	        prevEmptyEnd = (state.line - ddLine) > 1 && state.isEmpty(state.line - 1);

	        state.tShift[ddLine] = oldTShift;
	        state.sCount[ddLine] = oldSCount;
	        state.tight = oldTight;
	        state.parentType = oldParentType;
	        state.blkIndent = oldIndent;
	        state.ddIndent = oldDDIndent;

	        token = state.push('dd_close', 'dd', -1);

	        itemLines[1] = nextLine = state.line;

	        if (nextLine >= endLine) { break OUTER; }

	        if (state.sCount[nextLine] < state.blkIndent) { break OUTER; }
	        contentStart = skipMarker(state, nextLine);
	        if (contentStart < 0) { break; }

	        ddLine = nextLine;

	        // go to the next loop iteration:
	        // insert DD tag and repeat checking
	      }

	      if (nextLine >= endLine) { break; }
	      dtLine = nextLine;

	      if (state.isEmpty(dtLine)) { break; }
	      if (state.sCount[dtLine] < state.blkIndent) { break; }

	      ddLine = dtLine + 1;
	      if (ddLine >= endLine) { break; }
	      if (state.isEmpty(ddLine)) { ddLine++; }
	      if (ddLine >= endLine) { break; }

	      if (state.sCount[ddLine] < state.blkIndent) { break; }
	      contentStart = skipMarker(state, ddLine);
	      if (contentStart < 0) { break; }

	      // go to the next loop iteration:
	      // insert DT and DD tags and repeat checking
	    }

	    // Finilize list
	    token = state.push('dl_close', 'dl', -1);

	    listLines[1] = nextLine;

	    state.line = nextLine;

	    // mark paragraphs tight if needed
	    if (tight) {
	      markTightParagraphs(state, listTokIdx);
	    }

	    return true;
	  }


	  md.block.ruler.before('paragraph', 'deflist', deflist, { alt: [ 'paragraph', 'reference', 'blockquote' ] });
	};
	return markdownItDeflist;
}

var markdownItDeflistExports = requireMarkdownItDeflist();
var deflist = /*@__PURE__*/getDefaultExportFromCjs(markdownItDeflistExports);

var e=!1,n={false:"push",true:"unshift",after:"push",before:"unshift"},t={isPermalinkSymbol:!0};function r(r,a,i,l){var o;if(!e){var c="Using deprecated markdown-it-anchor permalink option, see https://github.com/valeriangalliat/markdown-it-anchor#permalinks";"object"==typeof process&&process&&process.emitWarning?process.emitWarning(c):console.warn(c),e=!0;}var s=[Object.assign(new i.Token("link_open","a",1),{attrs:[].concat(a.permalinkClass?[["class",a.permalinkClass]]:[],[["href",a.permalinkHref(r,i)]],Object.entries(a.permalinkAttrs(r,i)))}),Object.assign(new i.Token("html_block","",0),{content:a.permalinkSymbol,meta:t}),new i.Token("link_close","a",-1)];a.permalinkSpace&&i.tokens[l+1].children[n[a.permalinkBefore]](Object.assign(new i.Token("text","",0),{content:" "})),(o=i.tokens[l+1].children)[n[a.permalinkBefore]].apply(o,s);}function a(e){return "#"+e}function i(e){return {}}var l={class:"header-anchor",symbol:"#",renderHref:a,renderAttrs:i};function o(e){function n(t){return t=Object.assign({},n.defaults,t),function(n,r,a,i){return e(n,t,r,a,i)}}return n.defaults=Object.assign({},l),n.renderPermalinkImpl=e,n}var c=o(function(e,r,a,i,l){var o,c=[Object.assign(new i.Token("link_open","a",1),{attrs:[].concat(r.class?[["class",r.class]]:[],[["href",r.renderHref(e,i)]],r.ariaHidden?[["aria-hidden","true"]]:[],Object.entries(r.renderAttrs(e,i)))}),Object.assign(new i.Token("html_inline","",0),{content:r.symbol,meta:t}),new i.Token("link_close","a",-1)];if(r.space){var s="string"==typeof r.space?r.space:" ";i.tokens[l+1].children[n[r.placement]](Object.assign(new i.Token("string"==typeof r.space?"html_inline":"text","",0),{content:s}));}(o=i.tokens[l+1].children)[n[r.placement]].apply(o,c);});Object.assign(c.defaults,{space:!0,placement:"after",ariaHidden:!1});var s=o(c.renderPermalinkImpl);s.defaults=Object.assign({},c.defaults,{ariaHidden:!0});var u=o(function(e,n,t,r,a){var i=[Object.assign(new r.Token("link_open","a",1),{attrs:[].concat(n.class?[["class",n.class]]:[],[["href",n.renderHref(e,r)]],Object.entries(n.renderAttrs(e,r)))})].concat(n.safariReaderFix?[new r.Token("span_open","span",1)]:[],r.tokens[a+1].children,n.safariReaderFix?[new r.Token("span_close","span",-1)]:[],[new r.Token("link_close","a",-1)]);r.tokens[a+1]=Object.assign(new r.Token("inline","",0),{children:i});});Object.assign(u.defaults,{safariReaderFix:!1});var d=o(function(e,r,a,i,l){var o;if(!["visually-hidden","aria-label","aria-describedby","aria-labelledby"].includes(r.style))throw new Error("`permalink.linkAfterHeader` called with unknown style option `"+r.style+"`");if(!["aria-describedby","aria-labelledby"].includes(r.style)&&!r.assistiveText)throw new Error("`permalink.linkAfterHeader` called without the `assistiveText` option in `"+r.style+"` style");if("visually-hidden"===r.style&&!r.visuallyHiddenClass)throw new Error("`permalink.linkAfterHeader` called without the `visuallyHiddenClass` option in `visually-hidden` style");var c=i.tokens[l+1].children.filter(function(e){return "text"===e.type||"code_inline"===e.type}).reduce(function(e,n){return e+n.content},""),s=[],u=[];if(r.class&&u.push(["class",r.class]),u.push(["href",r.renderHref(e,i)]),u.push.apply(u,Object.entries(r.renderAttrs(e,i))),"visually-hidden"===r.style){if(s.push(Object.assign(new i.Token("span_open","span",1),{attrs:[["class",r.visuallyHiddenClass]]}),Object.assign(new i.Token("text","",0),{content:r.assistiveText(c)}),new i.Token("span_close","span",-1)),r.space){var d="string"==typeof r.space?r.space:" ";s[n[r.placement]](Object.assign(new i.Token("string"==typeof r.space?"html_inline":"text","",0),{content:d}));}s[n[r.placement]](Object.assign(new i.Token("span_open","span",1),{attrs:[["aria-hidden","true"]]}),Object.assign(new i.Token("html_inline","",0),{content:r.symbol,meta:t}),new i.Token("span_close","span",-1));}else s.push(Object.assign(new i.Token("html_inline","",0),{content:r.symbol,meta:t}));"aria-label"===r.style?u.push(["aria-label",r.assistiveText(c)]):["aria-describedby","aria-labelledby"].includes(r.style)&&u.push([r.style,e]);var f=[Object.assign(new i.Token("link_open","a",1),{attrs:u})].concat(s,[new i.Token("link_close","a",-1)]);(o=i.tokens).splice.apply(o,[l+3,0].concat(f)),r.wrapper&&(i.tokens.splice(l,0,Object.assign(new i.Token("html_block","",0),{content:r.wrapper[0]+"\n"})),i.tokens.splice(l+3+f.length+1,0,Object.assign(new i.Token("html_block","",0),{content:r.wrapper[1]+"\n"})));});function f(e,n,t,r){var a=e,i=r;if(t&&Object.prototype.hasOwnProperty.call(n,a))throw new Error("User defined `id` attribute `"+e+"` is not unique. Please fix it in your Markdown to continue.");for(;Object.prototype.hasOwnProperty.call(n,a);)a=e+"-"+i,i+=1;return n[a]=!0,a}function p(e,n){n=Object.assign({},p.defaults,n),e.core.ruler.push("anchor",function(e){for(var t,a={},i=e.tokens,l=Array.isArray(n.level)?(t=n.level,function(e){return t.includes(e)}):function(e){return function(n){return n>=e}}(n.level),o=0;o<i.length;o++){var c=i[o];if("heading_open"===c.type&&l(Number(c.tag.substr(1)))){var s=n.getTokensText(i[o+1].children),u=c.attrGet("id");u=null==u?f(n.slugify(s),a,!1,n.uniqueSlugStartIndex):f(u,a,!0,n.uniqueSlugStartIndex),c.attrSet("id",u),!1!==n.tabIndex&&c.attrSet("tabindex",""+n.tabIndex),"function"==typeof n.permalink?n.permalink(u,n,e,o):(n.permalink||n.renderPermalink&&n.renderPermalink!==r)&&n.renderPermalink(u,n,e,o),o=i.indexOf(c),n.callback&&n.callback(c,{slug:u,title:s});}}});}Object.assign(d.defaults,{style:"visually-hidden",space:!0,placement:"after",wrapper:null}),p.permalink={__proto__:null,legacy:r,renderHref:a,renderAttrs:i,makePermalink:o,linkInsideHeader:c,ariaHidden:s,headerLink:u,linkAfterHeader:d},p.defaults={level:1,slugify:function(e){return encodeURIComponent(String(e).trim().toLowerCase().replace(/\s+/g,"-"))},uniqueSlugStartIndex:1,tabIndex:"-1",getTokensText:function(e){return e.filter(function(e){return ["text","code_inline"].includes(e.type)}).map(function(e){return e.content}).join("")},permalink:!1,renderPermalink:r,permalinkClass:s.defaults.class,permalinkSpace:s.defaults.space,permalinkSymbol:"¶",permalinkBefore:"before"===s.defaults.placement,permalinkHref:s.defaults.renderHref,permalinkAttrs:s.defaults.renderAttrs},p.default=p;

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var buildExports$1 = {};
var build = {
  get exports(){ return buildExports$1; },
  set exports(v){ buildExports$1 = v; },
};

var prismExports = {};
var prism$1 = {
  get exports(){ return prismExports; },
  set exports(v){ prismExports = v; },
};

var hasRequiredPrism;

function requirePrism () {
	if (hasRequiredPrism) return prismExports;
	hasRequiredPrism = 1;
	(function (module) {
		/* **********************************************
		     Begin prism-core.js
		********************************************** */

		/// <reference lib="WebWorker"/>

		var _self = (typeof window !== 'undefined')
			? window   // if in browser
			: (
				(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
					? self // if in worker
					: {}   // if in node js
			);

		/**
		 * Prism: Lightweight, robust, elegant syntax highlighting
		 *
		 * @license MIT <https://opensource.org/licenses/MIT>
		 * @author Lea Verou <https://lea.verou.me>
		 * @namespace
		 * @public
		 */
		var Prism = (function (_self) {

			// Private helper vars
			var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
			var uniqueId = 0;

			// The grammar object for plaintext
			var plainTextGrammar = {};


			var _ = {
				/**
				 * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
				 * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
				 * additional languages or plugins yourself.
				 *
				 * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
				 *
				 * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
				 * empty Prism object into the global scope before loading the Prism script like this:
				 *
				 * ```js
				 * window.Prism = window.Prism || {};
				 * Prism.manual = true;
				 * // add a new <script> to load Prism's script
				 * ```
				 *
				 * @default false
				 * @type {boolean}
				 * @memberof Prism
				 * @public
				 */
				manual: _self.Prism && _self.Prism.manual,
				/**
				 * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
				 * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
				 * own worker, you don't want it to do this.
				 *
				 * By setting this value to `true`, Prism will not add its own listeners to the worker.
				 *
				 * You obviously have to change this value before Prism executes. To do this, you can add an
				 * empty Prism object into the global scope before loading the Prism script like this:
				 *
				 * ```js
				 * window.Prism = window.Prism || {};
				 * Prism.disableWorkerMessageHandler = true;
				 * // Load Prism's script
				 * ```
				 *
				 * @default false
				 * @type {boolean}
				 * @memberof Prism
				 * @public
				 */
				disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

				/**
				 * A namespace for utility methods.
				 *
				 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
				 * change or disappear at any time.
				 *
				 * @namespace
				 * @memberof Prism
				 */
				util: {
					encode: function encode(tokens) {
						if (tokens instanceof Token) {
							return new Token(tokens.type, encode(tokens.content), tokens.alias);
						} else if (Array.isArray(tokens)) {
							return tokens.map(encode);
						} else {
							return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
						}
					},

					/**
					 * Returns the name of the type of the given value.
					 *
					 * @param {any} o
					 * @returns {string}
					 * @example
					 * type(null)      === 'Null'
					 * type(undefined) === 'Undefined'
					 * type(123)       === 'Number'
					 * type('foo')     === 'String'
					 * type(true)      === 'Boolean'
					 * type([1, 2])    === 'Array'
					 * type({})        === 'Object'
					 * type(String)    === 'Function'
					 * type(/abc+/)    === 'RegExp'
					 */
					type: function (o) {
						return Object.prototype.toString.call(o).slice(8, -1);
					},

					/**
					 * Returns a unique number for the given object. Later calls will still return the same number.
					 *
					 * @param {Object} obj
					 * @returns {number}
					 */
					objId: function (obj) {
						if (!obj['__id']) {
							Object.defineProperty(obj, '__id', { value: ++uniqueId });
						}
						return obj['__id'];
					},

					/**
					 * Creates a deep clone of the given object.
					 *
					 * The main intended use of this function is to clone language definitions.
					 *
					 * @param {T} o
					 * @param {Record<number, any>} [visited]
					 * @returns {T}
					 * @template T
					 */
					clone: function deepClone(o, visited) {
						visited = visited || {};

						var clone; var id;
						switch (_.util.type(o)) {
							case 'Object':
								id = _.util.objId(o);
								if (visited[id]) {
									return visited[id];
								}
								clone = /** @type {Record<string, any>} */ ({});
								visited[id] = clone;

								for (var key in o) {
									if (o.hasOwnProperty(key)) {
										clone[key] = deepClone(o[key], visited);
									}
								}

								return /** @type {any} */ (clone);

							case 'Array':
								id = _.util.objId(o);
								if (visited[id]) {
									return visited[id];
								}
								clone = [];
								visited[id] = clone;

								(/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
									clone[i] = deepClone(v, visited);
								});

								return /** @type {any} */ (clone);

							default:
								return o;
						}
					},

					/**
					 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
					 *
					 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
					 *
					 * @param {Element} element
					 * @returns {string}
					 */
					getLanguage: function (element) {
						while (element) {
							var m = lang.exec(element.className);
							if (m) {
								return m[1].toLowerCase();
							}
							element = element.parentElement;
						}
						return 'none';
					},

					/**
					 * Sets the Prism `language-xxxx` class of the given element.
					 *
					 * @param {Element} element
					 * @param {string} language
					 * @returns {void}
					 */
					setLanguage: function (element, language) {
						// remove all `language-xxxx` classes
						// (this might leave behind a leading space)
						element.className = element.className.replace(RegExp(lang, 'gi'), '');

						// add the new `language-xxxx` class
						// (using `classList` will automatically clean up spaces for us)
						element.classList.add('language-' + language);
					},

					/**
					 * Returns the script element that is currently executing.
					 *
					 * This does __not__ work for line script element.
					 *
					 * @returns {HTMLScriptElement | null}
					 */
					currentScript: function () {
						if (typeof document === 'undefined') {
							return null;
						}
						if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
							return /** @type {any} */ (document.currentScript);
						}

						// IE11 workaround
						// we'll get the src of the current script by parsing IE11's error stack trace
						// this will not work for inline scripts

						try {
							throw new Error();
						} catch (err) {
							// Get file src url from stack. Specifically works with the format of stack traces in IE.
							// A stack will look like this:
							//
							// Error
							//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
							//    at Global code (http://localhost/components/prism-core.js:606:1)

							var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
							if (src) {
								var scripts = document.getElementsByTagName('script');
								for (var i in scripts) {
									if (scripts[i].src == src) {
										return scripts[i];
									}
								}
							}
							return null;
						}
					},

					/**
					 * Returns whether a given class is active for `element`.
					 *
					 * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
					 * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
					 * given class is just the given class with a `no-` prefix.
					 *
					 * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
					 * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
					 * ancestors have the given class or the negated version of it, then the default activation will be returned.
					 *
					 * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
					 * version of it, the class is considered active.
					 *
					 * @param {Element} element
					 * @param {string} className
					 * @param {boolean} [defaultActivation=false]
					 * @returns {boolean}
					 */
					isActive: function (element, className, defaultActivation) {
						var no = 'no-' + className;

						while (element) {
							var classList = element.classList;
							if (classList.contains(className)) {
								return true;
							}
							if (classList.contains(no)) {
								return false;
							}
							element = element.parentElement;
						}
						return !!defaultActivation;
					}
				},

				/**
				 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
				 *
				 * @namespace
				 * @memberof Prism
				 * @public
				 */
				languages: {
					/**
					 * The grammar for plain, unformatted text.
					 */
					plain: plainTextGrammar,
					plaintext: plainTextGrammar,
					text: plainTextGrammar,
					txt: plainTextGrammar,

					/**
					 * Creates a deep copy of the language with the given id and appends the given tokens.
					 *
					 * If a token in `redef` also appears in the copied language, then the existing token in the copied language
					 * will be overwritten at its original position.
					 *
					 * ## Best practices
					 *
					 * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
					 * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
					 * understand the language definition because, normally, the order of tokens matters in Prism grammars.
					 *
					 * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
					 * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
					 *
					 * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
					 * @param {Grammar} redef The new tokens to append.
					 * @returns {Grammar} The new language created.
					 * @public
					 * @example
					 * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
					 *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
					 *     // at its original position
					 *     'comment': { ... },
					 *     // CSS doesn't have a 'color' token, so this token will be appended
					 *     'color': /\b(?:red|green|blue)\b/
					 * });
					 */
					extend: function (id, redef) {
						var lang = _.util.clone(_.languages[id]);

						for (var key in redef) {
							lang[key] = redef[key];
						}

						return lang;
					},

					/**
					 * Inserts tokens _before_ another token in a language definition or any other grammar.
					 *
					 * ## Usage
					 *
					 * This helper method makes it easy to modify existing languages. For example, the CSS language definition
					 * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
					 * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
					 * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
					 * this:
					 *
					 * ```js
					 * Prism.languages.markup.style = {
					 *     // token
					 * };
					 * ```
					 *
					 * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
					 * before existing tokens. For the CSS example above, you would use it like this:
					 *
					 * ```js
					 * Prism.languages.insertBefore('markup', 'cdata', {
					 *     'style': {
					 *         // token
					 *     }
					 * });
					 * ```
					 *
					 * ## Special cases
					 *
					 * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
					 * will be ignored.
					 *
					 * This behavior can be used to insert tokens after `before`:
					 *
					 * ```js
					 * Prism.languages.insertBefore('markup', 'comment', {
					 *     'comment': Prism.languages.markup.comment,
					 *     // tokens after 'comment'
					 * });
					 * ```
					 *
					 * ## Limitations
					 *
					 * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
					 * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
					 * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
					 * deleting properties which is necessary to insert at arbitrary positions.
					 *
					 * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
					 * Instead, it will create a new object and replace all references to the target object with the new one. This
					 * can be done without temporarily deleting properties, so the iteration order is well-defined.
					 *
					 * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
					 * you hold the target object in a variable, then the value of the variable will not change.
					 *
					 * ```js
					 * var oldMarkup = Prism.languages.markup;
					 * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
					 *
					 * assert(oldMarkup !== Prism.languages.markup);
					 * assert(newMarkup === Prism.languages.markup);
					 * ```
					 *
					 * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
					 * object to be modified.
					 * @param {string} before The key to insert before.
					 * @param {Grammar} insert An object containing the key-value pairs to be inserted.
					 * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
					 * object to be modified.
					 *
					 * Defaults to `Prism.languages`.
					 * @returns {Grammar} The new grammar object.
					 * @public
					 */
					insertBefore: function (inside, before, insert, root) {
						root = root || /** @type {any} */ (_.languages);
						var grammar = root[inside];
						/** @type {Grammar} */
						var ret = {};

						for (var token in grammar) {
							if (grammar.hasOwnProperty(token)) {

								if (token == before) {
									for (var newToken in insert) {
										if (insert.hasOwnProperty(newToken)) {
											ret[newToken] = insert[newToken];
										}
									}
								}

								// Do not insert token which also occur in insert. See #1525
								if (!insert.hasOwnProperty(token)) {
									ret[token] = grammar[token];
								}
							}
						}

						var old = root[inside];
						root[inside] = ret;

						// Update references in other language definitions
						_.languages.DFS(_.languages, function (key, value) {
							if (value === old && key != inside) {
								this[key] = ret;
							}
						});

						return ret;
					},

					// Traverse a language definition with Depth First Search
					DFS: function DFS(o, callback, type, visited) {
						visited = visited || {};

						var objId = _.util.objId;

						for (var i in o) {
							if (o.hasOwnProperty(i)) {
								callback.call(o, i, o[i], type || i);

								var property = o[i];
								var propertyType = _.util.type(property);

								if (propertyType === 'Object' && !visited[objId(property)]) {
									visited[objId(property)] = true;
									DFS(property, callback, null, visited);
								} else if (propertyType === 'Array' && !visited[objId(property)]) {
									visited[objId(property)] = true;
									DFS(property, callback, i, visited);
								}
							}
						}
					}
				},

				plugins: {},

				/**
				 * This is the most high-level function in Prism’s API.
				 * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
				 * each one of them.
				 *
				 * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
				 *
				 * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
				 * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
				 * @memberof Prism
				 * @public
				 */
				highlightAll: function (async, callback) {
					_.highlightAllUnder(document, async, callback);
				},

				/**
				 * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
				 * {@link Prism.highlightElement} on each one of them.
				 *
				 * The following hooks will be run:
				 * 1. `before-highlightall`
				 * 2. `before-all-elements-highlight`
				 * 3. All hooks of {@link Prism.highlightElement} for each element.
				 *
				 * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
				 * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
				 * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
				 * @memberof Prism
				 * @public
				 */
				highlightAllUnder: function (container, async, callback) {
					var env = {
						callback: callback,
						container: container,
						selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
					};

					_.hooks.run('before-highlightall', env);

					env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

					_.hooks.run('before-all-elements-highlight', env);

					for (var i = 0, element; (element = env.elements[i++]);) {
						_.highlightElement(element, async === true, env.callback);
					}
				},

				/**
				 * Highlights the code inside a single element.
				 *
				 * The following hooks will be run:
				 * 1. `before-sanity-check`
				 * 2. `before-highlight`
				 * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
				 * 4. `before-insert`
				 * 5. `after-highlight`
				 * 6. `complete`
				 *
				 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
				 * the element's language.
				 *
				 * @param {Element} element The element containing the code.
				 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
				 * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
				 * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
				 * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
				 *
				 * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
				 * asynchronous highlighting to work. You can build your own bundle on the
				 * [Download page](https://prismjs.com/download.html).
				 * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
				 * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
				 * @memberof Prism
				 * @public
				 */
				highlightElement: function (element, async, callback) {
					// Find language
					var language = _.util.getLanguage(element);
					var grammar = _.languages[language];

					// Set language on the element, if not present
					_.util.setLanguage(element, language);

					// Set language on the parent, for styling
					var parent = element.parentElement;
					if (parent && parent.nodeName.toLowerCase() === 'pre') {
						_.util.setLanguage(parent, language);
					}

					var code = element.textContent;

					var env = {
						element: element,
						language: language,
						grammar: grammar,
						code: code
					};

					function insertHighlightedCode(highlightedCode) {
						env.highlightedCode = highlightedCode;

						_.hooks.run('before-insert', env);

						env.element.innerHTML = env.highlightedCode;

						_.hooks.run('after-highlight', env);
						_.hooks.run('complete', env);
						callback && callback.call(env.element);
					}

					_.hooks.run('before-sanity-check', env);

					// plugins may change/add the parent/element
					parent = env.element.parentElement;
					if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
						parent.setAttribute('tabindex', '0');
					}

					if (!env.code) {
						_.hooks.run('complete', env);
						callback && callback.call(env.element);
						return;
					}

					_.hooks.run('before-highlight', env);

					if (!env.grammar) {
						insertHighlightedCode(_.util.encode(env.code));
						return;
					}

					if (async && _self.Worker) {
						var worker = new Worker(_.filename);

						worker.onmessage = function (evt) {
							insertHighlightedCode(evt.data);
						};

						worker.postMessage(JSON.stringify({
							language: env.language,
							code: env.code,
							immediateClose: true
						}));
					} else {
						insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
					}
				},

				/**
				 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
				 * and the language definitions to use, and returns a string with the HTML produced.
				 *
				 * The following hooks will be run:
				 * 1. `before-tokenize`
				 * 2. `after-tokenize`
				 * 3. `wrap`: On each {@link Token}.
				 *
				 * @param {string} text A string with the code to be highlighted.
				 * @param {Grammar} grammar An object containing the tokens to use.
				 *
				 * Usually a language definition like `Prism.languages.markup`.
				 * @param {string} language The name of the language definition passed to `grammar`.
				 * @returns {string} The highlighted HTML.
				 * @memberof Prism
				 * @public
				 * @example
				 * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
				 */
				highlight: function (text, grammar, language) {
					var env = {
						code: text,
						grammar: grammar,
						language: language
					};
					_.hooks.run('before-tokenize', env);
					if (!env.grammar) {
						throw new Error('The language "' + env.language + '" has no grammar.');
					}
					env.tokens = _.tokenize(env.code, env.grammar);
					_.hooks.run('after-tokenize', env);
					return Token.stringify(_.util.encode(env.tokens), env.language);
				},

				/**
				 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
				 * and the language definitions to use, and returns an array with the tokenized code.
				 *
				 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
				 *
				 * This method could be useful in other contexts as well, as a very crude parser.
				 *
				 * @param {string} text A string with the code to be highlighted.
				 * @param {Grammar} grammar An object containing the tokens to use.
				 *
				 * Usually a language definition like `Prism.languages.markup`.
				 * @returns {TokenStream} An array of strings and tokens, a token stream.
				 * @memberof Prism
				 * @public
				 * @example
				 * let code = `var foo = 0;`;
				 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
				 * tokens.forEach(token => {
				 *     if (token instanceof Prism.Token && token.type === 'number') {
				 *         console.log(`Found numeric literal: ${token.content}`);
				 *     }
				 * });
				 */
				tokenize: function (text, grammar) {
					var rest = grammar.rest;
					if (rest) {
						for (var token in rest) {
							grammar[token] = rest[token];
						}

						delete grammar.rest;
					}

					var tokenList = new LinkedList();
					addAfter(tokenList, tokenList.head, text);

					matchGrammar(text, tokenList, grammar, tokenList.head, 0);

					return toArray(tokenList);
				},

				/**
				 * @namespace
				 * @memberof Prism
				 * @public
				 */
				hooks: {
					all: {},

					/**
					 * Adds the given callback to the list of callbacks for the given hook.
					 *
					 * The callback will be invoked when the hook it is registered for is run.
					 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
					 *
					 * One callback function can be registered to multiple hooks and the same hook multiple times.
					 *
					 * @param {string} name The name of the hook.
					 * @param {HookCallback} callback The callback function which is given environment variables.
					 * @public
					 */
					add: function (name, callback) {
						var hooks = _.hooks.all;

						hooks[name] = hooks[name] || [];

						hooks[name].push(callback);
					},

					/**
					 * Runs a hook invoking all registered callbacks with the given environment variables.
					 *
					 * Callbacks will be invoked synchronously and in the order in which they were registered.
					 *
					 * @param {string} name The name of the hook.
					 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
					 * @public
					 */
					run: function (name, env) {
						var callbacks = _.hooks.all[name];

						if (!callbacks || !callbacks.length) {
							return;
						}

						for (var i = 0, callback; (callback = callbacks[i++]);) {
							callback(env);
						}
					}
				},

				Token: Token
			};
			_self.Prism = _;


			// Typescript note:
			// The following can be used to import the Token type in JSDoc:
			//
			//   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

			/**
			 * Creates a new token.
			 *
			 * @param {string} type See {@link Token#type type}
			 * @param {string | TokenStream} content See {@link Token#content content}
			 * @param {string|string[]} [alias] The alias(es) of the token.
			 * @param {string} [matchedStr=""] A copy of the full string this token was created from.
			 * @class
			 * @global
			 * @public
			 */
			function Token(type, content, alias, matchedStr) {
				/**
				 * The type of the token.
				 *
				 * This is usually the key of a pattern in a {@link Grammar}.
				 *
				 * @type {string}
				 * @see GrammarToken
				 * @public
				 */
				this.type = type;
				/**
				 * The strings or tokens contained by this token.
				 *
				 * This will be a token stream if the pattern matched also defined an `inside` grammar.
				 *
				 * @type {string | TokenStream}
				 * @public
				 */
				this.content = content;
				/**
				 * The alias(es) of the token.
				 *
				 * @type {string|string[]}
				 * @see GrammarToken
				 * @public
				 */
				this.alias = alias;
				// Copy of the full string this token was created from
				this.length = (matchedStr || '').length | 0;
			}

			/**
			 * A token stream is an array of strings and {@link Token Token} objects.
			 *
			 * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
			 * them.
			 *
			 * 1. No adjacent strings.
			 * 2. No empty strings.
			 *
			 *    The only exception here is the token stream that only contains the empty string and nothing else.
			 *
			 * @typedef {Array<string | Token>} TokenStream
			 * @global
			 * @public
			 */

			/**
			 * Converts the given token or token stream to an HTML representation.
			 *
			 * The following hooks will be run:
			 * 1. `wrap`: On each {@link Token}.
			 *
			 * @param {string | Token | TokenStream} o The token or token stream to be converted.
			 * @param {string} language The name of current language.
			 * @returns {string} The HTML representation of the token or token stream.
			 * @memberof Token
			 * @static
			 */
			Token.stringify = function stringify(o, language) {
				if (typeof o == 'string') {
					return o;
				}
				if (Array.isArray(o)) {
					var s = '';
					o.forEach(function (e) {
						s += stringify(e, language);
					});
					return s;
				}

				var env = {
					type: o.type,
					content: stringify(o.content, language),
					tag: 'span',
					classes: ['token', o.type],
					attributes: {},
					language: language
				};

				var aliases = o.alias;
				if (aliases) {
					if (Array.isArray(aliases)) {
						Array.prototype.push.apply(env.classes, aliases);
					} else {
						env.classes.push(aliases);
					}
				}

				_.hooks.run('wrap', env);

				var attributes = '';
				for (var name in env.attributes) {
					attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
				}

				return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
			};

			/**
			 * @param {RegExp} pattern
			 * @param {number} pos
			 * @param {string} text
			 * @param {boolean} lookbehind
			 * @returns {RegExpExecArray | null}
			 */
			function matchPattern(pattern, pos, text, lookbehind) {
				pattern.lastIndex = pos;
				var match = pattern.exec(text);
				if (match && lookbehind && match[1]) {
					// change the match to remove the text matched by the Prism lookbehind group
					var lookbehindLength = match[1].length;
					match.index += lookbehindLength;
					match[0] = match[0].slice(lookbehindLength);
				}
				return match;
			}

			/**
			 * @param {string} text
			 * @param {LinkedList<string | Token>} tokenList
			 * @param {any} grammar
			 * @param {LinkedListNode<string | Token>} startNode
			 * @param {number} startPos
			 * @param {RematchOptions} [rematch]
			 * @returns {void}
			 * @private
			 *
			 * @typedef RematchOptions
			 * @property {string} cause
			 * @property {number} reach
			 */
			function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
				for (var token in grammar) {
					if (!grammar.hasOwnProperty(token) || !grammar[token]) {
						continue;
					}

					var patterns = grammar[token];
					patterns = Array.isArray(patterns) ? patterns : [patterns];

					for (var j = 0; j < patterns.length; ++j) {
						if (rematch && rematch.cause == token + ',' + j) {
							return;
						}

						var patternObj = patterns[j];
						var inside = patternObj.inside;
						var lookbehind = !!patternObj.lookbehind;
						var greedy = !!patternObj.greedy;
						var alias = patternObj.alias;

						if (greedy && !patternObj.pattern.global) {
							// Without the global flag, lastIndex won't work
							var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
							patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
						}

						/** @type {RegExp} */
						var pattern = patternObj.pattern || patternObj;

						for ( // iterate the token list and keep track of the current token/string position
							var currentNode = startNode.next, pos = startPos;
							currentNode !== tokenList.tail;
							pos += currentNode.value.length, currentNode = currentNode.next
						) {

							if (rematch && pos >= rematch.reach) {
								break;
							}

							var str = currentNode.value;

							if (tokenList.length > text.length) {
								// Something went terribly wrong, ABORT, ABORT!
								return;
							}

							if (str instanceof Token) {
								continue;
							}

							var removeCount = 1; // this is the to parameter of removeBetween
							var match;

							if (greedy) {
								match = matchPattern(pattern, pos, text, lookbehind);
								if (!match || match.index >= text.length) {
									break;
								}

								var from = match.index;
								var to = match.index + match[0].length;
								var p = pos;

								// find the node that contains the match
								p += currentNode.value.length;
								while (from >= p) {
									currentNode = currentNode.next;
									p += currentNode.value.length;
								}
								// adjust pos (and p)
								p -= currentNode.value.length;
								pos = p;

								// the current node is a Token, then the match starts inside another Token, which is invalid
								if (currentNode.value instanceof Token) {
									continue;
								}

								// find the last node which is affected by this match
								for (
									var k = currentNode;
									k !== tokenList.tail && (p < to || typeof k.value === 'string');
									k = k.next
								) {
									removeCount++;
									p += k.value.length;
								}
								removeCount--;

								// replace with the new match
								str = text.slice(pos, p);
								match.index -= pos;
							} else {
								match = matchPattern(pattern, 0, str, lookbehind);
								if (!match) {
									continue;
								}
							}

							// eslint-disable-next-line no-redeclare
							var from = match.index;
							var matchStr = match[0];
							var before = str.slice(0, from);
							var after = str.slice(from + matchStr.length);

							var reach = pos + str.length;
							if (rematch && reach > rematch.reach) {
								rematch.reach = reach;
							}

							var removeFrom = currentNode.prev;

							if (before) {
								removeFrom = addAfter(tokenList, removeFrom, before);
								pos += before.length;
							}

							removeRange(tokenList, removeFrom, removeCount);

							var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
							currentNode = addAfter(tokenList, removeFrom, wrapped);

							if (after) {
								addAfter(tokenList, currentNode, after);
							}

							if (removeCount > 1) {
								// at least one Token object was removed, so we have to do some rematching
								// this can only happen if the current pattern is greedy

								/** @type {RematchOptions} */
								var nestedRematch = {
									cause: token + ',' + j,
									reach: reach
								};
								matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

								// the reach might have been extended because of the rematching
								if (rematch && nestedRematch.reach > rematch.reach) {
									rematch.reach = nestedRematch.reach;
								}
							}
						}
					}
				}
			}

			/**
			 * @typedef LinkedListNode
			 * @property {T} value
			 * @property {LinkedListNode<T> | null} prev The previous node.
			 * @property {LinkedListNode<T> | null} next The next node.
			 * @template T
			 * @private
			 */

			/**
			 * @template T
			 * @private
			 */
			function LinkedList() {
				/** @type {LinkedListNode<T>} */
				var head = { value: null, prev: null, next: null };
				/** @type {LinkedListNode<T>} */
				var tail = { value: null, prev: head, next: null };
				head.next = tail;

				/** @type {LinkedListNode<T>} */
				this.head = head;
				/** @type {LinkedListNode<T>} */
				this.tail = tail;
				this.length = 0;
			}

			/**
			 * Adds a new node with the given value to the list.
			 *
			 * @param {LinkedList<T>} list
			 * @param {LinkedListNode<T>} node
			 * @param {T} value
			 * @returns {LinkedListNode<T>} The added node.
			 * @template T
			 */
			function addAfter(list, node, value) {
				// assumes that node != list.tail && values.length >= 0
				var next = node.next;

				var newNode = { value: value, prev: node, next: next };
				node.next = newNode;
				next.prev = newNode;
				list.length++;

				return newNode;
			}
			/**
			 * Removes `count` nodes after the given node. The given node will not be removed.
			 *
			 * @param {LinkedList<T>} list
			 * @param {LinkedListNode<T>} node
			 * @param {number} count
			 * @template T
			 */
			function removeRange(list, node, count) {
				var next = node.next;
				for (var i = 0; i < count && next !== list.tail; i++) {
					next = next.next;
				}
				node.next = next;
				next.prev = node;
				list.length -= i;
			}
			/**
			 * @param {LinkedList<T>} list
			 * @returns {T[]}
			 * @template T
			 */
			function toArray(list) {
				var array = [];
				var node = list.head.next;
				while (node !== list.tail) {
					array.push(node.value);
					node = node.next;
				}
				return array;
			}


			if (!_self.document) {
				if (!_self.addEventListener) {
					// in Node.js
					return _;
				}

				if (!_.disableWorkerMessageHandler) {
					// In worker
					_self.addEventListener('message', function (evt) {
						var message = JSON.parse(evt.data);
						var lang = message.language;
						var code = message.code;
						var immediateClose = message.immediateClose;

						_self.postMessage(_.highlight(code, _.languages[lang], lang));
						if (immediateClose) {
							_self.close();
						}
					}, false);
				}

				return _;
			}

			// Get current script and highlight
			var script = _.util.currentScript();

			if (script) {
				_.filename = script.src;

				if (script.hasAttribute('data-manual')) {
					_.manual = true;
				}
			}

			function highlightAutomaticallyCallback() {
				if (!_.manual) {
					_.highlightAll();
				}
			}

			if (!_.manual) {
				// If the document state is "loading", then we'll use DOMContentLoaded.
				// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
				// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
				// might take longer one animation frame to execute which can create a race condition where only some plugins have
				// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
				// See https://github.com/PrismJS/prism/issues/2102
				var readyState = document.readyState;
				if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
					document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
				} else {
					if (window.requestAnimationFrame) {
						window.requestAnimationFrame(highlightAutomaticallyCallback);
					} else {
						window.setTimeout(highlightAutomaticallyCallback, 16);
					}
				}
			}

			return _;

		}(_self));

		if (module.exports) {
			module.exports = Prism;
		}

		// hack for components to work correctly in node.js
		if (typeof commonjsGlobal !== 'undefined') {
			commonjsGlobal.Prism = Prism;
		}

		// some additional documentation/types

		/**
		 * The expansion of a simple `RegExp` literal to support additional properties.
		 *
		 * @typedef GrammarToken
		 * @property {RegExp} pattern The regular expression of the token.
		 * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
		 * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
		 * @property {boolean} [greedy=false] Whether the token is greedy.
		 * @property {string|string[]} [alias] An optional alias or list of aliases.
		 * @property {Grammar} [inside] The nested grammar of this token.
		 *
		 * The `inside` grammar will be used to tokenize the text value of each token of this kind.
		 *
		 * This can be used to make nested and even recursive language definitions.
		 *
		 * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
		 * each another.
		 * @global
		 * @public
		 */

		/**
		 * @typedef Grammar
		 * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
		 * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
		 * @global
		 * @public
		 */

		/**
		 * A function which will invoked after an element was successfully highlighted.
		 *
		 * @callback HighlightCallback
		 * @param {Element} element The element successfully highlighted.
		 * @returns {void}
		 * @global
		 * @public
		 */

		/**
		 * @callback HookCallback
		 * @param {Object<string, any>} env The environment variables of the hook.
		 * @returns {void}
		 * @global
		 * @public
		 */


		/* **********************************************
		     Begin prism-markup.js
		********************************************** */

		Prism.languages.markup = {
			'comment': {
				pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
				greedy: true
			},
			'prolog': {
				pattern: /<\?[\s\S]+?\?>/,
				greedy: true
			},
			'doctype': {
				// https://www.w3.org/TR/xml/#NT-doctypedecl
				pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
				greedy: true,
				inside: {
					'internal-subset': {
						pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
						lookbehind: true,
						greedy: true,
						inside: null // see below
					},
					'string': {
						pattern: /"[^"]*"|'[^']*'/,
						greedy: true
					},
					'punctuation': /^<!|>$|[[\]]/,
					'doctype-tag': /^DOCTYPE/i,
					'name': /[^\s<>'"]+/
				}
			},
			'cdata': {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				greedy: true
			},
			'tag': {
				pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
				greedy: true,
				inside: {
					'tag': {
						pattern: /^<\/?[^\s>\/]+/,
						inside: {
							'punctuation': /^<\/?/,
							'namespace': /^[^\s>\/:]+:/
						}
					},
					'special-attr': [],
					'attr-value': {
						pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
						inside: {
							'punctuation': [
								{
									pattern: /^=/,
									alias: 'attr-equals'
								},
								{
									pattern: /^(\s*)["']|["']$/,
									lookbehind: true
								}
							]
						}
					},
					'punctuation': /\/?>/,
					'attr-name': {
						pattern: /[^\s>\/]+/,
						inside: {
							'namespace': /^[^\s>\/:]+:/
						}
					}

				}
			},
			'entity': [
				{
					pattern: /&[\da-z]{1,8};/i,
					alias: 'named-entity'
				},
				/&#x?[\da-f]{1,8};/i
			]
		};

		Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
			Prism.languages.markup['entity'];
		Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

		// Plugin to make entity title show the real entity, idea by Roman Komarov
		Prism.hooks.add('wrap', function (env) {

			if (env.type === 'entity') {
				env.attributes['title'] = env.content.replace(/&amp;/, '&');
			}
		});

		Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
			/**
			 * Adds an inlined language to markup.
			 *
			 * An example of an inlined language is CSS with `<style>` tags.
			 *
			 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
			 * case insensitive.
			 * @param {string} lang The language key.
			 * @example
			 * addInlined('style', 'css');
			 */
			value: function addInlined(tagName, lang) {
				var includedCdataInside = {};
				includedCdataInside['language-' + lang] = {
					pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
					lookbehind: true,
					inside: Prism.languages[lang]
				};
				includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

				var inside = {
					'included-cdata': {
						pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
						inside: includedCdataInside
					}
				};
				inside['language-' + lang] = {
					pattern: /[\s\S]+/,
					inside: Prism.languages[lang]
				};

				var def = {};
				def[tagName] = {
					pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
					lookbehind: true,
					greedy: true,
					inside: inside
				};

				Prism.languages.insertBefore('markup', 'cdata', def);
			}
		});
		Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
			/**
			 * Adds an pattern to highlight languages embedded in HTML attributes.
			 *
			 * An example of an inlined language is CSS with `style` attributes.
			 *
			 * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
			 * case insensitive.
			 * @param {string} lang The language key.
			 * @example
			 * addAttribute('style', 'css');
			 */
			value: function (attrName, lang) {
				Prism.languages.markup.tag.inside['special-attr'].push({
					pattern: RegExp(
						/(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
						'i'
					),
					lookbehind: true,
					inside: {
						'attr-name': /^[^\s=]+/,
						'attr-value': {
							pattern: /=[\s\S]+/,
							inside: {
								'value': {
									pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
									lookbehind: true,
									alias: [lang, 'language-' + lang],
									inside: Prism.languages[lang]
								},
								'punctuation': [
									{
										pattern: /^=/,
										alias: 'attr-equals'
									},
									/"|'/
								]
							}
						}
					}
				});
			}
		});

		Prism.languages.html = Prism.languages.markup;
		Prism.languages.mathml = Prism.languages.markup;
		Prism.languages.svg = Prism.languages.markup;

		Prism.languages.xml = Prism.languages.extend('markup', {});
		Prism.languages.ssml = Prism.languages.xml;
		Prism.languages.atom = Prism.languages.xml;
		Prism.languages.rss = Prism.languages.xml;


		/* **********************************************
		     Begin prism-css.js
		********************************************** */

		(function (Prism) {

			var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

			Prism.languages.css = {
				'comment': /\/\*[\s\S]*?\*\//,
				'atrule': {
					pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
					inside: {
						'rule': /^@[\w-]+/,
						'selector-function-argument': {
							pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
							lookbehind: true,
							alias: 'selector'
						},
						'keyword': {
							pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
							lookbehind: true
						}
						// See rest below
					}
				},
				'url': {
					// https://drafts.csswg.org/css-values-3/#urls
					pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
					greedy: true,
					inside: {
						'function': /^url/i,
						'punctuation': /^\(|\)$/,
						'string': {
							pattern: RegExp('^' + string.source + '$'),
							alias: 'url'
						}
					}
				},
				'selector': {
					pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
					lookbehind: true
				},
				'string': {
					pattern: string,
					greedy: true
				},
				'property': {
					pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
					lookbehind: true
				},
				'important': /!important\b/i,
				'function': {
					pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
					lookbehind: true
				},
				'punctuation': /[(){};:,]/
			};

			Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

			var markup = Prism.languages.markup;
			if (markup) {
				markup.tag.addInlined('style', 'css');
				markup.tag.addAttribute('style', 'css');
			}

		}(Prism));


		/* **********************************************
		     Begin prism-clike.js
		********************************************** */

		Prism.languages.clike = {
			'comment': [
				{
					pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
					lookbehind: true,
					greedy: true
				},
				{
					pattern: /(^|[^\\:])\/\/.*/,
					lookbehind: true,
					greedy: true
				}
			],
			'string': {
				pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
				greedy: true
			},
			'class-name': {
				pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
				lookbehind: true,
				inside: {
					'punctuation': /[.\\]/
				}
			},
			'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
			'boolean': /\b(?:false|true)\b/,
			'function': /\b\w+(?=\()/,
			'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
			'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
			'punctuation': /[{}[\];(),.:]/
		};


		/* **********************************************
		     Begin prism-javascript.js
		********************************************** */

		Prism.languages.javascript = Prism.languages.extend('clike', {
			'class-name': [
				Prism.languages.clike['class-name'],
				{
					pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
					lookbehind: true
				}
			],
			'keyword': [
				{
					pattern: /((?:^|\})\s*)catch\b/,
					lookbehind: true
				},
				{
					pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
					lookbehind: true
				},
			],
			// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
			'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
			'number': {
				pattern: RegExp(
					/(^|[^\w$])/.source +
					'(?:' +
					(
						// constant
						/NaN|Infinity/.source +
						'|' +
						// binary integer
						/0[bB][01]+(?:_[01]+)*n?/.source +
						'|' +
						// octal integer
						/0[oO][0-7]+(?:_[0-7]+)*n?/.source +
						'|' +
						// hexadecimal integer
						/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
						'|' +
						// decimal bigint
						/\d+(?:_\d+)*n/.source +
						'|' +
						// decimal number (integer or float) but no bigint
						/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
					) +
					')' +
					/(?![\w$])/.source
				),
				lookbehind: true
			},
			'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
		});

		Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

		Prism.languages.insertBefore('javascript', 'keyword', {
			'regex': {
				pattern: RegExp(
					// lookbehind
					// eslint-disable-next-line regexp/no-dupe-characters-character-class
					/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
					// Regex pattern:
					// There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
					// classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
					// with the only syntax, so we have to define 2 different regex patterns.
					/\//.source +
					'(?:' +
					/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
					'|' +
					// `v` flag syntax. This supports 3 levels of nested character classes.
					/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
					')' +
					// lookahead
					/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
				),
				lookbehind: true,
				greedy: true,
				inside: {
					'regex-source': {
						pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
						lookbehind: true,
						alias: 'language-regex',
						inside: Prism.languages.regex
					},
					'regex-delimiter': /^\/|\/$/,
					'regex-flags': /^[a-z]+$/,
				}
			},
			// This must be declared before keyword because we use "function" inside the look-forward
			'function-variable': {
				pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
				alias: 'function'
			},
			'parameter': [
				{
					pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
					lookbehind: true,
					inside: Prism.languages.javascript
				},
				{
					pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
					lookbehind: true,
					inside: Prism.languages.javascript
				},
				{
					pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
					lookbehind: true,
					inside: Prism.languages.javascript
				},
				{
					pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
					lookbehind: true,
					inside: Prism.languages.javascript
				}
			],
			'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
		});

		Prism.languages.insertBefore('javascript', 'string', {
			'hashbang': {
				pattern: /^#!.*/,
				greedy: true,
				alias: 'comment'
			},
			'template-string': {
				pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
				greedy: true,
				inside: {
					'template-punctuation': {
						pattern: /^`|`$/,
						alias: 'string'
					},
					'interpolation': {
						pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
						lookbehind: true,
						inside: {
							'interpolation-punctuation': {
								pattern: /^\$\{|\}$/,
								alias: 'punctuation'
							},
							rest: Prism.languages.javascript
						}
					},
					'string': /[\s\S]+/
				}
			},
			'string-property': {
				pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
				lookbehind: true,
				greedy: true,
				alias: 'property'
			}
		});

		Prism.languages.insertBefore('javascript', 'operator', {
			'literal-property': {
				pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
				lookbehind: true,
				alias: 'property'
			},
		});

		if (Prism.languages.markup) {
			Prism.languages.markup.tag.addInlined('script', 'javascript');

			// add attribute support for all DOM events.
			// https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
			Prism.languages.markup.tag.addAttribute(
				/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
				'javascript'
			);
		}

		Prism.languages.js = Prism.languages.javascript;


		/* **********************************************
		     Begin prism-file-highlight.js
		********************************************** */

		(function () {

			if (typeof Prism === 'undefined' || typeof document === 'undefined') {
				return;
			}

			// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
			if (!Element.prototype.matches) {
				Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
			}

			var LOADING_MESSAGE = 'Loading…';
			var FAILURE_MESSAGE = function (status, message) {
				return '✖ Error ' + status + ' while fetching file: ' + message;
			};
			var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

			var EXTENSIONS = {
				'js': 'javascript',
				'py': 'python',
				'rb': 'ruby',
				'ps1': 'powershell',
				'psm1': 'powershell',
				'sh': 'bash',
				'bat': 'batch',
				'h': 'c',
				'tex': 'latex'
			};

			var STATUS_ATTR = 'data-src-status';
			var STATUS_LOADING = 'loading';
			var STATUS_LOADED = 'loaded';
			var STATUS_FAILED = 'failed';

			var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
				+ ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

			/**
			 * Loads the given file.
			 *
			 * @param {string} src The URL or path of the source file to load.
			 * @param {(result: string) => void} success
			 * @param {(reason: string) => void} error
			 */
			function loadFile(src, success, error) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', src, true);
				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {
						if (xhr.status < 400 && xhr.responseText) {
							success(xhr.responseText);
						} else {
							if (xhr.status >= 400) {
								error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
							} else {
								error(FAILURE_EMPTY_MESSAGE);
							}
						}
					}
				};
				xhr.send(null);
			}

			/**
			 * Parses the given range.
			 *
			 * This returns a range with inclusive ends.
			 *
			 * @param {string | null | undefined} range
			 * @returns {[number, number | undefined] | undefined}
			 */
			function parseRange(range) {
				var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || '');
				if (m) {
					var start = Number(m[1]);
					var comma = m[2];
					var end = m[3];

					if (!comma) {
						return [start, start];
					}
					if (!end) {
						return [start, undefined];
					}
					return [start, Number(end)];
				}
				return undefined;
			}

			Prism.hooks.add('before-highlightall', function (env) {
				env.selector += ', ' + SELECTOR;
			});

			Prism.hooks.add('before-sanity-check', function (env) {
				var pre = /** @type {HTMLPreElement} */ (env.element);
				if (pre.matches(SELECTOR)) {
					env.code = ''; // fast-path the whole thing and go to complete

					pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

					// add code element with loading message
					var code = pre.appendChild(document.createElement('CODE'));
					code.textContent = LOADING_MESSAGE;

					var src = pre.getAttribute('data-src');

					var language = env.language;
					if (language === 'none') {
						// the language might be 'none' because there is no language set;
						// in this case, we want to use the extension as the language
						var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
						language = EXTENSIONS[extension] || extension;
					}

					// set language classes
					Prism.util.setLanguage(code, language);
					Prism.util.setLanguage(pre, language);

					// preload the language
					var autoloader = Prism.plugins.autoloader;
					if (autoloader) {
						autoloader.loadLanguages(language);
					}

					// load file
					loadFile(
						src,
						function (text) {
							// mark as loaded
							pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

							// handle data-range
							var range = parseRange(pre.getAttribute('data-range'));
							if (range) {
								var lines = text.split(/\r\n?|\n/g);

								// the range is one-based and inclusive on both ends
								var start = range[0];
								var end = range[1] == null ? lines.length : range[1];

								if (start < 0) { start += lines.length; }
								start = Math.max(0, Math.min(start - 1, lines.length));
								if (end < 0) { end += lines.length; }
								end = Math.max(0, Math.min(end, lines.length));

								text = lines.slice(start, end).join('\n');

								// add data-start for line numbers
								if (!pre.hasAttribute('data-start')) {
									pre.setAttribute('data-start', String(start + 1));
								}
							}

							// highlight code
							code.textContent = text;
							Prism.highlightElement(code);
						},
						function (error) {
							// mark as failed
							pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

							code.textContent = error;
						}
					);
				}
			});

			Prism.plugins.fileHighlight = {
				/**
				 * Executes the File Highlight plugin for all matching `pre` elements under the given container.
				 *
				 * Note: Elements which are already loaded or currently loading will not be touched by this method.
				 *
				 * @param {ParentNode} [container=document]
				 */
				highlight: function highlight(container) {
					var elements = (container || document).querySelectorAll(SELECTOR);

					for (var i = 0, element; (element = elements[i++]);) {
						Prism.highlightElement(element);
					}
				}
			};

			var logged = false;
			/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
			Prism.fileHighlight = function () {
				if (!logged) {
					console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
					logged = true;
				}
				Prism.plugins.fileHighlight.highlight.apply(this, arguments);
			};

		}());
} (prism$1));
	return prismExports;
}

var componentsExports = {};
var components = {
  get exports(){ return componentsExports; },
  set exports(v){ componentsExports = v; },
};

var hasRequiredComponents$1;

function requireComponents$1 () {
	if (hasRequiredComponents$1) return componentsExports;
	hasRequiredComponents$1 = 1;
	(function (module) {
		var components = {"core":{"meta":{"path":"components/prism-core.js","option":"mandatory"},"core":"Core"},"themes":{"meta":{"path":"themes/{id}.css","link":"index.html?theme={id}","exclusive":true},"prism":{"title":"Default","option":"default"},"prism-dark":"Dark","prism-funky":"Funky","prism-okaidia":{"title":"Okaidia","owner":"ocodia"},"prism-twilight":{"title":"Twilight","owner":"remybach"},"prism-coy":{"title":"Coy","owner":"tshedor"},"prism-solarizedlight":{"title":"Solarized Light","owner":"hectormatos2011 "},"prism-tomorrow":{"title":"Tomorrow Night","owner":"Rosey"}},"languages":{"meta":{"path":"components/prism-{id}","noCSS":true,"examplesPath":"examples/prism-{id}","addCheckAll":true},"markup":{"title":"Markup","alias":["html","xml","svg","mathml","ssml","atom","rss"],"aliasTitles":{"html":"HTML","xml":"XML","svg":"SVG","mathml":"MathML","ssml":"SSML","atom":"Atom","rss":"RSS"},"option":"default"},"css":{"title":"CSS","option":"default","modify":"markup"},"clike":{"title":"C-like","option":"default"},"javascript":{"title":"JavaScript","require":"clike","modify":"markup","optional":"regex","alias":"js","option":"default"},"abap":{"title":"ABAP","owner":"dellagustin"},"abnf":{"title":"ABNF","owner":"RunDevelopment"},"actionscript":{"title":"ActionScript","require":"javascript","modify":"markup","owner":"Golmote"},"ada":{"title":"Ada","owner":"Lucretia"},"agda":{"title":"Agda","owner":"xy-ren"},"al":{"title":"AL","owner":"RunDevelopment"},"antlr4":{"title":"ANTLR4","alias":"g4","owner":"RunDevelopment"},"apacheconf":{"title":"Apache Configuration","owner":"GuiTeK"},"apex":{"title":"Apex","require":["clike","sql"],"owner":"RunDevelopment"},"apl":{"title":"APL","owner":"ngn"},"applescript":{"title":"AppleScript","owner":"Golmote"},"aql":{"title":"AQL","owner":"RunDevelopment"},"arduino":{"title":"Arduino","require":"cpp","alias":"ino","owner":"dkern"},"arff":{"title":"ARFF","owner":"Golmote"},"armasm":{"title":"ARM Assembly","alias":"arm-asm","owner":"RunDevelopment"},"arturo":{"title":"Arturo","alias":"art","optional":["bash","css","javascript","markup","markdown","sql"],"owner":"drkameleon"},"asciidoc":{"alias":"adoc","title":"AsciiDoc","owner":"Golmote"},"aspnet":{"title":"ASP.NET (C#)","require":["markup","csharp"],"owner":"nauzilus"},"asm6502":{"title":"6502 Assembly","owner":"kzurawel"},"asmatmel":{"title":"Atmel AVR Assembly","owner":"cerkit"},"autohotkey":{"title":"AutoHotkey","owner":"aviaryan"},"autoit":{"title":"AutoIt","owner":"Golmote"},"avisynth":{"title":"AviSynth","alias":"avs","owner":"Zinfidel"},"avro-idl":{"title":"Avro IDL","alias":"avdl","owner":"RunDevelopment"},"awk":{"title":"AWK","alias":"gawk","aliasTitles":{"gawk":"GAWK"},"owner":"RunDevelopment"},"bash":{"title":"Bash","alias":["sh","shell"],"aliasTitles":{"sh":"Shell","shell":"Shell"},"owner":"zeitgeist87"},"basic":{"title":"BASIC","owner":"Golmote"},"batch":{"title":"Batch","owner":"Golmote"},"bbcode":{"title":"BBcode","alias":"shortcode","aliasTitles":{"shortcode":"Shortcode"},"owner":"RunDevelopment"},"bbj":{"title":"BBj","owner":"hyyan"},"bicep":{"title":"Bicep","owner":"johnnyreilly"},"birb":{"title":"Birb","require":"clike","owner":"Calamity210"},"bison":{"title":"Bison","require":"c","owner":"Golmote"},"bnf":{"title":"BNF","alias":"rbnf","aliasTitles":{"rbnf":"RBNF"},"owner":"RunDevelopment"},"bqn":{"title":"BQN","owner":"yewscion"},"brainfuck":{"title":"Brainfuck","owner":"Golmote"},"brightscript":{"title":"BrightScript","owner":"RunDevelopment"},"bro":{"title":"Bro","owner":"wayward710"},"bsl":{"title":"BSL (1C:Enterprise)","alias":"oscript","aliasTitles":{"oscript":"OneScript"},"owner":"Diversus23"},"c":{"title":"C","require":"clike","owner":"zeitgeist87"},"csharp":{"title":"C#","require":"clike","alias":["cs","dotnet"],"owner":"mvalipour"},"cpp":{"title":"C++","require":"c","owner":"zeitgeist87"},"cfscript":{"title":"CFScript","require":"clike","alias":"cfc","owner":"mjclemente"},"chaiscript":{"title":"ChaiScript","require":["clike","cpp"],"owner":"RunDevelopment"},"cil":{"title":"CIL","owner":"sbrl"},"cilkc":{"title":"Cilk/C","require":"c","alias":"cilk-c","owner":"OpenCilk"},"cilkcpp":{"title":"Cilk/C++","require":"cpp","alias":["cilk-cpp","cilk"],"owner":"OpenCilk"},"clojure":{"title":"Clojure","owner":"troglotit"},"cmake":{"title":"CMake","owner":"mjrogozinski"},"cobol":{"title":"COBOL","owner":"RunDevelopment"},"coffeescript":{"title":"CoffeeScript","require":"javascript","alias":"coffee","owner":"R-osey"},"concurnas":{"title":"Concurnas","alias":"conc","owner":"jasontatton"},"csp":{"title":"Content-Security-Policy","owner":"ScottHelme"},"cooklang":{"title":"Cooklang","owner":"ahue"},"coq":{"title":"Coq","owner":"RunDevelopment"},"crystal":{"title":"Crystal","require":"ruby","owner":"MakeNowJust"},"css-extras":{"title":"CSS Extras","require":"css","modify":"css","owner":"milesj"},"csv":{"title":"CSV","owner":"RunDevelopment"},"cue":{"title":"CUE","owner":"RunDevelopment"},"cypher":{"title":"Cypher","owner":"RunDevelopment"},"d":{"title":"D","require":"clike","owner":"Golmote"},"dart":{"title":"Dart","require":"clike","owner":"Golmote"},"dataweave":{"title":"DataWeave","owner":"machaval"},"dax":{"title":"DAX","owner":"peterbud"},"dhall":{"title":"Dhall","owner":"RunDevelopment"},"diff":{"title":"Diff","owner":"uranusjr"},"django":{"title":"Django/Jinja2","require":"markup-templating","alias":"jinja2","owner":"romanvm"},"dns-zone-file":{"title":"DNS zone file","owner":"RunDevelopment","alias":"dns-zone"},"docker":{"title":"Docker","alias":"dockerfile","owner":"JustinBeckwith"},"dot":{"title":"DOT (Graphviz)","alias":"gv","optional":"markup","owner":"RunDevelopment"},"ebnf":{"title":"EBNF","owner":"RunDevelopment"},"editorconfig":{"title":"EditorConfig","owner":"osipxd"},"eiffel":{"title":"Eiffel","owner":"Conaclos"},"ejs":{"title":"EJS","require":["javascript","markup-templating"],"owner":"RunDevelopment","alias":"eta","aliasTitles":{"eta":"Eta"}},"elixir":{"title":"Elixir","owner":"Golmote"},"elm":{"title":"Elm","owner":"zwilias"},"etlua":{"title":"Embedded Lua templating","require":["lua","markup-templating"],"owner":"RunDevelopment"},"erb":{"title":"ERB","require":["ruby","markup-templating"],"owner":"Golmote"},"erlang":{"title":"Erlang","owner":"Golmote"},"excel-formula":{"title":"Excel Formula","alias":["xlsx","xls"],"owner":"RunDevelopment"},"fsharp":{"title":"F#","require":"clike","owner":"simonreynolds7"},"factor":{"title":"Factor","owner":"catb0t"},"false":{"title":"False","owner":"edukisto"},"firestore-security-rules":{"title":"Firestore security rules","require":"clike","owner":"RunDevelopment"},"flow":{"title":"Flow","require":"javascript","owner":"Golmote"},"fortran":{"title":"Fortran","owner":"Golmote"},"ftl":{"title":"FreeMarker Template Language","require":"markup-templating","owner":"RunDevelopment"},"gml":{"title":"GameMaker Language","alias":"gamemakerlanguage","require":"clike","owner":"LiarOnce"},"gap":{"title":"GAP (CAS)","owner":"RunDevelopment"},"gcode":{"title":"G-code","owner":"RunDevelopment"},"gdscript":{"title":"GDScript","owner":"RunDevelopment"},"gedcom":{"title":"GEDCOM","owner":"Golmote"},"gettext":{"title":"gettext","alias":"po","owner":"RunDevelopment"},"gherkin":{"title":"Gherkin","owner":"hason"},"git":{"title":"Git","owner":"lgiraudel"},"glsl":{"title":"GLSL","require":"c","owner":"Golmote"},"gn":{"title":"GN","alias":"gni","owner":"RunDevelopment"},"linker-script":{"title":"GNU Linker Script","alias":"ld","owner":"RunDevelopment"},"go":{"title":"Go","require":"clike","owner":"arnehormann"},"go-module":{"title":"Go module","alias":"go-mod","owner":"RunDevelopment"},"gradle":{"title":"Gradle","require":"clike","owner":"zeabdelkhalek-badido18"},"graphql":{"title":"GraphQL","optional":"markdown","owner":"Golmote"},"groovy":{"title":"Groovy","require":"clike","owner":"robfletcher"},"haml":{"title":"Haml","require":"ruby","optional":["css","css-extras","coffeescript","erb","javascript","less","markdown","scss","textile"],"owner":"Golmote"},"handlebars":{"title":"Handlebars","require":"markup-templating","alias":["hbs","mustache"],"aliasTitles":{"mustache":"Mustache"},"owner":"Golmote"},"haskell":{"title":"Haskell","alias":"hs","owner":"bholst"},"haxe":{"title":"Haxe","require":"clike","optional":"regex","owner":"Golmote"},"hcl":{"title":"HCL","owner":"outsideris"},"hlsl":{"title":"HLSL","require":"c","owner":"RunDevelopment"},"hoon":{"title":"Hoon","owner":"matildepark"},"http":{"title":"HTTP","optional":["csp","css","hpkp","hsts","javascript","json","markup","uri"],"owner":"danielgtaylor"},"hpkp":{"title":"HTTP Public-Key-Pins","owner":"ScottHelme"},"hsts":{"title":"HTTP Strict-Transport-Security","owner":"ScottHelme"},"ichigojam":{"title":"IchigoJam","owner":"BlueCocoa"},"icon":{"title":"Icon","owner":"Golmote"},"icu-message-format":{"title":"ICU Message Format","owner":"RunDevelopment"},"idris":{"title":"Idris","alias":"idr","owner":"KeenS","require":"haskell"},"ignore":{"title":".ignore","owner":"osipxd","alias":["gitignore","hgignore","npmignore"],"aliasTitles":{"gitignore":".gitignore","hgignore":".hgignore","npmignore":".npmignore"}},"inform7":{"title":"Inform 7","owner":"Golmote"},"ini":{"title":"Ini","owner":"aviaryan"},"io":{"title":"Io","owner":"AlesTsurko"},"j":{"title":"J","owner":"Golmote"},"java":{"title":"Java","require":"clike","owner":"sherblot"},"javadoc":{"title":"JavaDoc","require":["markup","java","javadoclike"],"modify":"java","optional":"scala","owner":"RunDevelopment"},"javadoclike":{"title":"JavaDoc-like","modify":["java","javascript","php"],"owner":"RunDevelopment"},"javastacktrace":{"title":"Java stack trace","owner":"RunDevelopment"},"jexl":{"title":"Jexl","owner":"czosel"},"jolie":{"title":"Jolie","require":"clike","owner":"thesave"},"jq":{"title":"JQ","owner":"RunDevelopment"},"jsdoc":{"title":"JSDoc","require":["javascript","javadoclike","typescript"],"modify":"javascript","optional":["actionscript","coffeescript"],"owner":"RunDevelopment"},"js-extras":{"title":"JS Extras","require":"javascript","modify":"javascript","optional":["actionscript","coffeescript","flow","n4js","typescript"],"owner":"RunDevelopment"},"json":{"title":"JSON","alias":"webmanifest","aliasTitles":{"webmanifest":"Web App Manifest"},"owner":"CupOfTea696"},"json5":{"title":"JSON5","require":"json","owner":"RunDevelopment"},"jsonp":{"title":"JSONP","require":"json","owner":"RunDevelopment"},"jsstacktrace":{"title":"JS stack trace","owner":"sbrl"},"js-templates":{"title":"JS Templates","require":"javascript","modify":"javascript","optional":["css","css-extras","graphql","markdown","markup","sql"],"owner":"RunDevelopment"},"julia":{"title":"Julia","owner":"cdagnino"},"keepalived":{"title":"Keepalived Configure","owner":"dev-itsheng"},"keyman":{"title":"Keyman","owner":"mcdurdin"},"kotlin":{"title":"Kotlin","alias":["kt","kts"],"aliasTitles":{"kts":"Kotlin Script"},"require":"clike","owner":"Golmote"},"kumir":{"title":"KuMir (КуМир)","alias":"kum","owner":"edukisto"},"kusto":{"title":"Kusto","owner":"RunDevelopment"},"latex":{"title":"LaTeX","alias":["tex","context"],"aliasTitles":{"tex":"TeX","context":"ConTeXt"},"owner":"japborst"},"latte":{"title":"Latte","require":["clike","markup-templating","php"],"owner":"nette"},"less":{"title":"Less","require":"css","optional":"css-extras","owner":"Golmote"},"lilypond":{"title":"LilyPond","require":"scheme","alias":"ly","owner":"RunDevelopment"},"liquid":{"title":"Liquid","require":"markup-templating","owner":"cinhtau"},"lisp":{"title":"Lisp","alias":["emacs","elisp","emacs-lisp"],"owner":"JuanCaicedo"},"livescript":{"title":"LiveScript","owner":"Golmote"},"llvm":{"title":"LLVM IR","owner":"porglezomp"},"log":{"title":"Log file","optional":"javastacktrace","owner":"RunDevelopment"},"lolcode":{"title":"LOLCODE","owner":"Golmote"},"lua":{"title":"Lua","owner":"Golmote"},"magma":{"title":"Magma (CAS)","owner":"RunDevelopment"},"makefile":{"title":"Makefile","owner":"Golmote"},"markdown":{"title":"Markdown","require":"markup","optional":"yaml","alias":"md","owner":"Golmote"},"markup-templating":{"title":"Markup templating","require":"markup","owner":"Golmote"},"mata":{"title":"Mata","owner":"RunDevelopment"},"matlab":{"title":"MATLAB","owner":"Golmote"},"maxscript":{"title":"MAXScript","owner":"RunDevelopment"},"mel":{"title":"MEL","owner":"Golmote"},"mermaid":{"title":"Mermaid","owner":"RunDevelopment"},"metafont":{"title":"METAFONT","owner":"LaeriExNihilo"},"mizar":{"title":"Mizar","owner":"Golmote"},"mongodb":{"title":"MongoDB","owner":"airs0urce","require":"javascript"},"monkey":{"title":"Monkey","owner":"Golmote"},"moonscript":{"title":"MoonScript","alias":"moon","owner":"RunDevelopment"},"n1ql":{"title":"N1QL","owner":"TMWilds"},"n4js":{"title":"N4JS","require":"javascript","optional":"jsdoc","alias":"n4jsd","owner":"bsmith-n4"},"nand2tetris-hdl":{"title":"Nand To Tetris HDL","owner":"stephanmax"},"naniscript":{"title":"Naninovel Script","owner":"Elringus","alias":"nani"},"nasm":{"title":"NASM","owner":"rbmj"},"neon":{"title":"NEON","owner":"nette"},"nevod":{"title":"Nevod","owner":"nezaboodka"},"nginx":{"title":"nginx","owner":"volado"},"nim":{"title":"Nim","owner":"Golmote"},"nix":{"title":"Nix","owner":"Golmote"},"nsis":{"title":"NSIS","owner":"idleberg"},"objectivec":{"title":"Objective-C","require":"c","alias":"objc","owner":"uranusjr"},"ocaml":{"title":"OCaml","owner":"Golmote"},"odin":{"title":"Odin","owner":"edukisto"},"opencl":{"title":"OpenCL","require":"c","modify":["c","cpp"],"owner":"Milania1"},"openqasm":{"title":"OpenQasm","alias":"qasm","owner":"RunDevelopment"},"oz":{"title":"Oz","owner":"Golmote"},"parigp":{"title":"PARI/GP","owner":"Golmote"},"parser":{"title":"Parser","require":"markup","owner":"Golmote"},"pascal":{"title":"Pascal","alias":"objectpascal","aliasTitles":{"objectpascal":"Object Pascal"},"owner":"Golmote"},"pascaligo":{"title":"Pascaligo","owner":"DefinitelyNotAGoat"},"psl":{"title":"PATROL Scripting Language","owner":"bertysentry"},"pcaxis":{"title":"PC-Axis","alias":"px","owner":"RunDevelopment"},"peoplecode":{"title":"PeopleCode","alias":"pcode","owner":"RunDevelopment"},"perl":{"title":"Perl","owner":"Golmote"},"php":{"title":"PHP","require":"markup-templating","owner":"milesj"},"phpdoc":{"title":"PHPDoc","require":["php","javadoclike"],"modify":"php","owner":"RunDevelopment"},"php-extras":{"title":"PHP Extras","require":"php","modify":"php","owner":"milesj"},"plant-uml":{"title":"PlantUML","alias":"plantuml","owner":"RunDevelopment"},"plsql":{"title":"PL/SQL","require":"sql","owner":"Golmote"},"powerquery":{"title":"PowerQuery","alias":["pq","mscript"],"owner":"peterbud"},"powershell":{"title":"PowerShell","owner":"nauzilus"},"processing":{"title":"Processing","require":"clike","owner":"Golmote"},"prolog":{"title":"Prolog","owner":"Golmote"},"promql":{"title":"PromQL","owner":"arendjr"},"properties":{"title":".properties","owner":"Golmote"},"protobuf":{"title":"Protocol Buffers","require":"clike","owner":"just-boris"},"pug":{"title":"Pug","require":["markup","javascript"],"optional":["coffeescript","ejs","handlebars","less","livescript","markdown","scss","stylus","twig"],"owner":"Golmote"},"puppet":{"title":"Puppet","owner":"Golmote"},"pure":{"title":"Pure","optional":["c","cpp","fortran"],"owner":"Golmote"},"purebasic":{"title":"PureBasic","require":"clike","alias":"pbfasm","owner":"HeX0R101"},"purescript":{"title":"PureScript","require":"haskell","alias":"purs","owner":"sriharshachilakapati"},"python":{"title":"Python","alias":"py","owner":"multipetros"},"qsharp":{"title":"Q#","require":"clike","alias":"qs","owner":"fedonman"},"q":{"title":"Q (kdb+ database)","owner":"Golmote"},"qml":{"title":"QML","require":"javascript","owner":"RunDevelopment"},"qore":{"title":"Qore","require":"clike","owner":"temnroegg"},"r":{"title":"R","owner":"Golmote"},"racket":{"title":"Racket","require":"scheme","alias":"rkt","owner":"RunDevelopment"},"cshtml":{"title":"Razor C#","alias":"razor","require":["markup","csharp"],"optional":["css","css-extras","javascript","js-extras"],"owner":"RunDevelopment"},"jsx":{"title":"React JSX","require":["markup","javascript"],"optional":["jsdoc","js-extras","js-templates"],"owner":"vkbansal"},"tsx":{"title":"React TSX","require":["jsx","typescript"]},"reason":{"title":"Reason","require":"clike","owner":"Golmote"},"regex":{"title":"Regex","owner":"RunDevelopment"},"rego":{"title":"Rego","owner":"JordanSh"},"renpy":{"title":"Ren'py","alias":"rpy","owner":"HyuchiaDiego"},"rescript":{"title":"ReScript","alias":"res","owner":"vmarcosp"},"rest":{"title":"reST (reStructuredText)","owner":"Golmote"},"rip":{"title":"Rip","owner":"ravinggenius"},"roboconf":{"title":"Roboconf","owner":"Golmote"},"robotframework":{"title":"Robot Framework","alias":"robot","owner":"RunDevelopment"},"ruby":{"title":"Ruby","require":"clike","alias":"rb","owner":"samflores"},"rust":{"title":"Rust","owner":"Golmote"},"sas":{"title":"SAS","optional":["groovy","lua","sql"],"owner":"Golmote"},"sass":{"title":"Sass (Sass)","require":"css","optional":"css-extras","owner":"Golmote"},"scss":{"title":"Sass (SCSS)","require":"css","optional":"css-extras","owner":"MoOx"},"scala":{"title":"Scala","require":"java","owner":"jozic"},"scheme":{"title":"Scheme","owner":"bacchus123"},"shell-session":{"title":"Shell session","require":"bash","alias":["sh-session","shellsession"],"owner":"RunDevelopment"},"smali":{"title":"Smali","owner":"RunDevelopment"},"smalltalk":{"title":"Smalltalk","owner":"Golmote"},"smarty":{"title":"Smarty","require":"markup-templating","optional":"php","owner":"Golmote"},"sml":{"title":"SML","alias":"smlnj","aliasTitles":{"smlnj":"SML/NJ"},"owner":"RunDevelopment"},"solidity":{"title":"Solidity (Ethereum)","alias":"sol","require":"clike","owner":"glachaud"},"solution-file":{"title":"Solution file","alias":"sln","owner":"RunDevelopment"},"soy":{"title":"Soy (Closure Template)","require":"markup-templating","owner":"Golmote"},"sparql":{"title":"SPARQL","require":"turtle","owner":"Triply-Dev","alias":"rq"},"splunk-spl":{"title":"Splunk SPL","owner":"RunDevelopment"},"sqf":{"title":"SQF: Status Quo Function (Arma 3)","require":"clike","owner":"RunDevelopment"},"sql":{"title":"SQL","owner":"multipetros"},"squirrel":{"title":"Squirrel","require":"clike","owner":"RunDevelopment"},"stan":{"title":"Stan","owner":"RunDevelopment"},"stata":{"title":"Stata Ado","require":["mata","java","python"],"owner":"RunDevelopment"},"iecst":{"title":"Structured Text (IEC 61131-3)","owner":"serhioromano"},"stylus":{"title":"Stylus","owner":"vkbansal"},"supercollider":{"title":"SuperCollider","alias":"sclang","owner":"RunDevelopment"},"swift":{"title":"Swift","owner":"chrischares"},"systemd":{"title":"Systemd configuration file","owner":"RunDevelopment"},"t4-templating":{"title":"T4 templating","owner":"RunDevelopment"},"t4-cs":{"title":"T4 Text Templates (C#)","require":["t4-templating","csharp"],"alias":"t4","owner":"RunDevelopment"},"t4-vb":{"title":"T4 Text Templates (VB)","require":["t4-templating","vbnet"],"owner":"RunDevelopment"},"tap":{"title":"TAP","owner":"isaacs","require":"yaml"},"tcl":{"title":"Tcl","owner":"PeterChaplin"},"tt2":{"title":"Template Toolkit 2","require":["clike","markup-templating"],"owner":"gflohr"},"textile":{"title":"Textile","require":"markup","optional":"css","owner":"Golmote"},"toml":{"title":"TOML","owner":"RunDevelopment"},"tremor":{"title":"Tremor","alias":["trickle","troy"],"owner":"darach","aliasTitles":{"trickle":"trickle","troy":"troy"}},"turtle":{"title":"Turtle","alias":"trig","aliasTitles":{"trig":"TriG"},"owner":"jakubklimek"},"twig":{"title":"Twig","require":"markup-templating","owner":"brandonkelly"},"typescript":{"title":"TypeScript","require":"javascript","optional":"js-templates","alias":"ts","owner":"vkbansal"},"typoscript":{"title":"TypoScript","alias":"tsconfig","aliasTitles":{"tsconfig":"TSConfig"},"owner":"dkern"},"unrealscript":{"title":"UnrealScript","alias":["uscript","uc"],"owner":"RunDevelopment"},"uorazor":{"title":"UO Razor Script","owner":"jaseowns"},"uri":{"title":"URI","alias":"url","aliasTitles":{"url":"URL"},"owner":"RunDevelopment"},"v":{"title":"V","require":"clike","owner":"taggon"},"vala":{"title":"Vala","require":"clike","optional":"regex","owner":"TemplarVolk"},"vbnet":{"title":"VB.Net","require":"basic","owner":"Bigsby"},"velocity":{"title":"Velocity","require":"markup","owner":"Golmote"},"verilog":{"title":"Verilog","owner":"a-rey"},"vhdl":{"title":"VHDL","owner":"a-rey"},"vim":{"title":"vim","owner":"westonganger"},"visual-basic":{"title":"Visual Basic","alias":["vb","vba"],"aliasTitles":{"vba":"VBA"},"owner":"Golmote"},"warpscript":{"title":"WarpScript","owner":"RunDevelopment"},"wasm":{"title":"WebAssembly","owner":"Golmote"},"web-idl":{"title":"Web IDL","alias":"webidl","owner":"RunDevelopment"},"wgsl":{"title":"WGSL","owner":"Dr4gonthree"},"wiki":{"title":"Wiki markup","require":"markup","owner":"Golmote"},"wolfram":{"title":"Wolfram language","alias":["mathematica","nb","wl"],"aliasTitles":{"mathematica":"Mathematica","nb":"Mathematica Notebook"},"owner":"msollami"},"wren":{"title":"Wren","owner":"clsource"},"xeora":{"title":"Xeora","require":"markup","alias":"xeoracube","aliasTitles":{"xeoracube":"XeoraCube"},"owner":"freakmaxi"},"xml-doc":{"title":"XML doc (.net)","require":"markup","modify":["csharp","fsharp","vbnet"],"owner":"RunDevelopment"},"xojo":{"title":"Xojo (REALbasic)","owner":"Golmote"},"xquery":{"title":"XQuery","require":"markup","owner":"Golmote"},"yaml":{"title":"YAML","alias":"yml","owner":"hason"},"yang":{"title":"YANG","owner":"RunDevelopment"},"zig":{"title":"Zig","owner":"RunDevelopment"}},"plugins":{"meta":{"path":"plugins/{id}/prism-{id}","link":"plugins/{id}/"},"line-highlight":{"title":"Line Highlight","description":"Highlights specific lines and/or line ranges."},"line-numbers":{"title":"Line Numbers","description":"Line number at the beginning of code lines.","owner":"kuba-kubula"},"show-invisibles":{"title":"Show Invisibles","description":"Show hidden characters such as tabs and line breaks.","optional":["autolinker","data-uri-highlight"]},"autolinker":{"title":"Autolinker","description":"Converts URLs and emails in code to clickable links. Parses Markdown links in comments."},"wpd":{"title":"WebPlatform Docs","description":"Makes tokens link to <a href=\"https://webplatform.github.io/docs/\">WebPlatform.org documentation</a>. The links open in a new tab."},"custom-class":{"title":"Custom Class","description":"This plugin allows you to prefix Prism's default classes (<code>.comment</code> can become <code>.namespace--comment</code>) or replace them with your defined ones (like <code>.editor__comment</code>). You can even add new classes.","owner":"dvkndn","noCSS":true},"file-highlight":{"title":"File Highlight","description":"Fetch external files and highlight them with Prism. Used on the Prism website itself.","noCSS":true},"show-language":{"title":"Show Language","description":"Display the highlighted language in code blocks (inline code does not show the label).","owner":"nauzilus","noCSS":true,"require":"toolbar"},"jsonp-highlight":{"title":"JSONP Highlight","description":"Fetch content with JSONP and highlight some interesting content (e.g. GitHub/Gists or Bitbucket API).","noCSS":true,"owner":"nauzilus"},"highlight-keywords":{"title":"Highlight Keywords","description":"Adds special CSS classes for each keyword for fine-grained highlighting.","owner":"vkbansal","noCSS":true},"remove-initial-line-feed":{"title":"Remove initial line feed","description":"Removes the initial line feed in code blocks.","owner":"Golmote","noCSS":true},"inline-color":{"title":"Inline color","description":"Adds a small inline preview for colors in style sheets.","require":"css-extras","owner":"RunDevelopment"},"previewers":{"title":"Previewers","description":"Previewers for angles, colors, gradients, easing and time.","require":"css-extras","owner":"Golmote"},"autoloader":{"title":"Autoloader","description":"Automatically loads the needed languages to highlight the code blocks.","owner":"Golmote","noCSS":true},"keep-markup":{"title":"Keep Markup","description":"Prevents custom markup from being dropped out during highlighting.","owner":"Golmote","optional":"normalize-whitespace","noCSS":true},"command-line":{"title":"Command Line","description":"Display a command line with a prompt and, optionally, the output/response from the commands.","owner":"chriswells0"},"unescaped-markup":{"title":"Unescaped Markup","description":"Write markup without having to escape anything."},"normalize-whitespace":{"title":"Normalize Whitespace","description":"Supports multiple operations to normalize whitespace in code blocks.","owner":"zeitgeist87","optional":"unescaped-markup","noCSS":true},"data-uri-highlight":{"title":"Data-URI Highlight","description":"Highlights data-URI contents.","owner":"Golmote","noCSS":true},"toolbar":{"title":"Toolbar","description":"Attach a toolbar for plugins to easily register buttons on the top of a code block.","owner":"mAAdhaTTah"},"copy-to-clipboard":{"title":"Copy to Clipboard Button","description":"Add a button that copies the code block to the clipboard when clicked.","owner":"mAAdhaTTah","require":"toolbar","noCSS":true},"download-button":{"title":"Download Button","description":"A button in the toolbar of a code block adding a convenient way to download a code file.","owner":"Golmote","require":"toolbar","noCSS":true},"match-braces":{"title":"Match braces","description":"Highlights matching braces.","owner":"RunDevelopment"},"diff-highlight":{"title":"Diff Highlight","description":"Highlights the code inside diff blocks.","owner":"RunDevelopment","require":"diff"},"filter-highlight-all":{"title":"Filter highlightAll","description":"Filters the elements the <code>highlightAll</code> and <code>highlightAllUnder</code> methods actually highlight.","owner":"RunDevelopment","noCSS":true},"treeview":{"title":"Treeview","description":"A language with special styles to highlight file system tree structures.","owner":"Golmote"}}};
		if (module.exports) { module.exports = components; }
} (components));
	return componentsExports;
}

var dependenciesExports = {};
var dependencies = {
  get exports(){ return dependenciesExports; },
  set exports(v){ dependenciesExports = v; },
};

var hasRequiredDependencies;

function requireDependencies () {
	if (hasRequiredDependencies) return dependenciesExports;
	hasRequiredDependencies = 1;
	(function (module) {

		/**
		 * @typedef {Object<string, ComponentCategory>} Components
		 * @typedef {Object<string, ComponentEntry | string>} ComponentCategory
		 *
		 * @typedef ComponentEntry
		 * @property {string} [title] The title of the component.
		 * @property {string} [owner] The GitHub user name of the owner.
		 * @property {boolean} [noCSS=false] Whether the component doesn't have style sheets which should also be loaded.
		 * @property {string | string[]} [alias] An optional list of aliases for the id of the component.
		 * @property {Object<string, string>} [aliasTitles] An optional map from an alias to its title.
		 *
		 * Aliases which are not in this map will the get title of the component.
		 * @property {string | string[]} [optional]
		 * @property {string | string[]} [require]
		 * @property {string | string[]} [modify]
		 */

		var getLoader = (function () {

			/**
			 * A function which does absolutely nothing.
			 *
			 * @type {any}
			 */
			var noop = function () { };

			/**
			 * Invokes the given callback for all elements of the given value.
			 *
			 * If the given value is an array, the callback will be invokes for all elements. If the given value is `null` or
			 * `undefined`, the callback will not be invoked. In all other cases, the callback will be invoked with the given
			 * value as parameter.
			 *
			 * @param {null | undefined | T | T[]} value
			 * @param {(value: T, index: number) => void} callbackFn
			 * @returns {void}
			 * @template T
			 */
			function forEach(value, callbackFn) {
				if (Array.isArray(value)) {
					value.forEach(callbackFn);
				} else if (value != null) {
					callbackFn(value, 0);
				}
			}

			/**
			 * Returns a new set for the given string array.
			 *
			 * @param {string[]} array
			 * @returns {StringSet}
			 *
			 * @typedef {Object<string, true>} StringSet
			 */
			function toSet(array) {
				/** @type {StringSet} */
				var set = {};
				for (var i = 0, l = array.length; i < l; i++) {
					set[array[i]] = true;
				}
				return set;
			}

			/**
			 * Creates a map of every components id to its entry.
			 *
			 * @param {Components} components
			 * @returns {EntryMap}
			 *
			 * @typedef {{ readonly [id: string]: Readonly<ComponentEntry> | undefined }} EntryMap
			 */
			function createEntryMap(components) {
				/** @type {Object<string, Readonly<ComponentEntry>>} */
				var map = {};

				for (var categoryName in components) {
					var category = components[categoryName];
					for (var id in category) {
						if (id != 'meta') {
							/** @type {ComponentEntry | string} */
							var entry = category[id];
							map[id] = typeof entry == 'string' ? { title: entry } : entry;
						}
					}
				}

				return map;
			}

			/**
			 * Creates a full dependencies map which includes all types of dependencies and their transitive dependencies.
			 *
			 * @param {EntryMap} entryMap
			 * @returns {DependencyResolver}
			 *
			 * @typedef {(id: string) => StringSet} DependencyResolver
			 */
			function createDependencyResolver(entryMap) {
				/** @type {Object<string, StringSet>} */
				var map = {};
				var _stackArray = [];

				/**
				 * Adds the dependencies of the given component to the dependency map.
				 *
				 * @param {string} id
				 * @param {string[]} stack
				 */
				function addToMap(id, stack) {
					if (id in map) {
						return;
					}

					stack.push(id);

					// check for circular dependencies
					var firstIndex = stack.indexOf(id);
					if (firstIndex < stack.length - 1) {
						throw new Error('Circular dependency: ' + stack.slice(firstIndex).join(' -> '));
					}

					/** @type {StringSet} */
					var dependencies = {};

					var entry = entryMap[id];
					if (entry) {
						/**
						 * This will add the direct dependency and all of its transitive dependencies to the set of
						 * dependencies of `entry`.
						 *
						 * @param {string} depId
						 * @returns {void}
						 */
						function handleDirectDependency(depId) {
							if (!(depId in entryMap)) {
								throw new Error(id + ' depends on an unknown component ' + depId);
							}
							if (depId in dependencies) {
								// if the given dependency is already in the set of deps, then so are its transitive deps
								return;
							}

							addToMap(depId, stack);
							dependencies[depId] = true;
							for (var transitiveDepId in map[depId]) {
								dependencies[transitiveDepId] = true;
							}
						}

						forEach(entry.require, handleDirectDependency);
						forEach(entry.optional, handleDirectDependency);
						forEach(entry.modify, handleDirectDependency);
					}

					map[id] = dependencies;

					stack.pop();
				}

				return function (id) {
					var deps = map[id];
					if (!deps) {
						addToMap(id, _stackArray);
						deps = map[id];
					}
					return deps;
				};
			}

			/**
			 * Returns a function which resolves the aliases of its given id of alias.
			 *
			 * @param {EntryMap} entryMap
			 * @returns {(idOrAlias: string) => string}
			 */
			function createAliasResolver(entryMap) {
				/** @type {Object<string, string> | undefined} */
				var map;

				return function (idOrAlias) {
					if (idOrAlias in entryMap) {
						return idOrAlias;
					} else {
						// only create the alias map if necessary
						if (!map) {
							map = {};

							for (var id in entryMap) {
								var entry = entryMap[id];
								forEach(entry && entry.alias, function (alias) {
									if (alias in map) {
										throw new Error(alias + ' cannot be alias for both ' + id + ' and ' + map[alias]);
									}
									if (alias in entryMap) {
										throw new Error(alias + ' cannot be alias of ' + id + ' because it is a component.');
									}
									map[alias] = id;
								});
							}
						}
						return map[idOrAlias] || idOrAlias;
					}
				};
			}

			/**
			 * @typedef LoadChainer
			 * @property {(before: T, after: () => T) => T} series
			 * @property {(values: T[]) => T} parallel
			 * @template T
			 */

			/**
			 * Creates an implicit DAG from the given components and dependencies and call the given `loadComponent` for each
			 * component in topological order.
			 *
			 * @param {DependencyResolver} dependencyResolver
			 * @param {StringSet} ids
			 * @param {(id: string) => T} loadComponent
			 * @param {LoadChainer<T>} [chainer]
			 * @returns {T}
			 * @template T
			 */
			function loadComponentsInOrder(dependencyResolver, ids, loadComponent, chainer) {
				var series = chainer ? chainer.series : undefined;
				var parallel = chainer ? chainer.parallel : noop;

				/** @type {Object<string, T>} */
				var cache = {};

				/**
				 * A set of ids of nodes which are not depended upon by any other node in the graph.
				 *
				 * @type {StringSet}
				 */
				var ends = {};

				/**
				 * Loads the given component and its dependencies or returns the cached value.
				 *
				 * @param {string} id
				 * @returns {T}
				 */
				function handleId(id) {
					if (id in cache) {
						return cache[id];
					}

					// assume that it's an end
					// if it isn't, it will be removed later
					ends[id] = true;

					// all dependencies of the component in the given ids
					var dependsOn = [];
					for (var depId in dependencyResolver(id)) {
						if (depId in ids) {
							dependsOn.push(depId);
						}
					}

					/**
					 * The value to be returned.
					 *
					 * @type {T}
					 */
					var value;

					if (dependsOn.length === 0) {
						value = loadComponent(id);
					} else {
						var depsValue = parallel(dependsOn.map(function (depId) {
							var value = handleId(depId);
							// none of the dependencies can be ends
							delete ends[depId];
							return value;
						}));
						if (series) {
							// the chainer will be responsibly for calling the function calling loadComponent
							value = series(depsValue, function () { return loadComponent(id); });
						} else {
							// we don't have a chainer, so we call loadComponent ourselves
							loadComponent(id);
						}
					}

					// cache and return
					return cache[id] = value;
				}

				for (var id in ids) {
					handleId(id);
				}

				/** @type {T[]} */
				var endValues = [];
				for (var endId in ends) {
					endValues.push(cache[endId]);
				}
				return parallel(endValues);
			}

			/**
			 * Returns whether the given object has any keys.
			 *
			 * @param {object} obj
			 */
			function hasKeys(obj) {
				for (var key in obj) {
					return true;
				}
				return false;
			}

			/**
			 * Returns an object which provides methods to get the ids of the components which have to be loaded (`getIds`) and
			 * a way to efficiently load them in synchronously and asynchronous contexts (`load`).
			 *
			 * The set of ids to be loaded is a superset of `load`. If some of these ids are in `loaded`, the corresponding
			 * components will have to reloaded.
			 *
			 * The ids in `load` and `loaded` may be in any order and can contain duplicates.
			 *
			 * @param {Components} components
			 * @param {string[]} load
			 * @param {string[]} [loaded=[]] A list of already loaded components.
			 *
			 * If a component is in this list, then all of its requirements will also be assumed to be in the list.
			 * @returns {Loader}
			 *
			 * @typedef Loader
			 * @property {() => string[]} getIds A function to get all ids of the components to load.
			 *
			 * The returned ids will be duplicate-free, alias-free and in load order.
			 * @property {LoadFunction} load A functional interface to load components.
			 *
			 * @typedef {<T> (loadComponent: (id: string) => T, chainer?: LoadChainer<T>) => T} LoadFunction
			 * A functional interface to load components.
			 *
			 * The `loadComponent` function will be called for every component in the order in which they have to be loaded.
			 *
			 * The `chainer` is useful for asynchronous loading and its `series` and `parallel` functions can be thought of as
			 * `Promise#then` and `Promise.all`.
			 *
			 * @example
			 * load(id => { loadComponent(id); }); // returns undefined
			 *
			 * await load(
			 *     id => loadComponentAsync(id), // returns a Promise for each id
			 *     {
			 *         series: async (before, after) => {
			 *             await before;
			 *             await after();
			 *         },
			 *         parallel: async (values) => {
			 *             await Promise.all(values);
			 *         }
			 *     }
			 * );
			 */
			function getLoader(components, load, loaded) {
				var entryMap = createEntryMap(components);
				var resolveAlias = createAliasResolver(entryMap);

				load = load.map(resolveAlias);
				loaded = (loaded || []).map(resolveAlias);

				var loadSet = toSet(load);
				var loadedSet = toSet(loaded);

				// add requirements

				load.forEach(addRequirements);
				function addRequirements(id) {
					var entry = entryMap[id];
					forEach(entry && entry.require, function (reqId) {
						if (!(reqId in loadedSet)) {
							loadSet[reqId] = true;
							addRequirements(reqId);
						}
					});
				}

				// add components to reload

				// A component x in `loaded` has to be reloaded if
				//  1) a component in `load` modifies x.
				//  2) x depends on a component in `load`.
				// The above two condition have to be applied until nothing changes anymore.

				var dependencyResolver = createDependencyResolver(entryMap);

				/** @type {StringSet} */
				var loadAdditions = loadSet;
				/** @type {StringSet} */
				var newIds;
				while (hasKeys(loadAdditions)) {
					newIds = {};

					// condition 1)
					for (var loadId in loadAdditions) {
						var entry = entryMap[loadId];
						forEach(entry && entry.modify, function (modId) {
							if (modId in loadedSet) {
								newIds[modId] = true;
							}
						});
					}

					// condition 2)
					for (var loadedId in loadedSet) {
						if (!(loadedId in loadSet)) {
							for (var depId in dependencyResolver(loadedId)) {
								if (depId in loadSet) {
									newIds[loadedId] = true;
									break;
								}
							}
						}
					}

					loadAdditions = newIds;
					for (var newId in loadAdditions) {
						loadSet[newId] = true;
					}
				}

				/** @type {Loader} */
				var loader = {
					getIds: function () {
						var ids = [];
						loader.load(function (id) {
							ids.push(id);
						});
						return ids;
					},
					load: function (loadComponent, chainer) {
						return loadComponentsInOrder(dependencyResolver, loadSet, loadComponent, chainer);
					}
				};

				return loader;
			}

			return getLoader;

		}());

		{
			module.exports = getLoader;
		}
} (dependencies));
	return dependenciesExports;
}

var components_1;
var hasRequiredComponents;

function requireComponents () {
	if (hasRequiredComponents) return components_1;
	hasRequiredComponents = 1;
	const components = requireComponents$1();
	const getLoader = requireDependencies();


	/**
	 * The set of all languages which have been loaded using the below function.
	 *
	 * @type {Set<string>}
	 */
	const loadedLanguages = new Set();

	/**
	 * Loads the given languages and adds them to the current Prism instance.
	 *
	 * If no languages are provided, __all__ Prism languages will be loaded.
	 *
	 * @param {string|string[]} [languages]
	 * @returns {void}
	 */
	function loadLanguages(languages) {
		if (languages === undefined) {
			languages = Object.keys(components.languages).filter(l => l != 'meta');
		} else if (!Array.isArray(languages)) {
			languages = [languages];
		}

		// the user might have loaded languages via some other way or used `prism.js` which already includes some
		// we don't need to validate the ids because `getLoader` will ignore invalid ones
		const loaded = [...loadedLanguages, ...Object.keys(Prism.languages)];

		getLoader(components, languages, loaded).load(lang => {
			if (!(lang in components.languages)) {
				if (!loadLanguages.silent) {
					console.warn('Language does not exist: ' + lang);
				}
				return;
			}

			const pathToLanguage = './prism-' + lang;

			// remove from require cache and from Prism
			delete require.cache[require.resolve(pathToLanguage)];
			delete Prism.languages[lang];

			commonjsRequire(pathToLanguage);

			loadedLanguages.add(lang);
		});
	}

	/**
	 * Set this to `true` to prevent all warning messages `loadLanguages` logs.
	 */
	loadLanguages.silent = false;

	components_1 = loadLanguages;
	return components_1;
}

var hasRequiredBuild;

function requireBuild () {
	if (hasRequiredBuild) return buildExports$1;
	hasRequiredBuild = 1;
	(function (module, exports) {

		Object.defineProperty(exports, "__esModule", {
		  value: true
		});
		exports.default = markdownItPrism;

		var _prismjs = _interopRequireDefault(requirePrism());

		var _components = _interopRequireDefault(requireComponents());

		function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

		function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

		function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

		function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

		function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

		function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

		function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

		function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

		function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

		function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

		function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

		const SPECIFIED_LANGUAGE_META_KEY = 'de.joshuagleitze.markdown-it-prism.specifiedLanguage';
		const DEFAULTS = {
		  highlightInlineCode: false,
		  plugins: [],
		  init: () => {// do nothing by default
		  },
		  defaultLanguageForUnknown: undefined,
		  defaultLanguageForUnspecified: undefined,
		  defaultLanguage: undefined
		};
		/**
		 * Loads the provided `lang` into prism.
		 *
		 * @param lang
		 *        Code of the language to load.
		 * @return The Prism language object for the provided {@code lang} code. {@code undefined} if the language is not known to Prism.
		 */

		function loadPrismLang(lang) {
		  if (!lang) return undefined;
		  let langObject = _prismjs.default.languages[lang];

		  if (langObject === undefined) {
		    (0, _components.default)([lang]);
		    langObject = _prismjs.default.languages[lang];
		  }

		  return langObject;
		}
		/**
		 * Loads the provided Prism plugin.
		 * @param name
		 *        Name of the plugin to load.
		 * @throws {Error} If there is no plugin with the provided `name`.
		 */


		function loadPrismPlugin(name) {
		  try {
		    commonjsRequire(`prismjs/plugins/${name}/prism-${name}`);
		  } catch (e) {
		    throw new Error(`Cannot load Prism plugin "${name}". Please check the spelling.`);
		  }
		}
		/**
		 * Select the language to use for highlighting, based on the provided options and the specified language.
		 *
		 * @param options
		 *        The options that were used to initialise the plugin.
		 * @param lang
		 *        Code of the language to highlight the text in.
		 * @return The name of the language to use and the Prism language object for that language.
		 */


		function selectLanguage(options, lang) {
		  let langToUse = lang;

		  if (langToUse === '' && options.defaultLanguageForUnspecified !== undefined) {
		    langToUse = options.defaultLanguageForUnspecified;
		  }

		  let prismLang = loadPrismLang(langToUse);

		  if (prismLang === undefined && options.defaultLanguageForUnknown !== undefined) {
		    langToUse = options.defaultLanguageForUnknown;
		    prismLang = loadPrismLang(langToUse);
		  }

		  return [langToUse, prismLang];
		}
		/**
		 * Highlights the provided text using Prism.
		 *
		 * @param markdownit
		 *        The markdown-it instance.
		 * @param options
		 *        The options that have been used to initialise the plugin.
		 * @param text
		 *        The text to highlight.
		 * @param lang
		 *        Code of the language to highlight the text in.
		 * @return If Prism knows the language that {@link selectLanguage} returns for `lang`, the `text` highlighted for that language. Otherwise, `text`
		 *  html-escaped.
		 */


		function highlight(markdownit, options, text, lang) {
		  return highlightWithSelectedLanguage(markdownit, options, text, selectLanguage(options, lang));
		}
		/**
		 * Highlights the provided text using Prism.
		 *
		 * @param markdownit
		 *        The markdown-it instance.
		 * @param options
		 *        The options that have been used to initialise the plugin.
		 * @param text
		 *        The text to highlight.
		 * @param lang
		 *        The selected Prism language to use for highlighting.
		 * @return If Prism knows the language that {@link selectLanguage} returns for `lang`, the `text` highlighted for that language. Otherwise, `text`
		 *  html-escaped.
		 */


		function highlightWithSelectedLanguage(markdownit, options, text, [langToUse, prismLang]) {
		  return prismLang ? _prismjs.default.highlight(text, prismLang, langToUse) : markdownit.utils.escapeHtml(text);
		}
		/**
		 * Construct the class name for the provided `lang`.
		 *
		 * @param markdownit
		 *        The markdown-it instance.
		 * @param lang
		 *        The selected language.
		 * @return the class to use for `lang`.
		 */


		function languageClass(markdownit, lang) {
		  return markdownit.options.langPrefix + lang;
		}
		/**
		 * A {@link RuleCore} that searches for and extracts language specifications on inline code tokens.
		 */


		function inlineCodeLanguageRule(state) {
		  var _iterator = _createForOfIteratorHelper(state.tokens),
		      _step;

		  try {
		    for (_iterator.s(); !(_step = _iterator.n()).done;) {
		      const inlineToken = _step.value;

		      if (inlineToken.type === 'inline' && inlineToken.children !== null) {
		        var _iterator2 = _createForOfIteratorHelper(inlineToken.children.entries()),
		            _step2;

		        try {
		          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
		            const _step2$value = _slicedToArray(_step2.value, 2),
		                  index = _step2$value[0],
		                  token = _step2$value[1];

		            if (token.type === 'code_inline' && index + 1 < inlineToken.children.length) {
		              extractInlineCodeSpecifiedLanguage(token, inlineToken.children[index + 1]);
		            }
		          }
		        } catch (err) {
		          _iterator2.e(err);
		        } finally {
		          _iterator2.f();
		        }
		      }
		    }
		  } catch (err) {
		    _iterator.e(err);
		  } finally {
		    _iterator.f();
		  }
		}
		/**
		 * Searches for a language specification after an inline code token (e.g. ``{language=cpp}). If present, extracts the language, sets
		 * it on `inlineCodeToken`’s meta, and removes the specification.
		 *
		 * @param inlineCodeToken
		 *  The inline code token for which to extract the language.
		 * @param followingToken
		 *    The token immediately following the `inlineCodeToken`.
		 */


		function extractInlineCodeSpecifiedLanguage(inlineCodeToken, followingToken) {
		  const languageSpecificationMatch = followingToken.content.match(/^\{((?:[^\s}]+\s)*)language=([^\s}]+)((?:\s[^\s}]+)*)}/);

		  if (languageSpecificationMatch !== null) {
		    inlineCodeToken.meta = _objectSpread(_objectSpread({}, inlineCodeToken.meta), {}, {
		      [SPECIFIED_LANGUAGE_META_KEY]: languageSpecificationMatch[2]
		    });
		    followingToken.content = followingToken.content.slice(languageSpecificationMatch[0].length);

		    if (languageSpecificationMatch[1] || languageSpecificationMatch[3]) {
		      followingToken.content = `{${languageSpecificationMatch[1] || ''}${(languageSpecificationMatch[3] || ' ').slice(1)}}${followingToken.content}`;
		    }
		  }
		}
		/**
		 * Patch the `<pre>` and `<code>` tags produced by the `existingRule` for fenced code blocks.
		 *
		 * @param markdownit
		 *        The markdown-it instance.
		 * @param options
		 *        The options that have been used to initialise the plugin.
		 * @param existingRule
		 *        The previously configured render rule for fenced code blocks.
		 */


		function applyCodeAttributes(markdownit, options, existingRule) {
		  return (tokens, idx, renderOptions, env, self) => {
		    const fenceToken = tokens[idx];
		    const info = fenceToken.info ? markdownit.utils.unescapeAll(fenceToken.info).trim() : '';
		    const lang = info.split(/(\s+)/g)[0];

		    const _selectLanguage = selectLanguage(options, lang),
		          _selectLanguage2 = _slicedToArray(_selectLanguage, 1),
		          langToUse = _selectLanguage2[0];

		    if (!langToUse) {
		      return existingRule(tokens, idx, renderOptions, env, self);
		    } else {
		      fenceToken.info = langToUse;
		      const existingResult = existingRule(tokens, idx, renderOptions, env, self);
		      const langClass = languageClass(markdownit, markdownit.utils.escapeHtml(langToUse));
		      return existingResult.replace(/<((?:pre|code)[^>]*?)(?:\s+class="([^"]*)"([^>]*))?>/g, (match, tagStart, existingClasses, tagEnd) => existingClasses !== null && existingClasses !== void 0 && existingClasses.includes(langClass) ? match : `<${tagStart} class="${existingClasses ? `${existingClasses} ` : ''}${langClass}"${tagEnd || ''}>`);
		    }
		  };
		}
		/**
		 * Renders inline code tokens by highlighting them with Prism.
		 *
		 * @param markdownit
		 *        The markdown-it instance.
		 * @param options
		 *        The options that have been used to initialise the plugin.
		 * @param existingRule
		 *        The previously configured render rule for inline code.
		 */


		function renderInlineCode(markdownit, options, existingRule) {
		  return (tokens, idx, renderOptions, env, self) => {
		    const inlineCodeToken = tokens[idx];
		    const specifiedLanguage = inlineCodeToken.meta ? inlineCodeToken.meta[SPECIFIED_LANGUAGE_META_KEY] || '' : '';

		    const _selectLanguage3 = selectLanguage(options, specifiedLanguage),
		          _selectLanguage4 = _slicedToArray(_selectLanguage3, 2),
		          langToUse = _selectLanguage4[0],
		          prismLang = _selectLanguage4[1];

		    if (!langToUse) {
		      return existingRule(tokens, idx, renderOptions, env, self);
		    } else {
		      const highlighted = highlightWithSelectedLanguage(markdownit, options, inlineCodeToken.content, [langToUse, prismLang]);
		      inlineCodeToken.attrJoin('class', languageClass(markdownit, langToUse));
		      return `<code${self.renderAttrs(inlineCodeToken)}>${highlighted}</code>`;
		    }
		  };
		}
		/**
		 * Checks whether an option represents a valid Prism language
		 *
		 * @param options
		 *        The options that have been used to initialise the plugin.
		 * @param optionName
		 *        The key of the option inside {@code options} that shall be checked.
		 * @throws {Error} If the option is not set to a valid Prism language.
		 */


		function checkLanguageOption(options, optionName) {
		  const language = options[optionName];

		  if (language !== undefined && loadPrismLang(language) === undefined) {
		    throw new Error(`Bad option ${optionName}: There is no Prism language '${language}'.`);
		  }
		}
		/**
		 * ‘the most basic rule to render a token’ (https://github.com/markdown-it/markdown-it/blob/master/docs/examples/renderer_rules.md)
		 */


		function renderFallback(tokens, idx, options, env, self) {
		  return self.renderToken(tokens, idx, options);
		}
		/**
		 * Initialisation function of the plugin. This function is not called directly by clients, but is rather provided
		 * to MarkdownIt’s {@link MarkdownIt.use} function.
		 *
		 * @param markdownit
		 *        The markdown it instance the plugin is being registered to.
		 * @param useroptions
		 *        The options this plugin is being initialised with.
		 */


		function markdownItPrism(markdownit, useroptions) {
		  const options = Object.assign({}, DEFAULTS, useroptions);
		  checkLanguageOption(options, 'defaultLanguage');
		  checkLanguageOption(options, 'defaultLanguageForUnknown');
		  checkLanguageOption(options, 'defaultLanguageForUnspecified');
		  options.defaultLanguageForUnknown = options.defaultLanguageForUnknown || options.defaultLanguage;
		  options.defaultLanguageForUnspecified = options.defaultLanguageForUnspecified || options.defaultLanguage;
		  options.plugins.forEach(loadPrismPlugin);
		  options.init(_prismjs.default); // register ourselves as highlighter

		  markdownit.options.highlight = (text, lang) => highlight(markdownit, options, text, lang);

		  markdownit.renderer.rules.fence = applyCodeAttributes(markdownit, options, markdownit.renderer.rules.fence || renderFallback);

		  if (options.highlightInlineCode) {
		    markdownit.core.ruler.after('inline', 'prism_inline_code_language', inlineCodeLanguageRule);
		    markdownit.renderer.rules.code_inline = renderInlineCode(markdownit, options, markdownit.renderer.rules.code_inline || renderFallback);
		  }
		}

		module.exports = exports.default;
		module.exports.default = exports.default;
} (build, buildExports$1));
	return buildExports$1;
}

var buildExports = requireBuild();
var prism = /*@__PURE__*/getDefaultExportFromCjs(buildExports);

var prismTypescript = {};

var hasRequiredPrismTypescript;

function requirePrismTypescript () {
	if (hasRequiredPrismTypescript) return prismTypescript;
	hasRequiredPrismTypescript = 1;
	(function (Prism) {

		Prism.languages.typescript = Prism.languages.extend('javascript', {
			'class-name': {
				pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
				lookbehind: true,
				greedy: true,
				inside: null // see below
			},
			'builtin': /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
		});

		// The keywords TypeScript adds to JavaScript
		Prism.languages.typescript.keyword.push(
			/\b(?:abstract|declare|is|keyof|readonly|require)\b/,
			// keywords that have to be followed by an identifier
			/\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
			// This is for `import type *, {}`
			/\btype\b(?=\s*(?:[\{*]|$))/
		);

		// doesn't work with TS because TS is too complex
		delete Prism.languages.typescript['parameter'];
		delete Prism.languages.typescript['literal-property'];

		// a version of typescript specifically for highlighting types
		var typeInside = Prism.languages.extend('typescript', {});
		delete typeInside['class-name'];

		Prism.languages.typescript['class-name'].inside = typeInside;

		Prism.languages.insertBefore('typescript', 'function', {
			'decorator': {
				pattern: /@[$\w\xA0-\uFFFF]+/,
				inside: {
					'at': {
						pattern: /^@/,
						alias: 'operator'
					},
					'function': /^[\s\S]+/
				}
			},
			'generic-function': {
				// e.g. foo<T extends "bar" | "baz">( ...
				pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
				greedy: true,
				inside: {
					'function': /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
					'generic': {
						pattern: /<[\s\S]+/, // everything after the first <
						alias: 'class-name',
						inside: typeInside
					}
				}
			}
		});

		Prism.languages.ts = Prism.languages.typescript;

	}(Prism));
	return prismTypescript;
}

requirePrismTypescript();

(function (Prism) {

	var javascript = Prism.util.clone(Prism.languages.javascript);

	var space = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source;
	var braces = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source;
	var spread = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;

	/**
	 * @param {string} source
	 * @param {string} [flags]
	 */
	function re(source, flags) {
		source = source
			.replace(/<S>/g, function () { return space; })
			.replace(/<BRACES>/g, function () { return braces; })
			.replace(/<SPREAD>/g, function () { return spread; });
		return RegExp(source, flags);
	}

	spread = re(spread).source;


	Prism.languages.jsx = Prism.languages.extend('markup', javascript);
	Prism.languages.jsx.tag.pattern = re(
		/<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.source
	);

	Prism.languages.jsx.tag.inside['tag'].pattern = /^<\/?[^\s>\/]*/;
	Prism.languages.jsx.tag.inside['attr-value'].pattern = /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/;
	Prism.languages.jsx.tag.inside['tag'].inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;
	Prism.languages.jsx.tag.inside['comment'] = javascript['comment'];

	Prism.languages.insertBefore('inside', 'attr-name', {
		'spread': {
			pattern: re(/<SPREAD>/.source),
			inside: Prism.languages.jsx
		}
	}, Prism.languages.jsx.tag);

	Prism.languages.insertBefore('inside', 'special-attr', {
		'script': {
			// Allow for two levels of nesting
			pattern: re(/=<BRACES>/.source),
			alias: 'language-javascript',
			inside: {
				'script-punctuation': {
					pattern: /^=(?=\{)/,
					alias: 'punctuation'
				},
				rest: Prism.languages.jsx
			},
		}
	}, Prism.languages.jsx.tag);

	// The following will handle plain text inside tags
	var stringifyToken = function (token) {
		if (!token) {
			return '';
		}
		if (typeof token === 'string') {
			return token;
		}
		if (typeof token.content === 'string') {
			return token.content;
		}
		return token.content.map(stringifyToken).join('');
	};

	var walkTokens = function (tokens) {
		var openedTags = [];
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			var notTagNorBrace = false;

			if (typeof token !== 'string') {
				if (token.type === 'tag' && token.content[0] && token.content[0].type === 'tag') {
					// We found a tag, now find its kind

					if (token.content[0].content[0].content === '</') {
						// Closing tag
						if (openedTags.length > 0 && openedTags[openedTags.length - 1].tagName === stringifyToken(token.content[0].content[1])) {
							// Pop matching opening tag
							openedTags.pop();
						}
					} else {
						if (token.content[token.content.length - 1].content === '/>') ; else {
							// Opening tag
							openedTags.push({
								tagName: stringifyToken(token.content[0].content[1]),
								openedBraces: 0
							});
						}
					}
				} else if (openedTags.length > 0 && token.type === 'punctuation' && token.content === '{') {

					// Here we might have entered a JSX context inside a tag
					openedTags[openedTags.length - 1].openedBraces++;

				} else if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces > 0 && token.type === 'punctuation' && token.content === '}') {

					// Here we might have left a JSX context inside a tag
					openedTags[openedTags.length - 1].openedBraces--;

				} else {
					notTagNorBrace = true;
				}
			}
			if (notTagNorBrace || typeof token === 'string') {
				if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
					// Here we are inside a tag, and not inside a JSX context.
					// That's plain text: drop any tokens matched.
					var plainText = stringifyToken(token);

					// And merge text with adjacent text
					if (i < tokens.length - 1 && (typeof tokens[i + 1] === 'string' || tokens[i + 1].type === 'plain-text')) {
						plainText += stringifyToken(tokens[i + 1]);
						tokens.splice(i + 1, 1);
					}
					if (i > 0 && (typeof tokens[i - 1] === 'string' || tokens[i - 1].type === 'plain-text')) {
						plainText = stringifyToken(tokens[i - 1]) + plainText;
						tokens.splice(i - 1, 1);
						i--;
					}

					tokens[i] = new Prism.Token('plain-text', plainText, null, plainText);
				}
			}

			if (token.content && typeof token.content !== 'string') {
				walkTokens(token.content);
			}
		}
	};

	Prism.hooks.add('after-tokenize', function (env) {
		if (env.language !== 'jsx' && env.language !== 'tsx') {
			return;
		}
		walkTokens(env.tokens);
	});

}(Prism));

// https://www.json.org/json-en.html
Prism.languages.json = {
	'property': {
		pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
		lookbehind: true,
		greedy: true
	},
	'string': {
		pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
		lookbehind: true,
		greedy: true
	},
	'comment': {
		pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
		greedy: true
	},
	'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
	'punctuation': /[{}[\],]/,
	'operator': /:/,
	'boolean': /\b(?:false|true)\b/,
	'null': {
		pattern: /\bnull\b/,
		alias: 'keyword'
	}
};

Prism.languages.webmanifest = Prism.languages.json;

var isArguments;
var hasRequiredIsArguments;

function requireIsArguments () {
	if (hasRequiredIsArguments) return isArguments;
	hasRequiredIsArguments = 1;

	var toStr = Object.prototype.toString;

	isArguments = function isArguments(value) {
		var str = toStr.call(value);
		var isArgs = str === '[object Arguments]';
		if (!isArgs) {
			isArgs = str !== '[object Array]' &&
				value !== null &&
				typeof value === 'object' &&
				typeof value.length === 'number' &&
				value.length >= 0 &&
				toStr.call(value.callee) === '[object Function]';
		}
		return isArgs;
	};
	return isArguments;
}

var implementation$2;
var hasRequiredImplementation$2;

function requireImplementation$2 () {
	if (hasRequiredImplementation$2) return implementation$2;
	hasRequiredImplementation$2 = 1;

	var keysShim;
	if (!Object.keys) {
		// modified from https://github.com/es-shims/es5-shim
		var has = Object.prototype.hasOwnProperty;
		var toStr = Object.prototype.toString;
		var isArgs = requireIsArguments(); // eslint-disable-line global-require
		var isEnumerable = Object.prototype.propertyIsEnumerable;
		var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
		var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
		var dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		];
		var equalsConstructorPrototype = function (o) {
			var ctor = o.constructor;
			return ctor && ctor.prototype === o;
		};
		var excludedKeys = {
			$applicationCache: true,
			$console: true,
			$external: true,
			$frame: true,
			$frameElement: true,
			$frames: true,
			$innerHeight: true,
			$innerWidth: true,
			$onmozfullscreenchange: true,
			$onmozfullscreenerror: true,
			$outerHeight: true,
			$outerWidth: true,
			$pageXOffset: true,
			$pageYOffset: true,
			$parent: true,
			$scrollLeft: true,
			$scrollTop: true,
			$scrollX: true,
			$scrollY: true,
			$self: true,
			$webkitIndexedDB: true,
			$webkitStorageInfo: true,
			$window: true
		};
		var hasAutomationEqualityBug = (function () {
			/* global window */
			if (typeof window === 'undefined') { return false; }
			for (var k in window) {
				try {
					if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
						try {
							equalsConstructorPrototype(window[k]);
						} catch (e) {
							return true;
						}
					}
				} catch (e) {
					return true;
				}
			}
			return false;
		}());
		var equalsConstructorPrototypeIfNotBuggy = function (o) {
			/* global window */
			if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
				return equalsConstructorPrototype(o);
			}
			try {
				return equalsConstructorPrototype(o);
			} catch (e) {
				return false;
			}
		};

		keysShim = function keys(object) {
			var isObject = object !== null && typeof object === 'object';
			var isFunction = toStr.call(object) === '[object Function]';
			var isArguments = isArgs(object);
			var isString = isObject && toStr.call(object) === '[object String]';
			var theKeys = [];

			if (!isObject && !isFunction && !isArguments) {
				throw new TypeError('Object.keys called on a non-object');
			}

			var skipProto = hasProtoEnumBug && isFunction;
			if (isString && object.length > 0 && !has.call(object, 0)) {
				for (var i = 0; i < object.length; ++i) {
					theKeys.push(String(i));
				}
			}

			if (isArguments && object.length > 0) {
				for (var j = 0; j < object.length; ++j) {
					theKeys.push(String(j));
				}
			} else {
				for (var name in object) {
					if (!(skipProto && name === 'prototype') && has.call(object, name)) {
						theKeys.push(String(name));
					}
				}
			}

			if (hasDontEnumBug) {
				var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

				for (var k = 0; k < dontEnums.length; ++k) {
					if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
						theKeys.push(dontEnums[k]);
					}
				}
			}
			return theKeys;
		};
	}
	implementation$2 = keysShim;
	return implementation$2;
}

var objectKeys;
var hasRequiredObjectKeys;

function requireObjectKeys () {
	if (hasRequiredObjectKeys) return objectKeys;
	hasRequiredObjectKeys = 1;

	var slice = Array.prototype.slice;
	var isArgs = requireIsArguments();

	var origKeys = Object.keys;
	var keysShim = origKeys ? function keys(o) { return origKeys(o); } : requireImplementation$2();

	var originalKeys = Object.keys;

	keysShim.shim = function shimObjectKeys() {
		if (Object.keys) {
			var keysWorksWithArguments = (function () {
				// Safari 5.0 bug
				var args = Object.keys(arguments);
				return args && args.length === arguments.length;
			}(1, 2));
			if (!keysWorksWithArguments) {
				Object.keys = function keys(object) { // eslint-disable-line func-name-matching
					if (isArgs(object)) {
						return originalKeys(slice.call(object));
					}
					return originalKeys(object);
				};
			}
		} else {
			Object.keys = keysShim;
		}
		return Object.keys || keysShim;
	};

	objectKeys = keysShim;
	return objectKeys;
}

var shams;
var hasRequiredShams;

function requireShams () {
	if (hasRequiredShams) return shams;
	hasRequiredShams = 1;

	/* eslint complexity: [2, 18], max-statements: [2, 33] */
	shams = function hasSymbols() {
		if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
		if (typeof Symbol.iterator === 'symbol') { return true; }

		var obj = {};
		var sym = Symbol('test');
		var symObj = Object(sym);
		if (typeof sym === 'string') { return false; }

		if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
		if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

		// temp disabled per https://github.com/ljharb/object.assign/issues/17
		// if (sym instanceof Symbol) { return false; }
		// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
		// if (!(symObj instanceof Symbol)) { return false; }

		// if (typeof Symbol.prototype.toString !== 'function') { return false; }
		// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

		var symVal = 42;
		obj[sym] = symVal;
		for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
		if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

		if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

		var syms = Object.getOwnPropertySymbols(obj);
		if (syms.length !== 1 || syms[0] !== sym) { return false; }

		if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

		if (typeof Object.getOwnPropertyDescriptor === 'function') {
			var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
			if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
		}

		return true;
	};
	return shams;
}

var hasSymbols;
var hasRequiredHasSymbols;

function requireHasSymbols () {
	if (hasRequiredHasSymbols) return hasSymbols;
	hasRequiredHasSymbols = 1;

	var origSymbol = typeof Symbol !== 'undefined' && Symbol;
	var hasSymbolSham = requireShams();

	hasSymbols = function hasNativeSymbols() {
		if (typeof origSymbol !== 'function') { return false; }
		if (typeof Symbol !== 'function') { return false; }
		if (typeof origSymbol('foo') !== 'symbol') { return false; }
		if (typeof Symbol('bar') !== 'symbol') { return false; }

		return hasSymbolSham();
	};
	return hasSymbols;
}

var implementation$1;
var hasRequiredImplementation$1;

function requireImplementation$1 () {
	if (hasRequiredImplementation$1) return implementation$1;
	hasRequiredImplementation$1 = 1;

	/* eslint no-invalid-this: 1 */

	var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
	var slice = Array.prototype.slice;
	var toStr = Object.prototype.toString;
	var funcType = '[object Function]';

	implementation$1 = function bind(that) {
	    var target = this;
	    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
	        throw new TypeError(ERROR_MESSAGE + target);
	    }
	    var args = slice.call(arguments, 1);

	    var bound;
	    var binder = function () {
	        if (this instanceof bound) {
	            var result = target.apply(
	                this,
	                args.concat(slice.call(arguments))
	            );
	            if (Object(result) === result) {
	                return result;
	            }
	            return this;
	        } else {
	            return target.apply(
	                that,
	                args.concat(slice.call(arguments))
	            );
	        }
	    };

	    var boundLength = Math.max(0, target.length - args.length);
	    var boundArgs = [];
	    for (var i = 0; i < boundLength; i++) {
	        boundArgs.push('$' + i);
	    }

	    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

	    if (target.prototype) {
	        var Empty = function Empty() {};
	        Empty.prototype = target.prototype;
	        bound.prototype = new Empty();
	        Empty.prototype = null;
	    }

	    return bound;
	};
	return implementation$1;
}

var functionBind;
var hasRequiredFunctionBind;

function requireFunctionBind () {
	if (hasRequiredFunctionBind) return functionBind;
	hasRequiredFunctionBind = 1;

	var implementation = requireImplementation$1();

	functionBind = Function.prototype.bind || implementation;
	return functionBind;
}

var src;
var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src;
	hasRequiredSrc = 1;

	var bind = requireFunctionBind();

	src = bind.call(Function.call, Object.prototype.hasOwnProperty);
	return src;
}

var getIntrinsic;
var hasRequiredGetIntrinsic;

function requireGetIntrinsic () {
	if (hasRequiredGetIntrinsic) return getIntrinsic;
	hasRequiredGetIntrinsic = 1;

	var undefined$1;

	var $SyntaxError = SyntaxError;
	var $Function = Function;
	var $TypeError = TypeError;

	// eslint-disable-next-line consistent-return
	var getEvalledConstructor = function (expressionSyntax) {
		try {
			return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
		} catch (e) {}
	};

	var $gOPD = Object.getOwnPropertyDescriptor;
	if ($gOPD) {
		try {
			$gOPD({}, '');
		} catch (e) {
			$gOPD = null; // this is IE 8, which has a broken gOPD
		}
	}

	var throwTypeError = function () {
		throw new $TypeError();
	};
	var ThrowTypeError = $gOPD
		? (function () {
			try {
				// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
				arguments.callee; // IE 8 does not throw here
				return throwTypeError;
			} catch (calleeThrows) {
				try {
					// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
					return $gOPD(arguments, 'callee').get;
				} catch (gOPDthrows) {
					return throwTypeError;
				}
			}
		}())
		: throwTypeError;

	var hasSymbols = requireHasSymbols()();

	var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

	var needsEval = {};

	var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

	var INTRINSICS = {
		'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
		'%Array%': Array,
		'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
		'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined$1,
		'%AsyncFromSyncIteratorPrototype%': undefined$1,
		'%AsyncFunction%': needsEval,
		'%AsyncGenerator%': needsEval,
		'%AsyncGeneratorFunction%': needsEval,
		'%AsyncIteratorPrototype%': needsEval,
		'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
		'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
		'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
		'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
		'%Boolean%': Boolean,
		'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
		'%Date%': Date,
		'%decodeURI%': decodeURI,
		'%decodeURIComponent%': decodeURIComponent,
		'%encodeURI%': encodeURI,
		'%encodeURIComponent%': encodeURIComponent,
		'%Error%': Error,
		'%eval%': eval, // eslint-disable-line no-eval
		'%EvalError%': EvalError,
		'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
		'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
		'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
		'%Function%': $Function,
		'%GeneratorFunction%': needsEval,
		'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
		'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
		'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
		'%isFinite%': isFinite,
		'%isNaN%': isNaN,
		'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
		'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
		'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
		'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
		'%Math%': Math,
		'%Number%': Number,
		'%Object%': Object,
		'%parseFloat%': parseFloat,
		'%parseInt%': parseInt,
		'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
		'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
		'%RangeError%': RangeError,
		'%ReferenceError%': ReferenceError,
		'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
		'%RegExp%': RegExp,
		'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
		'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
		'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
		'%String%': String,
		'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined$1,
		'%Symbol%': hasSymbols ? Symbol : undefined$1,
		'%SyntaxError%': $SyntaxError,
		'%ThrowTypeError%': ThrowTypeError,
		'%TypedArray%': TypedArray,
		'%TypeError%': $TypeError,
		'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
		'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
		'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
		'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
		'%URIError%': URIError,
		'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
		'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
		'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
	};

	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}

	var doEval = function doEval(name) {
		var value;
		if (name === '%AsyncFunction%') {
			value = getEvalledConstructor('async function () {}');
		} else if (name === '%GeneratorFunction%') {
			value = getEvalledConstructor('function* () {}');
		} else if (name === '%AsyncGeneratorFunction%') {
			value = getEvalledConstructor('async function* () {}');
		} else if (name === '%AsyncGenerator%') {
			var fn = doEval('%AsyncGeneratorFunction%');
			if (fn) {
				value = fn.prototype;
			}
		} else if (name === '%AsyncIteratorPrototype%') {
			var gen = doEval('%AsyncGenerator%');
			if (gen) {
				value = getProto(gen.prototype);
			}
		}

		INTRINSICS[name] = value;

		return value;
	};

	var LEGACY_ALIASES = {
		'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
		'%ArrayPrototype%': ['Array', 'prototype'],
		'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
		'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
		'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
		'%ArrayProto_values%': ['Array', 'prototype', 'values'],
		'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
		'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
		'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
		'%BooleanPrototype%': ['Boolean', 'prototype'],
		'%DataViewPrototype%': ['DataView', 'prototype'],
		'%DatePrototype%': ['Date', 'prototype'],
		'%ErrorPrototype%': ['Error', 'prototype'],
		'%EvalErrorPrototype%': ['EvalError', 'prototype'],
		'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
		'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
		'%FunctionPrototype%': ['Function', 'prototype'],
		'%Generator%': ['GeneratorFunction', 'prototype'],
		'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
		'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
		'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
		'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
		'%JSONParse%': ['JSON', 'parse'],
		'%JSONStringify%': ['JSON', 'stringify'],
		'%MapPrototype%': ['Map', 'prototype'],
		'%NumberPrototype%': ['Number', 'prototype'],
		'%ObjectPrototype%': ['Object', 'prototype'],
		'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
		'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
		'%PromisePrototype%': ['Promise', 'prototype'],
		'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
		'%Promise_all%': ['Promise', 'all'],
		'%Promise_reject%': ['Promise', 'reject'],
		'%Promise_resolve%': ['Promise', 'resolve'],
		'%RangeErrorPrototype%': ['RangeError', 'prototype'],
		'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
		'%RegExpPrototype%': ['RegExp', 'prototype'],
		'%SetPrototype%': ['Set', 'prototype'],
		'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
		'%StringPrototype%': ['String', 'prototype'],
		'%SymbolPrototype%': ['Symbol', 'prototype'],
		'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
		'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
		'%TypeErrorPrototype%': ['TypeError', 'prototype'],
		'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
		'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
		'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
		'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
		'%URIErrorPrototype%': ['URIError', 'prototype'],
		'%WeakMapPrototype%': ['WeakMap', 'prototype'],
		'%WeakSetPrototype%': ['WeakSet', 'prototype']
	};

	var bind = requireFunctionBind();
	var hasOwn = requireSrc();
	var $concat = bind.call(Function.call, Array.prototype.concat);
	var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
	var $replace = bind.call(Function.call, String.prototype.replace);
	var $strSlice = bind.call(Function.call, String.prototype.slice);
	var $exec = bind.call(Function.call, RegExp.prototype.exec);

	/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
	var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
	var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
	var stringToPath = function stringToPath(string) {
		var first = $strSlice(string, 0, 1);
		var last = $strSlice(string, -1);
		if (first === '%' && last !== '%') {
			throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
		} else if (last === '%' && first !== '%') {
			throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
		}
		var result = [];
		$replace(string, rePropName, function (match, number, quote, subString) {
			result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
		});
		return result;
	};
	/* end adaptation */

	var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
		var intrinsicName = name;
		var alias;
		if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
			alias = LEGACY_ALIASES[intrinsicName];
			intrinsicName = '%' + alias[0] + '%';
		}

		if (hasOwn(INTRINSICS, intrinsicName)) {
			var value = INTRINSICS[intrinsicName];
			if (value === needsEval) {
				value = doEval(intrinsicName);
			}
			if (typeof value === 'undefined' && !allowMissing) {
				throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
			}

			return {
				alias: alias,
				name: intrinsicName,
				value: value
			};
		}

		throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
	};

	getIntrinsic = function GetIntrinsic(name, allowMissing) {
		if (typeof name !== 'string' || name.length === 0) {
			throw new $TypeError('intrinsic name must be a non-empty string');
		}
		if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
			throw new $TypeError('"allowMissing" argument must be a boolean');
		}

		if ($exec(/^%?[^%]*%?$/, name) === null) {
			throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
		}
		var parts = stringToPath(name);
		var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

		var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
		var intrinsicRealName = intrinsic.name;
		var value = intrinsic.value;
		var skipFurtherCaching = false;

		var alias = intrinsic.alias;
		if (alias) {
			intrinsicBaseName = alias[0];
			$spliceApply(parts, $concat([0, 1], alias));
		}

		for (var i = 1, isOwn = true; i < parts.length; i += 1) {
			var part = parts[i];
			var first = $strSlice(part, 0, 1);
			var last = $strSlice(part, -1);
			if (
				(
					(first === '"' || first === "'" || first === '`')
					|| (last === '"' || last === "'" || last === '`')
				)
				&& first !== last
			) {
				throw new $SyntaxError('property names with quotes must have matching quotes');
			}
			if (part === 'constructor' || !isOwn) {
				skipFurtherCaching = true;
			}

			intrinsicBaseName += '.' + part;
			intrinsicRealName = '%' + intrinsicBaseName + '%';

			if (hasOwn(INTRINSICS, intrinsicRealName)) {
				value = INTRINSICS[intrinsicRealName];
			} else if (value != null) {
				if (!(part in value)) {
					if (!allowMissing) {
						throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
					}
					return void undefined$1;
				}
				if ($gOPD && (i + 1) >= parts.length) {
					var desc = $gOPD(value, part);
					isOwn = !!desc;

					// By convention, when a data property is converted to an accessor
					// property to emulate a data property that does not suffer from
					// the override mistake, that accessor's getter is marked with
					// an `originalValue` property. Here, when we detect this, we
					// uphold the illusion by pretending to see that original data
					// property, i.e., returning the value rather than the getter
					// itself.
					if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
						value = desc.get;
					} else {
						value = value[part];
					}
				} else {
					isOwn = hasOwn(value, part);
					value = value[part];
				}

				if (isOwn && !skipFurtherCaching) {
					INTRINSICS[intrinsicRealName] = value;
				}
			}
		}
		return value;
	};
	return getIntrinsic;
}

var hasPropertyDescriptors_1;
var hasRequiredHasPropertyDescriptors;

function requireHasPropertyDescriptors () {
	if (hasRequiredHasPropertyDescriptors) return hasPropertyDescriptors_1;
	hasRequiredHasPropertyDescriptors = 1;

	var GetIntrinsic = requireGetIntrinsic();

	var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

	var hasPropertyDescriptors = function hasPropertyDescriptors() {
		if ($defineProperty) {
			try {
				$defineProperty({}, 'a', { value: 1 });
				return true;
			} catch (e) {
				// IE 8 has a broken defineProperty
				return false;
			}
		}
		return false;
	};

	hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
		// node v0.6 has a bug where array lengths can be Set but not Defined
		if (!hasPropertyDescriptors()) {
			return null;
		}
		try {
			return $defineProperty([], 'length', { value: 1 }).length !== 1;
		} catch (e) {
			// In Firefox 4-22, defining length on an array throws an exception.
			return true;
		}
	};

	hasPropertyDescriptors_1 = hasPropertyDescriptors;
	return hasPropertyDescriptors_1;
}

var defineProperties_1;
var hasRequiredDefineProperties;

function requireDefineProperties () {
	if (hasRequiredDefineProperties) return defineProperties_1;
	hasRequiredDefineProperties = 1;

	var keys = requireObjectKeys();
	var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

	var toStr = Object.prototype.toString;
	var concat = Array.prototype.concat;
	var origDefineProperty = Object.defineProperty;

	var isFunction = function (fn) {
		return typeof fn === 'function' && toStr.call(fn) === '[object Function]';
	};

	var hasPropertyDescriptors = requireHasPropertyDescriptors()();

	var supportsDescriptors = origDefineProperty && hasPropertyDescriptors;

	var defineProperty = function (object, name, value, predicate) {
		if (name in object) {
			if (predicate === true) {
				if (object[name] === value) {
					return;
				}
			} else if (!isFunction(predicate) || !predicate()) {
				return;
			}
		}
		if (supportsDescriptors) {
			origDefineProperty(object, name, {
				configurable: true,
				enumerable: false,
				value: value,
				writable: true
			});
		} else {
			object[name] = value; // eslint-disable-line no-param-reassign
		}
	};

	var defineProperties = function (object, map) {
		var predicates = arguments.length > 2 ? arguments[2] : {};
		var props = keys(map);
		if (hasSymbols) {
			props = concat.call(props, Object.getOwnPropertySymbols(map));
		}
		for (var i = 0; i < props.length; i += 1) {
			defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
		}
	};

	defineProperties.supportsDescriptors = !!supportsDescriptors;

	defineProperties_1 = defineProperties;
	return defineProperties_1;
}

var callBindExports = {};
var callBind = {
  get exports(){ return callBindExports; },
  set exports(v){ callBindExports = v; },
};

var hasRequiredCallBind;

function requireCallBind () {
	if (hasRequiredCallBind) return callBindExports;
	hasRequiredCallBind = 1;
	(function (module) {

		var bind = requireFunctionBind();
		var GetIntrinsic = requireGetIntrinsic();

		var $apply = GetIntrinsic('%Function.prototype.apply%');
		var $call = GetIntrinsic('%Function.prototype.call%');
		var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

		var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
		var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
		var $max = GetIntrinsic('%Math.max%');

		if ($defineProperty) {
			try {
				$defineProperty({}, 'a', { value: 1 });
			} catch (e) {
				// IE 8 has a broken defineProperty
				$defineProperty = null;
			}
		}

		module.exports = function callBind(originalFunction) {
			var func = $reflectApply(bind, $call, arguments);
			if ($gOPD && $defineProperty) {
				var desc = $gOPD(func, 'length');
				if (desc.configurable) {
					// original length, plus the receiver, minus any additional arguments (after the receiver)
					$defineProperty(
						func,
						'length',
						{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
					);
				}
			}
			return func;
		};

		var applyBind = function applyBind() {
			return $reflectApply(bind, $apply, arguments);
		};

		if ($defineProperty) {
			$defineProperty(module.exports, 'apply', { value: applyBind });
		} else {
			module.exports.apply = applyBind;
		}
} (callBind));
	return callBindExports;
}

var RequireObjectCoercibleExports = {};
var RequireObjectCoercible = {
  get exports(){ return RequireObjectCoercibleExports; },
  set exports(v){ RequireObjectCoercibleExports = v; },
};

var CheckObjectCoercible;
var hasRequiredCheckObjectCoercible;

function requireCheckObjectCoercible () {
	if (hasRequiredCheckObjectCoercible) return CheckObjectCoercible;
	hasRequiredCheckObjectCoercible = 1;

	var GetIntrinsic = requireGetIntrinsic();

	var $TypeError = GetIntrinsic('%TypeError%');

	// http://262.ecma-international.org/5.1/#sec-9.10

	CheckObjectCoercible = function CheckObjectCoercible(value, optMessage) {
		if (value == null) {
			throw new $TypeError(optMessage || ('Cannot call method on ' + value));
		}
		return value;
	};
	return CheckObjectCoercible;
}

var hasRequiredRequireObjectCoercible;

function requireRequireObjectCoercible () {
	if (hasRequiredRequireObjectCoercible) return RequireObjectCoercibleExports;
	hasRequiredRequireObjectCoercible = 1;
	(function (module) {

		module.exports = requireCheckObjectCoercible();
} (RequireObjectCoercible));
	return RequireObjectCoercibleExports;
}

var callBound;
var hasRequiredCallBound;

function requireCallBound () {
	if (hasRequiredCallBound) return callBound;
	hasRequiredCallBound = 1;

	var GetIntrinsic = requireGetIntrinsic();

	var callBind = requireCallBind();

	var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

	callBound = function callBoundIntrinsic(name, allowMissing) {
		var intrinsic = GetIntrinsic(name, !!allowMissing);
		if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
			return callBind(intrinsic);
		}
		return intrinsic;
	};
	return callBound;
}

var implementation;
var hasRequiredImplementation;

function requireImplementation () {
	if (hasRequiredImplementation) return implementation;
	hasRequiredImplementation = 1;

	var RequireObjectCoercible = requireRequireObjectCoercible();
	var callBound = requireCallBound();
	var $isEnumerable = callBound('Object.prototype.propertyIsEnumerable');
	var $push = callBound('Array.prototype.push');

	implementation = function entries(O) {
		var obj = RequireObjectCoercible(O);
		var entrys = [];
		for (var key in obj) {
			if ($isEnumerable(obj, key)) { // checks own-ness as well
				$push(entrys, [key, obj[key]]);
			}
		}
		return entrys;
	};
	return implementation;
}

var polyfill;
var hasRequiredPolyfill;

function requirePolyfill () {
	if (hasRequiredPolyfill) return polyfill;
	hasRequiredPolyfill = 1;

	var implementation = requireImplementation();

	polyfill = function getPolyfill() {
		return typeof Object.entries === 'function' ? Object.entries : implementation;
	};
	return polyfill;
}

var shim;
var hasRequiredShim;

function requireShim () {
	if (hasRequiredShim) return shim;
	hasRequiredShim = 1;

	var getPolyfill = requirePolyfill();
	var define = requireDefineProperties();

	shim = function shimEntries() {
		var polyfill = getPolyfill();
		define(Object, { entries: polyfill }, {
			entries: function testEntries() {
				return Object.entries !== polyfill;
			}
		});
		return polyfill;
	};
	return shim;
}

var object_entries;
var hasRequiredObject_entries;

function requireObject_entries () {
	if (hasRequiredObject_entries) return object_entries;
	hasRequiredObject_entries = 1;

	var define = requireDefineProperties();
	var callBind = requireCallBind();

	var implementation = requireImplementation();
	var getPolyfill = requirePolyfill();
	var shim = requireShim();

	var polyfill = callBind(getPolyfill(), Object);

	define(polyfill, {
		getPolyfill: getPolyfill,
		implementation: implementation,
		shim: shim
	});

	object_entries = polyfill;
	return object_entries;
}

var object_entriesExports = requireObject_entries();
var entries = /*@__PURE__*/getDefaultExportFromCjs(object_entriesExports);

var csscolorparser = {};

var hasRequiredCsscolorparser;

function requireCsscolorparser () {
	if (hasRequiredCsscolorparser) return csscolorparser;
	hasRequiredCsscolorparser = 1;
	// (c) Dean McNamee <dean@gmail.com>, 2012.
	//
	// https://github.com/deanm/css-color-parser-js
	//
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the "Software"), to
	// deal in the Software without restriction, including without limitation the
	// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	// sell copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	//
	// The above copyright notice and this permission notice shall be included in
	// all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
	// IN THE SOFTWARE.

	// http://www.w3.org/TR/css3-color/
	var kCSSColorTable = {
	  "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
	  "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
	  "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
	  "beige": [245,245,220,1], "bisque": [255,228,196,1],
	  "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
	  "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
	  "brown": [165,42,42,1], "burlywood": [222,184,135,1],
	  "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
	  "chocolate": [210,105,30,1], "coral": [255,127,80,1],
	  "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
	  "crimson": [220,20,60,1], "cyan": [0,255,255,1],
	  "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
	  "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
	  "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
	  "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
	  "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
	  "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
	  "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
	  "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
	  "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
	  "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
	  "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
	  "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
	  "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
	  "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
	  "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
	  "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
	  "gray": [128,128,128,1], "green": [0,128,0,1],
	  "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
	  "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
	  "indianred": [205,92,92,1], "indigo": [75,0,130,1],
	  "ivory": [255,255,240,1], "khaki": [240,230,140,1],
	  "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
	  "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
	  "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
	  "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
	  "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
	  "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
	  "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
	  "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
	  "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
	  "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
	  "limegreen": [50,205,50,1], "linen": [250,240,230,1],
	  "magenta": [255,0,255,1], "maroon": [128,0,0,1],
	  "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
	  "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
	  "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
	  "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
	  "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
	  "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
	  "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
	  "navy": [0,0,128,1], "oldlace": [253,245,230,1],
	  "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
	  "orange": [255,165,0,1], "orangered": [255,69,0,1],
	  "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
	  "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
	  "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
	  "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
	  "pink": [255,192,203,1], "plum": [221,160,221,1],
	  "powderblue": [176,224,230,1], "purple": [128,0,128,1],
	  "rebeccapurple": [102,51,153,1],
	  "red": [255,0,0,1], "rosybrown": [188,143,143,1],
	  "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
	  "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
	  "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
	  "sienna": [160,82,45,1], "silver": [192,192,192,1],
	  "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
	  "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
	  "snow": [255,250,250,1], "springgreen": [0,255,127,1],
	  "steelblue": [70,130,180,1], "tan": [210,180,140,1],
	  "teal": [0,128,128,1], "thistle": [216,191,216,1],
	  "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
	  "violet": [238,130,238,1], "wheat": [245,222,179,1],
	  "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
	  "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]};

	function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
	  i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
	  return i < 0 ? 0 : i > 255 ? 255 : i;
	}

	function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
	  return f < 0 ? 0 : f > 1 ? 1 : f;
	}

	function parse_css_int(str) {  // int or percentage.
	  if (str[str.length - 1] === '%')
	    return clamp_css_byte(parseFloat(str) / 100 * 255);
	  return clamp_css_byte(parseInt(str));
	}

	function parse_css_float(str) {  // float or percentage.
	  if (str[str.length - 1] === '%')
	    return clamp_css_float(parseFloat(str) / 100);
	  return clamp_css_float(parseFloat(str));
	}

	function css_hue_to_rgb(m1, m2, h) {
	  if (h < 0) h += 1;
	  else if (h > 1) h -= 1;

	  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
	  if (h * 2 < 1) return m2;
	  if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
	  return m1;
	}

	function parseCSSColor(css_str) {
	  // Remove all whitespace, not compliant, but should just be more accepting.
	  var str = css_str.replace(/ /g, '').toLowerCase();

	  // Color keywords (and transparent) lookup.
	  if (str in kCSSColorTable) return kCSSColorTable[str].slice();  // dup.

	  // #abc and #abc123 syntax.
	  if (str[0] === '#') {
	    if (str.length === 4) {
	      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
	      if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
	      return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
	              (iv & 0xf0) | ((iv & 0xf0) >> 4),
	              (iv & 0xf) | ((iv & 0xf) << 4),
	              1];
	    } else if (str.length === 7) {
	      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
	      if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
	      return [(iv & 0xff0000) >> 16,
	              (iv & 0xff00) >> 8,
	              iv & 0xff,
	              1];
	    }

	    return null;
	  }

	  var op = str.indexOf('('), ep = str.indexOf(')');
	  if (op !== -1 && ep + 1 === str.length) {
	    var fname = str.substr(0, op);
	    var params = str.substr(op+1, ep-(op+1)).split(',');
	    var alpha = 1;  // To allow case fallthrough.
	    switch (fname) {
	      case 'rgba':
	        if (params.length !== 4) return null;
	        alpha = parse_css_float(params.pop());
	        // Fall through.
	      case 'rgb':
	        if (params.length !== 3) return null;
	        return [parse_css_int(params[0]),
	                parse_css_int(params[1]),
	                parse_css_int(params[2]),
	                alpha];
	      case 'hsla':
	        if (params.length !== 4) return null;
	        alpha = parse_css_float(params.pop());
	        // Fall through.
	      case 'hsl':
	        if (params.length !== 3) return null;
	        var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
	        // NOTE(deanm): According to the CSS spec s/l should only be
	        // percentages, but we don't bother and let float or percentage.
	        var s = parse_css_float(params[1]);
	        var l = parse_css_float(params[2]);
	        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
	        var m1 = l * 2 - m2;
	        return [clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
	                clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
	                clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
	                alpha];
	      default:
	        return null;
	    }
	  }

	  return null;
	}

	try { csscolorparser.parseCSSColor = parseCSSColor; } catch(e) { }
	return csscolorparser;
}

var csscolorparserExports = requireCsscolorparser();

var unitbezier;
var hasRequiredUnitbezier;

function requireUnitbezier () {
	if (hasRequiredUnitbezier) return unitbezier;
	hasRequiredUnitbezier = 1;

	unitbezier = UnitBezier;

	function UnitBezier(p1x, p1y, p2x, p2y) {
	    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
	    this.cx = 3.0 * p1x;
	    this.bx = 3.0 * (p2x - p1x) - this.cx;
	    this.ax = 1.0 - this.cx - this.bx;

	    this.cy = 3.0 * p1y;
	    this.by = 3.0 * (p2y - p1y) - this.cy;
	    this.ay = 1.0 - this.cy - this.by;

	    this.p1x = p1x;
	    this.p1y = p1y;
	    this.p2x = p2x;
	    this.p2y = p2y;
	}

	UnitBezier.prototype = {
	    sampleCurveX: function (t) {
	        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
	        return ((this.ax * t + this.bx) * t + this.cx) * t;
	    },

	    sampleCurveY: function (t) {
	        return ((this.ay * t + this.by) * t + this.cy) * t;
	    },

	    sampleCurveDerivativeX: function (t) {
	        return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
	    },

	    solveCurveX: function (x, epsilon) {
	        if (epsilon === undefined) epsilon = 1e-6;

	        if (x < 0.0) return 0.0;
	        if (x > 1.0) return 1.0;

	        var t = x;

	        // First try a few iterations of Newton's method - normally very fast.
	        for (var i = 0; i < 8; i++) {
	            var x2 = this.sampleCurveX(t) - x;
	            if (Math.abs(x2) < epsilon) return t;

	            var d2 = this.sampleCurveDerivativeX(t);
	            if (Math.abs(d2) < 1e-6) break;

	            t = t - x2 / d2;
	        }

	        // Fall back to the bisection method for reliability.
	        var t0 = 0.0;
	        var t1 = 1.0;
	        t = x;

	        for (i = 0; i < 20; i++) {
	            x2 = this.sampleCurveX(t);
	            if (Math.abs(x2 - x) < epsilon) break;

	            if (x > x2) {
	                t0 = t;
	            } else {
	                t1 = t;
	            }

	            t = (t1 - t0) * 0.5 + t0;
	        }

	        return t;
	    },

	    solve: function (x, epsilon) {
	        return this.sampleCurveY(this.solveCurveX(x, epsilon));
	    }
	};
	return unitbezier;
}

var unitbezierExports = requireUnitbezier();
var UnitBezier = /*@__PURE__*/getDefaultExportFromCjs(unitbezierExports);

var access$1 = (v) => typeof v === "function" && !v.length ? v() : v;
function accessWith(valueOrFn, ...args) {
  return typeof valueOrFn === "function" ? valueOrFn(...args) : valueOrFn;
}

function chain(callbacks) {
  return (...args) => {
    for (const callback of callbacks)
      callback && callback(...args);
  };
}
function reverseChain(callbacks) {
  return (...args) => {
    for (let i = callbacks.length - 1; i >= 0; i--) {
      const callback = callbacks[i];
      callback && callback(...args);
    }
  };
}
var access = (v) => typeof v === "function" && !v.length ? v() : v;

// src/propTraps.ts
function trueFn() {
  return true;
}
var propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY)
      return receiver;
    return _.get(property);
  },
  has(_, property) {
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
var extractCSSregex = /((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g;
function stringStyleToObject(style) {
  const object = {};
  let match;
  while (match = extractCSSregex.exec(style)) {
    object[match[1]] = match[2];
  }
  return object;
}
function combineStyle(a, b) {
  if (typeof a === "object" && typeof b === "object")
    return { ...a, ...b };
  if (typeof a === "string" && typeof b === "string")
    return `${a};${b}`;
  const objA = typeof a === "object" ? a : stringStyleToObject(a);
  const objB = typeof b === "object" ? b : stringStyleToObject(b);
  return { ...objA, ...objB };
}
var reduce = (sources, key, calc) => {
  let v = void 0;
  for (const props of sources) {
    const propV = access(props)[key];
    if (!v)
      v = propV;
    else if (propV)
      v = calc(v, propV);
  }
  return v;
};
function combineProps$1(...args) {
  const restArgs = Array.isArray(args[0]);
  const sources = restArgs ? args[0] : args;
  if (sources.length === 1)
    return sources[0];
  const chainFn = restArgs && args[1]?.reverseEventHandlers ? reverseChain : chain;
  const listeners = {};
  for (const props of sources) {
    const propsObj = access(props);
    for (const key in propsObj) {
      if (key[0] === "o" && key[1] === "n" && key[2]) {
        const v = propsObj[key];
        const name = key.toLowerCase();
        const callback = typeof v === "function" ? v : (
          // jsx event handlers can be tuples of [callback, arg]
          Array.isArray(v) ? v.length === 1 ? v[0] : v[0].bind(void 0, v[1]) : void 0
        );
        if (callback)
          listeners[name] ? listeners[name].push(callback) : listeners[name] = [callback];
        else
          delete listeners[name];
      }
    }
  }
  const merge = mergeProps(...sources);
  return new Proxy(
    {
      get(key) {
        if (typeof key !== "string")
          return Reflect.get(merge, key);
        if (key === "style")
          return reduce(sources, "style", combineStyle);
        if (key === "ref") {
          const callbacks = [];
          for (const props of sources) {
            const cb = access(props)[key];
            if (typeof cb === "function")
              callbacks.push(cb);
          }
          return chainFn(callbacks);
        }
        if (key[0] === "o" && key[1] === "n" && key[2]) {
          const callbacks = listeners[key.toLowerCase()];
          return callbacks ? chainFn(callbacks) : Reflect.get(merge, key);
        }
        if (key === "class" || key === "className")
          return reduce(sources, key, (a, b) => `${a} ${b}`);
        if (key === "classList")
          return reduce(sources, key, (a, b) => ({ ...a, ...b }));
        return Reflect.get(merge, key);
      },
      has(key) {
        return Reflect.has(merge, key);
      },
      keys() {
        return Object.keys(merge);
      }
    },
    propTraps
  );
}

const FETCH_EVENT = "$FETCH";

function getRouteMatches$1(routes, path, method) {
  const segments = path.split("/").filter(Boolean);
  routeLoop:
    for (const route of routes) {
      const matchSegments = route.matchSegments;
      if (segments.length < matchSegments.length || !route.wildcard && segments.length > matchSegments.length) {
        continue;
      }
      for (let index = 0; index < matchSegments.length; index++) {
        const match = matchSegments[index];
        if (!match) {
          continue;
        }
        if (segments[index] !== match) {
          continue routeLoop;
        }
      }
      const handler = route[method];
      if (handler === "skip" || handler === void 0) {
        return;
      }
      const params = {};
      for (const { type, name, index } of route.params) {
        if (type === ":") {
          params[name] = segments[index];
        } else {
          params[name] = segments.slice(index).join("/");
        }
      }
      return { handler, params };
    }
}

let apiRoutes$1;
const registerApiRoutes = (routes) => {
  apiRoutes$1 = routes;
};
async function internalFetch(route, init) {
  if (route.startsWith("http")) {
    return await fetch(route, init);
  }
  let url = new URL(route, "http://internal");
  const request = new Request(url.href, init);
  const handler = getRouteMatches$1(apiRoutes$1, url.pathname, request.method.toUpperCase());
  if (!handler) {
    throw new Error(`No handler found for ${request.method} ${request.url}`);
  }
  let apiEvent = Object.freeze({
    request,
    params: handler.params,
    clientAddress: "127.0.0.1",
    env: {},
    locals: {},
    $type: FETCH_EVENT,
    fetch: internalFetch
  });
  const response = await handler.handler(apiEvent);
  return response;
}

const XSolidStartLocationHeader = "x-solidstart-location";
const LocationHeader = "Location";
const ContentTypeHeader = "content-type";
const XSolidStartResponseTypeHeader = "x-solidstart-response-type";
const XSolidStartContentTypeHeader = "x-solidstart-content-type";
const XSolidStartOrigin = "x-solidstart-origin";
const JSONResponseType = "application/json";
function redirect(url, init = 302) {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }
  if (url === "") {
    url = "/";
  }
  let headers = new Headers(responseInit.headers);
  headers.set(LocationHeader, url);
  const response = new Response(null, {
    ...responseInit,
    headers
  });
  return response;
}
const redirectStatusCodes = /* @__PURE__ */ new Set([204, 301, 302, 303, 307, 308]);
function isRedirectResponse(response) {
  return response && response instanceof Response && redirectStatusCodes.has(response.status);
}
class ResponseError extends Error {
  status;
  headers;
  name = "ResponseError";
  ok;
  statusText;
  redirected;
  url;
  constructor(response) {
    let message = JSON.stringify({
      $type: "response",
      status: response.status,
      message: response.statusText,
      headers: [...response.headers.entries()]
    });
    super(message);
    this.status = response.status;
    this.headers = new Map([...response.headers.entries()]);
    this.url = response.url;
    this.ok = response.ok;
    this.statusText = response.statusText;
    this.redirected = response.redirected;
    this.bodyUsed = false;
    this.type = response.type;
    this.response = () => response;
  }
  response;
  type;
  clone() {
    return this.response();
  }
  get body() {
    return this.response().body;
  }
  bodyUsed;
  async arrayBuffer() {
    return await this.response().arrayBuffer();
  }
  async blob() {
    return await this.response().blob();
  }
  async formData() {
    return await this.response().formData();
  }
  async text() {
    return await this.response().text();
  }
  async json() {
    return await this.response().json();
  }
}

const api = [
  {
    GET: "skip",
    path: "/*404"
  },
  {
    GET: "skip",
    path: "/deprecations"
  },
  {
    GET: "skip",
    path: "/expressions"
  },
  {
    GET: "skip",
    path: "/glyphs"
  },
  {
    GET: "skip",
    path: "/"
  },
  {
    GET: "skip",
    path: "/layers"
  },
  {
    GET: "skip",
    path: "/light"
  },
  {
    GET: "skip",
    path: "/root"
  },
  {
    GET: "skip",
    path: "/sources"
  },
  {
    GET: "skip",
    path: "/sprite"
  },
  {
    GET: "skip",
    path: "/transition"
  },
  {
    GET: "skip",
    path: "/types"
  }
];
function expandOptionals$1(pattern) {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match)
    return [pattern];
  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes = [prefix, prefix += match[1]];
  while (match = /^(\/\:[^\/]+)\?/.exec(suffix)) {
    prefixes.push(prefix += match[1]);
    suffix = suffix.slice(match[0].length);
  }
  return expandOptionals$1(suffix).reduce(
    (results, expansion) => [...results, ...prefixes.map((p) => p + expansion)],
    []
  );
}
function routeToMatchRoute(route) {
  const segments = route.path.split("/").filter(Boolean);
  const params = [];
  const matchSegments = [];
  let score = route.path.endsWith("/") ? 4 : 0;
  let wildcard = false;
  for (const [index, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      params.push({
        type: "*",
        name: segment.slice(1),
        index
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }
  return {
    ...route,
    score,
    params,
    matchSegments,
    wildcard
  };
}
const allRoutes = api.flatMap((route) => {
  const paths = expandOptionals$1(route.path);
  return paths.map((path) => ({ ...route, path }));
}).map(routeToMatchRoute).sort((a, b) => b.score - a.score);
registerApiRoutes(allRoutes);
function getApiHandler(url, method) {
  return getRouteMatches$1(allRoutes, url.pathname, method.toUpperCase());
}

const apiRoutes = ({ forward }) => {
  return async (event) => {
    let apiHandler = getApiHandler(new URL(event.request.url), event.request.method);
    if (apiHandler) {
      let apiEvent = Object.freeze({
        request: event.request,
        clientAddress: event.clientAddress,
        locals: event.locals,
        params: apiHandler.params,
        env: event.env,
        $type: FETCH_EVENT,
        fetch: internalFetch
      });
      try {
        return await apiHandler.handler(apiEvent);
      } catch (error) {
        if (error instanceof Response) {
          return error;
        }
        return new Response(JSON.stringify(error), {
          status: 500
        });
      }
    }
    return await forward(event);
  };
};
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function staticIntegration(obj) {
    return {
        signal: [() => obj, next => Object.assign(obj, next)]
    };
}

function createBeforeLeave() {
    let listeners = new Set();
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    let ignore = false;
    function confirm(to, options) {
        if (ignore)
            return !(ignore = false);
        const e = {
            to,
            options,
            defaultPrevented: false,
            preventDefault: () => (e.defaultPrevented = true)
        };
        for (const l of listeners)
            l.listener({
                ...e,
                from: l.location,
                retry: (force) => {
                    force && (ignore = true);
                    l.navigate(to, options);
                }
            });
        return !e.defaultPrevented;
    }
    return {
        subscribe,
        confirm
    };
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|(\/)\/+$/g;
function normalizePath(path, omitSlash = false) {
    const s = path.replace(trimPathRegex, "$1");
    return s ? (omitSlash || /^[?#]/.test(s) ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalizePath(base);
    const fromPath = from && normalizePath(from);
    let result = "";
    if (!fromPath || path.startsWith("/")) {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return (result || "/") + normalizePath(path, !result);
}
function invariant(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function joinPaths(from, to) {
    return normalizePath(from).replace(/\/*(\*.*)?$/g, "") + normalizePath(to);
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function createMatcher(path, partial, matchFilters) {
    const [pattern, splat] = path.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    const len = segments.length;
    return (location) => {
        const locSegments = location.split("/").filter(Boolean);
        const lenDiff = locSegments.length - len;
        if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
            return null;
        }
        const match = {
            path: len ? "" : "/",
            params: {}
        };
        const matchFilter = (s) => matchFilters === undefined ? undefined : matchFilters[s];
        for (let i = 0; i < len; i++) {
            const segment = segments[i];
            const locSegment = locSegments[i];
            const dynamic = segment[0] === ":";
            const key = dynamic ? segment.slice(1) : segment;
            if (dynamic && matchSegment(locSegment, matchFilter(key))) {
                match.params[key] = locSegment;
            }
            else if (dynamic || !matchSegment(locSegment, segment)) {
                return null;
            }
            match.path += `/${locSegment}`;
        }
        if (splat) {
            const remainder = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
            if (matchSegment(remainder, matchFilter(splat))) {
                match.params[splat] = remainder;
            }
            else {
                return null;
            }
        }
        return match;
    };
}
function matchSegment(input, filter) {
    const isEqual = (s) => s.localeCompare(input, undefined, { sensitivity: "base" }) === 0;
    if (filter === undefined) {
        return true;
    }
    else if (typeof filter === "string") {
        return isEqual(filter);
    }
    else if (typeof filter === "function") {
        return filter(input);
    }
    else if (Array.isArray(filter)) {
        return filter.some(isEqual);
    }
    else if (filter instanceof RegExp) {
        return filter.test(input);
    }
    return false;
}
function scoreRoute(route) {
    const [pattern, splat] = route.pattern.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === undefined ? 0 : 1));
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}
function expandOptionals(pattern) {
    let match = /(\/?\:[^\/]+)\?/.exec(pattern);
    if (!match)
        return [pattern];
    let prefix = pattern.slice(0, match.index);
    let suffix = pattern.slice(match.index + match[0].length);
    const prefixes = [prefix, (prefix += match[1])];
    // This section handles adjacent optional params. We don't actually want all permuations since
    // that will lead to equivalent routes which have the same number of params. For example
    // `/:a?/:b?/:c`? only has the unique expansion: `/`, `/:a`, `/:a/:b`, `/:a/:b/:c` and we can
    // discard `/:b`, `/:c`, `/:b/:c` by building them up in order and not recursing. This also helps
    // ensure predictability where earlier params have precidence.
    while ((match = /^(\/\:[^\/]+)\?/.exec(suffix))) {
        prefixes.push((prefix += match[1]));
        suffix = suffix.slice(match[0].length);
    }
    return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map(p => p + expansion)], []);
}

const MAX_REDIRECTS$1 = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
const useResolvedPath = (path) => {
    const route = useRoute();
    return createMemo(() => route.resolvePath(path()));
};
const useHref = (to) => {
    const router = useRouter();
    return createMemo(() => {
        const to_ = to();
        return to_ !== undefined ? router.renderPath(to_) : to_;
    });
};
const useNavigate$1 = () => useRouter().navigatorFactory();
const useLocation$1 = () => useRouter().location;
function createRoutes(routeDef, base = "", fallback) {
    const { component, data, children } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const shared = {
        key: routeDef,
        element: component
            ? () => createComponent(component, {})
            : () => {
                const { element } = routeDef;
                return element === undefined && fallback
                    ? createComponent(fallback, {})
                    : element;
            },
        preload: routeDef.component
            ? component.preload
            : routeDef.preload,
        data
    };
    return asArray(routeDef.path).reduce((acc, path) => {
        for (const originalPath of expandOptionals(path)) {
            const path = joinPaths(base, originalPath);
            const pattern = isLeaf ? path : path.split("/*", 1)[0];
            acc.push({
                ...shared,
                originalPath,
                pattern,
                matcher: createMatcher(pattern, !isLeaf, routeDef.matchFilters)
            });
        }
        return acc;
    }, []);
}
function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function asArray(value) {
    return Array.isArray(value) ? value : [value];
}
function createBranches(routeDef, base = "", fallback, stack = [], branches = []) {
    const routeDefs = asArray(routeDef);
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object" && def.hasOwnProperty("path")) {
            const routes = createRoutes(def, base, fallback);
            for (const route of routes) {
                stack.push(route);
                const isEmptyArray = Array.isArray(def.children) && def.children.length === 0;
                if (def.children && !isEmptyArray) {
                    createBranches(def.children, route.pattern, fallback, stack, branches);
                }
                else {
                    const branch = createBranch([...stack], branches.length);
                    branches.push(branch);
                }
                stack.pop();
            }
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin);
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search, true);
    const hash = createMemo(() => url().hash);
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const beforeLeave = utils.beforeLeave || createBeforeLeave();
    const basePath = resolvePath("", base);
    const output = out
        ? Object.assign(out, {
            matches: [],
            url: undefined
        })
        : undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, setIsRouting] = createSignal(false);
    const start = async (callback) => {
        setIsRouting(true);
        try {
            await startTransition(callback);
        }
        finally {
            setIsRouting(false);
        }
    };
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) ;
                else if (utils.go) {
                    beforeLeave.confirm(to, options) && utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS$1) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                {
                    if (output) {
                        output.url = resolvedTo;
                    }
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    createRenderEffect(() => {
        const { value, state } = source();
        // Untrack this whole block so `start` doesn't cause Solid's Listener to be preserved
        untrack(() => {
            if (value !== reference()) {
                start(() => {
                    setReference(value);
                    setState(state);
                });
            }
        });
    });
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory,
        beforeLeave
    };
}
function createRouteContext(router, parent, child, match, params) {
    const { base, location, navigatorFactory } = router;
    const { pattern, element: outlet, preload, data } = match().route;
    const path = createMemo(() => match().path);
    preload && preload();
    const route = {
        parent,
        pattern,
        get child() {
            return child();
        },
        path,
        params,
        data: parent.data,
        outlet,
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    if (data) {
        try {
            TempRoute = route;
            route.data = data({ data: parent.data, params, location, navigate: navigatorFactory(route) });
        }
        finally {
            TempRoute = undefined;
        }
    }
    return route;
}

const Router = props => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (staticIntegration({
    value: url || ""
  }) );
  const routerState = createRouterContext(integration, base, data, out);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return props.children;
    }
  });
};
const Routes$1 = props => {
  const router = useRouter();
  const parentRoute = useRoute();
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(routeDefs(), joinPaths(parentRoute.pattern, props.base || ""), Outlet));
  const matches = createMemo(() => getRouteMatches(branches(), router.location.pathname));
  const params = createMemoObject(() => {
    const m = matches();
    const params = {};
    for (let i = 0; i < m.length; i++) {
      Object.assign(params, m[i].params);
    }
    return params;
  });
  if (router.out) {
    router.out.matches.push(matches().map(({
      route,
      path,
      params
    }) => ({
      originalPath: route.originalPath,
      pattern: route.pattern,
      path,
      params
    })));
  }
  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];
    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];
      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;
        if (disposers[i]) {
          disposers[i]();
        }
        createRoot(dispose => {
          disposers[i] = dispose;
          next[i] = createRouteContext(router, next[i - 1] || parentRoute, () => routeStates()[i + 1], () => matches()[i], params);
        });
      }
    }
    disposers.splice(nextMatches.length).forEach(dispose => dispose());
    if (prev && equal) {
      return prev;
    }
    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },
    keyed: true,
    children: route => createComponent(RouteContextObj.Provider, {
      value: route,
      get children() {
        return route.outlet();
      }
    })
  });
};
const Outlet = () => {
  const route = useRoute();
  return createComponent(Show, {
    get when() {
      return route.child;
    },
    keyed: true,
    children: child => createComponent(RouteContextObj.Provider, {
      value: child,
      get children() {
        return child.outlet();
      }
    })
  });
};
function A$1(props) {
  props = mergeProps({
    inactiveClass: "inactive",
    activeClass: "active"
  }, props);
  const [, rest] = splitProps(props, ["href", "state", "class", "activeClass", "inactiveClass", "end"]);
  const to = useResolvedPath(() => props.href);
  const href = useHref(to);
  const location = useLocation$1();
  const isActive = createMemo(() => {
    const to_ = to();
    if (to_ === undefined) return false;
    const path = normalizePath(to_.split(/[?#]/, 1)[0]).toLowerCase();
    const loc = normalizePath(location.pathname).toLowerCase();
    return props.end ? path === loc : loc.startsWith(path);
  });
  return ssrElement("a", mergeProps({
    link: true
  }, rest, {
    get href() {
      return href() || props.href;
    },
    get state() {
      return JSON.stringify(props.state);
    },
    get classList() {
      return {
        ...(props.class && {
          [props.class]: true
        }),
        [props.inactiveClass]: !isActive(),
        [props.activeClass]: isActive(),
        ...rest.classList
      };
    },
    get ["aria-current"]() {
      return isActive() ? "page" : undefined;
    }
  }), undefined, true);
}

class ServerError extends Error {
  constructor(message, {
    status,
    stack
  } = {}) {
    super(message);
    this.name = "ServerError";
    this.status = status || 400;
    if (stack) {
      this.stack = stack;
    }
  }
}
class FormError extends ServerError {
  constructor(message, {
    fieldErrors = {},
    form,
    fields,
    stack
  } = {}) {
    super(message, {
      stack
    });
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(typeof form !== "undefined" ? form.entries() : []) || {};
    this.fieldErrors = fieldErrors;
  }
}

const ServerContext = createContext({});

const A = A$1;
const Routes = Routes$1;
const useLocation = useLocation$1;
const useNavigate = useNavigate$1;

const server$ = (_fn) => {
  throw new Error("Should be compiled away");
};
async function parseRequest(event) {
  let request = event.request;
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname, args = [];
  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(text, (key, value) => {
          if (!value) {
            return value;
          }
          if (value.$type === "headers") {
            let headers = new Headers();
            request.headers.forEach((value2, key2) => headers.set(key2, value2));
            value.values.forEach(([key2, value2]) => headers.set(key2, value2));
            return headers;
          }
          if (value.$type === "request") {
            return new Request(value.url, {
              method: value.method,
              headers: value.headers
            });
          }
          return value;
        });
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.clone().formData();
      args = [formData, event];
    }
  }
  return [name, args];
}
function respondWith(request, data, responseType) {
  if (data instanceof ResponseError) {
    data = data.clone();
  }
  if (data instanceof Response) {
    if (isRedirectResponse(data) && request.headers.get(XSolidStartOrigin) === "client") {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartLocationHeader, data.headers.get(LocationHeader));
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(null, {
        status: 204,
        statusText: "Redirected",
        headers
      });
    } else if (data.status === 101) {
      return data;
    } else {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(data.body, {
        status: data.status,
        statusText: data.statusText,
        headers
      });
    }
  } else if (data instanceof FormError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: "",
          formError: data.formError,
          fields: data.fields,
          fieldErrors: data.fieldErrors
        }
      }),
      {
        status: 400,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "form-error"
        }
      }
    );
  } else if (data instanceof ServerError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: ""
        }
      }),
      {
        status: data.status,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "server-error"
        }
      }
    );
  } else if (data instanceof Error) {
    console.error(data);
    return new Response(
      JSON.stringify({
        error: {
          message: "Internal Server Error",
          stack: "",
          status: data.status
        }
      }),
      {
        status: data.status || 500,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "error"
        }
      }
    );
  } else if (typeof data === "object" || typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        [ContentTypeHeader]: "application/json",
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "json"
      }
    });
  }
  return new Response("null", {
    status: 200,
    headers: {
      [ContentTypeHeader]: "application/json",
      [XSolidStartContentTypeHeader]: "json",
      [XSolidStartResponseTypeHeader]: responseType
    }
  });
}
async function handleServerRequest(event) {
  const url = new URL(event.request.url);
  if (server$.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(event);
      let handler = server$.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(event, ...Array.isArray(args) ? args : [args]);
      return respondWith(event.request, data, "return");
    } catch (error) {
      return respondWith(event.request, error, "throw");
    }
  }
  return null;
}
const handlers = /* @__PURE__ */ new Map();
server$.createHandler = (_fn, hash, serverResource) => {
  let fn = function(...args) {
    let ctx;
    if (typeof this === "object") {
      ctx = this;
    } else if (sharedConfig.context && sharedConfig.context.requestContext) {
      ctx = sharedConfig.context.requestContext;
    } else {
      ctx = {
        request: new URL(hash, "http://localhost:3000").href,
        responseHeaders: new Headers()
      };
    }
    const execute = async () => {
      try {
        return serverResource ? _fn.call(ctx, args[0], ctx) : _fn.call(ctx, ...args);
      } catch (e) {
        if (e instanceof Error && /[A-Za-z]+ is not defined/.test(e.message)) {
          const error = new Error(
            e.message + "\n You probably are using a variable defined in a closure in your server function."
          );
          error.stack = e.stack;
          throw error;
        }
        throw e;
      }
    };
    return execute();
  };
  fn.url = hash;
  fn.action = function(...args) {
    return fn.call(this, ...args);
  };
  return fn;
};
server$.registerHandler = function(route, handler) {
  handlers.set(route, handler);
};
server$.getHandler = function(route) {
  return handlers.get(route);
};
server$.hasHandler = function(route) {
  return handlers.has(route);
};
server$.fetch = internalFetch;

const inlineServerFunctions = ({ forward }) => {
  return async (event) => {
    const url = new URL(event.request.url);
    if (server$.hasHandler(url.pathname)) {
      let contentType = event.request.headers.get(ContentTypeHeader);
      let origin = event.request.headers.get(XSolidStartOrigin);
      let formRequestBody;
      if (contentType != null && contentType.includes("form") && !(origin != null && origin.includes("client"))) {
        let [read1, read2] = event.request.body.tee();
        formRequestBody = new Request(event.request.url, {
          body: read2,
          headers: event.request.headers,
          method: event.request.method,
          duplex: "half"
        });
        event.request = new Request(event.request.url, {
          body: read1,
          headers: event.request.headers,
          method: event.request.method,
          duplex: "half"
        });
      }
      let serverFunctionEvent = Object.freeze({
        request: event.request,
        clientAddress: event.clientAddress,
        locals: event.locals,
        fetch: internalFetch,
        $type: FETCH_EVENT,
        env: event.env
      });
      const serverResponse = await handleServerRequest(serverFunctionEvent);
      let responseContentType = serverResponse.headers.get(XSolidStartContentTypeHeader);
      if (formRequestBody && responseContentType !== null && responseContentType.includes("error")) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(event.request.headers.get("referer") || "").pathname + "?form=" + encodeURIComponent(
              JSON.stringify({
                url: url.pathname,
                entries,
                ...await serverResponse.json()
              })
            )
          }
        });
      }
      return serverResponse;
    }
    const response = await forward(event);
    return response;
  };
};

function renderAsync(fn, options) {
  return () => apiRoutes({
    forward: inlineServerFunctions({
      async forward(event) {
        let pageEvent = createPageEvent(event);
        let markup = await renderToStringAsync(() => fn(pageEvent), options);
        if (pageEvent.routerContext && pageEvent.routerContext.url) {
          return redirect(pageEvent.routerContext.url, {
            headers: pageEvent.responseHeaders
          });
        }
        markup = handleIslandsRouting(pageEvent, markup);
        return new Response(markup, {
          status: pageEvent.getStatusCode(),
          headers: pageEvent.responseHeaders
        });
      }
    })
  });
}
function createPageEvent(event) {
  let responseHeaders = new Headers({
    "Content-Type": "text/html"
  });
  const prevPath = event.request.headers.get("x-solid-referrer");
  let statusCode = 200;
  function setStatusCode(code) {
    statusCode = code;
  }
  function getStatusCode() {
    return statusCode;
  }
  const pageEvent = Object.freeze({
    request: event.request,
    prevUrl: prevPath || "",
    routerContext: {},
    tags: [],
    env: event.env,
    clientAddress: event.clientAddress,
    locals: event.locals,
    $type: FETCH_EVENT,
    responseHeaders,
    setStatusCode,
    getStatusCode,
    fetch: internalFetch
  });
  return pageEvent;
}
function handleIslandsRouting(pageEvent, markup) {
  return markup;
}

const MetaContext = createContext();
const cascadingTags = ["title", "meta"];
const getTagType = tag => tag.tag + (tag.name ? `.${tag.name}"` : "");
const MetaProvider = props => {
  const cascadedTagInstances = new Map();
  const actions = {
    addClientTag: tag => {
      let tagType = getTagType(tag);
      if (cascadingTags.indexOf(tag.tag) !== -1) {
        //  only cascading tags need to be kept as singletons
        if (!cascadedTagInstances.has(tagType)) {
          cascadedTagInstances.set(tagType, []);
        }
        let instances = cascadedTagInstances.get(tagType);
        let index = instances.length;
        instances = [...instances, tag];
        // track indices synchronously
        cascadedTagInstances.set(tagType, instances);
        return index;
      }
      return -1;
    },
    removeClientTag: (tag, index) => {
      const tagName = getTagType(tag);
      if (tag.ref) {
        const t = cascadedTagInstances.get(tagName);
        if (t) {
          if (tag.ref.parentNode) {
            tag.ref.parentNode.removeChild(tag.ref);
            for (let i = index - 1; i >= 0; i--) {
              if (t[i] != null) {
                document.head.appendChild(t[i].ref);
              }
            }
          }
          t[index] = null;
          cascadedTagInstances.set(tagName, t);
        } else {
          if (tag.ref.parentNode) {
            tag.ref.parentNode.removeChild(tag.ref);
          }
        }
      }
    }
  };
  {
    actions.addServerTag = tagDesc => {
      const {
        tags = []
      } = props;
      // tweak only cascading tags
      if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
        const index = tags.findIndex(prev => {
          const prevName = prev.props.name || prev.props.property;
          const nextName = tagDesc.props.name || tagDesc.props.property;
          return prev.tag === tagDesc.tag && prevName === nextName;
        });
        if (index !== -1) {
          tags.splice(index, 1);
        }
      }
      tags.push(tagDesc);
    };
    if (Array.isArray(props.tags) === false) {
      throw Error("tags array should be passed to <MetaProvider /> in node");
    }
  }
  return createComponent(MetaContext.Provider, {
    value: actions,
    get children() {
      return props.children;
    }
  });
};
const MetaTag = (tag, props) => {
  const id = createUniqueId();
  const c = useContext(MetaContext);
  if (!c) throw new Error("<MetaProvider /> should be in the tree");
  useHead({
    tag,
    props,
    id,
    get name() {
      return props.name || props.property;
    }
  });
  return null;
};
function useHead(tagDesc) {
  const {
    addClientTag,
    removeClientTag,
    addServerTag
  } = useContext(MetaContext);
  createRenderEffect(() => {
    if (!isServer) ;
  });
  {
    addServerTag(tagDesc);
    return null;
  }
}
function renderTags(tags) {
  return tags.map(tag => {
    const keys = Object.keys(tag.props);
    const props = keys.map(k => k === "children" ? "" : ` ${k}="${tag.props[k]}"`).join("");
    return tag.props.children ? `<${tag.tag} data-sm="${tag.id}"${props}>${
    // Tags might contain multiple text children:
    //   <Title>example - {myCompany}</Title>
    Array.isArray(tag.props.children) ? tag.props.children.join("") : tag.props.children}</${tag.tag}>` : `<${tag.tag} data-sm="${tag.id}"${props}/>`;
  }).join("");
}
const Title = props => MetaTag("title", props);
const Meta$1 = props => MetaTag("meta", props);
const Link = props => MetaTag("link", props);

const _tmpl$$o = ["<div", " style=\"", "\"><div style=\"", "\"><p style=\"", "\" id=\"error-message\">", "</p><button id=\"reset-errors\" style=\"", "\">Clear errors and retry</button><pre style=\"", "\">", "</pre></div></div>"];
function ErrorBoundary(props) {
  return createComponent(ErrorBoundary$1, {
    fallback: (e, reset) => {
      return createComponent(Show, {
        get when() {
          return !props.fallback;
        },
        get fallback() {
          return props.fallback && props.fallback(e, reset);
        },
        get children() {
          return createComponent(ErrorMessage, {
            error: e
          });
        }
      });
    },
    get children() {
      return props.children;
    }
  });
}
function ErrorMessage(props) {
  return ssr(_tmpl$$o, ssrHydrationKey(), "padding:" + "16px", "background-color:" + "rgba(252, 165, 165)" + (";color:" + "rgb(153, 27, 27)") + (";border-radius:" + "5px") + (";overflow:" + "scroll") + (";padding:" + "16px") + (";margin-bottom:" + "8px"), "font-weight:" + "bold", escape(props.error.message), "color:" + "rgba(252, 165, 165)" + (";background-color:" + "rgb(153, 27, 27)") + (";border-radius:" + "5px") + (";padding:" + "4px 8px"), "margin-top:" + "8px" + (";width:" + "100%"), escape(props.error.stack));
}

const routeLayouts = {
  "/*404": {
    "id": "/*404",
    "layouts": []
  },
  "/deprecations": {
    "id": "/deprecations",
    "layouts": []
  },
  "/expressions": {
    "id": "/expressions",
    "layouts": []
  },
  "/glyphs": {
    "id": "/glyphs",
    "layouts": []
  },
  "/": {
    "id": "/",
    "layouts": []
  },
  "/layers": {
    "id": "/layers",
    "layouts": []
  },
  "/light": {
    "id": "/light",
    "layouts": []
  },
  "/root": {
    "id": "/root",
    "layouts": []
  },
  "/sources": {
    "id": "/sources",
    "layouts": []
  },
  "/sprite": {
    "id": "/sprite",
    "layouts": []
  },
  "/transition": {
    "id": "/transition",
    "layouts": []
  },
  "/types": {
    "id": "/types",
    "layouts": []
  }
};

const _tmpl$$n = ["<link", " rel=\"stylesheet\"", ">"],
  _tmpl$2$7 = ["<link", " rel=\"modulepreload\"", ">"];
function flattenIslands(match, manifest) {
  let result = [...match];
  match.forEach(m => {
    if (m.type !== "island") return;
    const islandManifest = manifest[m.href];
    if (islandManifest) {
      const res = flattenIslands(islandManifest.assets, manifest);
      result.push(...res);
    }
  });
  return result;
}
function getAssetsFromManifest(manifest, routerContext) {
  let match = routerContext.matches ? routerContext.matches.reduce((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(...(manifest[route.id] || []));
        const layoutsManifestEntries = route.layouts.flatMap(manifestKey => manifest[manifestKey] || []);
        memo.push(...layoutsManifestEntries);
      }
    }
    return memo;
  }, []) : [];
  match.push(...(manifest["entry-client"] || []));
  match = manifest ? flattenIslands(match, manifest) : [];
  const links = match.reduce((r, src) => {
    r[src.href] = src.type === "style" ? ssr(_tmpl$$n, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : src.type === "script" ? ssr(_tmpl$2$7, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : undefined;
    return r;
  }, {});
  return Object.values(links);
}

/**
 * Links are used to load assets for the server rendered HTML
 * @returns {JSXElement}
 */
function Links() {
  const context = useContext(ServerContext);
  useAssets(() => getAssetsFromManifest(context.env.manifest, context.routerContext));
  return null;
}

function Meta() {
  const context = useContext(ServerContext);
  // @ts-expect-error The ssr() types do not match the Assets child types
  useAssets(() => ssr(renderTags(context.tags)));
  return null;
}

const _tmpl$$m = "<!---->",
  _tmpl$5$3 = ["<script", " type=\"module\" async", "></script>"];
const isDev = "production" === "development";
const isIslands = false;
function Scripts() {
  const context = useContext(ServerContext);
  return [createComponent(HydrationScript, {}), ssr(_tmpl$$m), isIslands , createComponent(NoHydration, {
    get children() {
      return (      ssr(_tmpl$5$3, ssrHydrationKey(), ssrAttribute("src", escape(context.env.manifest["entry-client"][0].href, true), false)) );
    }
  }), isDev ];
}

function Html(props) {
  {
    return ssrElement("html", props, undefined, false);
  }
}
function Head(props) {
  {
    return ssrElement("head", props, () => [escape(props.children), createComponent(Meta, {}), createComponent(Links, {})], false);
  }
}
function Body(props) {
  {
    return ssrElement("body", props, () => escape(props.children) , false);
  }
}

function HttpStatusCode(props) {
  const context = useContext(ServerContext);
  {
    context.setStatusCode(props.code);
  }
  onCleanup(() => {
    {
      context.setStatusCode(200);
    }
  });
  return null;
}

const _tmpl$$l = ["<main", "><!--#-->", "<!--/--><!--#-->", "<!--/--><h2>Page Not Found</h2></main>"];
function NotFound() {
  return ssr(_tmpl$$l, ssrHydrationKey(), escape(createComponent(Title, {
    children: "Not Found"
  })), escape(createComponent(HttpStatusCode, {
    code: 404
  })));
}

const _tmpl$$k = ["<div", ">", "</div>"];

// import 'highlight.js/styles/tokyo-night-dark.css';

const md$1 = new MarkdownIt();
md$1.use(prism, {
  highlightInlineCode: true,
  defaultLanguage: 'typescript'
}).use(deflist).use(p);
function Markdown({
  content
}) {
  return ssr(_tmpl$$k, ssrHydrationKey(), md$1.render(content));
}

// export function SolidMd ({content}:{content:string}){

//     return <SolidMarkdown children={content} />
// }

// export function SolidMd ({content}:{content:string}){
//     return render(Markdoc.transform(Markdoc.parse(content)));
// }

// const md = new MarkdownIt({
//     highlight: function (str, lang) {

//         console.log('highlight')

//       if (lang && hljs.getLanguage(lang)) {
//         console.log( str)
//         try {
//           return hljs.highlight(str, { language: lang }).value;
//         } catch (__) {}
//       }

//       return ``; // use external default escaping
//     }
// });

const _tmpl$$j = ["<div", " class=\"txt-em py12 px18 bg-gray-faint\" style=\"", "\">", "</div>"];
const Caption = props => {
  return ssr(_tmpl$$j, ssrHydrationKey(), "color:" + "#546C8C", escape(props.children));
};

const SDKSupportTable$1 = "_SDKSupportTable_q678u_1";
const headerRow = "_headerRow_q678u_24";
const style$6 = {
	SDKSupportTable: SDKSupportTable$1,
	headerRow: headerRow
};

const _tmpl$$i = ["<div", "><table class=\"txt-s\"><thead><tr", " style=\"", "\"><th style=\"", "\">SDK Support</th><td>MapLibre GL JS</td><td>Android SDK</td><td>iOS SDK</td><td style=\"", "\">macOS SDK</td></tr></thead><tbody>", "</tbody></table></div>"],
  _tmpl$2$6 = ["<tr", "><td>", "</td><td>", "</td><td>", "</td><td>", "</td><td>", "</td></tr>"];
const SDKSupportTable = props => {
  function support(support, sdk) {
    if (!support) return 'Not yet supported';
    support = support[sdk];
    if (support === undefined) return 'Not yet supported';
    return `>= ${support}`;
  }
  return ssr(_tmpl$$i, ssrHydrationKey() + ssrAttribute("class", escape(style$6.SDKSupportTable, true), false), ssrAttribute("class", escape(style$6.headerRow, true), false), "border-top-left-radius:" + "4px" + (";border-top-right-radius:" + "4px"), "border-top-left-radius:" + "4px", "border-top-right-radius:" + "4px", escape(entries(props.supportItems || props).map(([key, entry]) => ssr(_tmpl$2$6, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: key
  })), escape(support(entry, 'js')), escape(support(entry, 'android')), escape(support(entry, 'ios')), escape(support(entry, 'macos'))))));
};

const _tmpl$$h = ["<a", " class=\"style-spec-property unprose cursor-pointer color-blue-on-hover block\" href=\"", "\">", "</a>"];
function Property({
  headingLevel = '3',
  id,
  children
}) {
  const Heading = `h${headingLevel}`;
  return createComponent(Dynamic, {
    component: Heading,
    id: id,
    "class": "unprose txt-mono anchor txt-l mb3 mt24",
    get children() {
      return ssr(_tmpl$$h, ssrHydrationKey(), `#${escape(id, true)}`, escape(children));
    }
  });
}

const _tmpl$$g = ["<div", " class=\"mb12 color-gray txt-em\">", "</div>"];
function Subtitle(props) {
  return ssr(_tmpl$$g, ssrHydrationKey(), escape(props.children));
}

const _tmpl$$f = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><div class=\"mb12\">", "</div><!--#-->", "<!--/--><a id=\"types-function-zoom-property\" class=\"anchor\"></a><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Layers$1() {
  return ssr(_tmpl$$f, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: `# Deprecations

Some style properties are no longer the preferred method of accomplishing a particular styling goal. While they are still supported, they will eventually be removed from the MapLibre Style Specification and it is not recommended to use them in new styles. The following is provided as reference for users who need to continue maintaining legacy styles while transitioning to preferred style properties.


## Function
`
  })), escape(createComponent(Caption, {
    theme: "warning",
    get children() {
      return createComponent(Markdown, {
        content: `
As of [v0.41.0](https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md#0410-october-11-2017), [property expressions](/maplibre-gl-js-docs/style-spec/expressions) is the preferred method for styling features based on zoom level or the feature's properties. Zoom and property functions are still supported, but will be phased out in a future release.
`
      });
    }
  })), escape(createComponent(Markdown, {
    content: `
The value for any layout or paint property may be specified as a _function_. Functions allow you to make the appearance of a map feature change with the current zoom level and/or the feature's properties.
`
  })), escape(createComponent(Property, {
    headingLevel: "3",
    id: "function-stops",
    children: "stops"
  })), escape(createComponent(Subtitle, {
    children: "Required (except for `identity` functions) [array](/maplibre-gl-js-docs/style-spec/types/#array)."
  })), escape(createComponent(Markdown, {
    content: `
A set of one input value and one output value is a "stop." Stop output values must be literal values (i.e. not functions or expressions), and appropriate for the property. For example, stop output values for a \`fill-color\` function property must be [colors](/maplibre-gl-js-docs/style-spec/types/#color).
`
  })), escape(createComponent(Property, {
    headingLevel: "3",
    id: "function-property",
    children: "property"
  })), escape(createComponent(Subtitle, {
    get children() {
      return createComponent(Markdown, {
        content: `
Optional [string](/maplibre-gl-js-docs/style-spec/types/#string).
`
      });
    }
  })), escape(createComponent(Markdown, {
    content: `
If specified, the function will take the specified feature property as an input. See [Zoom Functions and Property Functions](/maplibre-gl-js-docs/style-spec/types/#function-zoom-property) for more information.
`
  })), escape(createComponent(Property, {
    headingLevel: "3",
    id: "function-base",
    children: "base"
  })), escape(createComponent(Subtitle, {
    get children() {
      return createComponent(Markdown, {
        content: `
Optional [number](/maplibre-gl-js-docs/style-spec/types/#number). Default is ref.function.base.default.
`
      });
    }
  })), escape(createComponent(Markdown, {
    content: `
The exponential base of the interpolation curve. It controls the rate at which the function output increases. Higher values make the output increase more towards the high end of the range. With values close to 1 the output increases linearly.
`
  })), escape(createComponent(Property, {
    headingLevel: "3",
    id: "function-type",
    children: "type"
  })), escape(createComponent(Subtitle, {
    get children() {
      return createComponent(Markdown, {
        content: `
Optional [string](/maplibre-gl-js-docs/style-spec/types/#string). One of \`"identity"\`, \`"exponential"\`, \`"interval"\`, or \`"categorical"\`.
`
      });
    }
  })), escape(createComponent(Markdown, {
    content: `

\`identity\`
: A function that returns its input as the output.

\`exponential\`
: A function that generates an output by interpolating between stops just less than and just greater than the function input. The domain (input value) must be numeric, and the style property must support interpolation. Style properties that support interpolation are marked marked with, the "exponential" symbol, and \`exponential\` is the default function type for these properties.

\`interval\`
: A function that returns the output value of the stop just less than the function input. The domain (input value) must be numeric. Any style property may use interval functions. For properties marked with, the "interval" symbol, this is the default function type.

\`categorical\`
: A function that returns the output value of the stop equal to the function input.
`
  })), escape(createComponent(Property, {
    headingLevel: "3",
    id: "function-default",
    children: "default"
  })), escape(createComponent(Markdown, {
    content: `
A value to serve as a fallback function result when a value isn't otherwise available. It is used in the following circumstances:

- In categorical functions, when the feature value does not match any of the stop domain values.
- In property and zoom-and-property functions, when a feature does not contain a value for the specified property.
- In identity functions, when the feature value is not valid for the style property (for example, if the function is being used for a \`circle-color\` property but the feature property value is not a string or not a valid color).
- In interval or exponential property and zoom-and-property functions, when the feature value is not numeric.

If no default is provided, the style property's default is used in these circumstances.
`
  })), escape(createComponent(Property, {
    headingLevel: "3",
    id: "function-colorSpace",
    children: "colorSpace"
  })), escape(createComponent(Subtitle, {
    get children() {
      return createComponent(Markdown, {
        content: `
Optional [string](/maplibre-gl-js-docs/style-spec/types/#string). One of \`"rgb"\`, \`"lab"\`, \`"hcl"\`.
`
      });
    }
  })), escape(createComponent(Markdown, {
    content: `
The color space in which colors interpolated. Interpolating colors in perceptual color spaces like LAB and HCL tend to produce color ramps that look more consistent and produce colors that can be differentiated more easily than those interpolated in RGB space.


\`rgb\`
: Use the RGB color space to interpolate color values

\`lab\`
: Use the LAB color space to interpolate color values.

\`hcl\`
: Use the HCL color space to interpolate color values, interpolating the Hue, Chroma, and Luminance channels individually.
            
            `
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0',
        android: '2.0.1',
        ios: '2.0.0',
        macos: '0.1.0'
      },
      '\`property\`': {
        js: '0.18.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`code\`': {
        js: '0.18.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`exponential\` type': {
        js: '0.18.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`interval\` type': {
        js: '0.18.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`categorical\` type': {
        js: '0.18.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`identity\` type': {
        js: '0.26.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`default\`': {
        js: '0.33.0',
        android: '5.0.0',
        ios: '3.5.0',
        macos: '0.4.0'
      },
      '\`colorSpace\`': {
        js: '0.26.0'
      }
    }
  })), escape(createComponent(Markdown, {
    content: `
**Zoom functions** allow the appearance of a map feature to change with map’s zoom level. Zoom functions can be used to create the illusion of depth and control data density. Each stop is an array with two elements: the first is a zoom level and the second is a function output value.

\`\`\`json
{
    "circle-radius": {
        "stops": [
            // zoom is 5 -> circle radius will be 1px
            [5, 1],
            // zoom is 10 -> circle radius will be 2px
            [10, 2]
        ]
    }
}
\`\`\`

The rendered values of [color](/maplibre-gl-js-docs/style-spec/types/#color), [number](/maplibre-gl-js-docs/style-spec/types/#number), and [array](/maplibre-gl-js-docs/style-spec/types/#array) properties are interpolated between stops. [Boolean](/maplibre-gl-js-docs/style-spec/types/#boolean) and [string](/maplibre-gl-js-docs/style-spec/types/#string) property values cannot be interpolated, so their rendered values only change at the specified stops.

There is an important difference between the way that zoom functions render for _layout_ and _paint_ properties. Paint properties are continuously re-evaluated whenever the zoom level changes, even fractionally. The rendered value of a paint property will change, for example, as the map moves between zoom levels \`4.1\` and \`4.6\`. Layout properties, however, are evaluated only once for each integer zoom level. To continue the prior example: the rendering of a layout property will _not_ change between zoom levels \`4.1\` and \`4.6\`, no matter what stops are specified; but at zoom level \`5\`, the function will be re-evaluated according to the function, and the property's rendered value will change. (You can include fractional zoom levels in a layout property zoom function, and it will affect the generated values; but, still, the rendering will only change at integer zoom levels.)

**Property functions** allow the appearance of a map feature to change with its properties. Property functions can be used to visually differentiate types of features within the same layer or create data visualizations. Each stop is an array with two elements, the first is a property input value and the second is a function output value. Note that support for property functions is not available across all properties and platforms.

\`\`\`json
{
    "circle-color": {
        "property": "temperature",
        "stops": [
            // "temperature" is 0   -> circle color will be blue
            [0, 'blue'],
            // "temperature" is 100 -> circle color will be red
            [100, 'red']
        ]
    }
}
\`\`\`
`
  })), escape(createComponent(Markdown, {
    content: `
**Zoom-and-property functions** allow the appearance of a map feature to change with both its properties _and_ zoom. Each stop is an array with two elements, the first is an object with a property input value and a zoom, and the second is a function output value. Note that support for property functions is not yet complete.

\`\`\`json
{
    "circle-radius": {
        "property": "rating",
        "stops": [
            // zoom is 0 and "rating" is 0 -> circle radius will be 0px
            [{zoom: 0, value: 0}, 0],

            // zoom is 0 and "rating" is 5 -> circle radius will be 5px
            [{zoom: 0, value: 5}, 5],

            // zoom is 20 and "rating" is 0 -> circle radius will be 0px
            [{zoom: 20, value: 0}, 0],

            // zoom is 20 and "rating" is 5 -> circle radius will be 20px
            [{zoom: 20, value: 5}, 20]
        ]
    }
}
\`\`\`


## Other filter
`
  })), escape(createComponent(Caption, {
    theme: "warning",
    get children() {
      return createComponent(Markdown, {
        content: `
In previous versions of the style specification, [filters](/maplibre-gl-js-docs/style-spec/layers/#filter) were defined using the deprecated syntax documented below. Though filters defined with this syntax will continue to work, we recommend using the more flexible [expression](/maplibre-gl-js-docs/style-spec/expressions/) syntax instead. Expression syntax and the deprecated syntax below cannot be mixed in a single filter definition.
`
      });
    }
  })), escape(createComponent(Markdown, {
    content: `
### Existential filters

\`["has", \`key\`]\` \`feature[key]\` exists

\`["!has", \`key\`]\` \`feature[key]\` does not exist

### Comparison filters

\`["==", \`key\`, \`value\`]\` equality: \`feature[key]\` = \`value\`

\`["!=", \`key\`, \`value\`]\` inequality: \`feature[key]\` ≠ \`value\`

\`["&gt;", \`key\`, \`value\`]\` greater than: \`feature[key]\` > \`value\`

\`["&gt;=", \`key\`, \`value\`]\` greater than or equal: \`feature[key]\` ≥ \`value\`

\`["&lt;", \`key\`, \`value\`]\` less than: \`feature[key]\` &lt; \`value\`

\`["&lt;=", \`key\`, \`value\`]\` less than or equal: \`feature[key]\` ≤ \`value\`


### Set membership filters

\`["in", \`key\`, \`v0\`, ..., \`vn\`]\` set inclusion: \`feature[key]\` ∈ \{\`v0\`, ..., \`vn\`\}

\`["!in", \`key\`, \`v0\`, ..., \`vn\`]\` set exclusion: \`feature[key]\` ∉ \{ \`v0\`, ..., \`vn\`\}


### Combining filters

\`["all", \`f0\`, ..., \`fn\`]\` logical \`AND\`: \`f0\` ∧ ... ∧ \`fn\`

\`["any", \`f0\`, ..., \`fn\`]\` logical \`OR\`: \`f0\` ∨ ... ∨ \`fn\`

\`["none", \`f0\`, ..., \`fn\`]\` logical \`NOR\`: ¬\`f0\` ∧ ... ∧ ¬\`fn\`

A \`key\` must be a string that identifies a feature property, or one of the following special keys:

- \`"$type"\`: the feature type. This key may be used with the \`"=="\`,\`"!="\`, \`"in"\`, and \`"!in"\` operators. Possible values are \`"Point"\`,  \`"LineString"\`, and \`"Polygon"\`.
- \`"$id"\`: the feature identifier. This key may be used with the \`"=="\`,\`"!="\`, \`"has"\`, \`"!has"\`, \`"in"\`, and \`"!in"\` operators.

A \`value\` (and \`v0\`, ..., \`vn\` for set operators) must be a [string](/maplibre-gl-js-docs/style-spec/types/#string), [number](/maplibre-gl-js-docs/style-spec/types/#number), or [boolean](/maplibre-gl-js-docs/style-spec/types/#boolean) to compare the property value against.

Set membership filters are a compact and efficient way to test whether a field matches any of multiple values.

The comparison and set membership filters implement strictly-typed comparisons; for example, all of the following evaluate to false: \`0 &lt; "1"\`, \`2 == "2"\`, \`"true" in [true, false]\`.

The \`"all"\`, \`"any"\`, and \`"none"\` filter operators are used to create compound filters. The values \`f0\`, ..., \`fn\` must be filter expressions themselves.

\`\`\`json
["==", "$type", "LineString"]
\`\`\`

This filter requires that the \`class\` property of each feature is equal to either "street_major", "street_minor", or "street_limited".

\`\`\`json
["in", "class", "street_major", "street_minor", "street_limited"]\`
\`\`\`

The combining filter "all" takes the three other filters that follow it and requires all of them to be true for a feature to be included: a feature must have a  \`class\` equal to "street_limited", its \`admin_level\` must be greater than or equal to 3, and its type cannot be Polygon. You could change the combining filter to "any" to allow features matching any of those criteria to be included - features that are Polygons, but have a different \`class\` value, and so on.

\`\`\`json
[
    "all",
    ["==", "class", "street_limited"],
    [">=", "admin_level", 3],
    ["!in", "$type", "Polygon"]
]
\`\`\`
`
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0',
        android: '2.0.1',
        ios: '2.0.0',
        macos: '0.1.0'
      },
      '\`has\` / \`!has\`': {
        js: '0.19.0',
        android: '4.1.0',
        ios: '3.3.0',
        macos: '0.1.0'
      }
    }
  })));
}

const $version = 8;
const $root = {
	version: {
		required: true,
		type: "enum",
		values: [
			8
		],
		doc: "Style specification version number. Must be 8.",
		example: 8
	},
	name: {
		type: "string",
		doc: "A human-readable name for the style.",
		example: "Bright"
	},
	metadata: {
		type: "*",
		doc: "Arbitrary properties useful to track with the stylesheet, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'."
	},
	center: {
		type: "array",
		value: "number",
		doc: "Default map center in longitude and latitude.  The style center will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
		example: [
			-73.9749,
			40.7736
		]
	},
	zoom: {
		type: "number",
		doc: "Default zoom level.  The style zoom will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
		example: 12.5
	},
	bearing: {
		type: "number",
		"default": 0,
		period: 360,
		units: "degrees",
		doc: "Default bearing, in degrees. The bearing is the compass direction that is \"up\"; for example, a bearing of 90° orients the map so that east is up. This value will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
		example: 29
	},
	pitch: {
		type: "number",
		"default": 0,
		units: "degrees",
		doc: "Default pitch, in degrees. Zero is perpendicular to the surface, for a look straight down at the map, while a greater value like 60 looks ahead towards the horizon. The style pitch will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
		example: 50
	},
	light: {
		type: "light",
		doc: "The global light source.",
		example: {
			anchor: "viewport",
			color: "white",
			intensity: 0.4
		}
	},
	terrain: {
		type: "terrain",
		doc: "The terrain configuration.",
		example: {
			source: "raster-dem-source",
			exaggeration: 0.5
		}
	},
	sources: {
		required: true,
		type: "sources",
		doc: "Data source specifications.",
		example: {
			"maplibre-demotiles": {
				type: "vector",
				url: "https://demotiles.maplibre.org/tiles/tiles.json"
			}
		}
	},
	sprite: {
		type: "sprite",
		doc: "An array of `{id: 'my-sprite', url: 'https://example.com/sprite'} objects. Each object should represent a unique URL to load a sprite from and and a unique ID to use as a prefix when referencing images from that sprite (i.e. 'my-sprite:image'). All the URLs are internally extended to load both .json and .png files. If the `id` field is equal to 'default', the prefix is omitted (just 'image' instead of 'default:image'). All the IDs and URLs must be unique. For backwards compatibility, instead of an array, one can also provide a single string that represent a URL to load the sprite from. The images in this case won't be prefixed.",
		example: "https://api.maptiler.com/maps/openstreetmap/sprite"
	},
	glyphs: {
		type: "string",
		doc: "A URL template for loading signed-distance-field glyph sets in PBF format. The URL must include `{fontstack}` and `{range}` tokens. This property is required if any layer uses the `text-field` layout property. The URL must be absolute, containing the [scheme, authority and path components](https://en.wikipedia.org/wiki/URL#Syntax).",
		example: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
	},
	transition: {
		type: "transition",
		doc: "A global transition definition to use as a default across properties, to be used for timing transitions between one value and the next when no property-specific transition is set. Collision-based symbol fading is controlled independently of the style's `transition` property.",
		example: {
			duration: 300,
			delay: 0
		}
	},
	layers: {
		required: true,
		type: "array",
		value: "layer",
		doc: "Layers will be drawn in the order of this array.",
		example: [
			{
				id: "water",
				source: "mapbox-streets",
				"source-layer": "water",
				type: "fill",
				paint: {
					"fill-color": "#00ffff"
				}
			}
		]
	}
};
const sources = {
	"*": {
		type: "source",
		doc: "Specification of a data source. For vector and raster sources, either TileJSON or a URL to a TileJSON must be provided. For image and video sources, a URL must be provided. For GeoJSON sources, a URL or inline GeoJSON must be provided."
	}
};
const source = [
	"source_vector",
	"source_raster",
	"source_raster_dem",
	"source_geojson",
	"source_video",
	"source_image"
];
const source_vector = {
	type: {
		required: true,
		type: "enum",
		values: {
			vector: {
				doc: "A vector tile source."
			}
		},
		doc: "The type of the source."
	},
	url: {
		type: "string",
		doc: "A URL to a TileJSON resource. Supported protocols are `http:` and `https:`."
	},
	tiles: {
		type: "array",
		value: "string",
		doc: "An array of one or more tile source URLs, as in the TileJSON spec."
	},
	bounds: {
		type: "array",
		value: "number",
		length: 4,
		"default": [
			-180,
			-85.051129,
			180,
			85.051129
		],
		doc: "An array containing the longitude and latitude of the southwest and northeast corners of the source's bounding box in the following order: `[sw.lng, sw.lat, ne.lng, ne.lat]`. When this property is included in a source, no tiles outside of the given bounds are requested by MapLibre GL."
	},
	scheme: {
		type: "enum",
		values: {
			xyz: {
				doc: "Slippy map tilenames scheme."
			},
			tms: {
				doc: "OSGeo spec scheme."
			}
		},
		"default": "xyz",
		doc: "Influences the y direction of the tile coordinates. The global-mercator (aka Spherical Mercator) profile is assumed."
	},
	minzoom: {
		type: "number",
		"default": 0,
		doc: "Minimum zoom level for which tiles are available, as in the TileJSON spec."
	},
	maxzoom: {
		type: "number",
		"default": 22,
		doc: "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
	},
	attribution: {
		type: "string",
		doc: "Contains an attribution to be displayed when the map is shown to a user."
	},
	promoteId: {
		type: "promoteId",
		doc: "A property to use as a feature id (for feature state). Either a property name, or an object of the form `{<sourceLayer>: <propertyName>}`. If specified as a string for a vector tile source, the same property is used across all its source layers."
	},
	volatile: {
		type: "boolean",
		"default": false,
		doc: "A setting to determine whether a source's tiles are cached locally.",
		"sdk-support": {
			"basic functionality": {
				android: "9.3.0",
				ios: "5.10.0"
			}
		}
	},
	"*": {
		type: "*",
		doc: "Other keys to configure the data source."
	}
};
const source_raster = {
	type: {
		required: true,
		type: "enum",
		values: {
			raster: {
				doc: "A raster tile source."
			}
		},
		doc: "The type of the source."
	},
	url: {
		type: "string",
		doc: "A URL to a TileJSON resource. Supported protocols are `http:` and `https:`."
	},
	tiles: {
		type: "array",
		value: "string",
		doc: "An array of one or more tile source URLs, as in the TileJSON spec."
	},
	bounds: {
		type: "array",
		value: "number",
		length: 4,
		"default": [
			-180,
			-85.051129,
			180,
			85.051129
		],
		doc: "An array containing the longitude and latitude of the southwest and northeast corners of the source's bounding box in the following order: `[sw.lng, sw.lat, ne.lng, ne.lat]`. When this property is included in a source, no tiles outside of the given bounds are requested by MapLibre GL."
	},
	minzoom: {
		type: "number",
		"default": 0,
		doc: "Minimum zoom level for which tiles are available, as in the TileJSON spec."
	},
	maxzoom: {
		type: "number",
		"default": 22,
		doc: "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
	},
	tileSize: {
		type: "number",
		"default": 512,
		units: "pixels",
		doc: "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
	},
	scheme: {
		type: "enum",
		values: {
			xyz: {
				doc: "Slippy map tilenames scheme."
			},
			tms: {
				doc: "OSGeo spec scheme."
			}
		},
		"default": "xyz",
		doc: "Influences the y direction of the tile coordinates. The global-mercator (aka Spherical Mercator) profile is assumed."
	},
	attribution: {
		type: "string",
		doc: "Contains an attribution to be displayed when the map is shown to a user."
	},
	volatile: {
		type: "boolean",
		"default": false,
		doc: "A setting to determine whether a source's tiles are cached locally.",
		"sdk-support": {
			"basic functionality": {
				android: "9.3.0",
				ios: "5.10.0"
			}
		}
	},
	"*": {
		type: "*",
		doc: "Other keys to configure the data source."
	}
};
const source_raster_dem = {
	type: {
		required: true,
		type: "enum",
		values: {
			"raster-dem": {
				doc: "A RGB-encoded raster DEM source"
			}
		},
		doc: "The type of the source."
	},
	url: {
		type: "string",
		doc: "A URL to a TileJSON resource. Supported protocols are `http:` and `https:`."
	},
	tiles: {
		type: "array",
		value: "string",
		doc: "An array of one or more tile source URLs, as in the TileJSON spec."
	},
	bounds: {
		type: "array",
		value: "number",
		length: 4,
		"default": [
			-180,
			-85.051129,
			180,
			85.051129
		],
		doc: "An array containing the longitude and latitude of the southwest and northeast corners of the source's bounding box in the following order: `[sw.lng, sw.lat, ne.lng, ne.lat]`. When this property is included in a source, no tiles outside of the given bounds are requested by MapLibre GL."
	},
	minzoom: {
		type: "number",
		"default": 0,
		doc: "Minimum zoom level for which tiles are available, as in the TileJSON spec."
	},
	maxzoom: {
		type: "number",
		"default": 22,
		doc: "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
	},
	tileSize: {
		type: "number",
		"default": 512,
		units: "pixels",
		doc: "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
	},
	attribution: {
		type: "string",
		doc: "Contains an attribution to be displayed when the map is shown to a user."
	},
	encoding: {
		type: "enum",
		values: {
			terrarium: {
				doc: "Terrarium format PNG tiles. See https://aws.amazon.com/es/public-datasets/terrain/ for more info."
			},
			mapbox: {
				doc: "Mapbox Terrain RGB tiles. See https://www.mapbox.com/help/access-elevation-data/#mapbox-terrain-rgb for more info."
			}
		},
		"default": "mapbox",
		doc: "The encoding used by this source. Mapbox Terrain RGB is used by default"
	},
	volatile: {
		type: "boolean",
		"default": false,
		doc: "A setting to determine whether a source's tiles are cached locally.",
		"sdk-support": {
			"basic functionality": {
				android: "9.3.0",
				ios: "5.10.0"
			}
		}
	},
	"*": {
		type: "*",
		doc: "Other keys to configure the data source."
	}
};
const source_geojson = {
	type: {
		required: true,
		type: "enum",
		values: {
			geojson: {
				doc: "A GeoJSON data source."
			}
		},
		doc: "The data type of the GeoJSON source."
	},
	data: {
		required: true,
		type: "*",
		doc: "A URL to a GeoJSON file, or inline GeoJSON."
	},
	maxzoom: {
		type: "number",
		"default": 18,
		doc: "Maximum zoom level at which to create vector tiles (higher means greater detail at high zoom levels)."
	},
	attribution: {
		type: "string",
		doc: "Contains an attribution to be displayed when the map is shown to a user."
	},
	buffer: {
		type: "number",
		"default": 128,
		maximum: 512,
		minimum: 0,
		doc: "Size of the tile buffer on each side. A value of 0 produces no buffer. A value of 512 produces a buffer as wide as the tile itself. Larger values produce fewer rendering artifacts near tile edges and slower performance."
	},
	filter: {
		type: "*",
		doc: "An expression for filtering features prior to processing them for rendering."
	},
	tolerance: {
		type: "number",
		"default": 0.375,
		doc: "Douglas-Peucker simplification tolerance (higher means simpler geometries and faster performance)."
	},
	cluster: {
		type: "boolean",
		"default": false,
		doc: "If the data is a collection of point features, setting this to true clusters the points by radius into groups. Cluster groups become new `Point` features in the source with additional properties:\n * `cluster` Is `true` if the point is a cluster \n * `cluster_id` A unqiue id for the cluster to be used in conjunction with the [cluster inspection methods](https://www.mapbox.com/mapbox-gl-js/api/#geojsonsource#getclusterexpansionzoom)\n * `point_count` Number of original points grouped into this cluster\n * `point_count_abbreviated` An abbreviated point count"
	},
	clusterRadius: {
		type: "number",
		"default": 50,
		minimum: 0,
		doc: "Radius of each cluster if clustering is enabled. A value of 512 indicates a radius equal to the width of a tile."
	},
	clusterMaxZoom: {
		type: "number",
		doc: "Max zoom on which to cluster points if clustering is enabled. Defaults to one zoom less than maxzoom (so that last zoom features are not clustered). Clusters are re-evaluated at integer zoom levels so setting clusterMaxZoom to 14 means the clusters will be displayed until z15."
	},
	clusterMinPoints: {
		type: "number",
		doc: "Minimum number of points necessary to form a cluster if clustering is enabled. Defaults to `2`."
	},
	clusterProperties: {
		type: "*",
		doc: "An object defining custom properties on the generated clusters if clustering is enabled, aggregating values from clustered points. Has the form `{\"property_name\": [operator, map_expression]}`. `operator` is any expression function that accepts at least 2 operands (e.g. `\"+\"` or `\"max\"`) — it accumulates the property value from clusters/points the cluster contains; `map_expression` produces the value of a single point.\n\nExample: `{\"sum\": [\"+\", [\"get\", \"scalerank\"]]}`.\n\nFor more advanced use cases, in place of `operator`, you can use a custom reduce expression that references a special `[\"accumulated\"]` value, e.g.:\n`{\"sum\": [[\"+\", [\"accumulated\"], [\"get\", \"sum\"]], [\"get\", \"scalerank\"]]}`"
	},
	lineMetrics: {
		type: "boolean",
		"default": false,
		doc: "Whether to calculate line distance metrics. This is required for line layers that specify `line-gradient` values."
	},
	generateId: {
		type: "boolean",
		"default": false,
		doc: "Whether to generate ids for the geojson features. When enabled, the `feature.id` property will be auto assigned based on its index in the `features` array, over-writing any previous values."
	},
	promoteId: {
		type: "promoteId",
		doc: "A property to use as a feature id (for feature state). Either a property name, or an object of the form `{<sourceLayer>: <propertyName>}`."
	}
};
const source_video = {
	type: {
		required: true,
		type: "enum",
		values: {
			video: {
				doc: "A video data source."
			}
		},
		doc: "The data type of the video source."
	},
	urls: {
		required: true,
		type: "array",
		value: "string",
		doc: "URLs to video content in order of preferred format."
	},
	coordinates: {
		required: true,
		doc: "Corners of video specified in longitude, latitude pairs.",
		type: "array",
		length: 4,
		value: {
			type: "array",
			length: 2,
			value: "number",
			doc: "A single longitude, latitude pair."
		}
	}
};
const source_image = {
	type: {
		required: true,
		type: "enum",
		values: {
			image: {
				doc: "An image data source."
			}
		},
		doc: "The data type of the image source."
	},
	url: {
		required: true,
		type: "string",
		doc: "URL that points to an image."
	},
	coordinates: {
		required: true,
		doc: "Corners of image specified in longitude, latitude pairs.",
		type: "array",
		length: 4,
		value: {
			type: "array",
			length: 2,
			value: "number",
			doc: "A single longitude, latitude pair."
		}
	}
};
const layer = {
	id: {
		type: "string",
		doc: "Unique layer name.",
		required: true
	},
	type: {
		type: "enum",
		values: {
			fill: {
				doc: "A filled polygon with an optional stroked border.",
				"sdk-support": {
					"basic functionality": {
						js: "0.10.0",
						android: "2.0.1",
						ios: "2.0.0",
						macos: "0.1.0"
					}
				}
			},
			line: {
				doc: "A stroked line.",
				"sdk-support": {
					"basic functionality": {
						js: "0.10.0",
						android: "2.0.1",
						ios: "2.0.0",
						macos: "0.1.0"
					}
				}
			},
			symbol: {
				doc: "An icon or a text label.",
				"sdk-support": {
					"basic functionality": {
						js: "0.10.0",
						android: "2.0.1",
						ios: "2.0.0",
						macos: "0.1.0"
					}
				}
			},
			circle: {
				doc: "A filled circle.",
				"sdk-support": {
					"basic functionality": {
						js: "0.10.0",
						android: "2.0.1",
						ios: "2.0.0",
						macos: "0.1.0"
					}
				}
			},
			heatmap: {
				doc: "A heatmap.",
				"sdk-support": {
					"basic functionality": {
						js: "0.41.0",
						android: "6.0.0",
						ios: "4.0.0",
						macos: "0.7.0"
					}
				}
			},
			"fill-extrusion": {
				doc: "An extruded (3D) polygon.",
				"sdk-support": {
					"basic functionality": {
						js: "0.27.0",
						android: "5.1.0",
						ios: "3.6.0",
						macos: "0.5.0"
					}
				}
			},
			raster: {
				doc: "Raster map textures such as satellite imagery.",
				"sdk-support": {
					"basic functionality": {
						js: "0.10.0",
						android: "2.0.1",
						ios: "2.0.0",
						macos: "0.1.0"
					}
				}
			},
			hillshade: {
				doc: "Client-side hillshading visualization based on DEM data. Currently, the implementation only supports Mapbox Terrain RGB and Mapzen Terrarium tiles.",
				"sdk-support": {
					"basic functionality": {
						js: "0.43.0",
						android: "6.0.0",
						ios: "4.0.0",
						macos: "0.7.0"
					}
				}
			},
			background: {
				doc: "The background color or pattern of the map.",
				"sdk-support": {
					"basic functionality": {
						js: "0.10.0",
						android: "2.0.1",
						ios: "2.0.0",
						macos: "0.1.0"
					}
				}
			}
		},
		doc: "Rendering type of this layer.",
		required: true
	},
	metadata: {
		type: "*",
		doc: "Arbitrary properties useful to track with the layer, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'."
	},
	source: {
		type: "string",
		doc: "Name of a source description to be used for this layer. Required for all layer types except `background`."
	},
	"source-layer": {
		type: "string",
		doc: "Layer to use from a vector tile source. Required for vector tile sources; prohibited for all other source types, including GeoJSON sources."
	},
	minzoom: {
		type: "number",
		minimum: 0,
		maximum: 24,
		doc: "The minimum zoom level for the layer. At zoom levels less than the minzoom, the layer will be hidden."
	},
	maxzoom: {
		type: "number",
		minimum: 0,
		maximum: 24,
		doc: "The maximum zoom level for the layer. At zoom levels equal to or greater than the maxzoom, the layer will be hidden."
	},
	filter: {
		type: "filter",
		doc: "A expression specifying conditions on source features. Only features that match the filter are displayed. Zoom expressions in filters are only evaluated at integer zoom levels. The `feature-state` expression is not supported in filter expressions."
	},
	layout: {
		type: "layout",
		doc: "Layout properties for the layer."
	},
	paint: {
		type: "paint",
		doc: "Default paint properties for this layer."
	}
};
const layout = [
	"layout_fill",
	"layout_line",
	"layout_circle",
	"layout_heatmap",
	"layout_fill-extrusion",
	"layout_symbol",
	"layout_raster",
	"layout_hillshade",
	"layout_background"
];
const layout_background = {
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_fill = {
	"fill-sort-key": {
		type: "number",
		doc: "Sorts features in ascending order based on this value. Features with a higher sort key will appear above features with a lower sort key.",
		"sdk-support": {
			"basic functionality": {
				js: "1.2.0",
				android: "9.1.0",
				ios: "5.8.0",
				macos: "0.15.0"
			},
			"data-driven styling": {
				js: "1.2.0",
				android: "9.1.0",
				ios: "5.8.0",
				macos: "0.15.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_circle = {
	"circle-sort-key": {
		type: "number",
		doc: "Sorts features in ascending order based on this value. Features with a higher sort key will appear above features with a lower sort key.",
		"sdk-support": {
			"basic functionality": {
				js: "1.2.0",
				android: "9.2.0",
				ios: "5.9.0",
				macos: "0.16.0"
			},
			"data-driven styling": {
				js: "1.2.0",
				android: "9.2.0",
				ios: "5.9.0",
				macos: "0.16.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_heatmap = {
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_line = {
	"line-cap": {
		type: "enum",
		values: {
			butt: {
				doc: "A cap with a squared-off end which is drawn to the exact endpoint of the line."
			},
			round: {
				doc: "A cap with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line."
			},
			square: {
				doc: "A cap with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width."
			}
		},
		"default": "butt",
		doc: "The display of line endings.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"line-join": {
		type: "enum",
		values: {
			bevel: {
				doc: "A join with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width."
			},
			round: {
				doc: "A join with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line."
			},
			miter: {
				doc: "A join with a sharp, angled corner which is drawn with the outer sides beyond the endpoint of the path until they meet."
			}
		},
		"default": "miter",
		doc: "The display of lines when joining.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.40.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"line-miter-limit": {
		type: "number",
		"default": 2,
		doc: "Used to automatically convert miter joins to bevel joins for sharp angles.",
		requires: [
			{
				"line-join": "miter"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"line-round-limit": {
		type: "number",
		"default": 1.05,
		doc: "Used to automatically convert round joins to miter joins for shallow angles.",
		requires: [
			{
				"line-join": "round"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"line-sort-key": {
		type: "number",
		doc: "Sorts features in ascending order based on this value. Features with a higher sort key will appear above features with a lower sort key.",
		"sdk-support": {
			"basic functionality": {
				js: "1.2.0",
				android: "9.1.0",
				ios: "5.8.0",
				macos: "0.15.0"
			},
			"data-driven styling": {
				js: "1.2.0",
				android: "9.1.0",
				ios: "5.8.0",
				macos: "0.15.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_symbol = {
	"symbol-placement": {
		type: "enum",
		values: {
			point: {
				doc: "The label is placed at the point where the geometry is located."
			},
			line: {
				doc: "The label is placed along the line of the geometry. Can only be used on `LineString` and `Polygon` geometries."
			},
			"line-center": {
				doc: "The label is placed at the center of the line of the geometry. Can only be used on `LineString` and `Polygon` geometries. Note that a single feature in a vector tile may contain multiple line geometries."
			}
		},
		"default": "point",
		doc: "Label placement relative to its geometry.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"`line-center` value": {
				js: "0.47.0",
				android: "6.4.0",
				ios: "4.3.0",
				macos: "0.10.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"symbol-spacing": {
		type: "number",
		"default": 250,
		minimum: 1,
		units: "pixels",
		doc: "Distance between two symbol anchors.",
		requires: [
			{
				"symbol-placement": "line"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"symbol-avoid-edges": {
		type: "boolean",
		"default": false,
		doc: "If true, the symbols will not cross tile edges to avoid mutual collisions. Recommended in layers that don't have enough padding in the vector tile to prevent collisions, or if it is a point symbol layer placed after a line symbol layer. When using a client that supports global collision detection, like MapLibre GL JS version 0.42.0 or greater, enabling this property is not needed to prevent clipped labels at tile boundaries.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"symbol-sort-key": {
		type: "number",
		doc: "Sorts features in ascending order based on this value. Features with lower sort keys are drawn and placed first.  When `icon-allow-overlap` or `text-allow-overlap` is `false`, features with a lower sort key will have priority during placement. When `icon-allow-overlap` or `text-allow-overlap` is set to `true`, features with a higher sort key will overlap over features with a lower sort key.",
		"sdk-support": {
			"basic functionality": {
				js: "0.53.0",
				android: "7.4.0",
				ios: "4.11.0",
				macos: "0.14.0"
			},
			"data-driven styling": {
				js: "0.53.0",
				android: "7.4.0",
				ios: "4.11.0",
				macos: "0.14.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"symbol-z-order": {
		type: "enum",
		values: {
			auto: {
				doc: "Sorts symbols by `symbol-sort-key` if set. Otherwise, sorts symbols by their y-position relative to the viewport if `icon-allow-overlap` or `text-allow-overlap` is set to `true` or `icon-ignore-placement` or `text-ignore-placement` is `false`."
			},
			"viewport-y": {
				doc: "Sorts symbols by their y-position relative to the viewport if `icon-allow-overlap` or `text-allow-overlap` is set to `true` or `icon-ignore-placement` or `text-ignore-placement` is `false`."
			},
			source: {
				doc: "Sorts symbols by `symbol-sort-key` if set. Otherwise, no sorting is applied; symbols are rendered in the same order as the source data."
			}
		},
		"default": "auto",
		doc: "Determines whether overlapping symbols in the same layer are rendered in the order that they appear in the data source or by their y-position relative to the viewport. To control the order and prioritization of symbols otherwise, use `symbol-sort-key`.",
		"sdk-support": {
			"basic functionality": {
				js: "0.49.0",
				android: "6.6.0",
				ios: "4.5.0",
				macos: "0.12.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-allow-overlap": {
		type: "boolean",
		"default": false,
		doc: "If true, the icon will be visible even if it collides with other previously drawn symbols.",
		requires: [
			"icon-image",
			{
				"!": "icon-overlap"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-overlap": {
		type: "enum",
		values: {
			never: {
				doc: "The icon will be hidden if it collides with any other previously drawn symbol."
			},
			always: {
				doc: "The icon will be visible even if it collides with any other previously drawn symbol."
			},
			cooperative: {
				doc: "If the icon collides with another previously drawn symbol, the overlap mode for that symbol is checked. If the previous symbol was placed using `never` overlap mode, the new icon is hidden. If the previous symbol was placed using `always` or `cooperative` overlap mode, the new icon is visible."
			}
		},
		doc: "Allows for control over whether to show an icon when it overlaps other symbols on the map. If `icon-overlap` is not set, `icon-allow-overlap` is used instead.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "2.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-ignore-placement": {
		type: "boolean",
		"default": false,
		doc: "If true, other symbols can be visible even if they collide with the icon.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-optional": {
		type: "boolean",
		"default": false,
		doc: "If true, text will display without their corresponding icons when the icon collides with other symbols and the text does not.",
		requires: [
			"icon-image",
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-rotation-alignment": {
		type: "enum",
		values: {
			map: {
				doc: "When `symbol-placement` is set to `point`, aligns icons east-west. When `symbol-placement` is set to `line` or `line-center`, aligns icon x-axes with the line."
			},
			viewport: {
				doc: "Produces icons whose x-axes are aligned with the x-axis of the viewport, regardless of the value of `symbol-placement`."
			},
			auto: {
				doc: "When `symbol-placement` is set to `point`, this is equivalent to `viewport`. When `symbol-placement` is set to `line` or `line-center`, this is equivalent to `map`."
			}
		},
		"default": "auto",
		doc: "In combination with `symbol-placement`, determines the rotation behavior of icons.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"`auto` value": {
				js: "0.25.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.3.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-size": {
		type: "number",
		"default": 1,
		minimum: 0,
		units: "factor of the original icon size",
		doc: "Scales the original size of the icon by the provided factor. The new pixel size of the image will be the original pixel size multiplied by `icon-size`. 1 is the original size; 3 triples the size of the image.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.35.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"icon-text-fit": {
		type: "enum",
		values: {
			none: {
				doc: "The icon is displayed at its intrinsic aspect ratio."
			},
			width: {
				doc: "The icon is scaled in the x-dimension to fit the width of the text."
			},
			height: {
				doc: "The icon is scaled in the y-dimension to fit the height of the text."
			},
			both: {
				doc: "The icon is scaled in both x- and y-dimensions."
			}
		},
		"default": "none",
		doc: "Scales the icon to fit around the associated text.",
		requires: [
			"icon-image",
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.21.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.2.1"
			},
			"stretchable icons": {
				js: "1.6.0",
				android: "9.2.0",
				ios: "5.8.0",
				macos: "0.15.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-text-fit-padding": {
		type: "array",
		value: "number",
		length: 4,
		"default": [
			0,
			0,
			0,
			0
		],
		units: "pixels",
		doc: "Size of the additional area added to dimensions determined by `icon-text-fit`, in clockwise order: top, right, bottom, left.",
		requires: [
			"icon-image",
			"text-field",
			{
				"icon-text-fit": [
					"both",
					"width",
					"height"
				]
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.21.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.2.1"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-image": {
		type: "resolvedImage",
		doc: "Name of image in sprite to use for drawing an image background.",
		tokens: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.35.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"icon-rotate": {
		type: "number",
		"default": 0,
		period: 360,
		units: "degrees",
		doc: "Rotates the icon clockwise.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.21.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"icon-padding": {
		type: "padding",
		"default": [
			2
		],
		units: "pixels",
		doc: "Size of additional area round the icon bounding box used for detecting symbol collisions. Values are declared using CSS margin shorthand syntax: a single value applies to all four sides; two values apply to [top/bottom, left/right]; three values apply to [top, left/right, bottom]; four values apply to [top, right, bottom, left]. For backwards compatibility, a single bare number is accepted, and treated the same as a one-element array - padding applied to all sides.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "2.2.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"icon-keep-upright": {
		type: "boolean",
		"default": false,
		doc: "If true, the icon may be flipped to prevent it from being rendered upside-down.",
		requires: [
			"icon-image",
			{
				"icon-rotation-alignment": "map"
			},
			{
				"symbol-placement": [
					"line",
					"line-center"
				]
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-offset": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		doc: "Offset distance of icon from its anchor. Positive values indicate right and down, while negative values indicate left and up. Each component is multiplied by the value of `icon-size` to obtain the final offset in pixels. When combined with `icon-rotate` the offset will be as if the rotated direction was up.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"icon-anchor": {
		type: "enum",
		values: {
			center: {
				doc: "The center of the icon is placed closest to the anchor."
			},
			left: {
				doc: "The left side of the icon is placed closest to the anchor."
			},
			right: {
				doc: "The right side of the icon is placed closest to the anchor."
			},
			top: {
				doc: "The top of the icon is placed closest to the anchor."
			},
			bottom: {
				doc: "The bottom of the icon is placed closest to the anchor."
			},
			"top-left": {
				doc: "The top left corner of the icon is placed closest to the anchor."
			},
			"top-right": {
				doc: "The top right corner of the icon is placed closest to the anchor."
			},
			"bottom-left": {
				doc: "The bottom left corner of the icon is placed closest to the anchor."
			},
			"bottom-right": {
				doc: "The bottom right corner of the icon is placed closest to the anchor."
			}
		},
		"default": "center",
		doc: "Part of the icon placed closest to the anchor.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.40.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			},
			"data-driven styling": {
				js: "0.40.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"icon-pitch-alignment": {
		type: "enum",
		values: {
			map: {
				doc: "The icon is aligned to the plane of the map."
			},
			viewport: {
				doc: "The icon is aligned to the plane of the viewport."
			},
			auto: {
				doc: "Automatically matches the value of `icon-rotation-alignment`."
			}
		},
		"default": "auto",
		doc: "Orientation of icon when map is pitched.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.39.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-pitch-alignment": {
		type: "enum",
		values: {
			map: {
				doc: "The text is aligned to the plane of the map."
			},
			viewport: {
				doc: "The text is aligned to the plane of the viewport."
			},
			auto: {
				doc: "Automatically matches the value of `text-rotation-alignment`."
			}
		},
		"default": "auto",
		doc: "Orientation of text when map is pitched.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.21.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.2.1"
			},
			"`auto` value": {
				js: "0.25.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.3.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-rotation-alignment": {
		type: "enum",
		values: {
			map: {
				doc: "When `symbol-placement` is set to `point`, aligns text east-west. When `symbol-placement` is set to `line` or `line-center`, aligns text x-axes with the line."
			},
			viewport: {
				doc: "Produces glyphs whose x-axes are aligned with the x-axis of the viewport, regardless of the value of `symbol-placement`."
			},
			"viewport-glyph": {
				doc: "When `symbol-placement` is set to `point`, aligns text to the x-axis of the viewport. When `symbol-placement` is set to `line` or `line-center`, aligns glyphs to the x-axis of the viewport and places them along the line."
			},
			auto: {
				doc: "When `symbol-placement` is set to `point`, this is equivalent to `viewport`. When `symbol-placement` is set to `line` or `line-center`, this is equivalent to `map`."
			}
		},
		"default": "auto",
		doc: "In combination with `symbol-placement`, determines the rotation behavior of the individual glyphs forming the text.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"`auto` value": {
				js: "0.25.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.3.0"
			},
			"`viewport-glyph` value": {
				js: "2.1.8"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-field": {
		type: "formatted",
		"default": "",
		tokens: true,
		doc: "Value to use for a text label. If a plain `string` is provided, it will be treated as a `formatted` with default/inherited formatting options.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-font": {
		type: "array",
		value: "string",
		"default": [
			"Open Sans Regular",
			"Arial Unicode MS Regular"
		],
		doc: "Font stack to use for displaying text.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-size": {
		type: "number",
		"default": 16,
		minimum: 0,
		units: "pixels",
		doc: "Font size.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.35.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-max-width": {
		type: "number",
		"default": 10,
		minimum: 0,
		units: "ems",
		doc: "The maximum line width for text wrapping.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.40.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-line-height": {
		type: "number",
		"default": 1.2,
		units: "ems",
		doc: "Text leading value for multi-line text.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-letter-spacing": {
		type: "number",
		"default": 0,
		units: "ems",
		doc: "Text tracking amount.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.40.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-justify": {
		type: "enum",
		values: {
			auto: {
				doc: "The text is aligned towards the anchor position."
			},
			left: {
				doc: "The text is aligned to the left."
			},
			center: {
				doc: "The text is centered."
			},
			right: {
				doc: "The text is aligned to the right."
			}
		},
		"default": "center",
		doc: "Text justification options.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.39.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			},
			auto: {
				js: "0.54.0",
				android: "7.4.0",
				ios: "4.10.0",
				macos: "0.14.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-radial-offset": {
		type: "number",
		units: "ems",
		"default": 0,
		doc: "Radial offset of text, in the direction of the symbol's anchor. Useful in combination with `text-variable-anchor`, which defaults to using the two-dimensional `text-offset` if present.",
		"sdk-support": {
			"basic functionality": {
				js: "0.54.0",
				android: "7.4.0",
				ios: "4.10.0",
				macos: "0.14.0"
			},
			"data-driven styling": {
				js: "0.54.0",
				android: "7.4.0",
				ios: "4.10.0",
				macos: "0.14.0"
			}
		},
		requires: [
			"text-field"
		],
		"property-type": "data-driven",
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		}
	},
	"text-variable-anchor": {
		type: "array",
		value: "enum",
		values: {
			center: {
				doc: "The center of the text is placed closest to the anchor."
			},
			left: {
				doc: "The left side of the text is placed closest to the anchor."
			},
			right: {
				doc: "The right side of the text is placed closest to the anchor."
			},
			top: {
				doc: "The top of the text is placed closest to the anchor."
			},
			bottom: {
				doc: "The bottom of the text is placed closest to the anchor."
			},
			"top-left": {
				doc: "The top left corner of the text is placed closest to the anchor."
			},
			"top-right": {
				doc: "The top right corner of the text is placed closest to the anchor."
			},
			"bottom-left": {
				doc: "The bottom left corner of the text is placed closest to the anchor."
			},
			"bottom-right": {
				doc: "The bottom right corner of the text is placed closest to the anchor."
			}
		},
		requires: [
			"text-field",
			{
				"symbol-placement": [
					"point"
				]
			}
		],
		doc: "To increase the chance of placing high-priority labels on the map, you can provide an array of `text-anchor` locations: the renderer will attempt to place the label at each location, in order, before moving onto the next label. Use `text-justify: auto` to choose justification based on anchor position. To apply an offset, use the `text-radial-offset` or the two-dimensional `text-offset`.",
		"sdk-support": {
			"basic functionality": {
				js: "0.54.0",
				android: "7.4.0",
				ios: "4.10.0",
				macos: "0.14.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-anchor": {
		type: "enum",
		values: {
			center: {
				doc: "The center of the text is placed closest to the anchor."
			},
			left: {
				doc: "The left side of the text is placed closest to the anchor."
			},
			right: {
				doc: "The right side of the text is placed closest to the anchor."
			},
			top: {
				doc: "The top of the text is placed closest to the anchor."
			},
			bottom: {
				doc: "The bottom of the text is placed closest to the anchor."
			},
			"top-left": {
				doc: "The top left corner of the text is placed closest to the anchor."
			},
			"top-right": {
				doc: "The top right corner of the text is placed closest to the anchor."
			},
			"bottom-left": {
				doc: "The bottom left corner of the text is placed closest to the anchor."
			},
			"bottom-right": {
				doc: "The bottom right corner of the text is placed closest to the anchor."
			}
		},
		"default": "center",
		doc: "Part of the text placed closest to the anchor.",
		requires: [
			"text-field",
			{
				"!": "text-variable-anchor"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.39.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-max-angle": {
		type: "number",
		"default": 45,
		units: "degrees",
		doc: "Maximum angle change between adjacent characters.",
		requires: [
			"text-field",
			{
				"symbol-placement": [
					"line",
					"line-center"
				]
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-writing-mode": {
		type: "array",
		value: "enum",
		values: {
			horizontal: {
				doc: "If a text's language supports horizontal writing mode, symbols with point placement would be laid out horizontally."
			},
			vertical: {
				doc: "If a text's language supports vertical writing mode, symbols with point placement would be laid out vertically."
			}
		},
		doc: "The property allows control over a symbol's orientation. Note that the property values act as a hint, so that a symbol whose language doesn’t support the provided orientation will be laid out in its natural orientation. Example: English point symbol will be rendered horizontally even if array value contains single 'vertical' enum value. The order of elements in an array define priority order for the placement of an orientation variant.",
		requires: [
			"text-field",
			{
				"symbol-placement": [
					"point"
				]
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "1.3.0",
				android: "8.3.0",
				ios: "5.3.0",
				macos: "0.15.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-rotate": {
		type: "number",
		"default": 0,
		period: 360,
		units: "degrees",
		doc: "Rotates the text clockwise.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.35.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-padding": {
		type: "number",
		"default": 2,
		minimum: 0,
		units: "pixels",
		doc: "Size of the additional area around the text bounding box used for detecting symbol collisions.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-keep-upright": {
		type: "boolean",
		"default": true,
		doc: "If true, the text may be flipped vertically to prevent it from being rendered upside-down.",
		requires: [
			"text-field",
			{
				"text-rotation-alignment": "map"
			},
			{
				"symbol-placement": [
					"line",
					"line-center"
				]
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-transform": {
		type: "enum",
		values: {
			none: {
				doc: "The text is not altered."
			},
			uppercase: {
				doc: "Forces all letters to be displayed in uppercase."
			},
			lowercase: {
				doc: "Forces all letters to be displayed in lowercase."
			}
		},
		"default": "none",
		doc: "Specifies how to capitalize text, similar to the CSS `text-transform` property.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-offset": {
		type: "array",
		doc: "Offset distance of text from its anchor. Positive values indicate right and down, while negative values indicate left and up. If used with text-variable-anchor, input values will be taken as absolute values. Offsets along the x- and y-axis will be applied automatically based on the anchor position.",
		value: "number",
		units: "ems",
		length: 2,
		"default": [
			0,
			0
		],
		requires: [
			"text-field",
			{
				"!": "text-radial-offset"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.35.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "data-driven"
	},
	"text-allow-overlap": {
		type: "boolean",
		"default": false,
		doc: "If true, the text will be visible even if it collides with other previously drawn symbols.",
		requires: [
			"text-field",
			{
				"!": "text-overlap"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-overlap": {
		type: "enum",
		values: {
			never: {
				doc: "The text will be hidden if it collides with any other previously drawn symbol."
			},
			always: {
				doc: "The text will be visible even if it collides with any other previously drawn symbol."
			},
			cooperative: {
				doc: "If the text collides with another previously drawn symbol, the overlap mode for that symbol is checked. If the previous symbol was placed using `never` overlap mode, the new text is hidden. If the previous symbol was placed using `always` or `cooperative` overlap mode, the new text is visible."
			}
		},
		doc: "Allows for control over whether to show symbol text when it overlaps other symbols on the map. If `text-overlap` is not set, `text-allow-overlap` is used instead",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "2.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-ignore-placement": {
		type: "boolean",
		"default": false,
		doc: "If true, other symbols can be visible even if they collide with the text.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-optional": {
		type: "boolean",
		"default": false,
		doc: "If true, icons will display without their corresponding text when the text collides with other symbols and the icon does not.",
		requires: [
			"text-field",
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_raster = {
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		"property-type": "constant"
	}
};
const layout_hillshade = {
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		"property-type": "constant"
	}
};
const filter = {
	type: "array",
	value: "*",
	doc: "A filter selects specific features from a layer."
};
const filter_operator = {
	type: "enum",
	values: {
		"==": {
			doc: "`[\"==\", key, value]` equality: `feature[key] = value`"
		},
		"!=": {
			doc: "`[\"!=\", key, value]` inequality: `feature[key] ≠ value`"
		},
		">": {
			doc: "`[\">\", key, value]` greater than: `feature[key] > value`"
		},
		">=": {
			doc: "`[\">=\", key, value]` greater than or equal: `feature[key] ≥ value`"
		},
		"<": {
			doc: "`[\"<\", key, value]` less than: `feature[key] < value`"
		},
		"<=": {
			doc: "`[\"<=\", key, value]` less than or equal: `feature[key] ≤ value`"
		},
		"in": {
			doc: "`[\"in\", key, v0, ..., vn]` set inclusion: `feature[key] ∈ {v0, ..., vn}`"
		},
		"!in": {
			doc: "`[\"!in\", key, v0, ..., vn]` set exclusion: `feature[key] ∉ {v0, ..., vn}`"
		},
		all: {
			doc: "`[\"all\", f0, ..., fn]` logical `AND`: `f0 ∧ ... ∧ fn`"
		},
		any: {
			doc: "`[\"any\", f0, ..., fn]` logical `OR`: `f0 ∨ ... ∨ fn`"
		},
		none: {
			doc: "`[\"none\", f0, ..., fn]` logical `NOR`: `¬f0 ∧ ... ∧ ¬fn`"
		},
		has: {
			doc: "`[\"has\", key]` `feature[key]` exists"
		},
		"!has": {
			doc: "`[\"!has\", key]` `feature[key]` does not exist"
		},
		within: {
			doc: "`[\"within\", object]` feature geometry is within object geometry"
		}
	},
	doc: "The filter operator."
};
const geometry_type = {
	type: "enum",
	values: {
		Point: {
			doc: "Filter to point geometries."
		},
		LineString: {
			doc: "Filter to line geometries."
		},
		Polygon: {
			doc: "Filter to polygon geometries."
		}
	},
	doc: "The geometry type for the filter to select."
};
const function_stop = {
	type: "array",
	minimum: 0,
	maximum: 24,
	value: [
		"number",
		"color"
	],
	length: 2,
	doc: "Zoom level and value pair."
};
const expression = {
	type: "array",
	value: "*",
	minimum: 1,
	doc: "An expression defines a function that can be used for data-driven style properties or feature filters."
};
const expression_name = {
	doc: "",
	type: "enum",
	values: {
		"let": {
			doc: "Binds expressions to named variables, which can then be referenced in the result expression using [\"var\", \"variable_name\"].",
			group: "Variable binding",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"var": {
			doc: "References variable bound using \"let\".",
			group: "Variable binding",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		literal: {
			doc: "Provides a literal array or object value.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		array: {
			doc: "Asserts that the input is an array (optionally with a specific item type and length).  If, when the input expression is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		at: {
			doc: "Retrieves an item from an array.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"in": {
			doc: "Determines whether an item exists in an array or a substring exists in a string.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "1.6.0",
					android: "9.1.0",
					ios: "5.8.0",
					macos: "0.15.0"
				}
			}
		},
		"index-of": {
			doc: "Returns the first position at which an item can be found in an array or a substring can be found in a string, or `-1` if the input cannot be found. Accepts an optional index from where to begin the search.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "1.10.0"
				}
			}
		},
		slice: {
			doc: "Returns an item from an array or a substring from a string from a specified start index, or between a start index and an end index if set. The return value is inclusive of the start index but not of the end index.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "1.10.0"
				}
			}
		},
		"case": {
			doc: "Selects the first output whose corresponding test condition evaluates to true, or the fallback value otherwise.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		match: {
			doc: "Selects the output whose label value matches the input value, or the fallback value if no match is found. The input can be any expression (e.g. `[\"get\", \"building_type\"]`). Each label must be either:\n - a single literal value; or\n - an array of literal values, whose values must be all strings or all numbers (e.g. `[100, 101]` or `[\"c\", \"b\"]`). The input matches if any of the values in the array matches, similar to the `\"in\"` operator.\nEach label must be unique. If the input type does not match the type of the labels, the result will be the fallback value.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		coalesce: {
			doc: "Evaluates each expression in turn until the first non-null value is obtained, and returns that value.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		step: {
			doc: "Produces discrete, stepped results by evaluating a piecewise-constant function defined by pairs of input and output values (\"stops\"). The `input` may be any numeric expression (e.g., `[\"get\", \"population\"]`). Stop inputs must be numeric literals in strictly ascending order. Returns the output value of the stop just less than the input, or the first output if the input is less than the first stop.",
			group: "Ramps, scales, curves",
			"sdk-support": {
				"basic functionality": {
					js: "0.42.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		interpolate: {
			doc: "Produces continuous, smooth results by interpolating between pairs of input and output values (\"stops\"). The `input` may be any numeric expression (e.g., `[\"get\", \"population\"]`). Stop inputs must be numeric literals in strictly ascending order. The output type must be `number`, `array<number>`, or `color`.\n\nInterpolation types:\n- `[\"linear\"]`, or an expression returning one of those types: Interpolates linearly between the pair of stops just less than and just greater than the input.\n- `[\"exponential\", base]`: Interpolates exponentially between the stops just less than and just greater than the input. `base` controls the rate at which the output increases: higher values make the output increase more towards the high end of the range. With values close to 1 the output increases linearly.\n- `[\"cubic-bezier\", x1, y1, x2, y2]`: Interpolates using the cubic bezier curve defined by the given control points.",
			group: "Ramps, scales, curves",
			"sdk-support": {
				"basic functionality": {
					js: "0.42.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"interpolate-hcl": {
			doc: "Produces continuous, smooth results by interpolating between pairs of input and output values (\"stops\"). Works like `interpolate`, but the output type must be `color`, and the interpolation is performed in the Hue-Chroma-Luminance color space.",
			group: "Ramps, scales, curves",
			"sdk-support": {
				"basic functionality": {
					js: "0.49.0"
				}
			}
		},
		"interpolate-lab": {
			doc: "Produces continuous, smooth results by interpolating between pairs of input and output values (\"stops\"). Works like `interpolate`, but the output type must be `color`, and the interpolation is performed in the CIELAB color space.",
			group: "Ramps, scales, curves",
			"sdk-support": {
				"basic functionality": {
					js: "0.49.0"
				}
			}
		},
		ln2: {
			doc: "Returns mathematical constant ln(2).",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		pi: {
			doc: "Returns the mathematical constant pi.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		e: {
			doc: "Returns the mathematical constant e.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"typeof": {
			doc: "Returns a string describing the type of the given value.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		string: {
			doc: "Asserts that the input value is a string. If multiple values are provided, each one is evaluated in order until a string is obtained. If none of the inputs are strings, the expression is an error.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		number: {
			doc: "Asserts that the input value is a number. If multiple values are provided, each one is evaluated in order until a number is obtained. If none of the inputs are numbers, the expression is an error.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		boolean: {
			doc: "Asserts that the input value is a boolean. If multiple values are provided, each one is evaluated in order until a boolean is obtained. If none of the inputs are booleans, the expression is an error.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		object: {
			doc: "Asserts that the input value is an object. If multiple values are provided, each one is evaluated in order until an object is obtained. If none of the inputs are objects, the expression is an error.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		collator: {
			doc: "Returns a `collator` for use in locale-dependent comparison operations. The `case-sensitive` and `diacritic-sensitive` options default to `false`. The `locale` argument specifies the IETF language tag of the locale to use. If none is provided, the default locale is used. If the requested locale is not available, the `collator` will use a system-defined fallback locale. Use `resolved-locale` to test the results of locale fallback behavior.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		format: {
			doc: "Returns a `formatted` string for displaying mixed-format text in the `text-field` property. The input may contain a string literal or expression, including an [`'image'`](#types-image) expression. Strings may be followed by a style override object that supports the following properties:\n- `\"text-font\"`: Overrides the font stack specified by the root layout property.\n- `\"text-color\"`: Overrides the color specified by the root paint property.\n- `\"font-scale\"`: Applies a scaling factor on `text-size` as specified by the root layout property.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.48.0",
					android: "6.7.0",
					ios: "4.6.0",
					macos: "0.12.0"
				},
				"text-font": {
					js: "0.48.0",
					android: "6.7.0",
					ios: "4.6.0",
					macos: "0.12.0"
				},
				"font-scale": {
					js: "0.48.0",
					android: "6.7.0",
					ios: "4.6.0",
					macos: "0.12.0"
				},
				"text-color": {
					js: "1.3.0",
					android: "7.3.0",
					ios: "4.10.0",
					macos: "0.14.0"
				},
				image: {
					js: "1.6.0",
					android: "8.6.0",
					ios: "5.7.0",
					macos: "0.15.0"
				}
			}
		},
		image: {
			doc: "Returns an `image` type for use in `icon-image`, `*-pattern` entries and as a section in the `format` expression. If set, the `image` argument will check that the requested image exists in the style and will return either the resolved image name or `null`, depending on whether or not the image is currently in the style. This validation process is synchronous and requires the image to have been added to the style before requesting it in the `image` argument.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "1.4.0",
					android: "8.6.0",
					ios: "5.7.0",
					macos: "0.15.0"
				}
			}
		},
		"number-format": {
			doc: "Converts the input number into a string representation using the providing formatting rules. If set, the `locale` argument specifies the locale to use, as a BCP 47 language tag. If set, the `currency` argument specifies an ISO 4217 code to use for currency-style formatting. If set, the `min-fraction-digits` and `max-fraction-digits` arguments specify the minimum and maximum number of fractional digits to include.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.54.0"
				}
			}
		},
		"to-string": {
			doc: "Converts the input value to a string. If the input is `null`, the result is `\"\"`. If the input is a boolean, the result is `\"true\"` or `\"false\"`. If the input is a number, it is converted to a string as specified by the [\"NumberToString\" algorithm](https://tc39.github.io/ecma262/#sec-tostring-applied-to-the-number-type) of the ECMAScript Language Specification. If the input is a color, it is converted to a string of the form `\"rgba(r,g,b,a)\"`, where `r`, `g`, and `b` are numerals ranging from 0 to 255, and `a` ranges from 0 to 1. Otherwise, the input is converted to a string in the format specified by the [`JSON.stringify`](https://tc39.github.io/ecma262/#sec-json.stringify) function of the ECMAScript Language Specification.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"to-number": {
			doc: "Converts the input value to a number, if possible. If the input is `null` or `false`, the result is 0. If the input is `true`, the result is 1. If the input is a string, it is converted to a number as specified by the [\"ToNumber Applied to the String Type\" algorithm](https://tc39.github.io/ecma262/#sec-tonumber-applied-to-the-string-type) of the ECMAScript Language Specification. If multiple values are provided, each one is evaluated in order until the first successful conversion is obtained. If none of the inputs can be converted, the expression is an error.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"to-boolean": {
			doc: "Converts the input value to a boolean. The result is `false` when then input is an empty string, 0, `false`, `null`, or `NaN`; otherwise it is `true`.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"to-rgba": {
			doc: "Returns a four-element array containing the input color's red, green, blue, and alpha components, in that order.",
			group: "Color",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"to-color": {
			doc: "Converts the input value to a color. If multiple values are provided, each one is evaluated in order until the first successful conversion is obtained. If none of the inputs can be converted, the expression is an error.",
			group: "Types",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		rgb: {
			doc: "Creates a color value from red, green, and blue components, which must range between 0 and 255, and an alpha component of 1. If any component is out of range, the expression is an error.",
			group: "Color",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		rgba: {
			doc: "Creates a color value from red, green, blue components, which must range between 0 and 255, and an alpha component which must range between 0 and 1. If any component is out of range, the expression is an error.",
			group: "Color",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		get: {
			doc: "Retrieves a property value from the current feature's properties, or from another object if a second argument is provided. Returns null if the requested property is missing.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		has: {
			doc: "Tests for the presence of an property value in the current feature's properties, or from another object if a second argument is provided.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		length: {
			doc: "Gets the length of an array or string.",
			group: "Lookup",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		properties: {
			doc: "Gets the feature properties object.  Note that in some cases, it may be more efficient to use [\"get\", \"property_name\"] directly.",
			group: "Feature data",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"feature-state": {
			doc: "Retrieves a property value from the current feature's state. Returns null if the requested property is not present on the feature's state. A feature's state is not part of the GeoJSON or vector tile data, and must be set programmatically on each feature. When `source.promoteId` is not provided, features are identified by their `id` attribute, which must be an integer or a string that can be cast to an integer. When `source.promoteId` is provided, features are identified by their `promoteId` property, which may be a number, string, or any primitive data type. Note that [\"feature-state\"] can only be used with paint properties that support data-driven styling.",
			group: "Feature data",
			"sdk-support": {
				"basic functionality": {
					js: "0.46.0"
				}
			}
		},
		"geometry-type": {
			doc: "Gets the feature's geometry type: `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`.",
			group: "Feature data",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		id: {
			doc: "Gets the feature's id, if it has one.",
			group: "Feature data",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		zoom: {
			doc: "Gets the current zoom level.  Note that in style layout and paint properties, [\"zoom\"] may only appear as the input to a top-level \"step\" or \"interpolate\" expression.",
			group: "Zoom",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"heatmap-density": {
			doc: "Gets the kernel density estimation of a pixel in a heatmap layer, which is a relative measure of how many data points are crowded around a particular pixel. Can only be used in the `heatmap-color` property.",
			group: "Heatmap",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"line-progress": {
			doc: "Gets the progress along a gradient line. Can only be used in the `line-gradient` property.",
			group: "Feature data",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.6.0",
					macos: "0.12.0"
				}
			}
		},
		accumulated: {
			doc: "Gets the value of a cluster property accumulated so far. Can only be used in the `clusterProperties` option of a clustered GeoJSON source.",
			group: "Feature data",
			"sdk-support": {
				"basic functionality": {
					js: "0.53.0"
				}
			}
		},
		"+": {
			doc: "Returns the sum of the inputs.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"*": {
			doc: "Returns the product of the inputs.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"-": {
			doc: "For two inputs, returns the result of subtracting the second input from the first. For a single input, returns the result of subtracting it from 0.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"/": {
			doc: "Returns the result of floating point division of the first input by the second.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"%": {
			doc: "Returns the remainder after integer division of the first input by the second.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"^": {
			doc: "Returns the result of raising the first input to the power specified by the second.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		sqrt: {
			doc: "Returns the square root of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.42.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		log10: {
			doc: "Returns the base-ten logarithm of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		ln: {
			doc: "Returns the natural logarithm of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		log2: {
			doc: "Returns the base-two logarithm of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		sin: {
			doc: "Returns the sine of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		cos: {
			doc: "Returns the cosine of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		tan: {
			doc: "Returns the tangent of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		asin: {
			doc: "Returns the arcsine of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		acos: {
			doc: "Returns the arccosine of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		atan: {
			doc: "Returns the arctangent of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		min: {
			doc: "Returns the minimum value of the inputs.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		max: {
			doc: "Returns the maximum value of the inputs.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		round: {
			doc: "Rounds the input to the nearest integer. Halfway values are rounded away from zero. For example, `[\"round\", -1.5]` evaluates to -2.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		abs: {
			doc: "Returns the absolute value of the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		ceil: {
			doc: "Returns the smallest integer that is greater than or equal to the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		floor: {
			doc: "Returns the largest integer that is less than or equal to the input.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		distance: {
			doc: "Returns the shortest distance in meters between the evaluated feature and the input geometry. The input value can be a valid GeoJSON of type `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`, `Feature`, or `FeatureCollection`. Distance values returned may vary in precision due to loss in precision from encoding geometries, particularly below zoom level 13.",
			group: "Math",
			"sdk-support": {
				"basic functionality": {
					android: "9.2.0",
					ios: "5.9.0",
					macos: "0.16.0"
				}
			}
		},
		"==": {
			doc: "Returns `true` if the input values are equal, `false` otherwise. The comparison is strictly typed: values of different runtime types are always considered unequal. Cases where the types are known to be different at parse time are considered invalid and will produce a parse error. Accepts an optional `collator` argument to control locale-dependent string comparisons.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				},
				collator: {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		"!=": {
			doc: "Returns `true` if the input values are not equal, `false` otherwise. The comparison is strictly typed: values of different runtime types are always considered unequal. Cases where the types are known to be different at parse time are considered invalid and will produce a parse error. Accepts an optional `collator` argument to control locale-dependent string comparisons.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				},
				collator: {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		">": {
			doc: "Returns `true` if the first input is strictly greater than the second, `false` otherwise. The arguments are required to be either both strings or both numbers; if during evaluation they are not, expression evaluation produces an error. Cases where this constraint is known not to hold at parse time are considered in valid and will produce a parse error. Accepts an optional `collator` argument to control locale-dependent string comparisons.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				},
				collator: {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		"<": {
			doc: "Returns `true` if the first input is strictly less than the second, `false` otherwise. The arguments are required to be either both strings or both numbers; if during evaluation they are not, expression evaluation produces an error. Cases where this constraint is known not to hold at parse time are considered in valid and will produce a parse error. Accepts an optional `collator` argument to control locale-dependent string comparisons.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				},
				collator: {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		">=": {
			doc: "Returns `true` if the first input is greater than or equal to the second, `false` otherwise. The arguments are required to be either both strings or both numbers; if during evaluation they are not, expression evaluation produces an error. Cases where this constraint is known not to hold at parse time are considered in valid and will produce a parse error. Accepts an optional `collator` argument to control locale-dependent string comparisons.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				},
				collator: {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		"<=": {
			doc: "Returns `true` if the first input is less than or equal to the second, `false` otherwise. The arguments are required to be either both strings or both numbers; if during evaluation they are not, expression evaluation produces an error. Cases where this constraint is known not to hold at parse time are considered in valid and will produce a parse error. Accepts an optional `collator` argument to control locale-dependent string comparisons.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				},
				collator: {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		},
		all: {
			doc: "Returns `true` if all the inputs are `true`, `false` otherwise. The inputs are evaluated in order, and evaluation is short-circuiting: once an input expression evaluates to `false`, the result is `false` and no further input expressions are evaluated.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		any: {
			doc: "Returns `true` if any of the inputs are `true`, `false` otherwise. The inputs are evaluated in order, and evaluation is short-circuiting: once an input expression evaluates to `true`, the result is `true` and no further input expressions are evaluated.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"!": {
			doc: "Logical negation. Returns `true` if the input is `false`, and `false` if the input is `true`.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		within: {
			doc: "Returns `true` if the evaluated feature is fully contained inside a boundary of the input geometry, `false` otherwise. The input value can be a valid GeoJSON of type `Polygon`, `MultiPolygon`, `Feature`, or `FeatureCollection`. Supported features for evaluation:\n- `Point`: Returns `false` if a point is on the boundary or falls outside the boundary.\n- `LineString`: Returns `false` if any part of a line falls outside the boundary, the line intersects the boundary, or a line's endpoint is on the boundary.",
			group: "Decision",
			"sdk-support": {
				"basic functionality": {
					js: "1.9.0",
					android: "9.1.0",
					ios: "5.8.0",
					macos: "0.15.0"
				}
			}
		},
		"is-supported-script": {
			doc: "Returns `true` if the input string is expected to render legibly. Returns `false` if the input string contains sections that cannot be rendered without potential loss of meaning (e.g. Indic scripts that require complex text shaping, or right-to-left scripts if the the `mapbox-gl-rtl-text` plugin is not in use in MapLibre GL JS).",
			group: "String",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.6.0"
				}
			}
		},
		upcase: {
			doc: "Returns the input string converted to uppercase. Follows the Unicode Default Case Conversion algorithm and the locale-insensitive case mappings in the Unicode Character Database.",
			group: "String",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		downcase: {
			doc: "Returns the input string converted to lowercase. Follows the Unicode Default Case Conversion algorithm and the locale-insensitive case mappings in the Unicode Character Database.",
			group: "String",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		concat: {
			doc: "Returns a `string` consisting of the concatenation of the inputs. Each input is converted to a string as if by `to-string`.",
			group: "String",
			"sdk-support": {
				"basic functionality": {
					js: "0.41.0",
					android: "6.0.0",
					ios: "4.0.0",
					macos: "0.7.0"
				}
			}
		},
		"resolved-locale": {
			doc: "Returns the IETF language tag of the locale being used by the provided `collator`. This can be used to determine the default system locale, or to determine if a requested locale was successfully loaded.",
			group: "String",
			"sdk-support": {
				"basic functionality": {
					js: "0.45.0",
					android: "6.5.0",
					ios: "4.2.0",
					macos: "0.9.0"
				}
			}
		}
	}
};
const light = {
	anchor: {
		type: "enum",
		"default": "viewport",
		values: {
			map: {
				doc: "The position of the light source is aligned to the rotation of the map."
			},
			viewport: {
				doc: "The position of the light source is aligned to the rotation of the viewport."
			}
		},
		"property-type": "data-constant",
		transition: false,
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		doc: "Whether extruded geometries are lit relative to the map or viewport.",
		example: "map",
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		}
	},
	position: {
		type: "array",
		"default": [
			1.15,
			210,
			30
		],
		length: 3,
		value: "number",
		"property-type": "data-constant",
		transition: true,
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		doc: "Position of the light source relative to lit (extruded) geometries, in [r radial coordinate, a azimuthal angle, p polar angle] where r indicates the distance from the center of the base of an object to its light, a indicates the position of the light relative to 0° (0° when `light.anchor` is set to `viewport` corresponds to the top of the viewport, or 0° when `light.anchor` is set to `map` corresponds to due north, and degrees proceed clockwise), and p indicates the height of the light (from 0°, directly above, to 180°, directly below).",
		example: [
			1.5,
			90,
			80
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		}
	},
	color: {
		type: "color",
		"property-type": "data-constant",
		"default": "#ffffff",
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		transition: true,
		doc: "Color tint for lighting extruded geometries.",
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		}
	},
	intensity: {
		type: "number",
		"property-type": "data-constant",
		"default": 0.5,
		minimum: 0,
		maximum: 1,
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		transition: true,
		doc: "Intensity of lighting (on a scale from 0 to 1). Higher numbers will present as more extreme contrast.",
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		}
	}
};
const terrain = {
	source: {
		type: "string",
		doc: "The source for the terrain data.",
		required: true,
		"sdk-support": {
			"basic functionality": {
				js: "2.2.0"
			}
		}
	},
	exaggeration: {
		type: "number",
		minimum: 0,
		doc: "The exaggeration of the terrain - how high it will look.",
		"default": 1,
		"sdk-support": {
			"basic functionality": {
				js: "2.2.0"
			}
		}
	}
};
const paint = [
	"paint_fill",
	"paint_line",
	"paint_circle",
	"paint_heatmap",
	"paint_fill-extrusion",
	"paint_symbol",
	"paint_raster",
	"paint_hillshade",
	"paint_background"
];
const paint_fill = {
	"fill-antialias": {
		type: "boolean",
		"default": true,
		doc: "Whether or not the fill should be antialiased.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"fill-opacity": {
		type: "number",
		"default": 1,
		minimum: 0,
		maximum: 1,
		doc: "The opacity of the entire fill layer. In contrast to the `fill-color`, this value will also affect the 1px stroke around the fill, if the stroke is used.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.21.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"fill-color": {
		type: "color",
		"default": "#000000",
		doc: "The color of the filled part of this layer. This color can be specified as `rgba` with an alpha component and the color's opacity will not affect the opacity of the 1px stroke, if it is used.",
		transition: true,
		requires: [
			{
				"!": "fill-pattern"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.19.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"fill-outline-color": {
		type: "color",
		doc: "The outline color of the fill. Matches the value of `fill-color` if unspecified.",
		transition: true,
		requires: [
			{
				"!": "fill-pattern"
			},
			{
				"fill-antialias": true
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.19.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"fill-translate": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		transition: true,
		units: "pixels",
		doc: "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"fill-translate-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "The fill is translated relative to the map."
			},
			viewport: {
				doc: "The fill is translated relative to the viewport."
			}
		},
		doc: "Controls the frame of reference for `fill-translate`.",
		"default": "map",
		requires: [
			"fill-translate"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"fill-pattern": {
		type: "resolvedImage",
		transition: true,
		doc: "Name of image in sprite to use for drawing image fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom levels.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.49.0",
				android: "6.5.0",
				macos: "0.11.0",
				ios: "4.4.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "cross-faded-data-driven"
	}
};
const paint_line = {
	"line-opacity": {
		type: "number",
		doc: "The opacity at which the line will be drawn.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"line-color": {
		type: "color",
		doc: "The color with which the line will be drawn.",
		"default": "#000000",
		transition: true,
		requires: [
			{
				"!": "line-pattern"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.23.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"line-translate": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		transition: true,
		units: "pixels",
		doc: "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"line-translate-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "The line is translated relative to the map."
			},
			viewport: {
				doc: "The line is translated relative to the viewport."
			}
		},
		doc: "Controls the frame of reference for `line-translate`.",
		"default": "map",
		requires: [
			"line-translate"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"line-width": {
		type: "number",
		"default": 1,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "Stroke thickness.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.39.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"line-gap-width": {
		type: "number",
		"default": 0,
		minimum: 0,
		doc: "Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.",
		transition: true,
		units: "pixels",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"line-offset": {
		type: "number",
		"default": 0,
		doc: "The line's offset. For linear features, a positive value offsets the line to the right, relative to the direction of the line, and a negative value to the left. For polygon features, a positive value results in an inset, and a negative value results in an outset.",
		transition: true,
		units: "pixels",
		"sdk-support": {
			"basic functionality": {
				js: "0.12.1",
				android: "3.0.0",
				ios: "3.1.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"line-blur": {
		type: "number",
		"default": 0,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "Blur applied to the line, in pixels.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"line-dasharray": {
		type: "array",
		value: "number",
		doc: "Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width. Note that GeoJSON sources with `lineMetrics: true` specified won't render dashed lines to the expected scale. Also note that zoom-dependent expressions will be evaluated only at integer zoom levels.",
		minimum: 0,
		transition: true,
		units: "line widths",
		requires: [
			{
				"!": "line-pattern"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "cross-faded"
	},
	"line-pattern": {
		type: "resolvedImage",
		transition: true,
		doc: "Name of image in sprite to use for drawing image lines. For seamless patterns, image width must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom levels.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.49.0",
				android: "6.5.0",
				macos: "0.11.0",
				ios: "4.4.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "cross-faded-data-driven"
	},
	"line-gradient": {
		type: "color",
		doc: "Defines a gradient with which to color a line feature. Can only be used with GeoJSON sources that specify `\"lineMetrics\": true`.",
		transition: false,
		requires: [
			{
				"!": "line-dasharray"
			},
			{
				"!": "line-pattern"
			},
			{
				source: "geojson",
				has: {
					lineMetrics: true
				}
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.45.0",
				android: "6.5.0",
				ios: "4.4.0",
				macos: "0.11.0"
			},
			"data-driven styling": {
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"line-progress"
			]
		},
		"property-type": "color-ramp"
	}
};
const paint_circle = {
	"circle-radius": {
		type: "number",
		"default": 5,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "Circle radius.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.18.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"circle-color": {
		type: "color",
		"default": "#000000",
		doc: "The fill color of the circle.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.18.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"circle-blur": {
		type: "number",
		"default": 0,
		doc: "Amount to blur the circle. 1 blurs the circle such that only the centerpoint is full opacity.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.20.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"circle-opacity": {
		type: "number",
		doc: "The opacity at which the circle will be drawn.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.20.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"circle-translate": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		transition: true,
		units: "pixels",
		doc: "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"circle-translate-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "The circle is translated relative to the map."
			},
			viewport: {
				doc: "The circle is translated relative to the viewport."
			}
		},
		doc: "Controls the frame of reference for `circle-translate`.",
		"default": "map",
		requires: [
			"circle-translate"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"circle-pitch-scale": {
		type: "enum",
		values: {
			map: {
				doc: "Circles are scaled according to their apparent distance to the camera."
			},
			viewport: {
				doc: "Circles are not scaled."
			}
		},
		"default": "map",
		doc: "Controls the scaling behavior of the circle when the map is pitched.",
		"sdk-support": {
			"basic functionality": {
				js: "0.21.0",
				android: "4.2.0",
				ios: "3.4.0",
				macos: "0.2.1"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"circle-pitch-alignment": {
		type: "enum",
		values: {
			map: {
				doc: "The circle is aligned to the plane of the map."
			},
			viewport: {
				doc: "The circle is aligned to the plane of the viewport."
			}
		},
		"default": "viewport",
		doc: "Orientation of circle when map is pitched.",
		"sdk-support": {
			"basic functionality": {
				js: "0.39.0",
				android: "5.2.0",
				ios: "3.7.0",
				macos: "0.6.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"circle-stroke-width": {
		type: "number",
		"default": 0,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "The width of the circle's stroke. Strokes are placed outside of the `circle-radius`.",
		"sdk-support": {
			"basic functionality": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"circle-stroke-color": {
		type: "color",
		"default": "#000000",
		doc: "The stroke color of the circle.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"circle-stroke-opacity": {
		type: "number",
		doc: "The opacity of the circle's stroke.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			},
			"data-driven styling": {
				js: "0.29.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	}
};
const paint_heatmap = {
	"heatmap-radius": {
		type: "number",
		"default": 30,
		minimum: 1,
		transition: true,
		units: "pixels",
		doc: "Radius of influence of one heatmap point in pixels. Increasing the value makes the heatmap smoother, but less detailed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			},
			"data-driven styling": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"heatmap-weight": {
		type: "number",
		"default": 1,
		minimum: 0,
		transition: false,
		doc: "A measure of how much an individual point contributes to the heatmap. A value of 10 would be equivalent to having 10 points of weight 1 in the same spot. Especially useful when combined with clustering.",
		"sdk-support": {
			"basic functionality": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			},
			"data-driven styling": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"heatmap-intensity": {
		type: "number",
		"default": 1,
		minimum: 0,
		transition: true,
		doc: "Similar to `heatmap-weight` but controls the intensity of the heatmap globally. Primarily used for adjusting the heatmap based on zoom level.",
		"sdk-support": {
			"basic functionality": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"heatmap-color": {
		type: "color",
		"default": [
			"interpolate",
			[
				"linear"
			],
			[
				"heatmap-density"
			],
			0,
			"rgba(0, 0, 255, 0)",
			0.1,
			"royalblue",
			0.3,
			"cyan",
			0.5,
			"lime",
			0.7,
			"yellow",
			1,
			"red"
		],
		doc: "Defines the color of each pixel based on its density value in a heatmap.  Should be an expression that uses `[\"heatmap-density\"]` as input.",
		transition: false,
		"sdk-support": {
			"basic functionality": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			},
			"data-driven styling": {
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"heatmap-density"
			]
		},
		"property-type": "color-ramp"
	},
	"heatmap-opacity": {
		type: "number",
		doc: "The global opacity at which the heatmap layer will be drawn.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.41.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	}
};
const paint_symbol = {
	"icon-opacity": {
		doc: "The opacity at which the icon will be drawn.",
		type: "number",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"icon-color": {
		type: "color",
		"default": "#000000",
		transition: true,
		doc: "The color of the icon. This can only be used with sdf icons.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"icon-halo-color": {
		type: "color",
		"default": "rgba(0, 0, 0, 0)",
		transition: true,
		doc: "The color of the icon's halo. Icon halos can only be used with SDF icons.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"icon-halo-width": {
		type: "number",
		"default": 0,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "Distance of halo to the icon outline.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"icon-halo-blur": {
		type: "number",
		"default": 0,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "Fade out the halo towards the outside.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"icon-translate": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		transition: true,
		units: "pixels",
		doc: "Distance that the icon's anchor is moved from its original placement. Positive values indicate right and down, while negative values indicate left and up.",
		requires: [
			"icon-image"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"icon-translate-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "Icons are translated relative to the map."
			},
			viewport: {
				doc: "Icons are translated relative to the viewport."
			}
		},
		doc: "Controls the frame of reference for `icon-translate`.",
		"default": "map",
		requires: [
			"icon-image",
			"icon-translate"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-opacity": {
		type: "number",
		doc: "The opacity at which the text will be drawn.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"text-color": {
		type: "color",
		doc: "The color with which the text will be drawn.",
		"default": "#000000",
		transition: true,
		overridable: true,
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"text-halo-color": {
		type: "color",
		"default": "rgba(0, 0, 0, 0)",
		transition: true,
		doc: "The color of the text's halo, which helps it stand out from backgrounds.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"text-halo-width": {
		type: "number",
		"default": 0,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "Distance of halo to the font outline. Max text halo width is 1/4 of the font-size.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"text-halo-blur": {
		type: "number",
		"default": 0,
		minimum: 0,
		transition: true,
		units: "pixels",
		doc: "The halo's fadeout distance towards the outside.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
				js: "0.33.0",
				android: "5.0.0",
				ios: "3.5.0",
				macos: "0.4.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"text-translate": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		transition: true,
		units: "pixels",
		doc: "Distance that the text's anchor is moved from its original placement. Positive values indicate right and down, while negative values indicate left and up.",
		requires: [
			"text-field"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"text-translate-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "The text is translated relative to the map."
			},
			viewport: {
				doc: "The text is translated relative to the viewport."
			}
		},
		doc: "Controls the frame of reference for `text-translate`.",
		"default": "map",
		requires: [
			"text-field",
			"text-translate"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	}
};
const paint_raster = {
	"raster-opacity": {
		type: "number",
		doc: "The opacity at which the image will be drawn.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-hue-rotate": {
		type: "number",
		"default": 0,
		period: 360,
		transition: true,
		units: "degrees",
		doc: "Rotates hues around the color wheel.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-brightness-min": {
		type: "number",
		doc: "Increase or reduce the brightness of the image. The value is the minimum brightness.",
		"default": 0,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-brightness-max": {
		type: "number",
		doc: "Increase or reduce the brightness of the image. The value is the maximum brightness.",
		"default": 1,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-saturation": {
		type: "number",
		doc: "Increase or reduce the saturation of the image.",
		"default": 0,
		minimum: -1,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-contrast": {
		type: "number",
		doc: "Increase or reduce the contrast of the image.",
		"default": 0,
		minimum: -1,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-resampling": {
		type: "enum",
		doc: "The resampling/interpolation method to use for overscaling, also known as texture magnification filter",
		values: {
			linear: {
				doc: "(Bi)linear filtering interpolates pixel values using the weighted average of the four closest original source pixels creating a smooth but blurry look when overscaled"
			},
			nearest: {
				doc: "Nearest neighbor filtering interpolates pixel values using the nearest original source pixel creating a sharp but pixelated look when overscaled"
			}
		},
		"default": "linear",
		"sdk-support": {
			"basic functionality": {
				js: "0.47.0",
				android: "6.3.0",
				ios: "4.2.0",
				macos: "0.9.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"raster-fade-duration": {
		type: "number",
		"default": 300,
		minimum: 0,
		transition: false,
		units: "milliseconds",
		doc: "Fade duration when a new tile is added.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	}
};
const paint_hillshade = {
	"hillshade-illumination-direction": {
		type: "number",
		"default": 335,
		minimum: 0,
		maximum: 359,
		doc: "The direction of the light source used to generate the hillshading with 0 as the top of the viewport if `hillshade-illumination-anchor` is set to `viewport` and due north if `hillshade-illumination-anchor` is set to `map`.",
		transition: false,
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"hillshade-illumination-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "The hillshade illumination is relative to the north direction."
			},
			viewport: {
				doc: "The hillshade illumination is relative to the top of the viewport."
			}
		},
		"default": "viewport",
		doc: "Direction of light source when map is rotated.",
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"hillshade-exaggeration": {
		type: "number",
		doc: "Intensity of the hillshade",
		"default": 0.5,
		minimum: 0,
		maximum: 1,
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"hillshade-shadow-color": {
		type: "color",
		"default": "#000000",
		doc: "The shading color of areas that face away from the light source.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"hillshade-highlight-color": {
		type: "color",
		"default": "#FFFFFF",
		doc: "The shading color of areas that faces towards the light source.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"hillshade-accent-color": {
		type: "color",
		"default": "#000000",
		doc: "The shading color used to accentuate rugged terrain like sharp cliffs and gorges.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.43.0",
				android: "6.0.0",
				ios: "4.0.0",
				macos: "0.7.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	}
};
const paint_background = {
	"background-color": {
		type: "color",
		"default": "#000000",
		doc: "The color with which the background will be drawn.",
		transition: true,
		requires: [
			{
				"!": "background-pattern"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"background-pattern": {
		type: "resolvedImage",
		transition: true,
		doc: "Name of image in sprite to use for drawing an image background. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom levels.",
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			},
			"data-driven styling": {
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "cross-faded"
	},
	"background-opacity": {
		type: "number",
		"default": 1,
		minimum: 0,
		maximum: 1,
		doc: "The opacity at which the background will be drawn.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.10.0",
				android: "2.0.1",
				ios: "2.0.0",
				macos: "0.1.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	}
};
const transition = {
	duration: {
		type: "number",
		"default": 300,
		minimum: 0,
		units: "milliseconds",
		doc: "Time allotted for transitions to complete."
	},
	delay: {
		type: "number",
		"default": 0,
		minimum: 0,
		units: "milliseconds",
		doc: "Length of time before a transition begins."
	}
};
const promoteId = {
	"*": {
		type: "string",
		doc: "A name of a feature property to use as ID for feature state."
	}
};
const spec = {
	$version: $version,
	$root: $root,
	sources: sources,
	source: source,
	source_vector: source_vector,
	source_raster: source_raster,
	source_raster_dem: source_raster_dem,
	source_geojson: source_geojson,
	source_video: source_video,
	source_image: source_image,
	layer: layer,
	layout: layout,
	layout_background: layout_background,
	layout_fill: layout_fill,
	layout_circle: layout_circle,
	layout_heatmap: layout_heatmap,
	"layout_fill-extrusion": {
	visibility: {
		type: "enum",
		values: {
			visible: {
				doc: "The layer is shown."
			},
			none: {
				doc: "The layer is not shown."
			}
		},
		"default": "visible",
		doc: "Whether this layer is displayed.",
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		"property-type": "constant"
	}
},
	layout_line: layout_line,
	layout_symbol: layout_symbol,
	layout_raster: layout_raster,
	layout_hillshade: layout_hillshade,
	filter: filter,
	filter_operator: filter_operator,
	geometry_type: geometry_type,
	"function": {
	expression: {
		type: "expression",
		doc: "An expression."
	},
	stops: {
		type: "array",
		doc: "An array of stops.",
		value: "function_stop"
	},
	base: {
		type: "number",
		"default": 1,
		minimum: 0,
		doc: "The exponential base of the interpolation curve. It controls the rate at which the result increases. Higher values make the result increase more towards the high end of the range. With `1` the stops are interpolated linearly."
	},
	property: {
		type: "string",
		doc: "The name of a feature property to use as the function input.",
		"default": "$zoom"
	},
	type: {
		type: "enum",
		values: {
			identity: {
				doc: "Return the input value as the output value."
			},
			exponential: {
				doc: "Generate an output by interpolating between stops just less than and just greater than the function input."
			},
			interval: {
				doc: "Return the output value of the stop just less than the function input."
			},
			categorical: {
				doc: "Return the output value of the stop equal to the function input."
			}
		},
		doc: "The interpolation strategy to use in function evaluation.",
		"default": "exponential"
	},
	colorSpace: {
		type: "enum",
		values: {
			rgb: {
				doc: "Use the RGB color space to interpolate color values"
			},
			lab: {
				doc: "Use the LAB color space to interpolate color values."
			},
			hcl: {
				doc: "Use the HCL color space to interpolate color values, interpolating the Hue, Chroma, and Luminance channels individually."
			}
		},
		doc: "The color space in which colors interpolated. Interpolating colors in perceptual color spaces like LAB and HCL tend to produce color ramps that look more consistent and produce colors that can be differentiated more easily than those interpolated in RGB space.",
		"default": "rgb"
	},
	"default": {
		type: "*",
		required: false,
		doc: "A value to serve as a fallback function result when a value isn't otherwise available. It is used in the following circumstances:\n* In categorical functions, when the feature value does not match any of the stop domain values.\n* In property and zoom-and-property functions, when a feature does not contain a value for the specified property.\n* In identity functions, when the feature value is not valid for the style property (for example, if the function is being used for a `circle-color` property but the feature property value is not a string or not a valid color).\n* In interval or exponential property and zoom-and-property functions, when the feature value is not numeric.\nIf no default is provided, the style property's default is used in these circumstances."
	}
},
	function_stop: function_stop,
	expression: expression,
	expression_name: expression_name,
	light: light,
	terrain: terrain,
	paint: paint,
	paint_fill: paint_fill,
	"paint_fill-extrusion": {
	"fill-extrusion-opacity": {
		type: "number",
		"default": 1,
		minimum: 0,
		maximum: 1,
		doc: "The opacity of the entire fill extrusion layer. This is rendered on a per-layer, not per-feature, basis, and data-driven styling is not available.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"fill-extrusion-color": {
		type: "color",
		"default": "#000000",
		doc: "The base color of the extruded fill. The extrusion's surfaces will be shaded differently based on this color in combination with the root `light` settings. If this color is specified as `rgba` with an alpha component, the alpha component will be ignored; use `fill-extrusion-opacity` to set layer opacity.",
		transition: true,
		requires: [
			{
				"!": "fill-extrusion-pattern"
			}
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			},
			"data-driven styling": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"fill-extrusion-translate": {
		type: "array",
		value: "number",
		length: 2,
		"default": [
			0,
			0
		],
		transition: true,
		units: "pixels",
		doc: "The geometry's offset. Values are [x, y] where negatives indicate left and up (on the flat plane), respectively.",
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"fill-extrusion-translate-anchor": {
		type: "enum",
		values: {
			map: {
				doc: "The fill extrusion is translated relative to the map."
			},
			viewport: {
				doc: "The fill extrusion is translated relative to the viewport."
			}
		},
		doc: "Controls the frame of reference for `fill-extrusion-translate`.",
		"default": "map",
		requires: [
			"fill-extrusion-translate"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	},
	"fill-extrusion-pattern": {
		type: "resolvedImage",
		transition: true,
		doc: "Name of image in sprite to use for drawing images on extruded fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom levels.",
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			},
			"data-driven styling": {
				js: "0.49.0",
				android: "6.5.0",
				macos: "0.11.0",
				ios: "4.4.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom",
				"feature"
			]
		},
		"property-type": "cross-faded-data-driven"
	},
	"fill-extrusion-height": {
		type: "number",
		"default": 0,
		minimum: 0,
		units: "meters",
		doc: "The height with which to extrude this layer.",
		transition: true,
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			},
			"data-driven styling": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"fill-extrusion-base": {
		type: "number",
		"default": 0,
		minimum: 0,
		units: "meters",
		doc: "The height with which to extrude the base of this layer. Must be less than or equal to `fill-extrusion-height`.",
		transition: true,
		requires: [
			"fill-extrusion-height"
		],
		"sdk-support": {
			"basic functionality": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			},
			"data-driven styling": {
				js: "0.27.0",
				android: "5.1.0",
				ios: "3.6.0",
				macos: "0.5.0"
			}
		},
		expression: {
			interpolated: true,
			parameters: [
				"zoom",
				"feature",
				"feature-state"
			]
		},
		"property-type": "data-driven"
	},
	"fill-extrusion-vertical-gradient": {
		type: "boolean",
		"default": true,
		doc: "Whether to apply a vertical gradient to the sides of a fill-extrusion layer. If true, sides will be shaded slightly darker farther down.",
		transition: false,
		"sdk-support": {
			"basic functionality": {
				js: "0.50.0",
				ios: "4.7.0",
				macos: "0.13.0"
			}
		},
		expression: {
			interpolated: false,
			parameters: [
				"zoom"
			]
		},
		"property-type": "data-constant"
	}
},
	paint_line: paint_line,
	paint_circle: paint_circle,
	paint_heatmap: paint_heatmap,
	paint_symbol: paint_symbol,
	paint_raster: paint_raster,
	paint_hillshade: paint_hillshade,
	paint_background: paint_background,
	transition: transition,
	"property-type": {
	"data-driven": {
		type: "property-type",
		doc: "Property is interpolable and can be represented using a property expression."
	},
	"cross-faded": {
		type: "property-type",
		doc: "Property is non-interpolable; rather, its values will be cross-faded to smoothly transition between integer zooms."
	},
	"cross-faded-data-driven": {
		type: "property-type",
		doc: "Property is non-interpolable; rather, its values will be cross-faded to smoothly transition between integer zooms. It can be represented using a property expression."
	},
	"color-ramp": {
		type: "property-type",
		doc: "Property should be specified using a color ramp from which the output color can be sampled based on a property calculation."
	},
	"data-constant": {
		type: "property-type",
		doc: "Property is interpolable but cannot be represented using a property expression."
	},
	constant: {
		type: "property-type",
		doc: "Property is constant across all zoom levels and property values."
	}
},
	promoteId: promoteId
};

const NullType = { kind: "null" };
const NumberType = { kind: "number" };
const StringType = { kind: "string" };
const BooleanType = { kind: "boolean" };
const ColorType = { kind: "color" };
const ObjectType = { kind: "object" };
const ValueType = { kind: "value" };
const ErrorType = { kind: "error" };
const CollatorType = { kind: "collator" };
const FormattedType = { kind: "formatted" };
const PaddingType = { kind: "padding" };
const ResolvedImageType = { kind: "resolvedImage" };
function array$1(itemType, N) {
  return {
    kind: "array",
    itemType,
    N
  };
}
function toString$1(type) {
  if (type.kind === "array") {
    const itemType = toString$1(type.itemType);
    return typeof type.N === "number" ? `array<${itemType}, ${type.N}>` : type.itemType.kind === "value" ? "array" : `array<${itemType}>`;
  } else {
    return type.kind;
  }
}
const valueMemberTypes = [
  NullType,
  NumberType,
  StringType,
  BooleanType,
  ColorType,
  FormattedType,
  ObjectType,
  array$1(ValueType),
  PaddingType,
  ResolvedImageType
];
function checkSubtype(expected, t) {
  if (t.kind === "error") {
    return null;
  } else if (expected.kind === "array") {
    if (t.kind === "array" && (t.N === 0 && t.itemType.kind === "value" || !checkSubtype(expected.itemType, t.itemType)) && (typeof expected.N !== "number" || expected.N === t.N)) {
      return null;
    }
  } else if (expected.kind === t.kind) {
    return null;
  } else if (expected.kind === "value") {
    for (const memberType of valueMemberTypes) {
      if (!checkSubtype(memberType, t)) {
        return null;
      }
    }
  }
  return `Expected ${toString$1(expected)} but found ${toString$1(t)} instead.`;
}
function isValidType(provided, allowedTypes) {
  return allowedTypes.some((t) => t.kind === provided.kind);
}
function isValidNativeType(provided, allowedTypes) {
  return allowedTypes.some((t) => {
    if (t === "null") {
      return provided === null;
    } else if (t === "array") {
      return Array.isArray(provided);
    } else if (t === "object") {
      return provided && !Array.isArray(provided) && typeof provided === "object";
    } else {
      return t === typeof provided;
    }
  });
}

class Scope {
  constructor(parent, bindings = []) {
    this.parent = parent;
    this.bindings = {};
    for (const [name, expression] of bindings) {
      this.bindings[name] = expression;
    }
  }
  concat(bindings) {
    return new Scope(this, bindings);
  }
  get(name) {
    if (this.bindings[name]) {
      return this.bindings[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`${name} not found in scope.`);
  }
  has(name) {
    if (this.bindings[name])
      return true;
    return this.parent ? this.parent.has(name) : false;
  }
}

class ExpressionParsingError extends Error {
  constructor(key, message) {
    super(message);
    this.message = message;
    this.key = key;
  }
}

class Color {
  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  /**
   * Parses valid CSS color strings and returns a `Color` instance.
   * @param input A valid CSS color string.
   * @returns A `Color` instance, or `undefined` if the input is not a valid color string.
   */
  static parse(input) {
    if (!input) {
      return void 0;
    }
    if (input instanceof Color) {
      return input;
    }
    if (typeof input !== "string") {
      return void 0;
    }
    const rgba = csscolorparserExports.parseCSSColor(input);
    if (!rgba) {
      return void 0;
    }
    return new Color(
      rgba[0] / 255 * rgba[3],
      rgba[1] / 255 * rgba[3],
      rgba[2] / 255 * rgba[3],
      rgba[3]
    );
  }
  /**
   * Returns an RGBA string representing the color value.
   *
   * @returns An RGBA string.
   * @example
   * var purple = new Color.parse('purple');
   * purple.toString; // = "rgba(128,0,128,1)"
   * var translucentGreen = new Color.parse('rgba(26, 207, 26, .73)');
   * translucentGreen.toString(); // = "rgba(26,207,26,0.73)"
   */
  toString() {
    const [r, g, b, a] = this.toArray();
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
  }
  toArray() {
    const { r, g, b, a } = this;
    return a === 0 ? [0, 0, 0, 0] : [
      r * 255 / a,
      g * 255 / a,
      b * 255 / a,
      a
    ];
  }
}
Color.black = new Color(0, 0, 0, 1);
Color.white = new Color(1, 1, 1, 1);
Color.transparent = new Color(0, 0, 0, 0);
Color.red = new Color(1, 0, 0, 1);

class Collator {
  constructor(caseSensitive, diacriticSensitive, locale) {
    if (caseSensitive)
      this.sensitivity = diacriticSensitive ? "variant" : "case";
    else
      this.sensitivity = diacriticSensitive ? "accent" : "base";
    this.locale = locale;
    this.collator = new Intl.Collator(
      this.locale ? this.locale : [],
      { sensitivity: this.sensitivity, usage: "search" }
    );
  }
  compare(lhs, rhs) {
    return this.collator.compare(lhs, rhs);
  }
  resolvedLocale() {
    return new Intl.Collator(this.locale ? this.locale : []).resolvedOptions().locale;
  }
}

class FormattedSection {
  constructor(text, image, scale, fontStack, textColor) {
    this.text = text;
    this.image = image;
    this.scale = scale;
    this.fontStack = fontStack;
    this.textColor = textColor;
  }
}
class Formatted {
  constructor(sections) {
    this.sections = sections;
  }
  static fromString(unformatted) {
    return new Formatted([new FormattedSection(unformatted, null, null, null, null)]);
  }
  isEmpty() {
    if (this.sections.length === 0)
      return true;
    return !this.sections.some((section) => section.text.length !== 0 || section.image && section.image.name.length !== 0);
  }
  static factory(text) {
    if (text instanceof Formatted) {
      return text;
    } else {
      return Formatted.fromString(text);
    }
  }
  toString() {
    if (this.sections.length === 0)
      return "";
    return this.sections.map((section) => section.text).join("");
  }
}

class Padding {
  constructor(values) {
    this.values = values.slice();
  }
  /**
   * Numeric padding values
   * @param input A padding value
   * @returns A `Padding` instance, or `undefined` if the input is not a valid padding value.
   */
  static parse(input) {
    if (input instanceof Padding) {
      return input;
    }
    if (typeof input === "number") {
      return new Padding([input, input, input, input]);
    }
    if (!Array.isArray(input)) {
      return void 0;
    }
    if (input.length < 1 || input.length > 4) {
      return void 0;
    }
    for (const val of input) {
      if (typeof val !== "number") {
        return void 0;
      }
    }
    switch (input.length) {
      case 1:
        input = [input[0], input[0], input[0], input[0]];
        break;
      case 2:
        input = [input[0], input[1], input[0], input[1]];
        break;
      case 3:
        input = [input[0], input[1], input[2], input[1]];
        break;
    }
    return new Padding(input);
  }
  toString() {
    return JSON.stringify(this.values);
  }
}

class ResolvedImage {
  constructor(options) {
    this.name = options.name;
    this.available = options.available;
  }
  toString() {
    return this.name;
  }
  static fromString(name) {
    if (!name)
      return null;
    return new ResolvedImage({ name, available: false });
  }
}

function validateRGBA(r, g, b, a) {
  if (!(typeof r === "number" && r >= 0 && r <= 255 && typeof g === "number" && g >= 0 && g <= 255 && typeof b === "number" && b >= 0 && b <= 255)) {
    const value = typeof a === "number" ? [r, g, b, a] : [r, g, b];
    return `Invalid rgba value [${value.join(", ")}]: 'r', 'g', and 'b' must be between 0 and 255.`;
  }
  if (!(typeof a === "undefined" || typeof a === "number" && a >= 0 && a <= 1)) {
    return `Invalid rgba value [${[r, g, b, a].join(", ")}]: 'a' must be between 0 and 1.`;
  }
  return null;
}
function isValue(mixed) {
  if (mixed === null) {
    return true;
  } else if (typeof mixed === "string") {
    return true;
  } else if (typeof mixed === "boolean") {
    return true;
  } else if (typeof mixed === "number") {
    return true;
  } else if (mixed instanceof Color) {
    return true;
  } else if (mixed instanceof Collator) {
    return true;
  } else if (mixed instanceof Formatted) {
    return true;
  } else if (mixed instanceof Padding) {
    return true;
  } else if (mixed instanceof ResolvedImage) {
    return true;
  } else if (Array.isArray(mixed)) {
    for (const item of mixed) {
      if (!isValue(item)) {
        return false;
      }
    }
    return true;
  } else if (typeof mixed === "object") {
    for (const key in mixed) {
      if (!isValue(mixed[key])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}
function typeOf(value) {
  if (value === null) {
    return NullType;
  } else if (typeof value === "string") {
    return StringType;
  } else if (typeof value === "boolean") {
    return BooleanType;
  } else if (typeof value === "number") {
    return NumberType;
  } else if (value instanceof Color) {
    return ColorType;
  } else if (value instanceof Collator) {
    return CollatorType;
  } else if (value instanceof Formatted) {
    return FormattedType;
  } else if (value instanceof Padding) {
    return PaddingType;
  } else if (value instanceof ResolvedImage) {
    return ResolvedImageType;
  } else if (Array.isArray(value)) {
    const length = value.length;
    let itemType;
    for (const item of value) {
      const t = typeOf(item);
      if (!itemType) {
        itemType = t;
      } else if (itemType === t) {
        continue;
      } else {
        itemType = ValueType;
        break;
      }
    }
    return array$1(itemType || ValueType, length);
  } else {
    return ObjectType;
  }
}
function toString(value) {
  const type = typeof value;
  if (value === null) {
    return "";
  } else if (type === "string" || type === "number" || type === "boolean") {
    return String(value);
  } else if (value instanceof Color || value instanceof Formatted || value instanceof Padding || value instanceof ResolvedImage) {
    return value.toString();
  } else {
    return JSON.stringify(value);
  }
}

class Literal {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
  static parse(args, context) {
    if (args.length !== 2)
      return context.error(`'literal' expression requires exactly one argument, but found ${args.length - 1} instead.`);
    if (!isValue(args[1]))
      return context.error("invalid value");
    const value = args[1];
    let type = typeOf(value);
    const expected = context.expectedType;
    if (type.kind === "array" && type.N === 0 && expected && expected.kind === "array" && (typeof expected.N !== "number" || expected.N === 0)) {
      type = expected;
    }
    return new Literal(type, value);
  }
  evaluate() {
    return this.value;
  }
  eachChild() {
  }
  outputDefined() {
    return true;
  }
}

class RuntimeError {
  constructor(message) {
    this.name = "ExpressionEvaluationError";
    this.message = message;
  }
  toJSON() {
    return this.message;
  }
}

const types$3 = {
  string: StringType,
  number: NumberType,
  boolean: BooleanType,
  object: ObjectType
};
class Assertion {
  constructor(type, args) {
    this.type = type;
    this.args = args;
  }
  static parse(args, context) {
    if (args.length < 2)
      return context.error("Expected at least one argument.");
    let i = 1;
    let type;
    const name = args[0];
    if (name === "array") {
      let itemType;
      if (args.length > 2) {
        const type2 = args[1];
        if (typeof type2 !== "string" || !(type2 in types$3) || type2 === "object")
          return context.error('The item type argument of "array" must be one of string, number, boolean', 1);
        itemType = types$3[type2];
        i++;
      } else {
        itemType = ValueType;
      }
      let N;
      if (args.length > 3) {
        if (args[2] !== null && (typeof args[2] !== "number" || args[2] < 0 || args[2] !== Math.floor(args[2]))) {
          return context.error('The length argument to "array" must be a positive integer literal', 2);
        }
        N = args[2];
        i++;
      }
      type = array$1(itemType, N);
    } else {
      if (!types$3[name])
        throw new Error(`Types doesn't contain name = ${name}`);
      type = types$3[name];
    }
    const parsed = [];
    for (; i < args.length; i++) {
      const input = context.parse(args[i], i, ValueType);
      if (!input)
        return null;
      parsed.push(input);
    }
    return new Assertion(type, parsed);
  }
  evaluate(ctx) {
    for (let i = 0; i < this.args.length; i++) {
      const value = this.args[i].evaluate(ctx);
      const error = checkSubtype(this.type, typeOf(value));
      if (!error) {
        return value;
      } else if (i === this.args.length - 1) {
        throw new RuntimeError(`Expected value to be of type ${toString$1(this.type)}, but found ${toString$1(typeOf(value))} instead.`);
      }
    }
    throw new Error();
  }
  eachChild(fn) {
    this.args.forEach(fn);
  }
  outputDefined() {
    return this.args.every((arg) => arg.outputDefined());
  }
}

const types$2 = {
  "to-boolean": BooleanType,
  "to-color": ColorType,
  "to-number": NumberType,
  "to-string": StringType
};
class Coercion {
  constructor(type, args) {
    this.type = type;
    this.args = args;
  }
  static parse(args, context) {
    if (args.length < 2)
      return context.error("Expected at least one argument.");
    const name = args[0];
    if (!types$2[name])
      throw new Error(`Can't parse ${name} as it is not part of the known types`);
    if ((name === "to-boolean" || name === "to-string") && args.length !== 2)
      return context.error("Expected one argument.");
    const type = types$2[name];
    const parsed = [];
    for (let i = 1; i < args.length; i++) {
      const input = context.parse(args[i], i, ValueType);
      if (!input)
        return null;
      parsed.push(input);
    }
    return new Coercion(type, parsed);
  }
  evaluate(ctx) {
    if (this.type.kind === "boolean") {
      return Boolean(this.args[0].evaluate(ctx));
    } else if (this.type.kind === "color") {
      let input;
      let error;
      for (const arg of this.args) {
        input = arg.evaluate(ctx);
        error = null;
        if (input instanceof Color) {
          return input;
        } else if (typeof input === "string") {
          const c = ctx.parseColor(input);
          if (c)
            return c;
        } else if (Array.isArray(input)) {
          if (input.length < 3 || input.length > 4) {
            error = `Invalid rbga value ${JSON.stringify(input)}: expected an array containing either three or four numeric values.`;
          } else {
            error = validateRGBA(input[0], input[1], input[2], input[3]);
          }
          if (!error) {
            return new Color(input[0] / 255, input[1] / 255, input[2] / 255, input[3]);
          }
        }
      }
      throw new RuntimeError(error || `Could not parse color from value '${typeof input === "string" ? input : JSON.stringify(input)}'`);
    } else if (this.type.kind === "padding") {
      let input;
      for (const arg of this.args) {
        input = arg.evaluate(ctx);
        const pad = Padding.parse(input);
        if (pad) {
          return pad;
        }
      }
      throw new RuntimeError(`Could not parse padding from value '${typeof input === "string" ? input : JSON.stringify(input)}'`);
    } else if (this.type.kind === "number") {
      let value = null;
      for (const arg of this.args) {
        value = arg.evaluate(ctx);
        if (value === null)
          return 0;
        const num = Number(value);
        if (isNaN(num))
          continue;
        return num;
      }
      throw new RuntimeError(`Could not convert ${JSON.stringify(value)} to number.`);
    } else if (this.type.kind === "formatted") {
      return Formatted.fromString(toString(this.args[0].evaluate(ctx)));
    } else if (this.type.kind === "resolvedImage") {
      return ResolvedImage.fromString(toString(this.args[0].evaluate(ctx)));
    } else {
      return toString(this.args[0].evaluate(ctx));
    }
  }
  eachChild(fn) {
    this.args.forEach(fn);
  }
  outputDefined() {
    return this.args.every((arg) => arg.outputDefined());
  }
}

const geometryTypes = ["Unknown", "Point", "LineString", "Polygon"];
class EvaluationContext {
  constructor() {
    this.globals = null;
    this.feature = null;
    this.featureState = null;
    this.formattedSection = null;
    this._parseColorCache = {};
    this.availableImages = null;
    this.canonical = null;
  }
  id() {
    return this.feature && "id" in this.feature ? this.feature.id : null;
  }
  geometryType() {
    return this.feature ? typeof this.feature.type === "number" ? geometryTypes[this.feature.type] : this.feature.type : null;
  }
  geometry() {
    return this.feature && "geometry" in this.feature ? this.feature.geometry : null;
  }
  canonicalID() {
    return this.canonical;
  }
  properties() {
    return this.feature && this.feature.properties || {};
  }
  parseColor(input) {
    let cached = this._parseColorCache[input];
    if (!cached) {
      cached = this._parseColorCache[input] = Color.parse(input);
    }
    return cached;
  }
}

class ParsingContext {
  constructor(registry, isConstantFunc, path = [], expectedType, scope = new Scope(), errors = []) {
    this.registry = registry;
    this.path = path;
    this.key = path.map((part) => `[${part}]`).join("");
    this.scope = scope;
    this.errors = errors;
    this.expectedType = expectedType;
    this._isConstant = isConstantFunc;
  }
  /**
   * @param expr the JSON expression to parse
   * @param index the optional argument index if this expression is an argument of a parent expression that's being parsed
   * @param options
   * @param options.omitTypeAnnotations set true to omit inferred type annotations.  Caller beware: with this option set, the parsed expression's type will NOT satisfy `expectedType` if it would normally be wrapped in an inferred annotation.
   * @private
   */
  parse(expr, index, expectedType, bindings, options = {}) {
    if (index) {
      return this.concat(index, expectedType, bindings)._parse(expr, options);
    }
    return this._parse(expr, options);
  }
  _parse(expr, options) {
    if (expr === null || typeof expr === "string" || typeof expr === "boolean" || typeof expr === "number") {
      expr = ["literal", expr];
    }
    function annotate(parsed, type, typeAnnotation) {
      if (typeAnnotation === "assert") {
        return new Assertion(type, [parsed]);
      } else if (typeAnnotation === "coerce") {
        return new Coercion(type, [parsed]);
      } else {
        return parsed;
      }
    }
    if (Array.isArray(expr)) {
      if (expr.length === 0) {
        return this.error('Expected an array with at least one element. If you wanted a literal array, use ["literal", []].');
      }
      const op = expr[0];
      if (typeof op !== "string") {
        this.error(`Expression name must be a string, but found ${typeof op} instead. If you wanted a literal array, use ["literal", [...]].`, 0);
        return null;
      }
      const Expr = this.registry[op];
      if (Expr) {
        let parsed = Expr.parse(expr, this);
        if (!parsed)
          return null;
        if (this.expectedType) {
          const expected = this.expectedType;
          const actual = parsed.type;
          if ((expected.kind === "string" || expected.kind === "number" || expected.kind === "boolean" || expected.kind === "object" || expected.kind === "array") && actual.kind === "value") {
            parsed = annotate(parsed, expected, options.typeAnnotation || "assert");
          } else if ((expected.kind === "color" || expected.kind === "formatted" || expected.kind === "resolvedImage") && (actual.kind === "value" || actual.kind === "string")) {
            parsed = annotate(parsed, expected, options.typeAnnotation || "coerce");
          } else if (expected.kind === "padding" && (actual.kind === "value" || actual.kind === "number" || actual.kind === "array")) {
            parsed = annotate(parsed, expected, options.typeAnnotation || "coerce");
          } else if (this.checkSubtype(expected, actual)) {
            return null;
          }
        }
        if (!(parsed instanceof Literal) && parsed.type.kind !== "resolvedImage" && this._isConstant(parsed)) {
          const ec = new EvaluationContext();
          try {
            parsed = new Literal(parsed.type, parsed.evaluate(ec));
          } catch (e) {
            this.error(e.message);
            return null;
          }
        }
        return parsed;
      }
      return this.error(`Unknown expression "${op}". If you wanted a literal array, use ["literal", [...]].`, 0);
    } else if (typeof expr === "undefined") {
      return this.error("'undefined' value invalid. Use null instead.");
    } else if (typeof expr === "object") {
      return this.error('Bare objects invalid. Use ["literal", {...}] instead.');
    } else {
      return this.error(`Expected an array, but found ${typeof expr} instead.`);
    }
  }
  /**
   * Returns a copy of this context suitable for parsing the subexpression at
   * index `index`, optionally appending to 'let' binding map.
   *
   * Note that `errors` property, intended for collecting errors while
   * parsing, is copied by reference rather than cloned.
   * @private
   */
  concat(index, expectedType, bindings) {
    const path = typeof index === "number" ? this.path.concat(index) : this.path;
    const scope = bindings ? this.scope.concat(bindings) : this.scope;
    return new ParsingContext(
      this.registry,
      this._isConstant,
      path,
      expectedType || null,
      scope,
      this.errors
    );
  }
  /**
   * Push a parsing (or type checking) error into the `this.errors`
   * @param error The message
   * @param keys Optionally specify the source of the error at a child
   * of the current expression at `this.key`.
   * @private
   */
  error(error, ...keys) {
    const key = `${this.key}${keys.map((k) => `[${k}]`).join("")}`;
    this.errors.push(new ExpressionParsingError(key, error));
  }
  /**
   * Returns null if `t` is a subtype of `expected`; otherwise returns an
   * error message and also pushes it to `this.errors`.
   * @param expected The expected type
   * @param t The actual type
   * @returns null if `t` is a subtype of `expected`; otherwise returns an error message
   */
  checkSubtype(expected, t) {
    const error = checkSubtype(expected, t);
    if (error)
      this.error(error);
    return error;
  }
}

class CollatorExpression {
  constructor(caseSensitive, diacriticSensitive, locale) {
    this.type = CollatorType;
    this.locale = locale;
    this.caseSensitive = caseSensitive;
    this.diacriticSensitive = diacriticSensitive;
  }
  static parse(args, context) {
    if (args.length !== 2)
      return context.error("Expected one argument.");
    const options = args[1];
    if (typeof options !== "object" || Array.isArray(options))
      return context.error("Collator options argument must be an object.");
    const caseSensitive = context.parse(
      options["case-sensitive"] === void 0 ? false : options["case-sensitive"],
      1,
      BooleanType
    );
    if (!caseSensitive)
      return null;
    const diacriticSensitive = context.parse(
      options["diacritic-sensitive"] === void 0 ? false : options["diacritic-sensitive"],
      1,
      BooleanType
    );
    if (!diacriticSensitive)
      return null;
    let locale = null;
    if (options["locale"]) {
      locale = context.parse(options["locale"], 1, StringType);
      if (!locale)
        return null;
    }
    return new CollatorExpression(caseSensitive, diacriticSensitive, locale);
  }
  evaluate(ctx) {
    return new Collator(this.caseSensitive.evaluate(ctx), this.diacriticSensitive.evaluate(ctx), this.locale ? this.locale.evaluate(ctx) : null);
  }
  eachChild(fn) {
    fn(this.caseSensitive);
    fn(this.diacriticSensitive);
    if (this.locale) {
      fn(this.locale);
    }
  }
  outputDefined() {
    return false;
  }
}

const EXTENT = 8192;
function updateBBox(bbox, coord) {
  bbox[0] = Math.min(bbox[0], coord[0]);
  bbox[1] = Math.min(bbox[1], coord[1]);
  bbox[2] = Math.max(bbox[2], coord[0]);
  bbox[3] = Math.max(bbox[3], coord[1]);
}
function mercatorXfromLng(lng) {
  return (180 + lng) / 360;
}
function mercatorYfromLat(lat) {
  return (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) / 360;
}
function boxWithinBox(bbox1, bbox2) {
  if (bbox1[0] <= bbox2[0])
    return false;
  if (bbox1[2] >= bbox2[2])
    return false;
  if (bbox1[1] <= bbox2[1])
    return false;
  if (bbox1[3] >= bbox2[3])
    return false;
  return true;
}
function getTileCoordinates(p, canonical) {
  const x = mercatorXfromLng(p[0]);
  const y = mercatorYfromLat(p[1]);
  const tilesAtZoom = Math.pow(2, canonical.z);
  return [Math.round(x * tilesAtZoom * EXTENT), Math.round(y * tilesAtZoom * EXTENT)];
}
function onBoundary(p, p1, p2) {
  const x1 = p[0] - p1[0];
  const y1 = p[1] - p1[1];
  const x2 = p[0] - p2[0];
  const y2 = p[1] - p2[1];
  return x1 * y2 - x2 * y1 === 0 && x1 * x2 <= 0 && y1 * y2 <= 0;
}
function rayIntersect(p, p1, p2) {
  return p1[1] > p[1] !== p2[1] > p[1] && p[0] < (p2[0] - p1[0]) * (p[1] - p1[1]) / (p2[1] - p1[1]) + p1[0];
}
function pointWithinPolygon(point, rings) {
  let inside = false;
  for (let i = 0, len = rings.length; i < len; i++) {
    const ring = rings[i];
    for (let j = 0, len2 = ring.length; j < len2 - 1; j++) {
      if (onBoundary(point, ring[j], ring[j + 1]))
        return false;
      if (rayIntersect(point, ring[j], ring[j + 1]))
        inside = !inside;
    }
  }
  return inside;
}
function pointWithinPolygons(point, polygons) {
  for (let i = 0; i < polygons.length; i++) {
    if (pointWithinPolygon(point, polygons[i]))
      return true;
  }
  return false;
}
function perp(v1, v2) {
  return v1[0] * v2[1] - v1[1] * v2[0];
}
function twoSided(p1, p2, q1, q2) {
  const x1 = p1[0] - q1[0];
  const y1 = p1[1] - q1[1];
  const x2 = p2[0] - q1[0];
  const y2 = p2[1] - q1[1];
  const x3 = q2[0] - q1[0];
  const y3 = q2[1] - q1[1];
  const det1 = x1 * y3 - x3 * y1;
  const det2 = x2 * y3 - x3 * y2;
  if (det1 > 0 && det2 < 0 || det1 < 0 && det2 > 0)
    return true;
  return false;
}
function lineIntersectLine(a, b, c, d) {
  const vectorP = [b[0] - a[0], b[1] - a[1]];
  const vectorQ = [d[0] - c[0], d[1] - c[1]];
  if (perp(vectorQ, vectorP) === 0)
    return false;
  if (twoSided(a, b, c, d) && twoSided(c, d, a, b))
    return true;
  return false;
}
function lineIntersectPolygon(p1, p2, polygon) {
  for (const ring of polygon) {
    for (let j = 0; j < ring.length - 1; ++j) {
      if (lineIntersectLine(p1, p2, ring[j], ring[j + 1])) {
        return true;
      }
    }
  }
  return false;
}
function lineStringWithinPolygon(line, polygon) {
  for (let i = 0; i < line.length; ++i) {
    if (!pointWithinPolygon(line[i], polygon)) {
      return false;
    }
  }
  for (let i = 0; i < line.length - 1; ++i) {
    if (lineIntersectPolygon(line[i], line[i + 1], polygon)) {
      return false;
    }
  }
  return true;
}
function lineStringWithinPolygons(line, polygons) {
  for (let i = 0; i < polygons.length; i++) {
    if (lineStringWithinPolygon(line, polygons[i]))
      return true;
  }
  return false;
}
function getTilePolygon(coordinates, bbox, canonical) {
  const polygon = [];
  for (let i = 0; i < coordinates.length; i++) {
    const ring = [];
    for (let j = 0; j < coordinates[i].length; j++) {
      const coord = getTileCoordinates(coordinates[i][j], canonical);
      updateBBox(bbox, coord);
      ring.push(coord);
    }
    polygon.push(ring);
  }
  return polygon;
}
function getTilePolygons(coordinates, bbox, canonical) {
  const polygons = [];
  for (let i = 0; i < coordinates.length; i++) {
    const polygon = getTilePolygon(coordinates[i], bbox, canonical);
    polygons.push(polygon);
  }
  return polygons;
}
function updatePoint(p, bbox, polyBBox, worldSize) {
  if (p[0] < polyBBox[0] || p[0] > polyBBox[2]) {
    const halfWorldSize = worldSize * 0.5;
    let shift = p[0] - polyBBox[0] > halfWorldSize ? -worldSize : polyBBox[0] - p[0] > halfWorldSize ? worldSize : 0;
    if (shift === 0) {
      shift = p[0] - polyBBox[2] > halfWorldSize ? -worldSize : polyBBox[2] - p[0] > halfWorldSize ? worldSize : 0;
    }
    p[0] += shift;
  }
  updateBBox(bbox, p);
}
function resetBBox(bbox) {
  bbox[0] = bbox[1] = Infinity;
  bbox[2] = bbox[3] = -Infinity;
}
function getTilePoints(geometry, pointBBox, polyBBox, canonical) {
  const worldSize = Math.pow(2, canonical.z) * EXTENT;
  const shifts = [canonical.x * EXTENT, canonical.y * EXTENT];
  const tilePoints = [];
  for (const points of geometry) {
    for (const point of points) {
      const p = [point.x + shifts[0], point.y + shifts[1]];
      updatePoint(p, pointBBox, polyBBox, worldSize);
      tilePoints.push(p);
    }
  }
  return tilePoints;
}
function getTileLines(geometry, lineBBox, polyBBox, canonical) {
  const worldSize = Math.pow(2, canonical.z) * EXTENT;
  const shifts = [canonical.x * EXTENT, canonical.y * EXTENT];
  const tileLines = [];
  for (const line of geometry) {
    const tileLine = [];
    for (const point of line) {
      const p = [point.x + shifts[0], point.y + shifts[1]];
      updateBBox(lineBBox, p);
      tileLine.push(p);
    }
    tileLines.push(tileLine);
  }
  if (lineBBox[2] - lineBBox[0] <= worldSize / 2) {
    resetBBox(lineBBox);
    for (const line of tileLines) {
      for (const p of line) {
        updatePoint(p, lineBBox, polyBBox, worldSize);
      }
    }
  }
  return tileLines;
}
function pointsWithinPolygons(ctx, polygonGeometry) {
  const pointBBox = [Infinity, Infinity, -Infinity, -Infinity];
  const polyBBox = [Infinity, Infinity, -Infinity, -Infinity];
  const canonical = ctx.canonicalID();
  if (polygonGeometry.type === "Polygon") {
    const tilePolygon = getTilePolygon(polygonGeometry.coordinates, polyBBox, canonical);
    const tilePoints = getTilePoints(ctx.geometry(), pointBBox, polyBBox, canonical);
    if (!boxWithinBox(pointBBox, polyBBox))
      return false;
    for (const point of tilePoints) {
      if (!pointWithinPolygon(point, tilePolygon))
        return false;
    }
  }
  if (polygonGeometry.type === "MultiPolygon") {
    const tilePolygons = getTilePolygons(polygonGeometry.coordinates, polyBBox, canonical);
    const tilePoints = getTilePoints(ctx.geometry(), pointBBox, polyBBox, canonical);
    if (!boxWithinBox(pointBBox, polyBBox))
      return false;
    for (const point of tilePoints) {
      if (!pointWithinPolygons(point, tilePolygons))
        return false;
    }
  }
  return true;
}
function linesWithinPolygons(ctx, polygonGeometry) {
  const lineBBox = [Infinity, Infinity, -Infinity, -Infinity];
  const polyBBox = [Infinity, Infinity, -Infinity, -Infinity];
  const canonical = ctx.canonicalID();
  if (polygonGeometry.type === "Polygon") {
    const tilePolygon = getTilePolygon(polygonGeometry.coordinates, polyBBox, canonical);
    const tileLines = getTileLines(ctx.geometry(), lineBBox, polyBBox, canonical);
    if (!boxWithinBox(lineBBox, polyBBox))
      return false;
    for (const line of tileLines) {
      if (!lineStringWithinPolygon(line, tilePolygon))
        return false;
    }
  }
  if (polygonGeometry.type === "MultiPolygon") {
    const tilePolygons = getTilePolygons(polygonGeometry.coordinates, polyBBox, canonical);
    const tileLines = getTileLines(ctx.geometry(), lineBBox, polyBBox, canonical);
    if (!boxWithinBox(lineBBox, polyBBox))
      return false;
    for (const line of tileLines) {
      if (!lineStringWithinPolygons(line, tilePolygons))
        return false;
    }
  }
  return true;
}
class Within {
  constructor(geojson, geometries) {
    this.type = BooleanType;
    this.geojson = geojson;
    this.geometries = geometries;
  }
  static parse(args, context) {
    if (args.length !== 2)
      return context.error(`'within' expression requires exactly one argument, but found ${args.length - 1} instead.`);
    if (isValue(args[1])) {
      const geojson = args[1];
      if (geojson.type === "FeatureCollection") {
        for (let i = 0; i < geojson.features.length; ++i) {
          const type = geojson.features[i].geometry.type;
          if (type === "Polygon" || type === "MultiPolygon") {
            return new Within(geojson, geojson.features[i].geometry);
          }
        }
      } else if (geojson.type === "Feature") {
        const type = geojson.geometry.type;
        if (type === "Polygon" || type === "MultiPolygon") {
          return new Within(geojson, geojson.geometry);
        }
      } else if (geojson.type === "Polygon" || geojson.type === "MultiPolygon") {
        return new Within(geojson, geojson);
      }
    }
    return context.error("'within' expression requires valid geojson object that contains polygon geometry type.");
  }
  evaluate(ctx) {
    if (ctx.geometry() != null && ctx.canonicalID() != null) {
      if (ctx.geometryType() === "Point") {
        return pointsWithinPolygons(ctx, this.geometries);
      } else if (ctx.geometryType() === "LineString") {
        return linesWithinPolygons(ctx, this.geometries);
      }
    }
    return false;
  }
  eachChild() {
  }
  outputDefined() {
    return true;
  }
}

class Var {
  constructor(name, boundExpression) {
    this.type = boundExpression.type;
    this.name = name;
    this.boundExpression = boundExpression;
  }
  static parse(args, context) {
    if (args.length !== 2 || typeof args[1] !== "string")
      return context.error("'var' expression requires exactly one string literal argument.");
    const name = args[1];
    if (!context.scope.has(name)) {
      return context.error(`Unknown variable "${name}". Make sure "${name}" has been bound in an enclosing "let" expression before using it.`, 1);
    }
    return new Var(name, context.scope.get(name));
  }
  evaluate(ctx) {
    return this.boundExpression.evaluate(ctx);
  }
  eachChild() {
  }
  outputDefined() {
    return false;
  }
}

class CompoundExpression {
  constructor(name, type, evaluate, args) {
    this.name = name;
    this.type = type;
    this._evaluate = evaluate;
    this.args = args;
  }
  evaluate(ctx) {
    return this._evaluate(ctx, this.args);
  }
  eachChild(fn) {
    this.args.forEach(fn);
  }
  outputDefined() {
    return false;
  }
  static parse(args, context) {
    const op = args[0];
    const definition = CompoundExpression.definitions[op];
    if (!definition) {
      return context.error(`Unknown expression "${op}". If you wanted a literal array, use ["literal", [...]].`, 0);
    }
    const type = Array.isArray(definition) ? definition[0] : definition.type;
    const availableOverloads = Array.isArray(definition) ? [[definition[1], definition[2]]] : definition.overloads;
    const overloads = availableOverloads.filter(([signature]) => !Array.isArray(signature) || // varags
    signature.length === args.length - 1);
    let signatureContext = null;
    for (const [params, evaluate] of overloads) {
      signatureContext = new ParsingContext(context.registry, isExpressionConstant, context.path, null, context.scope);
      const parsedArgs = [];
      let argParseFailed = false;
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const expectedType = Array.isArray(params) ? params[i - 1] : params.type;
        const parsed = signatureContext.parse(arg, 1 + parsedArgs.length, expectedType);
        if (!parsed) {
          argParseFailed = true;
          break;
        }
        parsedArgs.push(parsed);
      }
      if (argParseFailed) {
        continue;
      }
      if (Array.isArray(params)) {
        if (params.length !== parsedArgs.length) {
          signatureContext.error(`Expected ${params.length} arguments, but found ${parsedArgs.length} instead.`);
          continue;
        }
      }
      for (let i = 0; i < parsedArgs.length; i++) {
        const expected = Array.isArray(params) ? params[i] : params.type;
        const arg = parsedArgs[i];
        signatureContext.concat(i + 1).checkSubtype(expected, arg.type);
      }
      if (signatureContext.errors.length === 0) {
        return new CompoundExpression(op, type, evaluate, parsedArgs);
      }
    }
    if (overloads.length === 1) {
      context.errors.push(...signatureContext.errors);
    } else {
      const expected = overloads.length ? overloads : availableOverloads;
      const signatures = expected.map(([params]) => stringifySignature(params)).join(" | ");
      const actualTypes = [];
      for (let i = 1; i < args.length; i++) {
        const parsed = context.parse(args[i], 1 + actualTypes.length);
        if (!parsed)
          return null;
        actualTypes.push(toString$1(parsed.type));
      }
      context.error(`Expected arguments of type ${signatures}, but found (${actualTypes.join(", ")}) instead.`);
    }
    return null;
  }
  static register(registry, definitions) {
    CompoundExpression.definitions = definitions;
    for (const name in definitions) {
      registry[name] = CompoundExpression;
    }
  }
}
function stringifySignature(signature) {
  if (Array.isArray(signature)) {
    return `(${signature.map(toString$1).join(", ")})`;
  } else {
    return `(${toString$1(signature.type)}...)`;
  }
}
function isExpressionConstant(expression) {
  if (expression instanceof Var) {
    return isExpressionConstant(expression.boundExpression);
  } else if (expression instanceof CompoundExpression && expression.name === "error") {
    return false;
  } else if (expression instanceof CollatorExpression) {
    return false;
  } else if (expression instanceof Within) {
    return false;
  }
  const isTypeAnnotation = expression instanceof Coercion || expression instanceof Assertion;
  let childrenConstant = true;
  expression.eachChild((child) => {
    if (isTypeAnnotation) {
      childrenConstant = childrenConstant && isExpressionConstant(child);
    } else {
      childrenConstant = childrenConstant && child instanceof Literal;
    }
  });
  if (!childrenConstant) {
    return false;
  }
  return isFeatureConstant(expression) && isGlobalPropertyConstant(
    expression,
    ["zoom", "heatmap-density", "line-progress", "accumulated", "is-supported-script"]
  );
}
function isFeatureConstant(e) {
  if (e instanceof CompoundExpression) {
    if (e.name === "get" && e.args.length === 1) {
      return false;
    } else if (e.name === "feature-state") {
      return false;
    } else if (e.name === "has" && e.args.length === 1) {
      return false;
    } else if (e.name === "properties" || e.name === "geometry-type" || e.name === "id") {
      return false;
    } else if (/^filter-/.test(e.name)) {
      return false;
    }
  }
  if (e instanceof Within) {
    return false;
  }
  let result = true;
  e.eachChild((arg) => {
    if (result && !isFeatureConstant(arg)) {
      result = false;
    }
  });
  return result;
}
function isGlobalPropertyConstant(e, properties) {
  if (e instanceof CompoundExpression && properties.indexOf(e.name) >= 0) {
    return false;
  }
  let result = true;
  e.eachChild((arg) => {
    if (result && !isGlobalPropertyConstant(arg, properties)) {
      result = false;
    }
  });
  return result;
}

class Let {
  constructor(bindings, result) {
    this.type = result.type;
    this.bindings = [].concat(bindings);
    this.result = result;
  }
  evaluate(ctx) {
    return this.result.evaluate(ctx);
  }
  eachChild(fn) {
    for (const binding of this.bindings) {
      fn(binding[1]);
    }
    fn(this.result);
  }
  static parse(args, context) {
    if (args.length < 4)
      return context.error(`Expected at least 3 arguments, but found ${args.length - 1} instead.`);
    const bindings = [];
    for (let i = 1; i < args.length - 1; i += 2) {
      const name = args[i];
      if (typeof name !== "string") {
        return context.error(`Expected string, but found ${typeof name} instead.`, i);
      }
      if (/[^a-zA-Z0-9_]/.test(name)) {
        return context.error("Variable names must contain only alphanumeric characters or '_'.", i);
      }
      const value = context.parse(args[i + 1], i + 1);
      if (!value)
        return null;
      bindings.push([name, value]);
    }
    const result = context.parse(args[args.length - 1], args.length - 1, context.expectedType, bindings);
    if (!result)
      return null;
    return new Let(bindings, result);
  }
  outputDefined() {
    return this.result.outputDefined();
  }
}

class At {
  constructor(type, index, input) {
    this.type = type;
    this.index = index;
    this.input = input;
  }
  static parse(args, context) {
    if (args.length !== 3)
      return context.error(`Expected 2 arguments, but found ${args.length - 1} instead.`);
    const index = context.parse(args[1], 1, NumberType);
    const input = context.parse(args[2], 2, array$1(context.expectedType || ValueType));
    if (!index || !input)
      return null;
    const t = input.type;
    return new At(t.itemType, index, input);
  }
  evaluate(ctx) {
    const index = this.index.evaluate(ctx);
    const array2 = this.input.evaluate(ctx);
    if (index < 0) {
      throw new RuntimeError(`Array index out of bounds: ${index} < 0.`);
    }
    if (index >= array2.length) {
      throw new RuntimeError(`Array index out of bounds: ${index} > ${array2.length - 1}.`);
    }
    if (index !== Math.floor(index)) {
      throw new RuntimeError(`Array index must be an integer, but found ${index} instead.`);
    }
    return array2[index];
  }
  eachChild(fn) {
    fn(this.index);
    fn(this.input);
  }
  outputDefined() {
    return false;
  }
}

class In {
  constructor(needle, haystack) {
    this.type = BooleanType;
    this.needle = needle;
    this.haystack = haystack;
  }
  static parse(args, context) {
    if (args.length !== 3) {
      return context.error(`Expected 2 arguments, but found ${args.length - 1} instead.`);
    }
    const needle = context.parse(args[1], 1, ValueType);
    const haystack = context.parse(args[2], 2, ValueType);
    if (!needle || !haystack)
      return null;
    if (!isValidType(needle.type, [BooleanType, StringType, NumberType, NullType, ValueType])) {
      return context.error(`Expected first argument to be of type boolean, string, number or null, but found ${toString$1(needle.type)} instead`);
    }
    return new In(needle, haystack);
  }
  evaluate(ctx) {
    const needle = this.needle.evaluate(ctx);
    const haystack = this.haystack.evaluate(ctx);
    if (!haystack)
      return false;
    if (!isValidNativeType(needle, ["boolean", "string", "number", "null"])) {
      throw new RuntimeError(`Expected first argument to be of type boolean, string, number or null, but found ${toString$1(typeOf(needle))} instead.`);
    }
    if (!isValidNativeType(haystack, ["string", "array"])) {
      throw new RuntimeError(`Expected second argument to be of type array or string, but found ${toString$1(typeOf(haystack))} instead.`);
    }
    return haystack.indexOf(needle) >= 0;
  }
  eachChild(fn) {
    fn(this.needle);
    fn(this.haystack);
  }
  outputDefined() {
    return true;
  }
}

class IndexOf {
  constructor(needle, haystack, fromIndex) {
    this.type = NumberType;
    this.needle = needle;
    this.haystack = haystack;
    this.fromIndex = fromIndex;
  }
  static parse(args, context) {
    if (args.length <= 2 || args.length >= 5) {
      return context.error(`Expected 3 or 4 arguments, but found ${args.length - 1} instead.`);
    }
    const needle = context.parse(args[1], 1, ValueType);
    const haystack = context.parse(args[2], 2, ValueType);
    if (!needle || !haystack)
      return null;
    if (!isValidType(needle.type, [BooleanType, StringType, NumberType, NullType, ValueType])) {
      return context.error(`Expected first argument to be of type boolean, string, number or null, but found ${toString$1(needle.type)} instead`);
    }
    if (args.length === 4) {
      const fromIndex = context.parse(args[3], 3, NumberType);
      if (!fromIndex)
        return null;
      return new IndexOf(needle, haystack, fromIndex);
    } else {
      return new IndexOf(needle, haystack);
    }
  }
  evaluate(ctx) {
    const needle = this.needle.evaluate(ctx);
    const haystack = this.haystack.evaluate(ctx);
    if (!isValidNativeType(needle, ["boolean", "string", "number", "null"])) {
      throw new RuntimeError(`Expected first argument to be of type boolean, string, number or null, but found ${toString$1(typeOf(needle))} instead.`);
    }
    if (!isValidNativeType(haystack, ["string", "array"])) {
      throw new RuntimeError(`Expected second argument to be of type array or string, but found ${toString$1(typeOf(haystack))} instead.`);
    }
    if (this.fromIndex) {
      const fromIndex = this.fromIndex.evaluate(ctx);
      return haystack.indexOf(needle, fromIndex);
    }
    return haystack.indexOf(needle);
  }
  eachChild(fn) {
    fn(this.needle);
    fn(this.haystack);
    if (this.fromIndex) {
      fn(this.fromIndex);
    }
  }
  outputDefined() {
    return false;
  }
}

class Match {
  constructor(inputType, outputType, input, cases, outputs, otherwise) {
    this.inputType = inputType;
    this.type = outputType;
    this.input = input;
    this.cases = cases;
    this.outputs = outputs;
    this.otherwise = otherwise;
  }
  static parse(args, context) {
    if (args.length < 5)
      return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
    if (args.length % 2 !== 1)
      return context.error("Expected an even number of arguments.");
    let inputType;
    let outputType;
    if (context.expectedType && context.expectedType.kind !== "value") {
      outputType = context.expectedType;
    }
    const cases = {};
    const outputs = [];
    for (let i = 2; i < args.length - 1; i += 2) {
      let labels = args[i];
      const value = args[i + 1];
      if (!Array.isArray(labels)) {
        labels = [labels];
      }
      const labelContext = context.concat(i);
      if (labels.length === 0) {
        return labelContext.error("Expected at least one branch label.");
      }
      for (const label of labels) {
        if (typeof label !== "number" && typeof label !== "string") {
          return labelContext.error("Branch labels must be numbers or strings.");
        } else if (typeof label === "number" && Math.abs(label) > Number.MAX_SAFE_INTEGER) {
          return labelContext.error(`Branch labels must be integers no larger than ${Number.MAX_SAFE_INTEGER}.`);
        } else if (typeof label === "number" && Math.floor(label) !== label) {
          return labelContext.error("Numeric branch labels must be integer values.");
        } else if (!inputType) {
          inputType = typeOf(label);
        } else if (labelContext.checkSubtype(inputType, typeOf(label))) {
          return null;
        }
        if (typeof cases[String(label)] !== "undefined") {
          return labelContext.error("Branch labels must be unique.");
        }
        cases[String(label)] = outputs.length;
      }
      const result = context.parse(value, i, outputType);
      if (!result)
        return null;
      outputType = outputType || result.type;
      outputs.push(result);
    }
    const input = context.parse(args[1], 1, ValueType);
    if (!input)
      return null;
    const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
    if (!otherwise)
      return null;
    if (input.type.kind !== "value" && context.concat(1).checkSubtype(inputType, input.type)) {
      return null;
    }
    return new Match(inputType, outputType, input, cases, outputs, otherwise);
  }
  evaluate(ctx) {
    const input = this.input.evaluate(ctx);
    const output = typeOf(input) === this.inputType && this.outputs[this.cases[input]] || this.otherwise;
    return output.evaluate(ctx);
  }
  eachChild(fn) {
    fn(this.input);
    this.outputs.forEach(fn);
    fn(this.otherwise);
  }
  outputDefined() {
    return this.outputs.every((out) => out.outputDefined()) && this.otherwise.outputDefined();
  }
}

class Case {
  constructor(type, branches, otherwise) {
    this.type = type;
    this.branches = branches;
    this.otherwise = otherwise;
  }
  static parse(args, context) {
    if (args.length < 4)
      return context.error(`Expected at least 3 arguments, but found only ${args.length - 1}.`);
    if (args.length % 2 !== 0)
      return context.error("Expected an odd number of arguments.");
    let outputType;
    if (context.expectedType && context.expectedType.kind !== "value") {
      outputType = context.expectedType;
    }
    const branches = [];
    for (let i = 1; i < args.length - 1; i += 2) {
      const test = context.parse(args[i], i, BooleanType);
      if (!test)
        return null;
      const result = context.parse(args[i + 1], i + 1, outputType);
      if (!result)
        return null;
      branches.push([test, result]);
      outputType = outputType || result.type;
    }
    const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
    if (!otherwise)
      return null;
    if (!outputType)
      throw new Error("Can't infer output type");
    return new Case(outputType, branches, otherwise);
  }
  evaluate(ctx) {
    for (const [test, expression] of this.branches) {
      if (test.evaluate(ctx)) {
        return expression.evaluate(ctx);
      }
    }
    return this.otherwise.evaluate(ctx);
  }
  eachChild(fn) {
    for (const [test, expression] of this.branches) {
      fn(test);
      fn(expression);
    }
    fn(this.otherwise);
  }
  outputDefined() {
    return this.branches.every(([_, out]) => out.outputDefined()) && this.otherwise.outputDefined();
  }
}

class Slice {
  constructor(type, input, beginIndex, endIndex) {
    this.type = type;
    this.input = input;
    this.beginIndex = beginIndex;
    this.endIndex = endIndex;
  }
  static parse(args, context) {
    if (args.length <= 2 || args.length >= 5) {
      return context.error(`Expected 3 or 4 arguments, but found ${args.length - 1} instead.`);
    }
    const input = context.parse(args[1], 1, ValueType);
    const beginIndex = context.parse(args[2], 2, NumberType);
    if (!input || !beginIndex)
      return null;
    if (!isValidType(input.type, [array$1(ValueType), StringType, ValueType])) {
      return context.error(`Expected first argument to be of type array or string, but found ${toString$1(input.type)} instead`);
    }
    if (args.length === 4) {
      const endIndex = context.parse(args[3], 3, NumberType);
      if (!endIndex)
        return null;
      return new Slice(input.type, input, beginIndex, endIndex);
    } else {
      return new Slice(input.type, input, beginIndex);
    }
  }
  evaluate(ctx) {
    const input = this.input.evaluate(ctx);
    const beginIndex = this.beginIndex.evaluate(ctx);
    if (!isValidNativeType(input, ["string", "array"])) {
      throw new RuntimeError(`Expected first argument to be of type array or string, but found ${toString$1(typeOf(input))} instead.`);
    }
    if (this.endIndex) {
      const endIndex = this.endIndex.evaluate(ctx);
      return input.slice(beginIndex, endIndex);
    }
    return input.slice(beginIndex);
  }
  eachChild(fn) {
    fn(this.input);
    fn(this.beginIndex);
    if (this.endIndex) {
      fn(this.endIndex);
    }
  }
  outputDefined() {
    return false;
  }
}

function findStopLessThanOrEqualTo(stops, input) {
  const lastIndex = stops.length - 1;
  let lowerIndex = 0;
  let upperIndex = lastIndex;
  let currentIndex = 0;
  let currentValue, nextValue;
  while (lowerIndex <= upperIndex) {
    currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
    currentValue = stops[currentIndex];
    nextValue = stops[currentIndex + 1];
    if (currentValue <= input) {
      if (currentIndex === lastIndex || input < nextValue) {
        return currentIndex;
      }
      lowerIndex = currentIndex + 1;
    } else if (currentValue > input) {
      upperIndex = currentIndex - 1;
    } else {
      throw new RuntimeError("Input is not a number.");
    }
  }
  return 0;
}

class Step {
  constructor(type, input, stops) {
    this.type = type;
    this.input = input;
    this.labels = [];
    this.outputs = [];
    for (const [label, expression] of stops) {
      this.labels.push(label);
      this.outputs.push(expression);
    }
  }
  static parse(args, context) {
    if (args.length - 1 < 4) {
      return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
    }
    if ((args.length - 1) % 2 !== 0) {
      return context.error("Expected an even number of arguments.");
    }
    const input = context.parse(args[1], 1, NumberType);
    if (!input)
      return null;
    const stops = [];
    let outputType = null;
    if (context.expectedType && context.expectedType.kind !== "value") {
      outputType = context.expectedType;
    }
    for (let i = 1; i < args.length; i += 2) {
      const label = i === 1 ? -Infinity : args[i];
      const value = args[i + 1];
      const labelKey = i;
      const valueKey = i + 1;
      if (typeof label !== "number") {
        return context.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
      }
      if (stops.length && stops[stops.length - 1][0] >= label) {
        return context.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.', labelKey);
      }
      const parsed = context.parse(value, valueKey, outputType);
      if (!parsed)
        return null;
      outputType = outputType || parsed.type;
      stops.push([label, parsed]);
    }
    return new Step(outputType, input, stops);
  }
  evaluate(ctx) {
    const labels = this.labels;
    const outputs = this.outputs;
    if (labels.length === 1) {
      return outputs[0].evaluate(ctx);
    }
    const value = this.input.evaluate(ctx);
    if (value <= labels[0]) {
      return outputs[0].evaluate(ctx);
    }
    const stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
      return outputs[stopCount - 1].evaluate(ctx);
    }
    const index = findStopLessThanOrEqualTo(labels, value);
    return outputs[index].evaluate(ctx);
  }
  eachChild(fn) {
    fn(this.input);
    for (const expression of this.outputs) {
      fn(expression);
    }
  }
  outputDefined() {
    return this.outputs.every((out) => out.outputDefined());
  }
}

const interpolateFactory = (interpolationType) => {
  switch (interpolationType) {
    case "number":
      return number;
    case "color":
      return color;
    case "array":
      return array;
    case "padding":
      return padding;
  }
};
function number(a, b, t) {
  return a * (1 - t) + b * t;
}
function color(from, to, t) {
  return new Color(
    number(from.r, to.r, t),
    number(from.g, to.g, t),
    number(from.b, to.b, t),
    number(from.a, to.a, t)
  );
}
function array(from, to, t) {
  return from.map((d, i) => {
    return number(d, to[i], t);
  });
}
function padding(from, to, t) {
  const fromVal = from.values;
  const toVal = to.values;
  return new Padding([
    number(fromVal[0], toVal[0], t),
    number(fromVal[1], toVal[1], t),
    number(fromVal[2], toVal[2], t),
    number(fromVal[3], toVal[3], t)
  ]);
}
const interpolates = {
  number,
  color,
  array,
  padding
};

const interpolate$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  array,
  color,
  default: interpolates,
  interpolateFactory,
  number,
  padding
}, Symbol.toStringTag, { value: 'Module' }));

const Xn = 0.95047, Yn = 1, Zn = 1.08883, t0 = 4 / 29, t1 = 6 / 29, t2 = 3 * t1 * t1, t3 = t1 * t1 * t1, deg2rad = Math.PI / 180, rad2deg = 180 / Math.PI;
function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}
function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}
function xyz2rgb(x) {
  return 255 * (x <= 31308e-7 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}
function rgb2xyz(x) {
  x /= 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function rgbToLab(rgbColor) {
  const b = rgb2xyz(rgbColor.r), a = rgb2xyz(rgbColor.g), l = rgb2xyz(rgbColor.b), x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn), y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.072175 * l) / Yn), z = xyz2lab((0.0193339 * b + 0.119192 * a + 0.9503041 * l) / Zn);
  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
    alpha: rgbColor.a
  };
}
function labToRgb(labColor) {
  let y = (labColor.l + 16) / 116, x = isNaN(labColor.a) ? y : y + labColor.a / 500, z = isNaN(labColor.b) ? y : y - labColor.b / 200;
  y = Yn * lab2xyz(y);
  x = Xn * lab2xyz(x);
  z = Zn * lab2xyz(z);
  return new Color(
    xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    // D65 -> sRGB
    xyz2rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
    xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
    labColor.alpha
  );
}
function interpolateLab(from, to, t) {
  return {
    l: number(from.l, to.l, t),
    a: number(from.a, to.a, t),
    b: number(from.b, to.b, t),
    alpha: number(from.alpha, to.alpha, t)
  };
}
function rgbToHcl(rgbColor) {
  const { l, a, b } = rgbToLab(rgbColor);
  const h = Math.atan2(b, a) * rad2deg;
  return {
    h: h < 0 ? h + 360 : h,
    c: Math.sqrt(a * a + b * b),
    l,
    alpha: rgbColor.a
  };
}
function hclToRgb(hclColor) {
  const h = hclColor.h * deg2rad, c = hclColor.c, l = hclColor.l;
  return labToRgb({
    l,
    a: Math.cos(h) * c,
    b: Math.sin(h) * c,
    alpha: hclColor.alpha
  });
}
function interpolateHue(a, b, t) {
  const d = b - a;
  return a + t * (d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d);
}
function interpolateHcl(from, to, t) {
  return {
    h: interpolateHue(from.h, to.h, t),
    c: number(from.c, to.c, t),
    l: number(from.l, to.l, t),
    alpha: number(from.alpha, to.alpha, t)
  };
}
const lab = {
  forward: rgbToLab,
  reverse: labToRgb,
  interpolate: interpolateLab
};
const hcl = {
  forward: rgbToHcl,
  reverse: hclToRgb,
  interpolate: interpolateHcl
};

class Interpolate {
  constructor(type, operator, interpolation, input, stops) {
    this.type = type;
    this.operator = operator;
    this.interpolation = interpolation;
    this.input = input;
    this.labels = [];
    this.outputs = [];
    for (const [label, expression] of stops) {
      this.labels.push(label);
      this.outputs.push(expression);
    }
  }
  static interpolationFactor(interpolation, input, lower, upper) {
    let t = 0;
    if (interpolation.name === "exponential") {
      t = exponentialInterpolation(input, interpolation.base, lower, upper);
    } else if (interpolation.name === "linear") {
      t = exponentialInterpolation(input, 1, lower, upper);
    } else if (interpolation.name === "cubic-bezier") {
      const c = interpolation.controlPoints;
      const ub = new UnitBezier(c[0], c[1], c[2], c[3]);
      t = ub.solve(exponentialInterpolation(input, 1, lower, upper));
    }
    return t;
  }
  static parse(args, context) {
    let [operator, interpolation, input, ...rest] = args;
    if (!Array.isArray(interpolation) || interpolation.length === 0) {
      return context.error("Expected an interpolation type expression.", 1);
    }
    if (interpolation[0] === "linear") {
      interpolation = { name: "linear" };
    } else if (interpolation[0] === "exponential") {
      const base = interpolation[1];
      if (typeof base !== "number")
        return context.error("Exponential interpolation requires a numeric base.", 1, 1);
      interpolation = {
        name: "exponential",
        base
      };
    } else if (interpolation[0] === "cubic-bezier") {
      const controlPoints = interpolation.slice(1);
      if (controlPoints.length !== 4 || controlPoints.some((t) => typeof t !== "number" || t < 0 || t > 1)) {
        return context.error("Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.", 1);
      }
      interpolation = {
        name: "cubic-bezier",
        controlPoints
      };
    } else {
      return context.error(`Unknown interpolation type ${String(interpolation[0])}`, 1, 0);
    }
    if (args.length - 1 < 4) {
      return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
    }
    if ((args.length - 1) % 2 !== 0) {
      return context.error("Expected an even number of arguments.");
    }
    input = context.parse(input, 2, NumberType);
    if (!input)
      return null;
    const stops = [];
    let outputType = null;
    if (operator === "interpolate-hcl" || operator === "interpolate-lab") {
      outputType = ColorType;
    } else if (context.expectedType && context.expectedType.kind !== "value") {
      outputType = context.expectedType;
    }
    for (let i = 0; i < rest.length; i += 2) {
      const label = rest[i];
      const value = rest[i + 1];
      const labelKey = i + 3;
      const valueKey = i + 4;
      if (typeof label !== "number") {
        return context.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
      }
      if (stops.length && stops[stops.length - 1][0] >= label) {
        return context.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.', labelKey);
      }
      const parsed = context.parse(value, valueKey, outputType);
      if (!parsed)
        return null;
      outputType = outputType || parsed.type;
      stops.push([label, parsed]);
    }
    if (outputType.kind !== "number" && outputType.kind !== "color" && outputType.kind !== "padding" && !(outputType.kind === "array" && outputType.itemType.kind === "number" && typeof outputType.N === "number")) {
      return context.error(`Type ${toString$1(outputType)} is not interpolatable.`);
    }
    return new Interpolate(outputType, operator, interpolation, input, stops);
  }
  evaluate(ctx) {
    const labels = this.labels;
    const outputs = this.outputs;
    if (labels.length === 1) {
      return outputs[0].evaluate(ctx);
    }
    const value = this.input.evaluate(ctx);
    if (value <= labels[0]) {
      return outputs[0].evaluate(ctx);
    }
    const stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
      return outputs[stopCount - 1].evaluate(ctx);
    }
    const index = findStopLessThanOrEqualTo(labels, value);
    const lower = labels[index];
    const upper = labels[index + 1];
    const t = Interpolate.interpolationFactor(this.interpolation, value, lower, upper);
    const outputLower = outputs[index].evaluate(ctx);
    const outputUpper = outputs[index + 1].evaluate(ctx);
    if (this.operator === "interpolate") {
      return interpolate$1[this.type.kind.toLowerCase()](outputLower, outputUpper, t);
    } else if (this.operator === "interpolate-hcl") {
      return hcl.reverse(hcl.interpolate(hcl.forward(outputLower), hcl.forward(outputUpper), t));
    } else {
      return lab.reverse(lab.interpolate(lab.forward(outputLower), lab.forward(outputUpper), t));
    }
  }
  eachChild(fn) {
    fn(this.input);
    for (const expression of this.outputs) {
      fn(expression);
    }
  }
  outputDefined() {
    return this.outputs.every((out) => out.outputDefined());
  }
}
function exponentialInterpolation(input, base, lowerValue, upperValue) {
  const difference = upperValue - lowerValue;
  const progress = input - lowerValue;
  if (difference === 0) {
    return 0;
  } else if (base === 1) {
    return progress / difference;
  } else {
    return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
  }
}

class Coalesce {
  constructor(type, args) {
    this.type = type;
    this.args = args;
  }
  static parse(args, context) {
    if (args.length < 2) {
      return context.error("Expectected at least one argument.");
    }
    let outputType = null;
    const expectedType = context.expectedType;
    if (expectedType && expectedType.kind !== "value") {
      outputType = expectedType;
    }
    const parsedArgs = [];
    for (const arg of args.slice(1)) {
      const parsed = context.parse(arg, 1 + parsedArgs.length, outputType, void 0, { typeAnnotation: "omit" });
      if (!parsed)
        return null;
      outputType = outputType || parsed.type;
      parsedArgs.push(parsed);
    }
    if (!outputType)
      throw new Error("No output type");
    const needsAnnotation = expectedType && parsedArgs.some((arg) => checkSubtype(expectedType, arg.type));
    return needsAnnotation ? new Coalesce(ValueType, parsedArgs) : new Coalesce(outputType, parsedArgs);
  }
  evaluate(ctx) {
    let result = null;
    let argCount = 0;
    let requestedImageName;
    for (const arg of this.args) {
      argCount++;
      result = arg.evaluate(ctx);
      if (result && result instanceof ResolvedImage && !result.available) {
        if (!requestedImageName) {
          requestedImageName = result.name;
        }
        result = null;
        if (argCount === this.args.length) {
          result = requestedImageName;
        }
      }
      if (result !== null)
        break;
    }
    return result;
  }
  eachChild(fn) {
    this.args.forEach(fn);
  }
  outputDefined() {
    return this.args.every((arg) => arg.outputDefined());
  }
}

function isComparableType(op, type) {
  if (op === "==" || op === "!=") {
    return type.kind === "boolean" || type.kind === "string" || type.kind === "number" || type.kind === "null" || type.kind === "value";
  } else {
    return type.kind === "string" || type.kind === "number" || type.kind === "value";
  }
}
function eq(ctx, a, b) {
  return a === b;
}
function neq(ctx, a, b) {
  return a !== b;
}
function lt(ctx, a, b) {
  return a < b;
}
function gt(ctx, a, b) {
  return a > b;
}
function lteq(ctx, a, b) {
  return a <= b;
}
function gteq(ctx, a, b) {
  return a >= b;
}
function eqCollate(ctx, a, b, c) {
  return c.compare(a, b) === 0;
}
function neqCollate(ctx, a, b, c) {
  return !eqCollate(ctx, a, b, c);
}
function ltCollate(ctx, a, b, c) {
  return c.compare(a, b) < 0;
}
function gtCollate(ctx, a, b, c) {
  return c.compare(a, b) > 0;
}
function lteqCollate(ctx, a, b, c) {
  return c.compare(a, b) <= 0;
}
function gteqCollate(ctx, a, b, c) {
  return c.compare(a, b) >= 0;
}
function makeComparison(op, compareBasic, compareWithCollator) {
  const isOrderComparison = op !== "==" && op !== "!=";
  return class Comparison {
    constructor(lhs, rhs, collator) {
      this.type = BooleanType;
      this.lhs = lhs;
      this.rhs = rhs;
      this.collator = collator;
      this.hasUntypedArgument = lhs.type.kind === "value" || rhs.type.kind === "value";
    }
    static parse(args, context) {
      if (args.length !== 3 && args.length !== 4)
        return context.error("Expected two or three arguments.");
      const op2 = args[0];
      let lhs = context.parse(args[1], 1, ValueType);
      if (!lhs)
        return null;
      if (!isComparableType(op2, lhs.type)) {
        return context.concat(1).error(`"${op2}" comparisons are not supported for type '${toString$1(lhs.type)}'.`);
      }
      let rhs = context.parse(args[2], 2, ValueType);
      if (!rhs)
        return null;
      if (!isComparableType(op2, rhs.type)) {
        return context.concat(2).error(`"${op2}" comparisons are not supported for type '${toString$1(rhs.type)}'.`);
      }
      if (lhs.type.kind !== rhs.type.kind && lhs.type.kind !== "value" && rhs.type.kind !== "value") {
        return context.error(`Cannot compare types '${toString$1(lhs.type)}' and '${toString$1(rhs.type)}'.`);
      }
      if (isOrderComparison) {
        if (lhs.type.kind === "value" && rhs.type.kind !== "value") {
          lhs = new Assertion(rhs.type, [lhs]);
        } else if (lhs.type.kind !== "value" && rhs.type.kind === "value") {
          rhs = new Assertion(lhs.type, [rhs]);
        }
      }
      let collator = null;
      if (args.length === 4) {
        if (lhs.type.kind !== "string" && rhs.type.kind !== "string" && lhs.type.kind !== "value" && rhs.type.kind !== "value") {
          return context.error("Cannot use collator to compare non-string types.");
        }
        collator = context.parse(args[3], 3, CollatorType);
        if (!collator)
          return null;
      }
      return new Comparison(lhs, rhs, collator);
    }
    evaluate(ctx) {
      const lhs = this.lhs.evaluate(ctx);
      const rhs = this.rhs.evaluate(ctx);
      if (isOrderComparison && this.hasUntypedArgument) {
        const lt2 = typeOf(lhs);
        const rt = typeOf(rhs);
        if (lt2.kind !== rt.kind || !(lt2.kind === "string" || lt2.kind === "number")) {
          throw new RuntimeError(`Expected arguments for "${op}" to be (string, string) or (number, number), but found (${lt2.kind}, ${rt.kind}) instead.`);
        }
      }
      if (this.collator && !isOrderComparison && this.hasUntypedArgument) {
        const lt2 = typeOf(lhs);
        const rt = typeOf(rhs);
        if (lt2.kind !== "string" || rt.kind !== "string") {
          return compareBasic(ctx, lhs, rhs);
        }
      }
      return this.collator ? compareWithCollator(ctx, lhs, rhs, this.collator.evaluate(ctx)) : compareBasic(ctx, lhs, rhs);
    }
    eachChild(fn) {
      fn(this.lhs);
      fn(this.rhs);
      if (this.collator) {
        fn(this.collator);
      }
    }
    outputDefined() {
      return true;
    }
  };
}
const Equals = makeComparison("==", eq, eqCollate);
const NotEquals = makeComparison("!=", neq, neqCollate);
const LessThan = makeComparison("<", lt, ltCollate);
const GreaterThan = makeComparison(">", gt, gtCollate);
const LessThanOrEqual = makeComparison("<=", lteq, lteqCollate);
const GreaterThanOrEqual = makeComparison(">=", gteq, gteqCollate);

class NumberFormat {
  // Default 3
  constructor(number, locale, currency, minFractionDigits, maxFractionDigits) {
    this.type = StringType;
    this.number = number;
    this.locale = locale;
    this.currency = currency;
    this.minFractionDigits = minFractionDigits;
    this.maxFractionDigits = maxFractionDigits;
  }
  static parse(args, context) {
    if (args.length !== 3)
      return context.error("Expected two arguments.");
    const number = context.parse(args[1], 1, NumberType);
    if (!number)
      return null;
    const options = args[2];
    if (typeof options !== "object" || Array.isArray(options))
      return context.error("NumberFormat options argument must be an object.");
    let locale = null;
    if (options["locale"]) {
      locale = context.parse(options["locale"], 1, StringType);
      if (!locale)
        return null;
    }
    let currency = null;
    if (options["currency"]) {
      currency = context.parse(options["currency"], 1, StringType);
      if (!currency)
        return null;
    }
    let minFractionDigits = null;
    if (options["min-fraction-digits"]) {
      minFractionDigits = context.parse(options["min-fraction-digits"], 1, NumberType);
      if (!minFractionDigits)
        return null;
    }
    let maxFractionDigits = null;
    if (options["max-fraction-digits"]) {
      maxFractionDigits = context.parse(options["max-fraction-digits"], 1, NumberType);
      if (!maxFractionDigits)
        return null;
    }
    return new NumberFormat(number, locale, currency, minFractionDigits, maxFractionDigits);
  }
  evaluate(ctx) {
    return new Intl.NumberFormat(
      this.locale ? this.locale.evaluate(ctx) : [],
      {
        style: this.currency ? "currency" : "decimal",
        currency: this.currency ? this.currency.evaluate(ctx) : void 0,
        minimumFractionDigits: this.minFractionDigits ? this.minFractionDigits.evaluate(ctx) : void 0,
        maximumFractionDigits: this.maxFractionDigits ? this.maxFractionDigits.evaluate(ctx) : void 0
      }
    ).format(this.number.evaluate(ctx));
  }
  eachChild(fn) {
    fn(this.number);
    if (this.locale) {
      fn(this.locale);
    }
    if (this.currency) {
      fn(this.currency);
    }
    if (this.minFractionDigits) {
      fn(this.minFractionDigits);
    }
    if (this.maxFractionDigits) {
      fn(this.maxFractionDigits);
    }
  }
  outputDefined() {
    return false;
  }
}

class FormatExpression {
  constructor(sections) {
    this.type = FormattedType;
    this.sections = sections;
  }
  static parse(args, context) {
    if (args.length < 2) {
      return context.error("Expected at least one argument.");
    }
    const firstArg = args[1];
    if (!Array.isArray(firstArg) && typeof firstArg === "object") {
      return context.error("First argument must be an image or text section.");
    }
    const sections = [];
    let nextTokenMayBeObject = false;
    for (let i = 1; i <= args.length - 1; ++i) {
      const arg = args[i];
      if (nextTokenMayBeObject && typeof arg === "object" && !Array.isArray(arg)) {
        nextTokenMayBeObject = false;
        let scale = null;
        if (arg["font-scale"]) {
          scale = context.parse(arg["font-scale"], 1, NumberType);
          if (!scale)
            return null;
        }
        let font = null;
        if (arg["text-font"]) {
          font = context.parse(arg["text-font"], 1, array$1(StringType));
          if (!font)
            return null;
        }
        let textColor = null;
        if (arg["text-color"]) {
          textColor = context.parse(arg["text-color"], 1, ColorType);
          if (!textColor)
            return null;
        }
        const lastExpression = sections[sections.length - 1];
        lastExpression.scale = scale;
        lastExpression.font = font;
        lastExpression.textColor = textColor;
      } else {
        const content = context.parse(args[i], 1, ValueType);
        if (!content)
          return null;
        const kind = content.type.kind;
        if (kind !== "string" && kind !== "value" && kind !== "null" && kind !== "resolvedImage")
          return context.error("Formatted text type must be 'string', 'value', 'image' or 'null'.");
        nextTokenMayBeObject = true;
        sections.push({ content, scale: null, font: null, textColor: null });
      }
    }
    return new FormatExpression(sections);
  }
  evaluate(ctx) {
    const evaluateSection = (section) => {
      const evaluatedContent = section.content.evaluate(ctx);
      if (typeOf(evaluatedContent) === ResolvedImageType) {
        return new FormattedSection("", evaluatedContent, null, null, null);
      }
      return new FormattedSection(
        toString(evaluatedContent),
        null,
        section.scale ? section.scale.evaluate(ctx) : null,
        section.font ? section.font.evaluate(ctx).join(",") : null,
        section.textColor ? section.textColor.evaluate(ctx) : null
      );
    };
    return new Formatted(this.sections.map(evaluateSection));
  }
  eachChild(fn) {
    for (const section of this.sections) {
      fn(section.content);
      if (section.scale) {
        fn(section.scale);
      }
      if (section.font) {
        fn(section.font);
      }
      if (section.textColor) {
        fn(section.textColor);
      }
    }
  }
  outputDefined() {
    return false;
  }
}

class ImageExpression {
  constructor(input) {
    this.type = ResolvedImageType;
    this.input = input;
  }
  static parse(args, context) {
    if (args.length !== 2) {
      return context.error("Expected two arguments.");
    }
    const name = context.parse(args[1], 1, StringType);
    if (!name)
      return context.error("No image name provided.");
    return new ImageExpression(name);
  }
  evaluate(ctx) {
    const evaluatedImageName = this.input.evaluate(ctx);
    const value = ResolvedImage.fromString(evaluatedImageName);
    if (value && ctx.availableImages)
      value.available = ctx.availableImages.indexOf(evaluatedImageName) > -1;
    return value;
  }
  eachChild(fn) {
    fn(this.input);
  }
  outputDefined() {
    return false;
  }
}

class Length {
  constructor(input) {
    this.type = NumberType;
    this.input = input;
  }
  static parse(args, context) {
    if (args.length !== 2)
      return context.error(`Expected 1 argument, but found ${args.length - 1} instead.`);
    const input = context.parse(args[1], 1);
    if (!input)
      return null;
    if (input.type.kind !== "array" && input.type.kind !== "string" && input.type.kind !== "value")
      return context.error(`Expected argument of type string or array, but found ${toString$1(input.type)} instead.`);
    return new Length(input);
  }
  evaluate(ctx) {
    const input = this.input.evaluate(ctx);
    if (typeof input === "string") {
      return input.length;
    } else if (Array.isArray(input)) {
      return input.length;
    } else {
      throw new RuntimeError(`Expected value to be of type string or array, but found ${toString$1(typeOf(input))} instead.`);
    }
  }
  eachChild(fn) {
    fn(this.input);
  }
  outputDefined() {
    return false;
  }
}

const expressions$1 = {
  // special forms
  "==": Equals,
  "!=": NotEquals,
  ">": GreaterThan,
  "<": LessThan,
  ">=": GreaterThanOrEqual,
  "<=": LessThanOrEqual,
  "array": Assertion,
  "at": At,
  "boolean": Assertion,
  "case": Case,
  "coalesce": Coalesce,
  "collator": CollatorExpression,
  "format": FormatExpression,
  "image": ImageExpression,
  "in": In,
  "index-of": IndexOf,
  "interpolate": Interpolate,
  "interpolate-hcl": Interpolate,
  "interpolate-lab": Interpolate,
  "length": Length,
  "let": Let,
  "literal": Literal,
  "match": Match,
  "number": Assertion,
  "number-format": NumberFormat,
  "object": Assertion,
  "slice": Slice,
  "step": Step,
  "string": Assertion,
  "to-boolean": Coercion,
  "to-color": Coercion,
  "to-number": Coercion,
  "to-string": Coercion,
  "var": Var,
  "within": Within
};
function rgba(ctx, [r, g, b, a]) {
  r = r.evaluate(ctx);
  g = g.evaluate(ctx);
  b = b.evaluate(ctx);
  const alpha = a ? a.evaluate(ctx) : 1;
  const error = validateRGBA(r, g, b, alpha);
  if (error)
    throw new RuntimeError(error);
  return new Color(r / 255 * alpha, g / 255 * alpha, b / 255 * alpha, alpha);
}
function has$1(key, obj) {
  return key in obj;
}
function get$1(key, obj) {
  const v = obj[key];
  return typeof v === "undefined" ? null : v;
}
function binarySearch(v, a, i, j) {
  while (i <= j) {
    const m = i + j >> 1;
    if (a[m] === v)
      return true;
    if (a[m] > v)
      j = m - 1;
    else
      i = m + 1;
  }
  return false;
}
function varargs(type) {
  return { type };
}
CompoundExpression.register(expressions$1, {
  "error": [
    ErrorType,
    [StringType],
    (ctx, [v]) => {
      throw new RuntimeError(v.evaluate(ctx));
    }
  ],
  "typeof": [
    StringType,
    [ValueType],
    (ctx, [v]) => toString$1(typeOf(v.evaluate(ctx)))
  ],
  "to-rgba": [
    array$1(NumberType, 4),
    [ColorType],
    (ctx, [v]) => {
      return v.evaluate(ctx).toArray();
    }
  ],
  "rgb": [
    ColorType,
    [NumberType, NumberType, NumberType],
    rgba
  ],
  "rgba": [
    ColorType,
    [NumberType, NumberType, NumberType, NumberType],
    rgba
  ],
  "has": {
    type: BooleanType,
    overloads: [
      [
        [StringType],
        (ctx, [key]) => has$1(key.evaluate(ctx), ctx.properties())
      ],
      [
        [StringType, ObjectType],
        (ctx, [key, obj]) => has$1(key.evaluate(ctx), obj.evaluate(ctx))
      ]
    ]
  },
  "get": {
    type: ValueType,
    overloads: [
      [
        [StringType],
        (ctx, [key]) => get$1(key.evaluate(ctx), ctx.properties())
      ],
      [
        [StringType, ObjectType],
        (ctx, [key, obj]) => get$1(key.evaluate(ctx), obj.evaluate(ctx))
      ]
    ]
  },
  "feature-state": [
    ValueType,
    [StringType],
    (ctx, [key]) => get$1(key.evaluate(ctx), ctx.featureState || {})
  ],
  "properties": [
    ObjectType,
    [],
    (ctx) => ctx.properties()
  ],
  "geometry-type": [
    StringType,
    [],
    (ctx) => ctx.geometryType()
  ],
  "id": [
    ValueType,
    [],
    (ctx) => ctx.id()
  ],
  "zoom": [
    NumberType,
    [],
    (ctx) => ctx.globals.zoom
  ],
  "heatmap-density": [
    NumberType,
    [],
    (ctx) => ctx.globals.heatmapDensity || 0
  ],
  "line-progress": [
    NumberType,
    [],
    (ctx) => ctx.globals.lineProgress || 0
  ],
  "accumulated": [
    ValueType,
    [],
    (ctx) => ctx.globals.accumulated === void 0 ? null : ctx.globals.accumulated
  ],
  "+": [
    NumberType,
    varargs(NumberType),
    (ctx, args) => {
      let result = 0;
      for (const arg of args) {
        result += arg.evaluate(ctx);
      }
      return result;
    }
  ],
  "*": [
    NumberType,
    varargs(NumberType),
    (ctx, args) => {
      let result = 1;
      for (const arg of args) {
        result *= arg.evaluate(ctx);
      }
      return result;
    }
  ],
  "-": {
    type: NumberType,
    overloads: [
      [
        [NumberType, NumberType],
        (ctx, [a, b]) => a.evaluate(ctx) - b.evaluate(ctx)
      ],
      [
        [NumberType],
        (ctx, [a]) => -a.evaluate(ctx)
      ]
    ]
  },
  "/": [
    NumberType,
    [NumberType, NumberType],
    (ctx, [a, b]) => a.evaluate(ctx) / b.evaluate(ctx)
  ],
  "%": [
    NumberType,
    [NumberType, NumberType],
    (ctx, [a, b]) => a.evaluate(ctx) % b.evaluate(ctx)
  ],
  "ln2": [
    NumberType,
    [],
    () => Math.LN2
  ],
  "pi": [
    NumberType,
    [],
    () => Math.PI
  ],
  "e": [
    NumberType,
    [],
    () => Math.E
  ],
  "^": [
    NumberType,
    [NumberType, NumberType],
    (ctx, [b, e]) => Math.pow(b.evaluate(ctx), e.evaluate(ctx))
  ],
  "sqrt": [
    NumberType,
    [NumberType],
    (ctx, [x]) => Math.sqrt(x.evaluate(ctx))
  ],
  "log10": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.log(n.evaluate(ctx)) / Math.LN10
  ],
  "ln": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.log(n.evaluate(ctx))
  ],
  "log2": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.log(n.evaluate(ctx)) / Math.LN2
  ],
  "sin": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.sin(n.evaluate(ctx))
  ],
  "cos": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.cos(n.evaluate(ctx))
  ],
  "tan": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.tan(n.evaluate(ctx))
  ],
  "asin": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.asin(n.evaluate(ctx))
  ],
  "acos": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.acos(n.evaluate(ctx))
  ],
  "atan": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.atan(n.evaluate(ctx))
  ],
  "min": [
    NumberType,
    varargs(NumberType),
    (ctx, args) => Math.min(...args.map((arg) => arg.evaluate(ctx)))
  ],
  "max": [
    NumberType,
    varargs(NumberType),
    (ctx, args) => Math.max(...args.map((arg) => arg.evaluate(ctx)))
  ],
  "abs": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.abs(n.evaluate(ctx))
  ],
  "round": [
    NumberType,
    [NumberType],
    (ctx, [n]) => {
      const v = n.evaluate(ctx);
      return v < 0 ? -Math.round(-v) : Math.round(v);
    }
  ],
  "floor": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.floor(n.evaluate(ctx))
  ],
  "ceil": [
    NumberType,
    [NumberType],
    (ctx, [n]) => Math.ceil(n.evaluate(ctx))
  ],
  "filter-==": [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => ctx.properties()[k.value] === v.value
  ],
  "filter-id-==": [
    BooleanType,
    [ValueType],
    (ctx, [v]) => ctx.id() === v.value
  ],
  "filter-type-==": [
    BooleanType,
    [StringType],
    (ctx, [v]) => ctx.geometryType() === v.value
  ],
  "filter-<": [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a < b;
    }
  ],
  "filter-id-<": [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a < b;
    }
  ],
  "filter->": [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a > b;
    }
  ],
  "filter-id->": [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a > b;
    }
  ],
  "filter-<=": [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a <= b;
    }
  ],
  "filter-id-<=": [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a <= b;
    }
  ],
  "filter->=": [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a >= b;
    }
  ],
  "filter-id->=": [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a >= b;
    }
  ],
  "filter-has": [
    BooleanType,
    [ValueType],
    (ctx, [k]) => k.value in ctx.properties()
  ],
  "filter-has-id": [
    BooleanType,
    [],
    (ctx) => ctx.id() !== null && ctx.id() !== void 0
  ],
  "filter-type-in": [
    BooleanType,
    [array$1(StringType)],
    (ctx, [v]) => v.value.indexOf(ctx.geometryType()) >= 0
  ],
  "filter-id-in": [
    BooleanType,
    [array$1(ValueType)],
    (ctx, [v]) => v.value.indexOf(ctx.id()) >= 0
  ],
  "filter-in-small": [
    BooleanType,
    [StringType, array$1(ValueType)],
    // assumes v is an array literal
    (ctx, [k, v]) => v.value.indexOf(ctx.properties()[k.value]) >= 0
  ],
  "filter-in-large": [
    BooleanType,
    [StringType, array$1(ValueType)],
    // assumes v is a array literal with values sorted in ascending order and of a single type
    (ctx, [k, v]) => binarySearch(ctx.properties()[k.value], v.value, 0, v.value.length - 1)
  ],
  "all": {
    type: BooleanType,
    overloads: [
      [
        [BooleanType, BooleanType],
        (ctx, [a, b]) => a.evaluate(ctx) && b.evaluate(ctx)
      ],
      [
        varargs(BooleanType),
        (ctx, args) => {
          for (const arg of args) {
            if (!arg.evaluate(ctx))
              return false;
          }
          return true;
        }
      ]
    ]
  },
  "any": {
    type: BooleanType,
    overloads: [
      [
        [BooleanType, BooleanType],
        (ctx, [a, b]) => a.evaluate(ctx) || b.evaluate(ctx)
      ],
      [
        varargs(BooleanType),
        (ctx, args) => {
          for (const arg of args) {
            if (arg.evaluate(ctx))
              return true;
          }
          return false;
        }
      ]
    ]
  },
  "!": [
    BooleanType,
    [BooleanType],
    (ctx, [b]) => !b.evaluate(ctx)
  ],
  "is-supported-script": [
    BooleanType,
    [StringType],
    // At parse time this will always return true, so we need to exclude this expression with isGlobalPropertyConstant
    (ctx, [s]) => {
      const isSupportedScript = ctx.globals && ctx.globals.isSupportedScript;
      if (isSupportedScript) {
        return isSupportedScript(s.evaluate(ctx));
      }
      return true;
    }
  ],
  "upcase": [
    StringType,
    [StringType],
    (ctx, [s]) => s.evaluate(ctx).toUpperCase()
  ],
  "downcase": [
    StringType,
    [StringType],
    (ctx, [s]) => s.evaluate(ctx).toLowerCase()
  ],
  "concat": [
    StringType,
    varargs(ValueType),
    (ctx, args) => args.map((arg) => toString(arg.evaluate(ctx))).join("")
  ],
  "resolved-locale": [
    StringType,
    [CollatorType],
    (ctx, [collator]) => collator.evaluate(ctx).resolvedLocale()
  ]
});

const comparisonSignatures = [{
  type: 'boolean',
  parameters: ['value', 'value']
}, {
  type: 'boolean',
  parameters: ['value', 'value', 'collator']
}];
const types$1 = {
  '==': comparisonSignatures,
  '!=': comparisonSignatures,
  '<': comparisonSignatures,
  '<=': comparisonSignatures,
  '>': comparisonSignatures,
  '>=': comparisonSignatures,
  string: [{
    type: 'string',
    parameters: ['value']
  }, {
    type: 'string',
    parameters: ['value', {
      repeat: ['fallback: value']
    }]
  }],
  number: [{
    type: 'number',
    parameters: ['value']
  }, {
    type: 'number',
    parameters: ['value', {
      repeat: ['fallback: value']
    }]
  }],
  boolean: [{
    type: 'boolean',
    parameters: ['value']
  }, {
    type: 'boolean',
    parameters: ['value', {
      repeat: ['fallback: value']
    }]
  }],
  array: [{
    type: 'array',
    parameters: ['value']
  }, {
    type: 'array<type>',
    parameters: ['type: "string" | "number" | "boolean"', 'value']
  }, {
    type: 'array<type, N>',
    parameters: ['type: "string" | "number" | "boolean"', 'N: number (literal)', 'value']
  }],
  image: [{
    type: 'image',
    parameters: ['value']
  }],
  object: [{
    type: 'object',
    parameters: ['value']
  }, {
    type: 'object',
    parameters: ['value', {
      repeat: ['fallback: value']
    }]
  }],
  'to-boolean': [{
    type: 'boolean',
    parameters: ['value']
  }],
  'to-color': [{
    type: 'color',
    parameters: ['value', {
      repeat: ['fallback: value']
    }]
  }],
  'to-number': [{
    type: 'number',
    parameters: ['value', {
      repeat: ['fallback: value']
    }]
  }],
  'to-string': [{
    type: 'string',
    parameters: ['value']
  }],
  at: [{
    type: 'ItemType',
    parameters: ['number', 'array']
  }],
  in: [{
    type: 'boolean',
    parameters: ['keyword: InputType (boolean, string, or number)', 'input: InputType (array or string)']
  }],
  'index-of': [{
    type: 'number',
    parameters: ['keyword: InputType (boolean, string, or number)', 'input: InputType (array or string)']
  }, {
    type: 'number',
    parameters: ['keyword: InputType (boolean, string, or number)', 'input: InputType (array or string)', 'index: number']
  }],
  slice: [{
    type: 'OutputType (ItemType or string)',
    parameters: ['input: InputType (array or string)', 'index: number']
  }, {
    type: 'OutputType (ItemType or string)',
    parameters: ['input: InputType (array or string)', 'index: number', 'index: number']
  }],
  case: [{
    type: 'OutputType',
    parameters: ['condition: boolean, output: OutputType', 'condition: boolean, output: OutputType', '...', 'fallback: OutputType']
  }],
  coalesce: [{
    type: 'OutputType',
    parameters: [{
      repeat: ['OutputType']
    }]
  }],
  step: [{
    type: 'OutputType',
    parameters: ['input: number', 'stop_output_0: OutputType', 'stop_input_1: number, stop_output_1: OutputType', 'stop_input_n: number, stop_output_n: OutputType, ...']
  }],
  interpolate: [{
    type: 'OutputType (number, array<number>, or Color)',
    parameters: ['interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2]', 'input: number', 'stop_input_1: number, stop_output_1: OutputType', 'stop_input_n: number, stop_output_n: OutputType, ...']
  }],
  'interpolate-hcl': [{
    type: 'Color',
    parameters: ['interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2]', 'input: number', 'stop_input_1: number, stop_output_1: Color', 'stop_input_n: number, stop_output_n: Color, ...']
  }],
  'interpolate-lab': [{
    type: 'Color',
    parameters: ['interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2 ]', 'input: number', 'stop_input_1: number, stop_output_1: Color', 'stop_input_n: number, stop_output_n: Color, ...']
  }],
  length: [{
    type: 'number',
    parameters: ['string | array | value']
  }],
  let: [{
    type: 'OutputType',
    parameters: [{
      repeat: ['string (alphanumeric literal)', 'any']
    }, 'OutputType']
  }],
  literal: [{
    type: 'array<T, N>',
    parameters: ['[...] (JSON array literal)']
  }, {
    type: 'object',
    parameters: ['{...} (JSON object literal)']
  }],
  match: [{
    type: 'OutputType',
    parameters: ['input: InputType (number or string)', 'label: InputType | [InputType, InputType, ...], output: OutputType', 'label: InputType | [InputType, InputType, ...], output: OutputType', '...', 'fallback: OutputType']
  }],
  var: [{
    type: 'the type of the bound expression',
    parameters: ['previously bound variable name']
  }],
  within: [{
    type: 'boolean',
    parameters: ['object']
  }],
  distance: [{
    type: 'number',
    parameters: ['object']
  }],
  collator: [{
    type: 'collator',
    parameters: ['{ "case-sensitive": boolean, "diacritic-sensitive": boolean, "locale": string }']
  }],
  format: [{
    type: 'formatted',
    parameters: [
    // Use backticks to avoid breaking eslint for array<string>
    'input_1: string | image, options_1: { "font-scale": number, "text-font": array<string>, "text-color": color }', '...', 'input_n: string | image, options_n: { "font-scale": number, "text-font": array<string>, "text-color": color }']
  }],
  'number-format': [{
    type: 'string',
    parameters: ['input: number', 'options: { "locale": string, "currency": string, "min-fraction-digits": number, "max-fraction-digits": number }']
  }]
};
for (const name in CompoundExpression.definitions) {
  if (/^filter-/.test(name)) {
    continue;
  }
  const definition = CompoundExpression.definitions[name];
  if (Array.isArray(definition)) {
    types$1[name] = [{
      type: toString$1(definition[0]),
      parameters: processParameters(definition[1])
    }];
  } else {
    types$1[name] = definition.overloads.map(o => ({
      type: toString$1(definition.type),
      parameters: processParameters(o[0])
    }));
  }
}
delete types$1['error'];
function processParameters(params) {
  if (Array.isArray(params)) {
    return params.map(toString$1);
  } else {
    return [{
      repeat: [toString$1(params.type)]
    }];
  }
}

const expressions = {};
const expressionGroups = {};
for (const name in types$1) {
  const spec$1 = spec['expression_name'].values[name];
  expressionGroups[spec$1.group] = expressionGroups[spec$1.group] || [];
  expressionGroups[spec$1.group].push(name);
  expressions[name] = {
    name,
    doc: spec$1.doc,
    type: types$1[name],
    sdkSupport: spec$1['sdk-support']
  };
}

const groupedExpressions = [
  "Types",
  "Feature data",
  "Lookup",
  "Decision",
  "Ramps, scales, curves",
  "Variable binding",
  "String",
  "Color",
  "Math",
  "Zoom",
  "Heatmap"
].map((group) => ({
  name: group,
  expressions: expressionGroups[group].sort((a, b) => a.localeCompare(b)).map((name) => expressions[name])
}));

function renderParams(params, maxLength) {
  const result = [""];
  for (const t of params) {
    if (typeof t === "string") {
      result.push(t);
    } else if (t.repeat) {
      const repeated = renderParams(t.repeat, Infinity);
      result.push(`${repeated.slice(2)}${repeated}, ...`);
    }
  }
  const length = result.reduce((l, s) => l + s.length + 2, 0);
  return !maxLength || length <= maxLength ? result.join(", ") : `${result.join(",\n    ")}
`;
}

function renderSignature(name, overload) {
  name = JSON.stringify(name);
  const maxLength = 80 - name.length - overload.type.length;
  const params = renderParams(overload.parameters, maxLength);
  return `[${name}${params}]: ${overload.type}`;
}

const all = [
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	}
];
const boolean = [
	{
		title: "Create a hover effect",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/"
	}
];
const coalesce = [
	{
		title: "Use a fallback image",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/fallback-image/"
	}
];
const concat = [
	{
		title: "Add a generated icon to the map",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/add-image-missing-generated/"
	},
	{
		title: "Create a time slider",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/timeline-animation/"
	},
	{
		title: "Use a fallback image",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/fallback-image/"
	},
	{
		title: "Variable label placement",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/variable-label-placement/"
	}
];
const downcase = [
	{
		title: "Change the case of labels",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/change-case-of-labels/"
	}
];
const format = [
	{
		title: "Change the case of labels",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/change-case-of-labels/"
	},
	{
		title: "Display and style rich text labels",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/display-and-style-rich-text-labels/"
	},
	{
		title: "Display buildings in 3D",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/3d-buildings/"
	}
];
const get = [
	{
		title: "Change the case of labels",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/change-case-of-labels/"
	},
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	},
	{
		title: "Extrude polygons for 3D indoor mapping",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/3d-extrusion-floorplan/"
	}
];
const has = [
	{
		title: "Create and style clusters",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster/"
	}
];
const image$1 = [
	{
		title: "Use a fallback image",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/fallback-image/"
	}
];
const interpolate = [
	{
		title: "Animate map camera around a point",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/animate-camera-around-point/"
	},
	{
		title: "Change building color based on zoom level",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/change-building-color-based-on-zoom-level/"
	},
	{
		title: "Create a heatmap layer",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/heatmap-layer/"
	},
	{
		title: "Visualize population density",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/visualize-population-density/"
	}
];
const literal = [
	{
		title: "Display and style rich text labels",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/display-and-style-rich-text-labels/"
	}
];
const step = [
	{
		title: "Create and style clusters",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster/"
	}
];
const upcase = [
	{
		title: "Change the case of labels",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/change-case-of-labels/"
	}
];
const related = {
	"!": [
	{
		title: "Create and style clusters",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster/"
	}
],
	"!=": [
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	}
],
	"/": [
	{
		title: "Visualize population density",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/visualize-population-density/"
	}
],
	"<": [
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	}
],
	"==": [
	{
		title: "Add multiple geometries from one GeoJSON source",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/multiple-geometries/"
	},
	{
		title: "Create a time slider",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/timeline-animation/"
	},
	{
		title: "Display buildings in 3D",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/3d-buildings/"
	},
	{
		title: "Filter symbols by toggling a list",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/filter-markers/"
	}
],
	">=": [
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	}
],
	all: all,
	boolean: boolean,
	"case": [
	{
		title: "Create a hover effect",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/"
	},
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	}
],
	coalesce: coalesce,
	concat: concat,
	downcase: downcase,
	"feature-state": [
	{
		title: "Create a hover effect",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/"
	}
],
	format: format,
	get: get,
	has: has,
	image: image$1,
	"in": [
	{
		title: "Measure distances",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/measure/"
	}
],
	interpolate: interpolate,
	"let": [
	{
		title: "Visualize population density",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/visualize-population-density/"
	}
],
	literal: literal,
	"number-format": [
	{
		title: "Display HTML clusters with custom properties",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/cluster-html/"
	}
],
	step: step,
	"to-color": [
	{
		title: "Visualize population density",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/visualize-population-density/"
	}
],
	"to-string": [
	{
		title: "Create a time slider",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/timeline-animation/"
	}
],
	upcase: upcase,
	"var": [
	{
		title: "Visualize population density",
		href: "https://maplibre.org/maplibre-gl-js-docs/example/visualize-population-density/"
	}
]
};

const _tmpl$$e = ["<h4", " style=\"", "\" class=\"txt-bold mb6 unprose pt0\">", "</h4>"],
  _tmpl$2$5 = ["<ul", " class=\"mb18\">", "</ul>"],
  _tmpl$3$3 = ["<li", "><a", ">", "</a></li>"],
  _tmpl$4$2 = "<!---->",
  _tmpl$5$2 = ["<div", " class=\"mb12\">", "</div>"],
  _tmpl$6$2 = ["<div", ">", "</div>"];
function ExpressionReference(props) {
  const group = groupedExpressions.filter(g => g.name === props.group)[0];
  const SubHeading = ({
    children
  }) => ssr(_tmpl$$e, ssrHydrationKey(), "font-size:" + "15px" + (";font-weight:" + 900) + (";line-height:" + "24px"), escape(children));
  const Related = ({
    links
  }) => {
    if (!links || !links.length === 0) return;
    return [createComponent(SubHeading, {
      children: "Related"
    }), ssr(_tmpl$2$5, ssrHydrationKey(), escape(links.map(link => ssr(_tmpl$3$3, ssrHydrationKey(), ssrAttribute("href", escape(link.href, true), false), escape(link.title)))))];
  };
  return group.expressions.map(({
    name,
    doc,
    type,
    sdkSupport
  }) => [createComponent(Property, {
    get id() {
      return `${group.name === 'Types' ? 'types-' : ''}${name}`;
    },
    children: name
  }), doc && ssr(_tmpl$5$2, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: doc
  }))), createComponent(SubHeading, {
    children: "Syntax"
  }), type.map((overload, i) => ssr(_tmpl$6$2, ssrHydrationKey(), escape(createComponent(Markdown, {
    get content() {
      return `
\`\`\`javascript
${renderSignature(name, overload)}
\`\`\`
                    `;
    }
  })))), ssr(_tmpl$4$2), related[name] && createComponent(Related, {
    get links() {
      return related[name];
    }
  }), ssr(_tmpl$4$2), sdkSupport && createComponent(SDKSupportTable, {
    supportItems: sdkSupport
  })]);
}

const _tmpl$$d = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Expressions() {
  return ssr(_tmpl$$d, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: `
# Expressions

The value for any [layout property](/maplibre-gl-js-docs/style-spec/layers/#layout-property), [paint property](/maplibre-gl-js-docs/style-spec/layers/#paint-property), or [filter](/maplibre-gl-js-docs/style-spec/layers/#filter) may be specified as an _expression_. An expression defines a formula for computing the value of the property using the _operators_ described below. The set of expression operators provided by MapLibre GL includes:

- Mathematical operators for performing arithmetic and other operations on numeric values
- Logical operators for manipulating boolean values and making conditional decisions
- String operators for manipulating strings
- Data operators, providing access to the properties of source features
- Camera operators, providing access to the parameters defining the current map view

Expressions are represented as JSON arrays. The first element of an expression array is a string naming the expression operator, e.g. [\`"*"\`](#*) or [\`"case"\`](#case). Elements that follow (if any) are the _arguments_ to the expression. Each argument is either a literal value (a string, number, boolean, or \`null\`), or another expression array.

\`\`\`json
[expression_name, argument_0, argument_1, ...]
\`\`\`

## Data expressions

A _data expression_ is any expression that access feature data -- that is, any expression that uses one of the data operators: [\`get\`](#get), [\`has\`](#has), [\`id\`](#id), [\`geometry-type\`](#geometry-type), [\`properties\`](#properties), or [\`feature-state\`](#feature-state). Data expressions allow a feature's properties or state to determine its appearance. They can be used to differentiate features within the same layer and to create data visualizations.

\`\`\`json
{
    "circle-color": [
        "rgb",
        // red is higher when feature.properties.temperature is higher
        ["get", "temperature"],
        // green is always zero
        0,
        // blue is higher when feature.properties.temperature is lower
        ["-", 100, ["get", "temperature"]]
    ]
}
\`\`\`

This example uses the [\`get\`](#get) operator to get the \`temperature\` value of each feature. That value is used to compute arguments to the [\`rgb\`](#rgb) operator, defining a color in terms of its red, green, and blue components.

Data expressions are allowed as the value of the [\`filter\`](/maplibre-gl-js-docs/style-spec/layers/#filter) property, and as values for most paint and layout properties. However, some paint and layout properties do not yet support data expressions. The level of support is indicated by the "data-driven styling" row of the "SDK Support" table for each property. Data expressions with the [\`feature-state\`](#feature-state) operator are allowed only on paint properties.



## Camera expressions

A _camera expression_ is any expression that uses the [\`zoom\`](#zoom) operator. Such expressions allow the appearance of a layer to change with the map's zoom level. Camera expressions can be used to create the appearance of depth and to control data density.

\`\`\`json
{
    "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        // zoom is 5 (or less) -> circle radius will be 1px
        5, 1,
        // zoom is 10 (or greater) -> circle radius will be 5px
        10, 5
    ]
}
\`\`\`

This example uses the [\`interpolate\`](#interpolate) operator to define a linear relationship between zoom level and circle size using a set of input-output pairs. In this case, the expression indicates that the circle radius should be 1 pixel when the zoom level is 5 or below, and 5 pixels when the zoom is 10 or above. Between the two zoom levels, the circle radius will be linearly interpolated between 1 and 5 pixels

Camera expressions are allowed anywhere an expression may be used. When a camera expression used as the value of a layout or paint property, it must be in one of the following forms:

\`\`\`json
[ "interpolate", interpolation, ["zoom"], ... ]
\`\`\`

Or:

\`\`\`json
[ "step", ["zoom"], ... ]
\`\`\`

Or:

\`\`\`json
[
    "let",
    ... variable bindings...,
    [ "interpolate", interpolation, ["zoom"], ... ]
]
\`\`\`

Or:

\`\`\`json
[
    "let",
    ... variable bindings...,
    [ "step", ["zoom"], ... ]
]
\`\`\`

That is, in layout or paint properties, \`["zoom"]\` may appear only as the input to an outer [\`interpolate\`](#interpolate) or [\`step\`](#step) expression, or such an expression within a [\`let\`](#let) expression.

There is an important difference between layout and paint properties in the timing of camera expression evaluation. Paint property camera expressions are re-evaluated whenever the zoom level changes, even fractionally. For example, a paint property camera expression will be re-evaluated continuously as the map moves between zoom levels 4.1 and 4.6. A _layout property_ camera expression is evaluated only at integer zoom levels. It will _not_ be re-evaluated as the zoom changes from 4.1 to 4.6 -- only if it goes above 5 or below 4.

## Composition

A single expression may use a mix of data operators, camera operators, and other operators. Such composite expressions allows a layer's appearance to be determined by a combination of the zoom level _and_ individual feature properties.

\`\`\`json
{
    "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        // when zoom is 0, set each feature's circle radius to the value of its "rating" property
        0, ["get", "rating"],
        // when zoom is 10, set each feature's circle radius to four times the value of its "rating" property
        10, ["*", 4, ["get", "rating"]]
    ]
}
\`\`\`

An expression that uses both data and camera operators is considered both a data expression and a camera expression, and must adhere to the restrictions described above for both.

## Type system

The input arguments to expressions, and their result values, use the same set of [types](#types) as the rest of the style specification: boolean, string, number, color, and arrays of these types. Furthermore, expressions are _type safe_: each use of an expression has a known result type and required argument types, and the SDKs verify that the result type of an expression is appropriate for the context in which it is used. For example, the result type of an expression in the [\`filter\`](/maplibre-gl-js-docs/style-spec/layers/#filter) property must be [boolean](#types-boolean), and the arguments to the [\`+\`](#+) operator must be [numbers](#types-number).

When working with feature data, the type of a feature property value is typically not known ahead of time by the SDK. To preserve type safety, when evaluating a data expression, the SDK will check that the property value is appropriate for the context. For example, if you use the expression \`["get", "feature-color"]\` for the [\`circle-color\`](#paint-circle-circle-color) property, the SDK will verify that the \`feature-color\` value of each feature is a string identifying a valid [color](#types-color). If this check fails, an error will be indicated in an SDK-specific way (typically a log message), and the default value for the property will be used instead.


In most cases, this verification will occur automatically wherever it is needed. However, in certain situations, the SDK may be unable to automatically determine the expected result type of a data expression from surrounding context. For example, it is not clear whether the expression \`["&lt;", ["get", "a"], ["get", "b"]]\` is attempting to compare strings or numbers. In situations like this, you can use one of the _type assertion_ expression operators to indicate the expected type of a data expression: \`["&lt;", ["number", ["get", "a"]], ["number", ["get", "b"]]]\`. A type assertion checks that the feature data matches the expected type of the data expression. If this check fails, it produces an error and causes the whole expression to fall back to the default value for the property being defined. The assertion operators are [\`array\`](#types-array), [\`boolean\`](#types-boolean), [\`number\`](#types-number), and [\`string\`](#types-string).

Expressions perform only one kind of implicit type conversion: a data expression used in a context where a [color](#types-color) is expected will convert a string representation of a color to a color value. In all other cases, if you want to convert between types, you must use one of the _type conversion_ expression operators: [\`to-boolean\`](#types-to-boolean), [\`to-number\`](#types-to-number), [\`to-string\`](#types-to-string), or [\`to-color\`](#types-to-color). For example, if you have a feature property that stores numeric values in string format, and you want to use those values as numbers rather than strings, you can use an expression such as \`["to-number", ["get", "property-name"]]\`.

If an expression accepts an array argument and the user supplies an array literal, that array _must_ be wrapped in a \`literal\` expression (see the examples below). When GL-JS encounters an array in a style-spec property value, it will assume that the array is an expression and try to parse it; the library has no way to distinguish between an expression which failed validation and an array literal unless the developer makes this distinction explicit with the \`literal\` operator. The \`literal\` operator is not necessary if the array is returned from a sub-expression, e.g. \`["in", 1, ["get", "myArrayProp"]]\`.

\`\`\`json
// will throw an error
{
    "circle-color": ["in", 1, [1, 2, 3]]
}

// will work as expected
{
    "circle-color": ["in", 1, ["literal", [1, 2, 3]]]
}
\`\`\`

`
  })), escape(createComponent(Markdown, {
    content: `
## Types

The expressions in this section are for testing for and converting between different data types like strings, numbers, and boolean values.

Often, such tests and conversions are unnecessary, but they may be necessary in some expressions where the type of a certain sub-expression is ambiguous. They can also be useful in cases where your feature data has inconsistent types; for example, you could use \`to-number\` to make sure that values like \`"1.5"\` (instead of \`1.5\`) are treated as numeric values.

`
  })), escape(createComponent(ExpressionReference, {
    group: "Types"
  })), escape(createComponent(Markdown, {
    content: "## Feature data"
  })), escape(createComponent(ExpressionReference, {
    group: "Feature data"
  })), escape(createComponent(Markdown, {
    content: "## Lookup"
  })), escape(createComponent(ExpressionReference, {
    group: "Lookup"
  })), escape(createComponent(Markdown, {
    content: `
## Decision

The expressions in this section can be used to add conditional logic to your styles. For example, the [\`'case'\`](#case)  expression provides "if/then/else" logic, and [\`'match'\`](#match) allows you to map specific values of an input expression to different output expressions.
`
  })), escape(createComponent(ExpressionReference, {
    group: "Decision"
  })), escape(createComponent(Markdown, {
    content: "## Ramps, scales, curves"
  })), escape(createComponent(ExpressionReference, {
    group: "Ramps, scales, curves"
  })), escape(createComponent(Markdown, {
    content: "## Variable binding"
  })), escape(createComponent(ExpressionReference, {
    group: "Variable binding"
  })), escape(createComponent(Markdown, {
    content: "## String"
  })), escape(createComponent(ExpressionReference, {
    group: "String"
  })), escape(createComponent(Markdown, {
    content: "## Color"
  })), escape(createComponent(ExpressionReference, {
    group: "Color"
  })), escape(createComponent(Markdown, {
    content: "## Math"
  })), escape(createComponent(ExpressionReference, {
    group: "Math"
  })), escape(createComponent(Markdown, {
    content: "## Zooming"
  })), escape(createComponent(ExpressionReference, {
    group: "Zoom"
  })), escape(createComponent(Markdown, {
    content: "## Heatmap"
  })), escape(createComponent(ExpressionReference, {
    group: "Heatmap"
  })));
}

function glyphs() {
  const md = `
# Glyphs

A style's \`glyphs\` property provides a URL template for loading signed-distance-field glyph sets in PBF format.

\`\`\`json
"glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
\`\`\`
    
This URL template should include two tokens:

- \`{fontstack}\` When requesting glyphs, this token is replaced with a comma separated list of fonts from a font stack specified in the [\`text-font\`](/maplibre-gl-js-docs/style-spec/layers/#layout-symbol-text-font) property of a symbol layer.
- \`{range}\` When requesting glyphs, this token is replaced with a range of 256 Unicode code points. For example, to load glyphs for the [Unicode Basic Latin and Basic Latin-1 Supplement blocks](https://en.wikipedia.org/wiki/Unicode_block), the range would be \`0-255\`. The actual ranges that are loaded are determined at runtime based on what text needs to be displayed.
`;
  return createComponent(Markdown, {
    content: md
  });
}

const md = `# Introduction

A MapLibre style is a document that defines the visual appearance of a map: what data to draw, the order to draw it in, and how to style the data when drawing it. A style document is a [JSON](http://www.json.org/) object with specific root level and nested properties. This specification defines and describes these properties.

The intended audience of this specification includes:

-   Advanced designers and cartographers who want to write styles by hand.
-   Developers using style-related features of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) or the [MapLibre Maps SDK for Android](https://github.com/maplibre/maplibre-gl-native).
-   Authors of software that generates or processes MapLibre styles.

## Style document structure

A MapLibre style consists of a set of [root properties](http://localhost:3001/maplibre-gl-js-docs/style-spec/root), some of which describe a single global property, and some of which contain nested properties. Some root properties, like [\`version\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#version), [\`name\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#name), and [\`metadata\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#metadata), don’t have any influence over the appearance or behavior of your map, but provide important descriptive information related to your map. Others, like [\`layers\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/layers) and [\`sources\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/sources), are critical and determine which map features will appear on your map and what they will look like. Some properties, like [\`center\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#center), [\`zoom\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#zoom), [\`pitch\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#pitch), and [\`bearing\`](http://localhost:3001/maplibre-gl-js-docs/style-spec/root/#bearing), provide the map renderer with a set of defaults to be used when initially displaying the map.
`;
function Introduction() {
  return createComponent(Markdown, {
    content: md
  });
}

const _tmpl$$c = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/light/\">light</a></span>"],
  _tmpl$2$4 = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/transition/\">transition</a></span>"],
  _tmpl$3$2 = ["<span", "> object with <a href=\"/maplibre-gl-style-spec/style-spec/sources/\">source</a> values</span>"],
  _tmpl$4$1 = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/layers/\">layer<!--#-->", "<!--/--></a></span>"],
  _tmpl$5$1 = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/types/#array\">array</a><!--#-->", "<!--/--></span>"],
  _tmpl$6$1 = ["<span", "> of <!--#-->", "<!--/--></span>"],
  _tmpl$7 = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/expressions/\">expression<!--#-->", "<!--/--></a></span>"],
  _tmpl$8 = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/layers/#layout-property\">layout</a></span>"],
  _tmpl$9 = ["<span", "> <a href=\"/maplibre-gl-style-spec/style-spec/layers/#paint-property\">paint</a></span>"],
  _tmpl$10 = ["<span", "> <a href=\"", "\"><!--#-->", "<!--/--><!--#-->", "<!--/--></a></span>"],
  _tmpl$11 = ["<span", "><em>Requires</em> <var>", "</var>. </span>"],
  _tmpl$12 = ["<span", "><em>Disabled by</em> <var>", "</var>. </span>"],
  _tmpl$13 = ["<span", "><em>Requires</em> <var>", "</var> to be <!--#-->", "<!--/-->. </span>"],
  _tmpl$14 = ["<code", ">", "</code>"],
  _tmpl$15 = ["<span", "><em>Requires</em> <var>", "</var> to be <code>", "</code>. </span>"],
  _tmpl$16 = "<!---->",
  _tmpl$17 = ["<a", " href=\"/maplibre-gl-style-spec/style-spec/layers/#paint-property\">Paint</a>"],
  _tmpl$18 = ["<a", " href=\"/maplibre-gl-style-spec/style-spec/layers/#layout-property\">Layout</a>"],
  _tmpl$19 = ["<span", "> between <code>", "</code> and <code>", "</code> inclusive</span>"],
  _tmpl$20 = ["<span", "> greater than or equal to <code>", "</code></span>"],
  _tmpl$21 = ["<span", "> less than or equal to <code>", "</code></span>"],
  _tmpl$22 = ["<var", ">", "</var>"],
  _tmpl$23 = ["<em", " class=\"color-gray\"><a href=\"/maplibre-gl-style-spec/style-spec/expressions/#feature-state\"><code>feature-state</code></a></em>"],
  _tmpl$24 = ["<a", " href=\"/maplibre-gl-style-spec/style-spec/expressions/#interpolate\"><code>interpolate</code></a>"],
  _tmpl$25 = ["<div", " class=\"mb12 style-spec-item-doc\">", "</div>"],
  _tmpl$26 = ["<div", " class=\"my12 style-spec-item-dl\"><dl>", "</dl></div>"],
  _tmpl$27 = ["<dt", " key=\"", "\"><code>", "</code>:</dt>"],
  _tmpl$28 = ["<dd", " key=\"", "\" class=\"mb12\">", "</dd>"],
  _tmpl$29 = ["<div", " class=\"mt12\">", "</div>"];
function Item(props) {
  function type(spec = props, plural = false) {
    switch (spec.type) {
      case null:
      case '*':
        return;
      case 'light':
        return ssr(_tmpl$$c, ssrHydrationKey());
      case 'transition':
        return ssr(_tmpl$2$4, ssrHydrationKey());
      case 'sources':
        return ssr(_tmpl$3$2, ssrHydrationKey());
      case 'layer':
        return ssr(_tmpl$4$1, ssrHydrationKey(), plural && 's');
      case 'array':
        return ssr(_tmpl$5$1, ssrHydrationKey(), spec.value && ssr(_tmpl$6$1, ssrHydrationKey(), escape(type(typeof spec.value === 'string' ? {
          type: spec.value
        } : spec.value, true))));
      case 'filter':
        return ssr(_tmpl$7, ssrHydrationKey(), plural && 's');
      case 'layout':
        return ssr(_tmpl$8, ssrHydrationKey());
      case 'paint':
        return ssr(_tmpl$9, ssrHydrationKey());
      default:
        return ssr(_tmpl$10, ssrHydrationKey(), `/maplibre-gl-style-spec/style-spec/types/#${escape(spec.type, true)}`, escape(spec.type), plural && 's');
    }
  }
  function requires(req, i) {
    if (typeof req === 'string') {
      return ssr(_tmpl$11, ssrHydrationKey() + ssrAttribute("key", escape(i, true), false), escape(req));
    } else if (req['!']) {
      return ssr(_tmpl$12, ssrHydrationKey() + ssrAttribute("key", escape(i, true), false), escape(req['!']));
    } else {
      const [name, value] = entries(req)[0];
      if (Array.isArray(value)) {
        return ssr(_tmpl$13, ssrHydrationKey() + ssrAttribute("key", escape(i, true), false), escape(name), escape(value.map((r, i) => ssr(_tmpl$14, ssrHydrationKey() + ssrAttribute("key", escape(i, true), false), escape(JSON.stringify(r)))).reduce((prev, curr) => [prev, ', or ', curr])));
      } else {
        return ssr(_tmpl$15, ssrHydrationKey() + ssrAttribute("key", escape(i, true), false), escape(name), escape(JSON.stringify(value)));
      }
    }
  }
  return [createComponent(Property, {
    get headingLevel() {
      return props.headingLevel;
    },
    get id() {
      return props.id;
    },
    get children() {
      return props.name;
    }
  }), createComponent(Subtitle, {
    get children() {
      return [props.kind === 'paint' && [ssr(_tmpl$17, ssrHydrationKey()), ' ', ssr(_tmpl$16), "property.", ssr(_tmpl$16), ' '], props.kind === 'layout' && [ssr(_tmpl$18, ssrHydrationKey()), ' ', ssr(_tmpl$16), "property.", ssr(_tmpl$16), ' '], [props.required ? 'Required' : 'Optional', ssr(_tmpl$16), type(), ssr(_tmpl$16), 'minimum' in props && 'maximum' in props && ssr(_tmpl$19, ssrHydrationKey(), escape(props.minimum), escape(props.maximum)), ssr(_tmpl$16), 'minimum' in props && !('maximum' in props) && ssr(_tmpl$20, ssrHydrationKey(), escape(props.minimum)), ssr(_tmpl$16), !('minimum' in props) && 'maximum' in props && ssr(_tmpl$21, ssrHydrationKey(), escape(props.minimum)), ssr(_tmpl$16), ".", ssr(_tmpl$16), ' '], props.values && !Array.isArray(props.values) && // skips $root.version
      ["One of", ssr(_tmpl$16), ' ', ssr(_tmpl$16), Object.keys(props.values).map((opt, i) => ssr(_tmpl$14, ssrHydrationKey() + ssrAttribute("key", escape(i, true), false), escape(JSON.stringify(opt)))).reduce((prev, curr) => [prev, ', ', curr]), ssr(_tmpl$16), ".", ssr(_tmpl$16), ' '], props.units && ["Units in ", ssr(_tmpl$22, ssrHydrationKey(), escape(props.units)), ".", ssr(_tmpl$16), ' '], props.default !== undefined && ["Defaults to", ssr(_tmpl$16), ' ', ssr(_tmpl$14, ssrHydrationKey(), escape(JSON.stringify(props.default))), ".", ssr(_tmpl$16), ' '], props.requires && [props.requires.map((r, i) => requires(r, i)), ssr(_tmpl$16), ' '], props.expression && (props.expression.interpolated || props.expression.parameters.includes('feature-state')) && ["Supports", ssr(_tmpl$16), ' ', ssr(_tmpl$16), props.expression.parameters.includes('feature-state') && ssr(_tmpl$23, ssrHydrationKey()), ssr(_tmpl$16), props.expression.interpolated && props.expression.parameters.includes('feature-state') && ' and ', ssr(_tmpl$16), props.expression.interpolated && ssr(_tmpl$24, ssrHydrationKey()), ssr(_tmpl$16), "expressions.", ssr(_tmpl$16), ' '], props.transition && ["Transitionable.", ssr(_tmpl$16), ' ']];
    }
  }), props.doc && ssr(_tmpl$25, ssrHydrationKey(), escape(createComponent(Markdown, {
    get content() {
      return props.doc;
    }
  }))), ssr(_tmpl$16), props.values && !Array.isArray(props.values) && // skips $root.version
  ssr(_tmpl$26, ssrHydrationKey(), escape(entries(props.values).map(([v, {
    doc
  }], i) => [ssr(_tmpl$27, ssrHydrationKey(), `${escape(i, true)}-dt`, escape(JSON.stringify(v))), ssr(_tmpl$28, ssrHydrationKey(), `${escape(i, true)}-dd`, escape(createComponent(Markdown, {
    content: doc
  })))]))), ssr(_tmpl$16), props.example && createComponent(Markdown, {
    get content() {
      return `
\`\`\`json
"${props.name}": ${JSON.stringify(props.example, null, 2)}
\`\`\`
`;
    }
  }), ssr(_tmpl$16), props['sdk-support'] && ssr(_tmpl$29, ssrHydrationKey(), escape(createComponent(SDKSupportTable, mergeProps(() => props['sdk-support']))))];
}

function Items(props) {
  return entries(props.entry).sort().map(([name, prop]) => {
    const entry = props.entry[name];
    const section = entry.section || props.section;
    const kind = entry.kind || props.kind;
    const headingLevel = entry.headingLevel || props.headingLevel;
    // if section begins with the name of a source type, do not display an item for * or type
    if (['vector', 'raster', 'raster-dem', 'geojson', 'image', 'video'].indexOf(props.section) > -1 && (name === '*' || name === 'type')) return [];
    return createComponent(Item, mergeProps({
      id: `${section ? `${section}-` : ''}${name}`,
      name: name
    }, prop, {
      kind: kind,
      headingLevel: headingLevel
    }));
  });
}

const image = "_image_1st6w_1";
const style$5 = {
	image: image
};

const _tmpl$$b = ["<img", " alt=\"\">"];
function AppropriateImage({
  imageId
}) {
  const src = `/img/src/${imageId}.png`;
  return ssr(_tmpl$$b, ssrHydrationKey() + ssrAttribute("class", escape(style$5.image, true), false) + ssrAttribute("src", escape(src, true), false));
}

// helper function to:
// combine properties, prepare them, and sort them for the <Items /> component
function combineItems(properties, section) {
  const arr = properties.map(property => {
    return {
      ref: spec[`${property}_${section}`],
      kind: property,
      section: `${property}-${section}`
    };
  });
  // combine items
  const unsorted = arr.reduce((obj, group) => {
    Object.keys(group.ref).forEach(o => {
      group.ref[o].kind = group.kind;
      group.ref[o].section = group.section;
      obj[o] = group.ref[o];
    });
    return obj;
  }, {});
  // sort & return items
  return Object.keys(unsorted).sort().reduce((obj, key) => {
    obj[key] = unsorted[key];
    return obj;
  }, {});
}

const _tmpl$$a = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--><a id=\"layout-property\" class=\"anchor\"></a><a id=\"paint-property\" class=\"anchor\"></a><hr class=\"my36\"><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Layers() {
  const layerTypes = ['background', 'fill', 'line', 'symbol', 'raster', 'circle', 'fill-extrusion', 'heatmap', 'hillshade'];
  return ssr(_tmpl$$a, ssrHydrationKey(), escape(createComponent(Markdown, {
    get content() {
      return `# Layers

A style's \`layers\` property lists all the layers available in that style. The type of layer is specified by the \`"type"\` property, and must be one of ${layerTypes.map(t => `\`${t}\``).join(', ')}.

Except for layers of the \`background\` type, each layer needs to refer to a source. Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.

\`\`\`json
"layers": ${JSON.stringify(spec.$root.layers.example, null, 2)}
\`\`\`

## Layer properties
`;
    }
  })), escape(createComponent(Items, {
    get entry() {
      return spec.layer;
    }
  })), escape(createComponent(Markdown, {
    content: `
Layers have two sub-properties that determine how data from that layer is rendered: \`layout\` and \`paint\` properties.

_Layout properties_ appear in the layer's \`"layout"\` object. They are applied early in the rendering process and define how data for that layer is passed to the GPU. Changes to a layout property require an asynchronous "layout" step.

_Paint properties_ are applied later in the rendering process. Paint properties appear in the layer's \`"paint"\` object. Changes to a paint property are cheap and happen synchronously.

## background

The \`background\` style layer covers the entire map. Use a background style layer to configure a color or pattern to show below all other map content. If the background layer is transparent or omitted from the style, any part of the map view that does not show another style layer is transparent.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-background",
    alt: "Vintage map style with a brown halftone background pattern."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
The [Vintage map style](https://blog.mapbox.com/designing-the-vintage-style-in-mapbox-studio-9da4aa2a627f) uses a custom SVG [\`background-pattern\`](/maplibre-gl-js-docs/style-spec/layers/#paint-background-background-pattern) to achieve a textured vintage look.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'background');
    }
  })), escape(createComponent(Markdown, {
    content: `
## fill

A \`fill\` style layer renders one or more filled (and optionally stroked) polygons on a map. You can use a fill layer to configure the visual appearance of polygon or multipolygon features.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-fill",
    alt: "Map of Washington, D.C. with a purple isochrone polygon in the center."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This map of Washington, D.C. uses the [\`fill-opacity\`](/maplibre-gl-js-docs/style-spec/layers/#paint-fill-fill-opacity) paint property to render a semi-transparent polygon, showing how far a person can walk from the center of the city in ten minutes.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'fill');
    }
  })), escape(createComponent(Markdown, {
    content: `
## line

A \`line\` style layer renders one or more stroked polylines on the map. You can use a line layer to configure the visual appearance of polyline or multipolyline features.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-line",
    alt: "Outdoors style map with a red line showing a hiking path."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This map of a [Strava](https://blog.mapbox.com/strava-launches-gorgeous-new-outdoor-maps-977c74cf37f9) user's hike through Grand Teton National Park uses the [\`line-color\`](/maplibre-gl-js-docs/style-spec/layers/#paint-line-line-color) and [\`line-width\`](/maplibre-gl-js-docs/style-spec/layers/#paint-line-line-width) paint properties to style the strong red line of the user's route.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'line');
    }
  })), escape(createComponent(Markdown, {
    content: `
## symbol

A \`symbol\` style layer renders icon and text labels at points or along lines on a map. You can use a symbol layer to configure the visual appearance of labels for features in vector tiles.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-symbol",
    alt: "Map with thirty shopping bag icons, color-coded red, orange, and green."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This map of Denver area businesses uses the [\`icon-image\`](/maplibre-gl-js-docs/style-spec/layers/#layout-symbol-icon-image) layout property to use a custom image as an icon in a symbol layer.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'symbol');
    }
  })), escape(createComponent(Markdown, {
    content: `
## raster

A \`raster\` style layer renders raster tiles on a map. You can use a raster layer to configure the color parameters of raster tiles.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-raster",
    alt: "Shortwave infrared imagery of California wildfires overlayed near the city of Morgan Hill."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This [interactive SWIR imagery map by Maxar](https://blog.maxar.com/news-events/2020/maxar-and-mapbox-release-interactive-swir-imagery-map-of-california-wildfires?utm_source=mapbox&utm_medium=blog&utm_campaign=ca-wildfires-2020-map) uses the [\`visibility\`](/maplibre-gl-js-docs/style-spec/layers/#layout-raster-visibility) layout property to show or hide raster layers with shortwave infrared satellite imagery of California wildfires.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'raster');
    }
  })), escape(createComponent(Markdown, {
    content: `
## circle

A \`circle\` style layer renders one or more filled circles on a map. You can use a circle layer to configure the visual appearance of point or point collection features in vector tiles. A circle layer renders circles whose radii are measured in screen units.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-circle",
    alt: "Map with circles of different sizes and colors."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This [cluster map](/maplibre-gl-js-docs/example/cluster/) uses a circle layer with a GeoJSON data source and sets the source's [\`cluster\`](/maplibre-gl-js-docs/style-spec/sources/#geojson-cluster) property to \`true\` to visualize points as clusters.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'circle');
    }
  })), escape(createComponent(Markdown, {
    content: `
## fill-extrusion

A \`fill-extrusion\` style layer renders one or more filled (and optionally stroked) extruded (3D) polygons on a map. You can use a fill-extrusion layer to configure the extrusion and visual appearance of polygon or multipolygon features.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-fill-extrusion",
    alt: "Map of Europe and North Africa with countries extruded to various heights."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This map uses an external dataset to provide data-driven values for the [\`fill-extrusion-height\`](/maplibre-gl-js-docs/style-spec/layers/#paint-fill-extrusion-fill-extrusion-height) paint property of various [country polygons](https://blog.mapbox.com/high-resolution-administrative-country-polygons-in-studio-57cf4abb0768) in a fill-extrusion layer.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'fill-extrusion');
    }
  })), escape(createComponent(Markdown, {
    content: `
## heatmap

A \`heatmap\` style layer renders a range of colors to represent the density of points in an area.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-heatmap",
    alt: "Dark map with a heatmap layer glowing red inside and white outside."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
[This visualization of earthquake data](/maplibre-gl-js-docs/example/heatmap-layer/) uses a heatmap layer with carefully defined [paint](/maplibre-gl-js-docs/style-spec/layers/#paint-property) properties to highlight areas where earthquake frequency is high and many points are clustered closely together.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'heatmap');
    }
  })), escape(createComponent(Markdown, {
    content: `
## hillshade

A \`hillshade\` style layer renders digital elevation model (DEM) data on the client-side. The implementation only supports Mapbox Terrain RGB and Mapzen Terrarium tiles.
`
  })), escape(createComponent(AppropriateImage, {
    imageId: "layer-hillshade",
    alt: "Map of Mount Shasta rising up with striking texture and shading."
  })), escape(createComponent(Caption, {
    get children() {
      return createComponent(Markdown, {
        content: `
This map of Mount Shasta uses a high value for the [\`hillshade-exaggeration\`](/maplibre-gl-js-docs/style-spec/layers/#paint-hillshade-hillshade-exaggeration) paint property to apply an intense shading effect.
`
      });
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return combineItems(['layout', 'paint'], 'hillshade');
    }
  })));
}

const _tmpl$$9 = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Light() {
  const md = `# Light
    
A style's \`light\` property provides a global light source for that style. Since this property is the light used to light extruded features, you will only see visible changes to your map style when modifying this property if you are using extrusions.

\`\`\`json
"light": ${JSON.stringify(spec.$root.light.example, null, 2)}
\`\`\`
`;
  return ssr(_tmpl$$9, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: md
  })), escape(createComponent(Items, {
    headingLevel: "2",
    get entry() {
      return spec.light;
    }
  })));
}

const _tmpl$$8 = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Root$1() {
  const md = `# Root
Root level properties of a MapLibre style specify the map's layers, tile sources and other resources, and default values for the initial camera position when not specified elsewhere.


\`\`\`json
{
    "version": 8,
        "name": "Mapbox Streets",
            "sprite": "mapbox://sprites/mapbox/streets-v8",
                "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
                    "sources": {... },
    "layers": [...]
}
\`\`\`

`;
  return ssr(_tmpl$$8, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: md
  })), escape(createComponent(Items, {
    headingLevel: "2",
    get entry() {
      return spec.$root;
    }
  })));
}

const _tmpl$$7 = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Sources() {
  const sourceTypes = ['vector', 'raster', 'raster-dem', 'geojson', 'image', 'video'];
  return ssr(_tmpl$$7, ssrHydrationKey(), escape(createComponent(Markdown, {
    get content() {
      return `# Sources
Sources state which data the map should display. Specify the type of source with the \`"type"\` property, which must be one of 
${sourceTypes.map(t => {
        return `\`${t}\``;
      }).join(', ')}. Adding a source isn't enough to make data appear on the map because sources don't contain styling details like color or width. Layers refer to a source and give it a visual representation. This makes it possible to style the same source in different ways, like differentiating between types of roads in a highways layer.

Tiled sources (vector and raster) must specify their details according to the [TileJSON specification](https://github.com/mapbox/tilejson-spec). There are several ways to do so:
- By supplying TileJSON properties such as \`"tiles"\`, \`"minzoom"\`, and \`"maxzoom"\` directly in the source:

\`\`\`json
"maplibre-streets": {
    "type": "vector",
    "tiles": [
        "http://a.example.com/tiles/{z}/{x}/{y}.pbf",
        "http://b.example.com/tiles/{z}/{x}/{y}.pbf"
    ],
    "maxzoom": 14
}
\`\`\`

- By providing a \`"url"\` to a TileJSON resource:

\`\`\`json
"maplibre-streets": {
    "type": "vector",
    "url": "http://api.example.com/tilejson.json"
}
\`\`\`

- By providing a URL to a WMS server that supports EPSG:3857 (or EPSG:900913) as a source of tiled data. The server URL should contain a \`"{bbox-epsg-3857}"\` replacement token to supply the \`bbox\` parameter.

\`\`\`json
"wms-imagery": {
    "type": "raster",
    "tiles": [
        "http://a.example.com/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=example"
    ],
    "tileSize": 256
}
\`\`\`

## vector


A vector tile source. Tiles must be in [Mapbox Vector Tile format](https://docs.mapbox.com/vector-tiles/). All geometric coordinates in vector tiles must be between \`-1 * extent\` and \`(extent * 2) - 1\` inclusive. All layers that use a vector source must specify a [\`"source-layer"\`](/maplibre-gl-js-docs/style-spec/layers/#source-layer) value. 

\`\`\`json
"maplibre-streets": {
    "type": "vector",
    "tiles": [
        "http://a.example.com/tiles/{z}/{x}/{y}.pbf"
    ],
}
\`\`\`

`;
    }
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.source_vector;
    },
    section: "vector"
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0',
        android: '2.0.1',
        ios: '2.0.0',
        macos: '0.1.0'
      }
    }
  })), escape(createComponent(Markdown, {
    content: `
## raster

A raster tile source.

\`\`\`json
"maplibre-satellite": {
    "type": "raster",
    "tiles": [
        "http://a.example.com/tiles/{z}/{x}/{y}.png"
    ],
    "tileSize": 256
}
\`\`\`
`
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.source_raster;
    },
    section: "raster"
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0',
        android: '2.0.1',
        ios: '2.0.0',
        macos: '0.1.0'
      }
    }
  })), escape(createComponent(Markdown, {
    content: `
## raster-dem

A raster DEM source. Only supports [Mapbox Terrain RGB](https://blog.mapbox.com/global-elevation-data-6689f1d0ba65) and Mapzen Terrarium tiles.

\`\`\`json
"maplibre-terrain-rgb": {
    "type": "raster-dem",
    "encoding": "mapbox",
    "tiles": [
        "http://a.example.com/dem-tiles/{z}/{x}/{y}.png"
    ],
}
\`\`\`
`
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.source_raster_dem;
    },
    section: "raster-dem"
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.43.0'
      }
    }
  })), escape(createComponent(Markdown, {
    content: `
## geojson

A [GeoJSON](http://geojson.org/) source. Data must be provided via a \`"data"\` property, whose value can be a URL or inline GeoJSON.

\`\`\`json
"geojson-marker": {
    "type": "geojson",
    "data": {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [12.550343, 55.665957]
        },
        "properties": {
            "title": "Somewhere",
            "marker-symbol": "monument"
        }
    }
}
\`\`\`

This example of a GeoJSON source refers to an external GeoJSON document via its URL. The GeoJSON document must be on the same domain or accessible using [CORS](http://enable-cors.org/).

\`\`\`json
"geojson-lines": {
    "type": "geojson",
    "data": "./lines.geojson"
}
\`\`\`
`
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.source_geojson;
    },
    section: "geojson"
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0',
        android: '2.0.1',
        ios: '2.0.0',
        macos: '0.1.0'
      },
      clustering: {
        js: '0.14.0',
        android: '4.2.0',
        ios: '3.4.0',
        macos: '0.3.0'
      },
      'line distance metrics': {
        js: '0.45.0',
        android: '6.5.0',
        ios: '4.4.0',
        macos: '0.11.0'
      }
    }
  })), escape(createComponent(Markdown, {
    content: `
## image

An image source. The \`"url"\` value contains the image location.

The \`"coordinates"\` array contains \`[longitude, latitude]\` pairs for the image corners listed in clockwise order: top left, top right, bottom right, bottom left.

\`\`\`json
"image": {
    "type": "image",
    "url": "https://maplibre.org/maplibre-gl-js-docs/assets/radar.gif",
    "coordinates": [
        [-80.425, 46.437],
        [-71.516, 46.437],
        [-71.516, 37.936],
        [-80.425, 37.936]
    ]
}
\`\`\`
`
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.source_image;
    },
    section: "image"
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0',
        android: '5.2.0',
        ios: '3.7.0',
        macos: '0.6.0'
      }
    }
  })), escape(createComponent(Markdown, {
    content: `
## video

A video source. The \`"urls"\` value is an array. For each URL in the array, a video element [source](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source) will be created. To support the video across browsers, supply URLs in multiple formats.

The \`"coordinates"\` array contains \`[longitude, latitude]\` pairs for the video corners listed in clockwise order: top left, top right, bottom right, bottom left.

\`\`\`json
"video": {
    "type": "video",
    "urls": [
        "https://static-assets.mapbox.com/mapbox-gl-js/drone.mp4",
        "https://static-assets.mapbox.com/mapbox-gl-js/drone.webm"
    ],
    "coordinates": [
        [-122.51596391201019, 37.56238816766053],
        [-122.51467645168304, 37.56410183312965],
        [-122.51309394836426, 37.563391708549425],
        [-122.51423120498657, 37.56161849366671]
    ]
}
\`\`\`
`
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.source_video;
    },
    section: "video"
  })), escape(createComponent(SDKSupportTable, {
    supportItems: {
      'basic functionality': {
        js: '0.10.0'
      }
    }
  })));
}

const _tmpl$$6 = ["<div", ">", "</div>"];
function Sprite() {
  const md = `
# Sprite

A style's \`sprite\` property supplies a URL template for loading small images to use in rendering \`background-pattern\`, \`fill-pattern\`, \`line-pattern\`,\`fill-extrusion-pattern\` and \`icon-image\` style properties.

\`\`\`json
"sprite": ${JSON.stringify(spec.$root.sprite.example, null, 2)}
\`\`\`

A valid sprite source must supply two types of files:

- An _index file_, which is a JSON document containing a description of each image contained in the sprite. The content of this file must be a JSON object whose keys form identifiers to be used as the values of the above style properties, and whose values are objects describing the dimensions (\`width\` and \`height\` properties) and pixel ratio (\`pixelRatio\`) of the image and its location within the sprite (\`x\` and{' '} \`y\`). For example, a sprite containing a single image might have the following index file contents:

\`\`\`json
{
    "poi": {
        "width": 32,
        "height": 32,
        "x": 0,
        "y": 0,
        "pixelRatio": 1
    }
}
\`\`\`

- Then the style could refer to this sprite image by creating a symbol layer with the layout property \`"icon-image": "poi"\`, or with the tokenized value  \`"icon-image": "{icon}"\` and vector tile features with a \`icon\` property with the value \`poi\`.
- _Image files_, which are PNG images containing the sprite data.

Apart from the required \`width\`, \`height\`, \`x\`, and \`y\` properties, the following optional properties are supported:
<!-- copyeditor ignore retext-passive -->
- \`content\`: An array of four numbers, with the first two specifying the left, top corner, and the last two specifying the right, bottom corner. If present, and if the icon uses [\`icon-text-fit\`](/maplibre-gl-js-docs/style-spec/layers/#layout-symbol-icon-text-fit), the symbol's text will be fit inside the content box.
- \`stretchX\`: An array of two-element arrays, consisting of two numbers that represent the _from_ position and the _to_ position of areas that can be stretched.
- \`stretchY\`: Same as \`stretchX\`, but for the vertical dimension.

MapLibre SDKs will use the value of the \`sprite\` property in the style to generate the URLs for loading both files. First, for both file types, it will append \`@2x\` to the URL on high-DPI devices. Second, it will append a file extension: \`.json\` for the index file, and \`.png\` for the image file. For example, if you specified \`"sprite": "https://example.com/sprite"\`, renderers would load \`https://example.com/sprite.json\` and \`https://example.com/sprite.png\`, or \`https://example.com/sprite@2x.json\` and \`https://example.com/sprite@2x.png\`.

`;
  return ssr(_tmpl$$6, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: md
  })));
}

const _tmpl$$5 = ["<div", "><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
function Transition() {
  const md = `# Transition
A \`transition\` property controls timing for the interpolation between a transitionable style property's previous value and new value. A style's [root \`transition\`](/root/#transition) property provides global transition defaults for that style.
\`\`\`json
"transition": ${JSON.stringify(spec.$root.transition.example, null, 2)}
\`\`\`
Any transitionable layer property, may also have its own \`*-transition\` property that defines specific transition timing for that layer property, overriding the global \`transition\` values.

\`\`\`json
"fill-opacity-transition": ${JSON.stringify(spec.$root.transition.example, null, 2)}
\`\`\`

## Transition Options
`;
  return ssr(_tmpl$$5, ssrHydrationKey(), escape(createComponent(Markdown, {
    content: md
  })), escape(createComponent(Items, {
    headingLevel: "3",
    get entry() {
      return spec.transition;
    }
  })));
}

function types() {
  const md = `
# Types
    
MapLibre style contains values of various types, most commonly as values for the style properties of a layer.

## Color

The \`color\` type is a color in the [sRGB color space](https://en.wikipedia.org/wiki/SRGB). Colors are JSON strings in a variety of permitted formats: HTML-style hex values, RGB, RGBA, HSL, and HSLA. Predefined HTML colors names, like \`yellow\` and \`blue\`, are also permitted.

\`\`\`json
{
    "line-color": "#ff0",
    "line-color": "#ffff00",
    "line-color": "rgb(255, 255, 0)",
    "line-color": "rgba(255, 255, 0, 1)",
    "line-color": "hsl(100, 50%, 50%)",
    "line-color": "hsla(100, 50%, 50%, 1)",
    "line-color": "yellow"
}
\`\`\`

## Formatted

The \`formatted\` type is a string broken into sections annotated with separate formatting options.

\`\`\`json
{
    "text-field": ["format",
        "foo", { "font-scale": 1.2 },
        "bar", { "font-scale": 0.8 }
    ]
}
\`\`\`


## ResolvedImage

The \`resolvedImage\` type is an image (e.g., an icon or pattern) which is used in a layer. An input to the \`image\` expression operator is checked against the current map style to see if it is available to be rendered or not, and the result is returned in the \`resolvedImage\` type. This approach allows developers to define a series of images which the map can fall back to if previous images are not found, which cannot be achieved by providing, for example, \`icon-image\` with a plain string (because multiple strings cannot be supplied to \`icon-image\` and multiple images cannot be defined in a string).

\`\`\`json
{
    "icon-image": ["coalesce", ["image", "myImage"], ["image", "fallbackImage"]]
}
\`\`\`


## String

A string is text. In MapLibre styles, strings are in quotes.

\`\`\`json
{
    "source": "mySource"
}
\`\`\`


## Boolean

Boolean means yes or no, so it accepts the values \`true\` or \`false\`.

\`\`\`json
{
    "fill-enabled": true
}
\`\`\`


## Number

A number value, often an integer or floating point (decimal number). Written without quotes.

\`\`\`json
{
    "text-size": 24
}
\`\`\`


## Array

Arrays are comma-separated lists of one or more numbers in a specific order. For example, they're used in line dash arrays, in which the numbers specify intervals of line, break, and line again. If an array is used as an argument in an expression, the array must be wrapped in a \`literal\` expression.

\`\`\`json
{
    "line-dasharray": [2, 4]
}

{
    "circle-color": ["in", 1, ["literal", [1, 2, 3]]]
}
\`\`\`
`;
  return createComponent(Markdown, {
    content: md
  });
}

/// <reference path="../server/types.tsx" />
const fileRoutes = [{
  component: NotFound,
  path: "/*404"
}, {
  component: Layers$1,
  path: "/deprecations"
}, {
  component: Expressions,
  path: "/expressions"
}, {
  component: glyphs,
  path: "/glyphs"
}, {
  component: Introduction,
  path: "/"
}, {
  component: Layers,
  path: "/layers"
}, {
  component: Light,
  path: "/light"
}, {
  component: Root$1,
  path: "/root"
}, {
  component: Sources,
  path: "/sources"
}, {
  component: Sprite,
  path: "/sprite"
}, {
  component: Transition,
  path: "/transition"
}, {
  component: types,
  path: "/types"
}];

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const FileRoutes = () => {
  return fileRoutes;
};

const sidebar_outer_container = "_sidebar_outer_container_1o98g_1";
const sidebar_viewport = "_sidebar_viewport_1o98g_9";
const sidebar_inner_container = "_sidebar_inner_container_1o98g_16";
const navItems$1 = "_navItems_1o98g_24";
const style$4 = {
	sidebar_outer_container: sidebar_outer_container,
	sidebar_viewport: sidebar_viewport,
	sidebar_inner_container: sidebar_inner_container,
	navItems: navItems$1
};

const pages = [{
  title: 'Introduction',
  path: '/'
}, {
  title: 'Root',
  path: '/root'
}, {
  title: 'Light',
  path: '/light'
}, {
  title: 'Sources',
  path: '/sources'
}, {
  title: 'Sprite',
  path: '/sprite'
}, {
  title: 'Glyphs',
  path: '/glyphs'
}, {
  title: 'Transition',
  path: '/transition'
}, {
  title: 'Layers',
  path: '/layers'
}, {
  title: 'Types',
  path: '/types'
}, {
  title: 'Expressions',
  path: '/expressions'
}, {
  title: 'Deprecations',
  path: '/deprecations'
}];

const _tmpl$$4 = ["<aside", " class=\"", "\"><div class=\"", "\"><div", "><div", "><ul><!--#-->", "<!--/--><li><a target=\"_blank\" href=\"https://github.com/maplibre/maplibre-gl-style-spec/blob/main/CHANGELOG.md\">Changelog</a></li></ul></div></div></div></aside>"],
  _tmpl$2$3 = ["<li", ">", "</li>"];
function Sidebar(props) {
  return ssr(_tmpl$$4, ssrHydrationKey(), `${escape(style$4.sidebar_outer_container, true)} ${escape(props.class, true)}`, `${escape(style$4.sidebar_viewport, true)}`, ssrAttribute("class", escape(style$4.sidebar_inner_container, true), false), ssrAttribute("class", escape(style$4.navItems, true), false), escape(pages.map(page => ssr(_tmpl$2$3, ssrHydrationKey(), escape(createComponent(A, {
    end: true,
    "class": "sidebar-link",
    get href() {
      return page.path.replace('/', '');
    },
    get children() {
      return page.title;
    }
  }))))));
}

// export function Sidebar(props: SidebarProps) {

//     return (
//         <aside class={`${style.sidebar} ${props.class}`}>
//             <h1 class={style.header}>MapLibre Styles Docs</h1>
//             <hr />
//             <div class={style.navItems}>
//                 <ul>
//                     {docs.map((doc) => (
//                         <li>
//                             <a href={doc.link}>{doc.title}</a>
//                         </li>
//                     ))}
//                 </ul>
//             </div>
//         </aside>
//     );
// }

const toc_outer_container = "_toc_outer_container_11c9r_1";
const largeTOC = "_largeTOC_11c9r_10";
const toc_viewport = "_toc_viewport_11c9r_14";
const paintIcon = "_paintIcon_11c9r_28";
const layoutIcon = "_layoutIcon_11c9r_29";
const navItems = "_navItems_11c9r_32";
const anchor_H1 = "_anchor_H1_11c9r_58";
const anchor_H2 = "_anchor_H2_11c9r_64";
const anchor_H3$1 = "_anchor_H3_11c9r_67";
const header$1 = "_header_11c9r_77";
const style$3 = {
	toc_outer_container: toc_outer_container,
	largeTOC: largeTOC,
	toc_viewport: toc_viewport,
	paintIcon: paintIcon,
	layoutIcon: layoutIcon,
	navItems: navItems,
	anchor_H1: anchor_H1,
	anchor_H2: anchor_H2,
	anchor_H3: anchor_H3$1,
	header: header$1
};

const _tmpl$$3 = ["<h3", " style=\"", "\"", ">On This Page</h3>"],
  _tmpl$2$2 = ["<nav", "><div", "><!--#-->", "<!--/--><ul>", "</ul></div></nav>"],
  _tmpl$3$1 = ["<aside", " class=\"", "\"><div class=\"", "\">", "</div></aside>"],
  _tmpl$4 = ["<li", "><a href=\"", "\" class=\"", "\"><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></a></li>"],
  _tmpl$5 = ["<span", "><i class=\"fa-solid fa-palette\"></i></span>"],
  _tmpl$6 = ["<span", "><i class=\"fa-solid fa-pen\"></i></span>"];
// import scrollto

function TableOfContents(props) {
  // Create state for the active link and headers
  const [activeLink, setActiveLink] = createSignal('');
  // const [headers, setHeaders] = createSignal<{ id: string; title: string | null }[]>([]);
  const [domHeaders, setDomHeaders] = createSignal([]);

  // Define a selector for the headers to include in the table of contents
  props.mode === 'large' ? 'h2, h3' : 'h2';

  // Render the table of contents with the headers and active link state
  return ssr(_tmpl$3$1, ssrHydrationKey(), `${escape(props.class, true)} ${escape(style$3.toc_outer_container, true)} ${escape(style$3[`${props.mode}TOC`], true)}`, `${escape(props.class, true)} ${escape(style$3.toc_viewport, true)}`, escape(createComponent(Show, {
    get when() {
      return domHeaders().length > 0;
    },
    get children() {
      return ssr(_tmpl$2$2, ssrHydrationKey(), ssrAttribute("class", escape(style$3.navItems, true), false), escape(createComponent(Show, {
        get when() {
          return props.mode === 'large';
        },
        get children() {
          return ssr(_tmpl$$3, ssrHydrationKey(), "cursor:" + "pointer", ssrAttribute("class", escape(style$3.header, true), false));
        }
      })), escape(createComponent(For, {
        get each() {
          return domHeaders();
        },
        children: header => ssr(_tmpl$4, ssrHydrationKey() + ssrAttribute("class", header.id === activeLink() ? escape(style$3.active, true) : '', false), `#${escape(header.id, true)}`, `${header.tagName === 'H1' ? escape(style$3.anchor_H1, true) : ""} ${header.tagName === 'H2' ? escape(style$3.anchor_H2, true) : ""} ${header.tagName === 'H3' ? escape(style$3.anchor_H3, true) : ""}`, header.id.startsWith('paint-') ? ssr(_tmpl$5, ssrHydrationKey() + ssrAttribute("class", escape(style$3.paintIcon, true), false)) : escape(null), header.id.startsWith('layout-') ? ssr(_tmpl$6, ssrHydrationKey() + ssrAttribute("class", escape(style$3.layoutIcon, true), false)) : escape(null), escape(header.innerText))
      })));
    }
  })));
}

const toc_accordion = "_toc_accordion_59lvd_2";
const scrollToTop = "_scrollToTop_59lvd_12";
const mainContentContainer = "_mainContentContainer_59lvd_29";
const mainContent_paddingContainer = "_mainContent_paddingContainer_59lvd_37";
const row = "_row_59lvd_44";
const docItems = "_docItems_59lvd_48";
const githubLink = "_githubLink_59lvd_59";
const style$2 = {
	toc_accordion: toc_accordion,
	scrollToTop: scrollToTop,
	mainContentContainer: mainContentContainer,
	mainContent_paddingContainer: mainContent_paddingContainer,
	row: row,
	docItems: docItems,
	githubLink: githubLink
};

// src/array.ts

// src/assertion.ts
function isArray(value) {
  return Array.isArray(value);
}
function isString(value) {
  return Object.prototype.toString.call(value) === "[object String]";
}
function isFunction(value) {
  return typeof value === "function";
}

// src/create-generate-id.ts
function createGenerateId(baseId) {
  return suffix => `${baseId()}-${suffix}`;
}

// src/events.ts
function callHandler(event, handler) {
  if (handler) {
    if (isFunction(handler)) {
      handler(event);
    } else {
      handler[0](handler[1], event);
    }
  }
  return event?.defaultPrevented;
}
function mergeDefaultProps(defaultProps, props) {
  return mergeProps(defaultProps, props);
}

// src/run-after-transition.ts
var transitionsByElement = /* @__PURE__ */new Map();
var transitionCallbacks = /* @__PURE__ */new Set();
function setupGlobalEvents() {
  if (typeof window === "undefined") {
    return;
  }
  const onTransitionStart = e => {
    if (!e.target) {
      return;
    }
    let transitions = transitionsByElement.get(e.target);
    if (!transitions) {
      transitions = /* @__PURE__ */new Set();
      transitionsByElement.set(e.target, transitions);
      e.target.addEventListener("transitioncancel", onTransitionEnd);
    }
    transitions.add(e.propertyName);
  };
  const onTransitionEnd = e => {
    if (!e.target) {
      return;
    }
    const properties = transitionsByElement.get(e.target);
    if (!properties) {
      return;
    }
    properties.delete(e.propertyName);
    if (properties.size === 0) {
      e.target.removeEventListener("transitioncancel", onTransitionEnd);
      transitionsByElement.delete(e.target);
    }
    if (transitionsByElement.size === 0) {
      for (const cb of transitionCallbacks) {
        cb();
      }
      transitionCallbacks.clear();
    }
  };
  document.body.addEventListener("transitionrun", onTransitionStart);
  document.body.addEventListener("transitionend", onTransitionEnd);
}
if (typeof document !== "undefined") {
  if (document.readyState !== "loading") {
    setupGlobalEvents();
  } else {
    document.addEventListener("DOMContentLoaded", setupGlobalEvents);
  }
}
/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/da142672eddefa99365773ced72171facc06fdcb/packages/ariakit-utils/src/array.ts
 */
/*!
 * Original code by Chakra UI
 * MIT Licensed, Copyright (c) 2019 Segun Adebayo.
 *
 * Credits to the Chakra UI team:
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/utils/src/assertion.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/solidjs-community/solid-aria/blob/2c5f54feb5cfea514b1ee0a52d0416878f882351/packages/utils/src/createGlobalListeners.ts
 */
/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/232bc79018ec20967fec1e097a9474aba3bb5be7/packages/ariakit-utils/src/dom.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/cf9ab24f3255be1530d0f584061a01aa1e8180e6/packages/@react-aria/utils/src/platform.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/a9dea8a3672179e6c38aafd1429daf44c7ea2ff6/packages/@react-aria/utils/src/focusWithoutScrolling.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/a9dea8a3672179e6c38aafd1429daf44c7ea2ff6/packages/@react-aria/utils/src/getScrollParent.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/a9dea8a3672179e6c38aafd1429daf44c7ea2ff6/packages/@react-aria/utils/src/isVirtualEvent.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/ff3e690fffc6c54367b8057e28a0e5b9211f37b5/packages/@react-stately/utils/src/number.ts
 */
/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/84e97943ad637a582c01c9b56d880cd95f595737/packages/ariakit/src/hovercard/__utils/polygon.ts
 * https://github.com/ariakit/ariakit/blob/f2a96973de523d67e41eec983263936c489ef3e2/packages/ariakit/src/hovercard/__utils/debug-polygon.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/a9dea8a3672179e6c38aafd1429daf44c7ea2ff6/packages/@react-aria/utils/src/runAfterTransition.ts
 */
/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/utils/src/scrollIntoView.ts
 */
/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the Ariakit team:
 * https://github.com/ariakit/ariakit/blob/main/packages/ariakit-utils/src/focus.ts
 *
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/focus/src/isElementVisible.ts
 * https://github.com/adobe/react-spectrum/blob/8f2f2acb3d5850382ebe631f055f88c704aa7d17/packages/@react-aria/focus/src/FocusScope.tsx
 */

/**
 * Creates a simple reactive state with a getter and setter,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableSignal(props) {
    // Internal uncontrolled value
    // eslint-disable-next-line solid/reactivity
    const [_value, _setValue] = createSignal(props.defaultValue?.());
    const isControlled = createMemo(() => props.value?.() !== undefined);
    const value = createMemo(() => (isControlled() ? props.value?.() : _value()));
    const setValue = (next) => {
        untrack(() => {
            const nextValue = accessWith(next, value());
            if (!Object.is(nextValue, value())) {
                if (!isControlled()) {
                    _setValue(nextValue);
                }
                props.onChange?.(nextValue);
            }
            return nextValue;
        });
    };
    return [value, setValue];
}
/**
 * Creates a simple reactive Boolean state with a getter, setter and a fallback value of `false`,
 * that can be controlled with `value` and `onChange` props.
 */
function createControllableBooleanSignal(props) {
    const [_value, setValue] = createControllableSignal(props);
    const value = () => _value() ?? false;
    return [value, setValue];
}

/**
 * Provides state management for open, close and toggle scenarios.
 * Used to control the "open state" of components like Modal, Drawer, etc.
 */
function createDisclosureState(props = {}) {
    const [isOpen, setIsOpen] = createControllableBooleanSignal({
        value: () => access$1(props.isOpen),
        defaultValue: () => !!access$1(props.defaultIsOpen),
        onChange: value => props.onOpenChange?.(value),
    });
    const open = () => {
        setIsOpen(true);
    };
    const close = () => {
        setIsOpen(false);
    };
    const toggle = () => {
        isOpen() ? close() : open();
    };
    return {
        isOpen,
        setIsOpen,
        open,
        close,
        toggle,
    };
}

/*!
 * Portions of this file are based on code from radix-ui-primitives.
 * MIT Licensed, Copyright (c) 2022 WorkOS.
 *
 * Credits to the Radix UI team:
 * https://github.com/radix-ui/primitives/blob/21a7c97dc8efa79fecca36428eec49f187294085/packages/react/presence/src/Presence.tsx
 * https://github.com/radix-ui/primitives/blob/21a7c97dc8efa79fecca36428eec49f187294085/packages/react/presence/src/useStateMachine.tsx
 */
function createPresence(present) {
    const [node, setNode] = createSignal();
    let styles = {};
    let prevPresent = present();
    let prevAnimationName = "none";
    const [state, send] = createStateMachine(present() ? "mounted" : "unmounted", {
        mounted: {
            UNMOUNT: "unmounted",
            ANIMATION_OUT: "unmountSuspended",
        },
        unmountSuspended: {
            MOUNT: "mounted",
            ANIMATION_END: "unmounted",
        },
        unmounted: {
            MOUNT: "mounted",
        },
    });
    createEffect(on(state, state => {
        const currentAnimationName = getAnimationName(styles);
        prevAnimationName = state === "mounted" ? currentAnimationName : "none";
    }));
    createEffect(on(present, present => {
        if (prevPresent === present) {
            return;
        }
        const currentAnimationName = getAnimationName(styles);
        if (present) {
            send("MOUNT");
            //} else if (currentAnimationName === "none" || styles?.display === "none") {
            // If there is no exit animation or the element is hidden, animations won't run, so we unmount instantly
        }
        else if (styles?.display === "none") {
            // If the element is hidden, animations won't run, so we unmount instantly
            send("UNMOUNT");
        }
        else {
            /**
             * When `present` changes to `false`, we check changes to animation-name to
             * determine whether an animation has started. We chose this approach (reading
             * computed styles) because there is no `animationrun` event and `animationstart`
             * fires after `animation-delay` has expired which would be too late.
             */
            const isAnimating = prevAnimationName !== currentAnimationName;
            if (prevPresent && isAnimating) {
                send("ANIMATION_OUT");
            }
            else {
                send("UNMOUNT");
            }
        }
        prevPresent = present;
    }));
    createEffect(on(node, node => {
        if (node) {
            /**
             * Triggering an ANIMATION_OUT during an ANIMATION_IN will fire an `animationcancel`
             * event for ANIMATION_IN after we have entered `unmountSuspended` state. So, we
             * make sure we only trigger ANIMATION_END for the currently active animation.
             */
            const handleAnimationEnd = (event) => {
                const currentAnimationName = getAnimationName(styles);
                const isCurrentAnimation = currentAnimationName.includes(event.animationName);
                if (event.target === node && isCurrentAnimation) {
                    send("ANIMATION_END");
                }
            };
            const handleAnimationStart = (event) => {
                if (event.target === node) {
                    // if animation occurred, store its name as the previous animation.
                    prevAnimationName = getAnimationName(styles);
                }
            };
            node.addEventListener("animationstart", handleAnimationStart);
            node.addEventListener("animationcancel", handleAnimationEnd);
            node.addEventListener("animationend", handleAnimationEnd);
            onCleanup(() => {
                node.removeEventListener("animationstart", handleAnimationStart);
                node.removeEventListener("animationcancel", handleAnimationEnd);
                node.removeEventListener("animationend", handleAnimationEnd);
            });
        }
        else {
            // Transition to the unmounted state if the node is removed prematurely.
            // We avoid doing so during cleanup as the node may change but still exist.
            send("ANIMATION_END");
        }
    }));
    return {
        isPresent: () => ["mounted", "unmountSuspended"].includes(state()),
        setRef: (el) => {
            if (el) {
                styles = getComputedStyle(el);
            }
            setNode(el);
        },
    };
}
/* -----------------------------------------------------------------------------------------------*/
function getAnimationName(styles) {
    return styles?.animationName || "none";
}
function createStateMachine(initialState, machine) {
    const reduce = (state, event) => {
        const nextState = machine[state][event];
        return nextState ?? state;
    };
    const [state, setState] = createSignal(initialState);
    const send = (event) => {
        setState(prev => reduce(prev, event));
    };
    return [state, send];
}

/**
 * Create a function that call the setter with an id and return a function to reset it.
 */
function createRegisterId(setter) {
    return (id) => {
        setter(id);
        return () => setter(undefined);
    };
}

/*!
 * Portions of this file are based on code from ariakit.
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the ariakit team:
 * https://github.com/ariakit/ariakit/blob/8a13899ff807bbf39f3d89d2d5964042ba4d5287/packages/ariakit-react-utils/src/hooks.ts
 */
/**
 * Returns the tag name by parsing an element ref.
 * @example
 * function Component(props) {
 *   let ref: HTMLDivElement | undefined;
 *   const tagName = createTagName(() => ref, () => "button"); // div
 *   return <div ref={ref} {...props} />;
 * }
 */
function createTagName(ref, fallback) {
    const [tagName, setTagName] = createSignal(stringOrUndefined(fallback?.()));
    return tagName;
}
function stringOrUndefined(value) {
    return isString(value) ? value : undefined;
}

/**
 * A utility component that render either `As` or its `fallback` component.
 */
function Polymorphic(props) {
  const [local, others] = splitProps(props, ["asChild", "fallback", "children"]);
  // Prevent the extra computation below when polymorphism is not needed.
  if (!local.asChild) {
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.fallback;
      }
    }, others, {
      get children() {
        return local.children;
      }
    }));
  }
  const resolvedChildren = children(() => local.children);
  // Single child is `As`.
  if (isAs(resolvedChildren())) {
    const combinedProps = combineProps(others, resolvedChildren()?.props ?? {});
    return createComponent(Dynamic, combinedProps);
  }
  // Multiple children, find an `As` if any.
  if (isArray(resolvedChildren())) {
    const newElement = resolvedChildren().find(isAs);
    if (newElement) {
      // because the new element will be the one rendered, we are only interested
      // in grabbing its children (`newElement.props.children`)
      const newChildren = () => createComponent(For, {
        get each() {
          return resolvedChildren();
        },
        children: child => createComponent(Show, {
          when: child === newElement,
          fallback: child,
          get children() {
            return newElement.props.children;
          }
        })
      });
      const combinedProps = combineProps(others, newElement?.props ?? {});
      return createComponent(Dynamic, mergeProps(combinedProps, {
        children: newChildren
      }));
    }
  }
  throw new Error("[kobalte]: Component is expected to render `asChild` but no children `As` component was found.");
}
/* -------------------------------------------------------------------------------------------------
 * As
 * -----------------------------------------------------------------------------------------------*/
const AS_COMPONENT_SYMBOL = Symbol("$$KobalteAsComponent");
/* -------------------------------------------------------------------------------------------------
 * Utils
 * -----------------------------------------------------------------------------------------------*/
function isAs(component) {
  return component?.[AS_COMPONENT_SYMBOL] === true;
}
function combineProps(baseProps, overrideProps) {
  return combineProps$1([baseProps, overrideProps], {
    reverseEventHandlers: true
  });
}

const CollapsibleContext = createContext();
function useCollapsibleContext() {
  const context = useContext(CollapsibleContext);
  if (context === undefined) {
    throw new Error("[kobalte]: `useCollapsibleContext` must be used within a `Collapsible.Root` component");
  }
  return context;
}

/**
 * Contains the content to be rendered when the collapsible is expanded.
 */
function CollapsibleContent(props) {
  const context = useCollapsibleContext();
  props = mergeDefaultProps({
    id: context.generateId("content")
  }, props);
  const [local, others] = splitProps(props, ["ref", "id", "style"]);
  const presence = createPresence(() => context.shouldMount());
  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  // When opening we want it to immediately open to retrieve dimensions.
  // When closing we delay `isPresent` to retrieve dimensions before closing.
  const isOpen = () => context.isOpen() || presence.isPresent();
  isOpen();
  createEffect(on(
  /**
   * depends on `presence.isPresent` because it will be `false` on
   * animation end (so when close finishes). This allows us to
   * retrieve the dimensions *before* closing.
   */
  [() => presence.isPresent()], () => {
    {
      return;
    }
  }));
  return createComponent(Show, {
    get when() {
      return presence.isPresent();
    },
    get children() {
      return createComponent(Polymorphic, mergeProps({
        fallback: "div",
        get id() {
          return local.id;
        },
        get style() {
          return {
            "--kb-collapsible-content-height": height() ? `${height()}px` : undefined,
            "--kb-collapsible-content-width": width() ? `${width()}px` : undefined,
            ...local.style
          };
        }
      }, () => context.dataset(), others));
    }
  });
}

/**
 * An interactive component which expands/collapses a content.
 */
function CollapsibleRoot(props) {
  const defaultId = `collapsible-${createUniqueId()}`;
  props = mergeDefaultProps({
    id: defaultId
  }, props);
  const [local, others] = splitProps(props, ["isOpen", "defaultIsOpen", "onOpenChange", "isDisabled", "forceMount"]);
  const [contentId, setContentId] = createSignal();
  const disclosureState = createDisclosureState({
    isOpen: () => local.isOpen,
    defaultIsOpen: () => local.defaultIsOpen,
    onOpenChange: isOpen => local.onOpenChange?.(isOpen)
  });
  const dataset = createMemo(() => ({
    "data-expanded": disclosureState.isOpen() ? "" : undefined,
    "data-closed": !disclosureState.isOpen() ? "" : undefined,
    "data-disabled": local.isDisabled ? "" : undefined
  }));
  const context = {
    dataset,
    isOpen: disclosureState.isOpen,
    isDisabled: () => local.isDisabled ?? false,
    shouldMount: () => local.forceMount || disclosureState.isOpen(),
    contentId,
    toggle: disclosureState.toggle,
    generateId: createGenerateId(() => others.id),
    registerContentId: createRegisterId(setContentId)
  };
  return createComponent(CollapsibleContext.Provider, {
    value: context,
    get children() {
      return createComponent(Polymorphic, mergeProps({
        fallback: "div"
      }, dataset, others));
    }
  });
}

/*!
 * Portions of this file are based on code from ariakit
 * MIT Licensed, Copyright (c) Diego Haz.
 *
 * Credits to the ariakit team:
 * https://github.com/hope-ui/hope-ui/blob/54125b130195f37161dbeeea0c21dc3b198bc3ac/packages/core/src/button/is-button.ts
 */
const BUTTON_INPUT_TYPES = ["button", "color", "file", "image", "reset", "submit"];
/**
 * Checks whether `element` is a native HTML button element.
 * @example
 * isButton(document.querySelector("button")); // true
 * isButton(document.querySelector("input[type='button']")); // true
 * isButton(document.querySelector("div")); // false
 * isButton(document.querySelector("input[type='text']")); // false
 * isButton(document.querySelector("div[role='button']")); // false
 */
function isButton(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName === "button") {
        return true;
    }
    if (tagName === "input" && element.type) {
        return BUTTON_INPUT_TYPES.indexOf(element.type) !== -1;
    }
    return false;
}

/**
 * Button enables users to trigger an action or event, such as submitting a form,
 * opening a dialog, canceling an action, or performing a delete operation.
 * This component is based on the [WAI-ARIA Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
 */
function ButtonRoot(props) {
  let ref;
  props = mergeDefaultProps({
    type: "button"
  }, props);
  const [local, others] = splitProps(props, ["ref", "type", "isDisabled"]);
  const tagName = createTagName(() => ref, () => "button");
  const isNativeButton = createMemo(() => {
    const elementTagName = tagName();
    if (elementTagName == null) {
      return false;
    }
    return isButton({
      tagName: elementTagName,
      type: local.type
    });
  });
  const isNativeInput = createMemo(() => {
    return tagName() === "input";
  });
  const isNativeLink = createMemo(() => {
    return tagName() === "a" && ref?.getAttribute("href") != null;
  });
  return createComponent(Polymorphic, mergeProps({
    fallback: "button",
    get type() {
      return isNativeButton() || isNativeInput() ? local.type : undefined;
    },
    get role() {
      return !isNativeButton() && !isNativeLink() ? "button" : undefined;
    },
    get tabIndex() {
      return !isNativeButton() && !isNativeLink() && !local.isDisabled ? 0 : undefined;
    },
    get disabled() {
      return isNativeButton() || isNativeInput() ? local.isDisabled : undefined;
    },
    get ["aria-disabled"]() {
      return !isNativeButton() && !isNativeInput() && local.isDisabled ? true : undefined;
    },
    get ["data-disabled"]() {
      return local.isDisabled ? "" : undefined;
    }
  }, others));
}

/**
 * The button that expands/collapses the collapsible content.
 */
function CollapsibleTrigger(props) {
  const context = useCollapsibleContext();
  const [local, others] = splitProps(props, ["onClick"]);
  const onClick = e => {
    callHandler(e, local.onClick);
    context.toggle();
  };
  return createComponent(ButtonRoot, mergeProps({
    get ["aria-expanded"]() {
      return context.isOpen();
    },
    get ["aria-controls"]() {
      return context.isOpen() ? context.contentId() : undefined;
    },
    get isDisabled() {
      return context.isDisabled();
    },
    onClick: onClick
  }, () => context.dataset(), others));
}

const _tmpl$$2 = ["<i", " class=\"", "\"></i>"],
  _tmpl$2$1 = ["<main", " class=\"", "\"><div", "><!--#-->", "<!--/--><div", "><div id=\"ContentWindow\"", ">", "</div></div><div", "><i class=\"fa-solid fa-arrow-up\"></i></div><a", " target=\"_blank\" href=\"https://github.com/maplibre/maplibre-gl-style-spec\"><i class=\"fa-brands fa-github\"></i> MapLibre Style Specficiation</a><a", " target=\"_blank\" href=\"", "\"><i class=\"fa-brands fa-github\"></i> Edit page layout</a></div></main>"];
function MainContent(props) {
  const location = useLocation();
  return ssr(_tmpl$2$1, ssrHydrationKey(), `${escape(style$2.mainContentContainer, true)} ${escape(props.class, true)}`, ssrAttribute("class", escape(style$2.mainContent_paddingContainer, true), false), escape(createComponent(CollapsibleRoot, {
    "class": 'collapsible',
    get children() {
      return [createComponent(CollapsibleTrigger, {
        "class": 'collapsible__trigger',
        get children() {
          return ["Table of contents", ssr(_tmpl$$2, ssrHydrationKey(), `fa-solid fa-chevron-down ${'collapsible__trigger-icon'}`)];
        }
      }), createComponent(CollapsibleContent, {
        "class": 'collapsible__content',
        get children() {
          return createComponent(TableOfContents, {
            mode: "small"
          });
        }
      })];
    }
  })), ssrAttribute("class", escape(style$2.row, true), false), ssrAttribute("class", escape(style$2.docItems, true), false), escape(props.children), ssrAttribute("class", escape(style$2.scrollToTop, true), false), ssrAttribute("class", escape(style$2.githubLink, true), false), ssrAttribute("class", escape(style$2.githubLink, true), false), `https://github.com/maplibre/maplibre-gl-style-spec/blob/main/docs/src/routes${location.pathname === '/' ? '/index' : escape(location.pathname, true)}.tsx`);
}

const app_wrap = "_app_wrap_16weg_1";
const container = "_container_16weg_9";
const Drawer = "_Drawer_16weg_16";
const style$1 = {
	app_wrap: app_wrap,
	container: container,
	Drawer: Drawer
};

const overlay = "_overlay_1roky_1";
const closebtn = "_closebtn_1roky_29";
const overlayStyle = {
	overlay: overlay,
	closebtn: closebtn
};

const SideMenuButton = "_SideMenuButton_hcd9x_2";
const header = "_header_hcd9x_12";
const logoContainer = "_logoContainer_hcd9x_25";
const logo$1 = "_logo_hcd9x_25";
const title_container = "_title_container_hcd9x_38";
const title = "_title_hcd9x_38";
const style = {
	SideMenuButton: SideMenuButton,
	header: header,
	logoContainer: logoContainer,
	logo: logo$1,
	title_container: title_container,
	title: title
};

const _tmpl$$1 = ["<header", "><div", "><i class=\"fa-solid fa-bars\"></i></div><div", "><img", " alt=\"logo\"", "><div", "><span", ">Style Specification</span></div></div></header>"];

// random image
const logo = '/maplibre-logo-big.svg';
function Header() {
  useNavigate();
  return ssr(_tmpl$$1, ssrHydrationKey() + ssrAttribute("class", escape(style.header, true), false), ssrAttribute("class", escape(style.SideMenuButton, true), false), ssrAttribute("class", escape(style.logoContainer, true), false), ssrAttribute("src", escape(logo, true), false), ssrAttribute("class", escape(style.logo, true), false), ssrAttribute("class", escape(style.title_container, true), false), ssrAttribute("class", escape(style.title, true), false));
}

const _tmpl$ = ["<div", " id=\"myNav\"", "><div><!--#-->", "<!--/--><ul>", "</ul></div></div>"],
  _tmpl$2 = ["<div", " id=\"app_wrap\"><!--#-->", "<!--/--><!--#-->", "<!--/--><div", "><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></div></div>"],
  _tmpl$3 = ["<li", ">", "</li>"];
const [showNavOverlay, setShowNavOverlay] = createSignal(false);
function App(props) {
  return ssr(_tmpl$2, ssrHydrationKey() + ssrAttribute("class", escape(style$1.app_wrap, true), false), escape(createComponent(Show, {
    get when() {
      return showNavOverlay();
    },
    get children() {
      return ssr(_tmpl$, ssrHydrationKey(), ssrAttribute("class", escape(overlayStyle.overlay, true), false), escape(createComponent(Header, {})), escape(pages.map(page => ssr(_tmpl$3, ssrHydrationKey(), escape(createComponent(A, {
        end: true,
        get href() {
          return page.path.replace('/', '');
        },
        onClick: () => {
          setShowNavOverlay(false);
        },
        "class": "sidebar-link",
        get children() {
          return page.title;
        }
      }))))));
    }
  })), escape(createComponent(Header, {})), ssrAttribute("class", escape(style$1.container, true), false), escape(createComponent(Sidebar, {})), escape(createComponent(MainContent, {
    get children() {
      return props.children;
    }
  })), escape(createComponent(TableOfContents, {
    mode: "large"
  })));
}

function Root() {
  return createComponent(Html, {
    lang: "en",
    get children() {
      return [createComponent(Head, {
        get children() {
          return [createComponent(Title, {
            children: "MapLibre Styles Docs"
          }), createComponent(Meta$1, {
            charset: "utf-8"
          }), createComponent(Meta$1, {
            name: "viewport",
            content: "width=device-width, initial-scale=1"
          }), createComponent(Link, {
            rel: "preconnect",
            href: "https://fonts.googleapis.com"
          }), createComponent(Link, {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossorigin: true
          }), createComponent(Link, {
            href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap",
            rel: "stylesheet"
          }), createComponent(Link, {
            href: "https://unpkg.com/@fortawesome/fontawesome-free@6.4.0/css/fontawesome.css",
            rel: "stylesheet"
          }), createComponent(Link, {
            href: "https://unpkg.com/@fortawesome/fontawesome-free@6.4.0/css/brands.css",
            rel: "stylesheet"
          }), createComponent(Link, {
            href: "https://unpkg.com/@fortawesome/fontawesome-free@6.4.0/css/solid.css",
            rel: "stylesheet"
          })];
        }
      }), createComponent(Body, {
        get children() {
          return [createComponent(Suspense, {
            get children() {
              return createComponent(ErrorBoundary, {
                get children() {
                  return createComponent(App, {
                    get children() {
                      return createComponent(Routes, {
                        get children() {
                          return createComponent(FileRoutes, {});
                        }
                      });
                    }
                  });
                }
              });
            }
          }), createComponent(Scripts, {})];
        }
      })];
    }
  });
}

const rootData = Object.values(/* #__PURE__ */ Object.assign({

}))[0];
const dataFn = rootData ? rootData.default : undefined;

/** Function responsible for listening for streamed [operations]{@link Operation}. */

/** This composes an array of Exchanges into a single ExchangeIO function */
const composeMiddleware = exchanges => ({
  forward
}) => exchanges.reduceRight((forward, exchange) => exchange({
  forward
}), forward);
function createHandler(...exchanges) {
  const exchange = composeMiddleware(exchanges);
  return async event => {
    return await exchange({
      forward: async op => {
        return new Response(null, {
          status: 404
        });
      }
    })(event);
  };
}
function StartRouter(props) {
  return createComponent(Router, props);
}
const docType = ssr("<!DOCTYPE html>");
function StartServer({
  event
}) {
  const parsed = new URL(event.request.url);
  const path = parsed.pathname + parsed.search;

  // @ts-ignore
  sharedConfig.context.requestContext = event;
  return createComponent(ServerContext.Provider, {
    value: event,
    get children() {
      return createComponent(MetaProvider, {
        get tags() {
          return event.tags;
        },
        get children() {
          return createComponent(StartRouter, {
            url: path,
            get out() {
              return event.routerContext;
            },
            location: path,
            get prevLocation() {
              return event.prevUrl;
            },
            data: dataFn,
            routes: fileRoutes,
            get children() {
              return [docType, createComponent(Root, {})];
            }
          });
        }
      });
    }
  });
}

const entryServer = createHandler(renderAsync(event => createComponent(StartServer, {
  event: event
})));

const MAX_REDIRECTS = 10;
async function handleRequest(req) {
  req.headers = {};
  req.method = "GET";
  const webRes = await entryServer({
    request: createRequest(req),
    env: { manifest }
  });
  return webRes;
}

var server = async req => {
  let webRes = await handleRequest(req);
  if (webRes.status === 200) {
    return webRes.text();
  } else if (webRes.status === 302) {
    let redirects = 1;
    while (redirects < MAX_REDIRECTS) {
      webRes = await handleRequest({ url: webRes.headers.get("location") });
      if (webRes.status === 200) {
        return webRes.text();
      } else if (webRes.status === 302) {
        redirects++;
      } else {
        return "<h1>Error</h1>";
      }
    }
  }
  return webRes.text();
};

export { server as default };
