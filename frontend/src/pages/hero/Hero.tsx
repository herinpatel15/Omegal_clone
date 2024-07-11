import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Hero() {

    const [name, setName] = useState("")

    return (
        <div className="hero">
            <input 
                type="text"
                placeholder="Search for a movie"
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <Link 
                to={`/room/?name=${name}`}
            >Join</Link>
        </div>
    )
}