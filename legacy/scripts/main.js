import { regions, countryLinks, socialLinks } from "./data.js";
import { initCarousel } from "./carousel.js";
import { initCountrySearch } from "./country-search.js";

/* ============================================
   Social Links
   ============================================ */
function initSocialLinks() {
  const container = document.querySelector("#social-links");
  if (!container) return;

  container.innerHTML = socialLinks
    .map(
      link => `
        <a
          class="social-link"
          href="${link.href}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="${link.name}"
          title="${link.name}"
        >
          <img src="${link.icon}" alt="" aria-hidden="true" referrerpolicy="no-referrer" />
        </a>
      `
    )
    .join("");
}

/* ============================================
   Mobile Menu
   ============================================ */
function initMobileMenu() {
  const toggle = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close menu when a nav link is clicked
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  // Close menu on outside click
  document.addEventListener("click", e => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ============================================
   Active Nav Highlighting
   ============================================ */
function initActiveNav() {
  const navLinks = document.querySelectorAll(".nav-list a[href^='#']");
  if (!navLinks.length) return;

  const targets = [];
  navLinks.forEach(link => {
    const id = link.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) targets.push(el);
  });

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
        }
      });
    },
    { rootMargin: "-20% 0px -60% 0px" }
  );

  targets.forEach(target => observer.observe(target));
}

/* ============================================
   Dynamic Copyright Year
   ============================================ */
function initCopyrightYear() {
  const yearEl = document.querySelector(".footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ============================================
   Bootstrap
   ============================================ */
initCarousel({
  trackSelector: "#region-track",
  prevSelector: ".carousel-arrow.left",
  nextSelector: ".carousel-arrow.right",
  items: regions,
});

initCountrySearch({
  formSelector: "#country-search-form",
  inputSelector: "#country-search-input",
  suggestionsSelector: "#country-suggestions",
  data: countryLinks,
  baseUrl: "https://sites.google.com/view/globecase/shop",
});

initSocialLinks();
initMobileMenu();
initActiveNav();
initCopyrightYear();
