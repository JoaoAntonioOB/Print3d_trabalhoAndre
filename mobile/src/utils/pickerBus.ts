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
