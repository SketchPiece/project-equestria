<template>
  <main>
    <LaunchBar ref="launch" @launch="onLaunch" />
    <News />
  </main>
</template>

<script>
import Launcher from '../core/Launcher'
import ConfigManager from '../core/ConfigManager'
import LaunchBar from '../components/LaunchBar'
import News from '../components/News'

export default {
  name: 'main-layout',
  components: {
    LaunchBar,
    News
  },
  data: () => ({
    launcher: null
  }),
  mounted() {
    ConfigManager.load()
    const UIProvider = {
      setStatus: this.setStatus,
      suggestJava: this.suggestJava,
      setDownloadPercent: this.setDownloadPercent
    }
    this.launcher = new Launcher(UIProvider)
    this.$window.on('close', () => this.launcher.close())
  },
  methods: {
    onLaunch() {
      this.launcher.launch({
        onFinish: () => setTimeout(() => this.$window.minimize(), 1000),
        onClose: () => this.$window.show()
      })
    },
    setStatus(status) {
      if (status) this.$refs.launch.openBar()
      else this.$refs.launch.closeBar()
      this.$refs.launch.setStatus(status)
    },
    suggestJava(cb) {
      const res = confirm('У вас не установлена Java! Хотите установить?')
      cb(res)
    },
    setDownloadPercent(percent) {
      if (percent < 100) this.$window.setProgressBar(percent / 100)
      else this.$window.setProgressBar(-1)
      this.$refs.launch.setDownloadPercent(percent)
    }
  }
}
</script>
