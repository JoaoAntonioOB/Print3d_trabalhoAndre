-- Estoque de filamentos: saldo por filamento, histórico de movimentações e vínculo opcional no pedido.

CREATE TABLE filamentos (
    id                    BIGSERIAL PRIMARY KEY,
    nome                  VARCHAR(120)   NOT NULL,
    material              VARCHAR(30)    NOT NULL,
    cor                   VARCHAR(40),
    marca                 VARCHAR(60),
    quantidade_gramas     NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantidade_gramas >= 0),
    estoque_minimo_gramas NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (estoque_minimo_gramas >= 0),
    criado_em             TIMESTAMPTZ    NOT NULL DEFAULT now(),
    atualizado_em         TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_filamentos_material ON filamentos (material);

CREATE TABLE movimentacoes_estoque (
    id          BIGSERIAL PRIMARY KEY,
    filamento_id BIGINT         NOT NULL REFERENCES filamentos (id),
    pedido_id   BIGINT         REFERENCES pedidos (id) ON DELETE SET NULL,
    tipo        VARCHAR(10)    NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'ESTORNO', 'AJUSTE')),
    gramas      NUMERIC(12, 2) NOT NULL,
    criado_em   TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_movimentacoes_filamento ON movimentacoes_estoque (filamento_id, criado_em DESC);
CREATE INDEX idx_movimentacoes_pedido ON movimentacoes_estoque (pedido_id);

ALTER TABLE pedidos
    ADD COLUMN filamento_id        BIGINT REFERENCES filamentos (id),
    ADD COLUMN gramas_descontadas  NUMERIC(12, 2);
CREATE INDEX idx_pedidos_filamento ON pedidos (filamento_id);
