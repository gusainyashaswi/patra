# illoca – Architectural design at the speed of thought

## Mission
Create implementation-ready, token-driven UI guidance for illoca – Architectural design at the speed of thought that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: illoca – Architectural design at the speed of thought
- URL: https://illoca.unseen.co/
- Audience: buyers, teams, and decision-makers
- Product surface: marketing site

## Style Foundations
- Visual style: structured, tokenized, content-first
- Main font style: `font.family.primary=Graphik Web`, `font.family.stack=Graphik Web, sans-serif`, `font.size.base=12.6px`, `font.weight.base=500`, `font.lineHeight.base=13.86px`
- Typography scale: `font.size.xs=11.03px`, `font.size.sm=12.6px`, `font.size.md=13px`, `font.size.lg=14.18px`, `font.size.xl=18.9px`, `font.size.2xl=25.2px`, `font.size.3xl=75.6px`, `font.size.4xl=80.33px`
- Color palette: `color.text.primary=#373737`, `color.text.secondary=#fef9f1`, `color.text.tertiary=#eadfc9`, `color.text.inverse=#414141`, `color.surface.base=#000000`, `color.surface.muted=#fdf8f0`, `color.surface.raised=#283f7d`, `color.border.strong=rgb(254, 249, 241) rgb(254, 249, 241) rgba(234, 223, 201, 0.4)`
- Spacing scale: `space.1=4px`, `space.2=4.72px`, `space.3=6.3px`, `space.4=9.45px`, `space.5=12px`, `space.6=12.6px`, `space.7=17.33px`, `space.8=18.9px`
- Radius/shadow/motion tokens: `radius.xs=1.58px`, `radius.sm=3.15px`, `radius.md=4px` | `shadow.1=rgba(0, 0, 0, 0.15) 2px 2px 2px 0px`, `shadow.2=rgba(0, 0, 0, 0.1) 4px 4px 0px 0px` | `motion.duration.instant=150ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: buttons (39), links (24), lists (9), cards (3), navigation (1).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
