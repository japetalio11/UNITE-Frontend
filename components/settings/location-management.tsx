"use client";

import { Tabs, Tab } from "@heroui/tabs";
import GeographicUnitsSection from "./geographic-units-section";
import CoverageAreasSection from "./coverage-areas-section";
import AssignmentsSection from "./assignments-section";

interface LocationManagementProps {
  isOpen: boolean;
}

export default function LocationManagement({ isOpen }: LocationManagementProps) {
  return (
    <div className="space-y-6">
      <Tabs aria-label="Location management tabs" defaultSelectedKey="geographic-units">
        <Tab key="geographic-units" title="Geographic Units">
          <div className="pt-4">
            <GeographicUnitsSection isOpen={isOpen} />
          </div>
        </Tab>
        <Tab key="coverage-areas" title="Coverage Areas">
          <div className="pt-4">
            <CoverageAreasSection isOpen={isOpen} />
          </div>
        </Tab>
        <Tab key="assignments" title="Assignments & Usage">
          <div className="pt-4">
            <AssignmentsSection isOpen={isOpen} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

