const fs = require('fs');
const files = [
  'src/app/api/hunt/progress/route.ts',
  'src/app/api/hunt/qr/resolve/route.ts',
  'src/app/api/hunt/challenge/[id]/answer/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/admin/qrs/route.ts',
  'src/app/api/admin/stats/route.ts',
  'src/app/api/me/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import clientPromise from '@/lib/mongodb';", "import clientPromise, { getDb } from '@/lib/mongodb';");
  
  // Some files have const client = await clientPromise; const db = client.db();
  content = content.replace("const client = await clientPromise;\n    const db = client.db();", "const db = await getDb();");
  content = content.replace("const client = await clientPromise;\n  const db = client.db();", "const db = await getDb();");
  
  // also check if any missed
  if (content.includes('client.db()')) {
    console.log("Missed replacement in", file);
  }
  
  fs.writeFileSync(file, content);
}
console.log("Done");
