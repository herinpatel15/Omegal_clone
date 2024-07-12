import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Socket, io } from "socket.io-client"

const URL = "http://localhost:3030"

export default function Room({
    name,
    localVideoTrack,
    localAudioTrack
} : {
    name: string,
    localVideoTrack: MediaStreamTrack,
    localAudioTrack: MediaStreamTrack
}) {

    const [searchParams, setSearchParams] = useSearchParams()
    // const name = searchParams.get('name')
    const [socket, setSocket] = useState<null | Socket>(null)
    const [lobby, setLobby] = useState(false)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | undefined>()
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | undefined>()
    const [sendingPeer, setSendingPeer] = useState<RTCPeerConnection | null>(null)
    const [receivingPeer, setReceivingPeer] = useState<RTCPeerConnection | null>(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null)
    const [winPeer, setWinPeer] = useState<RTCPeerConnection | null>(null)

    const remoteVideoRef = useRef<HTMLVideoElement | null>(null)


    useEffect(()=> {
        const socket = io(URL)

        socket.on('sender-offer', async ({roomId}) => {
            alert("send offer pleace")
            setLobby(false)
            const peer = new RTCPeerConnection()
            setSendingPeer(peer)

            // peer.addTrack(localVideoTrack)
            // peer.addTrack(localAudioTrack)

            if (localVideoTrack) {
                peer.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                peer.addTrack(localAudioTrack)
            }

            peer.onicecandidate = async (e) => {
                // const sdp = await peer.createOffer()
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    })
                }
            }

            peer.onnegotiationneeded = async () => {
                const sdp = await peer.createOffer()
                peer.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        })

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            alert("offer")
            setLobby(false)
            const peer = new RTCPeerConnection()

            peer.setRemoteDescription(remoteSdp)
            const sdp = await peer.createAnswer()
            peer.setLocalDescription(sdp)
            const stream = new MediaStream()
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream
            }
            setRemoteMediaStream(stream)
            setReceivingPeer(peer)

            // window.pcr = peer
            setWinPeer(peer)

            peer.ontrack = (e) => {
                alert("ontrack")
            }

            peer.addIceCandidate = async (e) => {
                if (!e?.candidate) {
                    return
                }
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                    })
                }
            }

            // peer.ontrack = (({track, type}) => {
            //     if (type == 'audio') {
            //         // setRemoteAudioTrack(track)
            //         // @ts-ignore
            //         remoteVideoRef.current.srcObject.addTrack(track)
            //     } else {
            //         // setRemoteVideoTrack(track)
            //         // @ts-ignore
            //         remoteVideoRef.current.srcObject.addTrack(track)
            //     }
            //     remoteVideoRef.current?.play()
            // })

            socket.emit("answer", {
                roomId,
                sdp
            })
        })

        setTimeout(() => {
            const track1 = winPeer?.getTransceivers()[0].receiver.track
            const track2 = winPeer?.getTransceivers()[1].receiver.track

            if (track1?.kind === "video") {
                setRemoteAudioTrack(track2)
                setRemoteVideoTrack(track1)
            } else {
                setRemoteAudioTrack(track1)
                setRemoteVideoTrack(track2)
            }

            // @ts-ignore
            remoteVideoRef.current.srcObject.addTrack(track1)
            // @ts-ignore
            remoteVideoRef.current.srcObject.addTrack(track2)

            remoteVideoRef.current?.play()
        }, 5000)

        socket.on("answer", ({roomId, sdp: remoteSdp}) => {
            alert("answer")
            setLobby(false)
            setSendingPeer(peer => {
                peer?.setRemoteDescription(remoteSdp)
                return peer
            })
        })

        socket.on("lobby", () => {
            setLobby(true)
        })

        setSocket(socket)
    }, [name])

    if (lobby) {
        return <div>Waiting to connect you to someone...</div>
    }

    return (
        <div className="room"> 
            <Link to={"/"}>done</Link>
            <h1>{name}</h1>
        </div>
    )
}