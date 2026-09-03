import { render, screen } from "@testing-library/react";
import { EmptyState } from "./ui";
describe("EmptyState", () => { it("renders its title", () => { render(<EmptyState title="No stock"/>); expect(screen.getByText("No stock")).toBeInTheDocument(); }); });

