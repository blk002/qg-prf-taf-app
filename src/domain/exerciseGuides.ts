import type { ExerciseGuide } from './types';

const GUIDES_LIST: ExerciseGuide[] = [
  // 1. Barra Fixa & Core
  {
    exerciseId: 'barra_pronada',
    title: 'Barra Fixa Pronada (ou Negativa)',
    muscles: 'Latíssimo do dorso, bíceps, antebraço e core · Prova: Barra Fixa PRF',
    youtubeQuery: 'barra fixa pronada taf prf execucao correta',
    youtubeShortsQuery: 'como fazer barra fixa pronada execucao #shorts',
    setup: 'Pegada pronada (palmas para frente), mãos pouco além da largura dos ombros, braços estendidos e pés fora do chão.',
    steps: [
      'Puxe as escápulas para baixo e para trás antes de dobrar os cotovelos.',
      'Suba o corpo sem balançar as pernas até o queixo ultrapassar completamente a barra.',
      'Desça controlado (2–3s) até estender os cotovelos por completo embaixo.',
      'Se ainda não faz repetições completas, suba com auxílio e segure 5s na descida (negativa).',
    ],
    commonMistakes: [
      'Usar impulso com o quadril/joelhos (kipping), o que invalida a repetição no TAF.',
      'Não estender totalmente os cotovelos no ponto mais baixo.',
    ],
  },
  {
    exerciseId: 'puxada_alta_isometria',
    title: 'Puxada Frontal / Sustentação na Barra',
    muscles: 'Dorsais, trapézio inferior, romboides e flexores dos dedos',
    youtubeQuery: 'puxada frontal execucao correta musculacao costas',
    youtubeShortsQuery: 'puxada frontal pegada pronada #shorts',
    setup: 'Pegada pronada na largura dos ombros; tronco firme com leve inclinação (~15°) para trás.',
    steps: [
      'Inicie deprimindo os ombros (afaste-os das orelhas).',
      'Puxe a barra na direção do topo do peito, levando os cotovelos para baixo e para trás.',
      'Na versão isométrica na barra fixa, sustente o queixo acima da barra pelo tempo-alvo.',
    ],
    commonMistakes: [
      'Encolher os ombros no final da puxada e jogar o tronco muito para trás.',
      'Puxar usando só os braços sem ativar as escápulas.',
    ],
  },
  {
    exerciseId: 'remada_curvada',
    title: 'Remada Curvada / Australiana',
    muscles: 'Dorsais médios, romboides, deltoide posterior e core',
    youtubeQuery: 'remada australiana barra fixa execucao correta',
    youtubeShortsQuery: 'remada australiana execucao correta #shorts',
    setup: 'Na australiana, barra na altura do quadril/cintura; corpo reto da cabeça aos calcanhares.',
    steps: [
      'Contraia glúteos e abdômen para manter o tronco rígido como uma prancha.',
      'Puxe o peito em direção à barra fechando as escápulas atrás.',
      'Desça controlado até estender os braços sem deixar o quadril cair.',
    ],
    commonMistakes: [
      'Deixar a lombar arredondar ou o quadril despencar durante a subida.',
      'Encurtar a amplitude sem encostar ou aproximar o peito da barra.',
    ],
  },
  {
    exerciseId: 'suspensao_pegada',
    title: 'Dead Hang (Resistência de Pegada)',
    muscles: 'Antebraços, flexores dos dedos, ombros e descompressão escapular',
    youtubeQuery: 'dead hang barra fixa como fazer pegada',
    youtubeShortsQuery: 'dead hang barra fixa #shorts',
    setup: 'Segure a barra com pegada pronada firme, envolvendo a barra com o polegar por baixo.',
    steps: [
      'Pendure-se com braços totalmente estendidos e pés fora do apoio.',
      'Mantenha leve ativação escapular (ombros afastados das orelhas) e abdômen travado.',
      'Respire de forma contínua até completar o tempo-alvo.',
    ],
    commonMistakes: [
      'Fazer pegada falsa sem envolver o polegar.',
      'Balançar o corpo ou cruzar as pernas com tensão excessiva.',
    ],
  },
  {
    exerciseId: 'abdominal_remador',
    title: 'Abdominal Remador Padrão PRF',
    muscles: 'Reto abdominal e flexores do quadril · Prova: Abdominal 1 min PRF',
    youtubeQuery: 'abdominal remador taf prf execucao correta',
    youtubeShortsQuery: 'abdominal remador taf prf #shorts',
    setup: 'Deitado de costas, pernas estendidas e braços esticados atrás da cabeça.',
    steps: [
      'Suba tronco e joelhos simultaneamente em ritmo rápido e fluido.',
      'No topo, os cotovelos devem ultrapassar a linha dos joelhos.',
      'Retorne estendendo pernas e braços atrás até tocar as costas/escápulas no solo.',
    ],
    commonMistakes: [
      'Parar a subida antes de os cotovelos passarem dos joelhos.',
      'Não estender completamente pernas e braços atrás ao descer.',
    ],
  },

  // 2. Fortalecimento para Corrida
  {
    exerciseId: 'soleo_sentado',
    title: 'Elevação de Sóleo (Joelho Flexionado)',
    muscles: 'Sóleo e tendão de Aquiles · Base de propulsão e absorção na corrida',
    youtubeQuery: 'panturrilha sentada soleo corrida execucao correta',
    youtubeShortsQuery: 'panturrilha sentada soleo #shorts',
    setup: 'Sentado com joelhos a 90°, ponta dos pés em um degrau/anilha e carga apoiada sobre as coxas.',
    steps: [
      'Desça os calcanhares devagar por 3 segundos até sentir alongar bem.',
      'Faça uma pausa curta de 1 segundo embaixo para eliminar o efeito mola.',
      'Suba explosivo na ponta dos pés sem balançar o tronco.',
    ],
    commonMistakes: [
      'Quicar rápido no fundo sem controlar a descida.',
      'Fazer apenas em pé (joelho estendido ativa pouco o sóleo).',
    ],
  },
  {
    exerciseId: 'tibial_anterior',
    title: 'Tibialis Raise na Parede (Prevenção Canelite)',
    muscles: 'Tibial anterior · Prevenção direta de canelite na corrida',
    youtubeQuery: 'tibialis raise parede canelite execucao correta',
    youtubeShortsQuery: 'tibialis raise canelite #shorts',
    setup: 'Costas e glúteos apoiados na parede, pés à frente cerca de 30 a 45 cm e joelhos estendidos.',
    steps: [
      'Mantenha os calcanhares firmes no chão e os joelhos travados.',
      'Puxe a ponta dos pés o mais alto possível em direção às canelas.',
      'Desça devagar sem deixar os pés baterem no chão.',
    ],
    commonMistakes: [
      'Dobrar os joelhos para facilitar a subida dos pés.',
      'Deixar os pés caírem rápido demais na volta.',
    ],
  },
  {
    exerciseId: 'agachamento_bulgaro',
    title: 'Agachamento Búlgaro',
    muscles: 'Quadríceps, glúteo máximo, glúteo médio e estabilidade de tornozelo',
    youtubeQuery: 'agachamento bulgaro execucao correta',
    youtubeShortsQuery: 'agachamento bulgaro execucao #shorts',
    setup: 'De costas para um banco (~45 cm), apoie o peito do pé de trás no banco e dê um passo firme à frente.',
    steps: [
      'Desça controlado flexionando o joelho da frente até ~90°, mantendo o tronco estável.',
      'Alinhe o joelho da frente na direção do 2º dedo do pé.',
      'Empurre o chão com o pé inteiro da frente para subir sem girar o quadril.',
    ],
    commonMistakes: [
      'Deixar o joelho da frente cair para dentro (valgo dinâmico).',
      'Ficar com a base curta demais e tirar o calcanhar da frente do chão.',
    ],
  },
  {
    exerciseId: 'gluteo_medio_stepdown',
    title: 'Step-Down Excêntrico / Ponte Unilateral',
    muscles: 'Glúteo médio, quadríceps e controle pélvico unilateral',
    youtubeQuery: 'step down excentrico joelho corrida execucao',
    youtubeShortsQuery: 'step down unilateral corrida #shorts',
    setup: 'Em cima de um step/degrau de 15–20 cm, apoie-se em apenas uma perna na borda.',
    steps: [
      'Desça devagar (3s) dobrando o joelho e quadril da perna de apoio.',
      'Toque levemente o calcanhar da perna livre no chão, sem descarregar o peso.',
      'Retorne estendendo a perna de apoio mantendo a pelve nivelada.',
    ],
    commonMistakes: [
      'Deixar o quadril do lado livre despencar ou o joelho de apoio entrar.',
      'Usar impulso da perna de baixo para subir.',
    ],
  },
  {
    exerciseId: 'pallof_press',
    title: 'Pallof Press / Prancha Anti-Rotação',
    muscles: 'Oblíquos, transverso do abdômen e estabilizadores lombares',
    youtubeQuery: 'pallof press execucao correta core',
    youtubeShortsQuery: 'pallof press anti rotacao #shorts',
    setup: 'Prenda um elástico ou polia na altura do peito; fique de lado mantendo tensão constante.',
    steps: [
      'Base firme com joelhos semiflexionados e glúteos contraídos.',
      'Empurre a alça reto à frente do peito sem deixar o tronco girar para o cabo.',
      'Segure 2 segundos estendido e retorne devagar ao peito.',
    ],
    commonMistakes: [
      'Deixar os ombros ou o quadril rodarem em direção à polia.',
      'Subir os ombros perto das orelhas ao empurrar.',
    ],
  },

  // 3. Específico Impulsão Horizontal
  {
    exerciseId: 'broad_jump_tecnico',
    title: 'Broad Jump (Salto Horizontal Parado)',
    muscles: 'Extensão tripla (tornozelo, joelho e quadril) · Prova: Impulsão Horizontal PRF',
    youtubeQuery: 'impulsao horizontal taf prf execucao correta broad jump',
    youtubeShortsQuery: 'como saltar mais longe impulsao horizontal taf #shorts',
    setup: 'Pés paralelos na largura do quadril atrás da linha de saída, sem pisar na marcação.',
    steps: [
      'Balance os braços para trás flexionando quadril e joelhos (posição de carga).',
      'Projete os braços com força para frente/cima (~42°) e estenda tornozelos, joelhos e quadris ao mesmo tempo.',
      'No ar, traga os joelhos ao peito e estenda os pés à frente pouco antes de tocar o solo.',
      'Aterrisse com os dois pés juntos amortecendo para frente — nunca caia para trás.',
    ],
    commonMistakes: [
      'Pisar ou queimar a linha de saída antes ou durante o salto.',
      'Apoiar a mão atrás na aterrissagem (vale a marca mais próxima da linha de saída).',
    ],
  },
  {
    exerciseId: 'box_jump',
    title: 'Box Jump / Salto na Caixa',
    muscles: 'Potência explosiva de quadríceps, glúteos e panturrilhas',
    youtubeQuery: 'box jump salto na caixa execucao correta',
    youtubeShortsQuery: 'box jump execucao correta #shorts',
    setup: 'Em frente à caixa a ~30 cm de distância, pés na largura dos ombros.',
    steps: [
      'Faça um quarto de agachamento rápido balançando os braços para trás.',
      'Salte com os dois pés simultaneamente e pouse suave no centro da caixa.',
      'Estenda totalmente o quadril em cima da caixa e desça um pé de cada vez.',
    ],
    commonMistakes: [
      'Saltar de volta da caixa para o chão (sobrecarrega o tendão de Aquiles).',
      'Aterrissar com joelhos colapsados para dentro ou muito na ponta da caixa.',
    ],
  },
  {
    exerciseId: 'drop_jump_baixo',
    title: 'Drop Jump Baixo + Salto Horizontal',
    muscles: 'Reatividade elástica de tornozelo e ciclo alongamento-encurtamento',
    youtubeQuery: 'drop jump pliometria execucao correta',
    youtubeShortsQuery: 'drop jump pliometria #shorts',
    setup: 'Em cima de uma caixa baixa (20–30 cm), pés paralelos perto da borda.',
    steps: [
      'Dê um passo à frente e apenas deixe o corpo cair para o solo (não pule para cima da caixa).',
      'Toque o chão com a ponta/meio do pé e salte imediatamente para frente com contato mínimo.',
      'Mantenha o tornozelo firme (rígido como mola) e descanse bem entre séries.',
    ],
    commonMistakes: [
      'Usar caixa alta demais (>40 cm) ou demorar muito no chão antes de saltar.',
      'Afundar demais nos joelhos absorvendo o impacto como agachamento lento.',
    ],
  },
  {
    exerciseId: 'kettlebell_swing',
    title: 'Kettlebell Swing / Salto com Extensão de Quadril',
    muscles: 'Glúteos, posteriores de coxa e cadeia posterior explosiva',
    youtubeQuery: 'kettlebell swing execucao correta',
    youtubeShortsQuery: 'kettlebell swing execucao correta #shorts',
    setup: 'Pés pouco além da largura dos ombros, kettlebell à frente no chão; coluna neutra.',
    steps: [
      'Empurre o quadril para trás (dobradiça de quadril/hinge, não agachamento) mantendo canelas quase verticais.',
      'Estale o quadril com força para frente contraindo glúteos e abdômen no topo.',
      'Os braços apenas conduzem o peso até a altura do peito, sem puxar com os ombros.',
    ],
    commonMistakes: [
      'Transformar o movimento em agachamento dobrando muito os joelhos.',
      'Arredondar a lombar no fundo ou hiperestender as costas no topo.',
    ],
  },
  {
    exerciseId: 'salto_unilateral_estab',
    title: 'Salto Unilateral + Congelamento (2s)',
    muscles: 'Propulsão unilateral, joelho e estabilidade de tornozelo',
    youtubeQuery: 'salto unilateral estabilizacao pliometria',
    youtubeShortsQuery: 'single leg hop stick landing #shorts',
    setup: 'Em apoio em uma perna só, tronco levemente inclinado à frente.',
    steps: [
      'Impulsione para frente com uma perna usando os braços para equilibrar.',
      'Aterrisse na mesma perna amortecendo com quadril e joelho.',
      'Congele imóvel por 2 segundos completos antes do próximo salto.',
    ],
    commonMistakes: [
      'Deixar o joelho torcer para dentro na aterrissagem.',
      'Pular para o próximo salto sem estabilizar os 2 segundos.',
    ],
  },

  // 4. Específico Shuttle Run (9,14 m)
  {
    exerciseId: 'arrancada_10m',
    title: 'Arrancada Curta (Saída Baixa 0–10 m)',
    muscles: 'Quadríceps, glúteos e panturrilha · Aceleração inicial do Shuttle Run',
    youtubeQuery: 'arrancada sprint 10 metros tecnica aceleracao',
    youtubeShortsQuery: 'tecnica aceleracao corrida 10m #shorts',
    setup: 'Um pé à frente atrás da linha, joelho dobrado, tronco inclinado ~45° e braço oposto pronto.',
    steps: [
      'Empurre o chão para trás com força explosiva nos 3 primeiros passos.',
      'Mantenha o tronco inclinado à frente nos primeiros metros sem levantar o peito cedo demais.',
      'Movimente os braços rápido de trás para frente em ângulo de ~90°.',
    ],
    commonMistakes: [
      'Endireitar o tronco logo no primeiro passo (perde tração horizontal).',
      'Dar passadas muito longas à frente do centro de gravidade.',
    ],
  },
  {
    exerciseId: 'frenagem_excentrica',
    title: 'Afundo Pliométrico de Frenagem (Deceleração)',
    muscles: 'Quadríceps excêntrico, glúteos e controle de frenagem nas linhas',
    youtubeQuery: 'afundo pliometrico execucao correta desaceleracao',
    youtubeShortsQuery: 'afundo pliometrico execucao #shorts',
    setup: 'Posição de afundo com tronco reto e abdômen firme.',
    steps: [
      'Salte trocando as pernas no ar ou dê um passo rápido à frente simulando chegada na linha.',
      'Freie o corpo baixando o centro de gravidade de forma firme e silenciosa.',
      'Estabilize sem deixar o joelho da frente balançar para dentro.',
    ],
    commonMistakes: [
      'Frear com as pernas estendidas (aumenta risco de escorregar e sobrecarrega joelho).',
      'Bater o joelho de trás no chão.',
    ],
  },
  {
    exerciseId: 'drill_troca_bloco',
    title: 'Drill Técnico de Giro Baixo + Troca do Bloco',
    muscles: 'Agilidade, coordenação de pés e técnica oficial · Prova: Shuttle Run PRF',
    youtubeQuery: 'shuttle run taf prf execucao correta tecnica bloco',
    youtubeShortsQuery: 'shuttle run taf prf dicas #shorts',
    setup: 'Marque duas linhas a 9,14 m com 2 blocos de madeira após a linha oposta.',
    steps: [
      'Nos últimos 2 passos antes da linha, abaixe o quadril e vire o pé de apoio paralelo à linha.',
      'Ultrapasse a linha com pelo menos um pé, dobre o quadril e pegue o bloco com firmeza.',
      'Gire rápido já acelerando de volta e coloque (não jogue) o bloco atrás da linha de saída.',
    ],
    commonMistakes: [
      'Jogar ou deixar o bloco rolar no chão (eliminação ou repetição invalidada no TAF).',
      'Não transpor a linha com o pé ou frear muito cedo.',
    ],
  },
  {
    exerciseId: 'skater_jump_reativo',
    title: 'Skater Jump Lateral Reativo',
    muscles: 'Glúteo médio, adutores e potência lateral para cortes rápidos',
    youtubeQuery: 'skater jump execucao correta',
    youtubeShortsQuery: 'skater jump execucao #shorts',
    setup: 'Em pé apoiado em uma perna, leve flexão de quadril e joelho.',
    steps: [
      'Empurre forte com a borda do pé para saltar lateralmente para o outro lado.',
      'Amorteça na perna oposta mantendo o joelho alinhado e a perna livre atrás sem apoiar forte.',
      'Inverta imediatamente para o outro lado com ritmo explosivo.',
    ],
    commonMistakes: [
      'Arredondar a coluna para frente ao invés de flexionar o quadril.',
      'Pousar duro sem amortecer com o quadril.',
    ],
  },
  {
    exerciseId: 'copenhagen_tornozelo',
    title: 'Adutor Copenhagen + Equilíbrio de Tornozelo',
    muscles: 'Adutores da coxa, oblíquos e prevenção de distensão na mudança de direção',
    youtubeQuery: 'prancha copenhagen adutores execucao correta',
    youtubeShortsQuery: 'copenhagen plank execucao #shorts',
    setup: 'Deite de lado próximo a um banco; apoie o antebraço no chão e a face interna do joelho ou tornozelo de cima no banco.',
    steps: [
      'Eleve o quadril alinhando ombros, quadril e pernas em linha reta.',
      'Mantenha a perna de baixo suspensa logo abaixo do banco (versão iniciante: apoie o joelho no banco).',
      'Segure pelo tempo-alvo respirando firme sem deixar o quadril rodar.',
    ],
    commonMistakes: [
      'Começar direto pelo tornozelo se ainda sente desconforto na virilha (use o joelho apoiado primeiro).',
      'Deixar o quadril cair ou girar para trás.',
    ],
  },
];

const CATALOG = new Map(GUIDES_LIST.map((g) => [g.exerciseId, g]));

export const ExerciseGuides = {
  all: (): ExerciseGuide[] => GUIDES_LIST,
  forExercise: (exerciseId: string, fallbackTitle: string, fallbackCue = ''): ExerciseGuide => {
    const found = CATALOG.get(exerciseId);
    if (found) return found;
    return {
      exerciseId,
      title: fallbackTitle,
      muscles: 'Treino específico TAF PRF',
      youtubeQuery: `${fallbackTitle} execucao correta`,
      youtubeShortsQuery: `${fallbackTitle} execucao #shorts`,
      setup: 'Posicione-se com postura alinhada e controle total antes de iniciar a série.',
      steps: [
        ...(fallbackCue.trim() ? [fallbackCue.trim()] : []),
        'Execute cada repetição com amplitude completa e ritmo controlado.',
        'Mantenha respiração firme e descanse o tempo indicado entre as séries.',
      ],
      commonMistakes: ['Usar impulso ou compensação lombar para terminar a série.'],
    };
  },
};
