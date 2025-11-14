"use client";
import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Users, Droplet, Megaphone } from "lucide-react";

interface CreateTrainingEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: TrainingEventData) => void;
}

interface TrainingEventData {
  coordinator: string;
  targetAudience: string;
  date: string;
  numberOfParticipants: string;
  eventDescription: string;
  location: string;
  contactInformation: string;
}

/**
 * CreateTrainingEventModal Component
 * Modal for creating a training event
 */
export const CreateTrainingEventModal: React.FC<CreateTrainingEventModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [coordinator, setCoordinator] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [date, setDate] = useState<any>(null);
  const [numberOfParticipants, setNumberOfParticipants] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactInformation, setContactInformation] = useState("");

  const coordinators = [
    { key: "john", label: "John Doe" },
    { key: "jane", label: "Jane Smith" },
    { key: "bob", label: "Bob Johnson" },
  ];

  const handleCreate = () => {
    const eventData: TrainingEventData = {
      coordinator,
      targetAudience,
      date: date?.toString() || "",
      numberOfParticipants,
      eventDescription,
      location,
      contactInformation,
    };
    onConfirm(eventData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
            <Users className="w-5 h-5 text-default-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Create a training event</h2>
            <p className="text-xs text-default-500 font-normal mt-0.5">
              Start providing your information by selecting your blood type. Add details below to proceed.
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-5">
            {/* Coordinator */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Coordinator
                <span className="text-danger ml-1">*</span>
              </label>
              <Select
                placeholder="Select one"
                selectedKeys={coordinator ? [coordinator] : []}
                onSelectionChange={(keys) => setCoordinator(Array.from(keys)[0] as string)}
                variant="bordered"
                classNames={{
                  trigger: "border-default-200 hover:border-default-400 h-10",
                  value: "text-sm",
                }}
              >
                {coordinators.map((coord) => (
                  <SelectItem key={coord.key}>{coord.label}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Target Audience
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="200"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Date
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                granularity="minute"
                hideTimeZone
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                  input: "text-sm",
                }}
              />
            </div>

            {/* Number of Participants */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Number of Participants
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="200"
                value={numberOfParticipants}
                onChange={(e) => setNumberOfParticipants(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Event Description
              </label>
              <Textarea
                placeholder="The event is about..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                variant="bordered"
                minRows={4}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400",
                }}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Location
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Contact Information
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter contact information"
                value={contactInformation}
                onChange={(e) => setContactInformation(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onPress={onClose}
            className="font-medium"
          >
            Cancel
          </Button>
          <Button
            color="default"
            onPress={handleCreate}
            className="bg-black text-white font-medium"
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface CreateBloodDriveEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BloodDriveEventData) => void;
}

interface BloodDriveEventData {
  coordinator: string;
  date: string;
  goalCount: string;
  eventDescription: string;
  location: string;
  contactInformation: string;
}

/**
 * CreateBloodDriveEventModal Component
 * Modal for creating a blood drive event
 */
export const CreateBloodDriveEventModal: React.FC<CreateBloodDriveEventModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [coordinator, setCoordinator] = useState("");
  const [date, setDate] = useState<any>(null);
  const [goalCount, setGoalCount] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactInformation, setContactInformation] = useState("");

  const coordinators = [
    { key: "john", label: "John Doe" },
    { key: "jane", label: "Jane Smith" },
    { key: "bob", label: "Bob Johnson" },
  ];

  const handleCreate = () => {
    const eventData: BloodDriveEventData = {
      coordinator,
      date: date?.toString() || "",
      goalCount,
      eventDescription,
      location,
      contactInformation,
    };
    onConfirm(eventData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
            <Droplet className="w-5 h-5 text-default-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Create a blood drive event</h2>
            <p className="text-xs text-default-500 font-normal mt-0.5">
              Start providing your information by selecting your blood type. Add details below to proceed.
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-5">
            {/* Coordinator */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Coordinator
                <span className="text-danger ml-1">*</span>
              </label>
              <Select
                placeholder="Select one"
                selectedKeys={coordinator ? [coordinator] : []}
                onSelectionChange={(keys) => setCoordinator(Array.from(keys)[0] as string)}
                variant="bordered"
                classNames={{
                  trigger: "border-default-200 hover:border-default-400 h-10",
                  value: "text-sm",
                }}
              >
                {coordinators.map((coord) => (
                  <SelectItem key={coord.key}>{coord.label}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Date
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                granularity="minute"
                hideTimeZone
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                  input: "text-sm",
                }}
              />
            </div>

            {/* Goal Count */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Goal Count
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter location"
                value={goalCount}
                onChange={(e) => setGoalCount(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Event Description
              </label>
              <Textarea
                placeholder="The event is about..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                variant="bordered"
                minRows={4}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400",
                }}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Location
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Contact Information
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter location"
                value={contactInformation}
                onChange={(e) => setContactInformation(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onPress={onClose}
            className="font-medium"
          >
            Cancel
          </Button>
          <Button
            color="default"
            onPress={handleCreate}
            className="bg-black text-white font-medium"
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface CreateAdvocacyEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AdvocacyEventData) => void;
}

interface AdvocacyEventData {
  coordinator: string;
  audienceType: string;
  date: string;
  numberOfParticipants: string;
  eventDescription: string;
  location: string;
  contactInformation: string;
}

/**
 * CreateAdvocacyEventModal Component
 * Modal for creating an advocacy event
 */
export const CreateAdvocacyEventModal: React.FC<CreateAdvocacyEventModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [coordinator, setCoordinator] = useState("");
  const [audienceType, setAudienceType] = useState("");
  const [date, setDate] = useState<any>(null);
  const [numberOfParticipants, setNumberOfParticipants] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactInformation, setContactInformation] = useState("");

  const coordinators = [
    { key: "john", label: "John Doe" },
    { key: "jane", label: "Jane Smith" },
    { key: "bob", label: "Bob Johnson" },
  ];

  const audienceTypes = [
    { key: "students", label: "Students" },
    { key: "professionals", label: "Professionals" },
    { key: "general", label: "General Public" },
  ];

  const handleCreate = () => {
    const eventData: AdvocacyEventData = {
      coordinator,
      audienceType,
      date: date?.toString() || "",
      numberOfParticipants,
      eventDescription,
      location,
      contactInformation,
    };
    onConfirm(eventData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
            <Megaphone className="w-5 h-5 text-default-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Create an advocacy event</h2>
            <p className="text-xs text-default-500 font-normal mt-0.5">
              Start providing your information by selecting your blood type. Add details below to proceed.
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-5">
            {/* Coordinator */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Coordinator
                <span className="text-danger ml-1">*</span>
              </label>
              <Select
                placeholder="Select one"
                selectedKeys={coordinator ? [coordinator] : []}
                onSelectionChange={(keys) => setCoordinator(Array.from(keys)[0] as string)}
                variant="bordered"
                classNames={{
                  trigger: "border-default-200 hover:border-default-400 h-10",
                  value: "text-sm",
                }}
              >
                {coordinators.map((coord) => (
                  <SelectItem key={coord.key}>{coord.label}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Audience Type */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Audience Type
                <span className="text-danger ml-1">*</span>
              </label>
              <Select
                placeholder="Select one"
                selectedKeys={audienceType ? [audienceType] : []}
                onSelectionChange={(keys) => setAudienceType(Array.from(keys)[0] as string)}
                variant="bordered"
                classNames={{
                  trigger: "border-default-200 hover:border-default-400 h-10",
                  value: "text-sm",
                }}
              >
                {audienceTypes.map((type) => (
                  <SelectItem key={type.key}>{type.label}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Date
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                granularity="minute"
                hideTimeZone
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                  input: "text-sm",
                }}
              />
            </div>

            {/* Number of Participants */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Number of Participants
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter a number"
                value={numberOfParticipants}
                onChange={(e) => setNumberOfParticipants(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Event Description
              </label>
              <Textarea
                placeholder="The event is about..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                variant="bordered"
                minRows={4}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400",
                }}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Location
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Contact Information
                <span className="text-danger ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter contact information"
                value={contactInformation}
                onChange={(e) => setContactInformation(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border-default-200 hover:border-default-400 h-10",
                }}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onPress={onClose}
            className="font-medium"
          >
            Cancel
          </Button>
          <Button
            color="default"
            onPress={handleCreate}
            className="bg-black text-white font-medium"
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

/**
 * Demo Component showing all event creation modals
 * Remove this in production - only for demonstration
 */
export default function EventCreationModalsDemo() {
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [bloodDriveOpen, setBloodDriveOpen] = useState(false);
  const [advocacyOpen, setAdvocacyOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold mb-4">Event Creation Modals</h1>
      
      <div className="flex flex-wrap gap-3">
        <Button onPress={() => setTrainingOpen(true)} color="primary">
          Create Training Event
        </Button>
        <Button onPress={() => setBloodDriveOpen(true)} color="danger">
          Create Blood Drive Event
        </Button>
        <Button onPress={() => setAdvocacyOpen(true)} color="success">
          Create Advocacy Event
        </Button>
      </div>

      <CreateTrainingEventModal
        isOpen={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        onConfirm={(data) => {
          console.log("Training Event Created:", data);
        }}
      />

      <CreateBloodDriveEventModal
        isOpen={bloodDriveOpen}
        onClose={() => setBloodDriveOpen(false)}
        onConfirm={(data) => {
          console.log("Blood Drive Event Created:", data);
        }}
      />

      <CreateAdvocacyEventModal
        isOpen={advocacyOpen}
        onClose={() => setAdvocacyOpen(false)}
        onConfirm={(data) => {
          console.log("Advocacy Event Created:", data);
        }}
      />
    </div>
  );
}