import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Tables from '../pages/Tables'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}


