/* eslint-disable no-unused-vars */
const md = (window.md = require("snarkdown"));
const Story = (window.Story = require("./classes/Story.js"));
const Passage = (window.Passage = require("./classes/Passage.js"));
const Utils = (window.Utils = require("./classes/Utils.js"));
/* eslint-enable no-unused-vars */

window.addEventListener("load", () => {
  window.story = new Story(document.querySelector("tw-storydata"));
  window.story.start(document.querySelector("tw-story"));
});
