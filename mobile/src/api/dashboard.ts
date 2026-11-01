import { http } from './http';
import type { Order, OrderStatus } from './orders';

export type VendaMensal = { mes: string; total: number; pedidos: number };
export type ClienteTop = { clienteId: number; nome: string; pedidos: number; total: number };
export type MaterialUso = { material: string; pedidos: number; pesoGramas: number; total: number };

export type Dashboard = {
  totalClientes: number;
  pedidosAbertos: number;
  faturamentoMes: number;
  pedidosPorStatus: Record<OrderStatus, number>;
  totalAtrasados: number;
  pedidosAtrasados: Order[];
  ultimosPedidos: Order[];
  ticketMedio: number;
  valorEmAberto: number;
  pesoTotalGramas: number;
  /** Últimos 6 meses em ordem cronológica (meses sem venda vêm com total 0). */
  vendasMensais: VendaMensal[];
  maioresClientes: ClienteTop[];
  materiais: MaterialUso[];
  proximosVencimentos: Order[];
};

export async function getDashboard(): Promise<Dashboard> {
  return (await http.get<Dashboard>('/dashboard')).data;
}
