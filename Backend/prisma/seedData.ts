// Data loaded by prisma/seed.ts. Edit here, then run `npm run db:seed`.
import type { ServiceType } from "../src/generated/prisma/client.ts";

type ClinicSeed = {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  description: string;
  services: ServiceType[];
  // Opening hours, IST: JS weekday numbers (0 = Sunday) and "HH:MM" times.
  // "00:00"–"24:00" is open 24 hours.
  openDays: number[];
  openTime: string;
  closeTime: string;
  slotMinutes?: number;
  homeVisits?: boolean; // vets also visit owners' homes
};

// `days` uses JS weekday numbers (0 = Sunday). startTime/endTime are the
// vet's shift when it differs from the clinic's hours; an end before the
// start is an overnight shift.
type VetSeed = {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  days: number[];
  startTime?: string;
  endTime?: string;
};

const MON_SAT = [1, 2, 3, 4, 5, 6];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export const CLINICS: ClinicSeed[] = [
  {
    id: "clinic-koramangala",
    name: "PawCare Veterinary Clinic",
    location: "Koramangala, Bengaluru",
    address: "42, 5th Block, 80 Feet Road, Koramangala",
    phone: "+91 98450 11223",
    email: "care@pawcare.in",
    rating: 4.8,
    homeVisits: true,
    openDays: MON_SAT,
    openTime: "09:00",
    closeTime: "19:00",
    description: "A calm, fear-free clinic with in-house diagnostics and a dedicated grooming suite.",
    services: [
      "checkup",
      "vaccination",
      "grooming"
    ]
  },
  {
    id: "clinic-indiranagar",
    name: "Happy Tails Pet Hospital",
    location: "Indiranagar, Bengaluru",
    address: "118, 12th Main Road, HAL 2nd Stage, Indiranagar",
    phone: "+91 98861 44550",
    email: "hello@happytails.in",
    rating: 4.7,
    homeVisits: true,
    openDays: EVERY_DAY,
    openTime: "00:00",
    closeTime: "24:00",
    description: "Open 24/7: full-service pet hospital with surgery, emergency care and overnight vets.",
    services: [
      "checkup",
      "vaccination",
      "emergency"
    ]
  },
  {
    id: "clinic-hsr",
    name: "WhiskerWell Animal Clinic",
    location: "HSR Layout, Bengaluru",
    address: "27th Main, Sector 2, HSR Layout",
    phone: "+91 99000 87612",
    email: "frontdesk@whiskerwell.in",
    rating: 4.6,
    openDays: MON_SAT,
    openTime: "09:00",
    closeTime: "19:00",
    description: "Cat-friendly certified clinic with separate waiting areas for cats and dogs.",
    services: [
      "checkup",
      "vaccination",
      "grooming"
    ]
  },
  {
    id: "clinic-whitefield",
    name: "Furry Friends Vet Centre",
    location: "Whitefield, Bengaluru",
    address: "ITPL Main Road, near Phoenix Marketcity, Whitefield",
    phone: "+91 97411 30987",
    email: "visit@furryfriends.in",
    rating: 4.5,
    homeVisits: true,
    openDays: MON_SAT,
    openTime: "09:00",
    closeTime: "19:00",
    description: "Neighbourhood vet centre for checkups, vaccinations and urgent care, including birds and rabbits.",
    services: [
      "checkup",
      "vaccination",
      "grooming",
      "emergency"
    ]
  }
];

export const VETS: VetSeed[] = [
  {
    id: "vet-ananya",
    clinicId: "clinic-koramangala",
    name: "Dr. Ananya Rao",
    specialty: "General Practice & Preventive Care",
    experience: 9,
    rating: 4.9,
    days: [
      1,
      2,
      3,
      4,
      5,
      6
    ]
  },
  {
    id: "vet-karthik",
    clinicId: "clinic-koramangala",
    name: "Dr. Karthik Menon",
    specialty: "Dermatology & Grooming Health",
    experience: 6,
    rating: 4.7,
    days: [
      1,
      3,
      5,
      6
    ]
  },
  {
    id: "vet-priya",
    clinicId: "clinic-indiranagar",
    name: "Dr. Priya Sharma",
    specialty: "Emergency & Critical Care",
    experience: 12,
    rating: 4.9,
    days: EVERY_DAY,
    startTime: "08:00",
    endTime: "20:00"
  },
  {
    id: "vet-farhan",
    clinicId: "clinic-indiranagar",
    name: "Dr. Farhan Ali",
    specialty: "Night Emergency Care",
    experience: 9,
    rating: 4.8,
    days: EVERY_DAY,
    startTime: "20:00",
    endTime: "08:00"
  },
  {
    id: "vet-arjun",
    clinicId: "clinic-indiranagar",
    name: "Dr. Arjun Iyer",
    specialty: "Surgery & Orthopaedics",
    experience: 10,
    rating: 4.8,
    days: [
      2,
      4,
      6
    ],
    startTime: "10:00",
    endTime: "18:00"
  },
  {
    id: "vet-meera",
    clinicId: "clinic-hsr",
    name: "Dr. Meera Nair",
    specialty: "Feline Medicine",
    experience: 8,
    rating: 4.8,
    days: [
      1,
      2,
      3,
      4,
      5
    ]
  },
  {
    id: "vet-rohan",
    clinicId: "clinic-hsr",
    name: "Dr. Rohan Das",
    specialty: "Vaccination & Puppy Care",
    experience: 5,
    rating: 4.6,
    days: [
      1,
      3,
      4,
      6
    ]
  },
  {
    id: "vet-sneha",
    clinicId: "clinic-whitefield",
    name: "Dr. Sneha Kulkarni",
    specialty: "Exotic Pets — Birds & Rabbits",
    experience: 7,
    rating: 4.7,
    days: [
      1,
      2,
      4,
      5,
      6
    ]
  },
  {
    id: "vet-vikram",
    clinicId: "clinic-whitefield",
    name: "Dr. Vikram Shetty",
    specialty: "General Practice & Urgent Care",
    experience: 11,
    rating: 4.6,
    days: [
      1,
      2,
      3,
      5,
      6
    ]
  }
];

// A ready-to-use account for trying the app.
export const DEMO_USER = {
  name: "Demo Parent",
  mobile: "9876543210",
  email: "demo@pawcliniq.in"
};

export const DEMO_PET = {
  name: "Bruno",
  species: "Dog",
  breed: "Golden Retriever",
  gender: "Male",
  age: 3,
  weight: 28,
  notes: "Allergic to chicken. Gets anxious at the groomer."
};
