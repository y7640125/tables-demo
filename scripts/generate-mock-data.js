import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = [
  { name: "id", label: "מזהה", type: "text" },
  { name: "title", label: "כותרת", type: "text" },
  { name: "firstName", label: "שם פרטי", type: "text" },
  { name: "lastName", label: "שם משפחה", type: "text" },
  { name: "email", label: "אימייל", type: "text" },
  { name: "phone", label: "טלפון", type: "text" },
  { name: "city", label: "עיר", type: "text" },
  { name: "address", label: "כתובת", type: "text" },
  { name: "company", label: "חברה", type: "text" },
  { name: "position", label: "תפקיד", type: "text" },
  { name: "department", label: "מחלקה", type: "text" },
  { name: "employeeId", label: "מספר עובד", type: "text" },
  { name: "createdAt", label: "נוצר בתאריך", type: "date" },
  { name: "updatedAt", label: "עודכן בתאריך", type: "date" },
  { name: "birthDate", label: "תאריך לידה", type: "date" },
  { name: "startDate", label: "תאריך התחלה", type: "date" },
  { name: "endDate", label: "תאריך סיום", type: "date" },
  { name: "dueDate", label: "תאריך יעד", type: "date" },
  { name: "isActive", label: "פעיל", type: "boolean" },
  { name: "isVerified", label: "מאומת", type: "boolean" },
  { name: "isPremium", label: "פרימיום", type: "boolean" },
  { name: "hasAccess", label: "יש גישה", type: "boolean" },
  { name: "isPublished", label: "פורסם", type: "boolean" },
  { name: "description", label: "תיאור", type: "textarea" },
  { name: "notes", label: "הערות", type: "textarea" },
  { name: "comments", label: "תגובות", type: "textarea" },
  { name: "summary", label: "סיכום", type: "textarea" },
  { name: "status", label: "סטטוס", type: "enum", options: ["פתוח", "סגור", "בהמתנה", "בוטל"] },
  { name: "priority", label: "עדיפות", type: "enum", options: ["נמוכה", "בינונית", "גבוהה", "דחופה"] },
  { name: "category", label: "קטגוריה", type: "enum", options: ["כללי", "מכירות", "תמיכה", "פיתוח", "שיווק"] },
  { name: "emptyColumn", label: "עמודה ריקה לבדיקה", type: "text" }
];

const firstNames = ['דוד', 'שרה', 'יוסי', 'מיכל', 'אמיר', 'רחל', 'אלון', 'נועה', 'תומר', 'יעל', 'רונן', 'מיכל', 'עמית', 'ליאור', 'טל', 'אור', 'יובל', 'שירה', 'איתי', 'דנה'];
const lastNames = ['כהן', 'לוי', 'מזרחי', 'דהן', 'בן דוד', 'אברהם', 'ישראלי', 'דוד', 'כץ', 'לוי', 'שלום', 'בר', 'גולן', 'פריד', 'רוזן', 'שטרן', 'גרין', 'בלום', 'וייס', 'כהן'];
const cities = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'פתח תקווה', 'אשדוד', 'נתניה', 'חולון', 'ראשון לציון'];
const companies = ['טכנולוגיות מתקדמות בע״מ', 'פתרונות עסקיים בע״מ', 'תמיכה מקצועית בע״מ', 'שיווק דיגיטלי בע״מ', 'טכנולוגיות עתיד בע״מ', 'מערכות חכמות בע״מ', 'ייעוץ עסקי בע״מ', 'פיתוח תוכנה בע״מ'];
const positions = ['מפתח תוכנה', 'מנהלת מכירות', 'טכנאי תמיכה', 'מנהלת שיווק', 'מהנדס תוכנה', 'מנהל פרויקטים', 'אנליסט נתונים', 'מעצב UX'];
const departments = ['פיתוח', 'מכירות', 'תמיכה', 'שיווק', 'ניהול', 'כספים', 'משאבי אנוש'];
const statuses = ['פתוח', 'סגור', 'בהמתנה', 'בוטל'];
const priorities = ['נמוכה', 'בינונית', 'גבוהה', 'דחופה'];
const categories = ['כללי', 'מכירות', 'תמיכה', 'פיתוח', 'שיווק'];
const titles = ['פרויקט Alpha', 'מכירות Q4', 'תמיכה טכנית', 'קמפיין שיווק', 'פרויקט Beta', 'מערכת ניהול', 'דוח שנתי', 'סקר לקוחות', 'אירוע השקה', 'סמינר הכשרה'];
const descriptions = ['פרויקט פיתוח מערכת ניהול לקוחות חדשה', 'קמפיין מכירות לרבעון הרביעי', 'טיפול בפניות תמיכה טכנית', 'קמפיין שיווק דיגיטלי מקיף', 'פיתוח מוצר חדש עם טכנולוגיות מתקדמות'];
const notes = ['יש לבדוק את ביצועי המערכת', 'יש לתאם פגישות עם לקוחות', 'יש להעביר הדרכה נוספת', 'יש לנתח את ביצועי הקמפיין', 'יש לבדוק את אבטחת המערכת'];
const comments = ['הלקוח מרוצה מהתקדמות', 'הצוות עובד היטב', 'רוב הפניות נפתרות תוך 24 שעות', 'הקמפיין מגיע ליעדי החשיפה', 'הפרויקט מתקדם לאט מהצפוי'];
const summaries = ['פרויקט במצב טוב', 'קמפיין מצליח עם תוצאות', 'ביצועים טובים', 'קמפיין מוצלח', 'פרויקט מאתגר'];

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool() {
  return Math.random() > 0.5;
}

const rows = [];
for (let i = 1; i <= 300; i++) {
  const id = String(i).padStart(3, '0');
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const city = randomItem(cities);
  const company = randomItem(companies);
  const position = randomItem(positions);
  const department = randomItem(departments);
  
  rows.push({
    id,
    title: randomItem(titles) + ' ' + id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `05${Math.floor(Math.random() * 10)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
    city,
    address: `רחוב ${randomItem(['הרצל', 'בן יהודה', 'הנמל', 'ביאליק', 'רגר'])} ${Math.floor(Math.random() * 100) + 1}`,
    company,
    position,
    department,
    employeeId: `EMP-${id}`,
    createdAt: randomDate(new Date('2020-01-01'), new Date('2024-11-06')),
    updatedAt: randomDate(new Date('2023-01-01'), new Date('2024-11-06')),
    birthDate: randomDate(new Date('1970-01-01'), new Date('2000-12-31')),
    startDate: randomDate(new Date('2020-01-01'), new Date('2024-01-01')),
    endDate: randomDate(new Date('2024-12-31'), new Date('2025-12-31')),
    dueDate: randomDate(new Date('2024-11-06'), new Date('2025-12-31')),
    isActive: randomBool(),
    isVerified: randomBool(),
    isPremium: randomBool(),
    hasAccess: randomBool(),
    isPublished: randomBool(),
    description: randomItem(descriptions) + ' עם פרטים נוספים ומידע מפורט על התהליך',
    notes: randomItem(notes) + ' ולבצע בדיקות מקיפות',
    comments: randomItem(comments) + ' ומבקש עדכונים נוספים',
    summary: randomItem(summaries) + ' עם תוצאות מעולות',
    status: randomItem(statuses),
    priority: randomItem(priorities),
    category: randomItem(categories),
    emptyColumn: null
  });
}

const data = { schema, rows };
const outputPath = path.join(__dirname, '..', 'src', 'assets', 'mock-table-data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Generated ${outputPath} with 300 rows`);

