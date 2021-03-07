<template>
  <header>
    <span class="title">Pocket Equestria Launcher v{{ version }}</span>
    <div class="buttons">
      <button @click="$emit('minimize')" class="circle min"></button>
      <button @click="$emit('close')" class="circle close"></button>
    </div>
  </header>
</template>

<script>
export default {
  props: {
    version: String
  }
}
</script>

<style lang="scss" scoped>
header {
  display: flex;
  height: 45px;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  border-top-right-radius: 50px;
  padding-left: 30px;
  padding-top: 5px;
  * {
    z-index: 1000;
  }
}

.buttons {
  // padding-left: 5px;
  -webkit-app-region: no-drag;
  margin-top: -5px;
  margin-right: 20px;
  width: 50px;
  display: flex;
  justify-content: space-between;

  .circle {
    width: 19px;
    height: 19px;
    border: none;
    border-radius: 50%;
    padding: 0;
    outline: none;
    margin: 3px 1px;
    transition: 0.2s;
    &:active {
      opacity: 0.5;
    }
    &.close {
      background-color: #b0322f;
    }
    &.min {
      background-color: #ce8967;
    }
    &:active {
      opacity: 0.5;
    }
  }
}
.title {
  font-size: 15px;
  color: #ffd96e;
}
</style>
