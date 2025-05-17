// Server.js
/*
File:                       server.js;
Date:                       3-03-2022;
Modified:                   Current Date;
Creator:                    Daniel K. Valente;
Version:                    0.0.2.0;
Licensing:                  BSD 3-Clause License
Licensing Information:      General public licensing which allows any user the freedom to execute/run, modify, share, and study this class object and all of the contents within this file.
Details:
							This is a class object that provides a means to easily communicate with server-side processes.
*/
/*
ERROR STATUS LEVELS:
	0x00:           Success, no errors.
	0x01:           Fatal error. Cannot continue.
	0x10:           Conditional warning. (Can continue).
	0x11:           Verbose/Debug/Informational (Can continue).
ERROR STATUS CODES:
	0x00:           No errors.
	0x01:           Unknown error
	0x02:           No destination was specified.
	0x03:           No arguments/parameters were sent to the server.
	0x04:           No callback function was specified.
	0x05:           Header(s) could not be set.
	0x06:           Data was unable to be sent to the server.
	0x07:           Awaiting response from server.
	0x08:           Partial data received, waiting for all data. (Used when only some data was received from the server... The server must specify in the headers that only part of the data was sent).
	0x09:           All data received.
	0x0A:           Server-side error detected.
	0x0B:           Failed to communicate with the server due to malformed parameter(s). (Occurs when a parameter did not get encoded correctly for URL transmission).
	0x0C:           Specified method does not exist.
	0x0D:           Callback function does not exist or cannot be found/contacted.
	0x0E:           Missing headers.
	0x0F:           Missing configuration object.
	0x10:           Client is not connected to the internet.
	0x11:           Client time is invalid.
	0x12:           Client OS is invalid.
	0x13:           Client browser is not supported.
	0x14:           Too many request were sent.
	0x15:           Scripts are disabled.
	0x16:           Third-party/External application, extension, or script is creating a conflict.
	0x17:           Interception conflict.
*/

class Server {
	/**
	 * Connection status flag
	 * @type {number}
	 */
	static con_status = 0x0001;

	/**
	 * Error flag
	 * @type {boolean}
	 */
	static error = false;

	/**
	 * Status flag
	 * @type {boolean|number}
	 */
	static status = false;

	/**
	 * Error level code
	 * @type {number}
	 */
	static error_level = 0x0000;

	/**
	 * Configuration overrides
	 * @type {Object}
	 */
	static overrides = {
		"url-auto-resolve": false
	};

	/**
	 * Message storage
	 * @type {boolean|string}
	 */
	static msg = false;

	/**
	 * XMLHttpRequest connection object
	 * @type {boolean|XMLHttpRequest}
	 */
	static con = false;

	/**
	 * HTTP method to use (GET, POST, etc.)
	 * @type {string}
	 */
	static method = "POST";

	/**
	 * Source URL
	 * @type {boolean|string}
	 */
	static src = false;

	/**
	 * Content type for request
	 * @type {string}
	 */
	static content_type = "application/x-www-form-urlencoded";

	/**
	 * Request headers
	 * @type {Array}
	 */
	static headers = [];

	/**
	 * Configuration object
	 * @type {boolean|Object}
	 */
	static obj = false;

	/**
	 * URL parameters string
	 * @type {string}
	 */
	static params = "";

	/**
	 * Callback function
	 * @type {boolean|Function|string}
	 */
	static cbf = false;

	/**
	 * Reference data for content types
	 * @type {Object}
	 */
	static ref = {
		"content-types": {
			"text": [
				"application/x-www-form-urlencoded",
				"text/*",
				"application/rtf",
				"text/rtf",
				"text/strings",
				"text/html",
				"text/javascript",
				"text/css",
				"text/csv"
			],
			"object": [
				"application/json",
				"application/xml"
			],
			"file": [
				"application/zip",
				"application/pdf"
			],
			"image": [
				"image/png",
				"image/svg",
				"image/jpeg",
				"image/jpg",
				"image/heif",
				"image/gif"
			],
			"audio": [
				"audio/mpeg",
				"audio/mp3",
				"audio/mp4",
				"audio/MPA",
				"audio/ogg"
			],
			"video": [
				"application/mp4",
				"application/mpeg4",
				"application/ogg"
			]
		}
	};

	/**
	 * Checks if a destination/host can be reached
	 * @param {string} url - The URL to check
	 * @param {number} timeout - Timeout in milliseconds (default: 100)
	 * @return {Promise<boolean>} - True if reachable, false otherwise
	 */
	static async canReach(url, timeout = 100) {
		if (!url) return false;

		return new Promise(resolve => {
			const xhr = new XMLHttpRequest();
			xhr.onreadystatechange = () => {
				if (xhr.readyState === 4)
					resolve(xhr.status >= 200 && xhr.status < 300);
			};
			xhr.onerror = () => resolve(false);
			xhr.ontimeout = () => resolve(false);

			xhr.open('HEAD', url, true);
			xhr.timeout = timeout;
			xhr.send();
		});
	}

	/**
	 * Sends a request to the target server
	 * @param {Object} args - Configuration object with src, args, etc.
	 * @param {Function|string} cbf - Callback function or name
	 * @param {Function|string} func - Alternative callback function
	 * @return {boolean} - Result status
	 */
	static send(args = false, cbf = false, func = false) {
		if (!this.checkArgs(args)) {
			console.warn("Missing params");
			return false;
		}

		Server.obj = args;
		Server.src = this.getSrc();
		if (Server.overrides["url-auto-resolve"] === false)
			Server.validateSources();

		Server.params = Server.getParams();
		Server.setMethod();
		Server.setContentType();

		// Set callback function based on provided parameters
		if (func === false && cbf !== false)
			Server.cbf = cbf;
		else if (cbf === true && func !== false)
			Server.cbf = func;
		else
			Server.setCallbackFunction();

		return Server.connect();
	}

	/**
	 * Establishes a connection to the destination server
	 * @return {boolean} - Connection status
	 */
	static connect() {
		if (!Server.checkReq())
			return false;

		Server.con = new XMLHttpRequest();
		Server.con.onreadystatechange = function () {
			if (this.readyState !== 4)
				return;

			if (this.status >= 200 && this.status < 300) {
				if (!Server.cbf) {
					console.warn("No callback function specified.");
					return;
				}

				if (window[Server.cbf] || (typeof Server.cbf) === "function") {
					let resp = this.responseText;

					// Try to parse JSON response
					if ((resp.indexOf("{") != -1 && resp.indexOf("}") != -1) || (resp.indexOf("[") != -1 && resp.indexOf("]") != -1)) {
						try {
							resp = JSON.parse(this.responseText);
						} catch (e) {
							resp = this.responseText;
						}
					}

					// Execute callback
					if (window[Server.cbf])
						window[Server.cbf](resp);
					else
						Server.cbf(resp);
				} else {
					console.warn("Unable to locate callback function.");
				}
			}
		};

		Server.con.open(Server.method, Server.src, true);
		Server.con.setRequestHeader("Content-type", Server.content_type);
		Server.con.send(Server.params);

		return true;
	}

	/**
	 * Checks if required data exists for the request
	 * @return {boolean} - True if all required data exists
	 */
	static checkReq() {
		return !(Server.method === false || !Server.method.length > 0 || !Server.params.length > 0 || Server.obj === false);
	}

	/**
	 * Sets the callback function from the configuration object
	 */
	static setCallbackFunction() {
		if (!Server.check_obj())
			return;

		Server.cbf = Server.obj["func"] || Server.obj["cbf"] || Server.obj["callback"] || Server.obj["callback-function"] || false;
	}

	/**
	 * Sets the content type to use for the request
	 */
	static setContentType() {
		if (!Server.check_obj())
			return;

		if (Server.obj["content-type"] && (typeof Server.obj["content-type"]) === "string")
			Server.contentType = Server.obj["content-type"].toUpperCase();
	}

	/**
	 * Sets the request method to use (GET, POST, etc.)
	 */
	static setMethod() {
		if (!Server.check_obj())
			return;

		if (Server.obj["method"] && (typeof Server.obj["method"]) === "string")
			Server.method = Server.obj["method"].toUpperCase();
	}

	/**
	 * Checks if server configuration object exists
	 * @return {boolean} - True if object exists
	 */
	static check_obj() {
		let t = (typeof Server.obj);
		return t === "array" || t === "object";
	}

	/**
	 * Builds parameter string from configuration object
	 * @return {string} - URL encoded parameter string
	 */
	static getParams() {
		if (!Server.obj["args"] || !((typeof Server.obj["args"]) === "array" || (typeof Server.obj["args"]) === "object"))
			return "";

		let tmp = "";
		let i = 0;

		for (let [item, value] of Object.entries(Server.obj["args"])) {
			if (i === 0) {
				tmp += this.url_encode(item) + "=" + this.url_encode(value);
				i++;
			} else {
				tmp += "&" + this.url_encode(item) + "=" + this.url_encode(value);
			}
		}

		return tmp;
	}

	/**
	 * Encodes a string for URL transmission
	 * @param {string} q - String to encode
	 * @return {string} - Encoded string
	 */
	static url_encode(q = false) {
		return (typeof q) === "string" ? encodeURI(q) : q;
	}

	/**
	 * Validates and normalizes source URLs
	 */
	static validateSources() {
		if ((typeof Server.src) !== "string")
			return;

		let q = Server.src.toLowerCase();
		if (q.indexOf("http") == -1) {
			Server.src = window.location.protocol + "//" +
				(window.location.host || window.location.hostname) +
				this.dirname(window.location.pathname) + Server.src;
		}
	}

	/**
	 * Extracts directory name from a path
	 * @param {string} q - Path to process
	 * @return {string} - Directory name
	 */
	static dirname(q = false) {
		if ((typeof q) !== "string")
			return q;

		if (q.indexOf(".") != -1 && q.split(".")[q.split(".").length - 1].match(/php|js|css|html|asp/i))
			q = q.replace(/[\/]?[A-z0-9]+\.(php|js|css|html|asp).*/i, "/");

		return q;
	}

	/**
	 * Determines if an object is an associative array or indexed array
	 * @param {Object|Array} q - Object to check
	 * @return {string|boolean} - "array", "object", or false
	 */
	static getArrayType(q = false) {
		let t = (typeof q);
		if (t !== "array" && t !== "object")
			return false;

		let type = false;
		for (let [item] of Object.entries(q)) {
			type = (typeof item);
			break;
		}

		return type !== "string" ? "object" : "array";
	}

	/**
	 * Gets the source URL from the configuration object
	 * @return {string|boolean} - Source URL or false
	 */
	static getSrc() {
		if ((typeof Server.obj) !== "array" && (typeof Server.obj) !== "object")
			return false;

		let t = (typeof Server.obj["src"]);
		return t === "string" ? Server.obj["src"] : false;
	}

	/**
	 * Validates configuration arguments
	 * @param {Object} q - Configuration object
	 * @return {boolean} - True if valid
	 */
	static checkArgs(q = false) {
		let t = (typeof q);
		if (t !== "array" && t !== "object")
			return false;

		if (!q["src"]) {
			Server.status = 0x0001;
			Server.error = "URL destination was not specified in arguments. Please specify a target URL server to send this data to.";
			Server.error_level = 0x01;
			return false;
		}

		if (!q["args"]) {
			Server.status = 0x0001;
			Server.error = "No arguments were specified.";
			Server.error_level = 0x10;
		}

		return true;
	}
}

// Support for both module and direct script usage
if (typeof module !== "undefined" && module.exports)
	module.exports = Server;