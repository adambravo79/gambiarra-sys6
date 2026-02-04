# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

## [0.7.1] GAMBIARRA.SYS6 - v0.7.0  
### Ajustes para consistência visual

- Padronização de dialogs do sistema
Os diálogos de Remover Item, Remover Poder e Trocar Poder agora seguem o mesmo estilo do design system (cards, bordas, botões consistentes).

- Consistência com o visual dos outros painéis
Interfaces e componentes mantêm o padrão de “pílulas / cards”, com melhor legibilidade e espaçamento.

- Melhor alinhamento e acabamento em elementos de interface do fluxo de jogo (ficha e janelas auxiliares).

- Ajustes finos para manter o padrão visual sem “quebras” entre telas.

## [0.7.0] GAMBIARRA.SYS6 - v0.7.0  
### Identidade do Nó: Arquétipos, Nova Ficha e Itens Narrativos

> O sistema agora **sabe quem o personagem é**.  
> Não só o que ele faz.

A v0.7.0 é a release onde o GAMBIARRA consolida sua identidade:  
**arquétipos canônicos, ficha pedagógica e poderes totalmente narrativos.**

---

## 🎭 Arquétipos do Nó (sistema base)

Implementada a **Galeria oficial com 10 arquétipos fixos**, cada um definindo:

- Atributos base (Corpo / Mente / Coração)
- Descrição narrativa
- Como ajuda o grupo
- Quando brilha
- Poder sugerido
- **Tagline identitária**

### Comportamento sistêmico
- Ao criar personagem:
  - Atributos nascem **travados**
  - Somente o GM pode liberar via **Modo Livre**
- Ao desligar Modo Livre:
  - A ficha **reverte automaticamente** para os valores do arquétipo
- Jogadores não conseguem “buildar” ficha:
  - O arquétipo é a identidade mecânica.

---

## 🧾 Nova Ficha de Personagem (Header v3)

A ficha foi redesenhada para expressar **identidade antes de mecânica**.

### Header com 2 pills
- **Pill esquerda:**
  - Imagem do personagem
  - Nome editável
  - Cadeado (estado dos atributos)
  - Toggle Modo Livre (apenas GM)

- **Pill direita:**
  - Ícone do arquétipo
  - Nome do arquétipo
  - **Tagline completa (quebra linha, sem corte)**

Removido:
- Repetição de arquétipo em múltiplos lugares
- Textos redundantes
- Hint excessivo

Agora:
> O topo da ficha **conta quem o personagem é**, não só mostra campos.

---

## 🔢 Atributos como identidade

- Corpo / Mente / Coração seguem regra:
  - Soma obrigatória = **6**
  - Mínimo = **1 em cada**

### Barra de validação (Sumbar)
- Verde quando válida
- Vermelha quando inválida
- **Só aparece para GM em Modo Livre**
- Jogadores nunca veem validação mecânica.

---

## ⚡ Poderes Gambiarra (prerrogativa do GM)

Poderes agora seguem estritamente o livro:

> Poder Gambiarra é resposta do Nó, não escolha do jogador.

### Mudança de UX
- Botões de poder **só aparecem para GM**:
  - Escolher Poder
  - Sortear Poder
  - Criar Poder
- Jogadores:
  - Apenas veem a lista
  - Não têm UI de escolha mecânica

Resultado:
- Sem build
- Sem otimização
- Poder vira **evento narrativo**, não recurso.

---

## 🎒 Itens do Nó (versão canônica do livro)

Sistema de Itens alinhado 1:1 com o livro:

### Tipos
- 🔹 Relíquia — permanente
- 🔸 Consumível — com cargas (1–3)

### Categorias
- Direção
- Gambiarra
- Proteção
- Estranho

### Comportamento
- Itens não dão bônus fixos
- Interagem com:
  - dificuldade
  - BUGs
  - narrativa

### Consumíveis
- Quando chegam a 0:
  - Marcados como usados
  - **Visual hachurado**
  - Ícone muda para 🪫
  - Considerados “absorvidos pelo Nó”

---

## 📦 Compêndios e Seed

Seed automático e resiliente:

- Criação automática:
  - ⚡ world.gambiarra-poderes
  - 🎒 world.gambiarra-itens

Fluxo:
- Pack do sistema → World pack → JSON

Inclui:
- Reset completo via JSON
- Validação de dados
- Prevenção de duplicados

Sistema agora é:
> **Zero setup manual.**

---

## 🐞 Bug Fixes importantes

Correções regressivas desta versão:

- Voltou botão de:
  - 🗑️ remover poder
  - 🗑️ remover item
- Consumível zerado voltou a:
  - ficar hachurado
  - mostrar estado visual correto
- Correção de comportamento perdido na refatoração da ficha.

---

## 🎨 UX Unificada (0.7.0)

Consolidado o design system do projeto:

- Mesma estética para:
  - ficha
  - poderes
  - itens
  - diálogos
- CSS separado por domínio:
  - actor.css
  - power.css
  - item.css

Removido:
- hacks de layout
- inline styles
- inconsistências visuais

Agora o sistema tem:
> **linguagem visual própria.**

---

## 🧠 Marco do projeto

A partir da **v0.7.0**, o GAMBIARRA:

- possui identidade mecânica canônica,
- impede build e metagame,
- força narrativa emergente,
- separa claramente:
  - jogador = narrativa
  - GM = interface do sistema.

Essa é a versão onde o GAMBIARRA deixa definitivamente de ser:

> “um sistema no Foundry”

e passa a ser:

> **um jogo com filosofia própria.**

## [0.6.3] GAMBIARRA.SYS6 - v0.6.3 # - Ficha Viva & UX Unificada

> A ficha deixou de ser um formulário.  
> Agora ela é um **objeto de jogo ativo**.

A v0.6.3 é a release onde a ficha do personagem se torna  
**o centro real da experiência**: visual, mecânica e narrativa totalmente integradas.

---

## 🧩 Ficha de Personagem (refatoração total)

A ficha foi redesenhada como **interface de jogo**, não mais como tela técnica.

### Header inteligente
- Nome + token integrados.
- Arquétipo exibido com ícone.
- **Modo Livre (GM)** para destravar atributos.
- Mensagens contextuais:
  - “Sem arquétipo (antigo)”
  - “Atributos travados”

### Atributos como UI de jogo
- Cards visuais para:
  - 💪 Corpo  
  - 🧠 Mente  
  - ❤️ Coração
- Soma central em pill dinâmica:
  - verde quando válida (6)
  - vermelha quando inválida.
- Feedback imediato sem precisar abrir diálogo.

---

## ⚡ Poderes Gambiarra (UX narrativa)

### Visual unificado
Cada poder agora aparece como **pill narrativa**:
- Nome do Poder
- Categoria: descrição completa que quebra automaticamente
- Categoria em negrito.
- Texto quebra em múltiplas linhas.
- Ações (GM):
  - 🗑️ remover
  - 🔁 substituir

### Criação de Poder (em mesa)
Novo fluxo visual:

- Interface no mesmo estilo da ficha.
- Campos maiores e legíveis.
- Preview real do texto.
- Salvamento:
  - só na ficha
  - só no compêndio
  - ou ambos.

---

## 🎒 Itens do Nó (ficha viva)

### Visual inteligente
Itens agora são **entidades visuais do estado do personagem**:

- Nome + descrição quebrável.
- Chips fixos:
  - tipo (Consumível / Relíquia)
  - cargas
- Ações sempre visíveis.

### Ícone de carga dinâmico
Consumíveis agora mostram:

- 🔋 quando ainda tem carga  
- 🪫 quando zerado (usado)

Sem mudar texto, só **ícone semântico**.

---

## 🎨 UX Unificada (padrão de sistema)

Todos os diálogos agora seguem o mesmo padrão:

- Cabeçalho estilo ficha.
- Inputs com:
  - altura mínima real
  - texto nunca cortado
- Radius padronizado:
  - `--gambi-radius-sm`
  - `--gambi-radius-md`
- Focus ring limpo (sem borda estranha).

Isso inclui:
- Criar Poder
- Criar Item
- Escolher Poder
- Escolher Item
- Rolar Desafio

---

## 🧠 Arquitetura interna

### Separação real de camadas
- HTML só descreve estrutura.
- CSS só cuida de layout.
- JS só cuida de lógica.

Removido:
- inline styles
- hacks de layout
- estilos duplicados.

Agora existe:
- `power.css`
- `item.css`
- `actor.css`

como **design system de verdade**.

---

## 🐞 Correções importantes

- Corrigido bug de item consumível perder:
  - descrição
  - cargas
  - efeito
- Corrigido estado inconsistente ao usar item mais de uma vez.
- Corrigido corte de texto em inputs e selects.
- Corrigida borda invisível da ficha no Foundry.
- Corrigido layout quebrando ao redimensionar.

---

## 📌 Marco do projeto

A partir da **v0.6.3**, o sistema possui:

- ficha como objeto narrativo ativo,
- UI totalmente semântica,
- visual consistente entre:
  - ficha
  - poderes
  - itens
  - rolagens
- estado do personagem legível **sem abrir diálogo nenhum**.

Essa é a versão onde o GAMBIARRA deixa de ser  
“um sistema no Foundry”  
e vira **um jogo com identidade própria**.

## [0.6.2] GAMBIARRA.SYS6 - v0.6.2 

Itens do Nó atuando nas rolagens

> Primeira versão com **sistema de Itens totalmente integrado às rolagens**.

---

## Sistema de Itens completo

Agora os Itens do Nó fazem parte real da mecânica do jogo.

Cada item possui **1 efeito único travado**:

- **Reduzir dificuldade** *(mecânico)*
- **+1 dado roxo** *(mecânico)*
- **Hackear o Nó** *(registro narrativo)*
- **Trocar atributo do desafio** *(registro narrativo)*

Tipos de item:

- 🔸 **Consumível** - possui **cargas (1–3)** e é absorvido pelo Nó ao zerar.
- 🔹 **Relíquia** - acompanha o personagem, sem consumo.

---

## Integração total com Rolar Desafio

Os itens agora aparecem diretamente no diálogo de rolagem:

- Dropdown com todos os itens utilizáveis do personagem.
- Preview visual do efeito selecionado.
- Efeitos aplicados automaticamente:
  - 🟣 +1 dado roxo entra e sai dinamicamente.
  - ➖ Reduzir dificuldade respeita limites (confirmação em Normal).
- Consumo de cargas ocorre após a rolagem.
- Quando um consumível zera:
  - item fica marcado como usado.
  - mensagem narrativa no chat: o Nó absorveu o item.

---

## Chat mais informativo

Cada rolagem agora registra:

- Dados base e dados roxos separados.
- Sucessos individuais.
- Notas automáticas dos itens usados.
- Resultado final com badge visual:
  - ✨ Sucesso
  - 🌟 Sucesso Forte
  - 🐞 BUG

---

## Interface e UX

- Diálogos redimensionáveis de verdade.
- Área de efeitos organizada em **grid 2x2**.
- Botões com tamanho fixo (não crescem ao redimensionar).
- Preview de efeito no Rolar Desafio.
- Itens consumidos aparecem:
  - riscados
  - hachurados
  - visualmente “mortos”.
- Dados coloridos por atributo (integração Dice So Nice).

---

## Correções importantes

- Corrigido bug do dado roxo “grudar” ao trocar item.
- Corrigido crescimento exagerado de botões em dialogs.
- Padronização completa entre:
  - criação de item
  - compêndio
  - ficha
  - rolagem.

---

## 📌 Marco do projeto

A partir da v0.6.2, o sistema possui:

- economia real de recursos,
- mecânica de bônus contextual,
- narrativa registrada no chat,
- loop completo: **criar → usar → consumir → consequência**.

## [0.6.1] Itens do Nó vivos + Seed automático
23/01/2026

Primeira versão realmente “plug and play” do sistema.

### Novidades

#### Itens do Nó

- Sistema completo de Itens do Nó:
    - Relíquias (persistentes)
    - Consumíveis (com cargas 1–3)

- Itens podem:
    - Ser usados na cena
    - Reagir a BUGs
    - Ser consumidos (com “O Nó recebeu…” automático)

- Indicador visual de:
    - Tipo (🔹 Relíquia / 🔸 Consumível)
    - Cargas (🔋 2/3 etc)
    - Estado usado (riscado + hachura)

#### Criação e Compêndio

- Diálogo de criação de item em mesa:
    - Tipo (relíquia/consumível)
    - Cargas (dropdown 1–3)
    - Categoria
    - Reação a BUG
    - Efeitos possíveis

- Itens podem ser:
    - Criados direto na ficha
    - Salvos no compêndio do mundo
    - Ou ambos

#### Seed automático

- Ao abrir um mundo como GM:
    - Cria automaticamente:
        - world.gambiarra-poderes
        - world.gambiarra-itens
    - Se estiverem vazios:
        - Copia do pack do sistema
        - Ou cai para JSON (data/*.json)
- Sistema agora é zero setup manual.

#### Permissões

- Jogadores (donos da ficha) podem:
    - Usar itens
    - Usar no BUG
    - Adicionar itens do compêndio
- Remover item:
    - Só se for dono da ficha
    - Caso contrário: toast explicativo

### Modelos de Dados

- Novo ```GambiarraItemModel```:
    - cargasMax (1–3)
    - clamp automático de cargas
    - coerência relíquia vs consumível
    - consumível nunca nasce “sem carga”

### UI / UX

- Lista de itens compacta (linhas menores)
- Visual diferente para itens usados
- Badges de tipo e meta
- Botão “Remover Item” direto na lista
- Diálogos mais robustos (sem dependência de DOM hack)

### Infraestrutura
- Novo pack oficial do sistema:
    - ```gambiarra-sys6.gambiarra-itens```
- Seed resiliente:
    - Pack do sistema → World pack → JSON
- Compatível com Foundry V12+

### Marco técnico desta versão

A partir da 0.6.1, o sistema:

Não exige criação manual de compêndios

Não exige macros de setup

Não exige dados hardcoded

Pode ser instalado e jogado imediatamente

## [0.6.0] - 2026-01-19

🎒 Itens Narrativos do Nó

Reformulado o modelo de Item:

tipoItem: "reliquia" | "consumivel"

cargas: number

usado: boolean

Itens não alteram mais o Actor.

Itens agora funcionam somente de forma narrativa.

Consumíveis esgotados passam a ser marcados como “recebido pelo Nó”.

Itens usados são exibidos no final da lista e com estilo strikeout.

🎲 Integração com Rolagem

Diálogo de rolagem agora lista os Itens do personagem.

Itens com o efeito "add-dado" convertem automaticamente +1 dado em +1 dado roxo 🟣.

Dado roxo vencedor aparece em roxo no chat.

Sucessos de dados base aparecem com a cor do atributo.

🎨 Interface Visual

Atualização completa do CSS da ficha de personagem.

Nova estilização para dados de sucesso no chat.

Nova exibição para itens usados e relíquias.

🧠 Fluxo Narrativo

Itens agora sustentam ideias e contexto.

A Programadora escolhe como o item afeta a cena:

reduzir dificuldade

adicionar dado roxo

trocar atributo

permitir ações impossíveis

criar complicações interessantes

---
## [V0.5.1]
Poderes Gambiarra funcionais com compêndio novamente.

## [V0.5]
Integrado aos dados 3D do Dice So Nice!
Poderes Gambiarra funcionais com compêndio

---
## [V0.4]

Versão estável com atributos e rolagens na forma mais correta.

---

## [V0.3]

Primeira versão que funcionou
