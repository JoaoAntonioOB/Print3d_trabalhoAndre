-- Dados inteiramente fictícios para demonstração acadêmica (TCC).
-- Execução manual, fora do Flyway. Acrescenta dados sem substituir os existentes.
-- Cenário adicional do mês atual; preserva o histórico anterior.
-- Marcador por mês: reexecutar no mesmo mês não duplica dados.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'America/Sao_Paulo';
SELECT pg_advisory_xact_lock(20261017, 310);
DO $demo$
DECLARE
  marker constant text := 'DEMO_TCC_MENSAL_' || to_char(current_date,'YYYYMM');
  names text[] := ARRAY['Forma Arquitetura','Nexo Engenharia','Órbita Design','Pixel Colecionáveis','Vértice Educação','Ateliê Aurora','Lucas Almeida','Marina Costa','Rafael Martins','Beatriz Rocha','Estúdio Prisma','Oficina Horizonte','Ana Ribeiro','Pedro Santos','Clara Mendes','Bruno Oliveira','Lume Decoração','Escola Inventar'];
  pieces text[] := ARRAY['Maquete residencial modular','Suporte técnico para sensor','Organizador de bancada','Miniatura de personagem','Kit didático de engrenagens','Vaso geométrico','Suporte articulado','Protótipo de carenagem','Luminária paramétrica','Caixa para circuito eletrônico','Peças para robótica','Troféu personalizado'];
  materials text[] := ARRAY['PLA','PLA','PETG','ABS','TPU','PLA','PETG','ASA'];
  colors text[] := ARRAY['Branco','Preto','Azul','Cinza','Preto','Verde','Transparente','Grafite'];
  costs numeric[] := ARRAY[89.90,89.90,109.90,99.90,169.90,94.90,119.90,139.90];
  stocks numeric[] := ARRAY[3200,420,2400,1600,180,2100,1500,1800];
  volumes integer[] := ARRAY[12,15,18,16,20,23,21,26,29,32,35,46];
  clients bigint[] := '{}'; printers bigint[] := '{}'; filaments bigint[] := '{}';
  admin_id bigint; new_id bigint; order_id bigint; item_id bigint;
  m integer; j integer; k integer; f integer; p integer; c integer; n integer; qty integer;
  month_start date; made timestamptz; finished timestamptz; delivery date;
  order_state text; order_no text; price numeric; weight numeric; minutes integer; energy numeric;
  monthly_revenue numeric;
BEGIN
  IF EXISTS (SELECT 1 FROM clientes WHERE observacoes = marker) THEN
    RAISE NOTICE 'Carga TCC já existente; nenhum registro foi alterado.';
    RETURN;
  END IF;
  SELECT id INTO STRICT admin_id FROM usuarios WHERE lower(email) = 'admin@print3d.com';
  FOR k IN 1..array_length(names,1) LOOP
    INSERT INTO clientes(nome,email,tipo_pessoa,cidade,estado,observacoes,criado_em,atualizado_em)
    VALUES(names[k], 'demo.tcc.' || to_char(current_date,'YYYYMM') || '.' || k || '@example.test',
      CASE WHEN k IN (7,8,9,10,13,14,15,16) THEN 'FISICA' ELSE 'JURIDICA' END,
      (ARRAY['São Paulo','Campinas','Sorocaba','Santo André'])[1+(k%4)],'SP',marker,
      CASE WHEN k>15 THEN now() - (k-15)*interval '35 minutes'
           ELSE date_trunc('month',now()) - interval '11 months' - interval '10 days' END,now())
    RETURNING id INTO new_id;
    clients := array_append(clients,new_id);
  END LOOP;
  FOR k IN 1..6 LOOP
    INSERT INTO impressoras(nome,marca,modelo,status,potencia_watts,volume_x_mm,volume_y_mm,volume_z_mm,
      valor_aquisicao,data_aquisicao,observacoes)
    VALUES((ARRAY['Bambu Lab P1S · 01','Bambu Lab A1 · 02','Creality K1 · 03','Prusa MK4 · 04','Ender 3 V3 · 05','Bambu Lab P1S · 06'])[k] || ' · Demo ' || to_char(current_date,'MM/YYYY'),
      (ARRAY['Bambu Lab','Bambu Lab','Creality','Prusa','Creality','Bambu Lab'])[k],
      (ARRAY['P1S','A1','K1','MK4','Ender 3 V3','P1S'])[k],
      CASE WHEN k<=4 THEN 'IMPRIMINDO' WHEN k=5 THEN 'DISPONIVEL' ELSE 'EM_MANUTENCAO' END,
      200,220,220,250,3500+k*350,current_date-400,marker)
    RETURNING id INTO new_id;
    printers := array_append(printers,new_id);
    INSERT INTO configuracoes_impressora(impressora_id,valor_kwh,valor_hora_maquina,custo_desgaste_hora,markup_padrao)
    VALUES(new_id,0.95,8.00,1.20,100);
  END LOOP;
  FOR k IN 1..8 LOOP
    INSERT INTO filamentos(nome,marca,material,cor,custo_por_kg,peso_bobina_g,quantidade_estoque_g,estoque_minimo_g)
    VALUES(materials[k] || ' ' || colors[k] || ' · Demo ' || to_char(current_date,'MM/YYYY'),'Linha demonstração',materials[k],colors[k],costs[k],1000,stocks[k],500)
    RETURNING id INTO new_id;
    filaments := array_append(filaments,new_id);
  END LOOP;
  INSERT INTO itens_estoque(nome,descricao,categoria,quantidade,quantidade_minima,custo_unitario,localizacao)
  VALUES ('Caixa kraft 20 × 20 cm',marker,'Embalagens',12,25,3.20,'Prateleira A1'),
         ('Bico de latão 0,4 mm',marker,'Manutenção',3,5,12.90,'Gaveta B2'),
         ('Inserto roscado M3',marker,'Componentes',240,50,0.85,'Gaveta B3'),
         ('Envelope de proteção',marker,'Embalagens',180,40,1.40,'Prateleira A2');

  FOR m IN 11..11 LOOP
    month_start := (date_trunc('month',now()) - (11-m)*interval '1 month')::date;
    n := volumes[m+1];
    FOR j IN 1..n LOOP
      c := CASE WHEN j%3=0 THEN 1+(j%5) ELSE 1+((j*7+m)%15) END;
      f := 1+((j+m)%8); p := 1+((j-1)%6); qty := 1+(j%4);
      price := 75+(j*37%160)+m*9;
      weight := (45+(j*19%125))*qty;
      minutes := 120+(j*31%240);
      energy := round(minutes/60.0*0.2,3);
      made := month_start + floor((j-1) * greatest(extract(day from current_date)::int-3,0)::numeric / n)::int * interval '1 day' + interval '8 hours';
      finished := made + make_interval(mins=>minutes);
      delivery := least(made::date+2,current_date);
      order_state := 'ENTREGUE';
      IF m=11 AND j>n-10 THEN
        order_state := CASE WHEN j<=n-8 THEN 'CONCLUIDO' WHEN j<=n-4 THEN 'EM_PRODUCAO'
                           WHEN j<n THEN 'PENDENTE' ELSE 'CANCELADO' END;
        made := now()-make_interval(hours=>(n-j+5));
        delivery := current_date+CASE WHEN order_state='CONCLUIDO' THEN 0 ELSE 3 END;
        finished := made+make_interval(mins=>minutes);
      END IF;
      order_no := 'TCC-DEMO-' || to_char(month_start,'YYMM') || '-' || lpad(j::text,3,'0');
      INSERT INTO pedidos(numero,cliente_id,usuario_id,status,data_entrega_prevista,data_entrega_realizada,
        valor_total,observacoes,criado_em,atualizado_em)
      VALUES(order_no,clients[c],admin_id,order_state,delivery,
        CASE WHEN order_state='ENTREGUE' THEN delivery END,price*qty,marker,made,
        CASE WHEN order_state='ENTREGUE' THEN delivery::timestamptz ELSE now() END)
      RETURNING id INTO order_id;
      INSERT INTO itens_pedido(pedido_id,filamento_id,nome_peca,descricao,quantidade,peso_estimado_g,
        tempo_impressao_minutos,preco_unitario,criado_em,atualizado_em)
      VALUES(order_id,filaments[f],pieces[1+((j+m)%12)],marker,qty,weight/qty,minutes,price,made,made)
      RETURNING id INTO item_id;

      IF order_state IN ('ENTREGUE','CONCLUIDO') THEN
        INSERT INTO historico_impressoes(impressora_id,filamento_id,item_pedido_id,usuario_id,status,
          iniciado_em,finalizado_em,tempo_total_minutos,peso_utilizado_g,consumo_energia_kwh,custo_total,observacoes,criado_em,atualizado_em)
        VALUES(printers[p],filaments[f],item_id,admin_id,'CONCLUIDA',made,finished,minutes,weight,energy,
          round(weight/1000*costs[f]+energy*0.95+minutes/60.0*9.2,2),marker,made,finished);
        IF j%14=0 THEN
          -- Tentativa com falha após a criação do pedido, antes da reimpressão bem-sucedida.
          UPDATE historico_impressoes SET iniciado_em=iniciado_em+interval '50 minutes',
            finalizado_em=finalizado_em+interval '50 minutes',atualizado_em=atualizado_em+interval '50 minutes'
          WHERE item_pedido_id=item_id AND observacoes=marker;
          INSERT INTO historico_impressoes(impressora_id,filamento_id,item_pedido_id,usuario_id,status,
            iniciado_em,finalizado_em,tempo_total_minutos,peso_utilizado_g,consumo_energia_kwh,custo_total,
            motivo_falha,observacoes,criado_em,atualizado_em)
          VALUES(printers[p],filaments[f],item_id,admin_id,'FALHOU',made,made+interval '40 minutes',40,
            22,0.133,round(22.0/1000*costs[f]+0.133*0.95+40.0/60*9.2,2),
            'Baixa aderência na primeira camada; peça reimpressa.',marker,made,made+interval '40 minutes');
        END IF;
      ELSIF order_state='EM_PRODUCAO' THEN
        p := j-(n-8);
        INSERT INTO historico_impressoes(impressora_id,filamento_id,item_pedido_id,usuario_id,status,iniciado_em,observacoes,criado_em)
        VALUES(printers[p],filaments[f],item_id,admin_id,'EM_ANDAMENTO',now()-make_interval(mins=>p*37),marker,now()-make_interval(mins=>p*37));
      END IF;
      IF order_state IN ('ENTREGUE','CONCLUIDO') THEN
        INSERT INTO transacoes_financeiras(tipo,categoria,descricao,valor,data_transacao,status,forma_pagamento,
          pedido_id,cliente_id,observacoes,criado_em,atualizado_em)
        VALUES('RECEITA','Impressão 3D','Pedido ' || order_no || ' — ' || pieces[1+((j+m)%12)],price*qty,
          delivery,CASE WHEN order_state='ENTREGUE' THEN 'PAGA' ELSE 'PENDENTE' END,
          (ARRAY['PIX','CARTAO_CREDITO','TRANSFERENCIA'])[1+(j%3)],order_id,clients[c],marker,made,
          CASE WHEN order_state='ENTREGUE' THEN delivery::timestamptz ELSE now() END);
      END IF;
    END LOOP;
    SELECT sum(valor_total) INTO monthly_revenue FROM pedidos
      WHERE observacoes=marker AND status='ENTREGUE' AND data_entrega_realizada>=month_start
        AND data_entrega_realizada<month_start+interval '1 month';
    FOR k IN 1..5 LOOP
      INSERT INTO transacoes_financeiras(tipo,categoria,descricao,valor,data_transacao,status,forma_pagamento,observacoes,criado_em,atualizado_em)
      VALUES('DESPESA',(ARRAY['Materiais','Energia','Aluguel','Manutenção','Embalagens'])[k],
        (ARRAY['Reposição de filamentos e resinas','Energia elétrica da produção','Locação do ateliê','Manutenção preventiva das impressoras','Embalagens e materiais de envio'])[k],
        round(monthly_revenue*(ARRAY[0.19,0.055,0.13,0.045,0.03])[k],2),least(month_start+(k*3),current_date),'PAGA',
        'TRANSFERENCIA',marker,least(month_start+(k*3),current_date)::timestamptz,least(month_start+(k*3),current_date)::timestamptz);
    END LOOP;
  END LOOP;
  -- Horímetro obtido dos jobs inseridos. Estoques representam o saldo após consumo e reposições.
  UPDATE impressoras pr SET horas_impressao_total=(SELECT round(sum(tempo_total_minutos)/60.0,2)
    FROM historico_impressoes h WHERE h.impressora_id=pr.id) WHERE pr.id=ANY(printers);
  FOR k IN 1..7 LOOP
    INSERT INTO orcamentos(numero,cliente_id,usuario_id,impressora_id,filamento_id,status,descricao,data_validade,
      tempo_impressao_minutos,peso_estimado_g,custo_filamento,custo_energia,custo_hora_maquina,custo_desgaste,
      markup,preco_sugerido,preco_final,aprovado_em,observacoes,criado_em)
    VALUES('DEMO-ORC-' || to_char(current_date,'YYMM') || '-' || lpad(k::text,3,'0'),clients[k],admin_id,printers[5],filaments[1],
      CASE WHEN k<=4 THEN 'ENVIADO' WHEN k<=6 THEN 'APROVADO' ELSE 'RASCUNHO' END,
      pieces[k],current_date+7,300,250,22.48,0.95,40,6,100,138.86,138.86,
      CASE WHEN k IN (5,6) THEN now()-interval '1 day' END,marker,now()-interval '2 days');
  END LOOP;
  INSERT INTO transacoes_financeiras(tipo,categoria,descricao,valor,data_transacao,status,observacoes)
  VALUES('DESPESA','Materiais','Reposição programada de PLA e TPU',890,current_date+3,'PENDENTE',marker);
  IF EXISTS (SELECT 1 FROM pedidos pe WHERE pe.observacoes=marker AND pe.valor_total <>
      (SELECT sum(ip.quantidade*ip.preco_unitario) FROM itens_pedido ip WHERE ip.pedido_id=pe.id)) THEN
    RAISE EXCEPTION 'Total de pedido inconsistente';
  END IF;
  RAISE NOTICE 'Carga mensal concluída: 18 clientes, 6 impressoras, 8 filamentos, 4 insumos, 46 pedidos, 7 orçamentos e financeiro do mês atual.';
END $demo$;
COMMIT;
