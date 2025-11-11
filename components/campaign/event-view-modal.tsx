"use client";
import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Users, Droplet, Megaphone } from "lucide-react";

interface EventViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: any;
}

const safe = (v: any) => (v === undefined || v === null ? "" : String(v));

export const EventViewModal: React.FC<EventViewModalProps> = ({ isOpen, onClose, request }) => {
  const event = request?.event || request || {};
  // category-specific document (Training/BloodDrive/Advocacy) attached by the backend
  const categoryData = request?.category || {};

  const title = event.Event_Title || event.title || "Untitled";
  const categoryRaw = event.Category || event.categoryType || event.category || "";
  const catKey = String(categoryRaw || "").toLowerCase();
  let category = 'Event';
  if (catKey.includes('blood')) category = 'Blood Drive';
  else if (catKey.includes('training')) category = 'Training';
  else if (catKey.includes('advocacy')) category = 'Advocacy';

  const location = event.Location || event.location || '';
  const startRaw = event.Start_Date || event.start || '';
  const endRaw = event.End_Date || event.end || '';

  const parseDate = (v: any) => {
    try {
      return v ? new Date(v) : null;
    } catch (e) {
      return null;
    }
  };

  const startDateObj = parseDate(startRaw);
  const endDateObj = parseDate(endRaw);

  const formatDate = (d?: Date | null) => {
    if (!d) return "";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  };

  const formatTime = (d?: Date | null) => {
    if (!d) return "";
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
  };

  const dateDisplay = startDateObj ? formatDate(startDateObj) : '';
  const timeDisplay = startDateObj ? `${formatTime(startDateObj)}${endDateObj ? ' - ' + formatTime(endDateObj) : ''}` : '';

  // Common variants for numeric / target fields used by different backends
  // Prefer values from the category document (categoryData) if present, otherwise fallback to event-level fields
  const participants = categoryData?.MaxParticipants || categoryData?.Max_Participants || categoryData?.numberOfParticipants || categoryData?.ExpectedAudienceSize || categoryData?.Expected_Audience_Size || event.MaxParticipants || event.Max_Participants || event.numberOfParticipants || event.expectedAudienceSize || event.ExpectedAudienceSize || event.Expected_Audience_Size || '';
  const goal = categoryData?.Target_Donation || categoryData?.TargetDonation || categoryData?.Target_Donation_Count || categoryData?.TargetDonationCount || event.Target_Donation || event.TargetDonation || event.goalCount || event.TargetDonationCount || '';
  const audience = categoryData?.TargetAudience || categoryData?.audienceType || categoryData?.AudienceType || categoryData?.ExpectedAudience || event.TargetAudience || event.audienceType || event.AudienceType || event.ExpectedAudience || '';

  // Additional category-specific metadata (only those captured by creation modals)
  const trainingType = categoryData?.TrainingType || categoryData?.trainingType || categoryData?.Training_Type || event.TrainingType || event.trainingType || event.Training_Type || '';

  const description = event.Event_Description || event.Description || event.eventDescription || event.description || '';

  const contactEmail = event.Email || event.email || event.ContactEmail || '';
  const contactNumber = event.Phone_Number || event.PhoneNumber || event.contactNumber || '';

  // Coordinator display
  let coordinatorLabel = '';
  if (request?.coordinator && request.coordinator.staff) {
    const s = request.coordinator.staff;
    coordinatorLabel = [s.First_Name, s.Middle_Name, s.Last_Name].filter(Boolean).join(' ');
  } else if (request?.MadeByStakeholderID) {
    coordinatorLabel = safe(request.MadeByStakeholderID);
  }

  // debug output to help trace missing fields (useful during development)
  // eslint-disable-next-line no-console

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-start gap-4 pb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-default-100">
            {category === 'Blood Drive' ? <Droplet className="w-6 h-6 text-default-600" /> : category === 'Advocacy' ? <Megaphone className="w-6 h-6 text-default-600" /> : <Users className="w-6 h-6 text-default-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <div className="mt-1">
              <Chip size="sm" variant="faded" className="px-2 py-0.5">{category}</Chip>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="py-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-default-700">Coordinator</label>
              <Input value={coordinatorLabel} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
            </div>

            <div>
              <label className="text-xs text-default-700">Location</label>
              <Input value={location} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
            </div>

            <div>
              <label className="text-xs text-default-700">Date</label>
              <Input value={dateDisplay} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
            </div>

            <div>
              <label className="text-xs text-default-700">Time</label>
              <Input value={timeDisplay} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
            </div>

            {/* Dynamic fields: show relevant metadata per category */}
            {category === 'Training' && (
              <>
                <div>
                  <label className="text-xs text-default-700">Type of training</label>
                  <Input value={trainingType || ''} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
                </div>
                <div>
                  <label className="text-xs text-default-700">Max participants</label>
                  <Input value={safe(participants)} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
                </div>
              </>
            )}

            {category === 'Blood Drive' && (
              <div>
                <label className="text-xs text-default-700">Target donation</label>
                <Input value={safe(goal)} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
              </div>
            )}

            {category === 'Advocacy' && (
              <>
                <div>
                  <label className="text-xs text-default-700">Target audience</label>
                  <Input value={audience || ''} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
                </div>
                <div>
                  <label className="text-xs text-default-700">Target number</label>
                  <Input value={safe(participants)} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-default-700">Contact Email</label>
              <Input value={contactEmail} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
            </div>

            <div>
              <label className="text-xs text-default-700">Contact Number</label>
              <Input value={contactNumber} disabled variant="bordered" classNames={{ inputWrapper: 'h-10 bg-default-100', input: 'text-sm' }} />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-default-700">Description</label>
              <Textarea value={description} disabled minRows={4} className="mt-1" />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="bordered" onPress={onClose} className="font-medium">Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventViewModal;
