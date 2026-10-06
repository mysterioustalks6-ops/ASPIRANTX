import { convertOpenKoshToSyllabusNodes, getOpenKoshDetailed } from '../src/data/openkoshData.ts';
import { getExamConfig } from '../src/lib/examRegistry.ts';
import { INITIAL_SYLLABUS_HIERARCHY } from '../src/data/academicData.ts';

console.log('--- EXAM REGISTRY NEET_UG ---');
const config = getExamConfig('NEET_UG');
console.log('Subjects in examRegistry:', Object.keys(config?.syllabusTree || {}));
let totalExamRegTopics = 0;
Object.entries(config?.syllabusTree || {}).forEach(([s, data]) => {
  console.log(`  ${s}: ${(data.topics || []).length} topics`);
  totalExamRegTopics += (data.topics || []).length;
});
console.log('Total examRegistry topics:', totalExamRegTopics);

console.log('\n--- OPENKOSH NEET_UG ---');
const openkoshNodes = convertOpenKoshToSyllabusNodes('NEET_UG');
console.log('openkoshNodes count:', openkoshNodes.length);
const openkoshDetailed = getOpenKoshDetailed('NEET_UG');
console.log('openkoshDetailed found?', !!openkoshDetailed);
if (openkoshDetailed) {
  console.log('openkosh sections:', openkoshDetailed.sections?.length);
  openkoshDetailed.sections?.forEach(sec => {
    console.log(`  Section: ${sec.title}, subjects: ${sec.subjects?.length}`);
    sec.subjects?.forEach(subj => {
      console.log(`    Subj: ${subj.title}, topics: ${subj.topics?.length}`);
    });
  });
}

console.log('\n--- INITIAL_SYLLABUS_HIERARCHY NEET ---');
const initNeet = INITIAL_SYLLABUS_HIERARCHY.filter(n => (n.exam || '').toLowerCase().includes('neet'));
console.log('INITIAL_SYLLABUS_HIERARCHY NEET count:', initNeet.length);
