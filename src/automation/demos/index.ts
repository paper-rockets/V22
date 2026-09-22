import { CANONICAL_DEMOS } from './canonicalDemos';
import { HERO_DEMO } from './heroDemo';
import { DemoScene } from '../types';

export const ALL_DEMOS: DemoScene[] = [HERO_DEMO, ...CANONICAL_DEMOS];

export { CANONICAL_DEMOS, HERO_DEMO };
