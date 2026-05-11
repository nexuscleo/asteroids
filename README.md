# 🚀 Asteroids JS

Um remake moderno e nativo do clássico jogo Asteroids, originalmente desenvolvido em Python/Pygame e totalmente reescrito para a Web utilizando **HTML5 Canvas e Vanilla JavaScript**. O projeto foca em alta performance, responsividade e uma estética de interface atual baseada em *Glassmorphism*.

---

## 🎮 Sobre o Projeto

O objetivo principal deste projeto foi migrar uma lógica de física e de Game Engine (antes dependente do Pygame) para o ecossistema Web nativo. Nenhuma engine de terceiros foi utilizada, permitindo um estudo profundo sobre matemática computacional, algoritmos de colisão e gerenciamento de estado global em JavaScript.

### ✨ Funcionalidades
- **Física Realista de Inércia:** Sistema de propulsão e atrito aplicados vetorialmente.
- **Progressão de Dificuldade:** Níveis dinâmicos que aumentam a quantidade de inimigos gradativamente.
- **Interface Responsiva & Mobile-First:** Controles virtuais otimizados para toque (smartphones/tablets).
- **Estilo Visual Glassmorphism:** Menus e controles com transparências translúcidas e design futurista.
- **Multi-Input Support:** Suporte integrado a Teclado, Mouse e Touch.
- **Rodapé Dinâmico:** Footer estilizado com atualização automática do ano via JavaScript.

---

## 🧠 Técnicas de Programação Aplicadas

O código-fonte (`script.js`) foi arquitetado de forma didática para explorar os seguintes padrões e técnicas de desenvolvimento de jogos:

- **Object-Oriented Programming (OOP):** Entidades como Nave, Tiros e Asteroides modeladas através de classes, encapsulando comportamentos de translação e rotação.
- **Fixed Time Step Game Loop (Throttling):** Utilização do `requestAnimationFrame` combinado com a limitação em 60 FPS garantindo física consistente independente da taxa de atualização (Hz) do monitor.
- **Euler Integration:** Multiplicação de forças de atrito sobre vetores de posição e velocidade.
- **Toroidal Wrapping (Geometria Toroidal):** A lógica que faz com que a Nave e Asteroides ao atingirem a borda da tela "teletransportem" suavemente para a extremidade oposta.
- **Matrix Transformations:** Manipulação direta do plano 2D (`ctx.translate` / `ctx.rotate`) para renderizar sprites gerados via *Immediate Mode GUI*.
- **Entity Pooling:** Utilização de estruturas dinâmicas em memória (Arrays com percurso reverso) para administrar a vida e colisão dos objetos ativos na tela.
- **AABB & Pitágoras Collision Detection:** Cálculo de proximidade geométrica otimizado verificando interseções entre caixas de contenção (botões UI) e círculos invisíveis (Nave vs Asteróide).

---

## 🕹️ Como Jogar

**Teclado (Desktop):**
- **Seta Cima / W:** Propulsão
- **Seta Esquerda / A:** Rotacionar para a Esquerda
- **Seta Direita / D:** Rotacionar para a Direita
- **Espaço:** Disparar
- **P:** Pausar o jogo

**Touch (Dispositivos Móveis):**
- Utilize os botões translúcidos na tela (Propulsão, Rotação Direita/Esquerda e Fogo).
- Toque no botão "PAUSAR" no canto inferior direito para pausar a ação.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura base da aplicação com tag `<canvas>`.
- **CSS3:** Estilização com fontes externas (Google Fonts: Orbitron), layout e efeitos de *Glassmorphism*.
- **Vanilla JavaScript:** Lógica principal sem uso de frameworks externos.

---

## ⚙️ Como Executar Localmente

Sendo uma aplicação web estática nativa, você não precisa instalar nenhuma dependência como Node.js ou ferramentas de build.

1. Faça o clone ou o download deste repositório.
2. Abra a pasta do projeto.
3. Abra o arquivo `index.html` no seu navegador favorito.
4. *(Opcional)* Utilize a extensão "Live Server" no VS Code para rodar num servidor web local automatizado.

---

<p align="center">Desenvolvido como projeto de estudos práticos e arquitetura JavaScript.</p>

<div align="center" class="logo-footer">Nexus<span>Cleo</span></div>
<p align="center">&copy; 2026 | Cleomar da Silva</p>
