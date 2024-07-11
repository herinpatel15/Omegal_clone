import { useSearchParams } from "react-router-dom"

export default function Room() {

    const [searchParams, setSearchParams] = useSearchParams()
    const name = searchParams.get('name')

    return (
        <div className="room">
            <h1>{name}</h1>
        </div>
    )
}