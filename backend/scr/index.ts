import {Server, Socket} from "socket.io"
import http, {createServer} from "http"

const server = createServer(http)
const io = new Server(server)

io.on('connection', (socket: Socket) => {
    console.log("a user connect")
})

server.listen(3000, () => {
    console.log("server running: 3000");
})