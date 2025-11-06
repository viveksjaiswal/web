"use client";
import Button from "@/core/ui/button/Button";
import React from "react";

import { Camera, Trash, Check } from "lucide-react";

export default function Home() {
  return (
    <>
      <Button variant="outline">Hello, World!</Button>
      <Button variant="outline" size="xs" startIcon={<Camera />}>
        Extra Small Button
      </Button>
      <Button size="sm" variant="default" startIcon={<Camera />}>
        Small Button
      </Button>

      <Button size="md" variant="primary" startIcon={<Camera />}>
        Medium Button
      </Button>

      <Button size="lg" variant="secondary" endIcon={<Check />}>
        Large Button
      </Button>

      <Button variant="outline" startIcon={<Trash />}>
        Delete
      </Button>
    </>
  );
}
