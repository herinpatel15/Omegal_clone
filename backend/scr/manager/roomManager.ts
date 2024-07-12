import { User } from './UserManager'

let GLOBAL_ROOM_ID = 1

interface Room {
    user1: User,
    user2: User
}

export class RoomManager {

    private room: Map<string, Room>

    constructor() {
        this.room = new Map<string, Room>();
    }

    createRoom( user1: User, user2: User) {

        const roomId = this.generate().toString()

        this.room.set(roomId.toString(), {
            user1,
            user2
        })

        user1.socket.emit("sender-offer", {
            roomId
        })

        user2.socket.emit("sender-offer", {
            roomId
        })
    }

    onOffer(roomId: string, sdp: string, senderSocketid: string) {
        console.log("offer send")
        const room = this.room.get(roomId)
        if (!room) {
            return
        }

        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1
        receivingUser.socket.emit("offer", {
            sdp, 
            roomId
        })
    }

    onAnser(roomId: string, sdp: string, senderSocketid: string) {
        console.log("anser done");
        
        const room = this.room.get(roomId)
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;

        receivingUser.socket.emit("answer", {
            sdp,
            roomId
        })
    }

    onIceCandidates(roomId: string, senderSocketid: string, candidate: any, type: "sender" | "receiver") {
        const room = this.room.get(roomId)
        if(!room) {
            return
        }

        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1
        receivingUser.socket.emit("add-ice-candidate", ({candidate, type}))
    }

    generate() {
        return GLOBAL_ROOM_ID++
    }
}