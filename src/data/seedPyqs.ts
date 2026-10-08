import { PyqRecord } from '../types';

export const SEED_OFFLINE_PYQS: Record<string, PyqRecord[]> = {
  JEE_MAIN: [
    {
      id: 'seed_jee_01',
      exam: 'JEE_MAIN',
      year: 2024,
      stage: 'Main Exam',
      paper: 'Paper 1 (B.E./B.Tech)',
      subject: 'Physics',
      topic: 'Kinematics & Motion',
      questionText: 'A particle starts from rest with uniform acceleration. If it covers distance s1 in the first 10 seconds and distance s2 in the next 10 seconds, then the relation between s1 and s2 is:',
      questionTextHi: 'एक कण विरामावस्था से एकसमान त्वरण से चलना प्रारंभ करता है। यदि यह पहले 10 सेकंड में s1 दूरी तथा अगले 10 सेकंड में s2 दूरी तय करता है, तो s1 और s2 के बीच संबंध है:',
      options: ['s2 = s1', 's2 = 2 s1', 's2 = 3 s1', 's2 = 4 s1'],
      optionsHi: ['s2 = s1', 's2 = 2 s1', 's2 = 3 s1', 's2 = 4 s1'],
      correctOption: 2,
      explanation: 'Using s = 1/2 a t^2: In first 10s: s1 = 1/2 a (100) = 50a. In total 20s: s_total = 1/2 a (400) = 200a. Therefore, s2 = s_total - s1 = 200a - 50a = 150a = 3(50a) = 3 s1.',
      explanationHi: 'सूत्र s = 1/2 a t^2 का उपयोग करने पर: पहले 10s में: s1 = 50a. कुल 20s में: s_total = 200a. अतः s2 = 200a - 50a = 150a = 3 s1.',
      difficulty: 'Easy',
      language: 'English'
    },
    {
      id: 'seed_jee_02',
      exam: 'JEE_MAIN',
      year: 2023,
      stage: 'Main Exam',
      paper: 'Paper 1 (B.E./B.Tech)',
      subject: 'Chemistry',
      topic: 'Thermodynamics & Energetics',
      questionText: 'For an ideal gas undergoing an isothermal reversible expansion, which of the following thermodynamic quantities is equal to zero?',
      questionTextHi: 'एक समतापी उत्क्रमणीय प्रसार से गुजरने वाली आदर्श गैस के लिए, निम्नलिखित में से कौन सी ऊष्मागतिकीय राशि शून्य के बराबर होती है?',
      options: ['ΔH', 'ΔS', 'ΔG', 'Work done w'],
      optionsHi: ['ΔH', 'ΔS', 'ΔG', 'किया गया कार्य w'],
      correctOption: 0,
      explanation: 'For an ideal gas, internal energy and enthalpy depend only on temperature. Since temperature is constant (isothermal), ΔU = 0 and ΔH = ΔU + Δ(PV) = 0.',
      explanationHi: 'आदर्श गैस के लिए आंतरिक ऊर्जा और एन्थैल्पी केवल तापमान पर निर्भर करती हैं। स्थिर तापमान (समतापी) पर, ΔU = 0 और ΔH = 0 होता है।',
      difficulty: 'Medium',
      language: 'English'
    }
  ],
  NEET: [
    {
      id: 'seed_neet_01',
      exam: 'NEET',
      year: 2024,
      stage: 'Main Exam',
      paper: 'NEET UG Question Paper',
      subject: 'Biology',
      topic: 'Cell Biology & Genetics',
      questionText: 'Which of the following cell organelles is responsible for the synthesis of lipids and steroidal hormones in animal cells?',
      questionTextHi: 'जंतु कोशिकाओं में लिपिड और स्टेरॉयड हार्मोन के संश्लेषण के लिए निम्नलिखित में से कौन सा कोशिकांग उत्तरदायी है?',
      options: ['Rough Endoplasmic Reticulum', 'Smooth Endoplasmic Reticulum', 'Golgi apparatus', 'Lysosomes'],
      optionsHi: ['खुरदरी अंतःप्रद्रव्यी जालिका (RER)', 'चिकनी अंतःप्रद्रव्यी जालिका (SER)', 'गॉल्जी काय', 'लाइसोसोम'],
      correctOption: 1,
      explanation: 'Smooth Endoplasmic Reticulum (SER) is the major site for the synthesis of lipids. In animal cells, lipid-like steroidal hormones are synthesized in SER.',
      explanationHi: 'चिकनी अंतःप्रद्रव्यी जालिका (SER) लिपिड के संश्लेषण का प्रमुख स्थल है। जंतु कोशिकाओं में स्टेरॉयड हार्मोन SER में संश्लेषित होते हैं।',
      difficulty: 'Easy',
      language: 'English'
    },
    {
      id: 'seed_neet_02',
      exam: 'NEET',
      year: 2023,
      stage: 'Main Exam',
      paper: 'NEET UG Question Paper',
      subject: 'Physics',
      topic: 'Current Electricity & Circuits',
      questionText: 'The resistance of a platinum wire is 2 Ω at 0°C and 2.5 Ω at 100°C. The temperature coefficient of resistance of the platinum wire is:',
      questionTextHi: 'एक प्लेटिनम तार का प्रतिरोध 0°C पर 2 Ω और 100°C पर 2.5 Ω है। प्लेटिनम तार का प्रतिरोध ताप गुणांक है:',
      options: ['0.0025 °C⁻¹', '0.005 °C⁻¹', '0.025 °C⁻¹', '0.05 °C⁻¹'],
      optionsHi: ['0.0025 °C⁻¹', '0.005 °C⁻¹', '0.025 °C⁻¹', '0.05 °C⁻¹'],
      correctOption: 0,
      explanation: 'Using R_T = R_0(1 + α ΔT): 2.5 = 2(1 + α * 100) => 2.5 / 2 = 1.25 = 1 + 100α => 100α = 0.25 => α = 0.0025 °C⁻¹.',
      explanationHi: 'सूत्र R_T = R_0(1 + α ΔT) से: 2.5 = 2(1 + 100α) => 1.25 = 1 + 100α => α = 0.0025 °C⁻¹.',
      difficulty: 'Medium',
      language: 'English'
    }
  ],
  UPSC_CSE: [
    {
      id: 'seed_upsc_01',
      exam: 'UPSC_CSE',
      year: 2024,
      stage: 'Prelims',
      paper: 'General Studies Paper 1',
      subject: 'Indian Polity & Governance',
      topic: 'Preamble & Fundamental Rights',
      questionText: 'Under the Constitution of India, which one of the following is NOT a specific Ground on which the State can impose reasonable restrictions on Freedom of Speech and Expression under Article 19(2)?',
      questionTextHi: 'भारत के संविधान के तहत, अनुच्छेद 19(2) के अंतर्गत वाक् एवं अभिव्यक्ति की स्वतंत्रता पर राज्य द्वारा युक्तियुक्त निर्बंधन लगाने का कौन सा एक विशिष्ट आधार नहीं है?',
      options: ['Sovereignty and integrity of India', 'Public order', 'Security of the State', 'Economic well-being of the Nation'],
      optionsHi: ['भारत की संप्रभुता और अखंडता', 'लोक व्यवस्था', 'राज्य की सुरक्षा', 'राष्ट्र की आर्थिक संपन्नता'],
      correctOption: 3,
      explanation: 'Article 19(2) specifies grounds: sovereignty and integrity of India, security of the State, friendly relations with foreign States, public order, decency or morality, contempt of court, defamation, or incitement to an offence. Economic well-being is not a ground under 19(2).',
      explanationHi: 'अनुच्छेद 19(2) में संप्रभुता, अखंडता, राज्य की सुरक्षा, विदेशी राज्यों के साथ मैत्रीपूर्ण संबंध, लोक व्यवस्था, शिष्टाचार या सदाचार, न्यायालय की अवमानना, मानहानि या अपराध के लिए उकसाना शामिल है। राष्ट्र की आर्थिक संपन्नता इसमें शामिल नहीं है।',
      difficulty: 'Hard',
      language: 'English'
    }
  ]
};

export function getOfflineSeedPyqs(examId: string): PyqRecord[] {
  const norm = (examId || '').toUpperCase().replace(/[\s\-]/g, '_');
  if (norm.includes('JEE')) return SEED_OFFLINE_PYQS.JEE_MAIN;
  if (norm.includes('NEET') || norm.includes('MEDICAL')) return SEED_OFFLINE_PYQS.NEET;
  if (norm.includes('UPSC') || norm.includes('CSE')) return SEED_OFFLINE_PYQS.UPSC_CSE;
  return SEED_OFFLINE_PYQS.JEE_MAIN;
}
