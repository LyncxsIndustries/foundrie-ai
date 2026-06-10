import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectSkillsList } from "./ProjectSkillsList";

describe("ProjectSkillsList", () => {
  it("shows empty state when no skills", () => {
    render(<ProjectSkillsList skills={[]} />);
    expect(screen.getByText(/no skills generated yet/i)).toBeInTheDocument();
  });

  it("shows universal skills", () => {
    render(
      <ProjectSkillsList
        skills={[
          { slug: "code-review", name: "Code Review" },
          { slug: "autofix", name: "Autofix" },
        ]}
      />
    );
    expect(screen.getByText("Universal")).toBeInTheDocument();
    expect(screen.getByText(/Code Review/)).toBeInTheDocument();
    expect(screen.getByText(/Autofix/)).toBeInTheDocument();
  });

  it("groups skills by type", () => {
    render(
      <ProjectSkillsList
        skills={[
          { slug: "code-review", name: "Code Review" },
          { slug: "next-best-practices", name: "Next Best Practices" },
          { slug: "project-research", name: "Project Research" },
        ]}
      />
    );
    expect(screen.getByText("Universal")).toBeInTheDocument();
    expect(screen.getByText("Stack-Dependent")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("shows skill count", () => {
    render(
      <ProjectSkillsList
        skills={[
          { slug: "code-review", name: "Code Review" },
          { slug: "autofix", name: "Autofix" },
        ]}
      />
    );
    expect(screen.getByText(/2 skills ready for export/i)).toBeInTheDocument();
  });
});
