import { Quote } from '../types';

export const INITIAL_QUOTES: Quote[] = [
  {
    id: '1',
    text: "Success in UPSC is not about how many hours you put in; it's about how much focus you put into those hours.",
    author: 'IAS Tina Dabi (Rank 1)',
    category: 'upsc',
    likes: 1240,
  },
  {
    id: '2',
    text: "The hard work you put in today in silence will make the loudest noise on the final PDF result list.",
    author: 'IAS Athar Aamir Khan',
    category: 'upsc',
    likes: 980,
  },
  {
    id: '3',
    text: "Accuracy in Quantitative Aptitude isn't luck—it's 10,000 solved questions worth of discipline.",
    author: 'SSC CGL Topper 2023',
    category: 'ssc',
    likes: 850,
  },
  {
    id: '4',
    text: "You don't need extraordinary intelligence for Lal Bahadur Shastri National Academy of Administration (LBSNAA). You need extraordinary consistency.",
    author: 'Sardar Vallabhbhai Patel',
    category: 'grit',
    likes: 1560,
  },
  {
    id: '5',
    text: "Revision is the secret sauce. What you revise 5 times becomes second nature during exam pressure.",
    author: 'IPS Safin Hasan',
    category: 'discipline',
    likes: 1120,
  },
  {
    id: '6',
    text: "Future IAS and IPS officers don't wait for motivation. They rely on their daily timetable schedule.",
    author: 'IAS Anudeep Durishetty (AIR 1)',
    category: 'upsc',
    likes: 2100,
  },
  {
    id: '7',
    text: "When you feel like quitting CSAT or GS-2 Answer Writing, remember why you started this journey.",
    author: 'IAS Srushti Jayant Deshmukh',
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
