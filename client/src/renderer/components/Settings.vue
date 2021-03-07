<template>
  <div class="wrapper">
    <!-- <vue-slider silent v-model="value" /> -->
    <span class="block-info">Настройки</span>
    <div class="slidecontainer">
      <span>Выделение оперативной памяти на игру: {{ value }}G</span>
      <input
        type="range"
        min="3"
        max="8"
        v-model="value"
        step="0.5"
        class="slider"
        id="myRange"
      />
    </div>
    <div class="dir-info">Директория загрузки файлов игры</div>
    <div class="common-dir">
      <div class="dir">{{ commonDir }}</div>
      <div class="delete"></div>
    </div>
    <div class="bottom-side">
      <div class="checkboxes">
        <Checkbox>Автовход на сервер</Checkbox>
        <Checkbox>Игра во весь экран</Checkbox>
      </div>
      <div class="dev">
        <div>DEV:</div>
        <div>Programming: Sketch</div>
        <div>Design: MugGod</div>
      </div>
    </div>
    <button class="btn btn-primary save">Сохранить</button>
  </div>
</template>

<script>
import Checkbox from '../components/Checkbox'
import ConfigManager from '../core/ConfigManager'

export default {
  components: {
    Checkbox
  },
  data: () => ({
    value: 3,
    commonDir: ''
  }),
  mounted() {
    ConfigManager.load()
    this.commonDir = ConfigManager.getCommonDirectory()
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
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
  margin-top: 10px;
  span {
    width: 230px;
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
  width: 100%;
  // padding: 3px;
  font-size: 6px;
  background-color: #8b606a;
  height: 9px;
  border-radius: 11px;
  display: flex;
  // justify-content: center;
  align-items: center;
  position: relative;
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
