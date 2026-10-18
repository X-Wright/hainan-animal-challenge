import test from 'node:test'
import assert from 'node:assert/strict'
import { animals, questionBank } from '../src/data/questions.js'

const officialAnswers = {
  chicken: [0, 1, 2, 0, 1],
  duck: [1, 2, 0, 1, 0],
  pig: [1, 2, 0, 1, 2],
  goat: [1, 2, 0, 0, 1],
  goose: [0, 1, 2, 1, 0],
}

test('全部五种动物均有且仅有五道完整单选题，答案与正式题库一致', () => {
  assert.deepEqual(animals.map(({ id }) => id), Object.keys(officialAnswers))
  assert.deepEqual(Object.keys(questionBank), Object.keys(officialAnswers))
  const questionIds = new Set()
  const questionTexts = new Set()

  for (const [animalId, answers] of Object.entries(officialAnswers)) {
    const questions = questionBank[animalId]
    assert.equal(questions.length, 5, `${animalId} 应有 5 题`)
    assert.deepEqual(questions.map(({ answer }) => answer), answers)

    for (const question of questions) {
      assert.ok(question.id && !questionIds.has(question.id), '每题 ID 必须唯一')
      assert.ok(question.question && !questionTexts.has(question.question), '题目不得重复或缺失')
      assert.equal(question.options.length, 3, '每题必须有 3 个选项')
      assert.equal(new Set(question.options).size, 3, '选项不得重复')
      assert.ok(question.options.every((option) => typeof option === 'string' && option.trim()))
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 3)
      assert.ok(typeof question.explanation === 'string' && question.explanation.trim())
      questionIds.add(question.id)
      questionTexts.add(question.question)
    }
  }

  assert.equal(questionIds.size, 25)
})
