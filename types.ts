
/// <reference types="vite/client" />

export interface PaymentOption {
  id: string;
  label: string;
  months: number;
  monthlyPayment: number;
  totalAmount?: number;
  isCash?: boolean;
}

export type ClientStatus = 'LEAD' | 'PRESENTATION' | 'SALE' | 'NO SALE' | 'LOST' | 'CONTACTED' | 'SCHEDULED' | 'INSTALLED' | 'MAINTENANCE' | 'ACTIVE' | 'QUALIFIED';

export interface ClientObservation {
  id?: string;
  date: string;
  text: string;
  author: string;
  type?: 'STATUS_CHANGE' | 'NOTE';
}

export interface Referral {
  id: string;
  name: string;
  phone: string;
  status: 'PENDING' | 'CONTACTED' | 'SOLD';
  address?: string;
  appointmentDate?: string;
}

export interface ClientData {
  id: string;
  name: string;
  spouseName?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode: string;
  peopleCount?: number;
  waterConsumption?: number;
  cleaningConsumption?: number;
  lang: 'pt' | 'en' | 'es';
  status: ClientStatus;
  observations: ClientObservation[];
  installationDate?: string;
  nextWaterAnalysis?: string;
  saltReminder?: boolean;
  referrals: Referral[];
  analyst: string;
  creditScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseData {
  bottledWater: number;
  cleaningProducts: number;
}

export interface Task {
  id: string;
  client_id: string;
  analyst_id: string;
  title: string;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  type: 'CALL' | 'MESSAGE' | 'EMAIL' | 'VISIT';
  scheduled_for: string;
  ai_draft?: string;
  created_at: string;
  updated_at?: string;
}

