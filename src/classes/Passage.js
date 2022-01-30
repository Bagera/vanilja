const template = require("lodash/template");
const unescape = require("lodash/unescape");
const snarkdown = require("snarkdown");
/**
 * An object representing a passage. The current passage will be `window.passage`
 *
 * @class Passage
 */

class Passage {
  constructor(id, name, tags, source) {

    /**
     * @property {number} id - id number of passage
     * @type {number}
     */

    this.id = id || 1;

    /**
     * @property {string} name - The name of passage
     * @type {string}
     */

    this.name = name || "Default";

    /**
     * @property {Array} tags - The tags of the passage.
     * @type {Array}
     */

    this.tags = tags || [];

    /**
     * @property {string} source - The passage source code.
     * @type {string}
     */

    this.source = unescape(source);
  }

  /**
   * Produce HTML from Markdown input
   *
   * @function render
   * @param {string} source - Source to parse
   */

  render(source) {
    // Test if 'source' is defined or not
    if (!(typeof source !== "undefined" && source !== null)) {
      // Assume that 'this.source' is the correct source
      source = this.source;
    }

    let result = "";

    try {
      result = template(source)({ s: window.story.state });
    } catch (error) {
      const errorEvent = new CustomEvent("vanilja:error", {
        detail: {
          error,
          source: "Passage.render() using template()",
        },
      });
      window.dispatchEvent(errorEvent);
    }

    /**
     * Transform class, ID, hidden, and link shorthands in HTML tags.
     * <a-0.class#id> becomes
     * <a href="javascript:void(0)" style="display: none" class="class" id="id">
     */

    /* eslint-disable no-useless-escape */
    /* eslint-enable no-useless-escape */

    /* [[links]] with extra markup {#id.class} */
    result = result.replace(
      /\[\[(.*?)\]\]\{(.*?)\}/g,
      function (match, target, attrs) {
        /**
         * An internal helper function that converts string resembling object notation into objects.
         *
         * @function strToObj
         * @private
         * @param {string} str - a string similar to JSON but without quoted keys.
         * @returns {object}
         */
        function strToObj(str) {
          const properties = str.split(",").map((value) => value.trim());
          const obj = {};
          properties.forEach(function (prop) {
            const tup = prop.split(":").map((value) => value.trim());
            obj[tup[0]] = tup[1];
          });
          return obj;
        }

        let display = target;
        const attrObj = strToObj(attrs);
        const attrArr = [];
        /* display|target format */

        const barIndex = target.indexOf("|");

        if (barIndex !== -1) {
          display = target.substr(0, barIndex);
          target = target.substr(barIndex + 1);
        } else {
          /* display->target format */

          const rightArrIndex = target.indexOf("->");

          if (rightArrIndex !== -1) {
            display = target.substr(0, rightArrIndex);
            target = target.substr(rightArrIndex + 2);
          } else {
            /* target<-display format */

            const leftArrIndex = target.indexOf("<-");

            if (leftArrIndex !== -1) {
              display = target.substr(leftArrIndex + 2);
              target = target.substr(0, leftArrIndex);
            }
          }
        }
        attrObj["data-passage"] = target;
        attrObj["href"] = "javascript:void(0)";

        for (const attr in attrObj) {
          if (Object.hasOwnProperty.call(attrObj, attr)) {
            const value = attrObj[attr];
            attrArr.push(`${attr}="${value}"`);
          }
        }

        return "<a " + attrArr.join(" ") + ">" + display + "</a>";
      }
    );

    /* Classic [[links]]  */
    result = result.replace(/\[\[(.*?)\]\]/g, function (match, target) {
      let display = target;

      /* display|target format */
      const barIndex = target.indexOf("|");

      if (barIndex !== -1) {
        display = target.substr(0, barIndex);
        target = target.substr(barIndex + 1);
      } else {
        /* display->target format */
        const rightArrIndex = target.indexOf("->");

        if (rightArrIndex !== -1) {
          display = target.substr(0, rightArrIndex);
          target = target.substr(rightArrIndex + 2);
        } else {
          /* target<-display format */

          const leftArrIndex = target.indexOf("<-");

          if (leftArrIndex !== -1) {
            display = target.substr(leftArrIndex + 2);
            target = target.substr(0, leftArrIndex);
          }
        }
      }

      return (
        '<a href="javascript:void(0)" data-passage="' +
        target +
        '">' +
        display +
        "</a>"
      );
    });

    let newResult = snarkdown(result);

    // Test for new <p> tags from snarkdown
    if (!result.endsWith("</p>\n") && newResult.endsWith("</p>\n")) {
      newResult = newResult.replace(/^<p>|<\/p>$|<\/p>\n$/g, "");
    }

    return newResult;
  }
}

module.exports = Passage;
