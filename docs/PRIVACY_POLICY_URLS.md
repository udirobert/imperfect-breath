# Privacy Policy URLs for Imperfect Breath

This document contains the URLs for the privacy policy and terms of service, required for app store submissions.

## Privacy Policy URLs

### React Component (In-App)
- **URL**: `https://imperfectbreath.netlify.app/privacy`
- **Route**: `/privacy`
- **Component**: `src/pages/PrivacyPolicy.tsx`
- **Description**: Interactive privacy policy page within the app

### Static HTML (App Store Submission)
- **URL**: `https://imperfectbreath.netlify.app/privacy-policy.html`
- **File**: `public/privacy-policy.html`
- **Description**: Standalone HTML page for app store requirements

## Terms of Service URLs

### React Component (In-App)
- **URL**: `https://imperfectbreath.netlify.app/terms`
- **Route**: `/terms`
- **Component**: `src/pages/TermsOfService.tsx`
- **Description**: Interactive terms of service page within the app

## App Store Requirements

### Google Play Store
- Use the static HTML URL: `https://imperfectbreath.netlify.app/privacy-policy.html`
- This URL is required in the Google Play Console under "Store Listing" > "Privacy Policy"

### Apple App Store
- Use the static HTML URL: `https://imperfectbreath.netlify.app/privacy-policy.html`
- This URL is required in App Store Connect under "App Information" > "Privacy Policy URL"

### Other App Stores
- Use the static HTML URL for consistency across all platforms
- The static HTML page works without JavaScript and loads quickly

## Key Features of Our Privacy Policy

✅ **COPPA Compliant**: Designed for users 13+ years old
✅ **GDPR Compliant**: Includes user rights and data protection measures
✅ **Camera/Video Privacy**: Clear explanation that video is processed locally only
✅ **Blockchain Transparency**: Explains Web3 features and wallet connections
✅ **Health Disclaimers**: Appropriate medical disclaimers for wellness apps
✅ **Contact Information**: Clear contact methods for privacy requests

## Implementation Details

### Footer Links
Both privacy policy and terms of service are linked in the app footer:
- Component: `src/components/layout/Footer.tsx`
- Links to both `/privacy` and `/terms` routes

### Mobile Responsive
Both pages are fully responsive and work well on:
- Mobile devices
- Tablets  
- Desktop browsers
- Dark/light mode support

### Accessibility
- Proper heading structure
- High contrast colors
- Screen reader friendly
- Keyboard navigation support

## Maintenance

### Updating the Policy
1. Update `src/pages/PrivacyPolicy.tsx` for the React version
2. Update `public/privacy-policy.html` for the static version
3. The "Last updated" date is automatically generated

### Legal Review
- Review privacy policy annually or when features change
- Update the "Last updated" date when making changes
- Consider legal review for significant updates

## Contact Information

**Privacy Contact**: privacy@imperfectform.fun
**Legal Contact**: legal@imperfectform.fun
**General Support**: support@imperfectform.fun

## Compliance Notes

### Children's Privacy
- App is designed for users 13+
- No knowingly collecting data from children under 13
- Parental guidance recommended for users 13-17

### International Compliance
- GDPR (European Union)
- CCPA (California)
- Other applicable privacy laws worldwide

### Health Data
- No collection of medical information
- Wellness/educational purpose only
- Appropriate medical disclaimers included