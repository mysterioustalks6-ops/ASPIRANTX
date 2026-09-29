import fs from 'fs';

const content = fs.readFileSync('C:/Users/AMBUJ YADAV/.gemini/antigravity-ide/brain/4fa124b3-01d7-4988-b573-e671f4508f5e/.system_generated/steps/703/content.md', 'utf8');

const regex = /<article data-exam-card data-search="([^"]*)" data-location="([^"]*)" data-category="([^"]*)"[^>]*>([\s\S]*?)<\/article>/g;
let match;
const exams = [];

while ((match = regex.exec(content)) !== null) {
  const [_, search, location, category, inner] = match;
  const titleMatch = inner.match(/<h2 class="[^"]*font-serif[^"]*">([^<]+)<\/h2>/);
  const fullTitleMatch = inner.match(/<p class="mt-1 text-sm text-muted-foreground">([^<]+)<\/p>/);
  const descMatch = inner.match(/<p class="mt-4 text-sm leading-relaxed text-muted-foreground">([^<]+)<\/p>/);
  const linkMatch = inner.match(/<a href="([^"]*)"[^>]*>([^<]+)<\/a>/);
  const tags = [...inner.matchAll(/<span class="rounded-full[^"]*">([^<]+)<\/span>/g)].map(m => m[1].trim());

  exams.push({
    title: titleMatch ? titleMatch[1].trim() : '',
    fullName: fullTitleMatch ? fullTitleMatch[1].trim() : '',
    location: location.trim(),
    category: category.replace(/&amp;/g, '&').trim(),
    description: descMatch ? descMatch[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim() : '',
    searchTerms: search.trim(),
    link: linkMatch ? linkMatch[1].trim() : '',
    tags
  });
}

console.log('Total exams extracted:', exams.length);
fs.writeFileSync('src/data/openkoshExams.json', JSON.stringify(exams, null, 2));
console.log('Sample exam 1:', exams[0]);
console.log('Sample exam 45:', exams[exams.length - 1]);
