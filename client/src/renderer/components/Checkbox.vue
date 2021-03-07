<template>
  <label for="remember-pass" class="check-remember">
    <input
      type="checkbox"
      id="remember-pass"
      :disabled="disabled"
      v-model="state"
      @change="onChange"
    />
    <span> <slot /> </span>
  </label>
</template>

<script>
export default {
  props: {
    disabled: Boolean,
    value: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    state: false
  }),
  watch: {
    value(state) {
      this.state = state
    }
  },
  methods: {
    onChange() {
      this.$emit('input', this.state)
    }
  }
}
</script>

<style lang="scss" scoped>
.check-remember {
  font-size: 12px;
  margin: 10px 0px;
  display: flex;
  align-items: center;
  margin-left: -30px;
  > input {
    position: relative;
    appearance: none;
    background: none;
    width: 22px;
    height: 22px;
    outline: none;
    &::before {
      position: absolute;
      content: '';
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      // width: 23px;
      // height: 23px;
      // box-sizing: border-box;
      border: 3px solid #373238;
      background-color: #8b606a;
      border-radius: 50%;
    }
    &::after {
      transition: 0.4s;
      position: absolute;
      content: '';
      $size: 15px;
      top: $size;
      left: $size;
      right: $size;
      bottom: $size;
      border-radius: 50%;
      background-color: #ffd96e;
    }
    &:checked {
      &::after {
        position: absolute;
        content: '';
        $size: 5px;
        top: $size;
        left: $size;
        right: $size;
        bottom: $size;
        border-radius: 50%;
        background-color: #ffd96e;
      }
    }
  }
}
</style>
