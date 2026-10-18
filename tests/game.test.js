import test from 'node:test';
import assert from 'node:assert/strict';
import { questionBank } from '../src/data/questions.js';
import { answerRound, createRound, getAward, nextRound, shuffleQuestions } from '../src/game.js';

test('打乱保留所有题目，不修改原数组，并接受确定性的随机函数', () => {
  const source = Object.freeze(['q1', 'q2', 'q3', 'q4', 'q5']);
  const shuffled = shuffleQuestions(source, () => 0);
  assert.notStrictEqual(shuffled, source);
  assert.deepEqual(source, ['q1', 'q2', 'q3', 'q4', 'q5']);
  assert.deepEqual(shuffled, ['q2', 'q3', 'q4', 'q5', 'q1']);
  assert.deepEqual([...shuffled].sort(), [...source].sort());
  assert.deepEqual(shuffleQuestions([]), []);
  assert.deepEqual(shuffleQuestions(['q1']), ['q1']);
});

test('创建关卡初始化为零分，题目完整并与题库数组隔离', () => {
  for (const animalId of Object.keys(questionBank)) {
    const round = createRound(animalId, questionBank);
    assert.equal(round.animalId, animalId);
    assert.equal(round.status, 'playing');
    assert.equal(round.currentIndex, 0);
    assert.equal(round.score, 0);
    assert.deepEqual(round.answers, []);
    assert.notStrictEqual(round.questions, questionBank[animalId]);
    assert.deepEqual(round.questions.map(q => q.id).sort(), questionBank[animalId].map(q => q.id).sort());
  }
  assert.throws(() => createRound('unknown', questionBank), /未知的动物关卡/);
});

test('正确答案计 20 分，错误答案计零分，作答操作不修改旧状态', () => {
  const initial = createRound('chicken', questionBank);
  const snapshot = structuredClone(initial);
  const answer = initial.questions[0].answer;
  const correct = answerRound(initial, answer);
  const incorrect = answerRound(initial, (answer + 1) % 3);
  assert.equal(correct.score, 20);
  assert.deepEqual(correct.answers, [answer]);
  assert.equal(incorrect.score, 0);
  assert.deepEqual(initial, snapshot);
  assert.notStrictEqual(correct, initial);
});

test('同一题双击或改选都不会重复计分或覆盖第一次答案', () => {
  const initial = createRound('duck', questionBank);
  const answer = initial.questions[0].answer;
  const answered = answerRound(initial, answer);
  assert.strictEqual(answerRound(answered, answer), answered);
  assert.strictEqual(answerRound(answered, (answer + 1) % 3), answered);
  assert.equal(answered.score, 20);
  assert.deepEqual(answered.answers, [answer]);
});

test('非法答案全部忽略，不会锁定题目或改变分数', () => {
  const round = createRound('pig', questionBank);
  for (const invalid of [-1, 3, 100, 0.5, NaN, Infinity, undefined, null, '0', true, {}]) {
    assert.strictEqual(answerRound(round, invalid), round);
  }
  assert.deepEqual(round.answers, []);
  assert.equal(round.score, 0);
});

test('未作答不能前进；作答后的前进不修改旧状态', () => {
  const initial = createRound('goat', questionBank);
  assert.strictEqual(nextRound(initial), initial);
  const answered = answerRound(initial, initial.questions[0].answer);
  const snapshot = structuredClone(answered);
  const next = nextRound(answered);
  assert.equal(next.currentIndex, 1);
  assert.equal(next.score, 20);
  assert.equal(next.status, 'playing');
  assert.deepEqual(answered, snapshot);
  assert.strictEqual(nextRound(next), next);
});

for (const animalId of Object.keys(questionBank)) {
  for (const allCorrect of [true, false]) {
    test(`${animalId} 五题${allCorrect ? '全对为 100' : '全错为 0'}分，第五题后完成关卡`, () => {
      let round = createRound(animalId, questionBank);
      for (let i = 0; i < 5; i++) {
        assert.equal(round.currentIndex, i);
        assert.equal(round.status, 'playing');
        const answer = round.questions[i].answer;
        round = answerRound(round, allCorrect ? answer : (answer + 1) % 3);
        assert.equal(round.score, allCorrect ? (i + 1) * 20 : 0);
        round = nextRound(round);
      }
      assert.equal(round.status, 'result');
      assert.equal(round.score, allCorrect ? 100 : 0);
      assert.equal(round.answers.length, 5);
      assert.strictEqual(nextRound(round), round);
      assert.strictEqual(answerRound(round, 0), round);
    });
  }
}

test('成绩称号覆盖任务书规定的所有分数档位', () => {
  const expected = [
    [0, '动物世界探险家'], [20, '动物世界探险家'], [40, '动物世界探险家'],
    [60, '动物探索新星'], [80, '动物知识达人'], [100, '动物科学大师'],
  ];
  expected.forEach(([score, title]) => {
    assert.equal(getAward(score).title, title);
    assert.ok(getAward(score).message);
  });
});
