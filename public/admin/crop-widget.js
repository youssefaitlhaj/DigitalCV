// "imageref" custom field type: the whole image object { src, alt: { en, de }, crop? } in one control.
// It wraps the whole object (not only `crop`) because a custom control in Sveltia 0.252.0 receives its own
// value and the entry, but not its path inside the entry, so it cannot find a sibling `src` by itself.
import { imageSrcProblem, isRequiredField, mergeImageRef, percentToPixels, pixelsToPercentCrop, removeImageRef, validateImageRef } from "./crop-math.js";

const plain = (v) => (v && typeof v.toJS === "function" ? v.toJS() : v) ?? {};

export function registerCropWidget(CMS) {
  const { useState, useEffect, useRef, useImperativeHandle } = CMS.React;
  const h = CMS.React.createElement;

  function ImageRefControl({ value, onChange, pickFile, getAsset, forID, field, ref }) {
    const v = plain(value);
    const latest = useRef(v);
    latest.current = v;
    const imgEl = useRef(null);
    const [cropping, setCropping] = useState(false);
    const [error, setError] = useState("");
    const url = v.src ? (getAsset?.(v.src)?.url ?? v.src) : "";
    const required = isRequiredField(field);

    // Sveltia calls isValid(value, fieldConfig) with the field config as an Immutable Map; required defaults to true.
    useImperativeHandle?.(
      ref,
      () => ({
        isValid: (val, config) => validateImageRef(plain(val), isRequiredField(config)),
      }),
      [],
    );

    const commit = (patch) => onChange(mergeImageRef(latest.current, patch));

    useEffect(() => {
      if (!cropping || !imgEl.current || !url) return undefined;
      if (!window.Cropper) {
        setCropping(false);
        setError("The image cropper did not load. Reload the page; if it keeps happening, tell the site maintainer.");
        return undefined;
      }
      const img = imgEl.current;
      const natural = () => ({ W: img.naturalWidth, H: img.naturalHeight });
      const cropper = new window.Cropper(img, {
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 0.8,
        background: false,
        checkOrientation: false, // the browser already shows the image upright; cropAll rotates the same way
        responsive: true,
        ready() {
          const { W, H } = natural();
          const c = latest.current.crop;
          if (c) cropper.setData(percentToPixels(c, W, H));
        },
        cropend() {
          const { W, H } = natural();
          commit({ crop: pixelsToPercentCrop(cropper.getData(), W, H) ?? undefined });
        },
      });
      return () => cropper.destroy();
    }, [cropping, url]);

    const choose = async () => {
      setError("");
      try {
        const picked = await pickFile({ kind: "image", accept: "image/*", allowURL: false });
        const problem = picked ? imageSrcProblem(picked.value) : null;
        if (problem) {
          setError(problem);
        } else if (picked) {
          setCropping(false);
          // A different picture makes the old crop meaningless.
          commit({ src: picked.value, crop: undefined });
        }
      } catch (e) {
        setError(String(e?.message ?? e));
      }
    };
    const setAlt = (lang, text) => commit({ alt: { en: "", de: "", ...v.alt, [lang]: text } });
    const btn = { type: "button", style: { padding: "10px 14px", minHeight: 44, marginRight: 8, marginTop: 8 } };
    const c = v.crop;

    return h(
      "div",
      { id: forID, style: { display: "grid", gap: 12 } },
      url && h("div", { style: { maxWidth: 420 } }, h("img", { ref: imgEl, src: url, alt: "", style: { display: "block", maxWidth: "100%" } })),
      h(
        "div",
        null,
        h("button", { ...btn, onClick: choose }, v.src ? "Replace image" : "Choose image"),
        v.src && h("button", { ...btn, onClick: () => {
            setError("");
            if (!cropping && !window.Cropper) return setError("The image cropper did not load. Reload the page; if it keeps happening, tell the site maintainer.");
            setCropping(!cropping);
          } }, cropping ? "Done cropping" : c ? "Adjust crop" : "Crop"),
        c && h("button", { ...btn, onClick: () => { setCropping(false); commit({ crop: undefined }); } }, "Reset crop"),
        // Only optional images can be removed; a required one can only be replaced.
        !required && v.src && h("button", { ...btn, onClick: () => { setCropping(false); setError(""); onChange(removeImageRef(latest.current)); } }, "Remove image"),
      ),
      c && h("div", { style: { fontSize: 12, opacity: 0.7 } }, `Crop: x ${c.x}%, y ${c.y}%, ${c.width}% x ${c.height}%`),
      error && h("div", { role: "alert", style: { color: "#b00020" } }, error),
      v.src && ["en", "de"].map((lang) =>
        h(
          "label",
          { key: lang, style: { display: "grid", gap: 4 } },
          lang === "en" ? "Alt text (English)" : "Alt text (Deutsch)",
          h("input", { type: "text", value: v.alt?.[lang] ?? "", onChange: (e) => setAlt(lang, e.target.value), style: { minHeight: 40 } }),
        ),
      ),
    );
  }

  const Preview = ({ value, getAsset }) => {
    const v = plain(value);
    return v.src ? h("img", { src: getAsset?.(v.src)?.url ?? v.src, alt: v.alt?.en ?? "", style: { maxWidth: "100%" } }) : null;
  };

  CMS.registerFieldType("imageref", ImageRefControl, Preview);
}
