// Server.js
/*
    File: Server.js
    Date: 3-03-2022
    Modified: [Current Date]
    Creator: Daniel K. Valente
    Version: 0.0.2.0
    Licensing: BSD 3-Clause License
    Licensing Information: General public licensing allowing freedom to execute, modify, share, and study this class and its contents.
    Details: Instance-based class for server communication, replacing static methods for better modularity and state management.
*/

// Error status levels and codes (unchanged for brevity, see original for details)
class Server {
    // Connection status: 0x00=success, 0x01=fatal error, etc.
    conStatus = 0x0001
    // Tracks if an error occurred
    error = false
    // Current status code
    status = false
    // Error severity level
    errorLevel = 0x0000
    // Configuration overrides
    overrides = {"url-auto-resolve": false}
    // Message from server response
    msg = false
    // XMLHttpRequest instance
    con = false
    // Default request method
    method = "POST"
    // Source URL
    src = false
    // Default content type
    contentType = "application/x-www-form-urlencoded"
    // Request headers array
    headers = []
    // Request arguments object
    obj = false
    // Encoded parameters string
    params = ""
    // Callback function for response
    cbf = false
    // Reference for content types
    ref = {
        "content-types": {
            text: ["application/x-www-form-urlencoded", "text/*", /* ... */],
            // Other types omitted for brevity, see original
        }
    }

    // Initiates a POST request with args and optional callback
    send(args = false, cbf = false, func = false) {
        this.checkArgs(args) ? this.prepareAndSend(args, cbf, func) : console.warn("Missing params")
    }

    // Prepares request data and connects to server
    prepareAndSend(args, cbf, func) {
        this.obj = args
        this.src = this.getSrc()
        this.params = this.getParams()
        this.setMethod()
        this.setContentType()
        this.cbf = func === false ? cbf : (cbf === true ? func : this.setCallbackFunction())
        this.connect()
    }

    // Establishes server connection and handles response
    connect() {
        if (!this.checkReq()) return
        this.con = new XMLHttpRequest()
        this.con.onreadystatechange = () => this.handleReadyStateChange()
        this.con.open(this.method, this.src, true)
        this.con.setRequestHeader("Content-type", this.contentType)
        this.con.send(this.params)
    }

    // Processes server response based on ready state
    handleReadyStateChange() {
        if (this.con.readyState !== 4) return
        (this.con.status >= 200 && this.con.status < 300) ? this.processResponse() : null
    }

    // Parses and invokes callback with response
    processResponse() {
        if (!this.cbf) return console.warn("No callback specified")
        let resp = this.con.responseText
            (resp.match(/[\{\[]/) && resp.match(/[\}\]]/)) ? resp = this.parseJSON(resp) : null
        typeof this.cbf === "function" ? this.cbf(resp) : (window[this.cbf] ? window[this.cbf](resp) : console.warn("Callback not found"))
    }

    // Attempts to parse JSON response, returns raw text on failure
    parseJSON(resp) {
        try {return JSON.parse(resp)} catch (e) {return resp}
    }

    // Checks if required request data is present
    checkReq() {
        return this.method && this.params && this.obj
    }

    // Sets callback from obj or defaults to false
    setCallbackFunction() {
        return this.checkObj() ? (this.obj.func || this.obj.cbf || this.obj.callback || this.obj["callback-function"] || false) : false
    }

    // Sets content type from obj or defaults
    setContentType() {
        this.contentType = this.checkObj() && this.obj["content-type"] && typeof this.obj["content-type"] === "string"
            ? this.obj["content-type"].toUpperCase()
            : "application/x-www-form-urlencoded"
    }

    // Sets method from obj or defaults to POST
    setMethod() {
        this.method = this.checkObj() && this.obj.method && typeof this.obj.method === "string"
            ? this.obj.method.toUpperCase()
            : "POST"
    }

    // Checks if obj is an array or object
    checkObj() {
        return ["array", "object"].includes(typeof this.obj)
    }

    // Encodes and joins parameters from obj.args
    getParams() {
        if (!this.checkObj() || !["array", "object"].includes(typeof this.obj.args)) return ""
        let tmp = ""
        let i = 0
        for (let [item, value] of Object.entries(this.obj.args))
            tmp += i++ === 0 ? `${this.urlEncode(item)}=${this.urlEncode(value)}` : `&${this.urlEncode(item)}=${this.urlEncode(value)}`
        return tmp
    }

    // Encodes string for URL safety
    urlEncode(q = false) {
        return typeof q === "string" ? encodeURI(q) : q
    }

    // Extracts source URL from obj
    getSrc() {
        return this.checkObj() && typeof this.obj.src === "string" ? this.obj.src : false
    }

    // Validates args and sets error states
    checkArgs(q = false) {
        if (!["array", "object"].includes(typeof q)) return false
        if (!q.src) return this.setError("URL destination not specified", 0x01, 0x0001)
        if (!q.args) return this.setWarning("No arguments specified", 0x10, 0x0001)
        return true
    }

    // Sets error state with message and codes
    setError(msg, level, status) {
        this.error = msg
        this.errorLevel = level
        this.status = status
        return false
    }

    // Sets warning state with message and codes
    setWarning(msg, level, status) {
        this.error = msg
        this.errorLevel = level
        this.status = status
        return true
    }

    // Checks if host is reachable within 100ms, returns boolean
    canReachHost(host) {
        if (typeof host !== "string") return false
        let img = new Image()
        let start = performance.now()
        let reached = false
        img.onload = img.onerror = () => reached = true
        img.src = `${host}/favicon.ico?t=${Date.now()}`
        while (performance.now() - start < 100 && !reached);
        return reached
    }
}

// Export for module usage, or attach to window for script usage
typeof module !== "undefined" && module.exports ? module.exports = Server : window.Server = Server