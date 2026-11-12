export const REPOSITORY = 'TobeALeg/Profile-page';
export const OWNER_ID = 33229155;
export const SITE_URL = 'https://tobealeg.github.io/Profile-page/';
export const BRANCH = 'main';
export const MAX_BODY = 512 * 1024;
export const EDITOR_ASSETS = ['local-editor.js', 'local-editor.css', 'local-modules.mjs', 'module-copy.mjs'];

export function failure(status, message) {
  return Object.assign(new Error(message), { status });
}
