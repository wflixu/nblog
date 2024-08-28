<script setup lang="ts">

</script>
<template>

  <header>
    <div class="logo">
      <NuxtImg src="/imgs/logo.png" width="24" height="24" />
      <span>
        Today blog
      </span>
    </div>
    <div class="nav">
      <NuxtLink to="/">
        Home
      </NuxtLink>
      <NuxtLink to="/about">
        About
      </NuxtLink>
      <NuxtLink to="https://github.com/wflixu" target="_blank">
        <Icon name="uil:github" style="color: black" />
      </NuxtLink>
    </div>

  </header>
  <main>
    <slot></slot>
  </main>
  <footer>

  </footer>
</template>
<style scoped>
header {
  height: 48px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  align-items: center;
  .nav {
    display: inline-flex;
    align-items: center;
    gap: 16px;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
}
</style>