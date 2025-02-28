import { z } from 'zod';

// Base Media Schema
export const MediaSchema = z.object({
  id: z.string().optional(),
  alt: z.string(),
  url: z.string(),
});

// Homepage Schema
export const HomepageSchema = z.object({
  id: z.string().optional(),
  heroWelcomeText: z.string().max(100),
  heroCompanyName: z.string().max(100),
  heroText: z.string().max(1000),
  heroButtonText: z.string().max(50),
  heroButtonUrl: z.string().max(200),
  heroImage: MediaSchema,
  aboutUsTitle: z.string().max(100),
  aboutUsSubTitle: z.string().max(200),
  aboutUsText: z.string().max(1000),
  aboutUsButtonText: z.string().max(50),
  aboutUsButtonUrl: z.string().max(200),
  aboutUsImage1: MediaSchema,
  aboutUsImage2: MediaSchema,
  aboutUsImage3: MediaSchema,
  moreAboutUsTitle: z.string().max(100),
  moreAboutUsSubTitle: z.string().max(200),
  moreAboutUsText: z.string().max(1000),
  moreAboutUsButtonText: z.string().max(50),
  moreAboutUsButtonUrl: z.string().max(200),
  moreAboutUsImage: MediaSchema,
  popularTreatmentTitleSmall: z.string().max(100),
  popularTreatmentTitleBig: z.string().max(100),
  popularTreatmentButtonText: z.string().max(50),
  popularTreatmentButtonUrl: z.string().max(200),
  brandSectionTitle: z.string().max(100),
  brandSectionSubTitle: z.string().max(200),
  brandSectionText: z.string().max(1000),
  brandSectionButtonText: z.string().max(50),
  brandSectionImage: MediaSchema,
});

// Brand Schema
export const BrandSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(100),
  logo: MediaSchema,
  companyUrl: z.string().max(200).optional(),
  heading: z.string().max(100).optional(),
  description: z.string().max(1000),
  heading2: z.string().max(100).optional(),
  description2: z.string().max(1000).optional(),
  image: MediaSchema,
  heading_section2: z.string().max(100).optional(),
  description_section2: z.string().max(1000).optional(),
  heading2_section2: z.string().max(100).optional(),
  description2_section2: z.string().max(1000).optional(),
  image_section2: MediaSchema.optional(),
});

// Contact Page Schema
export const ContactPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(100),
  subtitle: z.string().max(200),
  description: z.string().max(1000),
  openingTimesTitle: z.string().max(100),
  mondayText: z.string().max(50),
  mondayTime: z.string().max(50),
  tuesdayText: z.string().max(50),
  tuesdayTime: z.string().max(50),
  wednesdayText: z.string().max(50),
  wednesdayTime: z.string().max(50),
  thursdayText: z.string().max(50),
  thursdayTime: z.string().max(50),
  fridayText: z.string().max(50),
  fridayTime: z.string().max(50),
  saturdayText: z.string().max(50),
  saturdayTime: z.string().max(50),
  sundayText: z.string().max(50),
  sundayTime: z.string().max(50),
  buttonText: z.string().max(50),
  buttonUrl: z.string().max(200),
  contactFormTitle: z.string().max(100),
  contactFormSubTitle: z.string().max(200),
  placeholderName: z.string().max(50),
  placeholderEmail: z.string().max(50),
  placeholderPhone: z.string().max(50),
  placeholderMessage: z.string().max(100),
  buttonFormText: z.string().max(50),
  image: MediaSchema,
});

// Footer Schema
export const FooterSchema = z.object({
  id: z.string().optional(),
  logo: MediaSchema,
  columnName: z.string().max(100),
  columnItems: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().max(100),
      url: z.string().max(200),
    })
  ),
  contactHeading: z.string().max(100),
  addressLine1: z.string().max(100),
  addressLine2: z.string().max(100),
  phone1: z.string().max(20),
  phone2: z.string().max(20),
  extraText: z.string().max(200),
  email: z.string().max(100),
  facebookUrl: z.string().max(200),
  instagramUrl: z.string().max(200),
});

// Navigation Bar Schema
export const NavigationBarSchema = z.object({
  id: z.string().optional(),
  logo: MediaSchema,
  navItems: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().max(50),
      url: z.string().max(200),
    })
  ),
});

// Medical Skin Expert Page Schema
export const MedicalSkinExpertPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(100),
  subtitle: z.string().max(200),
  description: z.string().max(1000),
  buttonText: z.string().max(50).optional(),
  buttonUrl: z.string().max(200).optional(),
  image: MediaSchema,
  titleSection2: z.string().max(100),
  subtitleSection2: z.string().max(200),
  descriptionSection2: z.string().max(1000),
  image1Section2: MediaSchema,
  image2Section2: MediaSchema,
  image3Section2: MediaSchema,
  buttonTextSection2: z.string().max(50).optional(),
  buttonUrlSection2: z.string().max(200).optional(),
  titleSection3: z.string().max(100),
  subtitleSection3: z.string().max(200),
  descriptionSection3: z.string().max(1000),
  imageSection3: MediaSchema,
  buttonTextSection3: z.string().max(50).optional(),
  buttonUrlSection3: z.string().max(200).optional(),
});

// Orthomolecular Therapist Page Schema
export const OrthomolecularTherapistPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(100),
  subtitle: z.string().max(200),
  description: z.string().max(1000),
  buttonText: z.string().max(50).optional(),
  buttonUrl: z.string().max(200).optional(),
  image: MediaSchema,
  titleSection2: z.string().max(100),
  subtitleSection2: z.string().max(200),
  descriptionSection2: z.string().max(1000),
  image1Section2: MediaSchema,
  image2Section2: MediaSchema,
  image3Section2: MediaSchema,
  buttonTextSection2: z.string().max(50).optional(),
  buttonUrlSection2: z.string().max(200).optional(),
  titleSection3: z.string().max(100),
  subtitleSection3: z.string().max(200),
  descriptionSection3: z.string().max(1000),
  imageSection3: MediaSchema,
  buttonTextSection3: z.string().max(50).optional(),
  buttonUrlSection3: z.string().max(200).optional(),
});

// Our Team Page Schema
export const OurTeamPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(100),
  subtitle: z.string().max(200),
  description: z.string().max(1000),
  buttonText: z.string().max(50).optional(),
  buttonUrl: z.string().max(200),
  image: MediaSchema,
  teamTitleSmall: z.string().max(100),
  teamTitleBig: z.string().max(100),
  teamMembers: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().max(100),
      profession: z.string().max(100),
      image: MediaSchema,
    })
  ),
  nextButtonText: z.string().max(50),
  previousButtonText: z.string().max(50),
});

// Treatment Category Schema
export const TreatmentCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().max(100),
});

// Treatment Schema
export const TreatmentSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(100),
  category: z.union([
    z.string(),
    TreatmentCategorySchema,
  ]),
  name: z.string().max(100),
  subtitle: z.string().max(200),
  description: z.string().max(1000),
  isPopular: z.boolean().optional(),
  duration: z.number(),
  price: z.number(),
  image: MediaSchema,
  subtitle2: z.string().max(200).optional(),
  description2: z.string().max(1000),
  image2: MediaSchema,
  image3: MediaSchema.optional(),
  beforeText: z.string().max(200).optional(),
  afterText: z.string().max(200).optional(),
});

// Treatments Page Schema
export const TreatmentsPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(100).optional(),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  buttonText: z.string().max(50).optional(),
  image: MediaSchema,
  popularTreatmentTitleSmall: z.string().max(100),
  popularTreatmentTitleBig: z.string().max(100),
  similarTreatmentsTitleSmall: z.string().max(100),
  similarTreatmentsTitleBig: z.string().max(100),
  allTreatmentsText: z.string().max(100),
  searchText: z.string().max(50),
  bookTreatmentButtonText: z.string().max(50),
  bookTreatmentButtonUrl: z.string().max(200),
});