import { ClientData, ClientStatus, ClientObservation } from '../types';
import { supabase } from '../lib/supabase';

// Helper to transform Supabase data to ClientData
const transformClient = (data: any): ClientData => ({
  ...data,
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  observations: data.observations || [],
  referrals: data.referrals || [],
  // Map snake_case from DB to camelCase if needed, though we try to keep consistent
  spouseName: data.spouse_name || '',
  zipCode: data.zip_code || '',
  city: data.city || '',
  state: data.state || '',
  peopleCount: data.people_count,
  waterConsumption: data.water_consumption,
  cleaningConsumption: data.cleaning_consumption,
  installationDate: data.installation_date,
  nextWaterAnalysis: data.next_water_analysis,
  saltReminder: data.salt_reminder,
  creditScore: data.credit_score,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

// Helper to transform ClientData to Supabase payload
const transformPayload = (client: Partial<ClientData>) => {
  const payload: any = { ...client };
  if (client.spouseName !== undefined) payload.spouse_name = client.spouseName;
  if (client.zipCode !== undefined) payload.zip_code = client.zipCode;
  if (client.city !== undefined) payload.city = client.city;
  if (client.state !== undefined) payload.state = client.state;
  if (client.address !== undefined) payload.address = client.address;
  if (client.peopleCount !== undefined) payload.people_count = client.peopleCount;
  if (client.waterConsumption !== undefined) payload.water_consumption = client.waterConsumption;
  if (client.cleaningConsumption !== undefined) payload.cleaning_consumption = client.cleaningConsumption;
  if (client.installationDate !== undefined) payload.installation_date = client.installationDate;
  if (client.nextWaterAnalysis !== undefined) payload.next_water_analysis = client.nextWaterAnalysis;
  if (client.saltReminder !== undefined) payload.salt_reminder = client.saltReminder;
  if (client.creditScore !== undefined) payload.credit_score = client.creditScore;
  if (client.createdAt !== undefined) payload.created_at = client.createdAt;

  // Remove camelCase keys to avoid DB errors if strict
  delete payload.spouseName;
  delete payload.zipCode;
  // City, State, Address maintain same name in DB, but we just injected them into payload using the literal keys.
  // Wait, payload already has them as .city, .state, and .address natively. We shouldn't delete them.
  delete payload.peopleCount;
  delete payload.waterConsumption;
  delete payload.cleaningConsumption;
  delete payload.installationDate;
  delete payload.nextWaterAnalysis;
  delete payload.saltReminder;
  delete payload.creditScore;
  delete payload.createdAt;
  delete payload.updatedAt;

  return payload;
};

export const getClients = async (): Promise<ClientData[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data.map(transformClient);
};

export const saveClient = async (client: ClientData): Promise<ClientData | null> => {
  // Check if exists
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('id', client.id)
    .single();

  const payload = transformPayload(client);

  if (existing) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', client.id)
      .select()
      .single();

    if (error) throw error;
    return transformClient(data);
  } else {
    const { data, error } = await supabase
      .from('clients')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return transformClient(data);
  }
};

export const updateClientStatus = async (clientId: string, newStatus: ClientStatus, observation: string, analyst: string): Promise<void> => {
  // First get current observations
  const { data: client } = await supabase
    .from('clients')
    .select('observations')
    .eq('id', clientId)
    .single();

  const currentObs = client?.observations || [];

  const newObservation: ClientObservation = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    text: observation,
    author: analyst,
    type: 'STATUS_CHANGE'
  };

  const { error } = await supabase
    .from('clients')
    .update({
      status: newStatus,
      observations: [...currentObs, newObservation],
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId);

  if (error) console.error('Error updating status:', error);
};

export const deleteClient = async (clientId: string): Promise<void> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) console.error('Error deleting client:', error);
};

export const seedDatabase = async () => {
  // No-op for now, or implement real seeding if needed
  // We don't want to auto-seed production DB on every load
};
