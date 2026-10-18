<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { animals, questionBank } from './data/questions.js';
import { answerRound, createRound, getAward, nextRound } from './game.js';
import Icon from './components/Icon.vue';

const screen = ref('home');
const round = ref(null);
const sound = ref(false);
const fullscreen = ref(false);
const toast = ref('');
const helpOpen = ref(false);
const selectedAnimal = ref(null);
const countScore = ref(0);
const focusHeading = ref(null);
let selectTimer, toastTimer, scoreFrame, audio;
let returnFocus;
const base = import.meta.env.BASE_URL;
const animalImage = id => window.__ANIMAL_ASSETS__?.[id] || `${base}animals/${id}.svg`;
const animal = computed(() => animals.find(a => a.id === round.value?.animalId));
const question = computed(() => round.value?.questions[round.value.currentIndex]);
const answered = computed(() => round.value && round.value.answers.length > round.value.currentIndex);
const correct = computed(() => answered.value && round.value.answers[round.value.currentIndex] === question.value.answer);
const award = computed(() => getAward(round.value?.score || 0));
const progress = computed(() => round.value ? round.value.answers.length / round.value.questions.length * 100 : 0);
const themes = { chicken: { label: '奇妙的产蛋专家', tag: '发现小鸡的大秘密', color: '#f9e5ae' }, duck: { label: '水上的游泳健将', tag: '认识海南嘉积鸭', color: '#d6eadb' }, pig: { label: '聪明的嗅觉达人', tag: '解锁猪猪的超能力', color: '#f6d6cf' }, goat: { label: '草地上的反刍高手', tag: '遇见海南黑山羊', color: '#e6dfef' }, goose: { label: '优雅的草食选手', tag: '探索鹅鹅的世界', color: '#d6e9ee' } };

function showToast(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 2800); }
function playTone(success = true) {
  if (!sound.value) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const now = audio.currentTime;
    (success ? [523.25, 659.25, 783.99] : [294, 247]).forEach((frequency, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'sine'; osc.frequency.value = frequency;
      osc.connect(gain); gain.connect(audio.destination);
      gain.gain.setValueAtTime(0, now + i * .09);
      gain.gain.linearRampToValueAtTime(.07, now + i * .09 + .01);
      gain.gain.exponentialRampToValueAtTime(.001, now + i * .09 + .22);
      osc.start(now + i * .09); osc.stop(now + i * .09 + .24);
    });
  } catch { showToast('当前浏览器暂不支持音效'); sound.value = false; }
}
function toggleSound() { sound.value = !sound.value; if (sound.value) playTone(); }
async function moveFocus() { await nextTick(); if (helpOpen.value) document.querySelector('.close-dialog')?.focus(); else focusHeading.value?.focus({ preventScroll: true }); }
function start(id) {
  if (selectedAnimal.value) return;
  selectedAnimal.value = id;
  selectTimer = setTimeout(() => {
    round.value = createRound(id, questionBank); screen.value = 'quiz'; selectedAnimal.value = null; moveFocus();
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
}
function home() { clearTimeout(selectTimer); selectedAnimal.value = null; cancelAnimationFrame(scoreFrame); screen.value = 'home'; round.value = null; moveFocus(); }
function choose(index) {
  const previous = round.value;
  round.value = answerRound(round.value, index);
  if (previous !== round.value) playTone(correct.value);
}
function advance() {
  round.value = nextRound(round.value);
  if (round.value.status === 'result') { screen.value = 'result'; animateScore(); }
  moveFocus();
}
function animateScore() {
  countScore.value = 0;
  const target = round.value.score;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { countScore.value = target; return; }
  const began = performance.now();
  function tick(now) { const t = Math.min((now - began) / 900, 1); countScore.value = Math.round(target * (1 - Math.pow(1 - t, 3))); if (t < 1) scoreFrame = requestAnimationFrame(tick); }
  scoreFrame = requestAnimationFrame(tick);
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else { showToast('当前浏览器不支持全屏，可使用浏览器的全屏或添加到主屏幕'); return; }
  } catch { showToast('全屏暂不可用，普通窗口也可以畅玩'); }
}
function syncFullscreen() { fullscreen.value = !!document.fullscreenElement; }
function keyHandler(event) {
  if (!helpOpen.value) return;
  if (event.key === 'Escape') helpOpen.value = false;
  if (event.key === 'Tab') {
    const buttons = document.querySelectorAll('.help-dialog button');
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
}
watch(helpOpen, async open => {
  if (open) { returnFocus = document.activeElement; await nextTick(); document.querySelector('.close-dialog')?.focus(); }
  else { await nextTick(); returnFocus?.focus(); }
});
onMounted(() => { document.addEventListener('fullscreenchange', syncFullscreen); document.addEventListener('keydown', keyHandler); });
onBeforeUnmount(() => { clearTimeout(selectTimer); clearTimeout(toastTimer); cancelAnimationFrame(scoreFrame); audio?.close(); document.removeEventListener('fullscreenchange', syncFullscreen); document.removeEventListener('keydown', keyHandler); });
</script>

<template>
  <div class="app-shell" :class="'screen-' + screen">
    <div class="top-stripe"></div>
    <header class="site-header">
      <a class="brand" href="#" @click.prevent="home" aria-label="海南动物科学知识大挑战首页">
        <span class="brand-mark"><Icon name="leaf" :size="26" /></span>
        <span><strong>中国农业大学<span class="brand-divider"> / </span>动物嘉年华</strong><small>CHINA AGRICULTURAL UNIVERSITY · 2026</small></span>
      </a>
      <div class="header-actions">
        <span class="exhibition-badge"><i></i> 海南特色畜禽展台</span>
        <button class="icon-button" @click="toggleSound" :aria-label="sound ? '关闭音效' : '开启音效'" :aria-pressed="sound" :title="sound ? '关闭音效' : '开启音效'"><Icon :name="sound ? 'volume' : 'mute'" /></button>
        <button class="fullscreen-button" @click="toggleFullscreen" :aria-label="fullscreen ? '退出全屏' : '进入全屏'"><Icon name="expand" :size="18" /><span>{{ fullscreen ? '退出全屏' : '全屏体验' }}</span></button>
      </div>
    </header>

    <main>
      <Transition name="page" mode="out-in" @after-enter="moveFocus">
        <section v-if="screen === 'home'" key="home" class="home-page" aria-label="动物选择">
          <div class="hero">
            <span class="hero-orbit orbit-one" aria-hidden="true">✧</span><span class="hero-orbit orbit-two" aria-hidden="true">✳</span>
            <span class="hero-label"><span>18°N</span> 一场来自海南的知识冒险 <Icon name="leaf" :size="14" /></span>
            <h1 ref="focusHeading" tabindex="-1">海南动物科学<span class="title-second">知识大挑战<span class="title-sun" aria-hidden="true">✺</span></span></h1>
            <p>探索动物的奇妙世界，开启你的知识冒险！</p>
            <div class="hero-meta"><span><Icon name="clock" :size="16" /> 约 1–3 分钟</span><i></i><span><Icon name="book" :size="16" /> 每关 5 道趣味问答</span><i></i><span><Icon name="spark" :size="16" /> 好奇心满分</span></div>
            <svg class="palm palm-left" viewBox="0 0 180 210" aria-hidden="true"><path d="M96 200c-1-70-7-115-23-150" fill="none" stroke="#cbd4b9" stroke-width="9"/><path d="M76 56C26 23 5 44 3 64c30-6 50-2 73-8ZM73 52C37 2 62-5 88 3c-4 16-7 32-15 49ZM74 51c23-51 58-48 70-26-30 2-46 9-70 26ZM77 55c58-22 91 4 93 28-35-19-62-24-93-28ZM72 56C29 62 13 91 24 119c9-30 25-48 48-63Z" fill="#dce4ce"/></svg>
            <svg class="palm palm-right" viewBox="0 0 180 210" aria-hidden="true"><path d="M96 200c-1-70-7-115-23-150" fill="none" stroke="#cbd4b9" stroke-width="9"/><path d="M76 56C26 23 5 44 3 64c30-6 50-2 73-8ZM73 52C37 2 62-5 88 3c-4 16-7 32-15 49ZM74 51c23-51 58-48 70-26-30 2-46 9-70 26ZM77 55c58-22 91 4 93 28-35-19-62-24-93-28ZM72 56C29 62 13 91 24 119c9-30 25-48 48-63Z" fill="#dce4ce"/></svg>
          </div>

          <div class="selection-heading"><div><span class="section-number">01 /</span><h2>选择你的动物伙伴</h2><span class="selection-note">从一份好奇开始</span></div><span class="tap-hint">轻触卡片，开启挑战 <Icon name="arrow" :size="17" /></span></div>
          <div class="animal-grid">
            <button v-for="(item, index) in animals" :key="item.id" class="animal-card" :class="[{ 'is-selected': selectedAnimal === item.id, 'is-dimmed': selectedAnimal && selectedAnimal !== item.id }, item.id]" :style="{ '--card-color': themes[item.id].color, '--delay': index * 65 + 'ms' }" @click="start(item.id)" :aria-label="'开始' + item.title">
              <div class="card-topline"><span>伙伴 {{ String(index + 1).padStart(2, '0') }}</span><span class="card-corner"><Icon name="arrow" :size="16" /></span></div>
              <div class="animal-art"><span class="art-circle"></span><span class="art-spark" aria-hidden="true">✧</span><img :src="animalImage(item.id)" :alt="item.name + '卡通插画'" width="300" height="260" draggable="false" /></div>
              <div class="card-copy"><span class="animal-kicker">{{ themes[item.id].label }}</span><h3>{{ item.title }}</h3><p>{{ themes[item.id].tag }}</p><div class="card-bottom"><span>5 道题 · 100 分</span><span class="card-start">开始探索 <Icon name="arrow" :size="15" /></span></div></div>
            </button>
          </div>
          <div class="home-bottom"><span><Icon name="leaf" :size="17" /> 在这里，每一份好奇都值得被鼓励。</span><button class="text-button" @click="helpOpen = true">怎么玩 <span>?</span></button></div>
        </section>

        <section v-else-if="screen === 'quiz'" key="quiz" class="quiz-page" :style="{ '--animal-color': themes[animal.id].color }" aria-label="答题关卡">
          <div class="game-toolbar"><button class="back-button" @click="home"><Icon name="back" :size="18" /> 返回动物选择</button><span class="round-label">知识探险进行中</span><div class="score-pill"><Icon name="spark" :size="19" /> <strong>{{ round.score }}</strong><span>分</span></div></div>
          <div class="game-layout">
            <aside class="companion-panel"><div class="companion-top"><span class="eyebrow">YOUR EXPLORATION BUDDY</span><h2>{{ animal.title }}</h2><p>{{ themes[animal.id].label }}</p></div><div class="companion-art" :class="{ celebrate: answered && correct }"><span class="companion-circle"></span><img :src="animalImage(animal.id)" :alt="animal.name" /><span class="companion-spark">✧</span></div><div class="buddy-message"><Icon name="leaf" :size="18" /><span>{{ answered ? (correct ? '你发现了一个新知识，真棒！' : '带上新知识，继续出发吧！') : '准备好了吗？一起发现我的小秘密。' }}</span></div><div class="island-coordinates">HAINAN ISLAND <span>18°N · 109°E</span></div></aside>
            <div class="question-panel"><div class="question-progress"><span>探索进度</span><strong>{{ String(round.currentIndex + 1).padStart(2, '0') }} <span>/ 05</span></strong></div><div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" aria-label="答题完成进度"><div :style="{ width: progress + '%' }"></div></div>
              <Transition name="question" mode="out-in" @after-enter="moveFocus"><div :key="question.id" class="question-content"><span class="question-type">单选题 <i></i> 每题 20 分</span><h1 ref="focusHeading" tabindex="-1" class="question-title">{{ question.question }}</h1><div class="options"><button v-for="(option, index) in question.options" :key="index" class="option-button" :class="{ 'option-correct': answered && index === question.answer, 'option-wrong': answered && index === round.answers[round.currentIndex] && !correct, 'option-muted': answered && index !== question.answer && index !== round.answers[round.currentIndex] }" @click="choose(index)" :disabled="answered"><span class="option-letter">{{ 'ABC'[index] }}</span><span class="option-text">{{ option }}</span><Icon v-if="answered && index === question.answer" name="check" :size="23" /><Icon v-else-if="answered && index === round.answers[round.currentIndex]" name="close" :size="23" /></button></div>
                <div class="feedback-area" aria-live="polite" aria-atomic="true"><div v-if="answered" class="answer-feedback" :class="correct ? 'feedback-success' : 'feedback-learn'"><div class="feedback-icon"><Icon :name="correct ? 'spark' : 'book'" :size="20" /></div><div><strong>{{ correct ? '答对啦！好奇心 +20 分' : `又学到新知识！正确答案是 ${'ABC'[question.answer]}` }}</strong><p>{{ question.explanation }}</p></div><span v-if="correct" class="tiny-stars" aria-hidden="true">✧</span></div><div v-else class="answer-prompt"><Icon name="spark" :size="16" /> 跟着你的好奇心，选择一个答案吧。</div></div>
                <button class="primary-button next-button" :disabled="!answered" @click="advance">{{ round.currentIndex === 4 ? '查看我的探险成果' : '下一题，继续探索' }}<Icon name="arrow" :size="20" /></button>
              </div></Transition>
            </div>
          </div>
        </section>

        <section v-else key="result" class="result-page" aria-label="挑战结果">
          <div class="confetti" aria-hidden="true"><i v-for="n in 24" :key="n" :style="{ '--n': n, left: (n * 37 % 100) + '%', background: ['#f6c35b', '#7cb795', '#e9a89b', '#a9cbd7'][n % 4] }"></i></div>
          <span class="hero-label"><Icon name="check" :size="16" /> 本次知识冒险，圆满完成</span><h1 ref="focusHeading" tabindex="-1">好奇心，让你闪闪发光！</h1><div class="result-card"><div class="result-illustration" :style="{ '--animal-color': themes[animal.id].color }"><div class="result-animal-circle"></div><img :src="animalImage(animal.id)" :alt="animal.name + '为你庆祝'" /><span class="result-spark spark-a">✦</span><span class="result-spark spark-b">✧</span><span class="result-animal-title">{{ animal.title }} · 挑战完成</span></div><div class="result-details"><span class="eyebrow">EXPLORATION COMPLETE</span><div class="result-stars" :aria-label="award.stars + '颗星'"><span v-for="n in 3" :key="n" :class="{ unlit: n > award.stars }">★</span></div><h2>{{ award.title }}</h2><div class="result-score"><strong>{{ countScore }}</strong><span>/ 100 分</span></div><p class="result-correct">答对 <strong>{{ round.score / 20 }}</strong> / 5 题 <i></i> 收获 5 个动物科学小知识</p><p class="award-message">{{ award.message }}</p></div></div><div class="result-actions"><button class="primary-button" @click="start(animal.id)"><Icon name="refresh" /> 再挑战一次</button><button class="secondary-button" @click="home">探索其他动物 <Icon name="arrow" :size="18" /></button></div><p class="result-footer">知识的旅程从不结束，下一个动物伙伴正等着你。</p>
        </section>
      </Transition>
    </main>

    <footer class="site-footer"><span>中国农业大学动物科学技术学院 <span class="footer-dot">·</span> 中国农业大学三亚研究院</span><span class="footer-note">以科学之名，发现生命之趣 <Icon name="leaf" :size="13" /></span></footer>
    <Transition name="toast"><div v-if="toast" class="toast-message" role="status">{{ toast }}</div></Transition>
    <div v-if="helpOpen" class="modal-backdrop" @click.self="helpOpen = false"><section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><button class="icon-button close-dialog" @click="helpOpen = false" aria-label="关闭玩法说明"><Icon name="close" /></button><span class="hero-label">好奇心，就是你的通行证</span><h2 id="help-title">你的探险指南</h2><ol><li><strong>选一位动物伙伴</strong><span>鸡、鸭、猪、羊、鹅，哪个让你好奇？</span></li><li><strong>挑战 5 道趣味问答</strong><span>每题选一个答案，答对得 20 分。</span></li><li><strong>发现知识，收获称号</strong><span>读一读科普解析，看看你的探险成果。</span></li></ol><button class="primary-button" @click="helpOpen = false">明白了，出发！<Icon name="arrow" /></button></section></div>
  </div>
</template>
