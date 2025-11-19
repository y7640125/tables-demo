import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home/Home";
import TanStackFieldTablePage from "./components/tables/TanStackFieldTable/TanStackFieldTablePage";
import AgGridFieldTablePage from "./components/tables/AgGridFieldTable/AgGridFieldTablePage";
import ReactDataGridFieldTablePage from "./components/tables/ReactDataGridFieldTable/ReactDataGridFieldTablePage";

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tanstack-advanced" element={<TanStackFieldTablePage />} />
        <Route path="/ag-grid-advanced" element={<AgGridFieldTablePage />} />
        <Route path="/rdg-advanced" element={<ReactDataGridFieldTablePage />} />
      </Routes>
    </Router>
  );
}
