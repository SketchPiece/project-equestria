<template>
  <div class="wrapper">
    <!-- <vue-slider silent v-model="value" /> -->
    <span class="block-info">Настройки</span>
    <div class="slidecontainer">
      <span>Выделение оперативной памяти на игру: {{ value }}G</span>
      <input
        type="range"
        :min="3"
        :max="maxRam"
        v-model="value"
        step="0.5"
        class="slider"
        id="myRange"
      />
    </div>
    <div class="dir-info">Директория загрузки файлов игры</div>
    <div class="common-dir">
      <a @click="openCommonDir" :title="commonDir" class="dir">
        {{ commonDirFormatted }}
      </a>
    </div>
    <div class="bottom-side">
      <div class="checkboxes">
        <Checkbox v-model="states.autoConnect">Автовход на сервер</Checkbox>
        <Checkbox v-model="states.fullscreen">Игра во весь экран</Checkbox>
      </div>
      <div class="dev">
        <div>DEV:</div>
        <div>
          Programming:
          <span @click="openDeveloper('Sketch')" class="click">Sketch</span>
        </div>
        <div>
          Design:
          <span @click="openDeveloper('MugGod')" class="click">MugGod</span>
        </div>
      </div>
    </div>
    <button @click="onSave" class="btn btn-primary save">Сохранить</button>
  </div>
</template>

<script>
import Checkbox from '../components/Checkbox'
import ConfigManager from '../core/ConfigManager'
const { shell } = require('electron')

const developers = {
  Sketch: 'https://telegram.me/sketchpiece',
  MugGod: 'https://vk.com/id281711712'
}

function truncate(str, n) {
  return str.length > n ? str.substr(0, n - 1) + '...' : str
}
export default {
  components: {
    Checkbox
  },
  data: () => ({
    value: 3,
    maxRam: 4,
    commonDir: '',
    states: {
      fullscreen: false,
      autoConnect: false
    }
  }),
  mounted() {
    ConfigManager.load()
    this.commonDir = ConfigManager.getCommonDirectory()
    this.maxRam = ConfigManager.getAbsoluteMaxRAM()
    this.value = +ConfigManager.getMaxRAM().replace('M', '') / 1000
    this.states.fullscreen = ConfigManager.getFullscreen()
    this.states.autoConnect = ConfigManager.getAutoConnect()
  },
  methods: {
    openCommonDir() {
      shell.openPath(this.commonDir)
    },
    onSave() {
      ConfigManager.setMaxRAM(`${this.value * 1000}M`)
      ConfigManager.setFullscreen(this.states.fullscreen)
      ConfigManager.setAutoConnect(this.states.autoConnect)
      ConfigManager.save()
      this.$emit('close')
    },
    openDeveloper(name) {
      shell.openExternal(developers[name])
    }
  },
  computed: {
    commonDirFormatted() {
      return truncate(this.commonDir, 50)
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
}
.click {
  cursor: pointer;
}
.bottom-side {
  margin-top: 10px;
  .checkboxes {
    > label {
      margin: 5px 0px;
      margin-left: -10px;
    }
  }
}
.save {
  position: absolute;
  bottom: 10px;
  left: 90px;
}
.dev {
  position: absolute;
  font-size: 9px;
  right: 14px;
  bottom: 45px;
  text-align: right;
}

.slidecontainer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15px;
  span {
    width: 235px;
    font-size: 10px;
    margin-left: 10px;
    // text-align: center;
  }
}
.block-info {
  font-size: 13px;
  position: absolute;
  top: 26px;
  left: 95px;
}
.dir-info {
  font-size: 10px;
  margin-top: 20px;
  text-align: center;
}
.common-dir {
  margin-top: 3px;
  width: 100%;
  font-size: 8px;
  background-color: #8b606a;
  height: 10px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  position: relative;
  text-overflow: ellipsis;

  .dir {
    cursor: pointer;
    width: 100%;
    display: block;
    text-align: center;
    text-decoration: none;
    color: #ffd96e;
  }
  .delete {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #b0322f;
    position: absolute;
    right: 5px;
  }
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 9px;
  border-radius: 11px;
  background: #8b606a;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffd96e;
  cursor: pointer;
}
</style>
