/*
 * Qwik dev entry — renders the root on client side.
 * Called from the dev server HTML template.
 */
import { render, type RenderOptions } from '@builder.io/qwik';
import Root from './root';

export default function (opts: RenderOptions) {
  return render(document, <Root />, opts);
}
