import {withBase} from './config.mjs';
export const href = (path = ''): string => withBase(path, import.meta.env.BASE_URL);
