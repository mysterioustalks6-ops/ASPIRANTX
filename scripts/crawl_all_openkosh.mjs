import fs from 'fs';

const exams = JSON.parse(fs.readFileSync('src/data/openkoshExams.json', 'utf8'));

// Map exam slug or title to our canonical examId in EXAM_LIST
const EXAM_SLUG_TO_ID = {
  'upsc-cse': 'UPSC_CSE',
  'ssc-cgl': 'SSC_CGL',
  'chsl': 'SSC_CHSL',
  'mts': 'SSC_MTS',
  'gd-constable': 'SSC_GD',
  'capf': 'UPSC_CAPF',
  'uppsc': 'UPPSC_PCS',
  'wbcs': 'WBCS',
  'bpsc': 'BPSC_PCS',
  'rrb-ntpc': 'RRB_NTPC',
  'rrb-je': 'RRB_JE',
  'ibps-po': 'IBPS_PO',
  'sbi-po': 'SBI_PO',
  'ibps-clerk': 'IBPS_CLERK',
  'nda': 'NDA_NA',
  'cds': 'CDS',
  'ctet': 'CTET',
  'ugc-net': 'UGC_NET',
  'jenpas-ug': 'JENPAS_UG',
  'jepbn': 'JEPBN',
  'anm-gnm': 'ANM_GNM',
  'smfwbee': 'SMFWBEE',
  'wbpsc-food-si': 'WBPSC_FOOD_SI',
  'jelet': 'JELET',
  'jexpo-voclet': 'JEXPO_VOCLET',
  'up-cnet': 'UP_CNET',
  'upget': 'UP_GET',
  'jeecup': 'JEECUP',
  'upsssc-xray-technician': 'UPSSSC_XRAY_TECHNICIAN',
  'upsssc-lab-technician': 'UPSSSC_LAB_TECHNICIAN',
  'bihar-dcece-pm': 'BIHAR_DCECE_PM',
  'bihar-bcece': 'BIHAR_BCECE',
  'mp-pat': 'MP_PAT',
  'mp-pnst': 'MP_PNST',
  'ruhs-bsc-nursing': 'RUHS_BSC_NURSING',
  'rajasthan-jet': 'RAJASTHAN_JET',
  'up-police-constable': 'UP_POLICE_CONSTABLE',
  'up-police-si': 'UP_POLICE_SI',
  'bihar-police-constable': 'BIHAR_POLICE_CONSTABLE',
  'bihar-police-si': 'BIHAR_POLICE_SI',
  'wbp-constable': 'WBP_CONSTABLE',
  'kp-constable': 'KP_CONSTABLE',
  'mp-police-constable': 'MP_POLICE_CONSTABLE',
  'rajasthan-police-constable': 'RAJASTHAN_POLICE_CONSTABLE',
  'imu-cet': 'IMU_CET'
};

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function fetchExamDetail(exam) {
  const slug = exam.link.replace(/\/syllabus\//g, '').replace(/\//g, '');
  const url = `https://openkosh.in${exam.link}`;
  console.log(`Fetching [${exam.title}] from ${url}...`);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Extract Conducted by
    const conductedMatch = html.match(/Conducted by<\/p>\s*<p class="mt-2 font-semibold text-foreground">([^<]+)<\/p>/);
    const conductedBy = conductedMatch ? cleanText(conductedMatch[1]) : '';

    // Extract Eligibility
    const eligMatch = html.match(/Eligibility<\/p>\s*<p class="mt-2 font-semibold text-foreground">([^<]+)<\/p>/);
    const eligibility = eligMatch ? cleanText(eligMatch[1]) : '';

    // Extract Age limit
    const ageMatch = html.match(/Age limit<\/p>\s*<p class="mt-2 font-semibold text-foreground">([^<]+)<\/p>/);
    const ageLimit = ageMatch ? cleanText(ageMatch[1]) : '';

    // Extract Pattern
    const patternMatch = html.match(/Pattern<\/p>\s*<p class="mt-2 font-semibold text-foreground">([^<]+)<\/p>/);
    const pattern = patternMatch ? cleanText(patternMatch[1]) : '';

    // Extract Overview paragraph
    const overviewMatch = html.match(/<p class="mb-8 border-l-4 border-primary pl-4 text-base leading-relaxed text-muted-foreground">([\s\S]*?)<\/p>/);
    const overview = overviewMatch ? cleanText(overviewMatch[1]) : '';

    // Extract total topics count from badge
    const topicsCountMatch = html.match(/<strong class="text-white">(\d+)<\/strong>\s*trackable topics/);
    const totalTopicsCount = topicsCountMatch ? parseInt(topicsCountMatch[1], 10) : 0;

    // Extract difficulty badge
    const diffMatch = html.match(/<strong class="text-white">([^<]+)<\/strong>\s*difficulty/);
    const difficulty = diffMatch ? cleanText(diffMatch[1]) : 'Medium';

    // Extract Reference Books
    const books = [];
    const booksTableMatch = html.match(/<tbody class="divide-y divide-border">([\s\S]*?)<\/tbody>/);
    if (booksTableMatch) {
      const rowRegex = /<tr>\s*<td class="[^"]*text-muted-foreground">([^<]+)<\/td>\s*<td class="[^"]*font-semibold text-foreground">([^<]+)<\/td>\s*<td class="[^"]*text-muted-foreground">([^<]+)<\/td>\s*<\/tr>/g;
      let rMatch;
      while ((rMatch = rowRegex.exec(booksTableMatch[1])) !== null) {
        books.push({
          subject: cleanText(rMatch[1]),
          book: cleanText(rMatch[2]),
          author: cleanText(rMatch[3])
        });
      }
    }

    // Extract Detailed Topic Sections
    // Sections are in <details ...> ... </details>
    const sections = [];
    const detailsRegex = /<details[^>]*>([\s\S]*?)<\/details>/g;
    let dMatch;

    while ((dMatch = detailsRegex.exec(html)) !== null) {
      const detailHtml = dMatch[1];
      const summaryMatch = detailHtml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
      const sectionTitle = summaryMatch ? cleanText(summaryMatch[1].replace(/<span[^>]*>[\s\S]*?<\/span>/, '')) : 'General Section';
      const sectionDescMatch = detailHtml.match(/<p class="mb-5 text-sm italic[^>]*>([^<]+)<\/p>/);
      const sectionDesc = sectionDescMatch ? cleanText(sectionDescMatch[1]) : '';

      // Inside each section, there are <section> blocks for subjects
      const subjects = [];
      const subSectionRegex = /<section>([\s\S]*?)<\/section>/g;
      let sMatch;

      while ((sMatch = subSectionRegex.exec(detailHtml)) !== null) {
        const subHtml = sMatch[1];
        const subTitleMatch = subHtml.match(/<h3 class="font-semibold text-foreground">([^<]+)<\/h3>/);
        const marksMatch = subHtml.match(/<span class="rounded-full bg-primary\/10[^"]*">([^<]+)<\/span>/);
        const qMatch = subHtml.match(/<span class="rounded-full bg-muted[^"]*">([^<]+)<\/span>/);

        const subjectTitle = subTitleMatch ? cleanText(subTitleMatch[1]) : 'Subject';
        const marks = marksMatch ? cleanText(marksMatch[1]) : '';
        const questions = qMatch ? cleanText(qMatch[1]) : '';

        // Extract topics inside this subject
        const topicRegex = /<input type="checkbox" data-topic-id="([^"]+)"[^>]*>\s*<span>([^<]+)<\/span>/g;
        let tMatch;
        const topicList = [];

        while ((tMatch = topicRegex.exec(subHtml)) !== null) {
          topicList.push({
            id: tMatch[1],
            name: cleanText(tMatch[2])
          });
        }

        if (topicList.length > 0) {
          subjects.push({
            title: subjectTitle,
            marks,
            questions,
            topics: topicList
          });
        }
      }

      if (subjects.length > 0) {
        sections.push({
          title: sectionTitle,
          description: sectionDesc,
          subjects
        });
      }
    }

    return {
      examId: EXAM_SLUG_TO_ID[slug] || exam.title.toUpperCase().replace(/[-\s]/g, '_'),
      slug,
      title: exam.title,
      fullName: exam.fullName,
      location: exam.location,
      category: exam.category,
      conductedBy,
      eligibility,
      ageLimit,
      pattern,
      overview,
      difficulty,
      totalTopicsCount,
      books,
      sections
    };
  } catch (err) {
    console.error(`Failed to crawl ${exam.title}:`, err.message);
    return null;
  }
}

async function run() {
  const results = {};
  console.log(`Starting crawl for ${exams.length} exams...`);

  // Batch in chunks of 5 for speed and politeness
  for (let i = 0; i < exams.length; i += 5) {
    const chunk = exams.slice(i, i + 5);
    const chunkResults = await Promise.all(chunk.map(fetchExamDetail));
    for (const r of chunkResults) {
      if (r) {
        results[r.examId] = r;
      }
    }
  }

  const keys = Object.keys(results);
  console.log(`Successfully parsed ${keys.length} detailed syllabuses!`);
  fs.writeFileSync('src/data/openkoshDetailedSyllabus.json', JSON.stringify(results, null, 2));
}

run();
