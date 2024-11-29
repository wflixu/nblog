<template>
   <div class="code" v-html="htmlStr">

   </div>
</template>

<script setup>
import { codeToHtml } from 'shiki'
import { ref } from 'vue'


const props = defineProps({
   rich_text: Array,
   language: String
})
const code = props.rich_text.reduce((prev, cur) => {
   return prev + cur.plain_text + "\n"
}, "")

const htmlStr = ref("")

codeToHtml(code, {
   lang: props.language,
   // https://shiki.style/themes
   theme: 'min-light'
}).then(data => {
   htmlStr.value = data
})





</script>

<style scoped>
.code {
   font-size: 16px;
   line-height: 1.5;
   border: 1px solid lightgrey;
   padding: 0 16px;
   background-color: #ffffff;
   overflow-x: auto;

   pre {
      line-height: 1;
      padding: 0;
      margin: 0;
   }

   code {
      padding: 0;
      margin: 0;
      line-height: 1.5;
      text-align: left;
   }
}
</style>