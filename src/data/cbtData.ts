import { CbtTest, CommunityGroup, CommunityPost, AppNotification } from '../types';

export const INITIAL_CBT_TESTS: CbtTest[] = [
  {
    id: 'upsc_cbt_mock_01',
    title: 'UPSC CSE Prelims All India Grand Mock Test 2026 (GS Paper 1)',
    exam: 'UPSC_CSE',
    durationMinutes: 120,
    totalMarks: 200,
    sections: [
      { name: 'General Studies Paper 1', durationMinutes: 120, totalQuestions: 5 }
    ],
    markingScheme: { correct: 2.0, incorrect: 0.66 },
    questions: [
      {
        id: 'q_cbt_1',
        type: 'mcq',
        section: 'General Studies Paper 1',
        questionText: 'With reference to the Constitution of India, consider the following statements regarding the Preamble:\n1. The Preamble is a part of the Constitution and can be amended under Article 368.\n2. The Preamble is a source of power to the legislature and also a prohibition upon the powers of the legislature.\n3. In the Kesavananda Bharati case (1973), the Supreme Court held that the Preamble is an integral part of the Constitution.\n\nWhich of the statements given above are correct?',
        options: [
          '1 and 2 only',
          '1 and 3 only',
          '2 and 3 only',
          '1, 2 and 3'
        ],
        correctOption: 1,
        language: 'English',
        subject: 'Indian Polity & Governance',
        topic: 'Preamble & Fundamental Rights',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Statement 1 is correct: Preamble is amendable under Art 368 without altering basic structure. Statement 2 is INCORRECT: Preamble is NEITHER a source of power nor a limitation on power. Statement 3 is correct: Kesavananda Bharati case affirmed Preamble as part of Constitution.'
      },
      {
        id: 'q_cbt_2',
        type: 'passage',
        section: 'General Studies Paper 1',
        passageText: 'PASSAGE: The Monetary Policy Committee (MPC) constituted under Section 45ZB of the Reserve Bank of India Act, 1934 determines the policy repo rate required to achieve the inflation target. The framework aims at maintaining price stability while keeping in mind the objective of growth.',
        questionText: 'Based on the passage and macroeconomic principles, consider the following statements regarding the Monetary Policy Committee (MPC):\n1. The MPC consists of six members, including three from RBI and three appointed by the Central Government.\n2. The Governor of the RBI acts as the ex-officio Chairperson of the MPC and possesses a casting vote in case of a tie.\n\nWhich of the above statements is/are correct?',
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        correctOption: 2,
        language: 'English',
        subject: 'Indian Economy',
        topic: 'Monetary Policy & RBI',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both 1 and 2 are correct. MPC has 6 members and RBI Governor has casting vote.'
      },
      {
        id: 'q_cbt_3',
        type: 'assertion_reason',
        section: 'General Studies Paper 1',
        assertionText: 'Assertion (A): The Western Ghats in India are recognized as one of the world\'s eight "hottest hotspots" of biological diversity.',
        reasonText: 'Reason (R): The Western Ghats display exceptional levels of species endemism due to geographical isolation and microclimatic variations.',
        questionText: 'Select the correct answer using the options given below:',
        options: [
          'Both (A) and (R) are true, and (R) is the correct explanation of (A).',
          'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A).',
          '(A) is true, but (R) is false.',
          '(A) is false, but (R) is true.'
        ],
        correctOption: 0,
        language: 'English',
        subject: 'Environment & Ecology',
        topic: 'Biodiversity Hotspots',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both Assertion and Reason are true and Reason correctly explains why Western Ghats is a biodiversity hotspot.'
      },
      {
        id: 'q_cbt_4',
        type: 'mcq',
        section: 'General Studies Paper 1',
        questionText: 'Consider the following statements regarding the Indian Ocean Dipole (IOD):\n1. A positive IOD characteristically brings cooler ocean waters in the eastern Indian Ocean and warmer waters in the western Indian Ocean.\n2. A positive IOD is generally associated with good rainfall over the Indian subcontinent during the monsoon season.\n\nWhich of the statements given above is/are correct?',
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        correctOption: 2,
        language: 'English',
        subject: 'Geography',
        topic: 'Monsoon & Climate Dynamics',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both statements are correct. Positive IOD favors Indian Summer Monsoon.'
      },
      {
        id: 'q_cbt_5',
        type: 'paragraph',
        section: 'General Studies Paper 1',
        questionText: 'The ancient Harappan Civilization possessed advanced urban planning. Which among the following sites is famous for its unique water harvesting and reservoir system surrounded by stone masonry fortifications?',
        options: [
          'Lothal',
          'Dholavira',
          'Kalibangan',
          'Rakhigarhi'
        ],
        correctOption: 1,
        language: 'English',
        subject: 'History',
        topic: 'Indus Valley Civilization',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Dholavira in Rann of Kutch, Gujarat is world-famous for its elaborate water management system with rock-cut reservoirs.'
      }
    ]
  },
  {
    id: 'ssc_cgl_cbt_mock_01',
    title: 'SSC CGL Tier-1 All India Speed Test Series 2026',
    exam: 'SSC_CGL',
    durationMinutes: 60,
    totalMarks: 200,
    sections: [
      { name: 'General Intelligence & Reasoning', durationMinutes: 15, totalQuestions: 2 },
      { name: 'General Awareness', durationMinutes: 15, totalQuestions: 2 },
      { name: 'Quantitative Aptitude', durationMinutes: 15, totalQuestions: 2 }
    ],
    markingScheme: { correct: 2.0, incorrect: 0.5 },
    questions: [
      {
        id: 'q_ssc_1',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'Select the missing number in the following series:\n12, 23, 45, 89, 177, ?',
        options: ['353', '355', '351', '349'],
        correctOption: 0,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Number Series',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Pattern: (12 * 2) - 1 = 23; (23 * 2) - 1 = 45; (45 * 2) - 1 = 89; (89 * 2) - 1 = 177; (177 * 2) - 1 = 353.'
      },
      {
        id: 'q_ssc_2',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'If "POLITY" is coded as "QNKNUX", how is "RIGHTS" coded in that language?',
        options: ['SJHITR', 'SHFISR', 'SHGIST', 'SJGIUR'],
        correctOption: 3,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Coding Decoding',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Pattern alternates +1, -1, +1, -1 for adjacent letters.'
      },
      {
        id: 'q_ssc_3',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Who among the following was the founder of the Brahmo Samaj in 1828?',
        options: ['Swami Dayananda Saraswati', 'Raja Ram Mohan Roy', 'Ishwar Chandra Vidyasagar', 'Swami Vivekananda'],
        correctOption: 1,
        language: 'English',
        subject: 'History',
        topic: 'Socio-Religious Movements',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Raja Ram Mohan Roy founded Brahmo Sabha in 1828, later renamed Brahmo Samaj.'
      },
      {
        id: 'q_ssc_4',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Which organ in the human body produces bile juice stored in the gallbladder?',
        options: ['Pancreas', 'Liver', 'Kidney', 'Stomach'],
        correctOption: 1,
        language: 'English',
        subject: 'General Science',
        topic: 'Human Anatomy',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Bile is synthesized by the liver and stored in the gallbladder.'
      },
      {
        id: 'q_ssc_5',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'A train 240 m long passes a telegraph post in 12 seconds. What is the speed of the train in km/h?',
        options: ['72 km/h', '60 km/h', '80 km/h', '54 km/h'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Speed, Time & Distance',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Speed = Distance / Time = 240 / 12 = 20 m/s. Convert to km/h: 20 * (18/5) = 72 km/h.'
      },
      {
        id: 'q_ssc_6',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'If the simple interest on a sum of money at 8% per annum for 3 years is Rs. 1,200, find the principal sum.',
        options: ['Rs. 5,000', 'Rs. 4,500', 'Rs. 6,000', 'Rs. 5,500'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Simple Interest',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Principal P = (SI * 100) / (R * T) = (1200 * 100) / (8 * 3) = 120000 / 24 = Rs. 5,000.'
      }
    ]
  },
  {
    id: 'rrb_ntpc_cbt_mock_01',
    title: 'RRB NTPC Stage-1 (CBT-1) All India Grand Speed Test 2026',
    exam: 'RRB_NTPC',
    durationMinutes: 90,
    totalMarks: 100,
    sections: [
      { name: 'General Awareness', durationMinutes: 30, totalQuestions: 3 },
      { name: 'Mathematics', durationMinutes: 30, totalQuestions: 2 },
      { name: 'General Intelligence & Reasoning', durationMinutes: 30, totalQuestions: 2 }
    ],
    markingScheme: { correct: 1.0, incorrect: 0.33 },
    questions: [
      {
        id: 'q_rrb_1',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Where is the headquarters of the Indian Railway National Academy (NAIR) situated?',
        options: ['Vadodara, Gujarat', 'New Delhi', 'Kharagpur, West Bengal', 'Secunderabad, Telangana'],
        correctOption: 0,
        language: 'English',
        subject: 'General Awareness',
        topic: 'Indian Railways & Static GK',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'National Academy of Indian Railways (NAIR) is located at Vadodara, Gujarat in the Pratap Vilas Palace.'
      },
      {
        id: 'q_rrb_2',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Which planet in the solar system has the highest density?',
        options: ['Earth', 'Jupiter', 'Saturn', 'Mercury'],
        correctOption: 0,
        language: 'English',
        subject: 'General Science',
        topic: 'Solar System & Astronomy',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Earth is the densest planet in the solar system with an average density of approx 5.51 g/cm³.'
      },
      {
        id: 'q_rrb_3',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Which Article of the Indian Constitution provides for the establishment of the Finance Commission?',
        options: ['Article 280', 'Article 324', 'Article 356', 'Article 370'],
        correctOption: 0,
        language: 'English',
        subject: 'Indian Polity',
        topic: 'Constitutional Bodies',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Article 280 deals with the Finance Commission of India, constituted by the President every five years.'
      },
      {
        id: 'q_rrb_4',
        type: 'numerical',
        section: 'Mathematics',
        questionText: 'If the radius of a sphere is increased by 20%, what is the percentage increase in its surface area?',
        options: ['44%', '40%', '20%', '48%'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Mensuration & Geometry',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Surface Area proportional to r^2. Percentage change = 20 + 20 + (20*20)/100 = 40 + 4 = 44%.'
      },
      {
        id: 'q_rrb_5',
        type: 'numerical',
        section: 'Mathematics',
        questionText: 'The average of five consecutive odd numbers is 61. What is the difference between the highest and lowest numbers?',
        options: ['8', '10', '12', '6'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Averages',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Numbers are: 57, 59, 61, 63, 65. Difference between highest (65) and lowest (57) = 65 - 57 = 8.'
      },
      {
        id: 'q_rrb_6',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'In a certain code, "TRAIN" is written as "WUDLQ". How is "METRO" written in that code?',
        options: ['PHWUR', 'PGVUR', 'QHWUR', 'PGWUR'],
        correctOption: 0,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Coding Decoding',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Each letter is shifted +3. M(+3)=P, E(+3)=H, T(+3)=W, R(+3)=U, O(+3)=R -> PHWUR.'
      },
      {
        id: 'q_rrb_7',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather\'s only son." How is the girl related to Rohit?',
        options: ['Sister', 'Mother', 'Cousin', 'Aunt'],
        correctOption: 0,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Blood Relations',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Grandfather\'s only son = Rohit\'s father. Daughter of Rohit\'s father = Rohit\'s sister.'
      }
    ]
  },
  {
    id: 'ibps_po_cbt_mock_01',
    title: 'IBPS PO / SBI PO Prelims All India Speed Mock Test 2026',
    exam: 'IBPS_PO',
    durationMinutes: 60,
    totalMarks: 100,
    sections: [
      { name: 'Quantitative Aptitude', durationMinutes: 20, totalQuestions: 3 },
      { name: 'Reasoning Ability', durationMinutes: 20, totalQuestions: 1 },
      { name: 'English Language', durationMinutes: 20, totalQuestions: 1 }
    ],
    markingScheme: { correct: 1.0, incorrect: 0.25 },
    questions: [
      {
        id: 'q_ibps_1',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'A vessel contains 80 liters of milk and water in the ratio 7 : 3. How much water must be added to make the ratio 2 : 1?',
        options: ['4 liters', '6 liters', '8 liters', '5 liters'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Mixtures & Alligations',
        marks: 1.0,
        negativeMarks: 0.25,
        explanation: 'Milk = (7/10)*80 = 56 L, Water = 24 L. Let added water be x. 56 / (24+x) = 2/1 => 24 + x = 28 => x = 4 liters.'
      },
      {
        id: 'q_ibps_2',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'A and B together can complete a piece of work in 12 days, while B alone can finish it in 30 days. In how many days can A alone finish the work?',
        options: ['20 days', '25 days', '18 days', '15 days'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Time & Work',
        marks: 1.0,
        negativeMarks: 0.25,
        explanation: '1/A = 1/12 - 1/30 = (5 - 2)/60 = 3/60 = 1/20. A alone can do it in 20 days.'
      },
      {
        id: 'q_ibps_3',
        type: 'mcq',
        section: 'Quantitative Aptitude',
        questionText: 'What is the compound interest on Rs. 10,000 at 10% per annum for 2 years, compounded annually?',
        options: ['Rs. 2,100', 'Rs. 2,000', 'Rs. 2,200', 'Rs. 1,900'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Compound Interest',
        marks: 1.0,
        negativeMarks: 0.25,
        explanation: 'Amount = 10000 * (1.1)^2 = 10000 * 1.21 = Rs. 12,100. CI = 12100 - 10000 = Rs. 2,100.'
      },
      {
        id: 'q_ibps_4',
        type: 'mcq',
        section: 'Reasoning Ability',
        questionText: 'Statements:\n1. All Banks are Financial Institutions.\n2. Some Financial Institutions are NBFCs.\n\nConclusions:\nI. Some Banks are NBFCs.\nII. Some Financial Institutions are Banks.',
        options: ['Only Conclusion II follows', 'Only Conclusion I follows', 'Both I and II follow', 'Neither I nor II follows'],
        correctOption: 0,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Syllogism',
        marks: 1.0,
        negativeMarks: 0.25,
        explanation: 'Since All Banks are Financial Institutions, it immediately implies that Some Financial Institutions are Banks (Conclusion II is definitely true).'
      },
      {
        id: 'q_ibps_5',
        type: 'mcq',
        section: 'English Language',
        questionText: 'Choose the word that is most nearly OPPOSITE in meaning to the word "PRAGMATIC":',
        options: ['Idealistic', 'Practical', 'Realistic', 'Sensible'],
        correctOption: 0,
        language: 'English',
        subject: 'English Language',
        topic: 'Antonyms & Vocabulary',
        marks: 1.0,
        negativeMarks: 0.25,
        explanation: 'Pragmatic means practical and dealing with things realistically. Its direct antonym is Idealistic.'
      }
    ]
  },
  {
    id: 'up_police_cbt_mock_01',
    title: 'UP Police Constable & SI All India Super Practice Mock Test 2026',
    exam: 'UP_POLICE_CONSTABLE',
    durationMinutes: 120,
    totalMarks: 300,
    sections: [
      { name: 'General Hindi', durationMinutes: 30, totalQuestions: 2 },
      { name: 'General Knowledge', durationMinutes: 30, totalQuestions: 2 },
      { name: 'Numerical & Mental Ability', durationMinutes: 30, totalQuestions: 1 }
    ],
    markingScheme: { correct: 2.0, incorrect: 0.5 },
    questions: [
      {
        id: 'q_up_1',
        type: 'mcq',
        section: 'General Hindi',
        questionText: '\'सूर्य\' का पर्यायवाची शब्द निम्नलिखित में से कौन-सा नहीं है?',
        options: ['शशांक', 'दिनकर', 'भास्कर', 'रवि'],
        correctOption: 0,
        language: 'Hindi',
        subject: 'General Hindi',
        topic: 'Paryayvachi Shabd',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: '\'शशांक\' चंद्रमा का पर्यायवाची है, जबकि दिनकर, भास्कर और रवि सूर्य के पर्यायवाची शब्द हैं।'
      },
      {
        id: 'q_up_2',
        type: 'mcq',
        section: 'General Hindi',
        questionText: '\'जो सब कुछ जानता हो\' - इस वाक्यांश के लिए एक उपयुक्त शब्द क्या होगा?',
        options: ['सर्वज्ञ', 'अल्पज्ञ', 'विद्वान', 'बहुज्ञ'],
        correctOption: 0,
        language: 'Hindi',
        subject: 'General Hindi',
        topic: 'Anek Shabdon Ke Liye Ek Shabd',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: '\'जो सब कुछ जानता हो\' उसे \'सर्वज्ञ\' कहा जाता है।'
      },
      {
        id: 'q_up_3',
        type: 'mcq',
        section: 'General Knowledge',
        questionText: 'उत्तर प्रदेश में स्थित \'दुधवा राष्ट्रीय उद्यान\' किस जिले में स्थित है?',
        options: ['लखीमपुर खीरी', 'सोनभद्र', 'पीलीभीत', 'वाराणसी'],
        correctOption: 0,
        language: 'Hindi',
        subject: 'UP Special GK',
        topic: 'National Parks of UP',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'दुधवा राष्ट्रीय उद्यान उत्तर प्रदेश के लखीमपुर खीरी जिले में स्थित है। यह प्रदेश का एकमात्र राष्ट्रीय उद्यान है।'
      },
      {
        id: 'q_up_4',
        type: 'mcq',
        section: 'General Knowledge',
        questionText: 'भारतीय संविधान में मौलिक कर्तव्यों (Fundamental Duties) को किस देश के संविधान से लिया गया है?',
        options: ['सोवियत संघ (रूस)', 'अमेरिका', 'आयरलैंड', 'ब्रिटेन'],
        correctOption: 0,
        language: 'Hindi',
        subject: 'Indian Polity',
        topic: 'Sources of Constitution',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'मौलिक कर्तव्यों को 42वें संविधान संशोधन 1976 द्वारा पूर्व सोवियत संघ (USSR) के संविधान से प्रेरित होकर जोड़ा गया था।'
      },
      {
        id: 'q_up_5',
        type: 'numerical',
        section: 'Numerical & Mental Ability',
        questionText: 'एक वस्तु को 10% की हानि पर ₹450 में बेचा गया। 20% का लाभ कमाने के लिए उसे किस मूल्य पर बेचा जाना चाहिए?',
        options: ['₹600', '₹550', '₹650', '₹500'],
        correctOption: 0,
        language: 'Hindi',
        subject: 'Mathematics',
        topic: 'Profit and Loss',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'क्रय मूल्य (CP) = 450 / 0.9 = ₹500। 20% लाभ पर विक्रय मूल्य = 500 * 1.20 = ₹600।'
      }
    ]
  },
  {
    id: 'bpsc_pcs_cbt_mock_01',
    title: 'BPSC Integrated 71st CCE Prelims All India Mock Test 2026',
    exam: 'BPSC_PCS',
    durationMinutes: 120,
    totalMarks: 150,
    sections: [
      { name: 'General Studies & Bihar Special', durationMinutes: 120, totalQuestions: 3 }
    ],
    markingScheme: { correct: 1.0, incorrect: 0.33 },
    questions: [
      {
        id: 'q_bpsc_1',
        type: 'mcq',
        section: 'General Studies & Bihar Special',
        questionText: 'Who led the Revolt of 1857 in Bihar against British rule?',
        options: ['Kunwar Singh', 'Nana Saheb', 'Tatya Tope', 'Maulvi Ahmadullah'],
        correctOption: 0,
        language: 'English',
        subject: 'Bihar History',
        topic: '1857 Revolt in Bihar',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Veer Kunwar Singh of Jagdishpur (Arrah) was the prominent leader of the 1857 revolt in Bihar.'
      },
      {
        id: 'q_bpsc_2',
        type: 'mcq',
        section: 'General Studies & Bihar Special',
        questionText: 'Which district of Bihar records the highest population density as per the latest census data?',
        options: ['Sheohar', 'Patna', 'Darbhanga', 'Vaishali'],
        correctOption: 0,
        language: 'English',
        subject: 'Bihar Geography',
        topic: 'Census & Demographics',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'Sheohar has the highest population density in Bihar (1,880 persons per sq km).'
      },
      {
        id: 'q_bpsc_3',
        type: 'mcq',
        section: 'General Studies & Bihar Special',
        questionText: 'Which river is known as the "Sorrow of Bihar" due to its frequent course-changing and flooding?',
        options: ['Kosi', 'Gandak', 'Son', 'Ghaghara'],
        correctOption: 0,
        language: 'English',
        subject: 'Geography',
        topic: 'Rivers of Bihar',
        marks: 1.0,
        negativeMarks: 0.33,
        explanation: 'River Kosi is known as the Sorrow of Bihar because of extensive flooding and shifting channels.'
      }
    ]
  },
  {
    id: 'neet_ug_cbt_mock_01',
    title: 'NEET (UG) All India Mega Mock Test 2026 (Physics, Chem, Bio)',
    exam: 'NEET_UG',
    durationMinutes: 200,
    totalMarks: 720,
    sections: [
      { name: 'Physics', durationMinutes: 50, totalQuestions: 1 },
      { name: 'Chemistry', durationMinutes: 50, totalQuestions: 1 },
      { name: 'Biology (Botany & Zoology)', durationMinutes: 100, totalQuestions: 1 }
    ],
    markingScheme: { correct: 4.0, incorrect: 1.0 },
    questions: [
      {
        id: 'q_neet_1',
        type: 'numerical',
        section: 'Physics',
        questionText: 'A body of mass 2 kg is moving with a velocity of 10 m/s. Calculate its kinetic energy.',
        options: ['100 Joules', '200 Joules', '50 Joules', '20 Joules'],
        correctOption: 0,
        language: 'English',
        subject: 'Physics',
        topic: 'Work, Energy and Power',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Kinetic Energy = (1/2) * m * v^2 = (1/2) * 2 * (10)^2 = 100 Joules.'
      },
      {
        id: 'q_neet_2',
        type: 'mcq',
        section: 'Chemistry',
        questionText: 'Which of the following noble gases is most abundant in the Earth\'s atmosphere?',
        options: ['Argon', 'Neon', 'Helium', 'Krypton'],
        correctOption: 0,
        language: 'English',
        subject: 'Inorganic Chemistry',
        topic: 'p-Block Elements',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Argon makes up approximately 0.93% of Earth\'s atmosphere by volume, making it the most abundant noble gas.'
      },
      {
        id: 'q_neet_3',
        type: 'mcq',
        section: 'Biology (Botany & Zoology)',
        questionText: 'Which cell organelle is known as the "Powerhouse of the Cell"?',
        options: ['Mitochondria', 'Ribosome', 'Golgi apparatus', 'Lysosome'],
        correctOption: 0,
        language: 'English',
        subject: 'Biology',
        topic: 'Cell Biology',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Mitochondria are sites of cellular aerobic respiration and ATP generation, earning them the title of Powerhouse of the cell.'
      }
    ]
  }
];

export const INITIAL_COMMUNITY_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_upsc_general',
    name: 'UPSC CSE 2026 Rankers Hub',
    description: 'Official community for UPSC Prelims & Mains strategy, PYQ discussions, and answer writing evaluation.',
    category: 'public',
    exam: 'UPSC_CSE',
    memberCount: 14820,
    isJoined: true,
    isPinned: true,
    icon: 'ShieldCheck'
  },
  {
    id: 'grp_polity_masters',
    name: 'Polity & Governance Special Circle',
    description: 'Focused discussions on Laxmikanth, Supreme Court landmark judgements, and Article breakdowns.',
    category: 'subject',
    exam: 'UPSC_CSE',
    memberCount: 8930,
    isJoined: true,
    isPinned: false,
    icon: 'BookOpen'
  },
  {
    id: 'grp_ssc_tier1',
    name: 'SSC CGL 2026 Speed & Accuracy Warriors',
    description: 'Daily Quant shortcuts, Reasoning puzzles, and English grammar quiz challenges.',
    category: 'public',
    exam: 'SSC_CGL',
    memberCount: 12450,
    isJoined: false,
    isPinned: false,
    icon: 'Zap'
  },
  {
    id: 'grp_mains_answer_peer',
    name: 'Mains GS Answer Writing Peer Review Group',
    description: 'Daily 2 GS questions posted at 9 AM. Submit handwritten answers & peer review fellow aspirants.',
    category: 'mentor',
    exam: 'UPSC_CSE',
    memberCount: 4210,
    isJoined: true,
    isPinned: true,
    icon: 'FileText'
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_101',
    groupId: 'grp_upsc_general',
    groupName: 'UPSC CSE 2026 Rankers Hub',
    authorId: 'usr_mentor_01',
    authorName: 'Dr. Vivek Sharma (Ex-IAS Mentor)',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    authorRole: 'Chief Mentor',
    title: 'How to master Article 32 vs Article 226 Writs for Prelims & Mains 2026',
    content: 'Aspirants often confuse Habeas Corpus and Quo-Warranto scope under Article 226 vs Article 32.\n\nKey Takeaways:\n1. Supreme Court can issue writs ONLY for Fundamental Rights (Art 32).\n2. High Courts can issue writs for FRs AND "any other purpose" (Art 226) - making HC writ jurisdiction broader in scope!\n3. Article 32 itself is a Fundamental Right, while Article 226 is discretionary.\n\nReview the attached summary notes PDF below for complete tabular comparison.',
    tags: ['Polity', 'Prelims2026', 'Writs', 'Article32'],
    createdAt: '2 hours ago',
    likesCount: 342,
    repliesCount: 48,
    isLiked: true,
    isBookmarked: true,
    isPinned: true,
    attachments: [
      {
        name: 'Article_32_vs_226_Writ_Jurisdiction_Notes.pdf',
        type: 'pdf',
        url: '#',
        size: '1.2 MB'
      }
    ],
    poll: {
      question: 'Under which Article can a writ be issued for non-fundamental legal rights?',
      options: [
        { id: 'opt_1', text: 'Article 32 only', votes: 12 },
        { id: 'opt_2', text: 'Article 226 only', votes: 184 },
        { id: 'opt_3', text: 'Both Article 32 & 226', votes: 45 },
        { id: 'opt_4', text: 'Article 142 only', votes: 8 }
      ],
      totalVotes: 249,
      userVotedOptionId: 'opt_2'
    }
  },
  {
    id: 'post_102',
    groupId: 'grp_mains_answer_peer',
    groupName: 'Mains GS Answer Writing Peer Review Group',
    authorId: 'usr_topper_23',
    authorName: 'Priya Verma (AIR 48 Aspirant)',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    authorRole: 'Top Contributor',
    title: 'Daily Mains Challenge: "Cooperative Federalism vs Competitive Federalism in India"',
    content: 'Question: "Examine how fiscal devolution via the Finance Commission has shifted the Indian federal dynamic from cooperative federalism towards competitive federalism." (15 Marks, 250 Words)\n\nPlease review my intro & structure diagram below! Open to critical feedback on keywords & way forward.',
    tags: ['GS2', 'Federalism', 'FinanceCommission', 'MainsAnswer'],
    createdAt: '5 hours ago',
    likesCount: 128,
    repliesCount: 19,
    isLiked: false,
    isBookmarked: false,
    isPinned: false
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    userId: 'user_default',
    title: 'Daily Study Target Alert 🎯',
    message: 'You have completed 6.5 hours out of your 10.0 hours study target today! 3.5 hours remaining.',
    type: 'study_reminder',
    read: false,
    createdAt: '10 minutes ago'
  },
  {
    id: 'notif_2',
    userId: 'user_default',
    title: 'New CBT All India Mock Test Released!',
    message: 'UPSC CSE All India Grand Mock Test 2026 (GS Paper 1) is live now. Attempt now to benchmark your national rank.',
    type: 'mock_test',
    read: false,
    createdAt: '1 hour ago',
    actionUrl: 'cbt_exam'
  },
  {
    id: 'notif_3',
    userId: 'user_default',
    title: 'AI Predictor Revision Milestone',
    message: 'Based on your recent study pace, you are 2 days ahead of your syllabus schedule for UPSC 2026!',
    type: 'ai_suggestion',
    read: true,
    createdAt: '1 day ago'
  }
];
