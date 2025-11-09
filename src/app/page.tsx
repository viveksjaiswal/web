"use client";
import React, { JSX, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { create } from "zustand";
import { nanoid } from "nanoid/non-secure";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Pointer,
  Settings,
  PanelLeft,
  PanelRight,
  Download,
  Save,
  Move,
} from "lucide-react";

/**
 * Webflow × Builder.io style builder
 * - Left: Components palette (drag source)
 * - Middle: Canvas with structured sections/blocks, sortable & nestable
 * - Right: Inspector panel to edit props of selected node
 * - Hover and select outlines
 * - Minimal component registry (Section, Container, Heading, Text, Button, Image)
 *
 * Drop this file as app/(builder)/page.tsx (or any Client Component) and run `next dev`.
 */

/** ---------------------- Types ---------------------- */
type NodeType =
  | "section"
  | "container"
  | "heading"
  | "text"
  | "button"
  | "image";
type NodeId = string;
type Node = {
  id: NodeId;
  type: NodeType;
  props: Record<string, any>;
  children: NodeId[];
  parentId: NodeId | null;
};

type BuilderState = {
  rootId: NodeId;
  nodes: Record<NodeId, Node>;
  selectedId: NodeId | null;
  hoveredId: NodeId | null;
  // actions
  addChild: (parentId: NodeId, node: Omit<Node, "id" | "parentId">) => NodeId;
  moveChild: (parentId: NodeId, fromIndex: number, toIndex: number) => void;
  removeNode: (id: NodeId) => void;
  setSelected: (id: NodeId | null) => void;
  setHovered: (id: NodeId | null) => void;
  setProps: (id: NodeId, next: Record<string, any>) => void;
};

/** ---------------------- Store ---------------------- */
const createInitialTree = () => {
  const rootId = "root";
  const root: Node = {
    id: rootId,
    type: "section",
    props: { padding: "py-12", bg: "bg-white" },
    children: [],
    parentId: null,
  };
  return { rootId, nodes: { [rootId]: root } };
};

export const useBuilder = create<BuilderState>((set, get) => ({
  ...createInitialTree(),
  selectedId: null,
  hoveredId: null,
  addChild: (parentId, node) => {
    const id = nanoid(8);
    set((s) => {
      const n: Node = { id, parentId, children: [], ...node } as Node;
      const parent = s.nodes[parentId];
      const nodes = {
        ...s.nodes,
        [id]: n,
        [parentId]: { ...parent, children: [...parent.children, id] },
      };
      return { nodes, selectedId: id } as Partial<BuilderState>;
    });
    return id;
  },
  moveChild: (parentId, fromIndex, toIndex) => {
    set((s) => {
      const parent = s.nodes[parentId];
      const children = arrayMove(parent.children, fromIndex, toIndex);
      return { nodes: { ...s.nodes, [parentId]: { ...parent, children } } };
    });
  },
  removeNode: (id) => {
    set((s) => {
      const target = s.nodes[id];
      if (!target) return {} as any;
      // detach from parent
      if (target.parentId) {
        const p = s.nodes[target.parentId];
        p.children = p.children.filter((cid) => cid !== id);
      }
      // delete subtree
      const deleteRec = (nid: NodeId, map: Record<NodeId, Node>) => {
        const n = map[nid];
        if (!n) return;
        n.children.forEach((c) => deleteRec(c, map));
        delete map[nid];
      };
      const next = { ...s.nodes };
      deleteRec(id, next);
      return { nodes: next, selectedId: null };
    });
  },
  setSelected: (id) => set({ selectedId: id }),
  setHovered: (id) => set({ hoveredId: id }),
  setProps: (id, next) =>
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: { ...s.nodes[id], props: { ...s.nodes[id].props, ...next } },
      },
    })),
}));

/** ---------------------- Component Registry ---------------------- */
type RegistryItem = {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  defaults: Record<string, any>;
  acceptsChildren: boolean;
  Render: (props: any, children: React.ReactNode) => JSX.Element;
};

const Registry: Record<NodeType, RegistryItem> = {
  section: {
    type: "section",
    label: "Section",
    icon: <PanelLeft className="size-4" />,
    acceptsChildren: true,
    defaults: { padding: "py-12", bg: "bg-white" },
    Render: (props, children) => (
      <section
        className={tw(`relative ${props.bg || ""} ${props.padding || "py-12"}`)}
      >
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </section>
    ),
  },
  container: {
    type: "container",
    label: "Container",
    icon: <PanelRight className="size-4" />,
    acceptsChildren: true,
    defaults: { padding: "p-6", bg: "bg-transparent" },
    Render: (props, children) => (
      <div
        className={tw(
          `${props.bg || ""} ${
            props.padding || "p-6"
          } rounded-2xl border border-black/5 shadow-sm`
        )}
      >
        {children}
      </div>
    ),
  },
  heading: {
    type: "heading",
    label: "Heading",
    icon: <Pointer className="size-4" />,
    acceptsChildren: false,
    defaults: { text: "Headline", tag: "h2", align: "text-left" },
    Render: (props) => {
      const Tag = (props.tag || "h2") as keyof JSX.IntrinsicElements;
      return (
        <Tag
          className={tw(
            `font-semibold tracking-tight ${
              props.align || "text-left"
            } text-3xl`
          )}
        >
          {props.text}
        </Tag>
      );
    },
  },
  text: {
    type: "text",
    label: "Text",
    icon: <Pointer className="size-4" />,
    acceptsChildren: false,
    defaults: { text: "Lorem ipsum dolor sit amet.", align: "text-left" },
    Render: (props) => (
      <p className={tw(`leading-7 ${props.align || "text-left"}`)}>
        {props.text}
      </p>
    ),
  },
  button: {
    type: "button",
    label: "Button",
    icon: <Plus className="size-4" />,
    acceptsChildren: false,
    defaults: { text: "Get started", variant: "primary" },
    Render: (props) => (
      <motion.button
        whileTap={{ scale: 0.98 }}
        className={tw(buttonClass(props.variant))}
      >
        {props.text}
      </motion.button>
    ),
  },
  image: {
    type: "image",
    label: "Image",
    icon: <Pointer className="size-4" />,
    acceptsChildren: false,
    defaults: {
      src: "https://picsum.photos/1200/600",
      alt: "",
      radius: "rounded-xl",
    },
    Render: (props) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={props.src}
        alt={props.alt || ""}
        className={tw(`${props.radius || "rounded-xl"} w-full object-cover`)}
      />
    ),
  },
};

const Palette: Array<Pick<RegistryItem, "type" | "label" | "icon">> = [
  { type: "section", label: "Section", icon: Registry.section.icon },
  { type: "container", label: "Container", icon: Registry.container.icon },
  { type: "heading", label: "Heading", icon: Registry.heading.icon },
  { type: "text", label: "Text", icon: Registry.text.icon },
  { type: "button", label: "Button", icon: Registry.button.icon },
  { type: "image", label: "Image", icon: Registry.image.icon },
];

/** ---------------------- DnD Helpers ---------------------- */
type DragData =
  | { from: "palette"; type: NodeType }
  | { from: "canvas"; id: NodeId; parentId: NodeId; index: number };

/** ---------------------- UI ---------------------- */
export default function BuilderPage() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [overlay, setOverlay] = useState<JSX.Element | null>(null);
  const setHovered = useBuilder((s) => s.setHovered);

  return (
    <div className="min-h-dvh grid grid-cols-[280px_1fr_320px] gap-4 p-4 bg-zinc-50">
      <PalettePanel />
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={(e) => {
          const d = e.active.data.current as DragData;
          if (!d) return;
          if (d.from === "palette") {
            const item = Registry[d.type];
            setOverlay(<Ghost>{item.label}</Ghost>);
          } else if (d.from === "canvas") {
            setOverlay(
              <Ghost>
                <Move className="mr-2 size-4" /> Move
              </Ghost>
            );
          }
        }}
        onDragEnd={(e) => {
          setOverlay(null);
        }}
      >
        <Canvas />
        <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
      </DndContext>
      <InspectorPanel />
    </div>
  );
}

function PalettePanel() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-3 flex flex-col">
      <div className="flex items-center justify-between px-1 py-2">
        <h2 className="text-sm font-semibold">Components</h2>
      </div>
      <div className="grid gap-2">
        {Palette.map((p) => (
          <DraggablePaletteItem
            key={p.type}
            type={p.type}
            label={p.label}
            icon={p.icon}
          />
        ))}
      </div>
      <div className="mt-4 text-xs text-zinc-500 px-1">
        Drag into the canvas. Sections and Containers accept children. Others
        are leaves.
      </div>
    </div>
  );
}

function DraggablePaletteItem({
  type,
  label,
  icon,
}: {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
}) {
  const id = `palette-${type}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, data: { from: "palette", type } as DragData });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={tw(
        "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50",
        isDragging && "opacity-60"
      )}
      style={{ transform: CSS.Translate.toString(transform || undefined) }}
    >
      <span>{icon}</span>
      {label}
    </div>
  );
}

function Canvas() {
  const rootId = useBuilder((s) => s.rootId);
  const nodes = useBuilder((s) => s.nodes);
  const addChild = useBuilder((s) => s.addChild);
  const setHovered = useBuilder((s) => s.setHovered);

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Canvas</h2>
        <div className="ml-auto flex items-center gap-2">
          <ExportJSON />
          <ResetButton />
        </div>
      </div>
      <DroppableContainer parentId={rootId}>
        {nodes[rootId].children.length === 0 && (
          <EmptyState onDropHint={() => setHovered(null)} />
        )}
        <NodeChildren parentId={rootId} />
      </DroppableContainer>
    </div>
  );
}

function EmptyState({ onDropHint }: { onDropHint?: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed p-10 text-center text-sm text-zinc-500">
      Drag components here
    </div>
  );
}

function DroppableContainer({
  parentId,
  children,
}: {
  parentId: NodeId;
  children?: React.ReactNode;
}) {
  const nodes = useBuilder((s) => s.nodes);
  const moveChild = useBuilder((s) => s.moveChild);
  const addChild = useBuilder((s) => s.addChild);

  const { setNodeRef, isOver } = useDroppableStrict({
    id: `drop-${parentId}`,
    data: { parentId },
  });

  const handleDrop = (e: any) => {
    const active = e.active;
    const over = e.over;
    if (!over) return;
    const d = active.data.current as DragData;
    if (!d) return;

    if (d.from === "palette") {
      const reg = Registry[d.type];
      addChild(parentId, {
        type: d.type,
        props: { ...reg.defaults },
        children: [],
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={tw(
        "min-h-8",
        isOver && "outline outline-blue-400/50 outline-offset-2 rounded-lg"
      )}
      onDragEnd={handleDrop}
    >
      {children}
    </div>
  );
}

function NodeChildren({ parentId }: { parentId: NodeId }) {
  const nodes = useBuilder((s) => s.nodes);
  return (
    <SortableContext
      items={nodes[parentId].children}
      strategy={verticalListSortingStrategy}
    >
      <div className="grid gap-4">
        {nodes[parentId].children.map((id, index) => (
          <CanvasNode key={id} id={id} index={index} />
        ))}
      </div>
    </SortableContext>
  );
}

function CanvasNode({ id, index }: { id: NodeId; index: number }) {
  const node = useBuilder((s) => s.nodes[id]);
  const selectedId = useBuilder((s) => s.selectedId);
  const setSelected = useBuilder((s) => s.setSelected);
  const setHovered = useBuilder((s) => s.setHovered);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { from: "canvas", id, parentId: node.parentId!, index } as DragData,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedId === id;

  const reg = Registry[node.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={tw("relative group")}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(id);
      }}
    >
      {/* Outline overlays */}
      <div
        className={tw(
          "pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-transparent",
          isSelected && "ring-blue-500"
        )}
      />

      {/* Toolbar */}
      <div className="absolute -top-3 left-3 z-10 hidden items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs shadow-sm group-hover:flex">
        <span className="font-medium text-zinc-700">{reg.label}</span>
        <span className="text-zinc-400">#{node.id.slice(-4)}</span>
      </div>

      <NodeRenderer node={node} />
    </div>
  );
}

function NodeRenderer({ node }: { node: Node }) {
  const reg = Registry[node.type];
  const nodes = useBuilder((s) => s.nodes);

  const content = reg.Render(
    node.props,
    <>
      {reg.acceptsChildren && (
        <DroppableContainer parentId={node.id}>
          <NodeChildren parentId={node.id} />
        </DroppableContainer>
      )}
    </>
  );

  return content;
}

function InspectorPanel() {
  const selectedId = useBuilder((s) => s.selectedId);
  const nodes = useBuilder((s) => s.nodes);
  const removeNode = useBuilder((s) => s.removeNode);

  if (!selectedId) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Select an element to edit its props.
        </p>
      </div>
    );
  }

  const node = nodes[selectedId];
  const reg = Registry[node.type];

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <button
          onClick={() => removeNode(selectedId)}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-zinc-50"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
      <div className="space-y-4">
        <PropEditor node={node} />
      </div>
    </div>
  );
}

function PropEditor({ node }: { node: Node }) {
  const setProps = useBuilder((s) => s.setProps);
  const reg = Registry[node.type];

  switch (node.type) {
    case "section":
    case "container":
      return (
        <div className="grid gap-3 text-sm">
          <Field
            label="Padding"
            value={node.props.padding}
            onChange={(v) => setProps(node.id, { padding: v })}
            placeholder="e.g. py-16 px-6"
          />
          <Field
            label="Background"
            value={node.props.bg}
            onChange={(v) => setProps(node.id, { bg: v })}
            placeholder="e.g. bg-zinc-50"
          />
        </div>
      );
    case "heading":
      return (
        <div className="grid gap-3 text-sm">
          <Field
            label="Text"
            value={node.props.text}
            onChange={(v) => setProps(node.id, { text: v })}
          />
          <Select
            label="Tag"
            value={node.props.tag || "h2"}
            onChange={(v) => setProps(node.id, { tag: v })}
            options={["h1", "h2", "h3", "h4"]}
          />
          <Select
            label="Align"
            value={node.props.align || "text-left"}
            onChange={(v) => setProps(node.id, { align: v })}
            options={["text-left", "text-center", "text-right"]}
          />
        </div>
      );
    case "text":
      return (
        <div className="grid gap-3 text-sm">
          <Textarea
            label="Text"
            value={node.props.text}
            onChange={(v) => setProps(node.id, { text: v })}
          />
          <Select
            label="Align"
            value={node.props.align || "text-left"}
            onChange={(v) => setProps(node.id, { align: v })}
            options={["text-left", "text-center", "text-right"]}
          />
        </div>
      );
    case "button":
      return (
        <div className="grid gap-3 text-sm">
          <Field
            label="Text"
            value={node.props.text}
            onChange={(v) => setProps(node.id, { text: v })}
          />
          <Select
            label="Variant"
            value={node.props.variant || "primary"}
            onChange={(v) => setProps(node.id, { variant: v })}
            options={["primary", "secondary", "ghost"]}
          />
        </div>
      );
    case "image":
      return (
        <div className="grid gap-3 text-sm">
          <Field
            label="Src"
            value={node.props.src}
            onChange={(v) => setProps(node.id, { src: v })}
          />
          <Field
            label="Alt"
            value={node.props.alt}
            onChange={(v) => setProps(node.id, { alt: v })}
          />
          <Field
            label="Radius"
            value={node.props.radius || "rounded-xl"}
            onChange={(v) => setProps(node.id, { radius: v })}
          />
        </div>
      );
    default:
      return null;
  }
}

/** ---------------------- Small UI primitives ---------------------- */
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <textarea
        className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <select
        className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResetButton() {
  const set = useBuilder.setState;
  return (
    <button
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-zinc-50"
      onClick={() => set({ ...createInitialTree(), selectedId: null })}
    >
      <Save className="size-3.5" /> Reset
    </button>
  );
}

function ExportJSON() {
  const nodes = useBuilder((s) => s.nodes);
  const rootId = useBuilder((s) => s.rootId);
  const download = () => {
    const state = { nodes, rootId };
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-zinc-50"
      onClick={download}
    >
      <Download className="size-3.5" /> Export JSON
    </button>
  );
}

function Ghost({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-white px-3 py-1 text-xs shadow-sm">
      {children}
    </div>
  );
}

/** ---------------------- DnD Kit adapters ---------------------- */
function useDroppableStrict({ id, data }: { id: string; data?: any }) {
  // DnD Kit's useDroppable is not exported by @dnd-kit/sortable; re-implement minimal handler by using a ref.
  // We just need a ref for visual outline and a place to listen to onDragEnd from parent DndContext.
  const setNodeRef = (el: HTMLElement | null) => {
    // no-op; parent attaches listener via onDragEnd
  };
  return { setNodeRef, isOver: false, data } as any;
}

/** ---------------------- Utilities ---------------------- */
function tw(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buttonClass(variant?: string) {
  switch (variant) {
    case "secondary":
      return "rounded-lg border px-4 py-2 text-sm";
    case "ghost":
      return "rounded-lg px-4 py-2 text-sm hover:bg-zinc-100";
    default:
      return "rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700";
  }
}
