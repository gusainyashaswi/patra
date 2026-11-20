Build a light, single-page website with the same look and layout as nualt.fr ("Custom Ecommerce, SaaS, AI Agents and Websites · Nualt"), using it as the design reference for this project. Every value below was measured from the live page: use these exact colors, fonts, radii, shadows and spacing rather than inventing your own. Use React + Tailwind CSS (or plain HTML/CSS if you prefer).

About the content: the text, logo and image links below come from the reference page. Use them as placeholder content so the layout matches while you build; they should be replaced with this project's own brand, copy and images before it is published.

OVERALL AESTHETIC
- light UI, mostly flat surfaces, CSS grid sections, flexbox layout.

FONTS
- Font families: Inter, yellix, geistPixel
- Body text: 17.6667px / line-height 28.2667px, weight 400
- H1: 73.5212px, weight 400, color #0755b5
- H2: 41.5632px, weight 400, color #f4f2e8
- H3: 31.2506px, weight 400, color #f4f2e8
- Type scale in use: 17.6667px, 14.6px, 73.5212px, 31.2506px, 19.2962px, 10.9086px, 41.5632px, 17.0667px

COLOR THEME (CSS custom properties)
The page defines these custom properties — reuse them verbatim:

:root {
  --accordion-padding: var(--c15t-space-md);
  --accordion-radius: var(--c15t-radius-md);
  --accordion-duration: var(--c15t-duration-normal);
  --accordion-ease: var(--c15t-easing);
  --accordion-icon-size: 1.25rem;
  --accordion-background-color: var(--c15t-surface);
  --accordion-background-color-dark: var(--c15t-surface);
  --accordion-background-hover: var(--c15t-surface-hover);
  --accordion-background-hover-dark: var(--c15t-surface-hover);
  --accordion-border-color: var(--c15t-border);
  --accordion-border-color-dark: var(--c15t-border);
  --accordion-text-color: var(--c15t-text);
  --accordion-text-color-dark: var(--c15t-text);
  --accordion-icon-color: var(--c15t-text-muted);
  --accordion-icon-color-dark: var(--c15t-text-muted);
  --accordion-arrow-color: var(--c15t-text-muted);
  --accordion-arrow-color-dark: var(--c15t-text-muted);
  --accordion-content-color: var(--c15t-text-muted);
  --accordion-content-color-dark: var(--c15t-text-muted);
  --accordion-focus-ring: var(--c15t-primary);
  --accordion-focus-ring-dark: var(--c15t-primary);
  --accordion-focus-shadow: 0 0 0 2px var(--accordion-focus-ring);
  --accordion-focus-shadow-dark: 0 0 0 2px var(--accordion-focus-ring-dark);
  --button-primary: var(--c15t-primary);
  --button-primary-dark: var(--c15t-primary);
  --button-primary-hover: var(--c15t-primary-hover);
  --button-primary-hover-dark: var(--c15t-primary-hover);
  --button-neutral: var(--c15t-text-muted);
  --button-neutral-dark: var(--c15t-text-muted);
  --button-neutral-hover: var(--c15t-text);
  --button-neutral-hover-dark: var(--c15t-text);
  --button-neutral-soft: var(--c15t-surface-hover);
  --button-neutral-soft-dark: var(--c15t-surface-hover);
  --button-focus-ring: var(--c15t-primary);
  --button-focus-ring-dark: var(--c15t-primary);
  --button-text: var(--c15t-text);
  --button-text-dark: var(--c15t-text);
  --button-text-hover: var(--c15t-text);
  --button-text-hover-dark: var(--c15t-text);
  --button-background-color: var(--c15t-surface);
  --button-background-color-dark: var(--c15t-surface);
  --button-border: var(--c15t-border);
  --button-border-dark: var(--c15t-border);
  --button-hover-overlay: var(--c15t-surface-hover);
  --button-hover-overlay-dark: var(--c15t-surface-hover);
  --button-primary-hover-tint: var(--c15t-primary);
  --button-neutral-hover-tint: var(--c15t-text);
  --button-font: var(--c15t-font-family);
}

- Accent/brand colors: #0755b5
- Surface colors: #0755b5, #f4f2e8, #0755B566
- Text colors: #0755b5, #f4f2e8

COMPONENT CSS (measured from the live page — reuse these blocks)

.button-primary {
  background: #f4f2e8;
  color: #0755b5;
  padding: 0px 16px;
  font-size: 14.6px;
}

- Button style 1: background transparent, text #0755b5, radius 0px, padding 0px 16px, font 14.6px/400
- Button style 2: background #f4f2e8, text #0755b5, radius 0px, padding 0px 16px, font 14.6px/400
- Links: color #0755b5, no underline

ASSETS & MEDIA URLS
Logo: https://nualt.fr/hero/cci-grand-hainaut-inverse.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q
Key images (largest first):
  https://nualt.fr/blog/categories/ia-agentic-workflow.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q
  https://nualt.fr/blog/categories/business-seo.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q
  https://nualt.fr/blog/categories/projets-actus.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q
  https://nualt.fr/blog/categories/developpement-web.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q
  https://nualt.fr/hero/cci-grand-hainaut-inverse.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q
  https://nualt.fr/illu_work/nualt-enveloppe-isometrique.svg?dpl=dpl_HNg5Jt7DVMYcaFfLpmc8rWR3Xe4Q

SECTION-BY-SECTION BREAKDOWN
1. <section class="relative w-full"> — "What you build, you own." — background: #0755b5, contains imagery
2. <section class="on-blue relative"> — "Your product, your code,your call." — background: transparent
3. <section class="relative overflow-x-clip"> — "Built and hostedyour way." — background: #f4f2e8
4. <section class="bg-background py-16"> — "What our clients say." — background: #f4f2e8, contains imagery
5. <section class="relative bg-background"> — "The blog" — background: #f4f2e8, contains imagery
6. <section class="relative bg-background"> — "Giving back to the ecosystem." — background: #0755b5
7. <section class="relative bg-[var(--section-background)]"> — "Questions to askbefore signing" — background: #f4f2e8
8. <section class="on-blue overflow-x-clip"> — "Tell us what you want to build." — background: #0755b5
9. <footer class="on-blue flex"> — "Contact" — background: #0755b5

SHAPE, DEPTH & SPACING
- Spacing scale (padding/gaps): 24px, 16px, 4px, 8px, 96px, 192px, 32px, 48px
- Content max-width: 2193px, 808.733px
- Structure: top navigation header, flexbox sections, grid sections, footer

ANIMATION PATTERNS
- Hover/state transitions are used widely — add smooth 150-300ms transitions on interactive elements.
- Named keyframe animations defined on the page: home-loader-module__8FYZjG__logo-rise, home-loader-module__8FYZjG__loader-failsafe, pixel-arrow-module__pqB5Ra__nudge, tetris-animation-module__xot26q__appear, tetris-animation-module__xot26q__fall, navbar-menu-module__ig3h5W__slide-down, navbar-menu-module__ig3h5W__fade-out, navbar-menu-module__ig3h5W__from-start

Match the values above exactly, keep the sections in the same order, use the image links as placeholders where the reference shows images, and keep the overall mood of the design.

HOW TO SHOW IT
- In a chat: answer with one self-contained HTML file (all CSS in a <style> tag, any JS in a <script> tag, fonts through <link>) and show it as a rendered preview or artifact right away. Don't split it into separate files or ask me to paste it into a page.
- In a coding agent with my project open: build it into the project's own stack, then say exactly where to see it: the file or route, and the command that runs it.
- Never answer with only a description or a list of files.