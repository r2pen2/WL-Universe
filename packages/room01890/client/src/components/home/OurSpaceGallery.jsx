import { useCallback, useEffect, useRef, useState } from "react";
import { Header, Image, Text } from "../Wl.jsx";
import { useEditPermissions } from "../../api/permissions.jsx";
import { IMAGE_BY_ID } from "../../content.js";
import { ReactComponent as ChevronIcon } from "../../assets/icons/gallery-next.svg";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";

/** Gallery order. `wide` tiles span both columns; `title` is the WL text shown on hover. */
const TILES = [
  { id: "gallery-1" },
  { id: "gallery-2" },
  { id: "gallery-3", wide: true, title: "gallery-3-title" },
  { id: "gallery-4" },
  { id: "gallery-5" },
];

function Lightbox({ index, sources, onClose, onStep }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onStep(-1);
      if (e.key === "ArrowRight") onStep(1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose, onStep]);

  const tile = TILES[index];
  return (
    <div className="r01-lightbox" role="dialog" aria-modal="true" aria-label="Our Space gallery">
      <button ref={closeRef} type="button" className="r01-lightbox__close" aria-label="Close" onClick={onClose}>
        <CloseIcon aria-hidden="true" />
      </button>
      <button type="button" className="r01-lightbox__nav r01-lightbox__nav--prev" aria-label="Previous" onClick={() => onStep(-1)}>
        <ChevronIcon aria-hidden="true" />
      </button>
      <figure className="r01-lightbox__figure">
        {sources[tile.id] && <img src={sources[tile.id]} alt={IMAGE_BY_ID[tile.id].alt} className="r01-lightbox__img" />}
      </figure>
      <button type="button" className="r01-lightbox__nav r01-lightbox__nav--next" aria-label="Next" onClick={() => onStep(1)}>
        <ChevronIcon aria-hidden="true" />
      </button>
    </div>
  );
}

/** "Our Space": heading, subtitle and a 2-1-2 photo grid that opens a lightbox. */
export function OurSpaceGallery() {
  const { images: canEditImages } = useEditPermissions();
  const [sources, setSources] = useState({});
  const [open, setOpen] = useState(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d) => setOpen((i) => (i + d + TILES.length) % TILES.length), []);

  return (
    <section id="our-space" className="r01-space">
      <Header id="our-space-header" level={2} className="r01-h2 r01-space__title" />
      <Text id="our-space-text" className="r01-space__text" />
      <div className="r01-gallery" role="list">
        {TILES.map((tile, index) => (
          <div key={tile.id} role="listitem" className={`r01-gallery__item${tile.wide ? " r01-gallery__item--wide" : ""}`}>
            <Image
              id={tile.id}
              className="r01-cover"
              onSource={(src) => setSources((s) => (s[tile.id] === src ? s : { ...s, [tile.id]: src }))}
            />
            {/* Admins click the photo itself to replace it, so the lightbox opener is only there for visitors. */}
            {!canEditImages && (
              <button
                type="button"
                className="r01-gallery__open"
                aria-label={`Open ${IMAGE_BY_ID[tile.id].alt || `photo ${index + 1}`} in lightbox`}
                onClick={() => setOpen(index)}
              />
            )}
            {tile.title && (
              <div className="r01-gallery__title">
                <Text id={tile.title} className="r01-gallery__title-text" />
              </div>
            )}
          </div>
        ))}
      </div>
      {open !== null && <Lightbox index={open} sources={sources} onClose={close} onStep={step} />}
    </section>
  );
}
