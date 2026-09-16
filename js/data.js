// Dados do programa: exercícios, treinos e referências científicas.
// Volume por músculo usa contagem fracionada: 1 = músculo principal, 0.5 = sinergista.

const MUSCLES = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores',
  gluteos: 'Glúteos',
  panturrilhas: 'Panturrilhas',
  abdomen: 'Abdômen',
};

const EXERCISES = {
  goblet: {
    name: 'Agachamento goblet',
    muscles: { quadriceps: 1, gluteos: 0.5 },
    cues: [
      'Segure UM halter na vertical, colado ao peito.',
      'Desça fundo, joelhos seguindo a linha dos pés.',
      'Pés elevados em anilhas/livros aumentam o trabalho de quadríceps.',
    ],
    easier: 'Agachamento sem peso até uma cadeira',
    harder: 'Tempo 3 s na descida + pausa de 1 s embaixo',
  },
  bulgaro: {
    name: 'Agachamento búlgaro',
    muscles: { quadriceps: 1, gluteos: 1 },
    unilateral: true,
    cues: [
      'Peito do pé traseiro apoiado no sofá ou cadeira.',
      'Um halter em cada mão, descida controlada até o joelho quase tocar o chão.',
      'Tronco mais inclinado = mais glúteo; mais vertical = mais quadríceps.',
    ],
    easier: 'Afundo parado com os dois pés no chão',
    harder: 'Pé da frente elevado em um degrau (mais amplitude)',
  },
  afundo: {
    name: 'Afundo reverso',
    muscles: { quadriceps: 1, gluteos: 0.5 },
    unilateral: true,
    cues: [
      'Dê um passo para trás e desça até o joelho de trás quase tocar o chão.',
      'Empurre pelo calcanhar da perna da frente para voltar.',
    ],
    easier: 'Sem halteres',
    harder: 'Pé da frente em um degrau (déficit)',
  },
  rdl: {
    name: 'Levantamento terra romeno (stiff)',
    muscles: { posteriores: 1, gluteos: 1 },
    cues: [
      'Joelhos levemente flexionados e fixos.',
      'Empurre o quadril para trás, halteres rentes às pernas, coluna neutra.',
      'Desça até sentir forte alongamento atrás da coxa — é a parte mais importante.',
    ],
    easier: 'Amplitude menor, só até o joelho',
    harder: 'Em pé sobre um degrau, descendo além dos pés',
  },
  rdl1: {
    name: 'Stiff unilateral',
    muscles: { posteriores: 1, gluteos: 1 },
    unilateral: true,
    cues: [
      'Apoie a ponta dos dedos numa parede se precisar de equilíbrio.',
      'Perna de trás sobe alinhada ao tronco; quadril fica "reto" para o chão.',
    ],
    easier: 'Pé de trás apoiado levemente no chão (kickstand)',
    harder: 'Dois halteres, sem apoio',
  },
  hipthrust: {
    name: 'Elevação pélvica (hip thrust)',
    muscles: { gluteos: 1, posteriores: 0.5 },
    cues: [
      'Costas apoiadas na lateral do sofá, halter sobre o quadril (use uma toalha).',
      'Suba até alinhar tronco e coxas, segure 1 s contraindo o glúteo.',
    ],
    easier: 'Ponte de glúteo no chão',
    harder: 'Unilateral',
  },
  panturrilha: {
    name: 'Panturrilha unilateral no degrau',
    muscles: { panturrilhas: 1 },
    unilateral: true,
    cues: [
      'Halter na mão do mesmo lado da perna trabalhada, outra mão na parede.',
      'Desça o calcanhar ao máximo e segure 2 s no alongamento.',
      'Amplitude completa > carga.',
    ],
    easier: 'Duas pernas',
    harder: 'Pausa de 2 s embaixo E em cima',
  },
  floorpress: {
    name: 'Supino no chão',
    muscles: { peito: 1, triceps: 0.5, ombros: 0.5 },
    cues: [
      'Deitado, joelhos flexionados, cotovelos a ~45° do tronco.',
      'Encoste os tríceps no chão de leve, sem quicar, e empurre.',
      'Se tiver banco ou banco de step, prefira: a amplitude maior ajuda.',
    ],
    easier: 'Flexão com joelhos no chão',
    harder: 'Tempo 3 s na descida + pausa no chão',
  },
  flexao: {
    name: 'Flexão com déficit (mãos nos halteres)',
    muscles: { peito: 1, triceps: 0.5, ombros: 0.5 },
    cues: [
      'Mãos segurando os halteres no chão: o peito desce abaixo das mãos.',
      'Corpo em prancha, desça até o peito ficar entre os halteres.',
      'Mais amplitude no peito alongado = mais estímulo.',
    ],
    easier: 'Joelhos no chão ou mãos num sofá',
    harder: 'Pés elevados numa cadeira ou mochila com peso nas costas',
  },
  desenvolvimento: {
    name: 'Desenvolvimento em pé',
    muscles: { ombros: 1, triceps: 0.5 },
    cues: [
      'Glúteo e abdômen contraídos, sem arquear a lombar.',
      'Halteres saem na altura do queixo e sobem até quase se tocarem.',
    ],
    easier: 'Sentado com costas apoiadas',
    harder: 'Unilateral (exige mais do core)',
  },
  lateral: {
    name: 'Elevação lateral',
    muscles: { ombros: 1 },
    cues: [
      'Leve inclinação do tronco à frente, cotovelos levemente flexionados.',
      'Suba até a altura dos ombros conduzindo com os cotovelos.',
      'Carga leve, reps altas, sem balanço.',
    ],
    easier: 'Um braço de cada vez, com apoio',
    harder: 'Deitado de lado no chão (tensão no início do movimento)',
  },
  remada: {
    name: 'Remada curvada',
    muscles: { costas: 1, biceps: 0.5 },
    cues: [
      'Tronco inclinado ~45°, coluna neutra, joelhos flexionados.',
      'Puxe os halteres em direção ao quadril, deixe as escápulas abrirem na descida.',
    ],
    easier: 'Com o peito apoiado numa cadeira inclinada',
    harder: 'Pausa de 1 s em cima',
  },
  remada1: {
    name: 'Remada unilateral apoiada',
    muscles: { costas: 1, biceps: 0.5 },
    unilateral: true,
    cues: [
      'Mão e joelho apoiados numa cadeira ou sofá.',
      'Deixe o ombro descer bem embaixo (alongamento), puxe o cotovelo para o quadril.',
    ],
    easier: 'Menor amplitude',
    harder: 'Tempo 3 s na descida',
  },
  pullover: {
    name: 'Pullover com halter',
    muscles: { costas: 1, peito: 0.5 },
    cues: [
      'Deitado atravessado no sofá/cama (ou no chão), segure um halter com as duas mãos.',
      'Leve o halter para trás da cabeça com cotovelos semi-flexionados até alongar.',
      'É uma das poucas opções para dorsal alongado sem barra fixa.',
    ],
    easier: 'No chão (amplitude menor)',
    harder: 'Pausa de 2 s no alongamento',
  },
  crucifixoinv: {
    name: 'Crucifixo invertido',
    muscles: { ombros: 0.5, costas: 0.5 },
    cues: [
      'Tronco quase paralelo ao chão, braços semi-flexionados.',
      'Abra os braços para os lados pensando em afastar os halteres, não em juntar escápulas.',
    ],
    easier: 'Peito apoiado no encosto de uma cadeira',
    harder: 'Pausa de 1 s em cima',
  },
  rosca: {
    name: 'Rosca alternada',
    muscles: { biceps: 1 },
    cues: [
      'Cotovelos fixos ao lado do corpo, gire a palma para cima ao subir.',
      'Estenda completamente o braço embaixo.',
    ],
    easier: 'Sentado',
    harder: 'Cotovelos levemente atrás do corpo (bíceps mais alongado)',
  },
  martelo: {
    name: 'Rosca martelo',
    muscles: { biceps: 1 },
    cues: [
      'Pegada neutra (palmas uma para a outra).',
      'Trabalha também braquial e braquiorradial (antebraço).',
    ],
    easier: 'Alternada',
    harder: 'Tempo 3 s na descida',
  },
  frances: {
    name: 'Tríceps francês (acima da cabeça)',
    muscles: { triceps: 1 },
    cues: [
      'Segure UM halter com as duas mãos atrás da cabeça.',
      'Desça até alongar bem o tríceps, cotovelos apontando para cima.',
      'Com o braço acima da cabeça o tríceps cresceu bem mais que na posição neutra (Maeo 2023).',
    ],
    easier: 'Sentado com apoio nas costas',
    harder: 'Unilateral',
  },
  testa: {
    name: 'Tríceps testa no chão',
    muscles: { triceps: 1 },
    cues: [
      'Deitado, halteres descem ao lado da cabeça (pegada neutra).',
      'Cotovelos apontando para o teto, só o antebraço se move.',
    ],
    easier: 'Tríceps coice',
    harder: 'Levar os halteres um pouco atrás da cabeça',
  },
  abdominal: {
    name: 'Abdominal com peso',
    muscles: { abdomen: 1 },
    cues: [
      'Halter no peito, enrole a coluna (costelas em direção ao quadril).',
      'Sem puxar o pescoço; expire na subida.',
    ],
    easier: 'Sem peso',
    harder: 'Halter com braços estendidos acima da cabeça',
  },
  prancha: {
    name: 'Dead bug com halter',
    muscles: { abdomen: 1 },
    unilateral: true,
    cues: [
      'Deitado, lombar colada no chão, um halter segurado com braços estendidos.',
      'Estenda uma perna de cada vez sem deixar a lombar descolar.',
    ],
    easier: 'Sem halter',
    harder: 'Halter mais pesado, pernas mais esticadas',
  },
  fazendeiro: {
    name: 'Caminhada do fazendeiro',
    muscles: { abdomen: 0.5 },
    repsUnit: 's',
    cues: [
      'Um halter pesado em cada mão, ombros para trás, ande em passos curtos.',
      'Ótimo para pegada, trapézio e estabilidade do tronco.',
    ],
    easier: 'Menos tempo',
    harder: 'Um halter só (carrega de mala) — mais oblíquos',
  },
};

// sets: número de séries; reps: [mín, máx]; rir: reps na reserva alvo; rest: segundos
const PLANS = {
  fb3: {
    name: 'Full Body 3x',
    tag: 'Recomendado para a maioria',
    schedule: 'Seg · Qua · Sex (ou qualquer 3 dias não seguidos)',
    duration: '50–60 min',
    description:
      'Corpo todo em cada sessão, cada músculo treinado 2–3x/semana. Ideal para iniciantes e intermediários e para quem tem pouco tempo.',
    days: [
      {
        id: 'A',
        name: 'Treino A',
        focus: 'Agachamento · Empurrar · Puxar',
        items: [
          { ex: 'goblet', sets: 4, reps: [10, 20], rir: '1–2', rest: 120 },
          { ex: 'floorpress', sets: 3, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'remada', sets: 3, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'rdl', sets: 4, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'lateral', sets: 3, reps: [12, 25], rir: '0–1', rest: 60 },
          { ex: 'frances', sets: 3, reps: [10, 20], rir: '0–1', rest: 75 },
          { ex: 'panturrilha', sets: 4, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'prancha', sets: 3, reps: [8, 12], rir: '2', rest: 45 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B',
        focus: 'Unilateral · Ombros · Glúteos',
        items: [
          { ex: 'bulgaro', sets: 3, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'desenvolvimento', sets: 3, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'remada1', sets: 3, reps: [8, 15], rir: '1–2', rest: 90 },
          { ex: 'hipthrust', sets: 3, reps: [10, 20], rir: '1–2', rest: 90 },
          { ex: 'flexao', sets: 3, reps: [6, 25], rir: '1–2', rest: 90 },
          { ex: 'rosca', sets: 3, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'abdominal', sets: 3, reps: [10, 20], rir: '1–2', rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C',
        focus: 'Posteriores · Dorsal alongado · Braços',
        items: [
          { ex: 'afundo', sets: 3, reps: [8, 15], rir: '1–2', rest: 90 },
          { ex: 'floorpress', sets: 3, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'pullover', sets: 3, reps: [10, 15], rir: '1–2', rest: 90 },
          { ex: 'rdl1', sets: 4, reps: [8, 15], rir: '1–2', rest: 90 },
          { ex: 'crucifixoinv', sets: 3, reps: [12, 25], rir: '0–1', rest: 60 },
          { ex: 'martelo', sets: 3, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'testa', sets: 3, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'panturrilha', sets: 4, reps: [10, 20], rir: '0–1', rest: 60 },
        ],
      },
    ],
  },
  ul4: {
    name: 'Superior / Inferior 4x',
    tag: 'Mais volume',
    schedule: 'Seg · Ter · Qui · Sex',
    duration: '45–55 min',
    description:
      'Divide membros superiores e inferiores, cada músculo 2x/semana com mais séries por sessão. Bom para quem já treina há 6+ meses ou quer mais volume.',
    days: [
      {
        id: 'S1',
        name: 'Superior 1',
        focus: 'Força de empurrar e puxar',
        items: [
          { ex: 'floorpress', sets: 4, reps: [6, 12], rir: '1–2', rest: 150 },
          { ex: 'remada', sets: 4, reps: [8, 12], rir: '1–2', rest: 120 },
          { ex: 'desenvolvimento', sets: 3, reps: [8, 12], rir: '1–2', rest: 120 },
          { ex: 'pullover', sets: 3, reps: [10, 15], rir: '1–2', rest: 90 },
          { ex: 'rosca', sets: 3, reps: [10, 15], rir: '0–1', rest: 60 },
          { ex: 'frances', sets: 3, reps: [10, 15], rir: '0–1', rest: 60 },
        ],
      },
      {
        id: 'I1',
        name: 'Inferior 1',
        focus: 'Quadríceps · Posteriores',
        items: [
          { ex: 'goblet', sets: 4, reps: [10, 20], rir: '1–2', rest: 120 },
          { ex: 'rdl', sets: 4, reps: [8, 12], rir: '1–2', rest: 120 },
          { ex: 'hipthrust', sets: 3, reps: [10, 20], rir: '1–2', rest: 90 },
          { ex: 'panturrilha', sets: 4, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'abdominal', sets: 3, reps: [10, 20], rir: '1–2', rest: 60 },
        ],
      },
      {
        id: 'S2',
        name: 'Superior 2',
        focus: 'Hipertrofia · Ombros e braços',
        items: [
          { ex: 'flexao', sets: 4, reps: [6, 25], rir: '1–2', rest: 90 },
          { ex: 'remada1', sets: 4, reps: [8, 15], rir: '1–2', rest: 90 },
          { ex: 'lateral', sets: 4, reps: [12, 25], rir: '0–1', rest: 60 },
          { ex: 'crucifixoinv', sets: 3, reps: [12, 25], rir: '0–1', rest: 60 },
          { ex: 'martelo', sets: 3, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'testa', sets: 3, reps: [10, 20], rir: '0–1', rest: 60 },
        ],
      },
      {
        id: 'I2',
        name: 'Inferior 2',
        focus: 'Unilateral · Glúteos',
        items: [
          { ex: 'bulgaro', sets: 4, reps: [8, 15], rir: '1–2', rest: 120 },
          { ex: 'rdl1', sets: 3, reps: [8, 15], rir: '1–2', rest: 90 },
          { ex: 'afundo', sets: 3, reps: [10, 15], rir: '1–2', rest: 90 },
          { ex: 'panturrilha', sets: 4, reps: [10, 20], rir: '0–1', rest: 60 },
          { ex: 'prancha', sets: 3, reps: [8, 12], rir: '2', rest: 45 },
          { ex: 'fazendeiro', sets: 2, reps: [30, 60], rir: '1–2', rest: 60 },
        ],
      },
    ],
  },
};

const PRINCIPLES = [
  {
    title: 'Volume: 10+ séries por músculo por semana',
    body:
      'Mais séries semanais produzem mais hipertrofia, com retorno decrescente. A faixa de ~10–20 séries por músculo é o ponto de partida mais usado. Os dois programas ficam nessa faixa (veja o gráfico na aba Programa).',
    refs: ['schoenfeld2017vol', 'pelland2024'],
  },
  {
    title: 'Frequência: cada músculo 2x por semana',
    body:
      'Com o volume igualado, a frequência importa pouco, mas treinar cada músculo pelo menos 2x/semana é uma forma prática de distribuir as séries com qualidade.',
    refs: ['schoenfeld2016freq', 'pelland2024'],
  },
  {
    title: 'Halteres leves funcionam — se você chegar perto da falha',
    body:
      'Cargas de ~30% a 85% de 1RM geram hipertrofia parecida quando as séries vão perto da falha. É por isso que aqui as faixas de reps chegam a 20–25: com halteres fixos, você compensa com repetições.',
    refs: ['schoenfeld2017load', 'lopez2021'],
  },
  {
    title: 'Proximidade da falha: 0–2 reps na reserva (RIR)',
    body:
      'Terminar a série sabendo que conseguiria mais 0–2 repetições. A hipertrofia aumenta conforme você chega mais perto da falha. Nos exercícios compostos use RIR 1–2 (mais seguro); nos isolados pode ir até a falha (RIR 0).',
    refs: ['refalo2023', 'robinson2024'],
  },
  {
    title: 'Progressão: carga OU repetições',
    body:
      'Aumentar repetições com a mesma carga gera resultados semelhantes a aumentar a carga. Use a dupla progressão: quando bater o topo da faixa em todas as séries, suba o peso. Sem peso maior? Mais reps, descida mais lenta ou pausas.',
    refs: ['plotkin2022'],
  },
  {
    title: 'Treine com o músculo alongado',
    body:
      'Exercícios e amplitudes que enfatizam a posição alongada (stiff, tríceps acima da cabeça, panturrilha com pausa embaixo, flexão com déficit) tendem a gerar mais hipertrofia. Nunca corte a parte de baixo do movimento.',
    refs: ['maeo2021', 'maeo2023', 'pedrosa2022', 'wolf2023'],
  },
  {
    title: 'Descanse o suficiente: 1–3 min',
    body:
      'Intervalos mais longos (~2–3 min) nos compostos permitem manter as reps e o volume. Em isolados, 60–90 s bastam. O cronômetro já vem configurado.',
    refs: ['schoenfeld2016rest', 'singer2024'],
  },
  {
    title: 'Aquecimento específico',
    body:
      'Aquecer melhora o desempenho. 5 minutos de movimento leve + 1–2 séries leves do primeiro exercício resolvem.',
    refs: ['fradkin2010'],
  },
  {
    title: 'Saúde: força + aeróbico',
    body:
      'A OMS recomenda fortalecimento muscular 2+ dias/semana e 150–300 min de atividade aeróbica moderada. Caminhar nos dias sem treino é um ótimo complemento.',
    refs: ['who2020'],
  },
];

const REFERENCES = {
  schoenfeld2017vol: 'Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. J Sports Sci. 2017;35(11):1073-1082.',
  pelland2024: 'Pelland JC et al. The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gain. SportRxiv (preprint), 2024.',
  schoenfeld2016freq: 'Schoenfeld BJ, Ogborn D, Krieger JW. Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. Sports Med. 2016;46(11):1689-1697.',
  schoenfeld2017load: 'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res. 2017;31(12):3508-3523.',
  lopez2021: 'Lopez P et al. Resistance training load effects on muscle hypertrophy and strength gain: systematic review and network meta-analysis. Med Sci Sports Exerc. 2021;53(6):1206-1216.',
  refalo2023: 'Refalo MC et al. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med. 2023;53(3):649-665.',
  robinson2024: 'Robinson ZP et al. Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions. Sports Med. 2024;54(9):2209-2231.',
  plotkin2022: 'Plotkin D et al. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ. 2022;10:e14142.',
  maeo2021: 'Maeo S et al. Greater hamstrings muscle hypertrophy but similar damage protection after training at long versus short muscle lengths. Med Sci Sports Exerc. 2021;53(4):825-837.',
  maeo2023: 'Maeo S et al. Triceps brachii hypertrophy is substantially greater after elbow extension training performed in the overhead versus neutral arm position. Eur J Sport Sci. 2023;23(7):1240-1250.',
  pedrosa2022: 'Pedrosa GF et al. Partial range of motion training elicits favorable improvements in muscular adaptations when carried out at long muscle lengths. Eur J Sport Sci. 2022;22(8):1250-1260.',
  wolf2023: 'Wolf M et al. Partial vs full range of motion resistance training: a systematic review and meta-analysis. Int J Strength Cond. 2023;3(1).',
  schoenfeld2016rest: 'Schoenfeld BJ et al. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res. 2016;30(7):1805-1812.',
  singer2024: 'Singer A et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. Front Sports Act Living. 2024;6:1429789.',
  fradkin2010: 'Fradkin AJ, Zazryn TR, Smoliga JM. Effects of warming-up on physical performance: a systematic review with meta-analysis. J Strength Cond Res. 2010;24(1):140-148.',
  who2020: 'Bull FC et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med. 2020;54(24):1451-1462.',
};
