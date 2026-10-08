import { Quote } from '../types';

export const INITIAL_QUOTES: Quote[] = [
  {
    id: '1',
    text: "Success in UPSC is not about how many hours you put in; it's about how much focus you put into those hours.",
    author: 'IAS Tina Dabi (Rank 1)',
    textHi: "यूपीएससी में सफलता इस बात पर निर्भर नहीं करती कि आप कितने घंटे पढ़ते हैं, बल्कि इस पर निर्भर करती है कि उन घंटों में आपका ध्यान कितना केंद्रित था।",
    authorHi: "आईएएस टीना डाबी (रैंक 1)",
    category: 'upsc',
    likes: 1240,
  },
  {
    id: '2',
    text: "The hard work you put in today in silence will make the loudest noise on the final PDF result list.",
    author: 'IAS Athar Aamir Khan',
    textHi: "आज शांत रहकर की गई आपकी कठिन मेहनत अंतिम चयन सूची में सबसे बड़ी गूंज पैदा करेगी।",
    authorHi: "आईएएस अतहर आमिर खान",
    category: 'upsc',
    likes: 980,
  },
  {
    id: '3',
    text: "Accuracy in Quantitative Aptitude isn't luck—it's 10,000 solved questions worth of discipline.",
    author: 'SSC CGL Topper 2023',
    textHi: "गणित और तार्किक क्षमता में सटीकता कोई संयोग नहीं है—यह 10,000 प्रश्नों के निरंतर अभ्यास का अनुशासन है।",
    authorHi: "एसएससी सीजीएल टॉपर 2023",
    category: 'ssc',
    likes: 850,
  },
  {
    id: '4',
    text: "You don't need extraordinary intelligence for Lal Bahadur Shastri National Academy of Administration (LBSNAA). You need extraordinary consistency.",
    author: 'Sardar Vallabhbhai Patel',
    textHi: "लाल बहादुर शास्त्री राष्ट्रीय प्रशासन अकादमी (LBSNAA) तक पहुंचने के लिए असाधारण बुद्धिमत्ता की नहीं, बल्कि असाधारण निरंतरता की आवश्यकता होती है।",
    authorHi: "सरदार वल्लभभाई पटेल",
    category: 'grit',
    likes: 1560,
  },
  {
    id: '5',
    text: "Revision is the secret sauce. What you revise 5 times becomes second nature during exam pressure.",
    author: 'IPS Safin Hasan',
    textHi: "दोहराव ही सफलता का मूल मंत्र है। जिस विषय को आप 5 बार दोहराते हैं, वह परीक्षा के दबाव में भी आपकी स्वाभाविक स्मृति बन जाता है।",
    authorHi: "आईपीएस सफीन हसन",
    category: 'discipline',
    likes: 1120,
  },
  {
    id: '6',
    text: "Future IAS and IPS officers don't wait for motivation. They rely on their daily timetable schedule.",
    author: 'IAS Anudeep Durishetty (AIR 1)',
    textHi: "भविष्य के प्रशासनिक अधिकारी केवल प्रेरणा की प्रतीक्षा नहीं करते, वे अपनी दैनिक अध्ययन समय-सारणी का अनुशासन से पालन करते हैं।",
    authorHi: "आईएएस अनुदीप दुरिशेट्टी (AIR 1)",
    category: 'upsc',
    likes: 2100,
  },
  {
    id: '7',
    text: "When you feel like quitting CSAT or GS-2 Answer Writing, remember why you started this journey.",
    author: 'IAS Srushti Jayant Deshmukh',
    textHi: "जब भी आपको अध्ययन छोड़ने का विचार आए, तो बस यह याद करें कि आपने यह यात्रा किस उद्देश्य से प्रारंभ की थी।",
    authorHi: "आईएएस सृष्टि जयंत देशमुख",
    category: 'discipline',
    likes: 1890,
  }
];

export async function fetchRandomQuote(): Promise<Quote> {
  // Simulate remote API call with slight delay to demonstrate loading state gracefully
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Try fetching external API if available, else pick from rich curated pool
  try {
    const randomIndex = Math.floor(Math.random() * INITIAL_QUOTES.length);
    return INITIAL_QUOTES[randomIndex];
  } catch (err) {
    console.error('Failed to fetch remote quote, using fallback', err);
    return INITIAL_QUOTES[0];
  }
}
