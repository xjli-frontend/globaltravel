const fs = require('fs');
const path = require("path");

const createVUE = function (element) {
  return new Vue({
    el: element,
    data:
    {
    },

    created: function () {

    },

    methods: {
    }
  });
};

var view = {

  // html template for panel
  template: fs.readFileSync(Editor.url('packages://Sprite9Editor/panel/index.html', 'utf8')),

  // css style for panel
  style: fs.readFileSync(Editor.url('packages://Sprite9Editor/panel/index.css', 'utf8')),

  // element and variable binding
  $: {
    "mainDiv": "#mainDiv"
  },

  // method executed when template and styles are successfully loaded and initialized
  ready() {
    this.vue = createVUE(this["$mainDiv"]);
    Editor.log("sprite9Editor view ready");
  }
};
// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend(view);
