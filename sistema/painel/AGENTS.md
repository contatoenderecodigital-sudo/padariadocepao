<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras de conteudo da UI (revisao da Meta)

A Meta vai revisar este app. O painel NAO pode ter cara de gerado por IA.

- NUNCA usar em dash (—) nem en dash (–) em NENHUM texto: nem UI, nem comentario, nem string. Usar virgula, ponto, dois-pontos ou reescrever.
- NUNCA usar emoji em texto de UI (labels, titulos, mensagens, placeholders, cupom).
- Vale para codigo gerado por qualquer comando/componente novo daqui pra frente.
- Pendencia adiada: varrer e remover em dash de comentarios e emojis existentes (mock, cupom, avisos). Fazer quando for tratar a revisao da Meta, nao antes.
