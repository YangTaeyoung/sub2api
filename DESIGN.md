---
name: Sub2API
description: Compact administration UI for an AI API gateway
colors:
  primary: "#5b5bd6"
  primary-hover: "#4c49b5"
  primary-dark: "#8992f9"
  canvas-light: "#f7f8fa"
  sidebar-light: "#f1f2f5"
  panel-light: "#ffffff"
  hover-light: "#e9ebf0"
  border-light: "#e1e3e8"
  text-light: "#181c25"
  secondary-light: "#515968"
  muted-light: "#68707e"
  active-light: "#e8e9fb"
  active-text-light: "#4c49b5"
  canvas-dark: "#111214"
  panel-dark: "#17181b"
  raised-dark: "#1c1e23"
  hover-dark: "#24262d"
  border-dark: "#2b2e35"
  text-dark: "#ededef"
  secondary-dark: "#b4b8c2"
  muted-dark: "#969ba7"
  active-dark: "#27283e"
  active-text-dark: "#b7bcff"
typography:
  title:
    fontFamily: "Pretendard Variable, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  metric:
    fontFamily: "Pretendard Variable, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 550
    lineHeight: "34px"
  body:
    fontFamily: "Pretendard Variable, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Pretendard Variable, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
  metadata:
    fontFamily: "Pretendard Variable, -apple-system, sans-serif"
    fontSize: "12px"
    lineHeight: "18px"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel-light}"
    rounded: "{rounded.md}"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    rounded: "{rounded.md}"
    typography: "{typography.body}"
    padding: "5px 12px"
  card:
    rounded: "{rounded.lg}"
  app-sidebar:
    width: "228px"
  app-header:
    height: "48px"
  home-primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel-light}"
    rounded: "{rounded.md}"
    typography: "{typography.label}"
    padding: "10px 16px"
---

# Design System: Sub2API

## Overview

Sub2API uses a compact, neutral administration interface. Navigation stays quiet; operational status, usage, and actions carry the visual hierarchy. Korean and Latin text share one locally served font family.

The visual reference is the actual application UI in [Linear's redesign article](https://linear.app/now/how-we-redesigned-the-linear-ui). Its compact navigation, aligned headers, neutral surfaces, and restrained accent informed this implementation. The values below belong to Sub2API; they are not Linear's CSS tokens.

This file records implemented UI decisions. Sources: [global stylesheet](frontend/src/style.css), [Tailwind theme](frontend/tailwind.config.js), and the component paths named below.

## Colors

Indigo is the interface accent. Neutral surfaces establish hierarchy in both themes. Semantic status colors remain available for warnings, errors, success, and data series.

Use `--surface-canvas`, `--surface-sidebar`, `--surface-panel`, `--surface-raised`, and `--surface-hover` for surfaces. Use `--border-default` for dividers and panel outlines. Text uses `--text-primary`, `--text-secondary`, and `--text-muted`. Active navigation uses `--accent-soft` with `--accent-text`; focus uses `--accent-primary`.

The frontmatter records the exact light and dark values from `frontend/src/style.css`. In dark mode the sidebar and standard panel share `panel-dark`; raised controls use `raised-dark`. Tailwind `gray`, `dark`, and `primary` ramps provide matching utility classes.

Chart series have their own explicit light/dark pairs in [useChartTheme](frontend/src/composables/useChartTheme.ts): input `#5966d6` / `#939cff`, output `#288b76` / `#70bcaa`, cache creation `#a87937` / `#cba879`, cache read `#477f9f` / `#84abc4`, and cache hit rate `#8665ad` / `#b5a1df`. The chart helper also defines neutral text, grids, and tooltips.

## Typography

**UI font:** Pretendard Variable v1.3.9, self-hosted at `/fonts/pretendard/PretendardVariable.woff2`, with `font-display: swap` and weight range 45–920. The asset and SIL Open Font License are in [public/fonts/pretendard](frontend/public/fonts/pretendard/README.md). See the [official Pretendard source](https://github.com/orioncactus/pretendard).

The configured fallback stack includes Apple SD Gothic Neo, Noto Sans KR, Segoe UI, and system sans-serif fonts. Monospace uses the platform UI monospace stack. Metrics and numeric table content use tabular numerals.

- Body and navigation: 13px; Tailwind `text-sm` uses 20px line height.
- Metadata: 12px / 18px; chart annotations additionally use 11px.
- App header title: 13px / 20px, weight 550.
- Overview title: 24px / 32px, weight 600; overview metric: 28px / 34px, weight 550.
- Settings section headings: 14px / 20px, weight 600.

Korean body text keeps normal tracking. The overview title and numeric metrics have their own small negative tracking. Sources: `frontend/src/style.css`, `frontend/tailwind.config.js`, `frontend/src/views/admin/DashboardView.vue`, and `frontend/src/views/admin/SettingsView.vue`.

The default Home entry uses the same Pretendard family with a quiet, semibold headline (36–60px fluid size, 1.18 line height, weight 600). At 720px and below the headline is 38px, then 34px at 380px and below. Introductory copy uses 16px / 1.75 on desktop and 14px on mobile, with Korean word preservation and safe wrapping for long configured text. This is a Home-specific hierarchy, not a replacement for the compact workspace title scale. Source: `frontend/src/views/HomeView.vue:293–294`, `:344–345`.

## Layout

The desktop shell uses a 228px sidebar, a 52px collapsed rail, a 48px app header, and 24px main gutters. Navigation items have a 32px minimum height and 16px glyphs. Below 1024px the sidebar becomes a drawer and main gutters become 20px; below 640px gutters become 16px. Coarse-pointer shared buttons, fields, and navigation have a 44px minimum height.

The overview has a maximum width of 1440px and a primary content area with a secondary column. It stacks as viewport space decreases. Settings uses a 960px maximum form width and a horizontally scrollable, intrinsic-width tab strip. Accounts and API keys use natural table height with a viewport-limited scroll area for longer lists. Fresh column defaults show essential fields; saved column preferences remain in effect. Extra account usage and provider metadata remain available in disclosures.

Sources: `frontend/src/style.css`, `frontend/src/components/layout/AppLayout.vue`, `frontend/src/views/admin/DashboardView.vue`, `frontend/src/views/admin/SettingsView.vue`, and `frontend/src/views/admin/AccountsView.vue`.

The default Home entry uses a centered 1120px maximum content width with 40px desktop side gutters. Its header, introduction, request-flow figure, flat capability rows, and footer share that alignment. At 720px and below, gutters become 20px, the client → gateway → connected-service flow becomes vertical, and the capability section becomes one column; at 380px and below, gutters become 16px. The endpoint URL wraps at the mobile breakpoint while POST and the copy control remain separate. Sources: `frontend/src/views/HomeView.vue:278–280`, `:304`, `:332–345`.

## Elevation & Depth

Panels use tonal separation and a thin border. Shared `card`, `glass`, and glow shadow aliases resolve to no shadow in the theme. Floating menus, tooltips, dialogs, and onboarding popovers retain shadows where they separate overlapping content. Secondary buttons retain a small conventional control shadow.

The shell has no decorative mesh background. Settings tabs use a single active underline rather than a raised capsule. Sources: `frontend/tailwind.config.js`, `frontend/src/style.css`, and `frontend/src/styles/onboarding.css`.

## Shapes

Controls use 6px corners, standard panels use 8px corners, and small badges use 4px corners. Compact chart controls also use 4px corners. Switches, progress tracks, and status dots retain circular or fully rounded shapes for their established function.

## Components

**Buttons and fields.** Shared buttons and `.input` fields have a 32px desktop minimum height. Primary actions use solid indigo. Secondary actions use neutral surfaces and borders. Inputs use a border and focus ring; disabled states lower emphasis and prevent interaction. Focus-visible indicators remain explicit. See `frontend/src/style.css`, `frontend/src/components/common/Select.vue`, and `frontend/src/components/common/DateRangePicker.vue`.

**Navigation.** Sidebar active items use a quiet indigo-tinted surface. Collapsed items retain accessible labels. Mobile navigation exposes full labels, closes with Escape, and uses a backdrop. Settings tabs are 40px tall on fine pointers and 44px on coarse pointers, with one indigo underline and no truncation rule. See `frontend/src/components/layout/AppSidebar.vue` and `frontend/src/views/admin/SettingsView.vue`.

**Tables and account disclosures.** Shared headers use 12px labels and neutral backgrounds. Numeric table content uses tabular numerals. The Accounts route presents compact provider and supported OAuth usage summaries; original detail content and actions stay mounted in native disclosures. Degraded usage errors remain visible in the collapsed summary. Edit, delete, and more actions retain accessible labels. See `frontend/src/components/common/DataTable.vue`, `frontend/src/components/account/AccountUsageCell.vue`, and `frontend/src/views/admin/AccountsView.vue`.

**Charts.** The token trend uses thin line series for multiple time buckets and bars for one bucket. Token volume and cache hit rate use separate modes; a percentage scale runs from 0 to 100. Series controls and a data table supplement the canvas. Model distribution includes a compact table and responsive row presentation. Shared chart colors follow the actual document theme class. See `frontend/src/components/charts/TokenUsageTrend.vue`, `frontend/src/components/charts/ModelDistributionChart.vue`, and `frontend/src/composables/useChartTheme.ts`.

**Onboarding.** Popovers use the shared font and semantic neutral surfaces. Footer content wraps, keyboard hints occupy their own line, and mobile navigation buttons have a 44px minimum height. On viewports up to 480px, popovers use 16px side margins and 18px headings with Korean word wrapping. See `frontend/src/styles/onboarding.css`.

**Home entry.** The default `/home` surface extends the existing Workspace world: neutral canvas, a quiet branded header, one indigo primary action, and thin dividers. The primary action uses `home-primary-action` in both themes, retains white text, and brightens on hover; its minimum height is 42px on desktop and 44px at 720px and below. It inherits the global visible focus outline. Anonymous visitors enter through sign-in; authenticated visitors continue to the administrator or user dashboard according to their role. Configured custom HTML or iframe content takes precedence over compact mode, which takes precedence over this default entry. Configured branding, subtitles, documentation links, and model-plaza visibility retain their existing settings and access gates. Sources: `frontend/src/views/HomeView.vue:3–17`, `:94–124`, `:193–235`, `:296–297`, `:344`; `frontend/src/style.css:60`.

**Home request flow.** A bordered panel shows client → gateway → connected services as an explicitly labelled example, followed by a protocol selector and request address. The framed gateway is a node in the diagram; lower account, key, and usage descriptions remain flat rows. Provider identifiers do not assert live model availability, and the availability caveat stays beside the example. OpenAI selects `/v1/responses`; Anthropic selects `/v1/messages`. Tabs expose selected state and panel relationships, use one tab stop, and support Left/Right, Home, and End keys. The copy action receives the complete selected request URL and announces successful copying through a polite status message. Keep the complete path visible on mobile through wrapping. Sources: `frontend/src/views/HomeView.vue:133–166`, `:229–244`, `:301–337`, `:344`.

## Do's and Don'ts

- **Do** reuse semantic surfaces and text tokens across both themes.
- **Do** keep Korean and Latin labels in Pretendard, and use tabular numerals for comparable metrics.
- **Do** preserve real states, errors, empty states, and existing actions when reducing visual density.
- **Do** keep detail content reachable through the existing disclosures, menus, or dialogs.
- **Don't** add decorative gradients, glow, or glass effects to the shell and operational panels.
- **Don't** use a second accent or an additional raised capsule to mark an already active settings tab.
- **Don't** fabricate trends, status, quota values, or sample data for appearance.
