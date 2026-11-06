import { ContentError, loadContent } from "../src/content/repository";
import { collectImageRefs, cropAll, ImageError } from "../src/lib/images";

try {
  const refs = collectImageRefs(loadContent());
  await cropAll(refs, process.cwd());
  console.log(`images: ${refs.length} reference(s) checked`);
} catch (e) {
  if (e instanceof ImageError || e instanceof ContentError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
