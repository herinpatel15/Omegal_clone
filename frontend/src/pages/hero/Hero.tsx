import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Room from "../room/Room";

export default function Hero() {

    const [name, setName] = useState("")
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | undefined>()
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | undefined>()
    const [join, setJoin] = useState(false)

    const videoRef = useRef<HTMLVideoElement | null>(null)

    const getMedia = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        const videoTrack = stream.getVideoTracks()[0]
        const audioTrack = stream.getAudioTracks()[0]
        setLocalVideoTrack(videoTrack)
        setLocalAudioTrack(audioTrack)

        if (!videoRef.current) {
            return
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play()
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getMedia()
        }
    }, [videoRef])

    if (!join) {
        return (
            <div className="hero">
                <video autoPlay ref={videoRef}></video>
                <input 
                    type="text"
                    placeholder="Search for a movie"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <button onClick={() => setJoin(true)}>Join</button>
            </div>
        )
    }

    return <Room name={name} localVideoTrack={localVideoTrack} localAudioTrack={localAudioTrack} />
}