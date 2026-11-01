import { http } from './http';
import type { Order, OrderStatus } from './orders';

export type Dashboard = {
  totalClientes: number;
  pedidosAbertos: number;
  faturamentoMes: number;
  pedidosPorStatus: Record<OrderStatus, number>;
  totalAtrasados: number;
  pedidosAtrasados: Order[];
  ultimosPedidos: Order[];
};

export async function getDashboard(): Promise<Dashboard> {
  return (await http.get<Dashboard>('/dashboard')).data;
}
