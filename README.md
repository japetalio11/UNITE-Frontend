# UNITE (Unifying Neighborhoods in Transfusion Ecosystem)

![Project Status](https://img.shields.io/badge/Status-Alpha%20Prototype-orange)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20HeroUI%20%7C%20TypeScript-black)

**UNITE** is a cloud-enabled, responsive blood bank management platform designed to serve as a central hub for donation scheduling, inventory tracking, emergency requisitions, and inter-hospital collaboration in the Bicol region.

## 📘 Project Overview

UNITE modernizes the regional blood supply ecosystem by connecting **Bicol Medical Center**, partner hospitals, coordinators, and donors. The platform improves transparency, coordination, and responsiveness to ensure life-saving blood units are available when needed.

## 🚀 Core Features

- **🧠 Real-Time Blood Inventory:** Live dashboards showing supply by type, volume, expiry, and location.
- **🩺 Donor Portal:** Secure registration, appointment booking, eligibility checks, and donation history.
- **🏥 Hospital Requisition Board:** Inter-hospital blood requests with audit trails and emergency tracking.
- **📢 Automated Alerts:** Notifications for low stock, expiring units, and "Code Red" emergencies.
- **📊 Compliance Reporting:** Auto-generated reports aligned with **DOH** and **LGU** requirements.
- **🔐 Role-Based Access:** Secure dashboards for admins, medical staff, and health officers (Data Privacy Act compliant).
- **📅 Event Management:** Tools to organize and track blood donation drives.

## 🛠️ Tech Stack

This project is built on a modern, scalable web stack:

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Library:** [HeroUI v2](https://heroui.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Tailwind Variants
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Theming:** next-themes

## 📂 Project Structure

```bash
UNITE-Frontend/
├── app/                # Next.js App Router pages and layouts
├── components/         # Reusable UI components
├── config/             # App configuration settings
├── contexts/           # React Context providers (Global state)
├── public/             # Static assets (images, icons)
├── styles/             # Global styles and Tailwind imports
├── types/              # TypeScript type definitions
├── utils/              # Helper functions and utilities
└── deliverables/       # Project documentation and assets
