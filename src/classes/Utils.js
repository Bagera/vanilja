const random = require("lodash/random");


/**
 * A reference to a passage by name or id.
 * @typedef {(number|string)} PassageId
 */

class Utils {
  /**
   * Return random entry in an array.
   *
   * @function random
   * @returns {any} Entry - The object randomly selected
   */
  static random() {
    const tempArray = [];
    let tPosition = 0;

    for (let i = 0; i < arguments.length; i++) {
      if (arguments[i] instanceof Array) {
        for (let j = 0; j < arguments[i].length; j++) {
          tempArray.push(arguments[i][j]);
        }
      } else {
        tempArray.push(arguments[i]);
      }
    }

    tPosition = random(tempArray.length - 1);
    return tempArray[tPosition];
  }
  /**
   * Return if passage(s) appear in history.
   *
   * @function hasVisited
   * @returns {boolean|Array} Boolean or Array of Boolean values
   **/
  static hasVisited() {
    if (!window.story) {
      return false;
    }

    for (let i = 0; i < arguments.length; i++) {
      const passage = window.story.passage(arguments[i]);
      if (passage && window.story.history.includes(passage.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Return number of times a passage appears in history.
   * If multiple passages are passed, it will return an array of numbers.
   *
   * @function visits
   * @param {PassageId|Array<PassageId>} passages Number of visits to the passage or array of numbers of visits to the passages.
   * @returns {number|Array<number>} Number of visits to the passage or array of numbers of visits to the passages.
   **/
  static visits(...passages) {
    const counts = [];
    let count = [];

    for (let i = 0; i < passages.length; i++) {
      const passage = window.story.passage(passages[i]);

      if (passage) {
        count = window.story.history.filter(function (id) {
          return id === passage.id;
        });
      }

      counts.push(count.length);
    }

    if (counts.length === 1) {
      return counts[0];
    }
    return counts;
  }

  /**
   * Render a passage to any/all element(s) matching query selector
   *
   * @function renderToSelector
   * @param {string|Element} selector - HTML Query selector or Element
   * @param {PassageId} passageId - The passage id or name
   **/
  static renderToSelector(selector, passageId) {
    const passage = window.story.passage(passageId);
    let targetEl;

    if (passage) {
      if (typeof selector === "string") {
        targetEl = document.querySelector(selector);
      }
      else if(selector instanceof Element) {
        targetEl = selector;
      }
      if (targetEl) {
        targetEl.innerHTML = passage.render()
      }
    }
  }

  
/**
 *
 *
 * @static event
 * @param {string} name Event name. Gets prefixed by "vanilja:";
 * @param {object} detail
 * @param {Element} [emitter=document.querySelector("tw-story")]
 * @memberof Utils
 */
static event(name, detail, emitter = document.querySelector("tw-story"), bubbles = true) {
    const newEvent = new CustomEvent("vanilja:" + name, {
      detail,
      bubbles: bubbles
    });
    emitter.dispatchEvent(newEvent);
  }

  /**
   * Adds a CSS file to the document.
   *
   * @function addStyle
   * @param {string} url path to the CSS file
   * @param {object} [attributes] optional extra attributes
   * @returns {void} Does not return
   **/
  static addStyle(url, attributes = {}) {
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", url);
    if (attributes) {
      for (const key in attributes) {
        if (Object.hasOwnProperty.call(attributes, key)) {
          const value = attributes[key];
          link.setAttribute(key, value);
        }
      }
    }
    document.head.append(link);
  }

  /**
   * Adds a javascript file to the document.
   *
   * @function addScript
   * @param {string} url path to the javascript file
   * @param {object} [attributes] optional extra attributes
   * @returns {void} Does not return
   **/
  static addScript(url, attributes) {
    const script = document.createElement("script");
    script.setAttribute("src", url);
    if (attributes) {
      for (const key in attributes) {
        if (Object.hasOwnProperty.call(attributes, key)) {
          const value = attributes[key];
          script.setAttribute(key, value);
        }
      }
    }
    document.head.append(script);
  }
}

module.exports = Utils;
