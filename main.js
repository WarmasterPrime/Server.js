import Server from './Server.js'
let server = new Server()
console.log(server.canReachHost("https://example.com")) // true or false
server.send({src: "https://example.com/api", args: {key: "value"}}, resp => console.log(resp))