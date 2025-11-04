import { Link } from 'react-router-dom'
import AppRoutes from './router/AppRoutes'
import styles from './components/TableContainer.module.css'
import btn from './components/Button.module.css'
import { useAppStore } from './stores/useAppStore'

export default function App() {
  const { count, increment, reset } = useAppStore()
  return (
    <div className={styles.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/">Home</Link>
          <Link to="/tables">Tables</Link>
        </nav>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span>Count: {count}</span>
          <button className={btn.root} onClick={increment}>Increment</button>
          <button className={btn.root} onClick={reset}>Reset</button>
        </div>
      </header>
      <main>
        <AppRoutes />
      </main>
    </div>
  )
}
