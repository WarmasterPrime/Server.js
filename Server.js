/*
File:						server.js;
Date:						3-03-2022;
Modified:					3-03-2022;
Creator:					Daniel K. Valente;
Version:					0.0.1.2;
Licensing:					BSD 3
Licensing Information:		General public licensing which allows any user the freedom to execute/run, modify, share, and study this class object and all of the contents within this file.
Details:
							This is a class object that provides a means to easily communicate with server-side processes.
*/
/*
ERROR STATUS LEVELS:
	0x00:			Success, no errors.
	0x01:			Fatal error. Cannot continue.
	0x10:			Conditional warning. (Can continue).
	0x11:			Verbose/Debug/Informational (Can continue).
ERROR STATUS CODES:
	0x00:			No errors.
	0x01:			Unknown error
	0x02:			No destination was specified.
	0x03:			No arguments/parameters were sent to the server.
	0x04:			No callback function was specified.
	0x05:			Header(s) could not be set.
	0x06:			Data was unable to be sent to the server.
	0x07:			Awaiting response from server.
	0x08:			Partial data received, waiting for all data. (Used when only some data was received from the server... The server must specify in the headers that only part of the data was sent).
	0x09:			All data received.
	0x0A:			Server-side error detected.
	0x0B:			Failed to communicate with the server due to malformed parameter(s). (Occurs when a parameter did not get encoded correctly for URL transmission).
	0x0C:			Specified method does not exist.
	0x0D:			Callback function does not exist or cannot be found/contacted.
	0x0E:			Missing headers.
	0x0F:			Missing configuration object.
	0x10:			Client is not connected to the internet.
	0x11:			Client time is invalid.
	0x12:			Client OS is invalid.
	0x13:			Client browser is not supported.
	0x14:			Too many request were sent.
	0x15:			Scripts are disabled.
	0x16:			Third-party/External application, extension, or script is creating a conflict.
	0x17:			Interception conflict.

*/


class Server {
	
	static con_status=0x0001;
	// Error handling...
	static error=false;
	static status=false;
	static error_level=0x0000;
	
	static overrides={
		"url-auto-resolve":false
	};
	
	static msg=false;
	static con=false;
	static method="POST";
	static src=false;
	static content_type="application/x-www-form-urlencoded";
	static headers=[];
	static obj=false;
	static params="";
	static cbf=false;
	static ref={
		"content-types":{
			"text":[
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
			"object":[
				"application/json",
				"application/xml"
			],
			"file":[
				"application/zip",
				"application/pdf"
			],
			"image":[
				"image/png",
				"image/svg",
				"image/jpeg",
				"image/jpg",
				"image/heif",
				"image/gif"
			],
			"audio":[
				"audio/mpeg",
				"audio/mp3",
				"audio/mp4",
				"audio/MPA",
				"audio/ogg"
			],
			"video":[
				"application/mp4",
				"application/mpeg4",
				"application/ogg"
			]
		}
	};
	// Sends a POST request to the target server.
	static send(args=false,cbf=false,func=false) {
		let res=false;
		if (this.checkArgs(args)) {
			//console.log(args);
			//console.log(cbf);
			//console.log(func);
			Server.obj=args;
			Server.src=this.getSrc();
			if (Server.overrides["url-auto-resolve"]===false) {
				Server.validateSources();
			}
			Server.params=Server.getParams();
			Server.setMethod();
			//console.log(Server.method);
			Server.setContentType();
			//console.log(Server.method);
			if (func===false && cbf!==false) {
				Server.cbf=cbf;
			} else if (cbf===true && func!==false) {
				Server.cbf=func;
			} else {
				Server.setCallbackFunction();
			}
			
			Server.connect();
		} else {
			console.warn("Missing params");
		}
		return res;
	}
	// Establishes a connection to the destination server.
	static connect() {
		let res=false;
		if (Server.checkReq()) {
			let tmp=false;
			Server.con=new XMLHttpRequest();
			Server.con.onreadystatechange=function(){
				/*
				console.log("");
				console.log((this.readyState===4));
				console.log((this.status>=200));
				console.log((this.status<300));
				console.log((this.status>=200 && this.status<300));
				console.log(((this.readystate===4) && (this.status>=200 && this.status<300)));
				console.log((this.readyState===4) && (this.status>=200 && this.status<300));
				*/
				tmp=this.readyState;
				//console.log(tmp===4);
				if (tmp===4) {
					//console.log(this.status>=200 && this.status<300);
					if (this.status>=200 && this.status<300) {
						//console.log("PASSED");
						if (Server.cbf!==false) {
							if (window[Server.cbf] || (typeof Server.cbf)==="function") {
								let resp=this.responseText;
								//console.log(resp);
								if ((resp.indexOf("{")!=-1 && resp.indexOf("}")!=-1) || (resp.indexOf("[")!=-1 && resp.indexOf("]")!=-1)) {
									try {
										resp=JSON.parse(this.responseText);
									}catch(e){
										resp=this.responseText;
									}
								}
								if (window[Server.cbf]) {
									window[Server.cbf](resp);
								} else {
									Server.cbf(resp);
								}
							} else {
								console.warn("Unable to locate callback function.");
							}
						} else {
							console.warn("No callback function specified.");
						}
					}
				} else {
					//console.log(this.readyState===4);
				}
			};
			//console.log(Server.method);
			Server.con.open(Server.method,Server.src,true);
			Server.con.setRequestHeader("Content-type",Server.content_type);
			Server.con.send(Server.params);
		}
		return res;
	}
	// Checks if required data exists.
	static checkReq() {
		let res=true;
		if (Server.method===false||!Server.method.length>0||!Server.params.length>0||Server.obj===false) {
			res=false;
		}
		return res;
	}
	// Sets the callback function.
	static setCallbackFunction() {
		//Server.cbf=false;
		if (Server.check_obj()) {
			if (Server.obj["func"]||Server.obj["cbf"]||Server.obj["callback"]||Server.obj["callback-function"]) {
				Server.cbf=Server.obj["func"]||Server.obj["cbf"]||Server.obj["callback"]||Server.obj["callback-function"]||undefined;
			}
		}
	}
	// Sets the content type to use.
	static setContentType() {
		let res="application/x-www-form-urlencoded";
		if (Server.check_obj()) {
			if (Server.obj["content-type"]) {
				if ((typeof Server.obj["content-type"])==="string") {
					res=Server.obj["content-type"].toUpperCase();
				}
			}
		}
		Server.contentType=res;
	}
	// Sets the request method to use.
	static setMethod() {
		let res="POST";
		if (Server.check_obj()) {
			if (Server.obj["method"]) {
				if ((typeof Server.obj["method"])==="string") {
					res=Server.obj["method"].toUpperCase();
				}
			}
		}
		Server.method=res;
	}
	// Returns true if server object is present.
	static check_obj() {
		let res=false;
		let t=(typeof Server.obj);
		if (t==="array"||t==="object") {
			res=true;
		}
		return res;
	}
	// Returns the parameters that are to be sent to the server.
	static getParams() {
		let res="";
		let t=(typeof Server.obj["args"]);
		if (t==="array"||t==="object") {
			let item=false;
			let value=false;
			let tmp="";
			let i=0;
			for([item,value] of Object.entries(Server.obj["args"])){
				if (i===0) {
					tmp+=this.url_encode(item) + "=" + this.url_encode(value);
					i++;
				} else {
					tmp+="&"+this.url_encode(item) + "=" + this.url_encode(value);
				}
			}
			res=tmp;
		}
		return res;
	}
	// Encodes a string to ensure that it does not cause a conflict with URL encoding.
	static url_encode(q=false) {
		if ((typeof q)==="string") {
			q=encodeURI(q);
		}
		return q;
	}
	// Validates the sources.
	static validateSources() {
		let res=false;
		let t=(typeof Server.src);
		if (t==="string") {
			let q=Server.src.toLowerCase();
			let tmp="";
			if (q.indexOf("http")==-1) {
				//console.log(this.dirname(window.location.pathname));
				tmp=window.location.protocol + "//" + (window.location.host||window.location.hostname) + this.dirname(window.location.pathname) + Server.src;
				//console.log(tmp);
				Server.src=tmp;
			}
		}
		return res;
	}
	// Returns the URL directory name.
	static dirname(q=false) {
		let res=q;
		if ((typeof res)==="string") {
			if (res.indexOf(".")!=-1) {
				if (res.split(".")[res.split(".").length-1].match(/php|js|css|html|asp/i)) {
					//res=res.substring(0,res.lastIndexOf(".")-1);
					res=res.replace(/[\/]?[A-z0-9]+\.(php|js|css|html|asp).*/i,"/");
				}
			}
		}
		//console.log(res);
		return res;
	}
	// Returns the array type.
	static getArrayType(q=false) {
		let res=false;
		let t=(typeof q);
		if (t==="array"||t==="object") {
			let item=false;
			let value=false;
			let type=false;
			for([item,value] of Object.entries(q)){
				type=(typeof item);
				break;
			}
			if (type!=="string") {
				res="object";
			} else {
				res="array";
			}
		}
		return res;
	}
	// Returns the URL within an array.
	static getSrc() {
		let res=false;
		let t=(typeof Server.obj);
		if (t==="array"||t==="object") {
			t=(typeof Server.obj["src"]);
			if (t!=="undefined") {
				if (t==="string") {
					res=Server.obj["src"];
				} else if (t==="array"||t==="object") {
					//res=Server.obj["src"];
				}
			}
		}
		return res;
	}
	
	static checkArgs(q=false) {
		let res=false;
		let t=(typeof q);
		if (t==="array"||t==="object") {
			if (q["src"]) {
				if (q["args"]) {
					res=true;
				} else {
					Server.status=0x0001;
					Server.error="No arguments were specified.";
					Server.error_level=0x10;
					res=true;
				}
			} else {
				Server.status=0x0001;
				Server.error="URL destination was not specified in arguments. Please specify a target URL server to send this data to.";
				Server.error_level=0x01;
			}
		}
		return res;
	}
	
}
