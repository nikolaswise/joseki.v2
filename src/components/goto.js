import { path } from '../store.js';

const goTo = (uri) => {
  window.history.pushState({}, '', uri);
  path.set(`/${uri}`)
}

export default goTo