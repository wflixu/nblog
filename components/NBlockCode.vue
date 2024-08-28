<template>
   <div class="code">
      <pre>
         <code>
            <NRichText v-for="rtext in props.rich_text"  v-bind="rtext" ></NRichText>
         </code>
      </pre>
   </div>
</template>

<script setup >


const props = defineProps({
   rich_text: Array,
})

definePageMeta({
   key:""
})
</script>

<style scoped>
 .code {
   font-size: 16px;
   line-height: 1.5;
   border: 1px solid lightgrey;
   padding: 0 16px;
   background-color: #FAFAFA;
   pre {
      line-height: 1;
      padding:0;
      margin:0;
   }
   code {
      padding:0;
      margin:0;
      line-height: 1.5;
   }
 }
</style>