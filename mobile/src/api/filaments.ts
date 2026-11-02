import { http } from './http';
import type { Page } from './clients';

export type Filament = {
  id: number;
  nome: string;
  material: string;
  cor?: string | null;
  marca?: string | null;
  quantidadeGramas: number;
  estoqueMinimoGramas: number;
  abaixoDoMinimo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type FilamentCreateInput = {
  nome: string;
  material: string;
  cor?: string;
  marca?: string;
  quantidadeGramas: number;
  estoqueMinimoGramas: number;
};

/** A atualização não altera o saldo (use registrar entrada). */
export type FilamentUpdateInput = Omit<FilamentCreateInput, 'quantidadeGramas'>;

export type TipoMovimento = 'ENTRADA' | 'SAIDA' | 'ESTORNO' | 'AJUSTE';

export type Movimentacao = {
  id: number;
  tipo: TipoMovimento;
  gramas: number;
  pedidoId?: number | null;
  criadoEm: string;
};

export const MOVIMENTO_LABEL: Record<TipoMovimento, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída (pedido)',
  ESTORNO: 'Estorno (pedido)',
  AJUSTE: 'Ajuste',
};

const PAGE_SIZE = 20;

export async function listFilaments(busca: string, page: number, material?: string): Promise<Page<Filament>> {
  const { data } = await http.get<Page<Filament>>('/filaments', {
    params: { busca: busca || undefined, material: material || undefined, page, size: PAGE_SIZE },
  });
  return data;
}

export async function getFilament(id: number): Promise<Filament> {
  return (await http.get<Filament>(`/filaments/${id}`)).data;
}

export async function createFilament(input: FilamentCreateInput): Promise<Filament> {
  return (await http.post<Filament>('/filaments', input)).data;
}

export async function updateFilament(id: number, input: FilamentUpdateInput): Promise<Filament> {
  return (await http.put<Filament>(`/filaments/${id}`, input)).data;
}

export async function deleteFilament(id: number): Promise<void> {
  await http.delete(`/filaments/${id}`);
}

export async function addStockEntry(id: number, gramas: number): Promise<Filament> {
  return (await http.post<Filament>(`/filaments/${id}/entradas`, { gramas })).data;
}

export async function listMovements(id: number): Promise<Movimentacao[]> {
  return (await http.get<Movimentacao[]>(`/filaments/${id}/movimentacoes`)).data;
}
