# Vanilja

Vanilja is a minimal Twine format heavily inspired by [Snowman](https://github.com/videlais/snowman) but updated to more modern web standards.

## Still in beta

Vanilja is very new and while it can be used and no known bugs are present, there still could be big ones. One area of concern is Snarkdown that is used for Markdown. It is a very small and fast library with most features but there could be missing features compered to bigger libraries. There is always the escape hatch of using HTML if you run into problems.

If you find any bugs, please make an issue on GitHub and I will try to solve it as fast as I can. If you also have a solution, please feel free to make a pull request.

## Getting out of your way

Vanilja is designed for authors that know CSS and JavaScript with a minimal scaffold of helper functions and styling. It is meant to be the fundament for your story, not the facade. You will have to design the story yourself and write your own more advanced functions. It is not the ideal format for a beginner that want's to make a story fast but can be used to learn the basics of web design and development without a lot of magical libraries.

## What is different to Snowman 2?

Vanilja is has less bloat than Snowman and less opinionated. The API is very similar to Snowman and minimal conversion is needed to use move from Snowman 2 to Vanilja.

### Notable differences include

- A CSS normalizer with less specificity, making it easier to style the story.
- No jQuery by default. Most features developers want from jQuery are available in vanilla JavaScript today and making every player download something that is probably not used just burns energy and battery. You can easily add jQuery from a CDN if you need it.
- No Underscore. Snowman just uses a couple of Underscore functions and those can be imported by their own from the more modern Lowdash, saving a lot of KBs.
- Removing JS libraries makes Vanilja less than 1/3 the size of Snowman.
- An easy way of adding external JavaScript to the story.

## Installing

To install the latest version (1.0.3) in Twine, use the following URL: <https://raw.githubusercontent.com/Bagera/vanilja/main/dist/vanilja-1.0.3/format.js>

## Development

Run `npm install` to install dependencies.

`npm run build` will create a Twine 2-ready story format under `dist/`.
