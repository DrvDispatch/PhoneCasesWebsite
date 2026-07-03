export function initCountrySearch({
  formSelector,
  inputSelector,
  suggestionsSelector,
  data,
  baseUrl,
}) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const suggestions = document.querySelector(suggestionsSelector);

  if (!form || !input || !suggestions) return;

  const flattenMatches = query => {
    if (!query) return [];

    const normalized = query.trim().toLowerCase();
    const matches = [];

    Object.entries(data).forEach(([region, countries]) => {
      countries.forEach(country => {
        if (country.startsWith(normalized)) {
          matches.push({
            name: country,
            href: `${baseUrl}/${region}/${country}`,
          });
        }
      });
    });

    return matches;
  };

  const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);

  const renderSuggestions = matches => {
    if (!matches.length) {
      suggestions.hidden = true;
      suggestions.innerHTML = "";
      return;
    }

    suggestions.hidden = false;
    suggestions.innerHTML = matches
      .map(
        match => `
          <a
            class="suggestion-item"
            href="${match.href}"
            role="option"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${capitalize(match.name)}
          </a>
        `
      )
      .join("");
  };

  input.addEventListener("input", () => {
    renderSuggestions(flattenMatches(input.value));
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const firstMatch = flattenMatches(input.value)[0];

    if (firstMatch) {
      window.open(firstMatch.href, "_blank", "noopener,noreferrer");
      return;
    }

    window.alert("Country not found. Please check the name and try again.");
  });
}
