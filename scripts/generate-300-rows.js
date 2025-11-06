import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data pools
const firstNames = ["דוד", "שרה", "יוסי", "מיכל", "אמיר", "רותי", "אלון", "יעל", "רן", "נועה", "עמית", "ליאור", "טל", "מור", "אור", "דנה", "רועי", "שירה", "איתי", "תמר"];
const lastNames = ["כהן", "לוי", "מזרחי", "דהן", "בן דוד", "אזולאי", "דוד", "פרידמן", "גולן", "שלום", "בר", "כץ", "רוזן", "שטרן", "וייס"];
const cities = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "רמת גן", "פתח תקווה", "אשדוד", "נתניה"];
const streets = ["רחוב הרצל", "שדרות בן יהודה", "רחוב הנמל", "שדרות רגר", "רחוב ביאליק"];
const companies = ["טכנולוגיות מתקדמות בע״מ", "פתרונות עסקיים בע״מ", "תמיכה מקצועית בע״מ", "שיווק דיגיטלי בע״מ", "טכנולוגיות עתיד בע״מ"];
const positions = ["מפתח תוכנה", "מנהלת מכירות", "טכנאי תמיכה", "מנהלת שיווק", "מהנדס תוכנה"];
const departments = ["פיתוח", "מכירות", "תמיכה", "שיווק", "כללי"];
const titles = ["פרויקט Alpha", "מכירות Q4", "תמיכה טכנית", "קמפיין שיווק", "פרויקט Beta"];
const statuses = ["פתוח", "סגור", "בהמתנה", "בוטל"];
const priorities = ["נמוכה", "בינונית", "גבוהה", "דחופה"];
const categories = ["כללי", "מכירות", "תמיכה", "פיתוח", "שיווק"];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBool() { return Math.random() > 0.5; }
function randomDate(s, e) { return new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime())); }
function formatDate(d) { return d.toISOString().split('T')[0]; }

// Read existing schema
const dataPath = path.join(__dirname, '..', 'src', 'assets', 'mock-table-data.json');
const existing = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Generate 300 rows
const rows = [];
for (let i = 1; i <= 300; i++) {
  const id = String(i).padStart(3, '0');
  const fn = randomItem(firstNames);
  const ln = randomItem(lastNames);
  const createdAt = randomDate(new Date('2023-01-01'), new Date('2024-01-01'));
  const birthDate = randomDate(new Date('1980-01-01'), new Date('2000-12-31'));
  const startDate = randomDate(createdAt, new Date('2024-12-31'));
  const endDate = randomDate(startDate, new Date('2026-12-31'));
  
  rows.push({
    id,
    title: randomItem(titles),
    firstName: fn,
    lastName: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
    phone: `05${Math.floor(Math.random() * 10)}-${Math.floor(1000000 + Math.random() * 9000000)}`,
    city: randomItem(cities),
    address: `${randomItem(streets)} ${Math.floor(Math.random() * 200) + 1}`,
    company: randomItem(companies),
    position: randomItem(positions),
    department: randomItem(departments),
    employeeId: `EMP-${id}`,
    createdAt: formatDate(createdAt),
    updatedAt: formatDate(randomDate(createdAt, new Date('2024-12-31'))),
    birthDate: formatDate(birthDate),
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dueDate: formatDate(randomDate(new Date('2024-01-01'), new Date('2025-12-31'))),
    isActive: randomBool(),
    isVerified: randomBool(),
    isPremium: randomBool(),
    hasAccess: randomBool(),
    isPublished: randomBool(),
    description: "פרויקט פיתוח מערכת ניהול לקוחות חדשה עם ממשק משתמש מתקדם",
    notes: "יש לבדוק את ביצועי המערכת תחת עומס גבוה",
    comments: "הלקוח מרוצה מהתקדמות הפרויקט",
    summary: "פרויקט במצב טוב, עומד בלוחות זמנים",
    status: randomItem(statuses),
    priority: randomItem(priorities),
    category: randomItem(categories)
  });
}

// Write file
fs.writeFileSync(dataPath, JSON.stringify({ schema: existing.schema, rows }, null, 2), 'utf8');
console.log('✅ Generated 300 rows successfully!');
console.log(`📁 File: ${dataPath}`);

