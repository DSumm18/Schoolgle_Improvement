import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ROOM_OUTLINES } from "../grove-house-3d-data";
import { RoomLabellingTable } from "../RoomLabellingTable";

describe("RoomLabellingTable", () => {
  let roomLabels: Record<string, string>;
  let onLabelChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    roomLabels = {};
    onLabelChange = vi.fn();
  });

  test("all rooms appear in the labelling table", () => {
    render(
      <RoomLabellingTable
        roomLabels={roomLabels}
        onLabelChange={onLabelChange}
      />
    );

    // Every room's systemId should appear in the table
    ROOM_OUTLINES.forEach((room) => {
      expect(screen.getByText(room.systemId)).toBeTruthy();
    });
  });

  test("empty schoolLabel shows the default label as placeholder", () => {
    render(
      <RoomLabellingTable
        roomLabels={roomLabels}
        onLabelChange={onLabelChange}
      />
    );

    // Each room input should have an empty value and the default label as placeholder
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBe(ROOM_OUTLINES.length);

    // First room's input should be empty with placeholder
    const firstInput = inputs[0] as HTMLInputElement;
    expect(firstInput.value).toBe("");
    expect(firstInput.placeholder).toBe(ROOM_OUTLINES[0].label);
  });

  test("updating schoolLabel in the table calls onLabelChange", () => {
    render(
      <RoomLabellingTable
        roomLabels={roomLabels}
        onLabelChange={onLabelChange}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const firstInput = inputs[0] as HTMLInputElement;

    // Type a new name
    fireEvent.change(firstInput, { target: { value: "Reception" } });
    // Blur to trigger save
    fireEvent.blur(firstInput);

    expect(onLabelChange).toHaveBeenCalledWith(
      ROOM_OUTLINES[0].systemId,
      "Reception"
    );
  });

  test("existing roomLabels are shown in inputs", () => {
    roomLabels = { "B1-01": "Year 2 Classroom" };

    render(
      <RoomLabellingTable
        roomLabels={roomLabels}
        onLabelChange={onLabelChange}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const firstInput = inputs[0] as HTMLInputElement;
    expect(firstInput.value).toBe("Year 2 Classroom");
  });

  test("pressing Enter triggers onLabelChange", () => {
    render(
      <RoomLabellingTable
        roomLabels={roomLabels}
        onLabelChange={onLabelChange}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    const firstInput = inputs[0];

    fireEvent.change(firstInput, { target: { value: "Staff Room" } });
    fireEvent.keyDown(firstInput, { key: "Enter" });

    expect(onLabelChange).toHaveBeenCalledWith(
      ROOM_OUTLINES[0].systemId,
      "Staff Room"
    );
  });
});
