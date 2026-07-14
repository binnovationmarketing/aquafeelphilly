# 🌊 MEGA PROMPT — Site Imersivo 3D "A Jornada da Água Pura" (Aquafeel Solutions)

> Copie tudo abaixo da linha e cole no gerador de código de IA (Claude Code, v0, Lovable, Cursor, etc.)

---

## PROMPT

Você é um(a) **diretor(a) criativo(a) + engenheiro(a) front-end sênior premiado(a) no Awwwards**, especialista em storytelling 3D scroll-driven, WebGL e micro-interações. Sua missão é criar um **site one-page imersivo e cinematográfico** para a **Aquafeel Solutions** — empresa com mais de uma década oferecendo o melhor sistema de purificação de água residencial do mercado — que transforme o processo de purificação da água em uma **experiência 3D explosiva, emocional e inesquecível**, onde o visitante literalmente **viaja por dentro do sistema junto com a água**.

---

### 1. STACK TÉCNICA (obrigatória)

- **React 18 + TypeScript + Vite**
- **Tailwind CSS 3** para layout e design system
- **Framer Motion 12** para TODAS as animações de UI: scroll-driven (`useScroll`, `useTransform`, `useSpring`), orquestração com `staggerChildren`, `AnimatePresence` para transições de cena, `layoutId` para morphing entre seções
- **React Three Fiber + drei + three.js** para as cenas 3D (planeta, tubulações, tanque, vórtice, membranas)
- **Shaders GLSL customizados** (ou `MeshTransmissionMaterial`/`MeshDistortMaterial` do drei) para água: refração, cáusticas, ondulação, bolhas
- **Lenis** (ou equivalente) para smooth scroll sincronizado com a timeline 3D
- Partículas com instanced meshes (milhares de partículas de sedimento/minerais a 60fps)
- Zustand para estado global da narrativa (progresso da jornada, idioma, áudio on/off)

---

### 2. DIREÇÃO DE ARTE

- **Paleta:** azul-abissal `#020617` → azul-profundo `#0A1E3F` → ciano-elétrico `#22D3EE` → aqua-luminoso `#7DF9FF` → branco-cristal `#F0FDFF`. Contaminação = âmbar/rust `#B45309` e cinza-tóxico. Pureza = ciano/branco com bloom.
- **Tipografia:** display grande e confiante (ex.: Clash Display / Space Grotesk) para títulos gigantes com reveal letra-por-letra; sans humanista legível para corpo.
- **Estética:** glassmorphism (painéis de vidro fosco flutuando sobre o 3D), glow volumétrico, cáusticas de luz subaquática dançando no fundo, gotas e condensação nas bordas da tela em momentos-chave.
- **Cursor customizado:** uma gota d'água líquida com trailing/física de mola que deforma ao passar sobre elementos interativos.
- **Luz:** cada etapa de purificação clareia progressivamente a cena — a água começa turva/âmbar e termina cristalina/luminosa. A cor da água é o termômetro emocional do site.

---

### 3. ESTRUTURA NARRATIVA (scroll-driven, uma "câmera" contínua)

O site é **uma única jornada de scroll** (~10–12 viewports) onde a câmera 3D segue a água. Cada cena abaixo é um capítulo com pin/scrub, títulos cinematográficos e painéis de vidro com os fatos. Use `useScroll` global para dirigir a timeline da câmera R3F.

**CENA 0 — HERO: "O Planeta Água"**
- Terra 3D girando lentamente em espaço profundo, oceanos com shader animado e atmosfera com bloom.
- Headline gigante com reveal: **"A Terra é o único planeta conhecido onde existe água. Sem ela, não haveria vida."**
- Contadores animados que sobem ao entrar em viewport: **70% da superfície do planeta é água** · **70% do corpo humano é água**.
- Pergunta provocadora em fade: *"Quão importante é a qualidade dessa água para a sua saúde?"*
- Scroll indicator: uma gota pulsando que "cai" e puxa o usuário para dentro.
- Transição: a câmera mergulha na Terra → oceano → nuvens → cidade (zoom cinematográfico contínuo).

**CENA 1 — A ÁGUA CONTAMINADA CHEGA À SUA CASA**
- Cidade estilizada 3D low-poly: planta de tratamento → rede de tubulações → sua casa. A câmera viaja POR DENTRO do cano junto com a água turva.
- Partículas âmbar (químicos, sedimentos, cloro) flutuando ao redor da câmera; nomes dos contaminantes surgem como tags flutuantes 3D.
- Copy: *"Não importa a origem: a água sempre passa por uma planta de tratamento e quilômetros de tubulações antes de chegar até você. Nesse caminho, químicos são adicionados e gerados — e precisam ser eliminados antes do consumo."*
- Painel de vidro: **"Há mais de uma década, a Aquafeel Solutions oferece o melhor sistema de purificação de água residencial do mercado."** + CTA suave *"Acompanhe a jornada da purificação ↓"*.

**CENA 2 — A VÁLVULA INTELIGENTE**
- O tanque do sistema Aquafeel aparece em 3D (corte transversal/vista raio-X). A câmera orbita até a válvula de controle no topo.
- A válvula "explode" em vista explodida (exploded view) revelando o **microprocessador** com circuitos pulsando em ciano.
- Fatos em cards com stagger: controla de forma inteligente **todos os ciclos e funções** do sistema · executa **manutenção e limpeza automáticas**.

**CENA 3 — O VÓRTICE (momento "uau" nº 1)**
- A água entra pelo **cone a 45°**, gerando o **primeiro vórtice em sentido anti-horário**. Mostre um redemoinho 3D hipnótico com shader de turbulência + milhares de partículas em espiral, scrub total pelo scroll (o usuário controla a velocidade do vórtice ao rolar).
- A câmera desce DENTRO do torvelinho, atravessando as camadas de minerais.
- Destaque os **3 discos Vortex**: diagrama 3D animado mostrando os minerais subindo e descendo (movimento ascendente/descendente), com legenda: *"maior superfície de contato → mais eficiência e efetividade na purificação"*.

**CENA 4 — AS 4 CAMADAS DE MINERAIS (cards 3D interativos)**
Pin da seção; cada camada ganha um momento próprio com close-up 3D do mineral + painel de vidro. Hover/tap gira o mineral em 3D:
1. **Micro-Z** — supera os minerais convencionais do mercado; retém partículas **invisíveis ao olho humano**; alto rendimento e durabilidade; leve e resistente — **não perde pressão** e exige pouca lavagem.
2. **KDF** — elimina químicos ligados a **câncer, fungos na pele, irritação de estômago e olhos, acidez, problemas estomacais severos, queda de cabelo, anemia e riscos ao desenvolvimento de bebês e crianças**. (Apresente como tags de risco âmbar que são "destruídas" em partículas ao passar pelo KDF.)
3. **Carvão Ativado** — remove substâncias orgânicas, **melhora odor e sabor**, elimina o **cloro** (prevenindo danos severos à pele e ao cabelo).
4. **Resina Ionizada de Alta Eficiência** — elimina **dureza** e contaminantes; ideal para água com **alto teor de ferro**; resultado: **água macia e livre de resíduos**.

**CENA 5 — ÁGUA MACIA PARA A CASA INTEIRA**
- A água (agora visivelmente mais clara) chega ao **distribuidor**, sobe pela **linha central** até o **cabeçal** e passa pelo **contador de galões**. Odômetro animado girando.
- Split-screen com ícones animados dos beneficiados: pele mais suave · tubulações protegidas · lavadora · aquecedor · lava-louças.
- Sistema de autolimpeza: **depósito + linha de injeção de água com sal** para limpeza periódica automática.
- Stat hero gigante com counter: **economize até 215 galões/mês** vs. sistemas tradicionais + redução de manutenção e gastos do lar.

**CENA 6 — OSMOSE REVERSA ALCALINA (momento "uau" nº 2: a etapa final para beber)**
- Transição de cenário: a câmera mergulha sob a pia da cozinha. O sistema RO aparece em vista explodida, cada estágio flutuando; o scroll percorre estágio por estágio com a água atravessando na tela:
  - **Etapa 1 — Barreira de sedimentos:** bloqueia resíduos nocivos que, ingeridos em excesso, podem causar **lesões renais e problemas gastrointestinais**. (Visual: parede de filtro segurando partículas que colidem.)
  - **Etapa 2 — Indispensável:** remove **cloro, pesticidas e herbicidas**; melhora odor e sabor.
  - **Etapa 3 — Alta efetividade:** elimina **compostos orgânicos voláteis, bactérias e parasitas** (infecções intestinais, doenças respiratórias e gastrointestinais). Micro-organismos 3D estilizados sendo capturados.
  - **Válvula inovadora:** alivia o **excesso de pressão** e descarta os sedimentos gerados nas etapas 1–3. (Efeito: purge com partículas expelidas.)
  - **Etapa 4 — Membrana RO:** elimina químicos altamente nocivos — **problemas estomacais, renais, hepáticos, do sistema nervoso e câncer**. Visual assinatura: moléculas âmbar barradas na membrana enquanto só a água ciano atravessa.
  - **Tanque de 2,5 galões:** fluxo contínuo **sem perda de pressão**.
  - **Etapa 5 — Polimento final:** elimina qualquer resíduo de **odor, sabor ou cor**.
- Clímax: medidor de pH líquido animado subindo até **pH 10.5 — água alcalina**, com burst de partículas luminosas e bloom.
- Notas: todos os sistemas incluem **linhas de água + torneira (grifo) exclusiva**; existe versão **compacta para espaços reduzidos** com os mesmos resultados.

**CENA 7 — FINAL: "A Melhor Experiência em Água Purificada"**
- A câmera emerge num copo de água cristalina em câmera lenta, luz refratando, uma gota caindo em macro com ondulações (shader de ripple respondendo ao mouse).
- Tagline: **"Aquafeel Solutions — sua melhor opção em água alcalina. A melhor experiência em água purificada."**
- CTA primário magnético (o botão atrai o cursor): **"Agende sua análise de água gratuita"** + CTA secundário WhatsApp/telefone.
- Comparativo antes/depois com slider arrastável (água turva ↔ cristalina).
- Footer minimalista com ondas animadas em SVG/canvas.

---

### 4. INTERAÇÕES & MICRO-DETALHES (obrigatórios)

- **Preloader temático:** copo/gota enchendo de 0→100% com shader líquido e ondas; revela o hero com máscara líquida.
- **Barra de progresso da jornada:** um "cano" vertical fixo na lateral que se preenche de água conforme o scroll; cada cena é uma válvula/checkpoint clicável (âncora).
- Números importantes (70%, 215 galões, pH 10.5, 2.5 gal) sempre com **animação de contagem** + spring ao entrar em viewport.
- Títulos com **reveal por palavra/letra** (clip-path + stagger); parallax multicamada sutil em todos os painéis.
- Botões magnéticos, cards com tilt 3D ao hover, ripple líquido nos cliques.
- **Som ambiente opcional** (toggle discreto, off por padrão): água fluindo, bolhas, "whoosh" nas transições de cena.
- Toggle de idiomas **EN / ES / PT** (mercado da Filadélfia; strings centralizadas em i18n).
- Easter egg: clicar 3× em qualquer gota dispara chuva de gotas na tela.

---

### 5. PERFORMANCE, ACESSIBILIDADE E QUALIDADE (critérios de aceitação)

- **60fps** nas cenas 3D em desktop médio: instancing, `useDetectGPU` do drei para degradar qualidade (partículas/shaders) em GPUs fracas, `frameloop="demand"` quando parado.
- **Mobile-first fallback:** em telas pequenas ou `prefers-reduced-motion`, substituir cenas WebGL pesadas por vídeos/imagens renderizadas + animações Framer Motion leves — a narrativa completa deve funcionar sem WebGL.
- Lazy-load das cenas 3D por capítulo (`React.lazy` + Suspense com placeholder líquido).
- Acessibilidade: navegação por teclado nos checkpoints, `aria-label` nos controles, contraste AA nos textos sobre 3D (scrim/gradiente quando necessário), foco visível.
- SEO: meta tags, Open Graph com imagem do hero, headings semânticos (o 3D é decorativo — o conteúdo vive em HTML real).
- Código organizado por cena: `scenes/Scene0Hero`, `scenes/Scene1City`, ... cada uma com seu próprio hook de timeline; constantes narrativas (textos, stats) em um único arquivo de conteúdo tipado.
- TypeScript estrito, sem `any`; componentes documentados.

---

### 6. TOM DE VOZ

Confiante, científico porém acessível, emocional sem sensacionalismo. A água é a protagonista; a Aquafeel é a guia da jornada. Cada dado de saúde deve informar (nunca aterrorizar) e sempre terminar apontando para a solução.

**Entregue o projeto completo, funcional e rodando com `npm run dev`, com todas as 8 cenas implementadas na ordem acima.**
