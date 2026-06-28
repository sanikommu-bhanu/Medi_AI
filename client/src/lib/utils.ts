import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, format = 'long'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (format === 'medium') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (format === 'time') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (format === 'datetime') {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString();
}

export function getRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date, 'short');
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const generateICS = (appointment: any) => {
  const start = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const end = new Date(start.getTime() + (appointment.duration_minutes || 30) * 60000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CareBot//Health App//EN
BEGIN:VEVENT
UID:${appointment.id}@carebot.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:Appointment with ${appointment.doctor_name}
DESCRIPTION:${appointment.notes || ''}
LOCATION:${appointment.location || ''}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `appointment-${appointment.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function getHealthStatus(value: number, type: string): { status: string; color: string } {
  const ranges: Record<string, { low: number; high: number }> = {
    heart_rate: { low: 60, high: 100 },
    blood_sugar: { low: 70, high: 140 },
    temperature: { low: 97, high: 99.5 },
    oxygen: { low: 95, high: 100 },
  };
  
  const range = ranges[type];
  if (!range) return { status: 'Normal', color: 'green' };
  
  if (value < range.low) return { status: 'Low', color: 'amber' };
  if (value > range.high) return { status: 'High', color: 'red' };
  return { status: 'Normal', color: 'green' };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
export const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Pulmonology', 'Urology', 'Other'
];

export const NOTIFICATION_ICONS: Record<string, string> = {
  appointment: '📅',
  medication: '💊',
  report: '📋',
  health: '❤️',
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
};

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
