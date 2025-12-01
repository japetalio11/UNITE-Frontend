"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

interface QuickFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: { province?: string; districtId?: string }) => void;
}

export default function QuickFilterModal({
  isOpen,
  onClose,
  onApply,
}: QuickFilterModalProps) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchProvinces = async () => {
      setProvincesLoading(true);
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const url = base
          ? `${base}/api/locations/provinces`
          : `/api/locations/provinces`;
        let token = null;

        try {
          token =
            localStorage.getItem("unite_token") ||
            sessionStorage.getItem("unite_token");
        } catch (e) {
          token = null;
        }

        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        const bodyText = await res.text();
        let body: any = null;

        try {
          body = bodyText ? JSON.parse(bodyText) : null;
        } catch {
          throw new Error("Invalid JSON from provinces endpoint");
        }

        if (!res.ok)
          throw new Error(
            body?.message || `Failed to fetch provinces (status ${res.status})`
          );

        const items = body.data || body.provinces || [];
        const normalized = items.map((p: any) => ({
          id: p._id || p.id || p._doc?._id || p.id,
          name: p.name || p.Name || p.Province_Name,
        }));

        setProvinces(normalized.filter(Boolean));
      } catch (err: any) {
        console.error("Failed to load provinces:", err);
        setProvinces([]);
      } finally {
        setProvincesLoading(false);
      }
    };

    fetchProvinces();
  }, [isOpen]);

  // Fetch districts when province is selected
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrictId("");
      return;
    }

    const fetchDistricts = async () => {
      setDistrictsLoading(true);
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const url = base
          ? `${base}/api/locations/provinces/${encodeURIComponent(
              selectedProvince
            )}/districts?limit=1000`
          : `/api/locations/provinces/${encodeURIComponent(
              selectedProvince
            )}/districts?limit=1000`;

        let token = null;

        try {
          token =
            localStorage.getItem("unite_token") ||
            sessionStorage.getItem("unite_token");
        } catch (e) {
          token = null;
        }

        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        const bodyText = await res.text();
        let body: any = null;

        try {
          body = bodyText ? JSON.parse(bodyText) : null;
        } catch {
          throw new Error("Invalid JSON from districts endpoint");
        }

        if (!res.ok)
          throw new Error(
            body?.message || `Failed to fetch districts (status ${res.status})`
          );

        const items = body.data || body.districts || [];
        const normalized = items.map((d: any) => ({
          id: d._id || d.id || d.District_ID,
          name: d.name || d.Name || d.District_Name || d.District_Number,
        }));

        setDistricts(normalized.filter(Boolean));
      } catch (err: any) {
        console.error("Failed to load districts:", err);
        setDistricts([]);
      } finally {
        setDistrictsLoading(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  const handleApply = () => {
    onApply({
      province: selectedProvince || undefined,
      districtId: selectedDistrictId || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedProvince("");
    setSelectedDistrictId("");
  };

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      size="sm"
      onClose={onClose}
      classNames={{
        base: "max-w-[380px]",
      }}
    >
      <ModalContent>
        <ModalHeader className="pb-1.5 pt-4 px-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Filter</h3>
          </div>
        </ModalHeader>
        <ModalBody className="px-5 py-3">
          <div className="space-y-3">
            {/* Province */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-900">
                Province
              </label>
              <Select
                placeholder="Choose a province"
                selectedKeys={selectedProvince ? [selectedProvince] : []}
                variant="bordered"
                radius="lg"
                size="sm"
                classNames={{
                  trigger: "border-gray-300 bg-white shadow-sm h-9",
                  value: "text-xs text-gray-700",
                }}
                isLoading={provincesLoading}
                onSelectionChange={(keys: any) => {
                  const id = Array.from(keys)[0] as string;
                  setSelectedProvince(id);
                }}
              >
                {provinces.map((prov) => (
                  <SelectItem key={String(prov.id)} textValue={String(prov.name)}>
                    {String(prov.name)}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-900">
                District
              </label>
              <Select
                placeholder={
                  selectedProvince ? "Choose a district" : "Select province first"
                }
                selectedKeys={selectedDistrictId ? [selectedDistrictId] : []}
                variant="bordered"
                radius="lg"
                size="sm"
                classNames={{
                  trigger: "border-gray-300 bg-white shadow-sm h-9",
                  value: "text-xs text-gray-700",
                }}
                isDisabled={!selectedProvince}
                isLoading={districtsLoading}
                onSelectionChange={(keys: any) => {
                  const id = Array.from(keys)[0] as string;
                  setSelectedDistrictId(id);
                }}
              >
                {districts.map((district) => (
                  <SelectItem
                    key={String(district.id)}
                    textValue={String(district.name)}
                  >
                    {String(district.name)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="px-5 pb-4 pt-3 gap-2.5">
          <Button
            variant="bordered"
            radius="lg"
            size="sm"
            className="flex-1 h-9 border-gray-300 font-medium text-xs"
            onPress={handleClear}
          >
            Clear
          </Button>
          <Button
            className="flex-1 h-9 bg-black text-white font-medium text-xs hover:bg-gray-800"
            color="default"
            radius="lg"
            size="sm"
            onPress={handleApply}
          >
            Apply
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}