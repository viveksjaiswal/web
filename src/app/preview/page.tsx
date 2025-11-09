"use client";

import { useEffect, useState } from "react";

export default function PreviewPage() {
  const [layout, setLayout] = useState<any[]>([]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data.type === "UPDATE_LAYOUT") {
        setLayout(event.data.payload);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div className="p-6 space-y-4">
      {layout.map((block) => {
        if (block.type === "heading")
          return (
            <h1 key={block.id} className="text-2xl font-bold">
              {block.content}
            </h1>
          );

        if (block.type === "paragraph")
          return (
            <p key={block.id} className="text-gray-600">
              {block.content}
            </p>
          );

        if (block.type === "button")
          return (
            <button
              key={block.id}
              className="px-4 py-2 bg-black text-white rounded"
            >
              {block.content}
            </button>
          );
      })}
    </div>
  );
}
