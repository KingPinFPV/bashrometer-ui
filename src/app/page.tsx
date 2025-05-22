// src/app/page.tsx
import Image from "next/image"; // אם תרצה להוסיף לוגו או תמונה בעתיד

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-700 mb-6">
        ברוכים הבאים לבשרומטר 1.0!
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        הכלי שלכם להשוואת מחירי בשר ולמציאת הדילים הטובים ביותר.
      </p>
      {/* כאן נוכל להוסיף בעתיד:
        - תיבת חיפוש
        - קישורים לקטגוריות פופולריות
        - תצוגה של מבצעים אחרונים
      */}
      <div className="mt-10">
        <Image
          src="/next.svg" // דוגמה לתמונה, החלף בלוגו שלך אם יש
          alt="Bashrometer Logo Placeholder"
          width={180}
          height={37}
          priority
          className="mx-auto dark:invert" // dark:invert הופך צבעים במצב כהה
        />
      </div>
    </div>
  );
}