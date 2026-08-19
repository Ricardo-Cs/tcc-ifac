# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar no **frontend** do Chronos.

Front-end Angular do Chronos — sistema web de apoio à decisão para montagem de grade horária do IFAC. O contexto de negócio, o modelo de domínio e as regras (conflito é informação, não violação; linguagem ubíqua em português) estão documentados em `../backend/CLAUDE.md` — **ler quando precisar entender o domínio.**

## Convenções gerais

- **Comentar só quando estritamente necessário.** Comentário existe para o que **não dá para saber lendo o código**: regra de negócio, decisão de design, o _porquê_. Nunca para descrever o que o código já diz (ex.: `// abre o dialog` acima de `dialog.open()`) — isso é ruído, mesmo quando bem escrito. Ao editar ou revisar, **remover comentários redundantes** que só reafirmam o código. Comentários em português.
- Termos de negócio ficam em **português** (Turma, Oferta, Modalidade, Conflito); nomes estruturais em **inglês**. Não traduzir termos de negócio.
