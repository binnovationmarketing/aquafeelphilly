/**
 * Narrative content for the immersive "Journey of Pure Water" experience.
 * Sourced from the Aquafeel Solutions purification walkthrough.
 * Fully typed and localized (PT / EN / ES).
 */

export type JourneyLang = 'pt' | 'en' | 'es';

export interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}

export interface MineralLayer {
  key: string;
  name: string;
  tag: string;
  body: string;
  removes: string[];
  color: string; // accent hex
}

export interface ROStage {
  key: string;
  index: string;
  title: string;
  body: string;
}

export interface JourneyContent {
  nav: { chapters: string[] };
  ui: {
    soundOn: string;
    soundOff: string;
    scrollHint: string;
    skipTo: string;
    langLabel: string;
  };
  hero: {
    kicker: string;
    title: string[];
    lead: string;
    question: string;
    stats: Stat[];
  };
  city: {
    kicker: string;
    title: string;
    body: string;
    contaminants: string[];
    panelTitle: string;
    panelBody: string;
    cta: string;
  };
  valve: {
    kicker: string;
    title: string;
    body: string;
    features: { title: string; body: string }[];
  };
  vortex: {
    kicker: string;
    title: string;
    body: string;
    discTitle: string;
    discBody: string;
  };
  minerals: {
    kicker: string;
    title: string;
    layers: MineralLayer[];
  };
  house: {
    kicker: string;
    title: string;
    body: string;
    beneficiaries: string[];
    cleaning: string;
    stat: Stat;
  };
  osmosis: {
    kicker: string;
    title: string;
    body: string;
    stages: ROStage[];
    phLabel: string;
    phNote: string;
    extras: string[];
  };
  finale: {
    kicker: string;
    title: string;
    tagline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    beforeLabel: string;
    afterLabel: string;
  };
}

const pt: JourneyContent = {
  nav: {
    chapters: [
      'O Planeta Água',
      'A Água Que Chega',
      'A Válvula Inteligente',
      'O Vórtice',
      'Os Minerais',
      'A Casa Inteira',
      'Osmose Alcalina',
      'Água Pura',
    ],
  },
  ui: {
    soundOn: 'Som ligado',
    soundOff: 'Som desligado',
    scrollHint: 'Role para mergulhar',
    skipTo: 'Ir para',
    langLabel: 'Idioma',
  },
  hero: {
    kicker: 'Aquafeel Solutions · Uma jornada pela água pura',
    title: ['A Terra é o único planeta', 'onde existe água.', 'Sem ela, não haveria vida.'],
    lead: 'Cerca de 70% da superfície do planeta é coberta por este líquido vital. E o corpo humano também é 70% água.',
    question: 'Quão importante é a qualidade dessa água para a sua saúde?',
    stats: [
      { value: 70, suffix: '%', label: 'da superfície do planeta é água' },
      { value: 70, suffix: '%', label: 'do corpo humano é água' },
      { value: 10, prefix: '+', suffix: ' anos', label: 'purificando lares' },
    ],
  },
  city: {
    kicker: 'Capítulo 01',
    title: 'A água contaminada chega até você',
    body: 'Não importa a origem: a água sempre passa por uma planta de tratamento e quilômetros de tubulações antes de chegar à sua casa. Nesse caminho, químicos são adicionados e gerados — e precisam ser eliminados antes do consumo.',
    contaminants: ['Cloro', 'Chumbo', 'Sedimentos', 'PFAS', 'Bactérias', 'Ferro', 'Pesticidas'],
    panelTitle: 'Há mais de uma década',
    panelBody:
      'a Aquafeel Solutions oferece o melhor sistema de purificação de água residencial disponível no mercado.',
    cta: 'Acompanhe a jornada da purificação',
  },
  valve: {
    kicker: 'Capítulo 02',
    title: 'A válvula de controle inteligente',
    body: 'A água entra no sistema de purificação através da válvula de controle. Um microprocessador comanda cada etapa do processo com precisão.',
    features: [
      {
        title: 'Microprocessador',
        body: 'Controla de forma inteligente todos os ciclos e funções que o sistema realiza.',
      },
      {
        title: 'Autolimpeza',
        body: 'Cuida da manutenção e da limpeza automática do equipamento, sem intervenção manual.',
      },
    ],
  },
  vortex: {
    kicker: 'Capítulo 03',
    title: 'O primeiro vórtice',
    body: 'Um cone permite a entrada da água em ângulo de 45°, gerando um torvelinho em sentido anti-horário. A água contaminada desce atravessando as camadas de minerais que fazem a purificação.',
    discTitle: '3 Discos Vortex',
    discBody:
      'Combinados ao fluxo da água, criam o movimento ascendente e descendente dos minerais — ampliando a superfície de contato e alcançando máxima eficiência na purificação.',
  },
  minerals: {
    kicker: 'Capítulo 04',
    title: 'As camadas de minerais',
    layers: [
      {
        key: 'microz',
        name: 'Micro-Z',
        tag: 'Retenção invisível',
        body: 'Supera os minerais convencionais do mercado: retém partículas invisíveis ao olho humano. Leve e resistente, não perde pressão e exige pouca lavagem.',
        removes: ['Partículas microscópicas', 'Sedimentos finos'],
        color: '#38BDF8',
      },
      {
        key: 'kdf',
        name: 'KDF',
        tag: 'Escudo químico',
        body: 'Elimina químicos que podem causar graves problemas de saúde, protegendo toda a família.',
        removes: ['Câncer', 'Fungos na pele', 'Irritação e acidez', 'Queda de cabelo', 'Anemia'],
        color: '#22D3EE',
      },
      {
        key: 'carbon',
        name: 'Carvão Ativado',
        tag: 'Sabor & odor',
        body: 'Remove substâncias orgânicas, melhorando o odor e o sabor da água. Elimina o cloro, evitando danos severos à pele e ao cabelo.',
        removes: ['Cloro', 'Substâncias orgânicas', 'Mau odor e sabor'],
        color: '#5EEAD4',
      },
      {
        key: 'resin',
        name: 'Resina Ionizada',
        tag: 'Água macia',
        body: 'Alta eficiência na eliminação da dureza e de contaminantes. Ideal para água com alto teor de ferro. O resultado é uma água macia e livre de resíduos.',
        removes: ['Dureza', 'Ferro', 'Resíduos'],
        color: '#7DF9FF',
      },
    ],
  },
  house: {
    kicker: 'Capítulo 05',
    title: 'Água macia para a casa inteira',
    body: 'Já purificada, a água chega ao distribuidor, sobe pela linha central até o cabeçal e passa pelo contador de galões antes de abastecer toda a casa — sem perda de pressão.',
    beneficiaries: [
      'Pele mais suave',
      'Tubulações protegidas',
      'Lavadora',
      'Aquecedor',
      'Lava-louças',
    ],
    cleaning:
      'Um depósito com linha de injeção de água e sal realiza a limpeza periódica do equipamento de forma automática.',
    stat: {
      value: 215,
      suffix: ' galões',
      label: 'economizados por mês vs. sistemas tradicionais',
    },
  },
  osmosis: {
    kicker: 'Capítulo 06',
    title: 'Osmose reversa alcalina',
    body: 'A etapa final para a água que você bebe. Sob a pia, cada estágio remove uma camada a mais de contaminação.',
    stages: [
      {
        key: 's1',
        index: '01',
        title: 'Barreira de sedimentos',
        body: 'Bloqueia resíduos nocivos que, ingeridos em excesso, podem causar lesões renais e problemas gastrointestinais.',
      },
      {
        key: 's2',
        index: '02',
        title: 'Cloro, pesticidas e herbicidas',
        body: 'Etapa indispensável: remove esses compostos e melhora o odor e o sabor da água.',
      },
      {
        key: 's3',
        index: '03',
        title: 'Compostos voláteis e micro-organismos',
        body: 'Altamente efetiva contra compostos orgânicos voláteis, bactérias e parasitas que causam infecções intestinais e respiratórias.',
      },
      {
        key: 'valve',
        index: '↯',
        title: 'Válvula de pressão',
        body: 'Válvula inovadora que elimina o excesso de pressão e descarta os sedimentos gerados nas etapas 1, 2 e 3.',
      },
      {
        key: 's4',
        index: '04',
        title: 'Membrana de osmose reversa',
        body: 'Elimina químicos altamente nocivos: problemas estomacais, renais, hepáticos, do sistema nervoso e câncer.',
      },
      {
        key: 'tank',
        index: '◈',
        title: 'Tanque de 2,5 galões',
        body: 'Garante fluxo contínuo de água sem perda de pressão.',
      },
      {
        key: 's5',
        index: '05',
        title: 'Polimento final',
        body: 'A limpeza final elimina qualquer resíduo de odor, sabor ou cor da água.',
      },
    ],
    phLabel: 'pH',
    phNote: 'Água alcalina de pH 10.5 — sua melhor opção em água purificada.',
    extras: [
      'Inclui linhas de água e torneira exclusiva',
      'Versão compacta para espaços reduzidos',
      'Mesma qualidade em qualquer instalação',
    ],
  },
  finale: {
    kicker: 'O destino',
    title: 'A melhor experiência em água purificada',
    tagline: 'Aquafeel Solutions — sua melhor opção em água alcalina.',
    ctaPrimary: 'Agende sua análise de água gratuita',
    ctaSecondary: 'Fale no WhatsApp',
    beforeLabel: 'Antes',
    afterLabel: 'Depois',
  },
};

const en: JourneyContent = {
  nav: {
    chapters: [
      'The Water Planet',
      'The Water Arrives',
      'The Smart Valve',
      'The Vortex',
      'The Minerals',
      'The Whole Home',
      'Alkaline Osmosis',
      'Pure Water',
    ],
  },
  ui: {
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    scrollHint: 'Scroll to dive in',
    skipTo: 'Jump to',
    langLabel: 'Language',
  },
  hero: {
    kicker: 'Aquafeel Solutions · A journey through pure water',
    title: [
      'Earth is the only planet',
      'where water exists.',
      'Without it, there would be no life.',
    ],
    lead: 'About 70% of the planet’s surface is covered by this vital liquid. And the human body is 70% water, too.',
    question: 'How important is the quality of that water to your health?',
    stats: [
      { value: 70, suffix: '%', label: 'of the planet’s surface is water' },
      { value: 70, suffix: '%', label: 'of the human body is water' },
      { value: 10, prefix: '+', suffix: ' yrs', label: 'purifying homes' },
    ],
  },
  city: {
    kicker: 'Chapter 01',
    title: 'Contaminated water reaches your home',
    body: 'No matter the source, water always passes through a treatment plant and miles of pipes before it reaches your home. Along the way, chemicals are added and generated — and they must be removed before you drink it.',
    contaminants: ['Chlorine', 'Lead', 'Sediment', 'PFAS', 'Bacteria', 'Iron', 'Pesticides'],
    panelTitle: 'For over a decade',
    panelBody:
      'Aquafeel Solutions has offered the best residential water purification system on the market.',
    cta: 'Follow the purification journey',
  },
  valve: {
    kicker: 'Chapter 02',
    title: 'The smart control valve',
    body: 'Water enters the purification system through the control valve. A microprocessor commands every step of the process with precision.',
    features: [
      {
        title: 'Microprocessor',
        body: 'Intelligently controls every cycle and function the system performs.',
      },
      {
        title: 'Self-cleaning',
        body: 'Handles automatic maintenance and cleaning of the equipment — no manual work.',
      },
    ],
  },
  vortex: {
    kicker: 'Chapter 03',
    title: 'The first vortex',
    body: 'A cone lets water in at a 45° angle, creating a counter-clockwise whirlpool. The contaminated water spirals down through the mineral layers that purify it.',
    discTitle: '3 Vortex Discs',
    discBody:
      'Combined with the water flow, they drive the minerals up and down — expanding the contact surface and reaching maximum purification efficiency.',
  },
  minerals: {
    kicker: 'Chapter 04',
    title: 'The mineral layers',
    layers: [
      {
        key: 'microz',
        name: 'Micro-Z',
        tag: 'Invisible capture',
        body: 'Outperforms conventional minerals: captures particles invisible to the human eye. Light and durable, it keeps pressure and needs little backwashing.',
        removes: ['Microscopic particles', 'Fine sediment'],
        color: '#38BDF8',
      },
      {
        key: 'kdf',
        name: 'KDF',
        tag: 'Chemical shield',
        body: 'Eliminates chemicals that can cause serious health problems, protecting the whole family.',
        removes: ['Cancer risk', 'Skin fungus', 'Irritation & acidity', 'Hair loss', 'Anemia'],
        color: '#22D3EE',
      },
      {
        key: 'carbon',
        name: 'Activated Carbon',
        tag: 'Taste & odor',
        body: 'Removes organic substances, improving the water’s odor and taste. Eliminates chlorine, preventing severe damage to skin and hair.',
        removes: ['Chlorine', 'Organic substances', 'Bad odor & taste'],
        color: '#5EEAD4',
      },
      {
        key: 'resin',
        name: 'Ion Resin',
        tag: 'Soft water',
        body: 'High-efficiency removal of hardness and contaminants. Ideal for iron-rich water. The result is soft, residue-free water.',
        removes: ['Hardness', 'Iron', 'Residue'],
        color: '#7DF9FF',
      },
    ],
  },
  house: {
    kicker: 'Chapter 05',
    title: 'Soft water for the whole home',
    body: 'Now purified, the water reaches the distributor, rises through the central line to the head, and passes the gallon meter before supplying the whole house — with no pressure loss.',
    beneficiaries: ['Softer skin', 'Protected pipes', 'Washer', 'Water heater', 'Dishwasher'],
    cleaning:
      'A reservoir with a salt-water injection line automatically cleans the equipment on a schedule.',
    stat: { value: 215, suffix: ' gal', label: 'saved per month vs. traditional systems' },
  },
  osmosis: {
    kicker: 'Chapter 06',
    title: 'Alkaline reverse osmosis',
    body: 'The final stage for the water you drink. Under the sink, each stage removes one more layer of contamination.',
    stages: [
      {
        key: 's1',
        index: '01',
        title: 'Sediment barrier',
        body: 'Blocks harmful residue that, if ingested in excess, can cause kidney damage and gastrointestinal problems.',
      },
      {
        key: 's2',
        index: '02',
        title: 'Chlorine, pesticides & herbicides',
        body: 'An indispensable stage: removes these compounds and improves odor and taste.',
      },
      {
        key: 's3',
        index: '03',
        title: 'Volatile compounds & microbes',
        body: 'Highly effective against volatile organic compounds, bacteria and parasites that cause intestinal and respiratory infections.',
      },
      {
        key: 'valve',
        index: '↯',
        title: 'Pressure valve',
        body: 'An innovative valve that releases excess pressure and discards the sediment generated in stages 1, 2 and 3.',
      },
      {
        key: 's4',
        index: '04',
        title: 'Reverse osmosis membrane',
        body: 'Eliminates highly harmful chemicals: stomach, kidney, liver and nervous-system problems, and cancer.',
      },
      {
        key: 'tank',
        index: '◈',
        title: '2.5-gallon tank',
        body: 'Ensures a continuous flow of water with no pressure loss.',
      },
      {
        key: 's5',
        index: '05',
        title: 'Final polish',
        body: 'The final cleaning removes any remaining odor, taste or color from the water.',
      },
    ],
    phLabel: 'pH',
    phNote: 'Alkaline water at pH 10.5 — your best choice in purified water.',
    extras: [
      'Includes water lines and a dedicated faucet',
      'Compact version for tight spaces',
      'Same quality in any installation',
    ],
  },
  finale: {
    kicker: 'The destination',
    title: 'The best experience in purified water',
    tagline: 'Aquafeel Solutions — your best choice in alkaline water.',
    ctaPrimary: 'Book your free water analysis',
    ctaSecondary: 'Chat on WhatsApp',
    beforeLabel: 'Before',
    afterLabel: 'After',
  },
};

const es: JourneyContent = {
  nav: {
    chapters: [
      'El Planeta Agua',
      'El Agua Que Llega',
      'La Válvula Inteligente',
      'El Vórtice',
      'Los Minerales',
      'Toda la Casa',
      'Ósmosis Alcalina',
      'Agua Pura',
    ],
  },
  ui: {
    soundOn: 'Sonido activado',
    soundOff: 'Sonido desactivado',
    scrollHint: 'Desplázate para sumergirte',
    skipTo: 'Ir a',
    langLabel: 'Idioma',
  },
  hero: {
    kicker: 'Aquafeel Solutions · Un viaje por el agua pura',
    title: ['La Tierra es el único planeta', 'donde existe agua.', 'Sin ella, no habría vida.'],
    lead: 'Cerca del 70% de la superficie del planeta está cubierta por este líquido vital. Y el cuerpo humano también es 70% agua.',
    question: '¿Qué tan importante es la calidad de esa agua para tu salud?',
    stats: [
      { value: 70, suffix: '%', label: 'de la superficie del planeta es agua' },
      { value: 70, suffix: '%', label: 'del cuerpo humano es agua' },
      { value: 10, prefix: '+', suffix: ' años', label: 'purificando hogares' },
    ],
  },
  city: {
    kicker: 'Capítulo 01',
    title: 'El agua contaminada llega a tu casa',
    body: 'No importa de dónde provenga: el agua siempre pasa por una planta de tratamiento y kilómetros de tuberías antes de llegar a tu casa. En ese camino se añaden y generan químicos que deben eliminarse antes de consumirla.',
    contaminants: ['Cloro', 'Plomo', 'Sedimentos', 'PFAS', 'Bacterias', 'Hierro', 'Pesticidas'],
    panelTitle: 'Por más de una década',
    panelBody:
      'Aquafeel Solutions ofrece el mejor sistema de purificación de agua residencial disponible en el mercado.',
    cta: 'Acompáñanos en la purificación',
  },
  valve: {
    kicker: 'Capítulo 02',
    title: 'La válvula de control inteligente',
    body: 'El agua entra al sistema de purificación a través de la válvula de control. Un microprocesador comanda cada etapa del proceso con precisión.',
    features: [
      {
        title: 'Microprocesador',
        body: 'Controla de manera inteligente todos los ciclos y funciones que realiza el sistema.',
      },
      {
        title: 'Autolimpieza',
        body: 'Se encarga del mantenimiento y la limpieza automática del equipo, sin intervención manual.',
      },
    ],
  },
  vortex: {
    kicker: 'Capítulo 03',
    title: 'El primer vórtice',
    body: 'Un cono permite la entrada del agua en ángulo de 45°, generando un torbellino en sentido antihorario. El agua contaminada desciende atravesando las capas de minerales que la purifican.',
    discTitle: '3 Discos Vortex',
    discBody:
      'Combinados con el flujo del agua, generan el movimiento ascendente y descendente de los minerales — ampliando la superficie de contacto y logrando la máxima eficiencia.',
  },
  minerals: {
    kicker: 'Capítulo 04',
    title: 'Las capas de minerales',
    layers: [
      {
        key: 'microz',
        name: 'Micro-Z',
        tag: 'Captura invisible',
        body: 'Supera a los minerales convencionales: retiene partículas invisibles al ojo humano. Liviano y resistente, no pierde presión y necesita poco lavado.',
        removes: ['Partículas microscópicas', 'Sedimentos finos'],
        color: '#38BDF8',
      },
      {
        key: 'kdf',
        name: 'KDF',
        tag: 'Escudo químico',
        body: 'Elimina químicos que pueden causar graves problemas de salud, protegiendo a toda la familia.',
        removes: [
          'Cáncer',
          'Hongos en la piel',
          'Irritación y acidez',
          'Caída del cabello',
          'Anemia',
        ],
        color: '#22D3EE',
      },
      {
        key: 'carbon',
        name: 'Carbón Activado',
        tag: 'Sabor y olor',
        body: 'Elimina sustancias orgánicas, mejorando el olor y el sabor del agua. Elimina el cloro, evitando daños severos a la piel y el cabello.',
        removes: ['Cloro', 'Sustancias orgánicas', 'Mal olor y sabor'],
        color: '#5EEAD4',
      },
      {
        key: 'resin',
        name: 'Resina Ionizada',
        tag: 'Agua suave',
        body: 'Alta eficiencia en la eliminación de la dureza y contaminantes. Ideal para agua con alto contenido de hierro. El resultado es un agua suave y libre de residuos.',
        removes: ['Dureza', 'Hierro', 'Residuos'],
        color: '#7DF9FF',
      },
    ],
  },
  house: {
    kicker: 'Capítulo 05',
    title: 'Agua suave para toda la casa',
    body: 'Ya purificada, el agua llega al distribuidor, sube por la línea central hasta el cabezal y pasa por el contador de galones antes de abastecer toda la casa — sin pérdida de presión.',
    beneficiaries: [
      'Piel más suave',
      'Tuberías protegidas',
      'Lavadora',
      'Calentador',
      'Lavaplatos',
    ],
    cleaning:
      'Un depósito con línea de inyección de agua y sal realiza la limpieza periódica del equipo de forma automática.',
    stat: { value: 215, suffix: ' galones', label: 'ahorrados por mes vs. sistemas tradicionales' },
  },
  osmosis: {
    kicker: 'Capítulo 06',
    title: 'Ósmosis inversa alcalina',
    body: 'La etapa final para el agua que bebes. Bajo el fregadero, cada etapa elimina una capa más de contaminación.',
    stages: [
      {
        key: 's1',
        index: '01',
        title: 'Barrera de sedimentos',
        body: 'Bloquea residuos nocivos que, ingeridos en abundancia, pueden causar lesiones renales y problemas gastrointestinales.',
      },
      {
        key: 's2',
        index: '02',
        title: 'Cloro, pesticidas y herbicidas',
        body: 'Etapa indispensable: elimina estos compuestos y mejora el olor y el sabor del agua.',
      },
      {
        key: 's3',
        index: '03',
        title: 'Compuestos volátiles y microbios',
        body: 'Altamente efectiva contra compuestos orgánicos volátiles, bacterias y parásitos que causan infecciones intestinales y respiratorias.',
      },
      {
        key: 'valve',
        index: '↯',
        title: 'Válvula de presión',
        body: 'Válvula innovadora que elimina el exceso de presión y descarta los sedimentos generados en las etapas 1, 2 y 3.',
      },
      {
        key: 's4',
        index: '04',
        title: 'Membrana de ósmosis inversa',
        body: 'Elimina químicos altamente dañinos: problemas estomacales, renales, hepáticos, del sistema nervioso y cáncer.',
      },
      {
        key: 'tank',
        index: '◈',
        title: 'Tanque de 2.5 galones',
        body: 'Garantiza un flujo continuo de agua sin pérdida de presión.',
      },
      {
        key: 's5',
        index: '05',
        title: 'Pulido final',
        body: 'La limpieza final elimina cualquier residuo de olor, sabor o color del agua.',
      },
    ],
    phLabel: 'pH',
    phNote: 'Agua alcalina de pH 10.5 — tu mejor opción en agua purificada.',
    extras: [
      'Incluye líneas de agua y grifo exclusivo',
      'Versión compacta para espacios reducidos',
      'Misma calidad en cualquier instalación',
    ],
  },
  finale: {
    kicker: 'El destino',
    title: 'La mejor experiencia en agua purificada',
    tagline: 'Aquafeel Solutions — tu mejor opción en agua alcalina.',
    ctaPrimary: 'Agenda tu análisis de agua gratis',
    ctaSecondary: 'Escríbenos por WhatsApp',
    beforeLabel: 'Antes',
    afterLabel: 'Después',
  },
};

export const JOURNEY_CONTENT: Record<JourneyLang, JourneyContent> = { pt, en, es };
