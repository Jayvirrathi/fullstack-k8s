import { useEffect, useState } from 'react'

const NODE_API = import.meta.env.VITE_NODE_API_URL || 'http://localhost:4005'
const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:5005'
const GO_API = import.meta.env.VITE_GO_API_URL || 'http://localhost:7005'

export default function App() {
  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch(`${NODE_API}/api/users`).then(r => r.json()).then(setUsers).catch(()=>{})
    fetch(`${PY_API}/api/items`).then(r => r.json()).then(setItems).catch(()=>{})
    fetch(`${GO_API}/api/products`).then(r => r.json()).then(setProducts).catch(()=>{})
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Microservices Starter</h1>
      <section>
        <h2>Users (Node + Mongo)</h2>
        <pre>{JSON.stringify(users, null, 2)}</pre>
        <button onClick={async () => {
          await fetch(`${NODE_API}/api/users`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Alice', email:'alice@example.com'})});
          const res = await fetch(`${NODE_API}/api/users`); setUsers(await res.json());
        }}>Add Sample User</button>
      </section>

      <section>
        <h2>Items (FastAPI + Postgres)</h2>
        <pre>{JSON.stringify(items, null, 2)}</pre>
        <button onClick={async () => {
          await fetch(`${PY_API}/api/items`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Sample Item'})});
          const res = await fetch(`${PY_API}/api/items`); setItems(await res.json());
        }}>Add Sample Item</button>
      </section>

      <section>
        <h2>Products (Go + Postgres)</h2>
        <pre>{JSON.stringify(products, null, 2)}</pre>
        <button onClick={async () => {
          await fetch(`${GO_API}/api/products`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Widget'})});
          const res = await fetch(`${GO_API}/api/products`); setProducts(await res.json());
        }}>Add Sample Product</button>
      </section>
    </div>
  )
}