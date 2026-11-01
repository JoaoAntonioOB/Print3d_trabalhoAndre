import { http } from './http';

export type Address = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

export type Client = {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpfCnpj?: string | null;
  endereco?: Address | null;
};

export type ClientInput = Omit<Client, 'id'>;

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type CepResult = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const PAGE_SIZE = 20;

export async function listClients(busca: string, page: number): Promise<Page<Client>> {
  const { data } = await http.get<Page<Client>>('/clients', {
    params: { busca: busca || undefined, page, size: PAGE_SIZE },
  });
  return data;
}

export async function getClient(id: number): Promise<Client> {
  return (await http.get<Client>(`/clients/${id}`)).data;
}

export async function createClient(input: ClientInput): Promise<Client> {
  return (await http.post<Client>('/clients', input)).data;
}

export async function updateClient(id: number, input: ClientInput): Promise<Client> {
  return (await http.put<Client>(`/clients/${id}`, input)).data;
}

export async function deleteClient(id: number): Promise<void> {
  await http.delete(`/clients/${id}`);
}

/** O app nunca chama a ViaCEP direto: passa pela API. */
export async function lookupCep(cep: string): Promise<CepResult> {
  return (await http.get<CepResult>(`/cep/${cep}`)).data;
}

export type CnpjResult = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  email?: string | null;
  /** DDD + número, só dígitos */
  telefone?: string | null;
  situacao?: string | null;
  endereco: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
  };
};

/** Segunda API externa (BrasilAPI), sempre via nossa API. */
export async function lookupCnpj(cnpj: string): Promise<CnpjResult> {
  return (await http.get<CnpjResult>(`/cnpj/${cnpj}`)).data;
}
