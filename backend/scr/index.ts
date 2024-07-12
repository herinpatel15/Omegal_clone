import {Server, Socket} from "socket.io"
import http, {createServer} from "http"
import { UserManager } from "./manager/UserManager"

const server = createServer(http)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
    }
})

const userManager = new UserManager()

io.on('connection', (socket: Socket) => {
    console.log("a user connect")
    userManager.addUser("randomName", socket)
})

server.listen(3030, () => {
    console.log("server running: 3030");
})