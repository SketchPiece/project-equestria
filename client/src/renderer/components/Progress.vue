<template>
  <div :style="{ width: `${width}px` }" class="progress-wrap">
    <div :style="{ width: `${calcPercent}px` }" class="progress"></div>
  </div>
</template>

<script>
export default {
  props: {
    percent: Number
  },
  data: () => ({
    width: 270
  }),
  computed: {
    calcPercent() {
      return (this.percent / 100) * this.width
    }
  }
}
</script>

<style lang="scss" scoped>
.progress-wrap {
  height: 30px;
  background: #8b606a;
  margin-left: 10px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  overflow: hidden;
}

.progress {
  background-color: #ffd96e;
  height: 100%;
  transition: 0.3s ease-in;
}
</style>
