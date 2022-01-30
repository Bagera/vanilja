/**
 * @external Element
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element}
 */

const LZString = require("lz-string");
const Passage = require("./Passage");
const Utils = require("./Utils");
const unescape = require("lodash/unescape");
const isNumber = require("lodash/isNumber");
const isString = require("lodash/isString");

/**
 * An object representing the entire story. After the document has completed
 * loading, an instance of this class will be available at `window.story`.
 *
 * @class Story
 */
class Story {
  constructor(dataEl) {
    this.dataEl = dataEl;

    /**
     * @property {string} name - The name of the story.
     * @type {string}
     * @readonly
     **/

    this.name = this.dataEl.getAttribute("name");

    /**
     * @property {number} startPassage - The ID of the first passage to be displayed.
     * @type {number}
     * @readonly
     **/

    this.startPassage = parseInt(this.dataEl.getAttribute("startnode"));

    /**
     * @property {string} creator - The program that created this story.
     * @type {string}
     * @readonly
     **/

    this.creator = this.dataEl.getAttribute("creator");

    /**
     * @property {string} creatorVersion - The version of the program used to create this story.
     * @type {string}
     * @readonly
     **/

    this.creatorVersion = this.dataEl.getAttribute("creator-version");

    /**
     * @property {Array} history - An array of passage IDs
     * @type {Array}
     * @readonly
     **/

    this.history = [];

    /**
     * An object that stores data that persists across a single user session.
     * Any other variables will not survive the user pressing back or forward.
     *
     * @property {object} state - Story state
     * @type {object}
     **/

    this.state = {};

    /**
     * The name of the last checkpoint set. If none has been set, this is an
     * empty string.
     *
     * @property {string} checkpointName - name of checkpoint
     * @type {string}
     * @readonly
     **/

    this.checkpointName = "";

    /**
     * If set to true, then any JavaScript errors are ignored -- normally, play
     * would end with a message shown to the user.
     *
     * @property {boolean} ignoreErrors - If errors should be ignored
     * @type {boolean}
     **/

    this.ignoreErrors = false;

    /**
     * The message shown to users when there is an error and ignoreErrors is not
     * true.
     *
     * @property {string} errorMessage - Error message
     * @type {string}
     **/

    this.errorMessage = "";

    /**
     * Mainly for internal use, this records whether the current passage contains
     * a checkpoint.
     *
     * @property {boolean} atCheckpoint - if at checkpoint
     * @type {boolean}
     * @private
     **/

    this.atCheckpoint = false;

    /**
     * An array of all passages, indexed by ID.
     *
     * @property {Array} passages - Passages array
     * @type {Array}
     **/

    this.passages = [];

    const p = [];

    dataEl.querySelectorAll("tw-passagedata").forEach((el) => {
      const id = parseInt(el.getAttribute("pid"));
      const tags = el.getAttribute("tags");

      p[id] = new Passage(
        id,
        el.getAttribute("name"),
        tags !== "" && tags !== undefined ? tags.split(" ") : [],
        el.innerHTML
      );
    });

    this.passages = p;

    /**
     * An array of user-specific scripts to run when the story is begun.
     *
     * @property {Array} userScripts - Array of user-added JavaScript
     * @type {Array}
     **/

    this.userScripts = [];

    dataEl.querySelectorAll('*[type="text/twine-javascript"]').forEach((el) => {
      // Add the internal (HTML) contents of all SCRIPT tags
      this.userScripts.push(el.innerHTML);
    });

    /**
     * An array of user-specific style declarations to add when the story is
     * begun.
     *
     * @property {Array} userStyles - Array of user-added styles
     * @type {Array}
     **/

    this.userStyles = [];

    // Add the internal (HTML) contents of all STYLE tags
    dataEl.querySelectorAll('*[type="text/twine-css"]').forEach((el) => {
      this.userStyles.push(el.innerHTML);
    });

    /* Set up error handler. */
    window.onerror = function (message, source, lineno, colno, error) {
      Story.emitError(error, "Browser Error");
    };

    window.addEventListener("vanilja:error", (e) => {
      const { error, source } = e.detail;
      this.errorMessage =
        "In " + source + ": " + error.name + ": " + error.message;

      if (!this.ignoreErrors) {
        document.querySelector("tw-story").innerHTML = this.errorMessage;
      }
    });
  }

  static emitError(error, source, name = "error") {
    Utils.event(name, {
      error,
      source: source,
    });
  }

  /**
   * Begins playing this story.
   *
   * @function start
   * @param {Element} el - Element to show content in
   * @returns {void}
   **/

  start(el) {
    this.el = el;

    /* Create an element to show the passage. */
    this.el.innerHTML =
      '<tw-passage class="passage" aria-live="polite"></tw-passage>';
    this.passageEl = document.querySelector("tw-passage");

    /* Set up history event handler. */
    window.addEventListener("popstate", (event) => {
      const state = event.originalEvent.state;

      if (state) {
        this.state = state.state;
        this.history = state.history;
        this.checkpointName = state.checkpointName;
        this.show(this.history[this.history.length - 1], true);
      } else if (this.history.length > 1) {
        this.state = {};
        this.history = [];
        this.checkpointName = "";
        this.show(this.startPassage, true);
      }
    });

    /* Set up hash change handler for save/restore. */
    window.addEventListener("hashchange", function () {
      this.restore(window.location.hash.replace("#", ""));
    });

    /* Activate user styles. */
    this.userStyles.forEach((style) => {
      const styleEl = document.createElement("style");
      styleEl.innerHTML = style;
      this.el.append(styleEl);
    });

    /* Run user scripts. */
    this.userScripts.forEach((script) => {
      try {
        /* eslint-disable no-eval */
        eval(script);
        /* eslint-enable no-eval */
      } catch (error) {
        Story.emitError(error, "Story JavaScript Eval()");
      }
    });

    /* Set up passage link handler. */
    this.el.addEventListener("click", (ev) => {
      const el = ev.target;
      if (el.tagName.toLowerCase() === "a" && el.dataset["passage"]) {
        this.show(unescape(el.dataset["passage"]));
      }
    });

    /**
     * Triggered when the story is finished loading, and right before
     * the first passage is displayed. The story property of this event
     * contains the story.
     *
     * @event vanilja:story:started
     */
    const startedEvent = new CustomEvent("vanilja:story:started", {
      detail: {
        story: this,
      },
    });
    window.dispatchEvent(startedEvent);

    /* Try to restore based on the window hash if possible. */

    if (
      window.location.hash === "" ||
      !this.restore(window.location.hash.replace("#", ""))
    ) {
      /* Start the story; mark that we're at a checkpoint. */

      this.show(this.startPassage);
      this.atCheckpoint = true;
    }
  }

  /**
   * Returns the Passage object corresponding to either an ID or name.
   * If none exists, then it returns null.
   *
   * @function passage
   * @param {string|number} idOrName - ID or name of the passage
   * @returns {object} - Passage object or null
   **/
  passage(idOrName) {
    let passage = null;

    if (isNumber(idOrName)) {
      if (idOrName < this.passages.length) {
        passage = this.passages[idOrName];
      }
    } else if (isString(idOrName)) {
      let result = this.passages.filter((p) => p.name === idOrName);
      
      if (result.length !== 0) {
        passage = result[0];
      } else {
        // Try case insensitive version if no match
        result = this.passages.filter((p) => p.name.toLowerCase() === idOrName.toLowerCase());
        if (result.length !== 0) {
          passage = result[0];
        }
      }
    }

    return passage;
  }

  /**
   * Displays a passage on the page, replacing the current one. If there is no
   * passage by the name or ID passed, an exception is raised.
   *
   * Calling this immediately inside a passage (i.e. in its source code) will
   * not display the other passage. Use Story.render() instead.
   *
   * @function show
   * @param {string|number} idOrName - ID or name of the passage
   * @param {boolean} noHistory - if true, then this will not be recorded in the
    story history
   * @returns {void} - Returns nothing
   **/
  show(idOrName, noHistory = false) {
    const passage = this.passage(idOrName);

    if (passage === null) {
      throw new Error(
        'There is no passage with the ID or name "' + idOrName + '"'
      );
    }

    /**
     * Triggered whenever a passage is about to be replaced onscreen with
     * another. The passage being hidden is stored in the passage property of
     * the event.
     *
     * @event vanilja:story:hidden
     */
    Utils.event("story:hidden", {
      passage: window.passage,
    });

    /**
     * Triggered whenever a passage is about to be shown onscreen. The passage
     * being displayed is stored in the passage property of the event.
     *
     * @event vanilja:story:showing
     */
    Utils.event("story:showing", {
      passage: passage,
    });

    if (noHistory === false) {
      this.history.push(passage.id);

      try {
        if (this.atCheckpoint) {
          window.history.pushState(
            {
              state: this.state,
              history: this.history,
              checkpointName: this.checkpointName,
            },
            "",
            ""
          );
        } else {
          window.history.replaceState(
            {
              state: this.state,
              history: this.history,
              checkpointName: this.checkpointName,
            },
            "",
            ""
          );
        }
      } catch (error) {
        /* This may fail due to security restrictions in the browser. */
        /**
         * Triggered whenever a checkpoint fails to be saved to browser
         * history.
         *
         * @event vanilja:error:checkpoint
         */
        Utils.event("checkpoint:error", {
          error,
          description: "Checkpoint failed to save",
        });
      }
      Utils.event("checkpoint:added", { name: idOrName });
    }

    window.passage = passage;
    this.atCheckpoint = false;

    try {
      this.passageEl.innerHTML = passage.render();
      this.passageEl.setAttribute("passage", passage.name)
    } catch (error) {
      Story.emitError(error, "Story.show()");
    }

    /**
     * Triggered after a passage has been shown onscreen, and is now
     * displayed in the story's element The passage being displayed is
     * stored in the passage property of the event.
     *
     * @event vanilja:story:shown
     */
    const shownEvent = new CustomEvent("vanilja:story:shown", {
      detail: {
        passage: passage,
      },
    });
    window.dispatchEvent(shownEvent);
  }

  /**
   * Returns the HTML source for a passage. This is most often used when
   * embedding one passage inside another. In this instance, make sure to
   * use <%= %> instead of <%- %> to avoid incorrectly encoding HTML entities.
   *
   * @function render
   * @param {string|number} idOrName - ID or name of the passage
   * @returns {string} - HTML source code
   */
  render(idOrName) {
    const passage = this.passage(idOrName);

    if (!passage) {
      this.emitError(
        {
          name: "No passage",
          message: "There is no passage with the ID or name " + idOrName,
        },
        "Story.render()"
      );
      throw new Error("There is no passage with the ID or name " + idOrName);
    }

    return passage.render();
  }

  /**
   * Records that the current story state should be added to the browser
   * history. Actually saving it occurs once the user navigates to another
   * passage -- otherwise, clicking the back button would cause the story to
   * show the same passage twice. Remember, only variables set on this story's
   * state variable are stored in the browser history.
   *
   * @function checkpoint
   * @param {string} name - checkpoint name, appears in history, optional
   * @returns {void} - Returns nothing
   **/
  checkpoint(name) {
    if (name !== undefined) {
      document.title = this.name + ": " + name;
      this.checkpointName = name;
    } else {
      this.checkpointName = "";
    }

    this.atCheckpoint = true;

    /**
     * Triggered whenever a checkpoint is set in the story.
     *
     * @event vanilja:checkpoint:adding
     */
    Utils.event("checkpoint:adding", { name: name });
  }

  /**
   * Sets the URL hash property to the hash value created by saveHash().
   *
   * @function save
   * @param {string} hash - Hash to set URL
   * @returns {void} - Returns nothing
   */
  save(hash) {
    window.location.hash = hash;

    /**
     * Triggered whenever story progress is saved.
     *
     * @event vanilj:story:saved
     */
    Utils.event("story:saved");
  }

  /**
   * Returns LZString + compressBase64 Hash.
   *
   * @function saveHash
   * @returns {string} - Returns the LZString hash
   */
  saveHash() {
    const hash = LZString.compressToBase64(
      JSON.stringify({
        state: this.state,
        history: this.history,
        checkpointName: this.checkpointName,
      })
    );

    return hash;
  }

  /**
   * Tries to restore the story state from a hash value generated by saveHash().
   *
   * @function restore
   * @param {string} hash - Hash to restore from
   * @returns {boolean} if the restore succeeded
   */

  restore(hash) {
    try {
      const save = JSON.parse(LZString.decompressFromBase64(hash));

      this.state = save.state;
      this.history = save.history;
      this.checkpointName = save.checkpointName;
      this.show(this.history[this.history.length - 1], true);
    } catch (error) {
      /* Swallow the error. */

      /**
       * Triggered if there was an error with restoring from a hash.
       *
       * @event vanilja:restore:error;
       **/
      Utils.event("restore:error", { error });
      return false;
    }

    /**
     * Triggered after completing a restore from a hash.
     *
     * @event vanilja:restore:success
     */
    Utils.event("restore:success");
    return true;
  }
}

module.exports = Story;
