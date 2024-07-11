import { Routes, Route } from "react-router-dom"
import Hero from "./pages/hero/Hero"
import Room from "./pages/room/Room"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Hero/>} />
        <Route path="/room" element={<Room/>} />
      </Routes>
    </>
  )
}

export default App
