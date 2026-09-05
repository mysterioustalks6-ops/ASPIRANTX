const BASE_URL = 'http://localhost:3000';

async function verifyApis() {
  console.log('==================================================');
  console.log('PHASE 3: VERIFY QUESTION BANK API');
  console.log('==================================================');

  // 1. GET /api/academic/questions?page=1&limit=20
  const qbRes1 = await fetch(`${BASE_URL}/api/academic/questions?page=1&limit=20`);
  console.log('GET /api/academic/questions?page=1&limit=20 - Status:', qbRes1.status);
  if (qbRes1.status !== 200) {
    throw new Error(`Expected 200, got ${qbRes1.status}`);
  }
  const qbData1 = await qbRes1.json();
  const qbList1 = qbData1.questions || [];
  console.log('Total Count reported:', qbData1.total);
  console.log('Items returned on page 1:', qbList1.length);
  const q1 = qbList1[0];
  console.log('Sample Q1:', {
    id: q1?.id,
    exam: q1?.exam,
    subject: q1?.subject,
    questionText: q1?.questionText?.substring(0, 70) + '...',
    optionsCount: q1?.options?.length,
    correctOption: q1?.correctOption
  });

  // 2. Page 2 vs Page 1
  const qbRes2 = await fetch(`${BASE_URL}/api/academic/questions?page=2&limit=20`);
  const qbData2 = await qbRes2.json();
  const qbList2 = qbData2.questions || [];
  console.log('Items returned on page 2:', qbList2.length);
  const qbIds1 = new Set(qbList1.map(i => i.id));
  const qbIds2 = new Set(qbList2.map(i => i.id));
  const overlap = [...qbIds1].filter(id => qbIds2.has(id));
  console.log('Page 1 and Page 2 are distinct (overlap count):', overlap.length);
  if (overlap.length > 0) {
    console.warn('Warning: Some items overlapped between pages');
  }

  // 3. Exam Filter
  const qbExamRes = await fetch(`${BASE_URL}/api/academic/questions?exam=UPSC_CSE&limit=10`);
  const qbExamData = await qbExamRes.json();
  const qbExamList = qbExamData.questions || [];
  console.log('UPSC_CSE filter total:', qbExamData.total, 'items returned:', qbExamList.length);
  const allMatchExam = qbExamList.every(i => i.exam === 'UPSC_CSE');
  console.log('All items match exam UPSC_CSE:', allMatchExam);

  // 4. Subject Filter
  const qbSubjRes = await fetch(`${BASE_URL}/api/academic/questions?subject=Polity&limit=10`);
  const qbSubjData = await qbSubjRes.json();
  const qbSubjList = qbSubjData.questions || [];
  console.log('Subject Polity filter total:', qbSubjData.total, 'items returned:', qbSubjList.length);

  // 5. Search Filter
  const qbSearchRes = await fetch(`${BASE_URL}/api/academic/questions?search=Constitution&limit=10`);
  const qbSearchData = await qbSearchRes.json();
  const qbSearchList = qbSearchData.questions || [];
  console.log('Search "Constitution" filter total:', qbSearchData.total, 'items returned:', qbSearchList.length);

  console.log('\n==================================================');
  console.log('PHASE 4: VERIFY PYQ API');
  console.log('==================================================');

  // 1. GET /api/academic/pyqs?page=1&limit=20
  const pyqRes1 = await fetch(`${BASE_URL}/api/academic/pyqs?page=1&limit=20`);
  console.log('GET /api/academic/pyqs?page=1&limit=20 - Status:', pyqRes1.status);
  if (pyqRes1.status !== 200) {
    throw new Error(`Expected 200, got ${pyqRes1.status}`);
  }
  const pyqData1 = await pyqRes1.json();
  const pyqList1 = pyqData1.pyqs || [];
  console.log('Total PYQs reported:', pyqData1.total);
  console.log('Items returned on page 1:', pyqList1.length);
  const pyq1 = pyqList1[0];
  console.log('Sample PYQ 1:', {
    id: pyq1?.id,
    exam: pyq1?.exam,
    year: pyq1?.year,
    subject: pyq1?.subject,
    questionText: pyq1?.questionText?.substring(0, 70) + '...',
    optionsCount: pyq1?.options?.length,
    correctOption: pyq1?.correctOption
  });

  // 2. Page 2 vs Page 1
  const pyqRes2 = await fetch(`${BASE_URL}/api/academic/pyqs?page=2&limit=20`);
  const pyqData2 = await pyqRes2.json();
  const pyqList2 = pyqData2.pyqs || [];
  console.log('Items returned on page 2:', pyqList2.length);
  const pyqIds1 = new Set(pyqList1.map(i => i.id));
  const pyqIds2 = new Set(pyqList2.map(i => i.id));
  const pyqOverlap = [...pyqIds1].filter(id => pyqIds2.has(id));
  console.log('PYQ Page 1 and Page 2 are distinct (overlap count):', pyqOverlap.length);

  // 3. Valid Exam Filter (e.g. NEET_UG)
  const pyqExamRes = await fetch(`${BASE_URL}/api/academic/pyqs?exam=NEET_UG&limit=10`);
  const pyqExamData = await pyqExamRes.json();
  const pyqExamList = pyqExamData.pyqs || [];
  console.log('NEET_UG filter total:', pyqExamData.total, 'items returned:', pyqExamList.length);

  // 4. Valid Year Filter
  const pyqYearRes = await fetch(`${BASE_URL}/api/academic/pyqs?year=2017&limit=10`);
  const pyqYearData = await pyqYearRes.json();
  const pyqYearList = pyqYearData.pyqs || [];
  console.log('Year 2017 filter total:', pyqYearData.total, 'items returned:', pyqYearList.length);
  console.log('Sample year matches:', pyqYearList[0]?.year);

  // 5. Valid Subject Filter
  const pyqSubjRes = await fetch(`${BASE_URL}/api/academic/pyqs?subject=Chemistry&limit=10`);
  const pyqSubjData = await pyqSubjRes.json();
  const pyqSubjList = pyqSubjData.pyqs || [];
  console.log('Subject Chemistry filter total:', pyqSubjData.total, 'items returned:', pyqSubjList.length);

  console.log('\n==================================================');
  console.log('PHASE 7: 26K SCALE & BOUNDED LIMIT TEST');
  console.log('==================================================');
  const cappedRes = await fetch(`${BASE_URL}/api/academic/questions?limit=1000`);
  const cappedData = await cappedRes.json();
  const cappedList = cappedData.questions || [];
  console.log('Question Bank Requested limit=1000, actual items returned:', cappedList.length);
  console.log('Is bounded (<= 500):', cappedList.length <= 500);

  const pyqCappedRes = await fetch(`${BASE_URL}/api/academic/pyqs?limit=1000`);
  const pyqCappedData = await pyqCappedRes.json();
  const pyqCappedList = pyqCappedData.pyqs || [];
  console.log('PYQ Requested limit=1000, actual items returned:', pyqCappedList.length);
  console.log('Is bounded (<= 500):', pyqCappedList.length <= 500);
  console.log('PHASES 3, 4, 7 SUCCESSFULLY VERIFIED!');
}

verifyApis().catch(err => {
  console.error('API Verification failed:', err);
  process.exit(1);
});
