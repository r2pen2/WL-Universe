/**
 * Thin wrappers over web-legos' layout text/image components that fill in this site's defaults:
 * the copy from content.js as the static fallback, edit permissions, and the alt text.
 */
import { WLLayoutHeader, WLLayoutText } from "../libraries/Web-Legos/components/Text.jsx";
import { WLImageV2 } from "../libraries/Web-Legos/components/Images.jsx";
import { IMAGE_BY_ID, TEXT } from "../content.js";
import { useEditPermissions } from "../api/permissions.jsx";

/** Converts stored CMS HTML ("a<br/>b") back to the markdown-ish fallback WLLayoutText expects. */
function fallback(id) {
  const text = TEXT[id];
  if (text === undefined) throw new Error(`No copy for text id "${id}" in content.js`);
  return text.replaceAll("<br/>", "\n");
}

/** WL header with this site's copy. `level` 1–6. */
export function Header({ id, level = 2, className = "", tight = false }) {
  const { text } = useEditPermissions();
  return (
    <WLLayoutHeader
      firestoreId={id}
      headerLevel={level}
      editable={text}
      className={className}
      wrapperClassName={`r01-wl${tight ? " r01-wl--tight" : ""}`}
    >
      {fallback(id)}
    </WLLayoutHeader>
  );
}

/**
 * WL text (paragraphs) with this site's copy. `className` styles the wrapper: WLLayoutText gives
 * each <p> an inline `margin: 0; font-size: inherit`, so type size and spacing are set one level up.
 */
export function Text({ id, className = "", tight = false }) {
  const { text } = useEditPermissions();
  return (
    <WLLayoutText
      firestoreId={id}
      editable={text}
      wrapperClassName={`r01-wl${tight ? " r01-wl--tight" : ""} ${className}`}
    >
      {fallback(id)}
    </WLLayoutText>
  );
}

/** WL image (CMS-managed, uploadable by admins). */
export function Image({ id, className = "", onSource, loading = "lazy" }) {
  const { images } = useEditPermissions();
  const meta = IMAGE_BY_ID[id];
  if (!meta) throw new Error(`No image id "${id}" in content.js`);
  return (
    <WLImageV2
      firestoreId={id}
      editable={images}
      alt={meta.alt}
      className={`r01-img ${className}`}
      onSource={onSource}
      loading={loading}
    />
  );
}
