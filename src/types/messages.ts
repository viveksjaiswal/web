export type BuilderToPreviewMessage =
  | { type: "PING" }
  | { type: "UPDATE_LAYOUT"; payload: unknown };

export type PreviewToBuilderMessage =
  | { type: "PONG" }
  | { type: "ELEMENT_SELECTED"; payload: { id: string } };
