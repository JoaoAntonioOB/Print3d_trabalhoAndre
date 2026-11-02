/** Passa o cliente escolhido na tela de seleção de volta para o formulário de pedido. */
export type PickedClient = { id: number; nome: string };

let pending: PickedClient | null = null;

export function setPickedClient(c: PickedClient) {
  pending = c;
}

export function takePickedClient(): PickedClient | null {
  const c = pending;
  pending = null;
  return c;
}

/** Idem para o filamento do pedido. `null` significa "sem filamento" (limpar). */
export type PickedFilament = { id: number; nome: string; material: string; quantidadeGramas: number };

let pendingFilament: PickedFilament | null | undefined;

export function setPickedFilament(f: PickedFilament | null) {
  pendingFilament = f;
}

export function takePickedFilament(): PickedFilament | null | undefined {
  const f = pendingFilament;
  pendingFilament = undefined;
  return f;
}
