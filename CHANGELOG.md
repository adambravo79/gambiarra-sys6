# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

## [0.6.0] — 2026-01-19

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
