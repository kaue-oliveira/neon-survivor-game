# Neon Survivor (game2)

Jogo web feito com HTML, CSS e JavaScript puro. Toda a lógica roda no navegador, com renderização em canvas 2D e persistência local via localStorage.

Projeto focado em navegador desktop.

## O que o jogo tem

- Sobrevivência por ondas com dificuldade crescente.
- Boss recorrente configurável a cada 4, 5 ou 6 waves.
- Inimigos com comportamentos diferentes: perseguição, dash, tiro à distância, divisão em minions, cura, escudo, teleporte e drenagem.
- Upgrades durante a run para dano, cadência, regeneração, defesa, roubo de vida e ganho de XP.
- Evoluções de build que alteram o estilo de jogo para electric, impact ou spawner.
- Loja permanente no menu principal com upgrades comprados por cristais.
- Feedback visual com partículas, textos flutuantes, explosões e screen shake.

## Estrutura do projeto

- index.html: estrutura da tela, HUD, menu principal e overlay de upgrades.
- style.css: layout, tema visual, HUD, overlays e animações da interface desktop.
- script.js: estado global da run, persistência, IA dos inimigos, combate, renderização e controles.

## Como o código está organizado

- Referências de UI e configuração do mundo ficam no início de script.js.
- Estados padrão do jogador foram centralizados em PLAYER_CORE_DEFAULTS e PLAYER_BUILD_DEFAULTS.
- Catálogos como shopUpgrades, runUpgrades, buildRunUpgrades e buildEvolutions concentram o conteúdo configurável do jogo.
- O loop principal passa por animate(), update(dt) e render().
- Regras de colisão, recompensas e mortes especiais ficam agrupadas na parte de combate.
- Persistência de cristais e opções de corrida usa a chave game2_save no localStorage.

## Controles

- Mover: WASD ou setas.
- Atirar: sempre automático.
- Iniciar run: Enter ou o botão Iniciar corrida.

## Como executar

1. Entre na pasta game.
2. Rode um servidor local, por exemplo: python3 -m http.server 5500
3. Abra http://localhost:5500 no navegador.

## Persistência

- Cristais e upgrades permanentes ficam salvos entre partidas.
- As opções de dificuldade, número de escolhas por level e frequência de boss também são salvas.
- Se quiser limpar o progresso, remova a chave game2_save do localStorage do navegador.

## Requisitos

- Navegador desktop moderno com suporte a canvas 2D e localStorage.
- Resolução recomendada de 1024x600 ou maior.

## Requisitos atendidos

- Projeto sem framework e sem backend.
- Interface e lógica implementadas apenas com HTML, CSS e JavaScript.
- Fluxo completo de jogo: menu, partida, level up, evolução de build e retorno ao menu.
- Licença MIT prevista para ser adicionada no repositório GitHub.
