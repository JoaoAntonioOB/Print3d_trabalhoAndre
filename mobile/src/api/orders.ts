import { http } from './http';
import type { Page } from './clients';

export type OrderStatus = 'PENDENTE' | 'EM_PRODUCAO' | 'CONCLUIDO' | 'ENTREGUE' | 'CANCELADO';

export const ORDER_STATUSES: OrderStatus[] = ['PENDENTE', 'EM_PRODUCAO', 'CONCLUIDO', 'ENTREGUE', 'CANCELADO'];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDENTE: 'Pendente',
  EM_PRODUCAO: 'Em produção',
  CONCLUIDO: 'Concluído',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const STATUS_ICON: Record<OrderStatus, string> = {
  PENDENTE: 'clock-outline',
  EM_PRODUCAO: 'printer-3d',
  CONCLUIDO: 'check-circle-outline',
  ENTREGUE: 'truck-delivery-outline',
  CANCELADO: 'close-circle-outline',
};

/** Espelha as transições válidas da API (a API continua sendo a fonte da verdade). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDENTE: ['EM_PRODUCAO', 'CANCELADO'],
  EM_PRODUCAO: ['CONCLUIDO', 'CANCELADO'],
  CONCLUIDO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
};

export const isOpen = (s: OrderStatus) => s === 'PENDENTE' || s === 'EM_PRODUCAO';
export const canEdit = isOpen;
export const canDelete = (s: OrderStatus) => s === 'PENDENTE' || s === 'CANCELADO';

export type Order = {
  id: number;
  clienteId: number;
  clienteNome: string;
  descricao: string;
  material: string;
  pesoGramas: number;
  valor: number;
  /** AAAA-MM-DD */
  prazo: string;
  status: OrderStatus;
  filamentoId?: number | null;
  filamentoNome?: string | null;
};

export type OrderInput = {
  clienteId: number;
  filamentoId?: number;
  descricao: string;
  material: string;
  pesoGramas: number;
  valor: number;
  prazo: string;
};

const PAGE_SIZE = 20;

export async function listOrders(busca: string, status: OrderStatus | null, page: number): Promise<Page<Order>> {
  const { data } = await http.get<Page<Order>>('/orders', {
    params: { busca: busca || undefined, status: status ?? undefined, page, size: PAGE_SIZE },
  });
  return data;
}

export async function getOrder(id: number): Promise<Order> {
  return (await http.get<Order>(`/orders/${id}`)).data;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  return (await http.post<Order>('/orders', input)).data;
}

export async function updateOrder(id: number, input: OrderInput): Promise<Order> {
  return (await http.put<Order>(`/orders/${id}`, input)).data;
}

export async function changeOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  return (await http.patch<Order>(`/orders/${id}/status`, { status })).data;
}

export async function deleteOrder(id: number): Promise<void> {
  await http.delete(`/orders/${id}`);
}
