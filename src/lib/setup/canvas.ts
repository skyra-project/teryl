import { PathAssets } from '#lib/common/constants';
import { loadFont } from 'canvas-constructor/napi-rs';
import { join } from 'node:path';
import { fileURLToPath } from 'url';

const folder = fileURLToPath(new URL('./fonts/', PathAssets));

loadFont(join(folder, 'Roboto-Medium.ttf'), 'Roboto-Medium');
loadFont(join(folder, 'NotoSans-Medium.ttf'), 'NotoSans-Medium');
loadFont(join(folder, 'NotoEmoji-Medium.ttf'), 'NotoEmoji-Medium');

loadFont(join(folder, 'Roboto-Light.ttf'), 'Roboto-Light');
loadFont(join(folder, 'NotoSans-Light.ttf'), 'NotoSans-Light');
loadFont(join(folder, 'NotoEmoji-Light.ttf'), 'NotoEmoji-Light');
