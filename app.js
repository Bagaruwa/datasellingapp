const datasets = [
  {
    id: 1, title: "Urban tree canopy, block by block", category: "climate", categoryLabel: "Climate & nature",
    description: "A neighborhood-level look at tree cover across 12 mid-sized North American cities.",
    format: "CSV", size: "18.2 MB", rows: "8,420 rows", price: 18, seller: "Mira Chen", initials: "MC",
    license: "CC BY 4.0", updated: "2 days ago", cover: "climate", tags: ["Urban forestry", "12 cities"], verified: true,
    provenance: "Compiled from municipal open-data portals and field-checked with local conservation groups."
  },
  {
    id: 2, title: "Independent bookstores directory", category: "culture", categoryLabel: "Culture & community",
    description: "An independently verified directory of neighborhood bookstores and their specialties.",
    format: "CSV", size: "2.6 MB", rows: "3,180 rows", price: 0, seller: "Open Shelf Project", initials: "OS",
    license: "CC0", updated: "1 week ago", cover: "culture", tags: ["Retail", "North America"], verified: true,
    provenance: "Store details were submitted by owners and cross-checked against public business listings."
  },
  {
    id: 3, title: "Walkable streets of Lisbon", category: "cities", categoryLabel: "Cities & places",
    description: "Street-level walkability observations, crossings, shade, and curb access in central Lisbon.",
    format: "GeoJSON", size: "42 MB", rows: "5,640 features", price: 32, seller: "Rua Research", initials: "RR",
    license: "CC BY 4.0", updated: "3 days ago", cover: "cities", tags: ["Mobility", "Portugal"], verified: true,
    provenance: "Collected by a local urban-planning research team during public walking audits."
  },
  {
    id: 4, title: "Community energy cooperatives", category: "business", categoryLabel: "Business & economy",
    description: "A global snapshot of member-owned renewable energy projects and their capacity.",
    format: "JSON", size: "5.1 MB", rows: "1,240 records", price: 12, seller: "Common Current", initials: "CC",
    license: "Open Data Commons", updated: "5 days ago", cover: "business", tags: ["Renewables", "Global"], verified: true,
    provenance: "Aggregated from public cooperative registries and project-published annual reports."
  },
  {
    id: 5, title: "Seasonal produce at local markets", category: "culture", categoryLabel: "Culture & community",
    description: "What is in season, when, and where—reported by market vendors across the Pacific Northwest.",
    format: "CSV", size: "940 KB", rows: "2,860 rows", price: 8, seller: "Field & Fork", initials: "FF",
    license: "CC BY 4.0", updated: "1 day ago", cover: "food", tags: ["Food systems", "Seasonal"], verified: true,
    provenance: "Gathered with participating farmers-market vendors; no customer or transaction data included."
  },
  {
    id: 6, title: "Neighborhood rain garden map", category: "climate", categoryLabel: "Climate & nature",
    description: "Locations and plant palettes of community-built rain gardens in three US cities.",
    format: "GeoJSON", size: "11.7 MB", rows: "690 features", price: 0, seller: "Watershed Commons", initials: "WC",
    license: "CC0", updated: "2 weeks ago", cover: "water", tags: ["Water", "Community"], verified: true,
    provenance: "Created with watershed nonprofits from public project records and volunteer surveys."
  }
];

const state = { search: "", category: "all", price: "any", formats: [], savedOnly: false, newestFirst: true };
const grid = document.querySelector("#dataset-grid");
const toast = document.querySelector("#toast");
const detailDialog = document.querySelector("#detail-dialog");
const sellDialog = document.querySelector("#sell-dialog");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function getSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem("fieldnotes-saved") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("Saved items could not be read from local storage.", error);
    return [];
  }
}

function setSaved(ids) {
  try {
    localStorage.setItem("fieldnotes-saved", JSON.stringify(ids));
  } catch (error) {
    console.warn("Saved items could not be stored in local storage.", error);
    showToast("Couldn't save this item in your browser.");
  }
}

function updateSavedCount() {
  document.querySelector("#saved-count").textContent = String(getSaved().length);
}

function coverGraphic(cover) {
  const graphic = document.createElement("div");
  graphic.className = "cover-graphic";
  const orb = document.createElement("span");
  orb.className = "cover-orb";
  graphic.append(orb);
  const motif = document.createElement("span");
  motif.className = `cover-${cover === "climate" || cover === "business" ? "lines" : cover === "cities" || cover === "water" ? "curve" : "dots"}`;
  graphic.append(motif);
  return graphic;
}

function createCard(dataset) {
  const card = document.createElement("article");
  card.className = "dataset-card";

  const cover = document.createElement("div");
  cover.className = `dataset-cover cover-${dataset.cover}`;
  cover.append(coverGraphic(dataset.cover));

  const saveButton = document.createElement("button");
  saveButton.className = `card-save${getSaved().includes(dataset.id) ? " saved" : ""}`;
  saveButton.type = "button";
  saveButton.setAttribute("aria-label", `${getSaved().includes(dataset.id) ? "Remove" : "Save"} ${dataset.title}`);
  saveButton.setAttribute("aria-pressed", String(getSaved().includes(dataset.id)));
  saveButton.textContent = getSaved().includes(dataset.id) ? "♥" : "♡";
  saveButton.addEventListener("click", () => toggleSaved(dataset.id));
  cover.append(saveButton);
  card.append(cover);

  const body = document.createElement("div");
  body.className = "card-body";
  const category = document.createElement("div");
  category.className = "card-category";
  category.textContent = dataset.categoryLabel;
  body.append(category);
  const title = document.createElement("h3");
  title.className = "card-title";
  const titleButton = document.createElement("button");
  titleButton.type = "button";
  titleButton.textContent = dataset.title;
  titleButton.addEventListener("click", () => openDetail(dataset));
  title.append(titleButton);
  body.append(title);
  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = dataset.description;
  body.append(description);

  const tags = document.createElement("div");
  tags.className = "card-tags";
  [dataset.format, dataset.size, ...dataset.tags.slice(0, 1)].forEach((tagText) => {
    const tag = document.createElement("span");
    tag.className = "card-tag";
    tag.textContent = tagText;
    tags.append(tag);
  });
  body.append(tags);

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const seller = document.createElement("span");
  seller.className = "seller";
  const avatar = document.createElement("span");
  avatar.className = "seller-avatar";
  avatar.textContent = dataset.initials;
  seller.append(avatar);
  const sellerName = document.createElement("span");
  sellerName.textContent = dataset.seller;
  seller.append(sellerName);
  if (dataset.verified) {
    const verified = document.createElement("span");
    verified.className = "verified";
    verified.setAttribute("aria-label", "Source verified");
    verified.textContent = "✓";
    seller.append(verified);
  }
  const price = document.createElement("span");
  price.className = `card-price${dataset.price === 0 ? " free" : ""}`;
  price.textContent = dataset.price === 0 ? "Free" : `$${dataset.price}`;
  footer.append(seller, price);
  body.append(footer);
  card.append(body);
  return card;
}

function filteredDatasets() {
  const search = state.search.toLocaleLowerCase();
  return datasets.filter((dataset) => {
    const matchesSearch = !search || [dataset.title, dataset.description, dataset.categoryLabel, dataset.seller, ...dataset.tags].join(" ").toLocaleLowerCase().includes(search);
    const matchesCategory = state.category === "all" || dataset.category === state.category;
    const matchesPrice = state.price === "any" || (state.price === "free" ? dataset.price === 0 : dataset.price > 0);
    const matchesFormat = !state.formats.length || state.formats.includes(dataset.format);
    const matchesSaved = !state.savedOnly || getSaved().includes(dataset.id);
    return matchesSearch && matchesCategory && matchesPrice && matchesFormat && matchesSaved;
  });
}

function render() {
  const results = filteredDatasets();
  const ordered = state.newestFirst ? results : [...results].sort((a, b) => a.price - b.price);
  grid.replaceChildren(...ordered.map(createCard));
  document.querySelector("#results-count").textContent = state.savedOnly
    ? `Showing ${results.length} saved dataset${results.length === 1 ? "" : "s"}`
    : `Showing ${results.length} thoughtfully sourced dataset${results.length === 1 ? "" : "s"}`;
  document.querySelector("#empty-state").hidden = results.length !== 0;
  document.querySelector("#load-more").hidden = results.length === 0;
}

function toggleSaved(id) {
  const saved = getSaved();
  const isSaved = saved.includes(id);
  const next = isSaved ? saved.filter((savedId) => savedId !== id) : [...saved, id];
  setSaved(next);
  updateSavedCount();
  render();
  showToast(isSaved ? "Removed from your saved datasets." : "Saved for later.");
}

function openDetail(dataset) {
  const content = document.querySelector("#detail-content");
  content.replaceChildren();
  const eyebrow = document.createElement("div");
  eyebrow.className = "detail-category";
  eyebrow.textContent = dataset.categoryLabel;
  const title = document.createElement("h2");
  title.className = "detail-title";
  title.textContent = dataset.title;
  const description = document.createElement("p");
  description.className = "detail-description";
  description.textContent = dataset.description;
  const meta = document.createElement("div");
  meta.className = "detail-meta";
  [["Format", dataset.format], ["Size", dataset.size], ["License", dataset.license], ["Updated", dataset.updated], ["Coverage", dataset.rows], ["Creator", dataset.seller]].forEach(([label, value]) => {
    const box = document.createElement("div");
    box.className = "meta-box";
    const caption = document.createElement("span");
    caption.textContent = label;
    const contentValue = document.createElement("b");
    contentValue.textContent = value;
    box.append(caption, contentValue);
    meta.append(box);
  });
  const notice = document.createElement("div");
  notice.className = "detail-notice";
  notice.textContent = `Source & collection: ${dataset.provenance}`;
  const action = document.createElement("button");
  action.className = "button button-dark";
  action.type = "button";
  action.textContent = dataset.price === 0 ? "Get free dataset" : `Request access · $${dataset.price}`;
  action.addEventListener("click", () => {
    detailDialog.close();
    showToast(dataset.price === 0 ? "Access request noted. Checkout is not connected in this demo." : "Checkout is not connected in this demo.");
  });
  content.append(eyebrow, title, description, meta, notice, action);
  detailDialog.showModal();
}

function openSellDialog() {
  sellDialog.showModal();
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.search = document.querySelector("#search-input").value.trim();
  state.savedOnly = false;
  document.querySelector("#saved-button").classList.remove("selected");
  render();
});
document.querySelector("#search-input").addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  state.savedOnly = false;
  document.querySelector("#saved-button").classList.remove("selected");
  render();
});
document.querySelectorAll('input[name="category"]').forEach((input) => input.addEventListener("change", (event) => {
  state.category = event.target.value;
  state.savedOnly = false;
  document.querySelector("#saved-button").classList.remove("selected");
  render();
}));
document.querySelectorAll('input[name="price"]').forEach((input) => input.addEventListener("change", (event) => {
  state.price = event.target.value;
  state.savedOnly = false;
  document.querySelector("#saved-button").classList.remove("selected");
  render();
}));
document.querySelectorAll('input[name="format"]').forEach((input) => input.addEventListener("change", () => {
  state.formats = [...document.querySelectorAll('input[name="format"]:checked')].map((checked) => checked.value);
  state.savedOnly = false;
  document.querySelector("#saved-button").classList.remove("selected");
  render();
}));
document.querySelector("#clear-filters").addEventListener("click", clearFilters);
document.querySelector("#empty-clear").addEventListener("click", clearFilters);
function clearFilters() {
  state.search = "";
  state.category = "all";
  state.price = "any";
  state.formats = [];
  state.savedOnly = false;
  document.querySelector("#search-input").value = "";
  document.querySelector('input[name="category"][value="all"]').checked = true;
  document.querySelector('input[name="price"][value="any"]').checked = true;
  document.querySelectorAll('input[name="format"]').forEach((input) => { input.checked = false; });
  document.querySelector("#saved-button").classList.remove("selected");
  render();
}
document.querySelector("#sort-button").addEventListener("click", (event) => {
  state.newestFirst = !state.newestFirst;
  event.currentTarget.innerHTML = state.newestFirst ? 'Newest first <span aria-hidden="true">⌄</span>' : 'Price: low to high <span aria-hidden="true">⌄</span>';
  render();
});
document.querySelector("#saved-button").addEventListener("click", (event) => {
  state.savedOnly = !state.savedOnly;
  event.currentTarget.classList.toggle("selected", state.savedOnly);
  render();
});
document.querySelector("#mobile-filter-button").addEventListener("click", () => {
  document.querySelector(".filters").classList.toggle("show");
});
document.querySelector("#sell-button").addEventListener("click", openSellDialog);
document.querySelector("#how-sell-button").addEventListener("click", openSellDialog);
document.querySelectorAll(".dialog-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));
document.querySelector("#load-more").addEventListener("click", () => showToast("You're all caught up — more datasets are coming soon."));
document.querySelector("#sell-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const price = Number(formData.get("price"));
  const category = String(formData.get("category"));
  const categoryLabels = { climate: "Climate & nature", culture: "Culture & community", cities: "Cities & places", business: "Business & economy" };
  datasets.unshift({
    id: Date.now(),
    title: String(formData.get("title")).trim(),
    category,
    categoryLabel: categoryLabels[category],
    description: String(formData.get("description")).trim(),
    format: String(formData.get("format")),
    size: "Size not provided",
    rows: "Details pending",
    price,
    seller: "You",
    initials: "YO",
    license: String(formData.get("license")),
    updated: "Just now",
    cover: category === "culture" ? "culture" : category === "cities" ? "cities" : category === "business" ? "business" : "climate",
    tags: ["New listing"],
    verified: false,
    provenance: "Submitted by the dataset creator. Source details have not been independently reviewed."
  });
  event.currentTarget.reset();
  sellDialog.close();
  state.savedOnly = false;
  clearFilters();
  showToast("Your listing preview is now at the top of the marketplace.");
  window.scrollTo({ top: document.querySelector(".market-section").offsetTop, behavior: "smooth" });
});

updateSavedCount();
render();
