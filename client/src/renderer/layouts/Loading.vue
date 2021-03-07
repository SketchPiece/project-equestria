<template>
  <div :class="['center-wrapper', { hide }]">
    <img class="spinner" src="../assets/spinner.png" alt="loading" />
    <span class="status">{{ status }}</span>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
const isDev = process.env.NODE_ENV === 'development'

export default {
  data: () => ({
    hide: false,
    status: 'Проверка обновлений..'
  }),
  mounted() {
    if (isDev) this.$router.push({ name: 'main' })
    // setTimeout(() => this.disappear(), 0)
    ipcRenderer.on('update-status', (_, status) => {
      switch (status) {
        case 'update-available': {
          this.status = 'Доступно обновнение!'
          break
        }
        case 'error': {
          this.status = 'Ошибка обновления'
          setTimeout(() => this.$window.close(), 5000)
          break
        }
        case 'download-progress': {
          this.status = 'Загрузка обновления..'
          break
        }
        case 'update-not-available': {
          this.disappear()
          break
        }
      }
    })
    console.log(isDev)
  },
  methods: {
    disappear() {
      this.hide = true
      setTimeout(() => this.$router.push({ name: 'main' }), 1000)
    }
  }
}
</script>

<style lang="scss" scoped>
.center-wrapper {
  margin-top: -50px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  opacity: 1;
  transition: 1s;

  &.hide {
    opacity: 0;
  }
}
.spinner {
  width: 150px;
}

.status {
  margin-top: 50px;
  font-size: 20px;
}
</style>
