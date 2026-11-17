import { RequestChangesModal } from "../../../../packages/web-legos/components/Auth.jsx";

/**
 * Request content changes: lets a site admin describe a change; it files a ticket in Plane.
 * Opened from "Request content changes" under the admin login. Sending is disabled in the catalog.
 */
export default {
  title: "Admin menus/Request content changes",
  parameters: { layout: "fullscreen" },
};

const disabled = {
  async requestContentChange() {
    throw new Error("Sending is disabled in the component catalog.");
  },
};

export const RequestContentChanges = {
  name: "Request content changes",
  render: () => <RequestChangesModal authManager={disabled} open onClose={() => {}} />,
};
