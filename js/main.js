// ===================================================================
// Paila Travel & Experiences — site behaviour
// ===================================================================

// --- EDIT THESE TWO NUMBERS WHENEVER THEY CHANGE -------------------
// Both are stored WITHOUT the leading 0, with Nepal's country code
// (977) in front, which is the format WhatsApp / tel: links need.
const CALL_NUMBER = "9779762984823";      // shown/dialled for the Call button
const WHATSAPP_NUMBER = "9779762984823";  // used for WhatsApp chat + bookings
// ---------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireBookingModal();
  wireContactLinks();
  wireRevealAnimations();
  wireContactPageForm();
});

/* ---------------------------- Nav toggle (mobile) ---------------------------- */
function wireNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
  // tapping outside the drawer, or rotating back to desktop, closes it
  document.addEventListener("click", (e) => {
    if (!links.classList.contains("open")) return;
    if (links.contains(e.target) || toggle.contains(e.target)) return;
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------------------------- Fill in call/WhatsApp links + icons ---------------------------- */
function wireContactLinks() {
  document.querySelectorAll("[data-call-link]").forEach((el) => {
    el.href = `tel:+${CALL_NUMBER}`;
  });
  document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
    const presetText = el.getAttribute("data-whatsapp-text") || "Hi Paila Travel, I'd like to know more about your tour packages.";
    el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(presetText)}`;
    el.target = "_blank";
    el.rel = "noopener";
  });
}

/* ---------------------------- Booking modal ---------------------------- */
function wireBookingModal() {
  const backdrop = document.getElementById("booking-modal");
  if (!backdrop) return;
  const openers = document.querySelectorAll("[data-open-booking]");
  const closeBtn = backdrop.querySelector(".modal-close");
  const form = document.getElementById("booking-form");
  const msg = document.getElementById("booking-form-msg");
  let lastFocused = null;

  wireDestinationToggle(form);
  wireCalendarTypeToggle(form);
  wireDateAutoSlashes(form);

  const open = (e) => {
    if (e) e.preventDefault();
    lastFocused = e && e.currentTarget ? e.currentTarget : null;

    // "Book this trip" buttons on the destinations page carry the place with them
    const preset = lastFocused && lastFocused.getAttribute("data-destination");
    if (preset && form && form.destination) form.destination.value = preset;
    syncDestinationOther(form);

    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    const firstField = form?.querySelector("input, select");
    firstField?.focus();
  };
  const close = () => {
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
    lastFocused?.focus?.();
  };

  openers.forEach((btn) => btn.addEventListener("click", open));
  closeBtn?.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop.classList.contains("open")) close();
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    sendEnquiry(form, msg);
  });
}

/* Show/require the free-text destination field only when "Somewhere else
   in Nepal" is chosen, and clear it out again whenever it's hidden. */
function syncDestinationOther(form) {
  const select = form?.elements?.destination;
  const otherField = form?.elements?.destinationOther;
  if (!select || !otherField) return;
  const isOther = select.value === "Somewhere else in Nepal";
  const wrap = otherField.closest(".field") || otherField.parentElement;
  if (wrap) wrap.hidden = !isOther;
  otherField.required = isOther;
  if (!isOther) otherField.value = "";
}

function wireDestinationToggle(form) {
  const select = form?.elements?.destination;
  if (!select) return;
  select.addEventListener("change", () => syncDestinationOther(form));
  syncDestinationOther(form);
}

/* AD dates are written dd/mm/yyyy; BS (Bikram Sambat) dates are written
   yyyy/mm/dd, which is the order Nepali BS dates are conventionally
   read/written in. */
function dateFormatFor(calendarType) {
  return calendarType === "BS" ? "yyyy/mm/dd" : "dd/mm/yyyy";
}

/* Keep the label hint + input placeholder in sync with the chosen
   calendar (AD/BS), and clear the date field on switch so a half-typed
   date in the old format can't be mistaken for the new one. */
function wireCalendarTypeToggle(form) {
  const select = form?.elements?.calendartype;
  const dateField = form?.elements?.bookingdate;
  if (!select || !dateField) return;
  const hint = form.querySelector("[data-date-hint]");

  const apply = () => {
    const format = dateFormatFor(select.value);
    dateField.placeholder = format;
    dateField.setAttribute("aria-label", `Booking date (${format})`);
    if (hint) hint.textContent = `(${format})`;
  };

  select.addEventListener("change", () => {
    dateField.value = "";
    apply();
  });
  apply();
}

/* Auto-insert the slashes as the visitor types the booking date, so a
   typed "18042026" becomes "18/04/2026" for AD, or a typed "20820418"
   becomes "2082/04/18" for BS — grouped to match whichever calendar is
   currently selected. */
function wireDateAutoSlashes(form) {
  const dateField = form?.elements?.bookingdate;
  const calendarSelect = form?.elements?.calendartype;
  if (!dateField) return;
  dateField.addEventListener("input", () => {
    const digits = dateField.value.replace(/\D/g, "").slice(0, 8);
    const isBS = calendarSelect && calendarSelect.value === "BS";

    if (isBS) {
      // yyyy/mm/dd
      if (digits.length > 6) {
        dateField.value = `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
      } else if (digits.length > 4) {
        dateField.value = `${digits.slice(0, 4)}/${digits.slice(4)}`;
      } else {
        dateField.value = digits;
      }
    } else {
      // dd/mm/yyyy
      if (digits.length > 4) {
        dateField.value = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      } else if (digits.length > 2) {
        dateField.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        dateField.value = digits;
      }
    }
  });
}

/* Shape check matching the calendar-specific format (dd/mm/yyyy for AD,
   yyyy/mm/dd for BS). For AD dates we also confirm it's a real calendar
   date and that it isn't in the past. BS (Bikram Sambat) dates get a
   day/month/year range sanity-check here — turning that into a real BS
   calendar check needs a Bikram Sambat date-conversion library. */
function validateBookingDate(value, calendarType) {
  const isBS = calendarType === "BS";
  const format = dateFormatFor(calendarType);
  const pattern = isBS ? /^(\d{4})\/(\d{2})\/(\d{2})$/ : /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = pattern.exec(value);
  if (!match) {
    return { ok: false, error: `Please enter the booking date as ${format}.` };
  }

  let day, month, year;
  if (isBS) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  const yearRange = isBS ? { min: 2070, max: 2200 } : { min: 2000, max: 2100 };
  if (month < 1 || month > 12 || day < 1 || day > 32 || year < yearRange.min || year > yearRange.max) {
    return { ok: false, error: `That doesn't look like a valid date — please use ${format}.` };
  }

  if (!isBS) {
    const d = new Date(year, month - 1, day);
    const isRealDate = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
    if (!isRealDate) {
      return { ok: false, error: "That doesn't look like a real date — please double-check it." };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) {
      return { ok: false, error: "Booking date can't be in the past." };
    }
  }

  return { ok: true };
}

/* Shared: validate, build the WhatsApp message, hand off to WhatsApp */
function sendEnquiry(form, msg) {
  const name = form.fullname.value.trim();
  const address = form.address.value.trim();
  const phone = form.phone.value.trim();
  const destination = form.destination ? form.destination.value : "";
  const destinationOther = form.destinationOther ? form.destinationOther.value.trim() : "";
  const groupSize = form.groupsize ? form.groupsize.value.trim() : "";
  const tripDuration = form.tripduration ? form.tripduration.value.trim() : "";
  const bookingDate = form.bookingdate ? form.bookingdate.value.trim() : "";
  const calendarType = form.calendartype ? form.calendartype.value : "AD";
  const agreed = form.agreeNote ? form.agreeNote.checked : false;

  // Every core field must be filled in before we go further.
  if (!name || !address || !phone || !destination || !groupSize || !tripDuration || !bookingDate) {
    showMsg(msg, "Please fill in every field — including number of travellers, trip duration and booking date — before sending.", "err");
    return;
  }

  if (destination === "Somewhere else in Nepal" && !destinationOther) {
    showMsg(msg, "Please tell us which destination you have in mind.", "err");
    return;
  }

  const groupSizeNum = Number(groupSize);
  if (!Number.isInteger(groupSizeNum) || groupSizeNum < 1) {
    showMsg(msg, "Please enter a valid number of travellers (1 or more).", "err");
    return;
  }

  const dateCheck = validateBookingDate(bookingDate, calendarType);
  if (!dateCheck.ok) {
    showMsg(msg, dateCheck.error, "err");
    return;
  }

  if (!agreed) {
    showMsg(msg, "Please tick the note at the bottom of the form to continue.", "err");
    return;
  }

  const destinationLine =
    destination === "Somewhere else in Nepal" ? `Somewhere else in Nepal — ${destinationOther}` : destination;

  const text =
    `New booking enquiry — Paila Travel & Experiences\n` +
    `Full Name: ${name}\n` +
    `Address: ${address}\n` +
    `Contact No: ${phone}\n` +
    `Destination: ${destinationLine}\n` +
    `Number of Travellers: ${groupSizeNum}\n` +
    `Trip Duration: ${tripDuration}\n` +
    `Booking Date: ${bookingDate} (${calendarType})`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  showMsg(msg, "Opening WhatsApp with your details filled in — just hit send there.", "ok");
  window.open(waUrl, "_blank", "noopener");
  form.reset();
  syncDestinationOther(form);
}

function showMsg(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "err");
  el.classList.add("show", kind);
}

/* ---------------------------- Contact page inline form (same WhatsApp send) ---------------------------- */
function wireContactPageForm() {
  const form = document.getElementById("contact-page-form");
  if (!form) return;
  const msg = document.getElementById("contact-page-form-msg");
  wireDestinationToggle(form);
  wireCalendarTypeToggle(form);
  wireDateAutoSlashes(form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendEnquiry(form, msg);
  });
}

/* ---------------------------- Gentle scroll reveal ---------------------------- */
function wireRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}
