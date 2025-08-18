import { useEffect, useState } from 'react'

const NODE_API = import.meta.env.VITE_NODE_API_URL || 'http://localhost:4005'
const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:5005'

export default function App() {
  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])

  useEffect(() => {
    fetch(`${NODE_API}/api/users`).then(r => r.json()).then(setUsers)
    fetch(`${PY_API}/api/items`).then(r => r.json()).then(setItems)
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Microservices Starter</h1>
      <section>
        <h2>Users (Node + Mongo)</h2>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </section>
      <section>
        <h2>Items (FastAPI + Postgres)</h2>
        <pre>{JSON.stringify(items, null, 2)}</pre>
      </section>
    </div>
  )
}