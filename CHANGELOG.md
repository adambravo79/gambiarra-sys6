# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

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
