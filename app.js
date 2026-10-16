import { siteConfig } from './site.config.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const menuButton = $('.menu-toggle');
const mobileMenu = $('#mobile-nav');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  mobileMenu.hidden = true;
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Fechar menu' : 'Abrir menu');
  mobileMenu.hidden = !opening;
});
$$('.mobile-nav a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 851px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });
const header = $('.site-header');
function updateHeader() { header.classList.toggle('scrolled', window.scrollY > 12); }
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

if ('IntersectionObserver' in window) {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
    $$('.reveal').forEach((element) => revealObserver.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$('.desktop-nav a').forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -55% 0px' });
  ['especial', 'pacotes', 'memorias'].forEach((id) => navObserver.observe(document.getElementById(id)));
}

const focusOrigins = new WeakMap();
function openDialog(dialog, trigger) {
  closeMenu();
  focusOrigins.set(dialog, trigger || document.activeElement);
  dialog.showModal();
  document.body.classList.add('modal-open');
}
$$('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    focusOrigins.get(dialog)?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
$$('[data-close]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));

const experiences = {
  lacos: { name: 'Laços', summary: '15 fotos digitais · 30 minutos · Núcleo familiar · 1 look' },
  carrossel: { name: 'Carrossel', summary: '30 fotos digitais · 45 minutos · Núcleo familiar · 2 looks · 20 fotos impressas · Porta-retrato · Mimo especial' },
  memoria: { name: 'Memória', summary: 'Todas as melhores fotos · Núcleo familiar + avós · 2 looks · Mimo especial · Álbum scrapbook 15 × 21 cm, com 20 páginas' },
};
const whatsappNumber = String(siteConfig.whatsapp || '').replace(/\D/g, '');
const hasContact = /^55\d{10,11}$/.test(whatsappNumber);
function whatsappUrl(message) {
  return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message);
}
const whatsappWidget = $('#whatsapp-float');
if (hasContact) {
  whatsappWidget.href = whatsappUrl('Olá, Amanda! Vim pelo site do Carrossel de Memórias e gostaria de saber mais sobre o especial de Natal 2026.');
} else {
  whatsappWidget.hidden = true;
}
Object.entries(siteConfig.prices || {}).forEach(([key, price]) => {
  const element = document.querySelector('[data-price="' + key + '"]');
  if (element && String(price).trim()) {
    element.textContent = price;
    element.closest('.package-price')?.classList.add('has-price');
  }
  const bookingPrice = document.querySelector('[data-booking-price="' + key + '"]');
  if (bookingPrice && String(price).trim()) bookingPrice.textContent = price;
});
$$('[data-whatsapp-package]').forEach((link) => {
  if (hasContact) {
    link.href = whatsappUrl('Olá, Amanda! Vim pelo site do Carrossel de Memórias e preciso de ajuda para escolher entre os pacotes Laços, Carrossel e Memória.');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else {
    link.href = '#agendar';
  }
});

const bookingChoice = $('.booking-choice');
const bookingTrigger = $('#booking-choice-trigger');
const bookingValue = $('#booking-choice-value');
const bookingList = $('#booking-choice-list');
const bookingOptions = $$('.booking-choice-option');
const bookingSummary = $('#booking-summary');
const bookingPanel = $('#booking-calendar-panel');
const bookingFrame = $('#booking-calendar');
const bookingExternal = $('#booking-external');
const bookingPlanNotice = $('#booking-plan-notice');
const bookingPlanWhatsapp = $('#booking-plan-whatsapp');
bookingExternal.href = siteConfig.bookingUrl;
let selectedBookingPackage = '';

function closeBookingChoice(restoreFocus = false) {
  bookingList.hidden = true;
  bookingTrigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) bookingTrigger.focus({ preventScroll: true });
}

function openBookingChoice() {
  bookingList.hidden = false;
  bookingTrigger.setAttribute('aria-expanded', 'true');
  (bookingOptions.find((option) => option.dataset.value === selectedBookingPackage) || bookingOptions[0]).focus({ preventScroll: true });
}

function selectBookingPackage(key) {
  const selected = experiences[key];
  if (!selected) {
    bookingPanel.hidden = true;
    bookingSummary.textContent = 'Selecione uma experiência para ver os horários disponíveis.';
    return;
  }
  selectedBookingPackage = key;
  bookingValue.textContent = selected.name;
  bookingOptions.forEach((option) => { option.setAttribute('aria-selected', String(option.dataset.value === key)); });
  const lot = siteConfig.currentLot || 'Lote 1';
  bookingSummary.textContent = 'Plano ' + selected.name + ' escolhido. Agora selecione a data e o horário abaixo.';
  bookingPanel.hidden = false;
  if (!bookingFrame.getAttribute('src')) {
    bookingFrame.setAttribute('src', siteConfig.bookingEmbedUrl || siteConfig.bookingUrl);
  }
  bookingPlanNotice.hidden = !hasContact;
  if (hasContact) {
    bookingPlanWhatsapp.href = whatsappUrl('Olá, Amanda! Reservei um horário pelo site do Carrossel de Memórias 2026 e escolhi o pacote ' + selected.name + ' do ' + lot + '.');
  }
}
bookingTrigger.addEventListener('click', () => {
  if (bookingList.hidden) openBookingChoice();
  else closeBookingChoice(true);
});
bookingTrigger.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    openBookingChoice();
  }
});
bookingOptions.forEach((option) => option.addEventListener('click', () => {
  selectBookingPackage(option.dataset.value);
  closeBookingChoice(true);
}));
bookingList.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeBookingChoice(true);
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const current = bookingOptions.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? bookingOptions.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + bookingOptions.length) % bookingOptions.length;
    bookingOptions[next].focus({ preventScroll: true });
  } else if (event.key === 'Tab') {
    closeBookingChoice();
  }
});
document.addEventListener('click', (event) => {
  if (!bookingList.hidden && !bookingChoice.contains(event.target)) closeBookingChoice();
});
$$('[data-select-package]').forEach((link) => {
  link.addEventListener('click', () => {
    selectBookingPackage(link.dataset.selectPackage);
    closeBookingChoice();
  });
});

const photos = [
  { src: 'lacos-em-familia', alt: 'Mãe, pai e bebê abraçados no cenário de Natal', caption: 'O nosso lugar é junto. · Amanda Concer' },
  { src: 'encanto-da-infancia', alt: 'Menina sorrindo em um cavalinho de madeira no cenário de Natal', caption: 'A beleza de ser criança. · Amanda Concer' },
  { src: 'memorias-de-irmaos', alt: 'Dois irmãos brincando juntos no cenário de Natal', caption: 'Pequenos instantes. Para sempre. · Amanda Concer' },
  { src: 'sorriso-de-natal', alt: 'Menino sorrindo para a câmera em seu ensaio de Natal', caption: 'A alegria mora nos detalhes. · Amanda Concer' },
  { src: 'colo-de-mae', alt: 'Mãe abraçando sua filha no cenário de Natal', caption: 'O abraço que é casa. · Amanda Concer' },
  { src: 'magia-do-natal', alt: 'Menina de boina e roupa vermelha segurando um globo de neve', caption: 'A magia mora nos detalhes. · Amanda Concer' },
  { src: 'afeto-em-detalhes', alt: 'Retrato próximo de mãe e filha, sorrindo com os rostos juntos', caption: 'O que é amor, fica. · Amanda Concer' },
];
let photoIndex = 0;
const lightbox = $('#lightbox');
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const photo = photos[photoIndex];
  $('#lightbox-image').src = `assets/images/${photo.src}.jpg`;
  $('#lightbox-image').alt = photo.alt;
  $('#lightbox-caption').textContent = photo.caption;
  $('#lightbox-count').textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
}
$$('[data-photo]').forEach((button) => button.addEventListener('click', () => {
  showPhoto(Number(button.dataset.photo));
  openDialog(lightbox, button);
}));
$('.lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
$('.lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(photoIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(photoIndex + 1); }
});
let touchStartX = null;
let touchStartY = null;
lightbox.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });
lightbox.addEventListener('touchend', (event) => {
  if (touchStartX === null) return;
  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) showPhoto(photoIndex + (dx < 0 ? 1 : -1));
  touchStartX = null;
  touchStartY = null;
}, { passive: true });
