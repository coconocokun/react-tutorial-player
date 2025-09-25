export type ShapeType = "box" | "oval" | "polygon";

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InteractionBase {
  id: string;
  text: string;
  order: number;
  hasNextButton: boolean;
}

export interface BoxInteractionArea extends InteractionBase {
  type: "box";
  box: BoundingBox;
}

export interface OvalInteractionArea extends InteractionBase {
  type: "oval";
  box: BoundingBox;
}

export interface PolygonInteractionArea extends InteractionBase {
  type: "polygon";
  points: [Point, Point, Point, Point];
}

export type InteractionArea = BoxInteractionArea | OvalInteractionArea | PolygonInteractionArea;

export interface StopPoint {
  id: string;
  time: number;
  areas: InteractionArea[];
}
