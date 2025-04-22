import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bocc Client Panel</h1>
      <p className="mt-2">Login system and chats coming soon!</p>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default App