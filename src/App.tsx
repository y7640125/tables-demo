import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import styles from "./App.module.css";

function Home() {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <h1 className={styles.header}>בחירת טבלה</h1>
      <div className={styles.buttons}>
        <button onClick={() => navigate("/tanstack")}>טבלת TanStack</button>
        <button onClick={() => navigate("/ag-grid")}>טבלת AG Grid</button>
        <button onClick={() => navigate("/rdg")}>טבלת React Data Grid</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tanstack" element={<div style={{color:"var(--text-color)", padding:24}}>TanStack Table</div>} />
        <Route path="/ag-grid" element={<div style={{color:"var(--text-color)", padding:24}}>AG Grid Table</div>} />
        <Route path="/rdg" element={<div style={{color:"var(--text-color)", padding:24}}>React Data Grid</div>} />
      </Routes>
    </Router>
  );
}
