# Dashboard de Vendas

Painel de métricas de vendas com indicadores, filtro por período e gráfico de receita. Os dados são gerados no próprio front-end para simular um ano de operação de um e-commerce.

## Objetivo

Praticar visualização de dados em React: transformar uma série temporal em indicadores e gráficos, recalculando tudo conforme o período selecionado.

## Funcionalidades

- **Cartões de indicadores**: receita total, pedidos, visitantes e taxa de conversão, com contador animado.
- **Filtro de período**: últimas 24 horas, últimos 7 dias, último mês, mês passado e este ano.
- **Gráfico de linha** de receita com tooltip e legenda (Recharts).
- **Formatação monetária** em real (`Intl.NumberFormat`, pt-BR).

### Sobre os dados

Os valores são simulados por `generateHistoricalData`, que cria um registro por dia de 2025 combinando uma receita base, fatores de sazonalidade por mês (ex.: alta em maio, novembro e dezembro), diferença entre dias úteis e fim de semana e uma variação aleatória. Não há integração com fonte de dados real.

## Tecnologias

- React 18 + TypeScript
- Vite
- Recharts
- date-fns (com locale pt-BR)
- Tailwind CSS
- Lucide React

## Estrutura de diretórios

```
dashboard-sales/
└── src/
    ├── App.tsx      # geração de dados, filtros, cartões e gráfico
    ├── main.tsx
    └── index.css
```

Todo o painel está concentrado em `App.tsx`.

## Como executar localmente

Pré-requisito: Node.js 18+.

```bash
git clone https://github.com/GuilhermeKaynam/dashboard-sales.git
cd dashboard-sales
npm install
npm run dev
```

Acesse `http://localhost:5173`. Não há variáveis de ambiente.

## Melhorias futuras

- Separar `App.tsx` em componentes (`StatCard`, `RevenueChart`, `DateRangeFilter`) e mover a geração de dados para um módulo próprio.
- Consumir dados de uma API ou de um arquivo CSV.
- Adicionar gráficos por categoria de produto.
