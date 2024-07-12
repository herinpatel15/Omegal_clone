

import { useEffect, useRef, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { Socket, io } from "socket.io-client"

const URL = "http://localhost:3030"

interface RoomProp {
    name: string,
    localVideoTrack: MediaStreamTrack | undefined,
    localAudioTrack: MediaStreamTrack | undefined
}

export default function Room({
    name,
    localVideoTrack,
    localAudioTrack
}: RoomProp) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [lobby, setLobby] = useState(false)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | undefined>()
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | undefined>()
    const [sendingPeer, setSendingPeer] = useState<RTCPeerConnection | null>(null)
    const [receivingPeer, setReceivingPeer] = useState<RTCPeerConnection | null>(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null)

    const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
    const localVideoRef = useRef<HTMLVideoElement | null>(null)

    const handleSenderOffer = useCallback(async ({ roomId }: { roomId: string }) => {
        setLobby(false)
        const peer = new RTCPeerConnection()
        setSendingPeer(peer)

        if (localVideoTrack) {
            peer.addTrack(localVideoTrack)
        }
        if (localAudioTrack) {
            peer.addTrack(localAudioTrack)
        }

        peer.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                })
            }
        }

        peer.onnegotiationneeded = async () => {
            const sdp = await peer.createOffer()
            await peer.setLocalDescription(sdp)
            if (socket) {
                socket.emit("offer", { sdp, roomId })
            }
        }
    }, [localVideoTrack, localAudioTrack, socket])

    const handleOffer = useCallback(async ({ roomId, sdp: remoteSdp }: { roomId: string, sdp: RTCSessionDescriptionInit }) => {
        setLobby(false)
        const peer = new RTCPeerConnection()

        await peer.setRemoteDescription(remoteSdp)
        const sdp = await peer.createAnswer()
        await peer.setLocalDescription(sdp)
        
        const stream = new MediaStream()
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
        }
        setRemoteMediaStream(stream)
        setReceivingPeer(peer)

        peer.ontrack = (e) => {
            if (e.track.kind === "video") {
                setRemoteVideoTrack(e.track)
            } else if (e.track.kind === "audio") {
                setRemoteAudioTrack(e.track)
            }
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject instanceof MediaStream) {
                (remoteVideoRef.current.srcObject as MediaStream).addTrack(e.track)
            }
        }

        peer.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                })
            }
        }
        
        if (socket) {
            socket.emit("answer", { roomId, sdp })
        }
    }, [socket])

    useEffect(() => {
        const socket = io(URL)

        socket.on('sender-offer', handleSenderOffer)
        socket.on("offer", handleOffer)

        socket.on("answer", ({ sdp: remoteSdp }) => {
            setLobby(false)
            sendingPeer?.setRemoteDescription(remoteSdp)
        })

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            const peer = type === "sender" ? receivingPeer : sendingPeer
            if (peer && candidate) {
                peer.addIceCandidate(candidate).catch(console.error)
            }
        })

        socket.on("lobby", () => {
            setLobby(true)
        })

        setSocket(socket)

        return () => {
            socket.disconnect()
        }
    }, [handleSenderOffer, handleOffer, sendingPeer, receivingPeer])

    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            const stream = new MediaStream([localVideoTrack])
            localVideoRef.current.srcObject = stream
            localVideoRef.current.play().catch(error => {
                console.error("Error playing local video:", error)
            })
        }
    }, [localVideoTrack])

    return (
        <div className="room"> 
            <Link to="/">done</Link>
            <h1>Hi {name}</h1>
            <video autoPlay width={300} height={300} ref={localVideoRef}></video>
            {lobby ? "Waiting to connect you to someone" : null}
            <video autoPlay width={600} height={600} ref={remoteVideoRef}></video>
        </div>
    )
}