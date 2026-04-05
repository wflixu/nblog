<template>
  <div class="equation-container" :class="props.type === 'inline' ? 'inline' : 'block'">
    <span ref="equationRef" class="equation-content">{{ props.expression }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  expression: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'block'
  }
})

const { isDark } = useData()
const equationRef = ref(null)

const renderEquation = async () => {
  if (!equationRef.value) return

  // 检查 KaTeX 是否已加载
  if (typeof window !== 'undefined' && window.katex) {
    try {
      window.katex.render(props.expression, equationRef.value, {
        displayMode: props.type !== 'inline',
        throwOnError: false,
        output: 'html',
        textColor: isDark.value ? '#e5e5e5' : '#374151'
      })
    } catch (error) {
      console.error('KaTeX render error:', error)
      equationRef.value.textContent = props.expression
    }
  }
}

// 加载 KaTeX CSS 和 JS
const loadKaTeX = () => {
  return new Promise((resolve, reject) => {
    // 如果已经加载过，直接解析
    if (typeof window !== 'undefined' && window.katex) {
      resolve()
      return
    }

    // 加载 CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
    link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV'
    link.crossOrigin = 'anonymous'
    link.onload = () => {
      // 加载 JS
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
      script.integrity = 'sha384-XjKyOOdB7E51B+JnDssbRvRLPPvYUEfKdH1FNgY1w8J7D2xVZqchc2PZg7xRq7WU'
      script.crossOrigin = 'anonymous'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    }
    link.onerror = reject
    document.head.appendChild(link)
  })
}

onMounted(async () => {
  try {
    await loadKaTeX()
    await renderEquation()
  } catch (error) {
    console.error('Failed to load KaTeX:', error)
    if (equationRef.value) {
      equationRef.value.textContent = props.expression
    }
  }
})

watch(() => props.expression, renderEquation)
watch(isDark, renderEquation)
</script>

<style scoped>
.equation-container {
  font-family: 'KaTeX_Main', 'Times New Roman', serif;
}

.equation-container.inline {
  display: inline;
  font-size: 1.1em;
}

.equation-container.block {
  display: block;
  margin: 24px 0;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px 0;
}

:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 0;
  padding: 0;
}

.dark :deep(.katex) {
  color: #e5e5e5;
}

:deep(.katex) {
  color: #374151;
}
</style>
