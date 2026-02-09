# Documentação Técnica: Sistema NutriSmart

Este documento descreve a arquitetura, as tecnologias e as estratégias de implementação do ecossistema **NutriSmart**, detalhando o funcionamento do frontend, backend serverless, integração com IA e infraestrutura de dados.

---

## 1. Visão Geral da Arquitetura
O NutriSmart é uma Progressive Web App (PWA) de alta performance projetada para gestão nutricional automatizada. O sistema utiliza uma arquitetura descentralizada com:
- **Frontend**: Single Page Application (SPA) reativa.
- **Backend**: Serverless Functions (Edge-ready).
- **Database/Cache**: Supabase (PostgreSQL + Realtime).
- **AI Engine**: Google Gemini (Direct orchestration).

---

## 2. Tech Stack

### Frontend
- **Framework**: React 19 (Hooks, Context API).
- **Build Tool**: Vite 6.
- **Linguagem**: TypeScript (Strict mode).
- **Styling**: Vanilla CSS (CSS Variables, Flexbox/Grid).
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **PWA**: `vite-plugin-pwa` para suporte offline e instalação.

### Backend (Serverless)
- **Runtime**: Vercel Node.js Functions.
- **API**: Endpoints RESTful em `/api/`.

### Database & Security
- **Providers**: Supabase.
- **ORM/Client**: `@supabase/supabase-js`.
- **Security**: 
  - Row Level Security (RLS) habilitado.
  - Variáveis de ambiente protegidas no servidor.
  - SHA-256 para integridade de cache.

---

## 3. Estratégia de IA (Orquestração Inteligente)

O coração do NutriSmart reside na `api/gemini.ts`, que implementa uma camada de abstração sobre o Google Gemini para otimizar custos e performance.

### 3.1 Orquestração Multi-Modelo (Hybrid Strategy)
O sistema distribui tarefas entre diferentes modelos para maximizar as cotas de uso gratuito e garantir a melhor relação qualidade/velocidade:

| Categoria | Modelo | Propósito |
| :--- | :--- | :--- |
| **VISION** | `gemini-2.0-flash` | Análise de fotos de refeições (Estado da arte em visão). |
| **LOGIC** | `gemini-2.0-flash` | Geração de planos alimentares e cálculos complexos. |
| **LITE** | `gemini-2.5-flash` | Chat NutriAI e geração de receitas (Alta velocidade). |
| **FALLBACK** | `gemini-2.5-flash` | Rede de segurança se o modelo primário esgotar a cota. |

### 3.2 Camada de Cache de Imagem (Image Intelligence Cache)
Para evitar chamadas redundantes e caras à API de visão:
1. **Hashing**: O sistema gera um hash **SHA-256** da imagem Base64 recebida.
2. **Lookup**: Consulta a tabela `meal_analysis` no Supabase pelo hash.
3. **Hit**: Se encontrado, retorna o resultado instantaneamente do banco de dados.
4. **Miss**: Se não encontrado, processa na IA e persiste o resultado para futuros hits.

### 3.3 Prompt Engineering & Structured Output
Utilizamos o `NUTRITION_EXPERT_PROMPT`, que força o modelo a agir como um **Especialista em Nutrição Computacional**, utilizando bases como TACO e USDA, e garantindo que o retorno seja **sempre um JSON válido**.

---

## 4. Funcionalidades Implementadas

### 📸 Registro e Análise de Refeições
- Captura de foto via câmera ou upload.
- Análise automatizada de ingredientes e macros.
- Edição manual de itens detectados.

### 🍱 Geração de Planos Alimentares
- Algoritmo que cruza metas calóricas do usuário com preferência de dieta.
- Distribuição inteligente de macros por refeição.

### 💬 NutriAI (Chatbot)
- Assistente contextual que conhece o histórico do usuário.
- Interface de chat em tempo real com streaming-like feel.

### 🍳 Gerador de Receitas
- Sugestões baseadas nos ingredientes que o usuário já possui.

---

## 5. Fluxo de Dados e Segurança

### Fluxo de Análise Food-to-Data:
1. `Client` → Envia Base64 para `/api/gemini?action=analyze-food`.
2. `Server` → Gera SHA-256 → Checa Supabase.
3. `Database` → Se cache hit, retorna.
4. `AI` → Se cache miss, chama Gemini com Fallback Policy.
5. `Server` → Valida JSON → Salva no Supabase → Retorna para `Client`.

### Segurança de Chaves:
- **Client-Side**: Usa apenas a `anon_key` do Supabase (protegida por RLS).
- **Server-Side**: `GEMINI_API_KEY` e chaves de serviço nunca são expostas ao browser.

---

## 6. Configuração de Ambiente (.env)
O sistema requer as seguintes variáveis para operação plena:
- `VITE_SUPABASE_URL`: Endpoint do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: Chave pública para o frontend.
- `GEMINI_API_KEY`: Chave secreta para orquestração de IA (Vercel).

---

## 7. Próximos Passos (Senior Roadmap)
1. **Real-time Sync**: Migrar o estado global para persistência reativa.
2. **Offline-first Analysis**: Implementar filas (queues) para análises pendentes em caso de perda de conexão.
3. **Advanced RLS**: Refinar políticas para multi-tenancy avançado.

---
**Documentação gerada automaticamente para desenvolvedores Senior.**
