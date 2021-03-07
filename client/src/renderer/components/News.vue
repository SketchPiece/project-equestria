<template>
  <div class="news-container">
    <div :class="['news-grid', { visible }]">
      <div class="box big">
        <h2>Обновлени v0.6 Beta</h2>
        <pre>{{ text }}</pre>
      </div>
      <div class="box long">
        <pre>
Новый эвент
Убей 100 куриц и получи по заслугам!
        </pre>
      </div>
      <div class="box">
        <h2>Заголовок новости</h2>
        <pre>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Et impedit quis nesciunt quo at nemo. Voluptates maiores repellendus error odit velit eveniet distinctio aperiam nostrum dicta dignissimos, odio consequatur laborum!</pre
        >
      </div>
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    visible: false,
    text:
      '-Добавили новые баги\n-Программист снова набухался и положил сервер\n\nLorem ipsum dolor sit amet consectetur adipisicing elit. Quia quaerat ut nobis ad odio mollitia perferendis animi esse cumque! Eos pariatur ipsa explicabo aperiam, harum hic culpa illum consequuntur vitae?'
  }),
  mounted() {
    setTimeout(() => (this.visible = true), 100)
  }
}
</script>

<style lang="scss" scoped>
.news-container {
  // width: 500px;
  margin-top: -45px;
  margin-bottom: 10px;
  height: calc(100% + 40px);
  padding-top: 50px;
  padding-bottom: 10px;
  box-sizing: border-box;
  margin-left: 15px;
  // width: 350px;
  width: 500px;

  direction: rtl;
  overflow-y: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background-color: #ce8967;
    border-radius: 11px;
    border: 2px solid #201e21;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ffd96e;
    border-radius: 11px;
    border: 2px solid #201e21;
  }
}

.news-grid {
  direction: ltr;
  display: grid;
  margin-left: 10px;

  // grid-template-rows: repeat(3, 100px);
  grid-template-columns: repeat(3, 150px);
  grid-auto-rows: 150px;
  grid-gap: 10px;
  grid-auto-flow: dense;
  transition: 1.8s cubic-bezier(0.37, 0, 0.29, 0.99);
  transform: translate(0px, 500px);
  &.visible {
    transform: translate(0px, 0px);
  }
}
.box {
  // background-color: yellow;
  border-radius: 24px;
  background: linear-gradient(35deg, #cf6767 5%, #fbcb60 100%);
  text-align: center;
  h2 {
    color: #fbcb60;
    -webkit-text-stroke: 0.5px #201e21;
    -webkit-text-fill-color: #fbcb60;
    text-align: center;
    margin: 0px;
    font-family: GeometricBold;
    font-size: 12px;
    padding: 5px;
  }
  &.big {
    grid-column: span 2;
    grid-row: span 2;
    padding: 20px;

    > h2 {
      color: #fbcb60;
      -webkit-text-stroke: 1px #201e21;
      -webkit-text-fill-color: #fbcb60;
      text-align: left;
      margin: 0px;
      font-size: 22px;
      font-family: GeometricBold;
    }
    pre {
      font-size: 16px;
      line-height: 18px;
      margin: 0;
    }
  }
  &.wide {
    grid-column: span 2;
    pre {
      font-size: 16px;
      line-height: 18px;
      margin: 10px;
    }
  }
  &.long {
    grid-row: span 2;
    pre {
      font-size: 16px;
      line-height: 18px;
      margin: 10px;
    }
  }

  pre {
    font-family: Geometric;
    text-align: left;
    color: #413539;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 10px;
    margin: 8px;
  }
}
</style>
