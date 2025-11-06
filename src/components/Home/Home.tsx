import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
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

