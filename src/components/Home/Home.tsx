import { useNavigate } from "react-router-dom";
import { Button } from "../../styles/design-system";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();



  return (
    <div className={styles.container}>
      <h1 className={styles.header}>בחירת טבלה</h1>
      <div className={styles.buttons}>
        <Button onClick={() => navigate("/tanstack-advanced")}>טבלת TanStack</Button>
        <Button onClick={() => navigate("/ag-grid-advanced")}>טבלת AG Grid</Button>
        <Button onClick={() => navigate("/rdg-advanced")}>טבלת React Data Grid</Button>
      </div>

    </div>
  );
}

