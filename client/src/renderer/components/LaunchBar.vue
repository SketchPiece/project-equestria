<template>
  <div :class="['launch-wrapper', { visible, open }]">
    <div class="launch-bar">
      <div class="gradient-wrapper">
        <div class="gradient" />
      </div>
      <LaunchButton :disabled="open" @click="launchClickHandler" />
      <button :disabled="launching" @click="toggleSettings" class="settings" />
      <div class="block auth">
        <span class="auth-info">Введите данные для входа в игру</span>
        <input
          v-model="username"
          class="login"
          type="text"
          placeholder="Логин"
          :disabled="open"
        />
        <Checkbox :disabled="open">Запомнить пароль</Checkbox>
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          :disabled="open"
        />
      </div>
      <div v-if="settings" class="block info settings-block">
        <Settings @close="toggleSettings" />
      </div>
      <div v-else class="block info">
        <span class="status">{{ download.status }}</span>
        <Progress :percent="download.percent" />
      </div>
    </div>
  </div>
</template>

<script>
import Progress from './Progress'
import LaunchButton from './LaunchButton'
import Settings from './Settings'
import Checkbox from './Checkbox'

export default {
  components: {
    Progress,
    LaunchButton,
    Settings,
    Checkbox
  },
  data: () => ({
    username: '',
    password: '',
    download: {
      percent: 0,
      status: ''
    },
    open: false,
    error: '',
    visible: false,
    settings: false,
    launching: false
  }),
  mounted() {
    setTimeout(() => (this.visible = true), 100)
  },
  methods: {
    async launchClickHandler() {
      try {
        this.error = ''
        // await AuthService.login(this.username, this.password)
        this.launching = true
        this.$emit('launch')
      } catch (e) {
        this.error = 'Incorrect username or password'
      }
    },
    setStatus(status) {
      this.download.status = status
    },
    setDownloadPercent(percent) {
      this.download.percent = percent
    },
    openBar() {
      this.open = true
    },
    closeBar() {
      this.launching = false
      this.open = false
      if (this.settings) setTimeout(() => (this.settings = false), 1000)
    },
    toggleSettings() {
      if (this.settings) return this.closeBar()
      this.settings = true
      this.openBar()
    }
  }
}
</script>

<style lang="scss" scoped>
.launch-wrapper {
  z-index: 9;
  width: 570px;
  height: 225px;
  position: fixed;
  right: -650px;
  top: calc(100vh / 2 - 225px / 2);
  transition: 1s cubic-bezier(0.37, 0, 0.29, 0.99);
  &.open {
    right: 0px !important;
    .gradient::before {
      right: 0;
    }

    &::before {
      content: '';
      opacity: 1;
    }
  }
  &.visible {
    right: -290px;
  }
  &::before {
    content: '';
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    transition: 0.6s;
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
  }
}

.settings {
  width: 25px;
  height: 25px;
  background: url('../assets/settings.svg') no-repeat center / 15px, #ffd96e;
  border-radius: 50%;
  border: none;
  position: absolute;
  bottom: 15px;
  left: 15px;
  transition: 0.3s;
  outline: none;
  &:active {
    opacity: 0.3;
  }
}

.settings-block {
  padding-right: 40px;
  box-sizing: border-box;
}

.gradient-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  $radius: 30px;
  border-top-left-radius: $radius;
  border-bottom-left-radius: $radius;
  overflow: hidden;
  // linear-gradient(30deg, rgba(255,255,255,1) 0%, rgba(251,203,96,1) 100%);
  .gradient {
    width: 100%;
    height: 100%;
    position: relative;
    &::before {
      content: '';
      position: absolute;
      transition: 1s cubic-bezier(0.37, 0, 0.29, 0.99);
      // left: 300;
      right: 290px;
      top: 0;
      width: 500px;
      height: 100%;
      // border-top-left-radius: $radius;
      // border-bottom-left-radius: $radius;
      background: linear-gradient(41deg, transparent 35%, #fbcb60 100%);
    }
  }
}

.launch-bar {
  width: 100%;
  height: 100%;
  background: #cf6767;
  $radius: 30px;
  border-top-left-radius: $radius;
  border-bottom-left-radius: $radius;
  // box-shadow: 0px 0px 8px black;
  position: relative;
  display: flex;
  color: #413539;
  // overflow: hidden;
  // &::before {
  //   content: '';
  //   position: absolute;
  //   transition: 1s cubic-bezier(0.37, 0, 0.29, 0.99);
  //   // left: 300;
  //   right: 300px;
  //   top: 0;
  //   width: 270px;
  //   height: 100%;
  //   // border-top-left-radius: $radius;
  //   // border-bottom-left-radius: $radius;
  //   background-color: red;
  // }
  .block {
    height: 100%;
    width: 200px;
    z-index: 1;
  }
  .auth {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin-left: 40px;
    width: 250px;
    .auth-info {
      font-size: 13px;
      position: absolute;
      top: 26px;
      left: 54px;
    }

    input {
      background: #8b606a;
      border: none;
      font-size: 14px;
      padding: 8px 8px;
      // padding-bottom: 8px;
      box-sizing: border-box;
      // height: 18px;
      outline: none;
      color: white;
      border-radius: 20px;
      &::placeholder {
        color: #3e353b;
      }
    }
  }
  .info {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 300px;
    position: relative;
    .status {
      margin-left: 14px;
      position: absolute;
      top: 70px;
    }
  }
}
</style>
