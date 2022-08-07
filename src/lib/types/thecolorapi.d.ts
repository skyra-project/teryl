export interface TheColorApiResult {
	hex: Hex;
	rgb: RGB;
	hsl: Hsl;
	hsv: Hsv;
	name: Name;
	cmyk: Cmyk;
	XYZ: Xyz;
	image: Image;
	contrast: Contrast;
}

export interface Xyz {
	fraction: XYZFraction;
	value: string;
	X: number;
	Y: number;
	Z: number;
}

export interface XYZFraction {
	X: number;
	Y: number;
	Z: number;
}

export interface Self {
	href: string;
}

export interface Cmyk {
	fraction: CmykFraction;
	value: string;
	c: number;
	m: number;
	y: number;
	k: number;
}

export interface CmykFraction {
	c: number;
	m: number;
	y: number;
	k: number;
}

export interface Contrast {
	value: string;
}

export interface Hex {
	value: string;
	clean: string;
}

export interface Hsl {
	fraction: HslFraction;
	h: number;
	s: number;
	l: number;
	value: string;
}

export interface HslFraction {
	h: number;
	s: number;
	l: number;
}

export interface Hsv {
	fraction: HsvFraction;
	value: string;
	h: number;
	s: number;
	v: number;
}

export interface HsvFraction {
	h: number;
	s: number;
	v: number;
}

export interface Image {
	bare: string;
	named: string;
}

export interface Name {
	value: string;
	closest_named_hex: string;
	exact_match_name: boolean;
	distance: number;
}

export interface RGB {
	fraction: RGBFraction;
	r: number;
	g: number;
	b: number;
	value: string;
}

export interface RGBFraction {
	r: number;
	g: number;
	b: number;
}
