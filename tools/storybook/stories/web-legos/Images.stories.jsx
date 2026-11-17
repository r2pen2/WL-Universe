import { WLImageV2 } from "../../../../packages/web-legos/components/Images.jsx";

export default {
  title: "Web-Legos/Images",
  parameters: { layout: "padded", site: "web-legos" },
};

/** WLImageV2: a CMS image by image id (room01890's, live from prod). */
export const Image = {
  render: () => (
    <div style={{ width: 480 }}>
      <WLImageV2 firestoreId="meeting-space-image-1" alt="Meeting room" />
    </div>
  ),
};

/** Several, as a grid. */
export const Grid = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 960 }}>
      {["gallery-1", "gallery-2", "gallery-3", "gallery-4", "gallery-5", "event-board-games-image"].map((id) => (
        <WLImageV2 key={id} firestoreId={id} alt={id} />
      ))}
    </div>
  ),
};

/** Signed in with image-edit permission: click to replace the image. */
export const Editable = {
  render: () => (
    <div style={{ width: 480 }}>
      <WLImageV2 firestoreId="meeting-space-image-2" alt="Mahjong table" editable />
    </div>
  ),
};
