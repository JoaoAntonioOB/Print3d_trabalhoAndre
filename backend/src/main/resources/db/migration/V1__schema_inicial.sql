-- Schema inicial enxuto: usuarios, clientes e pedidos.

CREATE TABLE usuarios (
    id            BIGSERIAL PRIMARY KEY,
    nome          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL,
    senha         VARCHAR(100) NOT NULL,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_usuarios_email_lower ON usuarios (LOWER(email));

CREATE TABLE clientes (
    id            BIGSERIAL PRIMARY KEY,
    nome          VARCHAR(160) NOT NULL,
    email         VARCHAR(160),
    telefone      VARCHAR(20),
    cpf_cnpj      VARCHAR(18) UNIQUE,
    cep           VARCHAR(9),
    logradouro    VARCHAR(160),
    numero        VARCHAR(20),
    complemento   VARCHAR(80),
    bairro        VARCHAR(80),
    cidade        VARCHAR(80),
    estado        CHAR(2),
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_nome ON clientes (LOWER(nome));

CREATE TABLE pedidos (
    id            BIGSERIAL PRIMARY KEY,
    cliente_id    BIGINT         NOT NULL REFERENCES clientes (id),
    descricao     VARCHAR(500)   NOT NULL,
    material      VARCHAR(30)    NOT NULL,
    peso_gramas   NUMERIC(10, 2) NOT NULL CHECK (peso_gramas > 0),
    valor         NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    prazo         DATE           NOT NULL,
    status        VARCHAR(20)    NOT NULL DEFAULT 'PENDENTE'
        CHECK (status IN ('PENDENTE', 'EM_PRODUCAO', 'CONCLUIDO', 'ENTREGUE', 'CANCELADO')),
    criado_em     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_cliente ON pedidos (cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos (status);
CREATE INDEX idx_pedidos_prazo ON pedidos (prazo);
