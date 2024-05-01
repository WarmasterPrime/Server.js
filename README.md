# Server.js

<h1>Example</h1>
	<h2>Sending HTTP Requests</h2>
	<pre>
<var color="rgb(200,100,150)">let</var> <var color="rgb(200,150,50)">args</var> = {
		<var color="rgb(100,100,200)">"src"</var>: <var color="rgb(100,100,200)">"http://yoursitehere.com/server.php"</var>,
		<var color="rgb(100,100,200)">"args"</var>: {
			<var color="rgb(100,100,200)">"param-0"</var>: <var color="rgb(100,100,200)">"param_value"</var>
		}
	};
Server.Send(<var color="rgb(200,150,50)">args</var>, <var color="rgb(200,100,150)">true</var>, <var color="rgb(100,100,200)">"call_back_function"</var>);
</pre>
