import { TaskItem } from '../types';

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't1',
    title: 'Read Hindu Editorial & Make Notes on Digital Personal Data Protection Act',
    subject: 'Current Affairs',
    priority: 'High',
    completed: true,
    status: 'completed',
    dueDate: 'Today, 10:00 AM',
    estimatedMinutes: 45,
  },
  {
    id: 't2',
    title: 'Solve 25 PYQs on Laxmikanth Indian Polity (Preamble & Parliament)',
    subject: 'Polity',
    priority: 'High',
    completed: false,
    status: 'in_progress',
    dueDate: 'Today, 2:00 PM',
    estimatedMinutes: 60,
  },
  {
    id: 't3',
    title: 'SSC Quant Speed Test: 30 Questions on Time & Work',
    subject: 'Quant',
    priority: 'Medium',
    completed: false,
    status: 'todo',
    dueDate: 'Today, 5:30 PM',
    estimatedMinutes: 30,
  },
  {
    id: 't4',
    title: 'GS-3 Mains Answer Writing: Evaluation of Renewable Energy Goals',
    subject: 'Economy & Env',
    priority: 'Medium',
    completed: false,
    status: 'todo',
    dueDate: 'Tomorrow, 11:00 AM',
    estimatedMinutes: 40,
  }
];
