# F30 — README Macro + Docs de Arquitetura

**Status:** done

## Goal

Documentar no README do projeto a arquitetura macro e tecnologias usadas, com links para docs completas. Estabelecer regra de que toda nova feature deve revisar se precisa atualizar estes docs.

## Architecture Impact

- **README.md**: reescrita da secao de arquitetura com diagrama macro, stack, e links
- **docs/README.md**: indice atualizado com links para todos os docs
- **CLAUDE.md**: adicionar regra explicita de revisao de docs por feature (doc-review gate)

## Wave Manifest

- **Wave 0**: F30-T01, F30-T02 (paralelo: README arquitetura macro + docs/README indice)
- **Wave 1**: F30-T03 (doc-review gate no CLAUDE.md + template de checklist)
- **Wave 2**: F30-T04 (docs: diagramas F30 + validacao final)

## Global Acceptance Criteria

- [ ] README.md tem secao de Arquitetura com diagrama ASCII/Mermaid do monorepo
- [ ] README.md tem secao de Tech Stack detalhada
- [ ] README.md tem links para docs/ (ADRs, PRDs, diagramas)
- [ ] docs/README.md tem indice completo e atualizado
- [ ] CLAUDE.md tem regra de doc-review para toda nova feature
- [ ] Template de checklist de docs existe para features futuras
- [ ] Sem regressao: informacoes existentes no README preservadas

## Diagrams

- `docs/diagrams/F30-architecture.mmd`
- `docs/diagrams/F30-journey.mmd`
