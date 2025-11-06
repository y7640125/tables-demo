import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home/Home";
import TanStackTable from "./components/tables/TanStackTable/TanStackTable";
import AgGridTable from "./components/tables/AgGridTable/AgGridTable";
import ReactDataGridTable from "./components/tables/ReactDataGridTable/ReactDataGridTable";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tanstack" element={<TanStackTable />} />
        <Route path="/ag-grid" element={<AgGridTable />} />
        <Route path="/rdg" element={<ReactDataGridTable />} />
      </Routes>
    </Router>
  );
}
