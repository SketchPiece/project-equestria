<template>
  <div class="App">
    <Frame @minimize="onMin" @close="onClose" :version="version" />
    <router-view />
  </div>
</template>

<script>
import Frame from './components/Frame'
import { remote } from 'electron'
import { isDev } from './core/utils'
const app = remote.app

export default {
  name: 'sketch-launcher',
  components: {
    Frame
  },
  data: () => ({
    version: ''
  }),
  mounted() {
    this.version = isDev ? 'DEV' : app.getVersion()
  },
  methods: {
    onMin() {
      this.$window.minimize()
    },
    onClose() {
      console.log('close', this.$window)
      this.$window.close()
    }
  }
}
</script>

<style lang="scss">
@font-face {
  font-family: Geometric;
  src: url('./assets/font-regular.otf') format('opentype');
}

@font-face {
  font-family: GeometricBold;
  src: url('./assets/font-bold.otf') format('opentype');
}

body {
  margin: 0;
  font-family: Geometric, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

main {
  height: calc(100% - 50px);
}

input {
  font-family: Geometric, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
}

.btn {
  border: none;
  border-radius: 11px;
  padding: 3px 10px;
  transition: 0.3s;
  outline: none;
  &:active {
    opacity: 0.5;
  }
  &.btn-primary {
    background-color: #ffd96e;
  }
}

.App {
  background: radial-gradient(
    circle,
    rgba(55, 50, 56, 1) 40%,
    rgba(32, 30, 33, 1) 100%
  );
  color: white;
  height: 100vh;
  user-select: none;
  border-radius: 40px;
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-width: 5px;
    pointer-events: none;
    background: url('./assets/Ram.png') no-repeat 0 0 / 891px;
    z-index: 10;
  }
}
</style>
