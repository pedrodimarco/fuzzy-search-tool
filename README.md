# Fuzzy Search Tool

A JavaScript-based fuzzy search tool designed for casino game searches. It supports multiple languages (English, Spanish, Portuguese), device-specific filtering (desktop/mobile), and advanced matching algorithms including Levenshtein distance and Soundex for approximate string matching.

## Features

- **Fuzzy Matching**: Uses Levenshtein distance and Soundex algorithms for approximate search results.
- **Multi-language Support**: Handles searches in English, Spanish, and Portuguese.
- **Device Filtering**: Filters games based on device availability (desktop or mobile).
- **Real-time Search**: Debounced input handling for efficient search as you type.
- **Session Storage**: Caches game data to reduce API calls.
- **HTML Rendering**: Dynamically renders search results in the DOM.

## Installation

This is a vanilla JavaScript file. No external dependencies are required. Simply include `clean.js` in your HTML file or Node.js project.

For browser usage:
```html
<script src="clean.js"></script>
```

For Node.js (if adapted):
```javascript
const { getGames, getSortedMatches, renderResults } = require('./clean.js');
```

## Usage

1. **Initialization**: Call `initCasinoSearch()` to set up the search functionality on your page.
2. **Search Input**: The tool listens for input on an element with ID `buscador_juegos`.
3. **Results Display**: Results are rendered in an element with ID `inner_results`.

Ensure your HTML has the necessary elements:
- Input field: `<input id="buscador_juegos" />`
- Results container: `<div id="inner_results"></div>`
- Search icon: `<div class="search-icon"></div>`
- Close button: `<div class="icon-close ocultar"></div>`

## API

- `getGames()`: Fetches games from the API.
- `getSortedMatches(games, query)`: Performs fuzzy search and returns sorted matches.
- `renderResults(results)`: Renders the search results as HTML string.
- `normalizeText(str)`: Normalizes text by removing accents and converting to lowercase.

## Configuration

- Update `API_URL` with your actual API endpoint.
- Modify `aliasJson`, `themesJson`, and `providersJson` arrays with your data.
- Adjust `MAX_RESULTS` and `LEVENSHTEIN_THRESHOLD` constants as needed.