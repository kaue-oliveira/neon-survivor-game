# Neon Survivor (game2)

Jogo web em HTML, CSS e JavaScript puro com foco em progressao e recompensas constantes.

## Destaques de gameplay

- Sobrevivencia por ondas com dificuldade crescente.
- Ondas mais curtas e agressivas (ritmo acelerado com pressão contínua).
- Boss recorrente por intervalo de wave configuravel (4, 5 ou 6).
- Novos inimigos desbloqueados com o tempo (tank, dasher, shooter, splitter e swarm).
- Inimigos com habilidades diferentes (dash, disparo a distancia, divisao em minions, fase de boss com barragem).
- Velocidade dos inimigos aumenta com o tempo de run e com a wave (escalonamento continuo).
- Mais 10 inimigos especiais progressivos: volt, brawler, slime, teleporter, shield, deatomizer, orbiter, spawner, healer e siphoner.
- Boss em tiers mais altos com fases extras (charge, barrage e summon).
- Sistema de combo (quanto mais kills sequenciais, maior a pontuacao).
- XP e level up com escolha de 1 entre 3 upgrades por nivel.
- Evolucao de build a cada 3 waves, permitindo trocar o estilo de tiro durante a run.
- Evolucoes de estilo incluem leque, rail, municao guiada, impacto e modo spawner com drones aliados.
- Upgrades permanentes no Hangar usando cristais entre partidas.
- Auto-tiro habilitado por padrao (sem precisar clicar para atirar).
- Opcoes de corrida: auto/manual, dificuldade (Normal/Dificil/Insano) e quantidade de escolhas por level (3 a 5).
- Pool expandido de upgrades de corrida (critico, multishot, lifesteal, velocidade de projetil, entre outros).
- Upgrades novos de complexidade alta: regeneracao, reducao de dano, bonus de XP e nova em area ao eliminar inimigos.
- Feedback visual forte: particulas, floating score e screen shake.
- Suporte a teclado e controles por toque para mobile.

## Controles

- Mover: WASD ou setas.
- Atirar: automatico por padrao; opcionalmente espaco, clique/toque no canvas ou botao ATIRAR no mobile.
- Iniciar: Enter/Espaco no menu ou botao "Iniciar corrida".

## Como executar

1. Entre na pasta `game2`.
2. Rode um servidor local:
   - `python3 -m http.server 5500`
3. Abra `http://localhost:5500`.

## Requisitos da atividade atendidos

- Apenas HTML, CSS e JavaScript puro.
- Funciona no navegador sem backend.
- Interface organizada com regras claras.
- Interacao do usuario com estados de jogo completos (inicio, jogo, level up, game over, reinicio).
- Pontuacao e progressao implementadas.
- Licenca MIT incluida no arquivo LICENSE.

## Publicacao no GitHub Pages

- Suba a pasta `game2` no repositorio.
- Em Settings > Pages, escolha branch principal e pasta `/game2` (ou raiz do projeto, conforme estrutura).
- Acesse a URL publicada para validar a entrega.
