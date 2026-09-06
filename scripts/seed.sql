-- Test data. A realistic degustação so the Taster deck has something to run
-- against before a real menu exists (ticket 18).
--
-- Codes use the Crockford alphabet: no I, L, O or U.
-- Re-runnable: deletes itself first.

DELETE FROM pours WHERE event_id IN ('seed-event-1', 'seed-event-2', 'seed-event-3');
DELETE FROM events WHERE id IN ('seed-event-1', 'seed-event-2', 'seed-event-3');

INSERT INTO events (id, code, name, date) VALUES
  ('seed-event-1', 'TESTE1', 'Douro, casa da Ana', '6 de setembro'),
  ('seed-event-2', 'TESTE2', 'Toscana, sítio do Paulo', '2 de agosto'),
  -- A finished degustação to copy from: the most recent past Event, with a
  -- full eight-wine Lineup, so the "copiar de uma anterior" flow has something
  -- realistic to pull in.
  ('seed-event-3', 'TESTE3', 'Serra Gaúcha, casa do Rafa', '30 de agosto');

INSERT INTO pours (id, event_id, position, name, producer, vintage, grape, country) VALUES
  ('seed-p1', 'seed-event-1', 1, 'Brut Nature',        'Cave Geisse',      '2019', 'Chardonnay e Pinot Noir', 'Brasil'),
  ('seed-p2', 'seed-event-1', 2, 'Vinho Verde Loureiro','Aveleda',          '2023', 'Loureiro',                'Portugal'),
  ('seed-p3', 'seed-event-1', 3, 'Reserva Chardonnay', 'Miolo',            '2022', 'Chardonnay',              'Brasil'),
  ('seed-p4', 'seed-event-1', 4, 'Douro Tinto',        'Quinta do Crasto', '2020', 'Touriga Nacional',        'Portugal'),
  ('seed-p5', 'seed-event-1', 5, 'Malbec Alta',        'Catena Zapata',    '2019', 'Malbec',                  'Argentina'),
  ('seed-p6', 'seed-event-1', 6, 'Grande Vindima',     'Lidio Carraro',    '2018', 'Merlot',                  'Brasil'),
  ('seed-p7', 'seed-event-1', 7, 'Tawny 10 anos',      'Niepoort',         '2014', 'Blend do Douro',          'Portugal');

INSERT INTO pours (id, event_id, position, name, producer, vintage, grape, country) VALUES
  ('seed-q1', 'seed-event-2', 1, 'Chianti Classico',   'Fontodi',          '2020', 'Sangiovese',              'Itália'),
  ('seed-q2', 'seed-event-2', 2, 'Brunello di Montalcino','Il Poggione',   '2018', 'Sangiovese Grosso',       'Itália'),
  ('seed-q3', 'seed-event-2', 3, 'Vernaccia',          'Panizzi',          '2022', 'Vernaccia',               'Itália'),
  ('seed-q4', 'seed-event-2', 4, 'Bolgheri Rosso',     'Le Macchiole',     '2021', 'Merlot e Cabernet',       'Itália'),
  ('seed-q5', 'seed-event-2', 5, 'Vin Santo',          'Avignonesi',       '2015', 'Trebbiano',               'Itália');

INSERT INTO pours (id, event_id, position, name, producer, vintage, grape, country) VALUES
  ('seed-r1', 'seed-event-3', 1, 'Espumante Nature',      'Casa Valduga',     '2020', 'Chardonnay e Pinot Noir', 'Brasil'),
  ('seed-r2', 'seed-event-3', 2, 'Riesling Itálico',      'Salton',           '2023', 'Riesling Itálico',        'Brasil'),
  ('seed-r3', 'seed-event-3', 3, 'Sauvignon Blanc',       'Pizzato',          '2022', 'Sauvignon Blanc',         'Brasil'),
  ('seed-r4', 'seed-event-3', 4, 'Rosé de Malbec',        'Aurora',           '2023', 'Malbec',                  'Brasil'),
  ('seed-r5', 'seed-event-3', 5, 'Pinot Noir Reserva',    'Miolo',            '2021', 'Pinot Noir',              'Brasil'),
  ('seed-r6', 'seed-event-3', 6, 'Merlot Terroir',        'Lidio Carraro',    '2019', 'Merlot',                  'Brasil'),
  ('seed-r7', 'seed-event-3', 7, 'Tannat Gran Reserva',   'Pizzato',          '2018', 'Tannat',                  'Brasil'),
  ('seed-r8', 'seed-event-3', 8, 'Colheita Tardia',       'Casa Valduga',     '2021', 'Moscato',                 'Brasil');
