

setTimeout(function () {ini();}, 0);


function ini() {
	let args = {
		"src": "http://doft.ddns.net/Assets/js/Server/process.php",
		"args": {
			"message": "Hello World"
		}
	};
	Server.send(args, "response");
}

function response(data) {
	document.getElementById("output").innerHTML = data;
}
