export function shuffleQuestions(items, random = Math.random) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createRound(animalId, bank) {
  if (!bank[animalId]?.length) throw new Error('未知的动物关卡');
  return { animalId, questions: shuffleQuestions(bank[animalId]), currentIndex: 0, answers: [], score: 0, status: 'playing' };
}

export function answerRound(round, index) {
  if (!round || round.status !== 'playing' || round.answers.length > round.currentIndex || !Number.isInteger(index) || index < 0 || index > 2) return round;
  return { ...round, answers: [...round.answers, index], score: round.score + (index === round.questions[round.currentIndex].answer ? 20 : 0) };
}

export function nextRound(round) {
  if (!round || round.status !== 'playing' || round.answers.length <= round.currentIndex) return round;
  return round.currentIndex === round.questions.length - 1
    ? { ...round, status: 'result' }
    : { ...round, currentIndex: round.currentIndex + 1 };
}

export function getAward(score) {
  if (score === 100) return { title: '动物科学大师', message: '满分通关！你的好奇心，正闪闪发光。', stars: 3 };
  if (score >= 80) return { title: '动物知识达人', message: '太棒了！你离动物科学大师只差一步。', stars: 3 };
  if (score >= 60) return { title: '动物探索新星', message: '每一次探索，都让你离动物世界更近一点。', stars: 2 };
  return { title: '动物世界探险家', message: '发现新知识，就是这场冒险最棒的收获！', stars: 1 };
}
