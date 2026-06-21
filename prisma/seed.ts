import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const focusAreas = [
  { key: "islamic-sciences", nameEn: "Islamic sciences", nameAr: "العلوم الإسلامية", color: "#0F6E56" },
  { key: "fiqh", nameEn: "Fiqh", nameAr: "الفقه", color: "#1D9E75" },
  { key: "aqeedah", nameEn: "Aqeedah", nameAr: "العقيدة", color: "#185FA5" },
  { key: "sufism-lectures", nameEn: "Sufism lectures", nameAr: "محاضرات التصوف", color: "#534AB7" },
  { key: "investing-trading", nameEn: "Investing and trading", nameAr: "الاستثمار والتداول", color: "#854F0B" },
  { key: "personal-finance", nameEn: "Personal finance", nameAr: "المالية الشخصية", color: "#BA7517" },
  { key: "cfi-courses", nameEn: "CFI courses", nameAr: "دورات CFI", color: "#0C447C" },
  { key: "self-development", nameEn: "Self-development", nameAr: "تطوير الذات", color: "#993C1D" },
  { key: "parenting", nameEn: "Parenting", nameAr: "تربية الأبناء", color: "#993556" },
  { key: "business", nameEn: "Business", nameAr: "الأعمال", color: "#444441" },
];

async function main() {
  console.log("Seeding focus areas...");
  for (let i = 0; i < focusAreas.length; i++) {
    const area = focusAreas[i];
    await prisma.focusArea.upsert({
      where: { key: area.key },
      update: { nameEn: area.nameEn, nameAr: area.nameAr, color: area.color, sortOrder: i },
      create: { ...area, sortOrder: i },
    });
  }
  console.log(`Seeded ${focusAreas.length} focus areas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
