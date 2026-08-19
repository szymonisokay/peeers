/**
 * Peeers design tokens.
 *
 * The `light` values come from the design spec (written in oklch) — the hex codes
 * below are its exact sRGB equivalent and match what was measured from the
 * mockups in assets/design. The `dark` values and the semantic colors were
 * measured directly from the mockups; each one names its source so it can be
 * re-checked.
 */

export const palette = {
	light: {
		/** oklch(0.92 0.005 260) — app background */
		background: '#F6F7F9',
		/** cards, sheets, bars */
		surface: '#FFFFFF',
		/** oklch(0.92 0.005 260) */
		border: '#E3E5E8',
		/** oklch(0.52 0.17 275) */
		accent: '#505AC8',
		/** oklch(0.24 0.01 260) */
		text: '#1C1F24',
		/** measured: 03-feed-przestrzeni (timestamp) */
		textMuted: '#7D8086',
		/** measured: 13-ekran-ty ("Usuń dane z tego telefonu") */
		danger: '#C13C3B',
		/** measured: 41-archiwum-list (checkmark on a closed list) */
		success: '#09672E',
		/** measured: 27-bez-sieci (offline banner) */
		warning: '#DEA143',
		warningSurface: '#FBF1DC',
		warningText: '#5F482E',
		/** measured: 05-co-tworzymy — a selected option card and its icon tile */
		selectedSurface: '#F5F6FC',
		selectedBorder: '#DADDEC',
		tileFill: '#F0F2F5',
	},
	dark: {
		/** measured: 38-feed-ciemny */
		background: '#14161B',
		surface: '#1B1E25',
		border: '#2B2E34',
		/** measured: 38-feed-ciemny (add button) — lighter than light mode for contrast */
		accent: '#7787F3',
		/** measured: 40-notatka-ciemna */
		text: '#F0F2F4',
		textMuted: '#959698',
		/** dark-mode semantics — lightened variants, not present in the mockups */
		danger: '#E86B6A',
		success: '#3FA968',
		warning: '#E5B265',
		warningSurface: '#2A2416',
		warningText: '#E8D6B4',
		/**
		 * 05 has no dark counterpart. Derived by mirroring each value's oklch
		 * lightness around the surface token, the same method as the illustrations.
		 */
		selectedSurface: '#232428',
		selectedBorder: '#343642',
		tileFill: '#26282A',
	},
} as const

/** Avatar colors — 8 options from 17-edycja-profilu / 33 / 34. Shared by both themes. */
export const avatarColors = [
	'#505AC8',
	'#2E7D46',
	'#C8562A',
	'#00868B',
	'#B4548F',
	'#2A78BE',
	'#8E9A1B',
	'#7A4A28',
] as const

export const fontFamily = {
	regular: 'PublicSans_400Regular',
	medium: 'PublicSans_500Medium',
	semibold: 'PublicSans_600SemiBold',
	bold: 'PublicSans_700Bold',
} as const

/**
 * Type scale. Headings 25–30/700, body 15–16/400–500,
 * labels 11/600 uppercase with .08em tracking (0.08 × 11 ≈ 0.88 px).
 */
export const typography = {
	titleLarge: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 36 },
	title: { fontFamily: fontFamily.bold, fontSize: 25, lineHeight: 31 },
	body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23 },
	bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 23 },
	bodySmall: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21 },
	/**
	 * Secondary line under a title, e.g. the option subtitles in 05.
	 * Measured: x-height 6.5 pt and a 230 pt line for a string that needs over
	 * 278 pt at bodySmall — both put it at 12 px.
	 */
	caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 17 },
	label: {
		fontFamily: fontFamily.semibold,
		fontSize: 11,
		lineHeight: 14,
		letterSpacing: 0.88,
		textTransform: 'uppercase',
	},
} as const

/** Named entries of the type scale, e.g. 'title' or 'bodySmall'. */
export type TypographyVariant = keyof typeof typography

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 40,
} as const

/**
 * Motion vocabulary.
 *
 * Unlike colour and type, these are not measured from the mockups — the
 * mockups are static and specify no timings. They are chosen conservatively:
 * long enough to read as a connection between cause and effect, short enough
 * not to make a list feel slow on the tenth use.
 *
 * Components must take timings from here rather than picking their own.
 */
export const motion = {
	duration: { instant: 0, fast: 120, base: 200, slow: 320 },
	/** Spring for direct manipulation — the checkbox, the press response. */
	spring: { damping: 18, stiffness: 220, mass: 0.6 },
	/** How far a pressable shrinks while held. */
	pressScale: 0.97,
} as const

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const

/**
 * Tab bar geometry, measured from 13-ekran-ty at 2x.
 *
 * `height` sits above the device's bottom safe-area inset, which the bar adds
 * on top of it.
 */
export const tabBar = {
	/** Content height, excluding the safe-area inset. */
	height: 49,
	/** Diameter of the raised centre button — 104 px in the mockup. */
	buttonSize: 52,
	/** How far the button rises above the bar's top edge. */
	buttonLift: 10,
} as const

/**
 * Drop shadows, written as CSS `boxShadow` strings.
 *
 * Fitted to the raised tab-bar button in 03-feed-przestrzeni (light) and
 * 38-feed-ciemny (dark). The luminance falloff around the button was sampled
 * at 2x in four directions and matched against a blurred disc, which gives an
 * 8 pt downward offset and a Gaussian sigma of 9 pt — a CSS blur radius of
 * 2 * sigma = 18 px, with no spread. The geometry is identical in both themes;
 * only the opacity differs. The residual is under one 8-bit step in each.
 */
export const shadow = {
	light: { raisedButton: '0px 8px 18px rgba(0, 0, 0, 0.16)' },
	dark: { raisedButton: '0px 8px 18px rgba(0, 0, 0, 0.43)' },
} as const

export type ColorScheme = keyof typeof palette
export type Colors = (typeof palette)[ColorScheme]
