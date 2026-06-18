# Design System

Dokumentacja systemu wizualnego portfolio kamilzeglen.pl.
Służy jako punkt odniesienia przy budowaniu nowych projektów w tym samym stylu.

---

## Filozofia

- **Dark-first** — ciemne tło jako baza, jasne elementy jako akcent
- **Minimalizm** — zero dekoracji bez funkcji, każdy element niesie znaczenie
- **Pomarańczowy akcent** — jeden kolor wyróżniający, używany oszczędnie
- **Typografia jako hierarchia** — rozmiar i waga budują strukturę, kolor wzmacnia
- **Subtelny ruch** — animacje krótkie, płynne, respektujące `prefers-reduced-motion`

---

## Kolory

```css
/* Tła */
--color-black:         #080808   /* tło strony */
--color-surface:       #111111   /* karty, sekcje */
--color-surface-2:     #181818   /* zagnieżdżone elementy */
--color-surface-3:     #222222   /* hover, aktywne stany */

/* Obramowania */
--color-border:        #2a2a2a   /* domyślna linia */
--color-border-2:      #333333   /* mocniejsza linia */

/* Tekst */
--color-text:          #f0ede8   /* główny tekst */
--color-text-2:        #9a9690   /* drugorzędny tekst */
--color-text-3:        #837e77   /* etykiety, placeholdery */

/* Akcent */
--color-orange:        #f5770f   /* główny akcent */
--color-orange-2:      #ff0000   /* hover na CTA (rzadko) */
--color-orange-dim:    #2a1500   /* tło akcentu */
--color-orange-border: #4a2200   /* obramowanie akcentu */
```

### Zasady użycia kolorów

| Zastosowanie | Kolor |
|---|---|
| Tło strony | `--color-black` |
| Karty, sekcje z tłem | `--color-surface` |
| Hover kart | `--color-surface-2` |
| Nagłówki, ważny tekst | `--color-text` |
| Opisy, paragraf | `--color-text-2` |
| Etykiety, meta | `--color-text-3` |
| CTA, linki aktywne, ikony | `--color-orange` |
| Badge / pill akcentowy | `--color-orange-dim` + `--color-orange-border` |
| Linie sekcji | `--color-border` |

---

## Typografia

```css
--font-display: "Space Grotesk", sans-serif;   /* nagłówki, logo, CTA */
--font-body:    "Inter", sans-serif;            /* tekst, opisy */
```

### Skala typograficzna

| Rola | Font | Rozmiar | Waga | Letter-spacing |
|---|---|---|---|---|
| Hero headline | Space Grotesk | `clamp(3rem, 8vw, 6.5rem)` | 700 | -0.02em |
| Section title | Space Grotesk | `clamp(1.9rem, 3.3vw, 3.25rem)` | 700 | -0.02em |
| Card title | Space Grotesk | `1.6rem` | 700 | -0.02em |
| Section label | Inter | `0.72rem` | 500 | 0.15em |
| Nav links | Inter | `0.85rem` | 400 | 0.04em |
| Body / opisy | Inter | `0.95–1.05rem` | 400 | 0 |
| Badge / tag | Inter | `0.66–0.72rem` | 500 | 0.1em |
| Meta / URL | Inter | `0.8rem` | 400 | 0 |

### Ogólne zasady

- Nagłówki zawsze `text-wrap: balance`
- `line-height: 1.08` dla nagłówków, `1.65` dla body, `1.8` dla długich opisów
- Akcent `<em>` w nagłówkach = kolor `--color-orange`, `font-style: normal`
- Section label zawsze uppercase + linia 32px po lewej

---

## Spacing

```css
--gutter: 2rem;          /* padding poziomy kontenera (desktop) */
--gutter: 1.25rem;       /* padding poziomy kontenera (≤768px) */

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.section-pad {
  padding: 7rem 0;       /* desktop */
  padding: 4.5rem 0;     /* ≤768px */
}
```

### Wewnętrzne odstępy

| Element | Wartość |
|---|---|
| Gap kart (grid 2-kol) | `2rem` |
| Padding kart | `1.75rem` |
| Gap między tagami | `0.4rem` |
| Margin-bottom section label | `1rem` |
| Margin-bottom section title | `1rem` |

---

## Komponenty

### Section Label

Zawsze nad tytułem sekcji. Linia + tekst uppercase.

```css
.section-label {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-orange);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.section-label::before {
  content: "";
  flex: 0 0 32px;
  height: 1px;
  background: var(--color-orange);
}
```

### Tag / Pill

Technologie, kategorie.

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.7rem;
  border-radius: 3px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border-2);
  color: var(--color-text-2);
}
.tag.highlight {
  background: var(--color-orange-dim);
  border-color: var(--color-orange-border);
  color: var(--color-orange);
}
```

### Przyciski

```css
/* Primaty CTA */
.btn-primary {
  background: var(--color-orange);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.75rem 1.75rem;
  border-radius: 6px;
  transition: background 0.2s, transform 0.2s;
}
.btn-primary:hover {
  background: #e06a0c;
  transform: translateY(-1px);
}

/* Drugorzędny */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border-2);
  color: var(--color-text-2);
  font-size: 0.9rem;
  padding: 0.75rem 1.75rem;
  border-radius: 6px;
  transition: border-color 0.2s, color 0.2s;
}
.btn-secondary:hover {
  border-color: var(--color-orange-border);
  color: var(--color-text);
}
```

### Karta

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
}
.card:hover {
  border-color: var(--color-orange-border);
  transform: translateY(-4px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}
```

### Section Divider

Linia między sekcjami.

```css
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  margin: 0 var(--gutter);
}
```

### Badge akcentowy (project badge)

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-orange);
  background: var(--color-orange-dim);
  border: 1px solid var(--color-orange-border);
  padding: 0.25rem 0.65rem;
  border-radius: 2px;
}
```

---

## Tło / efekty dekoracyjne

### Kratownica (grid background)

Używana w hero i jako element og-image.

```css
.grid-bg {
  background-image:
    linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
  /* opcjonalnie — zanikanie od środka */
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}
```

### Pomarańczowy glow

```css
.glow {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(245, 98, 15, 0.12) 0%, transparent 70%);
  pointer-events: none;
}
```

### Szum (noise texture)

Globalny overlay na całej stronie — efekt ziarna.

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* fractalNoise SVG */
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}
```

---

## Animacje

```css
/* Pojawianie się z dołu */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Samo pojawianie */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Pulsowanie (np. status dot) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

### Reveal on scroll

Elementy pojawiają się przy scroll (IntersectionObserver).

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
```

### Zasady animacji

- Czas trwania: `0.2s` mikro-interakcje, `0.6s` reveal, `0.8s` hero photo
- Easing: zawsze `ease` lub `ease-out`, nigdy `linear`
- Obowiązkowy reset przy `prefers-reduced-motion: reduce`

---

## Responsywność

| Breakpoint | Zmiana |
|---|---|
| `≤900px` | grid projektów: 2 kol → 1 kol |
| `≤768px` | `--gutter: 1.25rem`, `section-pad: 4.5rem`, nav ukrywa linki, skills: 3 kol → 2 kol, footer stack |
| `≤600px` | skills: 2 kol → 1 kol (wyśrodkowanie), project-meta grid zmiana obszarów, hero buttons full-width |

---

## Dostępność

```css
:focus-visible {
  outline: 2px solid var(--color-orange);
  outline-offset: 3px;
  border-radius: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

- Skip-link: stały, pojawia się przy `:focus`
- `aria-label` na ikonach bez tekstu
- `prefers-reduced-motion` — wyłącza wszystkie przejścia i animacje
- Kontrast tekstu głównego: `#f0ede8` na `#080808` = 17.5:1 (AAA)

---

## OG Image

Format: **1200 × 630 px**

Elementy (od góry):
1. Tło `#0a0a0a` + gradient pomarańczowy prawy-dolny + kratownica `#2a2a2a` 60px
2. `PORTFOLIO` — 18px, bold, letter-spacing 8px, `#f5770f`, margin-top ~60px
3. Logo / monogram — odstęp ~80px od napisu
4. `KAMIL ŻEGLEŃ` — 42px, bold, letter-spacing 4px, `#f0ede8`
5. `< DEVELOPER />` — 22px, regular, letter-spacing 6px, `#9a9690`
6. Tech stack — 30px, regular, `#c8c4be`
7. Linia 64×3px, `#f5770f`
8. URL — 26px, light, `#9a9690`

---

## Fonty (import)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
```
