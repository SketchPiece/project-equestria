<template>
  <button
    :disabled="disabled"
    @click="onClick"
    :class="['launch-button', { active, enabled: !disabled }]"
  >
    <div />
  </button>
</template>

<script>
export default {
  props: {
    disabled: Boolean
  },
  data: () => ({
    active: false
  }),
  methods: {
    onClick() {
      this.active = true
      this.$emit('click')
      setTimeout(() => {
        this.active = false
      }, 600)
    }
  }
}
</script>

<style lang="scss" scoped>
.launch-button {
  $button-size: 125px;
  $transition-duration: 0.6s;
  width: $button-size;
  height: $button-size;
  border: 9px solid rgba(55, 50, 56, 1);
  background: #ce8967;
  border-radius: 50%;
  position: absolute;
  box-sizing: border-box;
  // left: -$button-size / 2 + 6px;
  left: -$button-size / 2 + 5px;
  top: calc(100% / 2 - 125px / 2);
  outline: none;
  transition: $transition-duration;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: none;
  z-index: 2;
  div {
    transition: $transition-duration;
    $play-size: 100px;
    width: $play-size;
    height: $play-size;
    background: url('../assets/play.png') no-repeat center center / 100%;
  }
  &.active {
    $button-size: 180px;
    width: $button-size;
    height: $button-size;
    background-size: 60%;
    top: calc(100% / 2 - 180px / 2);
    left: -$button-size / 2 + 5px;
    div {
      $play-size: 80px;
      width: $play-size;
      height: $play-size;
    }
    // background: red;
  }
  &.active {
    $button-size: 180px;
    width: $button-size;
    height: $button-size;
    background-size: 60%;
    top: calc(100% / 2 - 180px / 2);
    left: -$button-size / 2 + 5px;
    div {
      $play-size: 80px;
      width: $play-size;
      height: $play-size;
    }
    // background: red;
  }
  &.enabled:active {
    $button-size: 180px;
    width: $button-size;
    height: $button-size;
    background-size: 60%;
    top: calc(100% / 2 - 180px / 2);
    left: -$button-size / 2 + 5px;
    div {
      $play-size: 80px;
      width: $play-size;
      height: $play-size;
    }
    // background: red;
  }
}
</style>
